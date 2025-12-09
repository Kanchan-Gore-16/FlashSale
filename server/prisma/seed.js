import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.inventoryEvent.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  console.log('Old data cleared');

  const now = new Date();

  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  await prisma.product.createMany({
    data: [
      {
        name: 'Flash Phone X',
        description: 'Limited edition flagship smartphone',
        price: 199990,
        totalStock: 50,
        saleStartsAt: oneHourAgo,
        saleEndsAt: oneHourLater,
      },
      {
        name: 'Pro Gaming Mouse',
        description: 'RGB wireless gaming mouse',
        price: 4999,
        totalStock: 100,
        saleStartsAt: oneHourAgo,
        saleEndsAt: oneHourLater,
      },
      {
        name: 'Noise Cancelling Headphones',
        description: 'High-fidelity wireless headphones',
        price: 8999,
        totalStock: 75,
        saleStartsAt: oneHourAgo,
        saleEndsAt: oneHourLater,
      },
      {
        name: 'Old Model Laptop',
        description: 'Clearance sale laptop (not live)',
        price: 59999,
        totalStock: 20,
        saleStartsAt: threeHoursLater,
        saleEndsAt: fourHoursLater,
      },
    ],
  });

  console.log('Database seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
