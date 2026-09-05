/** Payload alinhado a POST /api/coleta (docs/05-api-mobile.md) */

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
  qtdMoradores: number;
  rendaFamiliarMensal: number;
  recebeBeneficioSocial: boolean;
  beneficioSocial?: string | null;
  possuiInternetCasa: boolean;
  tipoAcessoInternet?: string | null;
};

export type AlunoPayload = {
  codigoAluno: string;
  nome: string;
  dataNascimento?: string | null;
  sexo?: "M" | "F" | null;
  cpf?: string | null;
};

export type ResponsavelPayload = {
  nome: string;
  parentesco: string;
  cpf?: string | null;
  telefone?: string | null;
  email?: string | null;
};

export type PesquisaPayload = {
  meioTransporteEscola: string;
  tempoDeslocamentoMin: number;
  frequenciaEscolarPct: number;
  anoSerie: string;
  turno: string;
  necessidadeEducacionalEspecial: boolean;
  descricaoNecessidade?: string | null;
  observacao?: string | null;
};

export type ColetaPayload = {
  momento: MomentoPayload;
  familia: FamiliaPayload;
  aluno: AlunoPayload;
  responsavel: ResponsavelPayload;
  pesquisa: PesquisaPayload;
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
  qtdMoradores: string;
  rendaFamiliarMensal: string;
  recebeBeneficioSocial: boolean;
  beneficioSocial: string;
  possuiInternetCasa: boolean;
  tipoAcessoInternet: string;
  codigoAluno: string;
  nomeAluno: string;
  dataNascimento: string;
  sexo: "" | "M" | "F";
  cpfAluno: string;
  nomeResponsavel: string;
  parentesco: string;
  cpfResponsavel: string;
  telefone: string;
  email: string;
  meioTransporteEscola: string;
  tempoDeslocamentoMin: string;
  frequenciaEscolarPct: string;
  anoSerie: string;
  turno: string;
  necessidadeEducacionalEspecial: boolean;
  descricaoNecessidade: string;
  observacao: string;
};
