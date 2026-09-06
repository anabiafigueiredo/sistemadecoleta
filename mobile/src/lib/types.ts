/** Payload alinhado a POST /api/coleta */

import type {
  AcompanhamentoFamiliarValue,
  AnoSerieValue,
  ApoioPrioritarioValue,
  BarreiraValue,
  BeneficioSocialValue,
  DisponibilidadeEquipamentoValue,
  EquipamentoEstudoValue,
  EscolaridadeValue,
  LocalEstudoValue,
  MeioTransporteValue,
  ParentescoValue,
  SituacaoOcupacionalValue,
  TipoAcessoInternetValue,
  TipoLocalidadeValue,
  TurnoValue,
} from "@/lib/opcoes-questionario";

export type MomentoPayload = {
  codigo: string;
  titulo?: string;
  dataReferencia?: string;
};

export type FamiliaPayload = {
  codigoFamilia: string;
  endereco: string;
  bairro: string;
  comunidade: string;
  tipoLocalidade: TipoLocalidadeValue;
  qtdMoradores: number;
  rendaFamiliarMensal: number;
  recebeBeneficioSocial: boolean;
  beneficioSocial?: BeneficioSocialValue | null;
  possuiInternetCasa: boolean;
  tipoAcessoInternet?: TipoAcessoInternetValue | null;
};

export type AlunoPayload = {
  codigoAluno: string;
  nome: string;
  /** ISO YYYY-MM-DD — obrigatório nas coletas mobile (B-08). */
  dataNascimento: string;
  /** Opcional estruturado (M/F). */
  sexo?: "M" | "F" | null;
  /** Opcional; quando informado, deve ser CPF válido. */
  cpf?: string | null;
};

export type ResponsavelPayload = {
  nome: string;
  parentesco: ParentescoValue;
  cpf?: string | null;
  telefone?: string | null;
  email?: string | null;
  escolaridade: EscolaridadeValue;
  situacaoOcupacional: SituacaoOcupacionalValue;
};

export type PesquisaPayload = {
  meioTransporteEscola: MeioTransporteValue;
  tempoDeslocamentoMin: number;
  /** Sempre null nas coletas mobile — dado administrativo. */
  frequenciaEscolarPct?: number | null;
  anoSerie: AnoSerieValue;
  turno: TurnoValue;
  necessidadeEducacionalEspecial: boolean;
  descricaoNecessidade?: string | null;
  observacao?: string | null;
  equipamentoEstudo: EquipamentoEstudoValue;
  disponibilidadeEquipamento: DisponibilidadeEquipamentoValue;
  localEstudo: LocalEstudoValue;
  acompanhamentoFamiliar: AcompanhamentoFamiliarValue;
  apoioPrioritario: ApoioPrioritarioValue;
};

export type ColetaPayload = {
  momento: MomentoPayload;
  familia: FamiliaPayload;
  aluno: AlunoPayload;
  responsavel: ResponsavelPayload;
  pesquisa: PesquisaPayload;
  /** Códigos do catálogo de barreiras (v2). */
  barreiras: BarreiraValue[];
};

/** Registro local (offline-first) */
export type ColetaLocal = {
  id: string;
  sincronizado: boolean;
  createdAt: string;
  updatedAt: string;
  lastError?: string | null;
  serverPesquisaId?: string | null;
  payload: ColetaPayload;
};

/** Estado visual do formulário (strings + flags) */
export type ColetaFormState = {
  momentoCodigo: "T2" | "T3";
  codigoFamilia: string;
  endereco: string;
  bairro: string;
  comunidade: string;
  tipoLocalidade: TipoLocalidadeValue | "";
  qtdMoradores: string;
  rendaFamiliarMensal: string;
  recebeBeneficioSocial: boolean;
  beneficioSocial: BeneficioSocialValue | "";
  possuiInternetCasa: boolean;
  tipoAcessoInternet: TipoAcessoInternetValue | "";
  codigoAluno: string;
  nomeAluno: string;
  dataNascimento: string;
  sexo: "" | "M" | "F";
  cpfAluno: string;
  nomeResponsavel: string;
  parentesco: ParentescoValue | "";
  cpfResponsavel: string;
  telefone: string;
  email: string;
  escolaridade: EscolaridadeValue | "";
  situacaoOcupacional: SituacaoOcupacionalValue | "";
  meioTransporteEscola: MeioTransporteValue | "";
  tempoDeslocamentoMin: string;
  anoSerie: AnoSerieValue | "";
  turno: TurnoValue | "";
  necessidadeEducacionalEspecial: boolean;
  descricaoNecessidade: string;
  observacao: string;
  equipamentoEstudo: EquipamentoEstudoValue | "";
  disponibilidadeEquipamento: DisponibilidadeEquipamentoValue | "";
  localEstudo: LocalEstudoValue | "";
  acompanhamentoFamiliar: AcompanhamentoFamiliarValue | "";
  apoioPrioritario: ApoioPrioritarioValue | "";
  barreiras: BarreiraValue[];
};
