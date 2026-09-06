-- CreateTable
CREATE TABLE "barreiras" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barreiras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pesquisa_barreiras" (
    "pesquisaId" TEXT NOT NULL,
    "barreiraId" TEXT NOT NULL,

    CONSTRAINT "pesquisa_barreiras_pkey" PRIMARY KEY ("pesquisaId","barreiraId")
);

-- CreateIndex
CREATE UNIQUE INDEX "barreiras_codigo_key" ON "barreiras"("codigo");

-- AddForeignKey
ALTER TABLE "pesquisa_barreiras" ADD CONSTRAINT "pesquisa_barreiras_pesquisaId_fkey" FOREIGN KEY ("pesquisaId") REFERENCES "pesquisas_socioeconomicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesquisa_barreiras" ADD CONSTRAINT "pesquisa_barreiras_barreiraId_fkey" FOREIGN KEY ("barreiraId") REFERENCES "barreiras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
