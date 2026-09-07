import { fetchAlunos } from "@/lib/api";
import { listColetas } from "@/lib/storage";
import { isOnline } from "@/lib/sync";

export type CadastroSelectOption = {
  value: string;
  label: string;
};

function norm(s: string): string {
  return s.trim().toUpperCase();
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
    byCode.set(code, {
      value: code,
      label: `${code} — ${item.payload.aluno.nome} · ${item.payload.familia.codigoFamilia}`,
    });
  }

  if (await isOnline()) {
    try {
      const alunos = await fetchAlunos();
      for (const a of alunos) {
        const code = norm(a.codigoAluno);
        if (!code) continue;
        byCode.set(code, {
          value: code,
          label: `${code} — ${a.nome} · ${a.familia.codigoFamilia}`,
        });
      }
    } catch {
      // mantém só a lista local
    }
  }

  return [...byCode.values()].sort((a, b) => a.value.localeCompare(b.value));
}

/** Opções de famílias (servidor via alunos + fila local). */
export async function listarOpcoesFamiliasExistentes(): Promise<
  CadastroSelectOption[]
> {
  const byCode = new Map<string, CadastroSelectOption>();

  const local = await listColetas();
  for (const item of local) {
    const code = norm(item.payload.familia.codigoFamilia);
    if (!code) continue;
    byCode.set(code, {
      value: code,
      label: `${code} — ${item.payload.familia.bairro}${
        item.payload.familia.comunidade
          ? ` · ${item.payload.familia.comunidade}`
          : ""
      }`,
    });
  }

  if (await isOnline()) {
    try {
      const alunos = await fetchAlunos();
      const counts = new Map<string, number>();
      const meta = new Map<
        string,
        { bairro: string; comunidade: string }
      >();
      for (const a of alunos) {
        const code = norm(a.familia.codigoFamilia);
        counts.set(code, (counts.get(code) ?? 0) + 1);
        meta.set(code, {
          bairro: a.familia.bairro,
          comunidade: a.familia.comunidade,
        });
      }
      for (const [code, n] of counts) {
        const m = meta.get(code)!;
        byCode.set(code, {
          value: code,
          label: `${code} — ${m.bairro}${
            m.comunidade ? ` · ${m.comunidade}` : ""
          } · ${n} aluno(s)`,
        });
      }
    } catch {
      // mantém só a lista local
    }
  }

  return [...byCode.values()].sort((a, b) => a.value.localeCompare(b.value));
}
