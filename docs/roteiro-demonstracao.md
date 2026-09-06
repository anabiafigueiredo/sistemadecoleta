# Roteiro de demonstração (B-13)

Checklist ponta a ponta para staging/produção (ou local espelhando prod).

**Objetivo:** mostrar importação já no banco → entrevista mobile offline → sync → dashboard (cards + barreiras).

**Tempo estimado:** 15–25 min.

---

## Antes da demo (preparação)

- [ ] Banco com seed/importação T1 (planilha) aplicado
- [ ] Front/API no ar (local, Docker ou Render)
- [ ] `GET /api/dashboard/stats` responde 200
- [ ] `GET /api/alunos` lista registros (origem Planilha)
- [ ] Mobile com `EXPO_PUBLIC_API_URL` apontando para a API da demo
- [ ] Expo Go SDK 57 no aparelho/emulador
- [ ] Anotar um **código de aluno novo** (ex.: `ALU-DEMO-001`) para não colidir com a planilha

---

## 1. Base já no banco (planilha)

1. Abrir o dashboard → `/dashboard`
2. Confirmar cards com **Alunos** e **Famílias** > 0
3. Na **Consulta**, filtrar **Planilha**
4. Buscar um nome conhecido da planilha
5. Expandir **Detalhes** e mostrar família/responsável

**Esperado:** origem **Planilha**, status com ciclo **T1** (ou momento da importação), v1.

---

## 2. Nova entrevista mobile (offline)

1. No aparelho: modo avião **ou** Wi‑Fi desligado (garantir offline)
2. Abrir o app → **Nova coleta**
3. Percorrer o wizard:
   - [ ] Aluno (momento **T2**, nome, nascimento obrigatório…)
   - [ ] Família / responsável
   - [ ] Socioeconômico (transporte, ano/série, turno…)
   - [ ] Educacional + **barreiras** (marcar pelo menos uma barreira real, não só “Nenhuma”)
   - [ ] Revisão → **Salvar**
4. Confirmar mensagem de salvo **offline** / pendente
5. Abrir tela **Sync** e ver o registro na fila (`sincronizado: false`)

**Esperado:** dados só no aparelho; dashboard ainda **não** mostra a nova entrevista mobile.

---

## 3. Sync

1. Religar a rede
2. Sync automático (NetInfo) **ou** botão de sync na fila
3. Confirmar item saiu da pendência / marcado sincronizado
4. (Opcional) Reenviar a mesma coleta: deve **atualizar** a mesma pesquisa (aluno+momento), sem duplicar barreiras

**Esperado:** `POST /api/coleta` 200; registro com `origem=MOBILE`, `versaoQuestionario=2`.

---

## 4. Dashboard após sync

1. Atualizar o dashboard (botão ou aguardar poll)
2. **Cards**
   - [ ] Total de coletas / v2 aumentou (ou aparece ≥1 v2)
   - [ ] Card **Com barreira (v2)** > 0% se marcou barreira real  
     Legenda: *base: entrevistas mobile v2*
3. **Visualizações prioritárias**
   - [ ] Faixas de renda per capita
   - [ ] Tipo de acesso à internet (unidade família)
   - [ ] **Principais barreiras** — aparece a barreira marcada (aviso de amostra parcial se ainda houver muito T1)
   - [ ] **Apoio prioritário** — reflete a escolha v2
4. **Consulta**
   - [ ] Filtro **Mobile**
   - [ ] Busca pelo **nome** do aluno da demo
   - [ ] Colunas: família/comunidade, data, origem **Mobile**, status **Sincronizado** + **T2** + **v2**

---

## 5. Smoke opcional via API (sem aparelho)

Útil se o Expo falhar na hora. Ajuste a URL/porta e use um CPF válido opcional ou omita CPF.

```bash
# Exemplo mínimo — complete enums oficiais de opcoes-questionario.ts
curl -sS -X POST "http://localhost:3000/api/coleta" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "momento": { "codigo": "T2" },
  "familia": {
    "codigoFamilia": "FAM-DEMO-01",
    "endereco": "Rua Demo, 1",
    "bairro": "Centro",
    "comunidade": "Demo",
    "tipoLocalidade": "URBANA",
    "qtdMoradores": 4,
    "rendaFamiliarMensal": 1600,
    "recebeBeneficioSocial": false,
    "possuiInternetCasa": true,
    "tipoAcessoInternet": "WIFI_RESIDENCIAL"
  },
  "aluno": {
    "codigoAluno": "ALU-DEMO-001",
    "nome": "Aluno Demo Sync",
    "dataNascimento": "2014-05-10",
    "sexo": "F"
  },
  "responsavel": {
    "nome": "Responsavel Demo",
    "parentesco": "MAE",
    "escolaridade": "MEDIO_COMPLETO",
    "situacaoOcupacional": "DO_LAR"
  },
  "pesquisa": {
    "meioTransporteEscola": "ONIBUS",
    "tempoDeslocamentoMin": 20,
    "anoSerie": "5_ANO_EF",
    "turno": "MATUTINO",
    "necessidadeEducacionalEspecial": false,
    "equipamentoEstudo": "CELULAR",
    "disponibilidadeEquipamento": "COMPARTILHADO_DISPONIVEL",
    "localEstudo": "PARCIALMENTE",
    "acompanhamentoFamiliar": "AS_VEZES",
    "apoioPrioritario": "REFORCO"
  },
  "barreiras": ["TRANSPORTE", "FINANCEIRA"]
}
EOF
```

Depois: `GET /api/alunos?q=Aluno%20Demo&origem=MOBILE` e conferir gráficos de barreiras.

---

## Registro da execução

| Campo | Valor |
|-------|--------|
| Ambiente | local (API `:3001` + Supabase) |
| Data | 2026-09-06 |
| URL da API | `http://localhost:3001` |
| Executor | smoke automatizado (curl) + checklist UI |
| Offline → sync OK? | sync API OK (201); offline no aparelho — validar na demo presencial |
| Barreiras no dashboard? | sim (TRANSPORTE, FINANCEIRA; card 100% v2) |
| Observações | Corrigido `P2028` no `POST /api/coleta` (sem `$transaction` interativo no pooler). |

> Marque/atualize os checkboxes do fluxo mobile offline na primeira execução real com Expo na demo com a cliente.

---

## Troubleshooting rápido

| Sintoma | O que checar |
|---------|----------------|
| Mobile não sync | `EXPO_PUBLIC_API_URL`, firewall, HTTP claro no device, porta correta |
| Dashboard sem v2 | Seed só T1; falta sync mobile; filtro origem |
| Erro Zod no POST | Códigos de enum fora da lista oficial |
| Porta 3000 ocupada | Next sobe em 3001 — alinhar `.env` do mobile |
| Prisma `P2028` / sync 500 | `DATABASE_URL` em modo *transaction* (pgbouncer `:6543`). Use connection **session** (`:5432`) ou `DIRECT_URL` como URL da app; a API evita `$transaction` interativo no `POST /api/coleta`. |
