# Roteiro de demonstração 

Checklist ponta a ponta para staging/produção (ou local espelhando prod).

**Objetivo:** mostrar planilha já no banco → entrevista mobile v2 (códigos, aluno/família existente, bairro fechado) → offline/sync → dashboard (KPIs, gráficos, **mapa de renda**).

**Tempo estimado:** 20–30 min.

**Alternativas de aparelho**

| Modo | Quando usar |
|------|-------------|
| Expo Go no celular | Demo “de campo” real |
| Expo Web (`w` no terminal) | Gravação de tela no notebook |

---

## Antes da demo (preparação)

- [ ] Migrations aplicadas no banco (incl. multi equipamento/apoio, bairro/códigos recentes)
- [ ] Seed/importação T1 (planilha) no banco
- [ ] Front/API no ar (`npm run dev` ou Render) — tipicamente **http://localhost:3000**
- [ ] `GET /api/dashboard/stats` → 200
- [ ] `GET /api/alunos` lista registros (há origem Planilha)
- [ ] `GET /api/codigos/proximo` retorna `FAM-…` e `ALU-…`
- [ ] Mobile com `EXPO_PUBLIC_API_URL` na API da demo (não use URL `exp://` do QR)
- [ ] Expo Go SDK 57 **ou** Expo Web; se Web, CORS do front ativo (`middleware.ts`)
- [ ] Anotar um nome da planilha para busca na consulta
- [ ] (Opcional) Anotar um `ALU-…` / `FAM-…` já existentes para demo de reutilização

---

## 1. Base já no banco (planilha / Ciclo 1)

1. Abrir o dashboard → `/dashboard`
2. Confirmar cards com **Alunos** e **Famílias** > 0
3. Na **Consulta**, filtrar origem **Planilha** (ou rótulo equivalente Ciclo 1)
4. Buscar um nome conhecido da planilha
5. Expandir detalhes: família, responsável, momento **T1**

**Esperado:** origem planilha, ciclo T1, questionário v1 (campos v2 podem estar vazios/nulos).

**Narrativa:** “A base histórica já está no Postgres (Supabase); o mobile só acrescenta/atualiza entrevistas.”

---

## 2. Nova entrevista — aluno e família **novos** (online)

Mostra geração automática de códigos e o wizard v2 completo.

1. App → **Nova coleta**
2. **Etapa da coleta:** Coleta em campo (**T2**)
3. Código do aluno: **Novo**
   - [ ] Código `ALU-…` gerado sozinho (readonly)
   - [ ] (Opcional) tocar **Gerar novo código do aluno** → número avança
4. Preencher nome, nascimento, sexo (CPF opcional)
5. **Responsável:** nome, parentesco, telefone, ocupação…
6. **Família:** código **Nova**
   - [ ] `FAM-…` gerado
   - [ ] Endereço, comunidade, tipo de localidade
   - [ ] **Bairro:** abrir select pesquisável → escolher um bairro oficial (ex.: Petrópolis) — **não** digitar texto livre
   - [ ] Moradores (≥ 1), renda (máscara em centavos), benefício, escolaridade dos adultos
7. **Escolar:** ano/série, turno, frequência (número ou “Não sabe”), transporte, barreiras (marcar ≥1 barreira real, não só “Nenhuma”)
8. **Estudo / apoio**
   - [ ] Internet em casa + tipo
   - [ ] Equipamentos (multi; “Nenhum” exclusivo)
   - [ ] Local de estudo, acompanhamento
   - [ ] NEE (sim/não; se sim, até 2 do catálogo)
   - [ ] Apoios prioritários (até 2; “Nenhum” exclusivo)
9. **Revisão** → **Salvar e sincronizar**
   - [ ] Overlay/loading de salvamento
   - [ ] Mensagem de sincronizado (se online)

**Esperado:** `POST /api/coleta` OK; aluno aparece na consulta como **Mobile / T2 / v2**.

---

## 3. Offline → fila → sync

1. Modo avião **ou** Wi‑Fi off
2. Nova coleta rápida (pode reutilizar fluxo enxuto: aluno novo + família nova + campos mínimos válidos)
3. Salvar → mensagem **offline** / pendente
4. Tela **Pendentes (Sync):** item na fila
5. Religar rede → sync automático **ou** botão sync
6. Confirmar saída da fila

**Esperado:** mesmo contrato da API; sem duplicar ao reenviar o mesmo aluno+momento (atualiza a pesquisa e as barreiras).

---

## 4. Aluno **existente** (reavaliação T3)

1. Nova coleta → etapa **Reavaliação (T3)**  
   (o app tende a sugerir código do aluno = **Existente**)
2. Abrir select **Selecionar aluno existente**
   - [ ] Lista carrega (API + fila local)
   - [ ] Buscar por código ou nome
   - [ ] Banner “Carregando informações…”
3. Conferir prefill: nome, CPF, família, responsável
4. Ajustar só o que mudou na reavaliação (ex.: frequência, barreiras, apoio)
5. Salvar e sincronizar

**Esperado:** mesmo `ALU-…`; família vinculada correta; nova/atualizada pesquisa no momento **T3**.

**Narrativa:** “Não geramos aluno duplicado; reavaliação reutiliza o cadastro.”

---

## 5. Família **existente** + aluno **novo** (irmão)

