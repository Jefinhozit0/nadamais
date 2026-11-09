import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next usa .env.local; o CLI do Prisma lê o mesmo arquivo
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrações precisam da conexão direta (5432); o pooler de transação (6543) é só para o app
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
