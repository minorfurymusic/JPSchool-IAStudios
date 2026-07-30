export type UserRole = 'admin' | 'ti' | 'cliente';

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
}
