-- Avaliações de produto (só de quem recebeu o pedido).
CREATE TYPE "ReviewFit" AS ENUM ('pequeno', 'certo', 'grande');

CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "profileId" UUID NOT NULL,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "fit" "ReviewFit",
    "size" TEXT,
    "authorName" TEXT NOT NULL,
    "city" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Review_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX "Review_profileId_productId_key" ON "Review"("profileId", "productId");
CREATE INDEX "Review_productId_hidden_createdAt_idx" ON "Review"("productId", "hidden", "createdAt");
CREATE INDEX "Review_hidden_rating_createdAt_idx" ON "Review"("hidden", "rating", "createdAt");

ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Mesma regra das outras tabelas: RLS ligada e nenhuma política (a API pública do Supabase não acessa).
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
