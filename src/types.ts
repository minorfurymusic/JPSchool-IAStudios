export type UserRole = 'super_admin' | 'admin' | 'ti' | 'cliente';

export interface User {
  id: number;
  usuario: string;
  senha?: string;
  nome: string;
  email: string;
  role: UserRole;
  turmaId?: number;
  turmaNome?: string;
  banca?: string;
  dataProva?: string; // YYYY-MM-DD
  vigenciaFim?: string;
  onboardingOk?: boolean;
}

// Onda 1: Novas Entidades do Contrato v2
export interface Matricula {
  id: number;
  usuarioId: number;
  usuarioNome: string;
  cursoId: number;
  cursoNome: string;
  status: 'ativa' | 'cancelada' | 'expirada' | 'suspensa' | 'trial';
  dataInicio: string; // ISO date YYYY-MM-DD
  dataFim: string; // ISO date YYYY-MM-DD
  origem: 'compra' | 'codigo_acesso' | 'manual';
}

export interface Pagamento {
  id: number;
  usuarioId: number;
  usuarioNome: string;
  planoId: string;
  valor_centavos: number;
  parcelas: number;
  metodo: 'pix' | 'cartao' | 'boleto';
  status: 'aprovado' | 'pendente' | 'recusado' | 'estornado' | 'chargeback';
  gateway: 'mercadopago' | 'infinitpay' | 'manual';
  transacaoId?: string;
  criadoEm: string;
}

export interface CodigoAcesso {
  id: number;
  codigo: string;
  tipo: 'trial' | 'extensao' | 'cortesia';
  diasValidade: number;
  usado: boolean;
  usadoPorUsuarioId?: number;
  usadoEm?: string;
  criadoEm: string;
  cursoId?: number;
  criadoPor?: string;
}

export interface Ticket {
  id: number;
  usuarioId: number;
  usuarioNome: string;
  assunto: string;
  mensagem: string;
  status: 'aberto' | 'em_atendimento' | 'resolvido' | 'fechado';
  prioridade: 'baixa' | 'media' | 'alta';
  respostas?: {
    autor: string;
    mensagem: string;
    criadoEm: string;
  }[];
  criadoEm: string;
}

export interface LogAuditoria {
  id: number;
  usuarioId?: number;
  usuarioNome?: string;
  papel?: UserRole;
  acao: string; // ex: "LOGIN_SUCESSO", "BLOQUEIO_TENTATIVAS", "ALTERACAO_CONFIG"
  detalhes?: string;
  dadosAntes?: Record<string, any>;
  dadosDepois?: Record<string, any>;
  ip?: string;
  criadoEm: string;
}

export interface ConfiguracaoSistema {
  chave: string;
  valor: string;
  descricao?: string;
  categoria: 'geral' | 'seguranca' | 'pagamentos' | 'email' | 'limites';
  atualizadoPor?: string;
  atualizadoEm: string;
}

export interface Lead {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  origem: 'site_vendas' | 'popup' | 'download_material';
  status: 'novo' | 'contatado' | 'convertido';
  criadoEm: string;
  cursoInteresseId?: number;
  convertidoEmUsuarioId?: number;
}

export interface CampanhaCota {
  id: number;
  nome: string;
  overrideProducoesMax?: number;
  overrideDownloadsMax?: number;
  dataInicio: string;
  dataFim: string;
  ativa: boolean;
  cursoId?: number;
}

export interface CotasState {
  producoesUsadas: number;
  producoesMax: number;
  downloadsUsados: number;
  downloadsMax: number;
  resetTime: string;
}

export interface CategoriaFonte {
  id: string;
  nome: string;
  descricao?: string;
  corBadge?: string;
}

export interface FonteEstudo {
  id: number;
  titulo: string;
  tipo: 'edital' | 'lei' | 'apostila' | 'prova' | 'mapa_pronto';
  banca: string;
  ano: number;
  materia: string;
  categoriaId?: string;
  selecionada: boolean;
  tamanho: string;
}

export type GroupId = 'g1' | 'g2' | 'g3' | 'g4';

export type FeatureId =
  // G1: Essencial
  | 'plano_estudo'
  | 'simulado'
  | 'fazer_questoes'
  | 'resumir'
  | 'tirar_duvida'
  // G2: Gerar Material
  | 'flashcards'
  | 'mapa_mental'
  | 'resumo_audio'
  | 'resumo_video'
  | 'slides'
  | 'infografico'
  | 'tabela_dados'
  | 'relatorios'
  // G3: Avaliar e Corrigir
  | 'teste'
  | 'corrigir_redacao'
  | 'pontos_fracos'
  // G4: Reta Final
  | 'glossario'
  | 'radar_pegadinhas'
  | 'raio_x'
  | 'checklist_vespera'
  | 'questoes_500';

export interface EstudioFeature {
  id: FeatureId;
  grupo: GroupId;
  nome: string;
  descricao: string;
  icone: string;
  kRag: number;
  consomeCota: boolean;
  permiteFallback: boolean;
  badge?: string;
}

export interface TrechoOrigem {
  texto: string;
  tipo: 'oficial' | 'externo';
  fonte: string;
  ano?: number;
  dominio?: string;
}

export interface ProducaoResultado {
  id: number;
  featureId: FeatureId;
  titulo: string;
  conteudo: any; // Raw or structured content depending on feature
  trechos: TrechoOrigem[];
  origem: 'oficial' | 'oficial+externo' | 'somente_externo';
  dominiosExt?: string[];
  criadoEm: string;
  materia?: string;
}

export interface AnotacaoItem {
  id: number;
  producaoId: number;
  titulo: string;
  featureId: FeatureId;
  materia: string;
  data: string;
  conteudoResumido: string;
  origem: 'oficial' | 'oficial+externo' | 'somente_externo';
}

export interface Questao {
  id: number;
  banca: string;
  ano: number;
  materia: string;
  assunto: string;
  enunciado: string;
  alternativas: string[];
  gabaritoIndex: number; // 0=A, 1=B, 2=C, 3=D, 4=E
  comentario: string;
  pegadinhaTipo?: string;
  taxaAcertoGeral: number; // e.g. 64%
  origem: 'acervo' | 'inedita_oficial' | 'inedita_externa';
}

export interface Flashcard {
  frente: string;
  verso: string;
  materia: string;
  fonte: string;
  origem: 'oficial' | 'externo';
}

export interface SlideItem {
  numero: number;
  titulo: string;
  bullets: string[];
  notaOrador: string;
  origemSlide: 'oficial' | 'externo';
}

export interface PlanItem {
  id: string;
  name: string;
  price: string;
  installments: string;
  subtitle: string;
  popularBadge?: string;
  features: string[];
  ctaText: string;
}

export interface CarouselSlide {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  badge: string;
}

export interface PlatformFeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  text: string;
  stars: number;
}

export interface BlockVisibility {
  showHero?: boolean;
  showCarousel?: boolean;
  showPillars?: boolean;
  showPlans?: boolean;
  showTestimonials?: boolean;
  showCategories?: boolean;
}

export interface SiteConfig {
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  ctaButtonText: string;
  plans: PlanItem[];
  carouselSlides: CarouselSlide[];
  pillarsFeatures: PlatformFeatureItem[];
  contactEmail: string;
  companyName: string;
  sourceCategories?: CategoriaFonte[];
  testimonials?: TestimonialItem[];
  blockVisibility?: BlockVisibility;
}
