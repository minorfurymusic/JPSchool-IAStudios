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

export const TEST_USERS: User[] = [
  {
    id: 0,
    usuario: 'superadmin',
    senha: '123456',
    nome: 'Super Admin Master',
    email: 'superadmin@jpschool.ia',
    role: 'super_admin',
    turmaNome: 'Acesso Total ao Sistema',
  },
  {
    id: 1,
    usuario: 'admin',
    senha: '123456',
    nome: 'Admin',
    email: 'admin@jpschool.ia',
    role: 'admin',
    turmaNome: 'Gestão de Conteúdo',
  },
  {
    id: 2,
    usuario: 'adminti',
    senha: '123456',
    nome: 'Admin TI',
    email: 'adminti@jpschool.ia',
    role: 'ti',
    turmaNome: 'Edição de Layout & Site',
  },
  {
    id: 3,
    usuario: 'jeanrsl',
    senha: '123456',
    nome: 'Jean RSL',
    email: 'jeanrsl@jpschool.ia',
    role: 'cliente',
    turmaId: 1,
    turmaNome: 'SED ACT 2026',
    banca: 'FEPESE / ACAFE',
    dataProva: '2026-09-15',
    vigenciaFim: '2026-10-30',
    onboardingOk: true,
  },
];

// Collections for Onda 1 (Modelo de Dados do Contrato v2)
export const MOCK_MATRICULAS: Matricula[] = [
  {
    id: 1,
    usuarioId: 3,
    usuarioNome: 'Jean RSL',
    cursoId: 101,
    cursoNome: 'Professor de Educação Básica - SED/SC 2026',
    status: 'ativa',
    dataInicio: '2026-01-15',
    dataFim: '2026-10-30',
    origem: 'compra',
  },
];

export const MOCK_PAGAMENTOS: Pagamento[] = [
  {
    id: 1,
    usuarioId: 3,
    usuarioNome: 'Jean RSL',
    planoId: 'plano-reta-final',
    valor_centavos: 49700,
    parcelas: 10,
    metodo: 'pix',
    status: 'aprovado',
    gateway: 'mercadopago',
    transacaoId: 'MP-984210398',
    criadoEm: '2026-01-15T10:30:00Z',
  },
];

export const MOCK_CODIGOS_ACESSO: CodigoAcesso[] = [
  {
    id: 1,
    codigo: 'JP-TRIAL-7DIAS',
    tipo: 'trial',
    diasValidade: 7,
    usado: false,
    criadoEm: '2026-07-01T12:00:00Z',
    cursoId: 101,
    criadoPor: 'superadmin',
  },
  {
    id: 2,
    codigo: 'JP-CORTESIA-30D',
    tipo: 'cortesia',
    diasValidade: 30,
    usado: true,
    usadoPorUsuarioId: 3,
    usadoEm: '2026-07-10T14:22:00Z',
    criadoEm: '2026-07-01T12:00:00Z',
    cursoId: 101,
    criadoPor: 'admin',
  },
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 1,
    usuarioId: 3,
    usuarioNome: 'Jean RSL',
    assunto: 'Dúvida sobre simulado inédito',
    mensagem: 'Olá, gostaria de saber se as questões do simulado possuem comentário em áudio.',
    status: 'resolvido',
    prioridade: 'media',
    respostas: [
      {
        autor: 'Suporte JPSchool',
        mensagem: 'Olá Jean! Sim, todas as questões possuem comentário detalhado.',
        criadoEm: '2026-07-20T11:00:00Z',
      }
    ],
    criadoEm: '2026-07-20T09:15:00Z',
  },
];

export const MOCK_LOGS_AUDITORIA: LogAuditoria[] = [
  {
    id: 1,
    usuarioId: 0,
    usuarioNome: 'Super Admin Master',
    papel: 'super_admin',
    acao: 'SISTEMA_INICIALIZADO',
    detalhes: 'Estruturas de dados Onda 1 inicializadas conforme contrato v2',
    dadosAntes: {},
    dadosDepois: { versaoContrato: 'v2' },
    ip: '127.0.0.1',
    criadoEm: new Date().toISOString(),
  },
];

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
];

export const MOCK_LEADS: Lead[] = [
  {
    id: 1,
    nome: 'Carlos Eduardo',
    email: 'carlos.eduardo@gmail.com',
    telefone: '(48) 99887-6655',
    origem: 'site_vendas',
    status: 'novo',
    criadoEm: '2026-07-29T18:40:00Z',
    cursoInteresseId: 101,
  },
];

export const MOCK_CAMPANHAS_COTA: CampanhaCota[] = [
  {
    id: 1,
    nome: 'Maratona Reta Final SED-SC',
    overrideProducoesMax: 10,
    overrideDownloadsMax: 10,
    dataInicio: '2026-08-01',
    dataFim: '2026-08-10',
    ativa: true,
    cursoId: 101,
  },
];

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

