import { fetchCodigosLookup, type CodigosLookup } from "@/lib/api";
import { isOnline } from "@/lib/sync";
import { listColetas } from "@/lib/storage";
import type { ColetaPayload } from "@/lib/types";

export type UnicidadeResult =
  | { ok: true; warnings: string[] }
  | { ok: false; field?: "codigoAluno" | "codigoFamilia"; message: string };

function norm(s: string): string {
  return s.trim().toUpperCase();
}

export async function verificarUnicidadeCodigos(
  payload: ColetaPayload,
  options?: { excludeLocalId?: string },
): Promise<UnicidadeResult> {
  const codigoAluno = norm(payload.aluno.codigoAluno);
  const codigoFamilia = norm(payload.familia.codigoFamilia);
  const warnings: string[] = [];

  const local = await listColetas();
  for (const item of local) {
    if (options?.excludeLocalId && item.id === options.excludeLocalId) {
      continue;
    }
    const alu = norm(item.payload.aluno.codigoAluno);
    const fam = norm(item.payload.familia.codigoFamilia);

    if (alu === codigoAluno && fam !== codigoFamilia) {
      return {
        ok: false,
        field: "codigoAluno",
        message: `Código ${codigoAluno} já usado localmente com a família ${fam}.`,
      };
    }
    if (alu === codigoAluno) {
      warnings.push(
        `Código ${codigoAluno} já existe neste aparelho (${item.payload.aluno.nome}). Continuar atualiza esse cadastro.`,
      );
    } else if (fam === codigoFamilia) {
      warnings.push(
        `Código ${codigoFamilia} já existe neste aparelho. Continuar atualiza os dados da família.`,
      );
    }
  }

  const online = await isOnline();
  if (!online) {
    return { ok: true, warnings: [...new Set(warnings)] };
  }

  let remote: CodigosLookup;
  try {
    remote = await fetchCodigosLookup({ codigoAluno, codigoFamilia });
  } catch {
    // Sem lookup: não bloqueia gravação local; o POST ainda valida no servidor.
    return { ok: true, warnings: [...new Set(warnings)] };
  }

  if (
    remote.aluno &&
    norm(remote.aluno.codigoFamilia) !== codigoFamilia
  ) {
    return {
      ok: false,
      field: "codigoAluno",
      message: `Código ${codigoAluno} já está vinculado à família ${remote.aluno.codigoFamilia} (${remote.aluno.nome}).`,
    };
  }

  if (remote.aluno) {
    warnings.push(
      `Código ${codigoAluno} já cadastrado (${remote.aluno.nome}). Continuar atualiza o cadastro do aluno.`,
    );
  }
  if (remote.familia && !remote.aluno) {
    warnings.push(
      `Código ${codigoFamilia} já cadastrado (${remote.familia.bairro}${
        remote.familia.qtdAlunos
          ? `, ${remote.familia.qtdAlunos} aluno(s)`
          : ""
      }). Continuar atualiza os dados da família.`,
    );
  } else if (remote.familia && remote.aluno) {
    // Evita aviso duplicado genérico de família quando já avisamos do aluno
  }

  return { ok: true, warnings: [...new Set(warnings)] };
}
