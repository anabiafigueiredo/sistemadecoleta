# Front-end — Next.js Dashboard & API REST

## Pré-requisitos

1. PostgreSQL rodando (`back-end`) **ou** stack completa na raiz (`docker compose up --build`).

```bash
# Opção A — projeto inteiro (recomendado para demo)
cd ..   # raiz do monorepo
docker compose up --build -d

# Opção B — só banco + npm local
cd back-end
docker compose up -d
npx prisma migrate dev
npx prisma db seed
```

2. Variável `DATABASE_URL` em `front-end/.env` (já configurada para o banco local).

3. **Prisma alinhado:** ambos usam `@prisma/client` / `prisma` **6.19.3**.  
   Schema canônico: `back-end/prisma/schema.prisma`.  
   No front, `prisma/schema.prisma` é um **symlink** para esse arquivo (evita drift e gera o client no `node_modules` do front).

## Rodar a aplicação

```bash
cd front-end
npm install          # postinstall: prisma generate
npm run db:generate  # regenerar client após mudar o schema
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) — redireciona para `/dashboard`.

> Migrations e seed ficam **só no back-end**. No front: apenas `prisma generate`.

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/dashboard/stats` | KPIs + séries dos gráficos |
| `GET` | `/api/alunos?q=` | Lista de alunos (busca opcional) |
| `POST` | `/api/coleta` | Recebe coleta do app mobile (Zod + Prisma) |

### Exemplo `POST /api/coleta`

```bash
curl -X POST http://localhost:3000/api/coleta \
  -H "Content-Type: application/json" \
  -d '{
    "familia": {
      "codigoFamilia": "FAM-025",
      "endereco": "Rua Exemplo, 10",
      "bairro": "Centro",
      "comunidade": "Boa União",
      "qtdMoradores": 4,
      "rendaFamiliarMensal": 1800,
      "recebeBeneficioSocial": true,
      "beneficioSocial": "Bolsa Família",
      "possuiInternetCasa": true,
      "tipoAcessoInternet": "Wi-Fi residencial"
    },
    "aluno": {
      "codigoAluno": "ALU-1045",
      "nome": "Maria Exemplo",
      "sexo": "F",
      "cpf": "70000001045"
    },
    "responsavel": {
      "nome": "João Exemplo",
      "parentesco": "Pai",
      "telefone": "92990000000",
      "email": "joao@exemplo.org"
    },
    "pesquisa": {
      "meioTransporteEscola": "Ônibus",
      "tempoDeslocamentoMin": 25,
      "frequenciaEscolarPct": 92,
      "anoSerie": "6º ano EF",
      "turno": "Matutino",
      "necessidadeEducacionalEspecial": false
    }
  }'
```

## Estrutura principal

```
front-end/src/
├── app/
│   ├── api/
│   │   ├── alunos/route.ts
│   │   ├── coleta/route.ts
│   │   └── dashboard/stats/route.ts
│   └── dashboard/
│       ├── page.tsx
│       └── components/
├── components/ui/
└── lib/
    ├── prisma.ts
    └── validations/coleta.ts
```
