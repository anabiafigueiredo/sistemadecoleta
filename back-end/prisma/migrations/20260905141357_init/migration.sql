-- CreateTable
CREATE TABLE "familias" (
    "id" TEXT NOT NULL,
    "codigoFamilia" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "comunidade" TEXT NOT NULL,
    "qtdMoradores" INTEGER NOT NULL,
    "rendaFamiliarMensal" DECIMAL(10,2) NOT NULL,
    "recebeBeneficioSocial" BOOLEAN NOT NULL,
    "beneficioSocial" TEXT,
    "possuiInternetCasa" BOOLEAN NOT NULL,
    "tipoAcessoInternet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "familias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" TEXT NOT NULL,
    "codigoAluno" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3),
    "sexo" CHAR(1),
    "cpf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsaveis" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "email" TEXT,

    CONSTRAINT "responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pesquisas_socioeconomicas" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "meioTransporteEscola" TEXT NOT NULL,
    "tempoDeslocamentoMin" INTEGER NOT NULL,
    "frequenciaEscolarPct" DECIMAL(5,2) NOT NULL,
    "anoSerie" TEXT NOT NULL,
    "turno" TEXT NOT NULL,
    "necessidadeEducacionalEspecial" BOOLEAN NOT NULL,
    "descricaoNecessidade" TEXT,
    "observacao" TEXT,
    "sincronizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pesquisas_socioeconomicas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "familias_codigoFamilia_key" ON "familias"("codigoFamilia");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_codigoAluno_key" ON "alunos"("codigoAluno");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_cpf_key" ON "alunos"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "responsaveis_alunoId_key" ON "responsaveis"("alunoId");

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesquisas_socioeconomicas" ADD CONSTRAINT "pesquisas_socioeconomicas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
