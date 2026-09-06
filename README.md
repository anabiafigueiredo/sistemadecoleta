# Sistema de coleta — monitoramento educacional

Monorepo do MVP: **planilha (T1) → PostgreSQL → app mobile offline → sync → dashboard web**.

Quem nunca viu o repositório deve conseguir subir o ambiente e demonstrar o fluxo com este README + o [roteiro de demonstração](docs/roteiro-demonstracao.md).

---

## Arquitetura

```
┌─────────────────┐     seed/ETL      ┌──────────────┐
│ Excel sanitizado │ ───────────────► │  PostgreSQL  │
│ (questionário v1)│                  │  (Prisma)    │
└─────────────────┘                   └──────┬───────┘
                                             │
         ┌───────────────────────────────────┼────────────────────────┐
         │                                   │                        │
         ▼                                   ▼                        ▼
┌─────────────────┐               ┌─────────────────┐      ┌──────────────────┐
│ Mobile (Expo)   │  POST /api/   │ Front Next.js   │      │ Dashboard /web   │
│ offline-first   │──────────────►│ API + UI        │◄─────│ KPIs, gráficos,  │
│ questionário v2 │  coleta       │ :3000           │      │ tabela consulta  │
└─────────────────┘               └─────────────────┘      └──────────────────┘
```

| Camada | Pasta | Papel |
|--------|--------|--------|
| Banco / ETL | `back-end/` | Schema Prisma, migrations, seed da planilha, catálogo de barreiras |
| API + dashboard | `front-end/` | Next.js 15 — REST + painel analítico |
| Campo | `mobile/` | Expo SDK 57 — wizard de coleta, fila offline, sync |
| Docs | `docs/` | Backlog MVP + roteiro de demo |

---

## Stack

- **Node.js** 20+ (prod Render: 22)
- **PostgreSQL** 16 (Docker local ou Supabase/Render)
- **Prisma** 6.19.3 — schema canônico em `back-end/prisma/schema.prisma`
- **Next.js** 15 + React 19 + Tailwind 4 + Recharts + Leaflet
- **Expo** ~57 + AsyncStorage + NetInfo + Zod
- Deploy web: **Render** (`render.yaml`)

---

## Modelagem (visão rápida)

Entidades principais:

- `MomentoColeta` — ciclos T1 (planilha), T2/T3 (campo)
- `Familia` → `Aluno` → `Responsavel` (1:1)
- `PesquisaSocioeconomica` — entrevista; `origem` (`PLANILHA` \| `MOBILE`) + `versaoQuestionario` (1 \| 2)
- `Barreira` + `PesquisaBarreira` — N:N (catálogo seed; “Nenhuma” exclusiva)

Listas oficiais do questionário v2: `front-end/src/lib/opcoes-questionario.ts` e espelho em `mobile/src/lib/opcoes-questionario.ts`.

---

## Premissas do MVP

1. **Frequência escolar** não é perguntada no mobile; em coletas `MOBILE` fica `null` (dado administrativo / planilha).
2. **v1** = importação da planilha (`origem=PLANILHA`, `versaoQuestionario=1`); campos novos do Bloco B/C/D podem ser `null`.
3. **v2** = entrevista mobile (`origem=MOBILE`, `versaoQuestionario=2`); wizard completo + barreiras + Bloco D.
4. **Re-sync** do mesmo aluno + momento atualiza a pesquisa e substitui o N:N de barreiras (não duplica).
5. Fora de escopo: sync bidirecional, formulários dinâmicos, admin completo, TestFlight.

Backlog de alinhamento: [`docs/backlog-mvp-cliente.md`](docs/backlog-mvp-cliente.md).

---

## Como rodar

### Opção A — Docker (stack completa)

Na raiz do monorepo:

```bash
docker compose up --build -d
```

Sobe Postgres, aplica migrate/seed (`db-init`) e a web em **http://localhost:3000**.

### Opção B — desenvolvimento local (recomendado no dia a dia)

**1. Banco**

