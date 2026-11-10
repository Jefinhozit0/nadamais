-- A loja passa a revender marcas de terceiros: cada produto ganha a marca.
-- Os produtos existentes (catálogo de demonstração) ficam com a marca "nada mais".
ALTER TABLE "Product" ADD COLUMN "brand" TEXT NOT NULL DEFAULT 'nada mais';
ALTER TABLE "Product" ALTER COLUMN "brand" DROP DEFAULT;

-- A antiga "linha" deixa de ser obrigatória (mantida só para não perder dados).
ALTER TABLE "Product" ALTER COLUMN "line" DROP NOT NULL;

DROP INDEX IF EXISTS "Product_active_line_idx";
CREATE INDEX "Product_active_brand_idx" ON "Product"("active", "brand");
