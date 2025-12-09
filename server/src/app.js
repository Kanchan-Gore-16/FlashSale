import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './db.js';

import productsRouter from './routes/products.js';
import holdsRouter from './routes/holds.js';
import ordersRouter from './routes/orders.js';
import adminRouter from './routes/admin.js';
import './jobs/expiryCleanup.js'; 

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

app.use('/api/products', productsRouter);
app.use('/api/holds', holdsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
