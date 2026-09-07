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
  /** Entrevistas com questionário v2 (mobile novo) — base para indicadores novos. */
  totalColetasV2: number;
  /** Média da renda familiar mensal (unidade: família). */
  rendaMediaFamiliar: number;
  /** Mediana de (renda familiar ÷ moradores); unidade: família. */
  rendaPerCapitaMediana: number;
  /**
   * % de famílias com internet em casa.
   * Numerador: famílias com possuiInternetCasa; denominador: total de famílias.
   */
  percentualComInternet: number;
  /**
   * % de famílias com benefício social.
   * Numerador: recebeBeneficioSocial; denominador: total de famílias.
   */
  percentualComBeneficio: number;
  /**
   * % de entrevistas com NEE marcada.
   * Numerador: pesquisas com necessidadeEducacionalEspecial;
   * denominador: total de pesquisas (todas as origens/versões).
   */
  percentualComNee: number;
  /**
   * % de entrevistas do app com ≥1 barreira real (exceto NENHUMA).
   * Numerador: coletasV2ComBarreira; denominador: totalColetasV2.
   * Mantido para avisos; a análise principal vai no gráfico de barreiras.
   */
  percentualComBarreiraV2: number;
  /** Contagem absoluta do numerador de percentualComBarreiraV2. */
  coletasV2ComBarreira: number;
  /**
   * Média de frequenciaEscolarPct.
   * Denominador: entrevistas com frequência informada (planilha + app).
   */
  frequenciaEscolarMediaPct: number;
  /** Quantidade de entrevistas com frequência preenchida. */
  totalComFrequenciaInformada: number;
  /** Entrevistas com frequência < 75% (mínimo obrigatório em Manaus). */
  comFrequenciaAbaixo75: number;
  /**
   * % com frequência < 75%.
   * Denominador: totalComFrequenciaInformada.
   */
  percentualFrequenciaAbaixo75: number;
  /**
   * % com local adequado para estudar (localEstudo = SIM).
   * Denominador: entrevistas do app com localEstudo informado.
   */
  percentualLocalEstudoAdequado: number;
  totalLocalEstudoInformado: number;
  /**
   * % com acompanhamento familiar regular (Sempre).
   * Denominador: entrevistas do app com acompanhamento informado.
   */
  percentualAcompanhamentoRegular: number;
  totalAcompanhamentoInformado: number;
  /** Média de tempoDeslocamentoMin; unidade: entrevista (pesquisa). */
  tempoMedioDeslocamentoMin: number;
  /** Há entrevistas v1 e v2 — gráficos v2 devem avisar amostra parcial. */
  amostraV2Parcial: boolean;
  momentos: MomentoColetaResumo[];
  /** Famílias por faixa de renda familiar mensal (em SM). */
  rendaFamiliarFaixas: Array<{ faixa: string; total: number }>;
  /** Tipo de acesso à internet — unidade família (B-10). */
  internetAcessoDistribuicao: Array<{ tipo: string; total: number }>;
  /** Principais barreiras — só entrevistas v2; exclui NENHUMA (B-10). */
  barreirasDistribuicao: Array<{
    codigo: string;
    nome: string;
    total: number;
  }>;
  /** Apoio prioritário — só entrevistas v2 (B-10). */
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
