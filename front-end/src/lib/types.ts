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
  totalColetasV2: number;
  rendaMediaFamiliar: number;
  /** Mediana de (renda ÷ moradores) por família. */
  rendaPerCapitaMediana: number;
  percentualComInternet: number;
  percentualComBeneficio: number;
  percentualComNee: number;
  /** v2 com ≥1 barreira real (exceto NENHUMA); aviso — gráfico é a fonte principal. */
  percentualComBarreiraV2: number;
  coletasV2ComBarreira: number;
  frequenciaEscolarMediaPct: number;
  totalComFrequenciaInformada: number;
  /** Frequência < 75% (mínimo obrigatório em Manaus). */
  comFrequenciaAbaixo75: number;
  percentualFrequenciaAbaixo75: number;
  percentualLocalEstudoAdequado: number;
  totalLocalEstudoInformado: number;
  percentualAcompanhamentoRegular: number;
  totalAcompanhamentoInformado: number;
  tempoMedioDeslocamentoMin: number;
  /** v1+v2 misturados — gráficos v2 devem avisar amostra parcial. */
  amostraV2Parcial: boolean;
  momentos: MomentoColetaResumo[];
  rendaFamiliarFaixas: Array<{ faixa: string; total: number }>;
  internetAcessoDistribuicao: Array<{ tipo: string; total: number }>;
  /** Só v2; exclui NENHUMA. */
  barreirasDistribuicao: Array<{
    codigo: string;
    nome: string;
    total: number;
  }>;
  apoioPrioritarioDistribuicao: Array<{ apoio: string; total: number }>;
  rendaPorBairro: Array<{
    bairro: string;
    rendaMedia: number;
    familias: number;
  }>;
  transporteDistribuicao: Array<{ meio: string; total: number }>;
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
    tipoLocalidade: string | null;
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
    escolaridade: string | null;
    situacaoOcupacional: string | null;
  } | null;
  pesquisa: {
    id: string;
    origem: "PLANILHA" | "MOBILE";
    versaoQuestionario: number;
    meioTransporteEscola: string;
    tempoDeslocamentoMin: number;
    frequenciaEscolarPct: number | null;
    anoSerie: string;
    turno: string;
    necessidadeEducacionalEspecial: boolean;
    descricaoNecessidade: string | null;
    observacao: string | null;
    equipamentoEstudo: string | null;
    disponibilidadeEquipamento: string | null;
    localEstudo: string | null;
    acompanhamentoFamiliar: string | null;
    apoioPrioritario: string | null;
    barreiras: Array<{ codigo: string; nome: string }>;
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
