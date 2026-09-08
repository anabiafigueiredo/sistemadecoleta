# App Mobile — Coleta Escolar (Expo + Offline-First)

> Visão geral do monorepo e como subir API/banco: **[README na raiz](../README.md)**.  
> Checklist de demo: **[docs/roteiro-demonstracao.md](../docs/roteiro-demonstracao.md)**.

Aplicativo React Native (Expo **SDK 57**) para coleta socioeconômica de campo, alinhado à API `POST /api/coleta`.

```
Salvar no aparelho (UUID + sincronizado:false)
        │
        ├─ Online  → POST /api/coleta → sincronizado:true
        └─ Offline → fila local → Sync automático (NetInfo) / manual
```

## Estrutura (doc §3)

```
Abas:
├── Início              → Nova entrevista · Realizadas · Pendentes (§3.1)
├── Planilha            → registros T1 (API, origem PLANILHA)
├── Realizadas          → entrevistas sync no aparelho
└── Pendentes           → fila offline → sync

Nova entrevista (§3.2):
1. Identificação do aluno
2. Familiar entrevistado e residência
3. Contexto socioeconômico
4. Contexto educacional familiar
5. Revisão e confirmação → Salvar e sincronizar
```

```
mobile/
├── app/                      # Expo Router (telas)
│   ├── _layout.tsx           # Tabs + auto-sync NetInfo
│   ├── index.tsx             # Home §3.1
│   ├── planilha.tsx          # Lista planilha (API)
│   ├── entrevistas.tsx       # Realizadas (local sync)
│   ├── sync.tsx              # Pendentes
│   └── coleta/
│       ├── nova.tsx          # Nova entrevista (wizard)
│       └── [id].tsx          # Detalhe / editar
├── src/
│   ├── components/
│   │   ├── ColetaForm.tsx    # Wizard + validação + save/sync
│   │   ├── Field.tsx
│   │   ├── Segmented.tsx
│   │   ├── MultiSelectChips.tsx
│   │   └── BoolSwitch.tsx
│   ├── hooks/
│   │   ├── useColetas.ts
│   │   └── useNetwork.ts
│   └── lib/
│       ├── api.ts            # Cliente HTTP
│       ├── config.ts         # API_URL
│       ├── masks.ts
│       ├── storage.ts
│       ├── sync.ts
│       ├── types.ts
│       ├── opcoes-questionario.ts
│       └── validation.ts
├── app.json
├── package.json
└── .env.example
```

## Dependências principais

| Pacote | Uso |
|--------|-----|
| `expo` + `expo-router` | App e navegação |
| `@react-native-async-storage/async-storage` | Persistência local |
| `@react-native-community/netinfo` | Online/offline |
| `expo-crypto` | UUID (`randomUUID`) |
| `zod` | Validação no client |

## Como rodar

Há **dois jeitos** de abrir o app no celular:

| Jeito | Quando usar | Precisa do PC ligado? |
|-------|-------------|------------------------|
| **Expo Go** (dev) | mexer no código no dia a dia | sim (`npx expo start`) |
| **APK (EAS preview)** | demonstração / campo sem cabo nem Expo Go | não |

Para a API, na dúvida use o **cenário A** (produção no Render).

| Cenário | O que sobe no PC | `EXPO_PUBLIC_API_URL` |
|---------|------------------|------------------------|
| **A — API em produção** | só `mobile/` (Expo) *ou* nada (APK) | `https://sistemadecoleta.onrender.com` |
| **B — tudo local** | Postgres + `front-end` + `mobile` | IP/porta do Next na LAN |

---

## Rodar com o APK (EAS preview)

Build instalável Android (`.apk`), perfil `preview` em `eas.json`. A URL da API **entra no APK na hora do build** (`EXPO_PUBLIC_API_URL` do perfil) — hoje aponta para `https://sistemadecoleta.onrender.com`.

Não usa Expo Go. Depois de instalar, o app abre sozinho e fala com a API de produção.

