import {
  FonteEstudo,
  EstudioFeature,
  Questao,
  AnotacaoItem,
  CotasState,
  User,
  Matricula,
  Pagamento,
  CodigoAcesso,
  Ticket,
  LogAuditoria,
  ConfiguracaoSistema,
  Lead,
  CampanhaCota,
} from '../types';

// Apenas 2 cadastros de teste: um admin com acesso total e um aluno comum.
export const TEST_USERS: User[] = [
  {
    id: 1,
    usuario: 'admin',
    senha: '123456',
    nome: 'Admin',
    email: 'admin@jpschool.ia',
    role: 'super_admin',
    turmaNome: 'Acesso Total ao Sistema',
  },
  {
    id: 2,
    usuario: 'jeanpierre',
    senha: '123456',
    nome: 'Jean Pierre',
    email: 'jeanpierre@jpschool.ia',
    role: 'cliente',
    turmaId: 1,
    turmaNome: 'SED ACT 2026',
    banca: 'FEPESE / ACAFE',
    dataProva: '2026-09-15',
    vigenciaFim: '2026-10-30',
    onboardingOk: true,
  },
];

// Collections para Dados Operacionais e Conteúdos Reais
export const MOCK_MATRICULAS: Matricula[] = [];
export const MOCK_PAGAMENTOS: Pagamento[] = [];
export const MOCK_CODIGOS_ACESSO: CodigoAcesso[] = [];
export const MOCK_TICKETS: Ticket[] = [];
export const MOCK_LOGS_AUDITORIA: LogAuditoria[] = [];

export const MOCK_CONFIGURACOES: ConfiguracaoSistema[] = [
  {
    chave: 'RETATIVIDADE_DIAS_PROVA',
    valor: '47',
    descricao: 'Dias contados até a prova oficial',
    categoria: 'geral',
    atualizadoPor: 'adminti',
    atualizadoEm: '2026-07-28T10:00:00Z',
  },
  {
    chave: 'SENHA_MIN_CARACTERES',
    valor: '6',
    descricao: 'Exigência mínima de caracteres na senha',
    categoria: 'seguranca',
    atualizadoPor: 'superadmin',
    atualizadoEm: '2026-07-30T00:00:00Z',
  },
  {
    chave: 'BLOQUEIO_TENTATIVAS_MAX',
    valor: '5',
    descricao: 'Limite de tentativas incorretas antes do bloqueio de 15 minutos',
    categoria: 'seguranca',
    atualizadoPor: 'superadmin',
    atualizadoEm: '2026-07-30T00:00:00Z',
  },
  {
    chave: 'GOOGLE_DRIVE_FOLDER_ID',
    valor: '',
    descricao: 'ID da pasta raiz do Google Drive contendo os Editais e materiais por Cargo/Curso',
    categoria: 'geral',
    atualizadoPor: 'superadmin',
    atualizadoEm: '2026-08-17T10:00:00Z',
  },
  {
    chave: 'GOOGLE_SERVICE_ACCOUNT_KEY',
    valor: '',
    descricao: 'Conteúdo JSON do arquivo de credenciais da Conta de Serviço do Google Cloud',
    categoria: 'seguranca',
    atualizadoPor: 'superadmin',
    atualizadoEm: '2026-08-17T10:00:00Z',
  },
  {
    chave: 'GEMINI_API_KEY',
    valor: '',
    descricao: 'Chave de API do Google Gemini PRO para acionar o Tutor de IA e RAG',
    categoria: 'seguranca',
    atualizadoPor: 'superadmin',
    atualizadoEm: '2026-08-17T10:00:00Z',
  },
];

export const MOCK_LEADS: Lead[] = [];
export const MOCK_CAMPANHAS_COTA: CampanhaCota[] = [];

// Regras de Segurança Onda 2 (Validação de Backend sem UI)
export function validarPoliticaSenha(senha: string): { valida: boolean; erro?: string } {
  if (!senha || senha.length < 6) {
    return { valida: false, erro: 'A senha deve conter no mínimo 6 caracteres.' };
  }
  const temLetraOuNumero = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(senha);
  if (!temLetraOuNumero) {
    return { valida: false, erro: 'A senha deve conter caracteres válidos.' };
  }
  return { valida: true };
}

// Rastreador em memória para tentativas de login (Backend Onda 2)
const loginAttemptTracker: Record<string, { tentativas: number; bloqueadoAte?: number }> = {};

export function verificarTentativasLogin(usuario: string): { permitido: boolean; tempoRestanteMinutos?: number } {
  const chave = usuario.toLowerCase();
  const registro = loginAttemptTracker[chave];
  const agora = Date.now();

  if (registro && registro.bloqueadoAte && agora < registro.bloqueadoAte) {
    const minutosRestantes = Math.ceil((registro.bloqueadoAte - agora) / 60000);
    return { permitido: false, tempoRestanteMinutos: minutosRestantes };
  }

  return { permitido: true };
}

