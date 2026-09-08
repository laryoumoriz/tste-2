
export enum Section {
  CONFIG = 'Configurações',
  PREAMBULO = '1. Preâmbulo',
  HISTORICO = '2. Histórico',
  DESCRICAO = '3. Descrição',
  DISCUSSAO = '4. Discussão',
  CONCLUSAO = '5. Conclusões',
  QUESITOS = '6. Quesitos',
  ENCERRAMENTO = '7. Encerramento',
  PREVIEW = 'Visualizar PDF',
}

export interface Quesito {
  id: string;
  number: number;
  question: string;
  answer: string;
}

export interface ReportData {
  // Config
  folderNumber: string; // Pasta IMC
  peritoName: string;
  peritoCrm: string;
  logoUrl: string | null;

  // 1. Preâmbulo
  processo: {
    autoridade: string;
    numero: string;
    natureza: string;
    registroImc: string;
    registroImesc?: string;
    dataPericia: string;
    assistentes: string;
    requerente: {
      nome: string;
      nascimento: string;
      naturalidade: string;
      rg: string;
      cpf: string;
      sexo: string;
      filiacao: string;
      endereco: string;
    };
    requerido: string;
  };
  
  // 1.2 Dados do Perito (Rich Text or standard block)
  peritoIntro: string;

  // 1.3 - 1.5
  resumoExordial: string;
  resumoContestacao: string;
  despachoSaneador: string;

  // 2. Histórico
  historico: {
    contexto: string;
    anamnese: string;
    antecedentesPessoais: string;
    antecedentesFamiliares: string;
    antecedentesSocio: string;
    documentosLegais: string;
  };

  // 3. Descrição
  exameFisicoGeral: string;
  exameFisicoEspecifico: string;

  // 4. Discussão
  metodoTecnica: string;
  literatura: string;
  contextualizacao: string;

  // 5. Conclusão
  conclusao: string;

  // 6. Quesitos
  quesitosJuizo: Quesito[];
  quesitosRequerente: Quesito[];
  quesitosRequerido: Quesito[];
}

export const INITIAL_REPORT_DATA: ReportData = {
  folderNumber: '',
  peritoName: '',
  peritoCrm: '',
  logoUrl: null,
  processo: {
    autoridade: '',
    numero: '',
    natureza: '',
    registroImc: '',
    dataPericia: new Date().toISOString().split('T')[0],
    assistentes: '',
    requerente: {
      nome: '',
      nascimento: '',
      naturalidade: '',
      rg: '',
      cpf: '',
      sexo: '',
      filiacao: '',
      endereco: '',
    },
    requerido: '',
  },
  peritoIntro: 'Dr. Ricardo dos Santos Zuza, médico, com residência médica e pós-graduação em medicina legal...',
  resumoExordial: 'Nada consta.',
  resumoContestacao: 'Nada consta.',
  despachoSaneador: 'Nada consta.',
  historico: {
    contexto: '',
    anamnese: 'Periciando comparece ao exame...',
    antecedentesPessoais: 'Nega comorbidades crônicas.',
    antecedentesFamiliares: 'Pais vivos e saudáveis.',
    antecedentesSocio: 'Nega tabagismo ou etilismo.',
    documentosLegais: 'Vide anexo.',
  },
  exameFisicoGeral: 'Bom estado geral, eupneico, corado, hidratado.',
  exameFisicoEspecifico: 'Sem particularidades ao exame segmentar.',
  metodoTecnica: 'Exame clínico pericial direto e análise documental.',
  literatura: 'Tratado de Medicina Legal.',
  contextualizacao: '',
  conclusao: 'Conclui-se que não há elementos para caracterizar...',
  quesitosJuizo: [],
  quesitosRequerente: [],
  quesitosRequerido: [],
};
