import React from 'react';
import {
  BookOpen,
  Calendar,
  FileCheck,
  BarChart3,
  Sparkles,
  ShieldAlert,
  Brain,
  PenTool,
  CheckCircle2,
} from 'lucide-react';
import { PlatformFeatureItem } from '../../types';

interface PillarsProps {
  features?: PlatformFeatureItem[];
}

export const Pillars: React.FC<PillarsProps> = ({ features }) => {
  const defaultFeatures: PlatformFeatureItem[] = [
    {
      id: 'rag_oficial',
      title: 'Tutor IA treinado em editais e leis oficiais',
      description: 'Respostas precisas e fundamentadas diretamente na legislação atualizada (LC 688/SC, LDB, ECA e editais oficiais).',
      iconName: 'BookOpen',
    },
    {
      id: 'plano_estudo',
      title: 'Gerador de plano de estudos',
      description: 'Organização automática de rotina, blocos de tempo e disciplinas com foco nas bancas examinadoras.',
      iconName: 'Calendar',
    },
    {
      id: 'simulados',
      title: 'Simulados no padrão das bancas',
      description: 'Provas e questões no formato exato de cobrança da FEPESE, ACAFE, IBADE e FURB com comentários.',
      iconName: 'FileCheck',
    },
    {
      id: 'desempenho',
      title: 'Análise de desempenho (pontos fortes/fracos)',
      description: 'Métricas visuais de evolução por matéria e diagnóstico de tópicos que precisam de reforço.',
      iconName: 'BarChart3',
    },
    {
      id: 'glossario',
      title: 'Glossário de vocabulário de prova',
      description: 'Definições diretas dos termos técnicos pedagógicos e legislativos cobrados em certames.',
      iconName: 'Sparkles',
    },
    {
      id: 'pegadinhas',
      title: 'Radar de pegadinhas de banca',
      description: 'Mapeamento preventivo das armadilhas e pegadinhas mais recorrentes das bancas examinadoras.',
      iconName: 'ShieldAlert',
    },
    {
      id: 'flashcards',
      title: 'Geração de flashcards e mapas mentais',
      description: 'Ferramentas de repetição espaçada e resumos esquematizados para memorização acelerada.',
      iconName: 'Brain',
    },
    {
      id: 'redacao',
      title: 'Correção de redação',
      description: 'Avaliação criteriosa de textos discursivos com nota por competência e sugestões de reescrita.',
      iconName: 'PenTool',
    },
  ];

  const items = features || defaultFeatures;

  const getIcon = (name: string) => {
    switch (name) {
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-[#1877F2]" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5 text-[#1877F2]" />;
      case 'FileCheck':
        return <FileCheck className="w-5 h-5 text-[#1877F2]" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5 text-[#1877F2]" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-[#1877F2]" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-[#1877F2]" />;
      case 'Brain':
        return <Brain className="w-5 h-5 text-[#1877F2]" />;
      case 'PenTool':
        return <PenTool className="w-5 h-5 text-[#1877F2]" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-[#1877F2]" />;
    }
  };

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1877F2]">
            Recursos e Funcionalidades
          </span>
          <h2 className="text-3xl font-extrabold text-[#2D3748] tracking-tight">
            Funcionalidades do Ecossistema JPSchool IA
          </h2>
          <p className="text-slate-600 text-sm">
            Ferramentas inteligentes desenvolvidas para otimizar cada etapa da sua preparação.
          </p>
        </div>

        {/* 8 Features Modern List / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-slate-50/80 hover:bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all hover:shadow-lg flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-xs group-hover:scale-105 transition-transform">
                  {getIcon(item.iconName)}
                </div>

                <h3 className="text-sm font-bold text-[#2D3748] mb-2 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center space-x-1 text-[11px] font-semibold text-[#1877F2]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Integrado na Plataforma</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
