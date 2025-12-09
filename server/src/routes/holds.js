import { Router } from 'express';
import { prisma } from '../db.js';
import { redis, withLock } from '../redis.js';

const router = Router();

// POST /api/holds
// body: { productId, email, qty }
router.post('/', async (req, res) => {
  const { productId, email, qty } = req.body || {};
  const quantity = Number(qty);

  if (!productId || !email || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'productId, email, qty are required' });
  }

  // Detect client IP
  const clientIp =
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.ip ||
    'unknown';

  try {
    // ---------------- Anti-bot throttling (Bonus) ----------------
    const windowSeconds = 10 * 60; // 10 minutes
    const maxHolds = 2;

    const emailKey = `throttle:email:${email}`;
    const ipKey = `throttle:ip:${clientIp}`;

    // Increment counters for this window
    const [emailCount, ipCount] = await Promise.all([
      redis.incr(emailKey),
      redis.incr(ipKey),
    ]);

    // Set TTL when first created
    if (emailCount === 1) {
      await redis.expire(emailKey, windowSeconds);
    }
    if (ipCount === 1) {
      await redis.expire(ipKey, windowSeconds);
    }

    // If either exceeds maxHolds -> block
    if (emailCount > maxHolds || ipCount > maxHolds) {
      await redis.incr('metrics:throttle_blocked'); // optional metric

      return res.status(429).json({
        error:
          'Too many holds created from this email/IP. Please try again after a few minutes.',
      });
    }
    // ---------------- End anti-bot throttling ----------------

    const now = new Date();
    const holdMinutes = 2;
    const holdExpiresAt = new Date(now.getTime() + holdMinutes * 60 * 1000);

    const result = await withLock(`product:${productId}`, async () => {
      // 1. Load product
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return { error: 'Product not found', status: 404 };

      // 2. Check sale window
      if (product.saleStartsAt > now || product.saleEndsAt < now) {
        return { error: 'Sale not active', status: 400 };
      }

      // 3. Compute live stock
      const grouped = await prisma.inventoryEvent.groupBy({
        by: ['productId'],
        where: { productId },
        _sum: { delta: true },
      });
      const delta = grouped[0]?._sum.delta || 0;
      const liveStock = product.totalStock + delta;

      if (liveStock < quantity) {
        // optional metric for oversell block
        await redis.incr('metrics:oversell_attempts_blocked');

        return { error: 'Insufficient stock', status: 400 };
      }

      // 4. Create order + inventory event in a transaction
      const created = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            productId,
            customerEmail: email,
            quantity,
            status: 'pending',
            holdExpiresAt,
          },
        });

        await tx.inventoryEvent.create({
          data: {
            productId,
            type: 'hold_created',
            delta: -quantity,
            metadata: { orderId: order.id },
            orderId: order.id,
          },
        });

        return order;
      });

      return { order: created };
    });

    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    return res.status(201).json({
      orderId: result.order.id,
      holdExpiresAt: result.order.holdExpiresAt,
    });
  } catch (e) {
    if (e.code === 'LOCK_NOT_ACQUIRED') {
      return res.status(429).json({ error: 'Too many concurrent requests, please retry' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to create hold' });
  }
});



export default router;