export const CURRENT_USER: User = TEST_USERS[2]; // Default to Cliente (jeanrsl)

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
    titulo: 'Edital de Abertura SED-SC N° 021/2026 (Processo Seletivo ACT)',
    tipo: 'edital',
    banca: 'ACAFE/FEPESE',
    ano: 2026,
    materia: 'Legislação Educacional',
    categoriaId: 'cat-leg-educ',
    selecionada: true,
    tamanho: '1.4 MB',
  },
  {
    id: 2,
    titulo: 'Lei Complementar N° 688/SC - Estatuto e Carreira do Magistério Público Estadual',
    tipo: 'lei',
    banca: 'SED-SC',
    ano: 2024,
    materia: 'Estatuto do Servidor',
    categoriaId: 'cat-estatuto',
    selecionada: true,
    tamanho: '2.8 MB',
  },
  {
    id: 3,
    titulo: 'Lei Federal N° 9.394/96 - LDB Atualizada com Alterações para 2026',
    tipo: 'lei',
    banca: 'MEC/Nacional',
    ano: 2026,
    materia: 'Legislação Educacional',
    categoriaId: 'cat-leg-educ',
    selecionada: true,
    tamanho: '3.1 MB',
  },
  {
    id: 4,
    titulo: 'Currículo Base da Educação Infantil e Ensino Fundamental do Território Catarinense',
    tipo: 'apostila',
    banca: 'SED-SC',
    ano: 2025,
    materia: 'Didática e Currículo SC',
    categoriaId: 'cat-didatica',
    selecionada: true,
    tamanho: '8.5 MB',
  },
  {
    id: 5,
    titulo: 'Prova Oficial Anterior - SED-SC 2024 (Prof. Anos Iniciais / Português / Didática)',
    tipo: 'prova',
    banca: 'FEPESE',
    ano: 2024,
    materia: 'Provas Anteriores',
    categoriaId: 'cat-provas',
    selecionada: true,
    tamanho: '4.2 MB',
  },
  {
    id: 6,
    titulo: 'Prova Oficial Anterior - Prefeituras de Florianópolis e Joinville 2025',
    tipo: 'prova',
    banca: 'IBADE/FEPESE',
    ano: 2025,
    materia: 'Provas Anteriores',
    categoriaId: 'cat-provas',
    selecionada: false,
    tamanho: '3.9 MB',
  },
  {
    id: 7,
    titulo: 'Acervo de Mapas Mentais Prontos - Tendências Pedagógicas e Estatuto da Criança',
    tipo: 'mapa_pronto',
    banca: 'JPSchool Collection',
    ano: 2026,
    materia: 'Didática e Currículo',
    categoriaId: 'cat-didatica',
    selecionada: false,
    tamanho: '5.0 MB',
  },
  {
    id: 8,
    titulo: 'Manual de Gramática e Sintaxe Aplicada às Bancas FEPESE e ACAFE',
    tipo: 'apostila',
    banca: 'FEPESE/ACAFE',
    ano: 2026,
    materia: 'Língua Portuguesa',
    categoriaId: 'cat-portugues',
    selecionada: true,
    tamanho: '3.4 MB',
  },
  {
    id: 9,
    titulo: 'Resumo de História e Geografia de Santa Catarina - Aspectos Regionais e Sociais',
    tipo: 'apostila',
    banca: 'SED-SC',
    ano: 2025,
    materia: 'História e Geografia de SC',
    categoriaId: 'cat-hist-geo-sc',
    selecionada: false,
    tamanho: '2.1 MB',
  },
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

