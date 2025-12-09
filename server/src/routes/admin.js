import { Router } from 'express';
import { prisma } from '../db.js';
import { redis } from '../redis.js';

const router = Router();

// GET /api/admin/metrics
router.get('/metrics', async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Overall aggregates (DB)
    const [holdsCreated, holdsExpired, confirmedOrders, products] =
      await Promise.all([
        prisma.inventoryEvent.count({ where: { type: 'hold_created' } }),
        prisma.order.count({ where: { status: 'expired' } }),
        prisma.order.count({ where: { status: 'confirmed' } }),
        prisma.product.findMany(),
      ]);

    // Oversell + throttle attempts from Redis (optional)
    const [oversellAttemptsBlockedRaw, throttleBlockedRaw] = await Promise.all([
      redis.get('metrics:oversell_attempts_blocked'),
      redis.get('metrics:throttle_blocked'),
    ]);

    const oversellAttemptsBlocked = Number(oversellAttemptsBlockedRaw || 0);
    const throttleBlocked = Number(throttleBlockedRaw || 0);

    // Stock remaining per product
    const productIds = products.map((p) => p.id);
    let stockPerProduct = [];
    let ordersStats = [];

    if (productIds.length > 0) {
      const groupedInventory = await prisma.inventoryEvent.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _sum: { delta: true },
      });

      const deltaMap = new Map();
      groupedInventory.forEach((g) =>
        deltaMap.set(g.productId, g._sum.delta || 0)
      );

      // Per-product pending/confirmed/expired counts
      const groupedOrders = await prisma.order.groupBy({
        by: ['productId', 'status'],
        where: { productId: { in: productIds } },
        _count: { _all: true },
      });

      const statsMap = new Map();
      for (const g of groupedOrders) {
        const key = g.productId;
        const prev = statsMap.get(key) || {
          pending: 0,
          confirmed: 0,
          expired: 0,
        };
        if (g.status === 'pending') prev.pending += g._count._all;
        if (g.status === 'confirmed') prev.confirmed += g._count._all;
        if (g.status === 'expired') prev.expired += g._count._all;
        statsMap.set(key, prev);
      }

      stockPerProduct = products.map((p) => {
        const delta = deltaMap.get(p.id) || 0;
        const liveStock = p.totalStock + delta;
        const stats = statsMap.get(p.id) || {
          pending: 0,
          confirmed: 0,
          expired: 0,
        };

        let saleStatus = 'UPCOMING';
        if (p.saleStartsAt <= now && p.saleEndsAt >= now) {
          saleStatus = 'LIVE';
        } else if (p.saleEndsAt < now) {
          saleStatus = 'EXPIRED';
        }

        return {
          productId: p.id,
          name: p.name,
          totalStock: p.totalStock,
          liveStock,
          pending: stats.pending,
          confirmed: stats.confirmed,
          expired: stats.expired,
          saleStatus,
        };
      });

      ordersStats = groupedOrders;
    }

    // Chart data: sold vs expired over last hour (based on quantity)
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: oneHourAgo },
        status: { in: ['confirmed', 'expired'] },
      },
      select: {
        createdAt: true,
        status: true,
        quantity: true,
      },
    });

    const bucketMs = 5 * 60 * 1000; // 5 minute buckets
    const bucketsMap = new Map();

    for (const o of recentOrders) {
      const t = o.createdAt.getTime();
      const bucketStart = Math.floor(t / bucketMs) * bucketMs;
      const key = new Date(bucketStart).toISOString(); // key

      const prev = bucketsMap.get(key) || { bucket: key, sold: 0, expired: 0 };
      if (o.status === 'confirmed') {
        prev.sold += o.quantity;
      } else if (o.status === 'expired') {
        prev.expired += o.quantity;
      }
      bucketsMap.set(key, prev);
    }

    const chart = Array.from(bucketsMap.values()).sort(
      (a, b) => new Date(a.bucket) - new Date(b.bucket)
    );

    res.json({
      totalHoldsCreated: holdsCreated,
      holdsExpired,
      confirmedOrders,
      oversellAttemptsBlocked,
      throttleBlocked,
      stockPerProduct,
      chart,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to compute admin metrics' });
  }
});

export default router;
