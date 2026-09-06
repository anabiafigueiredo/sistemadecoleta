-- CreateEnum
CREATE TYPE "EquipamentoEstudo" AS ENUM ('COMPUTADOR', 'TABLET', 'CELULAR', 'NENHUM');

-- CreateEnum
CREATE TYPE "DisponibilidadeEquipamento" AS ENUM (
  'EXCLUSIVO',
  'COMPARTILHADO_DISPONIVEL',
  'COMPARTILHADO_LIMITADO',
  'N_A'
);

-- CreateEnum
CREATE TYPE "LocalEstudo" AS ENUM ('SIM', 'PARCIALMENTE', 'NAO');

-- CreateEnum
CREATE TYPE "AcompanhamentoFamiliar" AS ENUM (
  'SEMPRE',
  'FREQUENTEMENTE',
  'AS_VEZES',
  'RARAMENTE',
  'NUNCA'
);

-- CreateEnum
CREATE TYPE "ApoioPrioritario" AS ENUM (
  'REFORCO',
  'INCLUSAO_DIGITAL',
  'AEE',
  'ESPORTES_CULTURA',
  'ORIENTACAO',
  'APOIO_SOCIAL',
  'NENHUM',
  'OUTRO'
);

-- AlterTable
ALTER TABLE "pesquisas_socioeconomicas" ADD COLUMN "equipamentoEstudo" "EquipamentoEstudo";
ALTER TABLE "pesquisas_socioeconomicas" ADD COLUMN "disponibilidadeEquipamento" "DisponibilidadeEquipamento";
ALTER TABLE "pesquisas_socioeconomicas" ADD COLUMN "localEstudo" "LocalEstudo";
ALTER TABLE "pesquisas_socioeconomicas" ADD COLUMN "acompanhamentoFamiliar" "AcompanhamentoFamiliar";
ALTER TABLE "pesquisas_socioeconomicas" ADD COLUMN "apoioPrioritario" "ApoioPrioritario";
