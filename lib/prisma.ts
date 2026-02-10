import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL!,
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
