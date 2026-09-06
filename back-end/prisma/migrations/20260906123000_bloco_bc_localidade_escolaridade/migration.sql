-- CreateEnum
CREATE TYPE "TipoLocalidade" AS ENUM ('URBANA', 'RURAL', 'COMUNIDADE_RIBEIRINHA', 'OUTRA');

-- CreateEnum
CREATE TYPE "EscolaridadeResponsavel" AS ENUM (
  'SEM_ESCOLARIDADE',
  'FUNDAMENTAL_INCOMPLETO',
  'FUNDAMENTAL_COMPLETO',
  'MEDIO_INCOMPLETO',
  'MEDIO_COMPLETO',
  'SUPERIOR_INCOMPLETO',
  'SUPERIOR_COMPLETO',
  'POS_GRADUACAO'
);

-- CreateEnum
CREATE TYPE "SituacaoOcupacional" AS ENUM (
  'EMPREGADO',
  'DESEMPREGADO',
  'AUTONOMO_INFORMAL',
  'APOSENTADO',
  'ESTUDANTE',
  'DO_LAR',
  'OUTRO'
);

-- AlterTable
ALTER TABLE "familias" ADD COLUMN "tipoLocalidade" "TipoLocalidade";

-- AlterTable
ALTER TABLE "responsaveis" ADD COLUMN "escolaridade" "EscolaridadeResponsavel";
ALTER TABLE "responsaveis" ADD COLUMN "situacaoOcupacional" "SituacaoOcupacional";
