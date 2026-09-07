-- Códigos de escolaridade/acompanhamento passam a ser texto (novos códigos canônicos).
ALTER TABLE "responsaveis" ALTER COLUMN "escolaridade" TYPE TEXT USING "escolaridade"::text;
ALTER TABLE "pesquisas_socioeconomicas" ALTER COLUMN "acompanhamentoFamiliar" TYPE TEXT USING "acompanhamentoFamiliar"::text;
