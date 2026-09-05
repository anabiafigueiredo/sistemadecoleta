# ETL e Sanitização dos Dados Socioeconômicos

## Resumo executivo

A planilha original continha **46 linhas** de coleta. O processo de ETL aplicou regras explícitas de qualidade: deduplicação por identificador do aluno (e CPF, quando presente), normalização textual, conversão tipada de moeda/percentual/datas, correção de anomalias numéricas (ex.: frequência &gt; 100%, tempo negativo, quantidade de moradores zero) e limpeza de máscaras de CPF/telefone/e-mail. Com isso, removemos **2 duplicatas** e carregamos **44 alunos** em **24 núcleos familiares** únicos, já normalizados no PostgreSQL via Prisma.

---

## O que usamos como base para a limpeza

O ETL não “adivinha” correções: ele aplica **regras determinísticas** definidas a partir dos vícios observados na coleta de campo e dos requisitos do modelo relacional (tipos, unicidade e integridade referencial no Prisma/PostgreSQL).

A pipeline segue o clássico **Extract → Transform → Load**:

1. **Extract** — leitura do TSV (`dados_brutos.txt`)
2. **Transform** — sanitização campo a campo + deduplicação
3. **Load** — inserção normalizada (`Familia` → `Aluno` → `Responsavel` → `PesquisaSocioeconomica`)

Implementação: `prisma/seed.ts`  
Exportação pós-sanitização: `dados_sanitizados.xlsx` (`npm run db:export`)

---

## Critérios usados (e por quê)

| Dimensão | Critério / regra | Por que existe | Exemplo na planilha |
|----------|------------------|----------------|---------------------|
| **Identidade** | Chave natural = `id_aluno`; reforço por `cpf_aluno` | Evitar aluno duplicado no banco (`@unique`) e inflar indicadores | Registros 45 e 46 = `ALU-1011` e `ALU-1015` (já processados) → **ignorados** |
| **Texto** | `trim` + colapsar espaços; *title case* em nomes/bairros; partículas (`de`, `da`…) em minúsculo | Padronizar agrupamentos (ex.: bairro) e apresentação | `ana   silva DE souza` → `Ana Silva de Souza`; `cidade nova` → `Cidade Nova` |
| **Sexo** | Só `M` ou `F` | Domínio fechado no schema (`Char(1)`) | Qualquer outro valor → `null` |
| **Moeda** | Remover `R$`, pontos de milhar; vírgula → ponto | Converter formato BR para `Decimal` | `R$ 1.200,00` → `1200.00` |
| **Percentual** | Remover `%`; **clamp** em `[0, 100]` | Frequência escolar não pode passar de 100% | `105%` → `100.00` |
| **Tempo** | Valor absoluto (`Math.abs`) | Tempo de deslocamento negativo é erro de digitação | `-10` → `10` |
| **Moradores** | Inteiro; mínimo **1** se ≤ 0 | `0` moradores é inconsistente com núcleo familiar | `0` → `1` |
| **Booleanos** | `"Sim"` / `"Não"` → `true` / `false` | Tipagem correta no banco | Benefício, internet, NEE |
| **Documentos/contato** | CPF/telefone: só dígitos; e-mail inválido → `null` | Máscaras diferentes na coleta; evitar lixo em contato | `(92) 93001-1001` → `92930011001`; `maria.silva@` → `null` |
| **Datas** | Parser flexível `M/D/YYYY` e `DD/MM/YYYY` → ISO | Planilha misturou formatos (Excel US vs BR) | `15/03/2014` (dia &gt; 12) → `2014-03-15` |
| **Nulos semânticos** | `"Nenhum"` / vazio → `null` | Distinguir “não informado” de valor real | Benefício `Nenhum` → `null` |

A **consolidação em 24 famílias** não é um filtro à parte: vem do **upsert por `codigoFamilia`**. Vários alunos compartilham o mesmo `FAM-00X`; o banco guarda um único núcleo e relaciona os alunos a ele (3ª forma normal).

---

## Quem definiu essas regras?

- **Regras de negócio / domínio:** frequência ≤ 100%, tempo ≥ 0, família com ≥ 1 morador, sexo binário M/F no cadastro escolar.
- **Regras técnicas:** unicidade de aluno/CPF, tipos do schema Prisma, formato decimal ISO.
- **Regras de padronização:** *title case* e dígitos-only para permitir filtro, agregação e dashboard sem quebrar por variação de digitação.

---

## Resultado quantitativo

| Métrica | Valor |
|---------|-------|
| Registros brutos | 46 |
| Duplicatas removidas | 2 (`ALU-1011`, `ALU-1015`) |
| Alunos carregados | 44 |
| Núcleos familiares únicos | 24 |
| Responsáveis | 44 |
| Pesquisas socioeconômicas | 44 |

---
