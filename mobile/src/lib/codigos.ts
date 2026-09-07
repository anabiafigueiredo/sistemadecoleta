import { API_URL } from "@/lib/config";
import { isOnline } from "@/lib/sync";
import { listColetas } from "@/lib/storage";

export type CodigosGerados = {
  codigoFamilia: string;
  codigoAluno: string;
};

function nextFromCodes(codes: string[], prefix: "FAM" | "ALU"): string {
  const re = new RegExp(`^${prefix}-(\\d+)$`, "i");
  let max = 0;
  for (const raw of codes) {
    const m = re.exec(raw.trim());
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  const next = max + 1;
  const width = prefix === "FAM" ? 3 : 4;
  return `${prefix}-${String(next).padStart(width, "0")}`;
}

async function localSequences(): Promise<{ fam: string; alu: string }> {
  const items = await listColetas();
  const famCodes = items.map((i) => i.payload.familia.codigoFamilia);
  const aluCodes = items.map((i) => i.payload.aluno.codigoAluno);

  if (famCodes.length === 0 && aluCodes.length === 0) {
    const n = Date.now();
    return {
      fam: `FAM-${String(n).slice(-6)}`,
      alu: `ALU-${String(n).slice(-7)}`,
    };
  }

  return {
    fam: nextFromCodes(famCodes, "FAM"),
    alu: nextFromCodes(aluCodes, "ALU"),
  };
}

async function fetchProximosRemotos(): Promise<CodigosGerados | null> {
  try {
    const res = await fetch(`${API_URL}/api/codigos/proximo`);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: CodigosGerados;
      error?: { message: string };
    };
    if (!json.data?.codigoFamilia || !json.data?.codigoAluno) return null;
    return json.data;
  } catch {
    return null;
  }
}

async function proximosDisponiveis(): Promise<CodigosGerados> {
  const online = await isOnline();
  if (online) {
    const remote = await fetchProximosRemotos();
    if (remote) return remote;
  }
  const local = await localSequences();
  return { codigoFamilia: local.fam, codigoAluno: local.alu };
}

/**
 * Próximo código livre, pulando os já exibidos no formulário (ainda não salvos).
 * Assim “Gerar de novo” avança a cada toque.
 */
function avancarApos(
  candidato: string,
  prefix: "FAM" | "ALU",
  evitar: readonly string[] = [],
): string {
  return nextFromCodes([candidato, ...evitar], prefix);
}

/** Gera só o próximo código de aluno (mantém família intacta no formulário). */
export async function gerarCodigoAluno(opts?: {
  evitar?: readonly string[];
}): Promise<string> {
  const base = (await proximosDisponiveis()).codigoAluno;
  return avancarApos(base, "ALU", opts?.evitar);
}

/** Gera só o próximo código de família. */
export async function gerarCodigoFamilia(opts?: {
  evitar?: readonly string[];
}): Promise<string> {
  const base = (await proximosDisponiveis()).codigoFamilia;
  return avancarApos(base, "FAM", opts?.evitar);
}

/** Online: sequência do servidor. Offline: sequência local. */
export async function gerarCodigos(opts?: {
  evitarFamilia?: readonly string[];
  evitarAluno?: readonly string[];
}): Promise<CodigosGerados> {
  const base = await proximosDisponiveis();
  return {
    codigoFamilia: avancarApos(base.codigoFamilia, "FAM", opts?.evitarFamilia),
    codigoAluno: avancarApos(base.codigoAluno, "ALU", opts?.evitarAluno),
  };
}
