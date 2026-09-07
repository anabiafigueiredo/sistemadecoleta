-- AlterTable: allow CSV multi-values for equipamentos and apoios
ALTER TABLE "pesquisas_socioeconomicas" ALTER COLUMN "equipamentoEstudo" TYPE TEXT USING "equipamentoEstudo"::text;
ALTER TABLE "pesquisas_socioeconomicas" ALTER COLUMN "apoioPrioritario" TYPE TEXT USING "apoioPrioritario"::text;
