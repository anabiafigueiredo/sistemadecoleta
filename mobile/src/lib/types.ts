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
  NecessidadeEducacionalValue,
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
  /** ISO YYYY-MM-DD (B-08). */
  dataNascimento: string;
  sexo?: "M" | "F" | null;
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
  frequenciaEscolarPct?: number | null;
  anoSerie: AnoSerieValue;
  turno: TurnoValue;
  necessidadeEducacionalEspecial: boolean;
  necessidadesEducacionais?: NecessidadeEducacionalValue[] | null;
  necessidadeOutraDescricao?: string | null;
  observacao?: string | null;
  equipamentosEstudo: EquipamentoEstudoValue[];
  disponibilidadeEquipamento: DisponibilidadeEquipamentoValue;
  localEstudo: LocalEstudoValue;
  acompanhamentoFamiliar: AcompanhamentoFamiliarValue;
  apoiosPrioritarios: ApoioPrioritarioValue[];
};

export type ColetaPayload = {
  momento: MomentoPayload;
  familia: FamiliaPayload;
  aluno: AlunoPayload;
  responsavel: ResponsavelPayload;
  pesquisa: PesquisaPayload;
  barreiras: BarreiraValue[];
};

export type ColetaLocal = {
  id: string;
  sincronizado: boolean;
  createdAt: string;
  updatedAt: string;
  lastError?: string | null;
  serverPesquisaId?: string | null;
  payload: ColetaPayload;
};

export type ColetaFormState = {
  momentoCodigo: "" | "T2" | "T3";
  codigoFamilia: string;
  endereco: string;
  bairro: string;
  comunidade: string;
  tipoLocalidade: TipoLocalidadeValue | "";
  qtdMoradores: string;
  rendaFamiliarMensal: string;
  /** null = ainda não respondido */
  recebeBeneficioSocial: boolean | null;
  beneficioSocial: BeneficioSocialValue | "";
  /** null = ainda não respondido */
  possuiInternetCasa: boolean | null;
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
  frequenciaEscolarPct: string;
  anoSerie: AnoSerieValue | "";
  turno: TurnoValue | "";
  /** null = ainda não respondido */
  necessidadeEducacionalEspecial: boolean | null;
  necessidadesEducacionais: NecessidadeEducacionalValue[];
  necessidadeOutraDescricao: string;
  observacao: string;
  equipamentosEstudo: EquipamentoEstudoValue[];
  disponibilidadeEquipamento: DisponibilidadeEquipamentoValue | "";
  localEstudo: LocalEstudoValue | "";
  acompanhamentoFamiliar: AcompanhamentoFamiliarValue | "";
  apoiosPrioritarios: ApoioPrioritarioValue[];
  barreiras: BarreiraValue[];
};
