import { prisma as client } from "@ventry/db";

const globalForPrisma = global as unknown as { prisma: typeof client };

export const prisma = globalForPrisma.prisma || client;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
