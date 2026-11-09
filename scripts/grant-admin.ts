/**
 * Promove (ou rebaixa) um usuário a administrador.
 *   pnpm admin:grant voce@email.com
 *   pnpm admin:grant voce@email.com --revoke
 * O usuário precisa ter entrado na loja pelo menos uma vez (o perfil é criado no primeiro acesso).
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const email = process.argv[2]?.trim().toLowerCase();
const revoke = process.argv.includes("--revoke");
if (!email || !email.includes("@")) {
  console.error("Uso: pnpm admin:grant <email> [--revoke]");
  process.exit(1);
}

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Defina DIRECT_URL no .env.local.");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const profile = await db.profile.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!profile) {
    console.error(`Nenhum perfil com ${email}. Crie a conta e entre na loja uma vez antes.`);
    process.exit(1);
  }
  await db.profile.update({ where: { id: profile.id }, data: { role: revoke ? "customer" : "admin" } });
  console.log(revoke ? `✓ ${email} não é mais admin.` : `✓ ${email} agora é admin. Acesse /admin.`);
}

main().finally(() => db.$disconnect());
