-- Pagamento em cripto via Paymento (aditivo: não altera pedidos existentes)
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'crypto';
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'paymento';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentUrl" TEXT;
