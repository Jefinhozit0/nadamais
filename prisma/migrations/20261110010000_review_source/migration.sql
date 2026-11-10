-- Depoimentos recebidos por mensagem, cadastrados pelo admin (sem conta de cliente).
CREATE TYPE "ReviewSource" AS ENUM ('site', 'mensagem');

ALTER TABLE "Review" ADD COLUMN "source" "ReviewSource" NOT NULL DEFAULT 'site';
ALTER TABLE "Review" ADD COLUMN "consentNote" TEXT;
ALTER TABLE "Review" ADD COLUMN "importedBy" TEXT;
ALTER TABLE "Review" ALTER COLUMN "profileId" DROP NOT NULL;

-- avaliação pelo site sempre tem cliente; depoimento por mensagem sempre tem registro da autorização
ALTER TABLE "Review" ADD CONSTRAINT "Review_source_check" CHECK (
  ("source" = 'site' AND "profileId" IS NOT NULL) OR
  ("source" = 'mensagem' AND "consentNote" IS NOT NULL)
);
