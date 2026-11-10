-- E-mails transacionais dos pedidos (pedido recebido, pago, enviado com rastreio, entregue, cancelado).
CREATE TYPE "EmailKind" AS ENUM ('pedido_recebido', 'pagamento_aprovado', 'pedido_enviado', 'pedido_entregue', 'pedido_cancelado');
CREATE TYPE "EmailStatus" AS ENUM ('pendente', 'enviado', 'falhou', 'desativado');

CREATE TABLE "OrderEmail" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "kind" "EmailKind" NOT NULL,
    "to" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "dedupeKey" TEXT,
    "providerId" TEXT,
    "error" TEXT,
    "sentBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEmail_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderEmail_dedupeKey_key" ON "OrderEmail"("dedupeKey");
CREATE INDEX "OrderEmail_orderId_createdAt_idx" ON "OrderEmail"("orderId", "createdAt");

ALTER TABLE "OrderEmail" ADD CONSTRAINT "OrderEmail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mesma regra das outras tabelas: RLS ligada e nenhuma política (a API pública do Supabase não acessa).
ALTER TABLE "OrderEmail" ENABLE ROW LEVEL SECURITY;
