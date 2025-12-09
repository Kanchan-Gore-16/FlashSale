import { Router } from 'express';
import { prisma } from '../db.js';
import { withLock } from '../redis.js';

const router = Router();

// POST /api/orders/:id/confirm
router.post('/:id/confirm', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const now = new Date();

    const result = await withLock(`order:${id}`, async () => {
      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) return { status: 404, error: 'Order not found' };

      if (order.status !== 'pending') {
        return { status: 400, error: 'Order not pending' };
      }

      if (order.holdExpiresAt && order.holdExpiresAt < now) {
        // Mark expired and release stock
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id },
            data: { status: 'expired' },
          });
          await tx.inventoryEvent.create({
            data: {
              productId: order.productId,
              type: 'hold_released',
              delta: order.quantity,
              metadata: { orderId: order.id, reason: 'confirm_after_expiry' },
              orderId: order.id,
            },
          });
        });

        return { status: 400, error: 'Hold expired, order marked expired' };
      }

      // Confirm
      const updated = await prisma.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id },
          data: { status: 'confirmed' },
        });

        await tx.inventoryEvent.create({
          data: {
            productId: o.productId,
            type: 'order_confirmed',
            delta: 0,
            metadata: { orderId: o.id },
            orderId: o.id,
          },
        });

        return o;
      });

      return { order: updated };
    });

    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    res.json({ success: true, order: result.order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      id: order.id,
      productId: order.productId,
      productName: order.product.name,
      description: order.product.description,
      price: order.product.price,
      quantity: order.quantity,
      status: order.status,
      holdExpiresAt: order.holdExpiresAt,
      createdAt: order.createdAt,
      customerEmail: order.customerEmail,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get order' });
  }
});


// GET /api/orders?email=...
router.get('/', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query param is required' });

  try {
    const orders = await prisma.order.findMany({
      where: { customerEmail: String(email) },
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });

    res.json(
      orders.map(o => ({
        id: o.id,
        productId: o.productId,
        productName: o.product.name,
        quantity: o.quantity,
        status: o.status,
        holdExpiresAt: o.holdExpiresAt,
        createdAt: o.createdAt,
      })),
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

export default router;
