import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.inventoryEvent.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  await prisma.product.createMany({
    data: [
      {
        name: 'Flash Phone',
        description: 'Limited stock smartphone',
        price: 199900,
        totalStock: 100,
        saleStartsAt: oneHourAgo,
        saleEndsAt: oneHourLater,
      },
      {
        name: 'Gaming Mouse',
        description: 'Pro-level gaming mouse',
        price: 4999,
        totalStock: 50,
        saleStartsAt: oneHourAgo,
        saleEndsAt: oneHourLater,
      },
      {
        name: 'Wireless Earbuds',
        description: 'Noise-cancelling earbuds',
        price: 7999,
        totalStock: 200,
        saleStartsAt: oneHourAgo,
        saleEndsAt: oneHourLater,
      },
      {
        name: 'Old Laptop',
        description: 'Outside sale window',
        price: 59999,
        totalStock: 10,
        saleStartsAt: new Date(now.getTime() + 5 * 60 * 60 * 1000),
        saleEndsAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('Seed data inserted');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
