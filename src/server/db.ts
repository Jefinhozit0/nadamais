import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente Prisma único por processo (no dev, sobrevive ao hot reload).
 * Usa DATABASE_URL — no Supabase, o pooler de transação (porta 6543).
 * É criado na primeira consulta: importar este módulo sem banco configurado não quebra o build.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function client(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada. Veja .env.example e o README (Banco de dados).");
  }
  const instance = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  globalForPrisma.prisma = instance;
  return instance;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const instance = client();
    const value = Reflect.get(instance, property, instance) as unknown;
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});
