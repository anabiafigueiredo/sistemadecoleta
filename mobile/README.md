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

### 1. Pré-requisitos (máquina)

1. API + banco no ar (`front-end` em `:3000` — ver [README na raiz](../README.md)).
2. Node.js 20+ e `npm` instalados.

### 2. Primeira vez no celular (Expo Go)

O app de desenvolvimento **não** está na loja como “Coleta Escolar”. No dia a dia usamos o **Expo Go**, que carrega o projeto a partir do PC.

1. No celular, instale o **Expo Go**:
   - Android: [Google Play — Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store — Expo Go](https://apps.apple.com/app/expo-go/id982107779)
2. Confirme que o Expo Go é **compatível com SDK 57** (atualize o app na loja). Versões antigas (ex.: SDK 52) **não** abrem este projeto.
3. Conta Expo: **não é obrigatória** só para abrir o projeto via QR code. Login no Expo Go / no site da Expo só entra se for usar EAS Build, publish ou recursos da conta.
4. Deixe o **celular e o PC na mesma rede Wi‑Fi** (rede de convidado / isolamento de clientes costuma impedir o sync e o carregamento do bundle).

### 3. Configure a URL da API

```bash
cd mobile
cp .env.example .env
```

Edite `EXPO_PUBLIC_API_URL` conforme o alvo:

```bash
# Android emulator: http://10.0.2.2:3000
# iOS Simulator:    http://localhost:3000
# Device físico:    http://SEU_IP_LAN:3000   ← IP da máquina na LAN (não use localhost)
```

No Linux/macOS, um jeito de achar o IP: `ip a` ou `ifconfig` (ex.: `192.168.x.x`). Depois de mudar o `.env`, reinicie o Expo (`npx expo start -c`).

### 4. Instale e inicie no PC

```bash
npm install
npx expo start
# se a rede bloquear a API do Expo:
npm run start:offline
```

No terminal aparece um **QR code**.

### 5. Abra o projeto no aparelho

1. Abra o **Expo Go**.
2. Escaneie o QR:
   - **Android:** pelo próprio Expo Go (Scan QR code) ou pela câmera, conforme a versão.
   - **iOS:** câmera do sistema → abrir no Expo Go.
3. Aguarde o bundle carregar. A home do app (Início / Planilha / Realizadas / Pendentes) deve aparecer.
4. Teste rápido: com a API no ar, abra **Planilha** — se a URL estiver errada ou o celular não alcançar o PC, a lista falha; ajuste `EXPO_PUBLIC_API_URL` e a rede.

**Alternativa sem celular físico:** emulador Android / simulador iOS (tecla `a` / `i` no terminal do Expo, com o emulador já instalado).

> Para build instalável (APK / development build), ver `eas.json` e o fluxo EAS — fora do caminho padrão da demo com Expo Go.

## Fluxo offline-first

1. Formulário valida (obrigatórios, freq. ≤ 100%, tempo ≥ 0, máscaras).
2. `saveColeta` grava em AsyncStorage com `id` UUID e `sincronizado: false`.
3. Se online → `POST /api/coleta` imediato → `sincronizado: true`.
4. Se offline → permanece pendente.
5. Tela **Sync** lista pendências e envia em lote; `_layout` escuta NetInfo e sincroniza ao reconectar.

Ciclo padrão de campo: **T2** (ou T3 na reavaliação). Não use T1 (planilha).

## Contrato com a API

Payload montado em `validation.ts` → mesmo formato de `docs/05-api-mobile.md`.