```bash
cd back-end
cp .env.example .env   # se existir; senão configure DATABASE_URL
docker compose up -d   # só Postgres (compose em back-end/)
# ou use o Postgres da raiz
npx prisma migrate deploy   # ou: npm run db:migrate
npx prisma db seed
```

`DATABASE_URL` típica local:

```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/coleta_dados?schema=public"
```

Com Supabase, configure também `DIRECT_URL` (session) para migrate.

**2. Front (API + dashboard)**

```bash
cd front-end
# .env com a mesma DATABASE_URL (+ DIRECT_URL se necessário)
npm install
npm run dev
```

Abra **http://localhost:3000/dashboard** (se a porta 3000 estiver ocupada, o Next usa 3001).

**3. Mobile**

```bash
cd mobile
cp .env.example .env
# Device físico na mesma rede: EXPO_PUBLIC_API_URL=http://SEU_IP_LAN:3000
# Emulador Android: http://10.0.2.2:3000
# iOS Simulator: http://localhost:3000
npm install
npx expo start
```

Use **Expo Go compatível com SDK 57**. Detalhes: [`mobile/README.md`](mobile/README.md).

### Render (produção)

1. Serviço web definido em `render.yaml` (`rootDir: front-end`).
2. Configure `DATABASE_URL` e `DIRECT_URL` no painel.
3. Migrations: rode `prisma migrate deploy` apontando para o banco (CI ou one-off) **antes** do tráfego.
4. Seed só se for ambiente novo (não rode seed destrutivo em prod com dados reais).
5. No mobile de campo, `EXPO_PUBLIC_API_URL` = URL pública do Render (HTTPS).

Health check: `GET /api/dashboard/stats`.

---

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/dashboard/stats` | KPIs + séries (faixas de renda, internet, barreiras v2, apoio…) |
| `GET` | `/api/alunos?q=&momento=&origem=` | Consulta (nome, ciclo, planilha/mobile) |
| `POST` | `/api/coleta` | Sync da entrevista mobile (Zod + upsert por aluno+momento) |

Contrato e opções: código em `front-end/src/lib/validations/coleta.ts` e `opcoes-questionario.ts`.

---

## Dashboard (o que demonstrar)

- **Cards:** alunos, famílias, renda per capita mediana, % internet, % com barreira (base v2)
- **Gráficos prioritários:** faixas de renda per capita, tipo de internet, barreiras (v2), apoio prioritário (v2)
- **Consulta:** origem Planilha vs Mobile, status sincronizado + ciclo, busca por nome

---

## Pendências / limitações conhecidas

- Indicadores **v2** (barreiras, apoio) só ficam ricos após entrevistas mobile; com só T1 a amostra v2 fica vazia/parcial (o painel avisa).
- Colunas de texto legado (ex.: transporte na planilha) podem não bater com os códigos v2 — listas padronizadas valem para o mobile.
- App iOS “sem PC” (TestFlight) fora do escopo.
- Não há autenticação de usuário no dashboard/API neste MVP.
- Com **Supabase pooler** (porta 6543 / `pgbouncer=true`), transactions interativas do Prisma falham (`P2028`). Preferir URL **session** (`:5432`) / `DIRECT_URL` na app, ou confiar no `POST /api/coleta` sem `$transaction` interativo (já ajustado).

---

## Documentação relacionada

| Doc | Conteúdo |
|-----|----------|
| [docs/roteiro-demonstracao.md](docs/roteiro-demonstracao.md) | Checklist ponta a ponta (B-13) |
| [front-end/README.md](front-end/README.md) | Detalhes Next/API |
| [mobile/README.md](mobile/README.md) | Detalhes Expo/offline |
| [back-end/DOCKER.md](back-end/DOCKER.md) | Postgres isolado |

---

## Critérios de sucesso (entrega)

1. Excel tratado e no banco  
2. Aluno / família / responsável relacionados  
3. Entrevista completa no mobile (v2)  
4. Condicionais + validações  
5. Pendente offline → sync sem duplicar  
6. Aparece no dashboard  
7. Cards + ≥4 visualizações + consulta  
8. README + demo ponta a ponta  
