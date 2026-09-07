import {
  fetchCodigosLookup,
  type CodigosLookup,
} from "@/lib/api";
import { formatCurrencyDisplay } from "@/lib/masks";
import { isOnline } from "@/lib/sync";
import { listColetas } from "@/lib/storage";
import type { ColetaFormState } from "@/lib/types";

function norm(s: string): string {
  return s.trim().toUpperCase();
}

function isoToBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function lookupFromLocal(
  items: Awaited<ReturnType<typeof listColetas>>,
  params: { codigoAluno?: string; codigoFamilia?: string },
): CodigosLookup {
  const alu = params.codigoAluno ? norm(params.codigoAluno) : null;
  const fam = params.codigoFamilia ? norm(params.codigoFamilia) : null;

  let alunoHit = alu
    ? items.find((i) => norm(i.payload.aluno.codigoAluno) === alu)
    : undefined;
  let familiaHit = fam
    ? items.find((i) => norm(i.payload.familia.codigoFamilia) === fam)
    : undefined;

  if (!familiaHit && alunoHit) familiaHit = alunoHit;

  return {
    aluno: alunoHit
      ? {
          codigoAluno: alunoHit.payload.aluno.codigoAluno,
          nome: alunoHit.payload.aluno.nome,
          dataNascimento: alunoHit.payload.aluno.dataNascimento ?? null,
          sexo: alunoHit.payload.aluno.sexo ?? null,
          cpf: alunoHit.payload.aluno.cpf ?? null,
          codigoFamilia: alunoHit.payload.familia.codigoFamilia,
          responsavel: {
            nome: alunoHit.payload.responsavel.nome,
            parentesco: alunoHit.payload.responsavel.parentesco,
            cpf: alunoHit.payload.responsavel.cpf ?? null,
            telefone: alunoHit.payload.responsavel.telefone ?? null,
            email: alunoHit.payload.responsavel.email ?? null,
            escolaridade: alunoHit.payload.responsavel.escolaridade,
            situacaoOcupacional:
              alunoHit.payload.responsavel.situacaoOcupacional,
          },
        }
      : null,
    familia: familiaHit
      ? {
          codigoFamilia: familiaHit.payload.familia.codigoFamilia,
          endereco: familiaHit.payload.familia.endereco,
          bairro: familiaHit.payload.familia.bairro,
          comunidade: familiaHit.payload.familia.comunidade,
          tipoLocalidade: familiaHit.payload.familia.tipoLocalidade,
          qtdMoradores: familiaHit.payload.familia.qtdMoradores,
          rendaFamiliarMensal: familiaHit.payload.familia.rendaFamiliarMensal,
          recebeBeneficioSocial:
            familiaHit.payload.familia.recebeBeneficioSocial,
          beneficioSocial: familiaHit.payload.familia.beneficioSocial ?? null,
          possuiInternetCasa: familiaHit.payload.familia.possuiInternetCasa,
          tipoAcessoInternet:
            familiaHit.payload.familia.tipoAcessoInternet ?? null,
          qtdAlunos: items.filter(
            (i) =>
              norm(i.payload.familia.codigoFamilia) ===
              norm(familiaHit!.payload.familia.codigoFamilia),
          ).length,
        }
      : null,
  };
}

export async function buscarCadastroPorCodigo(params: {
  codigoAluno?: string;
  codigoFamilia?: string;
}): Promise<CodigosLookup> {
  const localItems = await listColetas();
  const fromLocal = lookupFromLocal(localItems, params);

  const online = await isOnline();
  if (!online) return fromLocal;

  try {
    const remote = await fetchCodigosLookup(params);
    return {
      aluno: remote.aluno ?? fromLocal.aluno,
      familia: remote.familia ?? fromLocal.familia,
    };
  } catch {
    return fromLocal;
  }
}

export function applyFamiliaLookupToForm(
  prev: ColetaFormState,
  familia: NonNullable<CodigosLookup["familia"]>,
): ColetaFormState {
  return {
    ...prev,
    codigoFamilia: familia.codigoFamilia,
    endereco: familia.endereco,
    bairro: familia.bairro,
    comunidade: familia.comunidade,
    tipoLocalidade: (familia.tipoLocalidade ??
      "") as ColetaFormState["tipoLocalidade"],
    qtdMoradores: String(familia.qtdMoradores),
    rendaFamiliarMensal: formatCurrencyDisplay(familia.rendaFamiliarMensal),
    recebeBeneficioSocial: familia.recebeBeneficioSocial,
    beneficioSocial: (familia.beneficioSocial ??
      "") as ColetaFormState["beneficioSocial"],
    possuiInternetCasa: familia.possuiInternetCasa,
    tipoAcessoInternet: (familia.tipoAcessoInternet ??
      "") as ColetaFormState["tipoAcessoInternet"],
  };
}

export function applyAlunoLookupToForm(
  prev: ColetaFormState,
  data: {
    aluno: NonNullable<CodigosLookup["aluno"]>;
    familia: NonNullable<CodigosLookup["familia"]> | null;
  },
): ColetaFormState {
  const { aluno, familia } = data;
  let next: ColetaFormState = {
    ...prev,
    codigoAluno: aluno.codigoAluno,
    nomeAluno: aluno.nome,
    dataNascimento: aluno.dataNascimento
      ? isoToBr(aluno.dataNascimento)
      : "",
    sexo: (aluno.sexo === "M" || aluno.sexo === "F" ? aluno.sexo : "") as
      | ""
      | "M"
      | "F",
    cpfAluno: aluno.cpf ?? "",
    codigoFamilia: aluno.codigoFamilia,
  };

  if (familia) {
    next = applyFamiliaLookupToForm(next, familia);
  }

  if (aluno.responsavel) {
    const r = aluno.responsavel;
    next = {
      ...next,
      nomeResponsavel: r.nome,
      parentesco: (r.parentesco ?? "") as ColetaFormState["parentesco"],
      cpfResponsavel: r.cpf ?? "",
      telefone: r.telefone ?? "",
      email: r.email ?? "",
      escolaridade: (r.escolaridade ?? "") as ColetaFormState["escolaridade"],
      situacaoOcupacional: (r.situacaoOcupacional ??
        "") as ColetaFormState["situacaoOcupacional"],
    };
  }

  return next;
}