export function registrarTentativaLoginFalha(usuario: string): { bloqueado: boolean; tentativasRestantes: number } {
  const chave = usuario.toLowerCase();
  const agora = Date.now();
  if (!loginAttemptTracker[chave]) {
    loginAttemptTracker[chave] = { tentativas: 0 };
  }

  loginAttemptTracker[chave].tentativas += 1;
  const tentativas = loginAttemptTracker[chave].tentativas;

  if (tentativas >= 5) {
    loginAttemptTracker[chave].bloqueadoAte = agora + 15 * 60 * 1000; // 15 minutos de bloqueio
    // Registrar log de auditoria
    MOCK_LOGS_AUDITORIA.push({
      id: MOCK_LOGS_AUDITORIA.length + 1,
      usuarioNome: usuario,
      acao: 'BLOQUEIO_TENTATIVAS_EXCEDIDAS',
      detalhes: `Usuário bloqueado por 15 minutos após 5 tentativas incorretas.`,
      criadoEm: new Date().toISOString(),
    });
    return { bloqueado: true, tentativasRestantes: 0 };
  }

  return { bloqueado: false, tentativasRestantes: 5 - tentativas };
}

export function resetarTentativasLogin(usuario: string) {
  delete loginAttemptTracker[usuario.toLowerCase()];
}

export const CURRENT_USER: User = TEST_USERS[1] || TEST_USERS[0]; // Aluno de teste (Jean Pierre) por padrão

export const INITIAL_COTAS: CotasState = {
  producoesUsadas: 0,
  producoesMax: 5,
  downloadsUsados: 0,
  downloadsMax: 5,
  resetTime: '00:00',
};

export const OFFICIAL_SOURCES: FonteEstudo[] = [
  {
    id: 1,
    titulo: 'LDB Lei 9.394/96 Comentada e Atualizada 2026',
    tipo: 'lei',
    banca: 'SED-SC',
    ano: 2026,
    materia: 'Legislação Educacional',
    selecionada: true,
    tamanho: '2.4 MB'
  },
  {
    id: 2,
    titulo: 'ECA Lei 8.069 Direitos Fundamentais da Criança',
    tipo: 'lei',
    banca: 'SED-SC',
    ano: 2026,
    materia: 'Legislação Educacional',
    selecionada: true,
    tamanho: '1.8 MB'
  },
  {
    id: 3,
    titulo: 'Estatuto do Magistério Público Estadual SC (LC 688)',
    tipo: 'lei',
    banca: 'SED-SC',
    ano: 2026,
    materia: 'Legislação Educacional',
    selecionada: true,
    tamanho: '3.1 MB'
  },
  {
    id: 4,
    titulo: 'Didática Geral e Tendências Pedagógicas Contemporâneas',
    tipo: 'apostila',
    banca: 'SED-SC',
    ano: 2026,
    materia: 'Didática e Currículo',
    selecionada: true,
    tamanho: '4.5 MB'
  },
  {
    id: 5,
    titulo: 'Provas Anteriores Resolvidas SED SC 2024-2025',
    tipo: 'prova',
    banca: 'SED-SC',
    ano: 2025,
    materia: 'Questões e Provas',
    selecionada: true,
    tamanho: '5.2 MB'
  }
];

