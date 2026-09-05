-- CreateEnum
CREATE TYPE "OrigemColeta" AS ENUM ('PLANILHA', 'MOBILE');

-- CreateTable
CREATE TABLE "momentos_coleta" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "origemPadrao" "OrigemColeta" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "momentos_coleta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "momentos_coleta_codigo_key" ON "momentos_coleta"("codigo");

-- Momentos iniciais do monitoramento (simulação de ciclos)
INSERT INTO "momentos_coleta" ("id", "codigo", "titulo", "descricao", "dataReferencia", "origemPadrao", "createdAt", "updatedAt")
VALUES
  (
    '00000000-0000-4000-8000-000000000001',
    'T1',
    'Coleta T1 — carga inicial (planilha)',
    'Primeiro ciclo de monitoramento: importação e sanitização da planilha socioeconômica.',
    '2026-01-15 12:00:00',
    'PLANILHA',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'T2',
    'Coleta T2 — campo (app mobile)',
    'Segundo ciclo: sincronização das coletas realizadas no aplicativo mobile.',
    '2026-06-15 12:00:00',
    'MOBILE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'T3',
    'Coleta T3 — reavaliação',
    'Terceiro ciclo: reavaliação periódica das condições educacionais e socioeconômicas.',
    '2026-11-15 12:00:00',
    'MOBILE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

-- Add nullable column, backfill T1, then enforce NOT NULL + FK
ALTER TABLE "pesquisas_socioeconomicas" ADD COLUMN "momentoColetaId" TEXT;

UPDATE "pesquisas_socioeconomicas"
SET "momentoColetaId" = '00000000-0000-4000-8000-000000000001'
WHERE "momentoColetaId" IS NULL;

ALTER TABLE "pesquisas_socioeconomicas" ALTER COLUMN "momentoColetaId" SET NOT NULL;

CREATE INDEX "pesquisas_socioeconomicas_momentoColetaId_idx" ON "pesquisas_socioeconomicas"("momentoColetaId");

ALTER TABLE "pesquisas_socioeconomicas"
  ADD CONSTRAINT "pesquisas_socioeconomicas_momentoColetaId_fkey"
  FOREIGN KEY ("momentoColetaId") REFERENCES "momentos_coleta"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