1. Nova coleta → T2
2. Aluno: **Novo** (gera `ALU-…` novo)
3. Família: **Existente** → buscar `FAM-…` já cadastrada
4. Conferir endereço/bairro/renda preenchidos; revisar se preciso
5. Completar responsável/escolar/estudo → salvar

**Esperado:** novo aluno na mesma família; upsert da família sem criar `FAM` duplicado.

**Atenção na demo:** se escolher aluno existente e depois voltar para aluno **Novo**, a família também limpa (volta para Nova) — mostrar isso só se quiser explicar o comportamento.

---

## 6. Dashboard após as entrevistas

Atualizar o dashboard (botão ou poll).

### Cards
- [ ] Totais de alunos/famílias/coletas coerentes
- [ ] Coletas v2 / indicadores v2 refletindo o mobile
- [ ] Card de barreiras (base v2) > 0 se marcou barreira real

### Gráficos
- [ ] Faixas de renda
- [ ] Tipo de internet
- [ ] Principais barreiras (código da barreira marcada)
- [ ] Apoio prioritário (códigos v2; multi vira contagem)

### Mapa de renda por bairro
- [ ] Bairro oficial escolhido no mobile **pinta** o polígono
- [ ] Toque/hover: renda média + nº de famílias
- [ ] Se testar `NAO_SABE` ou `OUTRO` em outra coleta: **não** geocodifica (sem polígono / aviso)

### Consulta
- [ ] Filtro Mobile / busca pelo nome da demo
- [ ] Origem Mobile, ciclo T2 ou T3, v2
- [ ] Comunidade/bairro exibidos de forma legível

---

## 7. Smoke opcional via API (sem aparelho)

Útil se o Expo falhar. Use **códigos** canônicos (`@sistemadecoleta/questionario`).

```bash
curl -sS -X POST "http://localhost:3000/api/coleta" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "momento": { "codigo": "T2" },
  "familia": {
    "codigoFamilia": "FAM-900",
    "endereco": "Rua Demo, 1",
    "bairro": "CENTRO",
    "comunidade": "Demo",
    "tipoLocalidade": "URBANA",
    "qtdMoradores": 4,
    "rendaFamiliarMensal": 1600,
    "recebeBeneficioSocial": false,
    "possuiInternetCasa": true,
    "tipoAcessoInternet": "WIFI_RESIDENCIAL"
  },
  "aluno": {
    "codigoAluno": "ALU-9001",
    "nome": "Aluno Demo Sync",
    "dataNascimento": "2014-05-10",
    "sexo": "F"
  },
  "responsavel": {
    "nome": "Responsavel Demo",
    "parentesco": "MAE",
    "telefone": "92990000000",
    "escolaridade": "MEDIO_COMPLETO",
    "situacaoOcupacional": "DO_LAR"
  },
  "pesquisa": {
    "meioTransporteEscola": "ONIBUS",
    "tempoDeslocamentoMin": 20,
    "frequenciaEscolarPct": 90,
    "anoSerie": "5_ANO_EF",
    "turno": "MATUTINO",
    "necessidadeEducacionalEspecial": false,
    "equipamentosEstudo": ["CELULAR"],
    "disponibilidadeEquipamento": "COMPARTILHADO_DISPONIVEL",
    "localEstudo": "PARCIALMENTE",
    "acompanhamentoFamiliar": "AS_VEZES",
    "apoiosPrioritarios": ["REFORCO"]
  },
  "barreiras": ["TRANSPORTE", "FINANCEIRA"]
}
EOF
```

Conferir:

```bash
curl -sS "http://localhost:3000/api/alunos?q=Aluno%20Demo&origem=MOBILE" | head
curl -sS "http://localhost:3000/api/codigos/proximo"
curl -sS "http://localhost:3000/api/coleta/lookup?codigoAluno=ALU-9001"
```

---

## Ordem sugerida na apresentação (cliente)

1. Dashboard com planilha (confiança na base)  
2. Coleta nova online (códigos + bairro + multi-select)  
3. Offline → sync (confiabilidade de campo)  
4. Aluno existente / T3 (reavaliação)  
5. Mapa + gráficos atualizados  
6. (Se sobrar tempo) irmão na mesma família  

---

## Registro da execução

| Campo | Valor |
|-------|--------|
| Ambiente | |
| Data | |
| URL da API | |
| Executor | |
| Offline → sync OK? | |
| Aluno existente OK? | |
| Mapa / bairro OK? | |
| Observações | |

---

## Troubleshooting rápido

| Sintoma | O que checar |
|---------|----------------|
| Mobile não sync | `EXPO_PUBLIC_API_URL`, Wi‑Fi, porta do Next, HTTPS no Render |
| Expo Web: lista de alunos vazia | Front ligado; CORS (`middleware`); restart Expo `-c`; URL vira `localhost` na web |
| “Gerar novo código” não muda | Versão atual deve avançar; senão rebuild do bundle |
| Zod / 400 no POST | Código fora do catálogo (bairro, enums); arrays v2 (`equipamentosEstudo`, `apoiosPrioritarios`) |
| Dashboard sem v2 / barreiras | Falta sync mobile; amostra ainda só T1 |
| Mapa sem polígono | Bairro `NAO_SABE`/`OUTRO` ou texto legado sem match; use código oficial |
| Porta 3000 ocupada | Next em 3001 — alinhar `.env` do mobile |
| Prisma `P2028` | Preferir connection **session** / `DIRECT_URL` (`:5432`); API evita `$transaction` interativo no `POST /api/coleta` |
