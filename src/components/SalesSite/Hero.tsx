import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight, Play, Pause, Layers, BookOpen, FileCheck, Calendar } from 'lucide-react';
import { CarouselSlide } from '../../types';

interface HeroProps {
  heroTitle?: string;
  heroHighlight?: string;
  heroSubtitle?: string;
  ctaButtonText?: string;
  slides?: CarouselSlide[];
  onStartLearner: () => void;
  onSelectPlanClick?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  heroTitle = 'Facilitamos sua aprovação com a',
  heroHighlight = 'Inteligência Artificial para Professores',
  heroSubtitle = 'O ecossistema definitivo para o concurso e processos seletivos. Estude com editais, leis e provas oficiais integradas em uma interface simples, sem complicações tecnológicas.',
  ctaButtonText = 'Acessar Plataforma do Aluno',
  slides = [
    {
      id: 1,
      title: 'Tutor IA Integrado com Editais & Leis Oficiais',
      subtitle: 'Respostas fundamentadas com citação exata da legislação vigente e editais.',
      badge: 'Editais & Leis Oficiais',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 2,
      title: 'Simulados no Padrão das Bancas',
      subtitle: 'Questões no estilo FEPESE, ACAFE, IBADE e FURB com gabarito comentado.',
      badge: 'Simulados Inteligentes',
      imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 3,
      title: 'Plano de Estudos e Cronograma de Revisão',
      subtitle: 'Roteiros de estudo automatizados por disciplina para otimizar seu tempo.',
      badge: 'Cronograma Ativo',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 4,
      title: 'Correção de Redação & Análise de Desempenho',
      subtitle: 'Feedback criterioso com avaliação por competências e pontos de melhoria.',
      badge: 'Correção Discursiva',
      imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop',
    },
  ],
  onStartLearner,
  onSelectPlanClick,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || slides.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  const currentSlide = slides[activeSlide] || slides[0];

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50/20 pt-10 pb-16 border-b border-slate-200">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Tagline Badge */}
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-[#1877F2] px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#1877F2]" />
          <span>Tutor IA para Concursos e Seleções Públicas</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2D3748] tracking-tight leading-tight max-w-4xl mx-auto">
          {heroTitle}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1877F2] to-[#4285F4]">
            {heroHighlight}
          </span>
        </h1>

        {/* Subtitle - Exact string requested */}
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto font-medium">
          {heroSubtitle}
        </p>

        {/* CTA Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#planos"
            onClick={(e) => {
              if (onSelectPlanClick) {
                e.preventDefault();
                onSelectPlanClick();
              }
            }}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm flex items-center justify-center space-x-2 group"
          >
            <span>Ver Planos & Garantir Vaga</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>

          <button
            onClick={onStartLearner}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl transition-all text-sm flex items-center justify-center space-x-2 shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-[#1877F2]" />
            <span>{ctaButtonText}</span>
          </button>
        </div>

        {/* CARROSSEL-1: Interactive Feature Showcase Carousel */}
        <div className="mt-12 max-w-4xl mx-auto text-left" id="carrossel-1">
          <div
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden relative group"
            onMouseEnter={() => setIsPlaying(false)}
            onMouseLeave={() => setIsPlaying(true)}
          >
            {/* Window Header */}
            <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-slate-600 ml-2">
                  JPSchool • Visualização do Sistema
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-extrabold bg-blue-100 text-[#1877F2] px-2.5 py-0.5 rounded-full border border-blue-200">
                  {currentSlide.badge}
                </span>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title={isPlaying ? 'Pausar rotação' : 'Iniciar rotação'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Carousel Main Content Slide */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[300px] sm:min-h-[360px]">
              
              {/* Text Info */}
              <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1877F2]">
                    Slide {activeSlide + 1} de {slides.length}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#2D3748] leading-tight">
                    {currentSlide.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {currentSlide.subtitle}
                  </p>
                </div>

                {/* Feature Icons Quick Indicator */}
                <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
                  <div className="flex items-center space-x-1.5 bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                    <BookOpen className="w-3.5 h-3.5 text-[#1877F2]" />
                    <span>Fontes Oficiais</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Zero Complicação</span>
                  </div>
                </div>
              </div>

              {/* Image / Visual Representation */}
              <div className="md:col-span-7 relative bg-slate-900 overflow-hidden flex items-center justify-center">
                <img
                  src={currentSlide.imageUrl}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover opacity-90 transition-opacity duration-500"
                />
                
                {/* Visual Overlay Graphic Mockup */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent p-6 flex flex-col justify-end text-white">
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-blue-300" />
                      <span className="text-xs font-bold text-white">{currentSlide.badge}</span>
                    </div>
                    <p className="text-[11px] text-slate-200 font-medium">
                      Demonstração da interface em tempo real no {currentSlide.title}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Carousel Controls Footer */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between">
              
              {/* Prev / Next Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
                  title="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
                  title="Próximo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Indicators (com barra de progresso até a próxima troca) */}
              <div className="flex items-center space-x-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2 rounded-full transition-all overflow-hidden ${
                      activeSlide === idx ? 'w-8 bg-slate-200' : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    title={`Slide ${idx + 1}`}
                  >
                    {activeSlide === idx && (
                      <div
                        key={`${activeSlide}-${isPlaying ? 'playing' : 'paused'}`}
                        className="h-full bg-[#1877F2] rounded-full"
                        style={
                          isPlaying
                            ? { animation: 'hero-carousel-progress 5s linear forwards' }
                            : { width: '100%' }
                        }
                      />
                    )}
                  </button>
                ))}
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
