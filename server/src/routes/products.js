import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/products/live
router.get('/live', async (req, res) => {
  try {
    const now = new Date();

    const products = await prisma.product.findMany({
      where: {
        saleStartsAt: { lte: now },
        saleEndsAt: { gte: now },
      },
      orderBy: { id: 'asc' },
    });

    if (products.length === 0) return res.json([]);

    const ids = products.map(p => p.id);

    const grouped = await prisma.inventoryEvent.groupBy({
      by: ['productId'],
      where: { productId: { in: ids } },
      _sum: { delta: true },
    });

    const deltaMap = new Map();
    grouped.forEach(g => {
      deltaMap.set(g.productId, g._sum.delta || 0);
    });

    const result = products.map(p => {
      const delta = deltaMap.get(p.id) || 0;
      const liveStock = p.totalStock + delta; 
      const sold = p.totalStock - liveStock;
      const soldPercent = p.totalStock > 0
        ? Math.round((sold / p.totalStock) * 100)
        : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        totalStock: p.totalStock,
        liveStock,
        soldPercent,
        saleStartsAt: p.saleStartsAt,
        saleEndsAt: p.saleEndsAt,
      };
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list live products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Not found' });

    const grouped = await prisma.inventoryEvent.groupBy({
      by: ['productId'],
      where: { productId: id },
      _sum: { delta: true },
    });

    const delta = grouped[0]?._sum.delta || 0;
    const liveStock = product.totalStock + delta;
    const sold = product.totalStock - liveStock;
    const soldPercent = product.totalStock > 0
      ? Math.round((sold / product.totalStock) * 100)
      : 0;

    res.json({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      totalStock: product.totalStock,
      liveStock,
      soldPercent,
      saleStartsAt: product.saleStartsAt,
      saleEndsAt: product.saleEndsAt,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

export default router;
