/**
 * Seed do catálogo: `pnpm db:seed`.
 * Idempotente — atualiza produtos existentes pelo slug e recria imagens/tamanhos.
 * Fonte: src/data/products.ts (catálogo de demonstração).
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { products } from "../src/data/products";

config({ path: ".env.local" });
config();

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Defina DIRECT_URL (ou DATABASE_URL) no .env.local antes de rodar o seed.");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  for (const p of products) {
    const data = {
      name: p.name,
      shortName: p.shortName,
      brand: p.brand,
      category: p.category,
      type: p.type,
      colorway: p.colorway,
      colors: [...p.colors],
      sku: p.sku,
      description: p.description,
      details: [...p.details],
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      sizeSystem: p.sizeSystem === "one-size" ? ("one_size" as const) : p.sizeSystem,
      releasedAt: new Date(`${p.releasedAt}T00:00:00Z`),
      popularity: p.popularity,
      badge: p.badge ?? null,
      active: true,
    };

    const product = await db.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data },
      update: data,
    });

    await db.$transaction([
      db.productImage.deleteMany({ where: { productId: product.id } }),
      db.productImage.createMany({
        data: p.images.map((img, position) => ({
          productId: product.id,
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height,
          kind: img.kind,
          credit: img.credit ?? null,
          position,
        })),
      }),
    ]);

    // tamanhos: upsert (não zera estoque de tamanhos já vendidos ao rodar de novo)
    for (const [position, size] of p.sizes.entries()) {
      await db.productSize.upsert({
        where: { productId_label: { productId: product.id, label: size.label } },
        create: { productId: product.id, label: size.label, stock: size.stock, position },
        update: { position },
      });
    }
  }
  console.log(`✓ ${products.length} produtos no banco.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
