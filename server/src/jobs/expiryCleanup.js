import { prisma } from '../db.js';

const INTERVAL_MS = 30 * 1000;

async function cleanupExpiredHolds() {
  const now = new Date();

  try {
    const expired = await prisma.order.findMany({
      where: {
        status: 'pending',
        holdExpiresAt: { lt: now },
      },
    });

    if (!expired.length) return;

    console.log(`Cleaning up ${expired.length} expired holds`);

    await prisma.$transaction(async (tx) => {
      for (const order of expired) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'expired' },
        });

        await tx.inventoryEvent.create({
          data: {
            productId: order.productId,
            type: 'hold_released',
            delta: order.quantity,
            metadata: { orderId: order.id, reason: 'background_cleanup' },
            orderId: order.id,
          },
        });
      }
    });
  } catch (e) {
    console.error('Error during cleanupExpiredHolds:', e);
  }
}

setInterval(cleanupExpiredHolds, INTERVAL_MS);
