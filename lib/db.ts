import { PrismaClient } from '@prisma/client';

// Usa singleton em globalThis para evitar múltiplas conexões em dev/hot-reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;