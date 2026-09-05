export type MomentoColetaResumo = {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  dataReferencia: string;
  origemPadrao: "PLANILHA" | "MOBILE";
  totalPesquisas: number;
};

export type DashboardStats = {
  totalAlunos: number;
  totalFamilias: number;
  totalColetas: number;
  rendaMediaFamiliar: number;
  percentualComInternet: number;
  percentualComBeneficio: number;
  percentualComNee: number;
  frequenciaMediaGeral: number;
  tempoMedioDeslocamentoMin: number;
  momentos: MomentoColetaResumo[];
  rendaPorBairro: Array<{
    bairro: string;
    rendaMedia: number;
    familias: number;
  }>;
  transporteDistribuicao: Array<{ meio: string; total: number }>;
  frequenciaPorTurno: Array<{
    turno: string;
    frequenciaMedia: number;
    alunos: number;
  }>;
  beneficioDistribuicao: Array<{ beneficio: string; total: number }>;
};

export type AlunoListItem = {
  id: string;
  codigoAluno: string;
  nome: string;
  dataNascimento: string | null;
  sexo: string | null;
  cpf: string | null;
  familia: {
    id: string;
    codigoFamilia: string;
    endereco: string;
    bairro: string;
    comunidade: string;
    qtdMoradores: number;
    rendaFamiliarMensal: number;
    recebeBeneficioSocial: boolean;
    beneficioSocial: string | null;
    possuiInternetCasa: boolean;
    tipoAcessoInternet: string | null;
  };
  responsavel: {
    id: string;
    nome: string;
    parentesco: string;
    cpf: string | null;
    telefone: string | null;
    email: string | null;
  } | null;
  pesquisa: {
    id: string;
    meioTransporteEscola: string;
    tempoDeslocamentoMin: number;
    frequenciaEscolarPct: number;
    anoSerie: string;
    turno: string;
    necessidadeEducacionalEspecial: boolean;
    descricaoNecessidade: string | null;
    observacao: string | null;
    sincronizadoEm: string;
    momento: {
      id: string;
      codigo: string;
      titulo: string;
      dataReferencia: string;
      origemPadrao: "PLANILHA" | "MOBILE";
    };
  } | null;
};