### Pré-requisitos

- Conta [expo.dev](https://expo.dev) e login no CLI (`npx expo login`)
- Celular Android (ou emulador) com permissão para instalar apps de fontes desconhecidas / APK
- Projeto linkado ao EAS (`eas.projectId` no `app.json` — já configurado)

### 1. Gerar o APK

Na pasta `mobile/`:

```bash
cd mobile
npx expo login          # se ainda não estiver logado
npx eas-cli build --platform android --profile preview
```

O EAS sobe o projeto, compila na nuvem e mostra o link do build (ex.: `https://expo.dev/accounts/…/projects/coleta-escolar/builds/…`).  
Espere o status **Finished** (pode levar vários minutos).

Para só disparar e não ficar esperando no terminal:

```bash
npx eas-cli build --platform android --profile preview --no-wait
```

Acompanhe depois em [expo.dev](https://expo.dev) → projeto **coleta-escolar** → **Builds**.

### 2. Baixar e instalar no celular

1. Abra a página do build no Expo (link do terminal ou painel).
2. Em **Download** / **Install**, baixe o `.apk` (no próprio celular ou no PC).
3. Se baixou no PC: envie o arquivo (Drive, WhatsApp, cabo USB, etc.).
4. No Android: abra o `.apk` → permita instalar deste origem se pedir → **Instalar**.
5. Abra **Coleta Escolar** na lista de apps.

Pacote: `br.org.colegiocomunitario.coleta`.

### 3. Usar no dia a dia (sem Metro)

- Abra o app → Início / Planilha / Realizadas / Pendentes.
- Com API no Render, **não** precisa de `npx expo start` nem da mesma Wi‑Fi do PC.
- Offline: a coleta fica na fila local; ao voltar a internet, sync automático ou pela aba **Pendentes**.

Teste rápido: aba **Planilha**. Se listar alunos, a API embutida no APK está ok.

### 4. Novo APK depois de mudar código ou API

O APK **não** atualiza sozinho com o código do PC. Qualquer mudança de tela/lógica/API URL exige **novo build**:

```bash
npx eas-cli build --platform android --profile preview
```

Instale o novo `.apk` por cima do anterior (mesmo `package`).

Para apontar o APK a outra API, altere `build.preview.env.EXPO_PUBLIC_API_URL` em `eas.json` e gere de novo.

### APK × Expo Go

| | APK (`preview`) | Expo Go |
|--|-----------------|---------|
| Instalação | `.apk` baixado do EAS | app Expo Go + QR |
| Metro / PC | não precisa | precisa (`expo start`) |
| API | fixa no build (`eas.json`) | `.env` do PC |
| Uso típico | demo, campo, banca | desenvolvimento |

> Builds `production` no `eas.json` geram **AAB** (Play Store), não APK de instalação direta.

---

## Como rodar com Expo Go (desenvolvimento)

### 0. O que **não** colocar no `.env`

`EXPO_PUBLIC_API_URL` é a **API do sistema** (Render ou Next local).

**Não** coloque aí a URL do Expo (`exp://…`, `https://exp.host/…`, link do QR). Essa URL só se usa **escaneando o QR no Expo Go**.

| Valor | Onde |
|-------|------|
| `https://sistemadecoleta.onrender.com` | `.env` → `EXPO_PUBLIC_API_URL` |
| QR / `exp://…` | só no Expo Go (scan) |

Erro comum: colar a URL do Expo no `.env` → o app abre (ou nem abre) e **não** fala com a API.

### 1. Pré-requisitos

**Máquina**

- Node.js 20+ e `npm`
- Git + clone do repositório
- Conta em [expo.dev](https://expo.dev) (criar se ainda não tiver)

**Celular**

1. Instalar o **Expo Go**:
   - Android: [Google Play — Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store — Expo Go](https://apps.apple.com/app/expo-go/id982107779)
2. Atualizar o app (projeto usa **SDK 57**; Go antigo, ex. SDK 52, não abre).
3. Entrar no Expo Go com a **mesma conta** do `npx expo login` no PC.

Este projeto tem `eas.projectId` no `app.json`. Sem login alinhado, o Expo Go mostra:

> *You need to be signed in to Expo Go and Expo CLI… Run `npx expo login`*

### 2. Login no Expo CLI (obrigatório neste projeto)

```bash
cd mobile
npx expo login
npx expo whoami   # confirma a conta
```

No celular: Expo Go → Profile / Sign in → **a mesma conta**.

### 3. Configure a URL da API (`.env`)

```bash
cd mobile
cp .env.example .env   # se não existir, crie o arquivo .env na mão
```

**Cenário A — produção (recomendado se o dashboard já está no ar):**

```env
EXPO_PUBLIC_API_URL=https://sistemadecoleta.onrender.com
```

Sem barra no final. Não precisa de Docker, nem rodar `front-end`/`back-end` no PC. Celular e PC **não** precisam estar na mesma Wi‑Fi (a API é HTTPS pública).

**Cenário B — API local:**

```env
# Device físico (mesma Wi‑Fi do PC): http://SEU_IP_LAN:3000
# Android emulator:                   http://10.0.2.2:3000
# iOS Simulator:                      http://localhost:3000
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

Suba antes Postgres + `front-end` (`npm run dev`) — ver [README na raiz](../README.md).  
IP no Linux/macOS: `hostname -I` ou `ip a`. Se o Next cair em `:3001`, use essa porta no `.env`.  
Depois de mudar o `.env`: `npx expo start -c`.

### 4. Instale e inicie no PC

```bash
npm install
npx expo start -c
# rede corporativa bloqueando o Expo:
npm run start:offline
# ou, se LAN isolar o celular do PC:
npm run start:tunnel
```

No terminal aparece o **QR code**.

### 5. Abra no aparelho

1. Expo Go já logado na mesma conta do CLI.
2. Escaneie o QR (Android: Scan no Expo Go; iOS: câmera → Abrir no Expo Go).
3. Aguarde o bundle. Devem aparecer Início / Planilha / Realizadas / Pendentes.
4. Teste: abra **Planilha**. Se listar alunos, a API está ok. Se falhar, revise `EXPO_PUBLIC_API_URL` (não o QR) e reinicie com `-c`.

**Alternativa sem celular:** emulador (`a` / `i` no terminal do Expo).

### Problemas frequentes

| Sintoma | Causa | O que fazer |
|---------|--------|-------------|
| *signed in to Expo Go and Expo CLI* | sem login / contas diferentes | `npx expo login` + login no Expo Go (mesma conta) |
| Colocou URL `exp://` no `.env` | confusão QR × API | use a URL do Render (ou IP do Next); QR só no scan |
| Planilha / sync falham | API errada ou fora | conferir dashboard/prod; `EXPO_PUBLIC_API_URL` com `https://…` |
| SDK incompatível | Expo Go antigo | atualizar na loja |
| QR não carrega (só LAN) | Wi‑Fi isolada | mesma rede ou `npm run start:tunnel` |

Para instalar sem Expo Go, use a seção **[Rodar com o APK (EAS preview)](#rodar-com-o-apk-eas-preview)** acima.

## Fluxo offline-first

1. Formulário valida (obrigatórios, freq. ≤ 100%, tempo ≥ 0, máscaras).
2. `saveColeta` grava em AsyncStorage com `id` UUID e `sincronizado: false`.
3. Se online → `POST /api/coleta` imediato → `sincronizado: true`.
4. Se offline → permanece pendente.
5. Tela **Sync** lista pendências e envia em lote; `_layout` escuta NetInfo e sincroniza ao reconectar.

Ciclo padrão de campo: **T2** (ou T3 na reavaliação). Não use T1 (planilha).

## Contrato com a API

Payload montado em `validation.ts` → mesmo formato de `docs/05-api-mobile.md`.