export const MOCK_QUESTIONS: Questao[] = [
  {
    id: 1,
    banca: 'FEPESE',
    ano: 2024,
    materia: 'Legislação SC',
    assunto: 'Lei Complementar 688/SC - Carreira do Magistério',
    enunciado: 'Segundo a Lei Complementar Estadual nº 688/SC, o Estágio Probatório do professor contratado ou efetivado na Rede Estadual de Ensino de Santa Catarina tem duração de quantos anos e inclui qual avaliação periódica obrigatoriamente?',
    alternativas: [
      'A) 2 anos, com avaliação semestral efetuada exclusivamente pela Direção Escolar.',
      'B) 3 anos, com avaliação especial de desempenho realizada por comissão constituída para essa finalidade.',
      'C) 5 anos, sem exigência de relatório final de desempenho funcional.',
      'D) 3 anos, com avaliação realizada unicamente através de prova teórica anual.',
      'E) 1 ano, renovável automaticamente em caso de concordância do Conselho Escolar.'
    ],
    gabaritoIndex: 1,
    comentario: 'Gabarito B: Conforme prevê a LC 688/SC e a CF/88, o estágio probatório possui a duração de 3 anos (36 meses), durante os quais a aptidão e capacidade do servidor são avaliadas por comissão especial de desempenho.',
    pegadinhaTipo: 'troca de prazos e órgãos avaliadores',
    taxaAcertoGeral: 68.4,
    origem: 'acervo',
  },
  {
    id: 2,
    banca: 'ACAFE',
    ano: 2024,
    materia: 'Didática e Currículo SC',
    assunto: 'Currículo Base do Território Catarinense',
    enunciado: 'O Currículo Base da Educação Infantil e Ensino Fundamental do Território Catarinense fundamenta-se nos princípios da Educação Integral. Sobre a concepção de Educação Integral adotada no documento, assinale a alternativa CORRETA:',
    alternativas: [
      'A) Refere-se estritamente ao aumento da jornada escolar de 4 para 7 horas diárias.',
      'B) Compreende o sujeito em suas dimensões cognitiva, afetiva, social, cultural e física, promovendo o desenvolvimento humano pleno.',
      'C) Prioriza as disciplinas teóricas em detrimento das atividades culturais e artísticas.',
      'D) Aplica-se exclusivamente aos anos finais do Ensino Fundamental e ao Ensino Médio.',
      'E) Substitui a Matriz Curricular por oficinas optativas sem vinculação às competências da BNCC.'
    ],
    gabaritoIndex: 1,
    comentario: 'Gabarito B: A Educação Integral no Currículo Base de SC não se reduz ao tempo de permanência na escola, mas expressa a formação multidimensional do estudante em todas as suas facetas.',
    pegadinhaTipo: 'Redução do conceito multidimensional para mero aumento de carga horária',
    taxaAcertoGeral: 79.2,
    origem: 'acervo',
  },
  {
    id: 3,
    banca: 'FEPESE',
    ano: 2025,
    materia: 'Legislação Educacional',
    assunto: 'LDB 9.394/96 - Art. 13 (Incumbências dos Docentes)',
    enunciado: 'Nos termos do artigo 13 da LDB (Lei nº 9.394/1996), compete aos docentes, DENTRE OUTRAS INCUMBÊNCIAS:',
    alternativas: [
      'A) Elaborar e executar a proposta pedagógica da escola sem a participação da comunidade docente.',
      'B) Administrar o patrimônio financeiro e os recursos do Fundo de Manutenção da Escola.',
      'C) Participar da elaboração da proposta pedagógica do estabelecimento de ensino e zelar pelo aprendizado dos alunos.',
      'D) Deferir pedidos de transferência de matrícula e expedir diplomas estaduais.',
      'E) Fiscalizar presencialmente a frequência dos pais nos locais de trabalho.'
    ],
    gabaritoIndex: 2,
    comentario: 'Gabarito C: O Artigo 13, inciso I e III da LDB, estipula explicitamente a participação na proposta pedagógica e o zelo pelo aprendizado dos educandos como dever primordial do professor.',
    pegadinhaTipo: 'Atribuir funções administrativas/gestoras ao corpo docente',
    taxaAcertoGeral: 84.1,
    origem: 'acervo',
  },
  {
    id: 4,
    banca: 'FEPESE',
    ano: 2024,
    materia: 'Didática',
    assunto: 'Tendências Pedagógicas na Prática Escolar',
    enunciado: 'Dentre as tendências pedagógicas progressistas, aquela que concebe a educação como um instrumento de transformação social e emancipação crítica a partir da problematização da realidade do educando é denominada:',
    alternativas: [
      'A) Pedagogia Liberal Tradicional.',
      'B) Pedagogia Liberal Tecnicista.',
      'C) Pedagogia Progressista Libertadora (Paulo Freire).',
      'D) Pedagogia Liberal Renovada Não-Diretiva (Carl Rogers).',
      'E) Pedagogia Tradicional Escolanovista.'
    ],
    gabaritoIndex: 2,
    comentario: 'Gabarito C: A Pedagogia Libertadora fundamenta-se na conscientização crítica e na problematização da realidade social, tendo Paulo Freire como principal expoente.',
    pegadinhaTipo: 'Confusão entre correntes Liberais e Progressistas',
    taxaAcertoGeral: 62.5,
    origem: 'acervo',
  },
  {
    id: 5,
    banca: 'IBADE',
    ano: 2025,
    materia: 'Legislação SC',
    assunto: 'Estatuto da Criança e do Adolescente (ECA) - Acesso à Educação',
    enunciado: 'De acordo com o Estatuto da Criança e do Adolescente (Lei nº 8.069/1990), ao constatar casos de maus-tratos ou reiteração de faltas injustificadas de alunos, os dirigentes de estabelecimentos de ensino fundamental deverão comunicar a qual órgão prioritário?',
    alternativas: [
      'A) Ao Ministério da Educação (MEC).',
      'B) Ao Conselho Tutelar da respectiva localidade.',
      'C) À Secretaria de Estado da Fazenda.',
      'D) Ao Tribunal de Justiça Eleitoral.',
      'E) Ao Sindicato dos Trabalhadores em Educação.'
    ],
    gabaritoIndex: 1,
    comentario: 'Gabarito B: O Art. 56 do ECA impõe aos dirigentes escolares a obrigação de notificar o Conselho Tutelar em casos de maus-tratos, faltas injustificadas e evasão escolar.',
    pegadinhaTipo: 'Substituição do Conselho Tutelar por órgãos burocráticos ou federais',
    taxaAcertoGeral: 91.0,
    origem: 'acervo',
  }
];

export const MOCK_ANNOTATIONS: AnotacaoItem[] = [];

export const WHITELIST_DOMAINS = [
  'planalto.gov.br',
  'sed.sc.gov.br',
  'mec.gov.br',
  'inep.gov.br',
  'alesc.sc.gov.br',
  'tce.sc.gov.br',
];
