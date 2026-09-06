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

1. API + banco no ar (`front-end` em `:3000`).
2. Configure a URL:

```bash
cd mobile
cp .env.example .env
# Android emulator: EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
# iOS sim:          EXPO_PUBLIC_API_URL=http://localhost:3000
# Device físico:    EXPO_PUBLIC_API_URL=http://SEU_IP_LAN:3000
```

3. Instale e inicie:

```bash
npm install
npx expo start
# se a rede bloquear a API do Expo:
npm run start:offline
```

> **SDK 57:** use Expo Go compatível com SDK 57 (ou development build). O app antigo do Expo Go (SDK 52) **não** abre este projeto.

## Fluxo offline-first

1. Formulário valida (obrigatórios, freq. ≤ 100%, tempo ≥ 0, máscaras).
2. `saveColeta` grava em AsyncStorage com `id` UUID e `sincronizado: false`.
3. Se online → `POST /api/coleta` imediato → `sincronizado: true`.
4. Se offline → permanece pendente.
5. Tela **Sync** lista pendências e envia em lote; `_layout` escuta NetInfo e sincroniza ao reconectar.

Ciclo padrão de campo: **T2** (ou T3 na reavaliação). Não use T1 (planilha).

## Contrato com a API

Payload montado em `validation.ts` → mesmo formato de `docs/05-api-mobile.md`.