export const FEATURES: EstudioFeature[] = [
  // Grupo 1: Essencial do Dia a Dia
  {
    id: 'plano_estudo',
    grupo: 'g1',
    nome: 'Gerar/Acompanhar Plano de Estudo',
    descricao: 'IA distribui os tópicos do edital na sua rotina diária até a prova.',
    icone: 'Calendar',
    kRag: 10,
    consomeCota: true,
    permiteFallback: true,
    badge: 'Essencial',
  },
  {
    id: 'simulado',
    grupo: 'g1',
    nome: 'Fazer Simulado (40 Questões)',
    descricao: 'Simulado completo no padrão exato da banca com cronômetro e score.',
    icone: 'FileCheck',
    kRag: 20,
    consomeCota: true,
    permiteFallback: true,
    badge: 'Primeiro Simulado',
  },
  {
    id: 'fazer_questoes',
    grupo: 'g1',
    nome: 'Fazer Questões',
    descricao: 'Escolha a matéria e treine com questões do acervo e inéditas.',
    icone: 'HelpCircle',
    kRag: 15,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'resumir',
    grupo: 'g1',
    nome: 'Resumir / Estudar Tópico',
    descricao: 'Síntese clara com conceito, base legal e aplicação em salas de aula de SC.',
    icone: 'BookOpen',
    kRag: 8,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'tirar_duvida',
    grupo: 'g1',
    nome: 'Tirar Dúvida (Tutor de IA)',
    descricao: 'Chat direto com o Tutor. Envie dúvidas por texto, áudio de voz ou foto de questão.',
    icone: 'MessageSquare',
    kRag: 6,
    consomeCota: true,
    permiteFallback: true,
  },

  // Grupo 2: Gerar Material de Estudo
  {
    id: 'flashcards',
    grupo: 'g2',
    nome: 'Cartões (Flashcards)',
    descricao: 'Gere cartões flipáveis de memorização rápida de leis e conceitos.',
    icone: 'Layers',
    kRag: 6,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'mapa_mental',
    grupo: 'g2',
    nome: 'Mapa Mental Interativo',
    descricao: 'Estrutura hierárquica visual em diagrama de nós para fixar conteúdos.',
    icone: 'GitFork',
    kRag: 6,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'resumo_audio',
    grupo: 'g2',
    nome: 'Resumo em Áudio (Roteiro + Voz)',
    descricao: 'Roteiro dinâmico e narração em áudio para ouvir no transporte ou pausa.',
    icone: 'Headphones',
    kRag: 8,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'resumo_video',
    grupo: 'g2',
    nome: 'Resumo de Vídeo/Aula',
    descricao: 'Insira o link ou arquivo da vídeo-aula e receba 5 pontos-chave e 3 pegadinhas.',
    icone: 'Video',
    kRag: 8,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'slides',
    grupo: 'g2',
    nome: 'Apresentação em Slides',
    descricao: 'Deck de 8 a 12 slides com notas de orador para revisões visuais rápidas.',
    icone: 'Presentation',
    kRag: 8,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'infografico',
    grupo: 'g2',
    nome: 'Infográfico Visual',
    descricao: 'Blocos visuais com números de destaque, comparações e linhas do tempo.',
    icone: 'LayoutGrid',
    kRag: 6,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'tabela_dados',
    grupo: 'g2',
    nome: 'Tabela de Dados Normativos',
    descricao: 'Organização comparativa de prazos, leis e artigos em tabela clara.',
    icone: 'Table',
    kRag: 6,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'relatorios',
    grupo: 'g2',
    nome: 'Relatórios de Desempenho & Heatmap',
    descricao: 'Análise de acertos e comparação anônima com margem de acerto de outros professores.',
    icone: 'BarChart3',
    kRag: 0,
    consomeCota: false,
    permiteFallback: false,
  },

  // Grupo 3: Avaliar e Corrigir
  {
    id: 'teste',
    grupo: 'g3',
    nome: 'Teste Rápido de Fixação',
    descricao: 'Bateria curta (10-15 questões) focada em um único assunto do edital.',
    icone: 'FlaskConical',
    kRag: 15,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'corrigir_redacao',
    grupo: 'g3',
    nome: 'Corrigir Redação/Discursiva',
    descricao: 'Envie texto ou foto da folha escrita. Avaliação por critérios do edital.',
    icone: 'FileEdit',
    kRag: 5,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'pontos_fracos',
    grupo: 'g3',
    nome: 'Meus Pontos Fracos',
    descricao: 'Diagnóstico dos seus erros cruzados com o que mais cai na banca.',
    icone: 'AlertTriangle',
    kRag: 0,
    consomeCota: false,
    permiteFallback: false,
  },

  // Grupo 4: Reta Final
  {
    id: 'glossario',
    grupo: 'g4',
    nome: 'Glossário da Banca',
    descricao: 'Termos recorrentes, vocabulário e padrão de escrita da FEPESE/ACAFE.',
    icone: 'BookMarked',
    kRag: 10,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'radar_pegadinhas',
    grupo: 'g4',
    nome: 'Radar de Pegadinhas',
    descricao: 'Análise detalhada das armadilhas mais comuns usadas nas provas de SC.',
    icone: 'Target',
    kRag: 20,
    consomeCota: true,
    permiteFallback: false, // EXCLUSIVO ACERVO
    badge: '100% Oficial',
  },
  {
    id: 'raio_x',
    grupo: 'g4',
    nome: 'Raio-X da Banca',
    descricao: 'Estatística real de incidência de cada assunto em provas anteriores.',
    icone: 'PieChart',
    kRag: 20,
    consomeCota: true,
    permiteFallback: false, // EXCLUSIVO ACERVO
    badge: '100% Oficial',
  },
  {
    id: 'checklist_vespera',
    grupo: 'g4',
    nome: 'Checklist de Véspera',
    descricao: 'Guia definitivo de tópicos cruciais para revisar nas 48h antes da prova.',
    icone: 'CheckSquare',
    kRag: 8,
    consomeCota: true,
    permiteFallback: true,
  },
  {
    id: 'questoes_500',
    grupo: 'g4',
    nome: '500 Questões de Reta Final',
    descricao: 'Acervo curado priorizando as questões mais cobradas da banca oficial.',
    icone: 'Flame',
    kRag: 0,
    consomeCota: true,
    permiteFallback: false, // EXCLUSIVO ACERVO
    badge: '100% Oficial',
  },
];

export const MOCK_QUESTIONS: Questao[] = [];

export const MOCK_ANNOTATIONS: AnotacaoItem[] = [];

export const WHITELIST_DOMAINS = [
  'planalto.gov.br',
  'sed.sc.gov.br',
  'mec.gov.br',
  'inep.gov.br',
  'alesc.sc.gov.br',
  'tce.sc.gov.br',
];
