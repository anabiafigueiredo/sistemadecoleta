import { fetchAlunos } from "@/lib/api";
import { listColetas } from "@/lib/storage";
import { isOnline } from "@/lib/sync";

export type CadastroSelectOption = {
  value: string;
  label: string;
  /** Texto adicional para busca (nomes etc.), além do label/código. */
  searchText?: string;
};

function norm(s: string): string {
  return s.trim().toUpperCase();
}

function uniqNames(names: Iterable<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const n = raw.trim();
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

function formatList(names: string[], max = 3): string {
  if (names.length === 0) return "";
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")} +${names.length - max}`;
}

/** Opções de alunos (servidor + fila local) para o select de “existente”. */
export async function listarOpcoesAlunosExistentes(): Promise<
  CadastroSelectOption[]
> {
  const byCode = new Map<string, CadastroSelectOption>();

  const local = await listColetas();
  for (const item of local) {
    const code = norm(item.payload.aluno.codigoAluno);
    if (!code) continue;
    const alunoNome = item.payload.aluno.nome.trim();
    const respNome = item.payload.responsavel.nome.trim();
    const fam = norm(item.payload.familia.codigoFamilia);
    byCode.set(code, {
      value: code,
      label: [
        code,
        alunoNome || null,
        respNome ? `Resp.: ${respNome}` : null,
        fam || null,
      ]
        .filter(Boolean)
        .join(" — "),
      searchText: [alunoNome, respNome, fam].filter(Boolean).join(" "),
    });
  }

  if (await isOnline()) {
    try {
      const alunos = await fetchAlunos();
      for (const a of alunos) {
        const code = norm(a.codigoAluno);
        if (!code) continue;
        const alunoNome = a.nome.trim();
        const respNome = a.responsavel?.nome?.trim() ?? "";
        const fam = norm(a.familia.codigoFamilia);
        byCode.set(code, {
          value: code,
          label: [
            code,
            alunoNome || null,
            respNome ? `Resp.: ${respNome}` : null,
            fam || null,
          ]
            .filter(Boolean)
            .join(" — "),
          searchText: [alunoNome, respNome, fam].filter(Boolean).join(" "),
        });
      }
    } catch {
      // mantém só a lista local
    }
  }

  return [...byCode.values()].sort((a, b) => a.value.localeCompare(b.value));
}

type FamiliaAgg = {
  bairro: string;
  comunidade: string;
  responsaveis: string[];
  alunos: string[];
};

/** Opções de famílias (servidor via alunos + fila local). */
export async function listarOpcoesFamiliasExistentes(): Promise<
  CadastroSelectOption[]
> {
  const byCode = new Map<string, FamiliaAgg>();

  function merge(
    code: string,
    patch: {
      bairro?: string;
      comunidade?: string;
      responsavel?: string | null;
      aluno?: string | null;
    },
  ) {
    const cur = byCode.get(code) ?? {
      bairro: "",
      comunidade: "",
      responsaveis: [],
      alunos: [],
    };
    if (patch.bairro?.trim()) cur.bairro = patch.bairro.trim();
    if (patch.comunidade?.trim()) cur.comunidade = patch.comunidade.trim();
    if (patch.responsavel?.trim()) cur.responsaveis.push(patch.responsavel);
    if (patch.aluno?.trim()) cur.alunos.push(patch.aluno);
    byCode.set(code, cur);
  }

  const local = await listColetas();
  for (const item of local) {
    const code = norm(item.payload.familia.codigoFamilia);
    if (!code) continue;
    merge(code, {
      bairro: item.payload.familia.bairro,
      comunidade: item.payload.familia.comunidade,
      responsavel: item.payload.responsavel.nome,
      aluno: item.payload.aluno.nome,
    });
  }

  if (await isOnline()) {
    try {
      const alunos = await fetchAlunos();
      for (const a of alunos) {
        const code = norm(a.familia.codigoFamilia);
        if (!code) continue;
        merge(code, {
          bairro: a.familia.bairro,
          comunidade: a.familia.comunidade,
          responsavel: a.responsavel?.nome,
          aluno: a.nome,
        });
      }
    } catch {
      // mantém só a lista local
    }
  }

  const options: CadastroSelectOption[] = [];
  for (const [code, agg] of byCode) {
    const responsaveis = uniqNames(agg.responsaveis);
    const alunos = uniqNames(agg.alunos);
    const respLabel = formatList(responsaveis, 2);
    const alunosLabel = formatList(alunos, 3);
    const lugar = [agg.bairro, agg.comunidade].filter(Boolean).join(" · ");

    const parts = [
      code,
      respLabel ? `Resp.: ${respLabel}` : null,
      alunosLabel
        ? `Aluno${alunos.length === 1 ? "" : "s"}: ${alunosLabel}`
        : null,
      lugar || null,
    ].filter(Boolean);

    options.push({
      value: code,
      label: parts.join(" — "),
      searchText: [...responsaveis, ...alunos, lugar, code]
        .filter(Boolean)
        .join(" "),
    });
  }

  return options.sort((a, b) => a.value.localeCompare(b.value));
}
