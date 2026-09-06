-- AlterTable: metadados de origem e versão do questionário
ALTER TABLE "pesquisas_socioeconomicas" ADD COLUMN "origem" "OrigemColeta";
ALTER TABLE "pesquisas_socioeconomicas" ADD COLUMN "versaoQuestionario" INTEGER NOT NULL DEFAULT 1;

-- Backfill: origem a partir do momento; registros existentes ficam na v1
UPDATE "pesquisas_socioeconomicas" AS p
SET
  "origem" = m."origemPadrao",
  "versaoQuestionario" = 1
FROM "momentos_coleta" AS m
WHERE p."momentoColetaId" = m."id";

ALTER TABLE "pesquisas_socioeconomicas" ALTER COLUMN "origem" SET NOT NULL;

CREATE INDEX "pesquisas_socioeconomicas_origem_versaoQuestionario_idx"
  ON "pesquisas_socioeconomicas"("origem", "versaoQuestionario");
