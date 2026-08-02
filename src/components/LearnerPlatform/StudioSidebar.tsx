import React from 'react';
import { EstudioFeature, FeatureId, GroupId } from '../../types';
import {
  Calendar,
  FileCheck,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Layers,
  GitFork,
  Headphones,
  Video,
  Presentation,
  LayoutGrid,
  Table,
  BarChart3,
  FlaskConical,
  FileEdit,
  AlertTriangle,
  BookMarked,
  Target,
  PieChart,
  CheckSquare,
  Flame,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface StudioSidebarProps {
  features: EstudioFeature[];
  activeFeatureId: FeatureId;
  onSelectFeature: (featureId: FeatureId) => void;
  isRetaFinal: boolean;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Calendar,
  FileCheck,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Layers,
  GitFork,
  Headphones,
  Video,
  Presentation,
  LayoutGrid,
  Table,
  BarChart3,
  FlaskConical,
  FileEdit,
  AlertTriangle,
  BookMarked,
  Target,
  PieChart,
  CheckSquare,
  Flame,
};

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  features,
  activeFeatureId,
  onSelectFeature,
  isRetaFinal,
}) => {
  // Group configs
  const groupMeta: Record<GroupId, { title: string; color: string; border: string; bg: string }> = {
    g1: {
      title: '1. Essencial do Dia a Dia',
      color: 'text-[#1877F2]',
      border: 'border-blue-200',
      bg: 'bg-blue-50/60',
    },
    g2: {
      title: '2. Gerar Material de Estudo',
      color: 'text-indigo-600',
      border: 'border-indigo-200',
      bg: 'bg-indigo-50/60',
    },
    g3: {
      title: '3. Avaliar e Corrigir',
      color: 'text-emerald-700',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/60',
    },
    g4: {
      title: '4. Reta Final (Revisão Intensiva)',
      color: 'text-[#C85A00]',
      border: 'border-amber-300',
      bg: 'bg-amber-50/80',
    },
  };

  // Determine group order based on Reta Final mode
  const groupOrder: GroupId[] = isRetaFinal
    ? ['g4', 'g1', 'g2', 'g3']
    : ['g1', 'g2', 'g3', 'g4'];

  return (
    <nav className="w-full lg:w-80 shrink-0 bg-slate-50/90 border-l border-slate-200 p-4 space-y-4 font-sans overflow-y-auto lg:h-[calc(100vh-60px)] lg:max-h-none">
      
      {/* Studio Header */}
      <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#1877F2]" />
          <h2 className="font-bold text-sm text-[#2D3748]">Estúdio de IA • Ferramentas</h2>
        </div>
        {isRetaFinal && (
          <span className="text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
            Reta Final
          </span>
        )}
      </div>

      {/* Render Groups */}
      {groupOrder.map((groupId) => {
        const meta = groupMeta[groupId];
        const groupFeatures = features.filter((f) => f.grupo === groupId);

        return (
          <div
            key={groupId}
            className={`rounded-2xl border ${meta.border} ${meta.bg} p-3 space-y-2 transition-all ${
              isRetaFinal && groupId === 'g4' ? 'shadow-md border-2 border-amber-400' : ''
            }`}
          >
            {/* Group Title */}
            <div className="flex items-center justify-between px-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
                {meta.title}
              </span>
              {isRetaFinal && groupId === 'g4' && (
                <span className="text-[10px] font-bold text-[#C85A00] flex items-center space-x-1">
                  <Flame className="w-3 h-3 text-[#C85A00]" />
                  <span>Topo</span>
                </span>
              )}
            </div>

            {/* Group Feature Buttons */}
            <div className="space-y-1.5">
              {groupFeatures.map((feature) => {
                const IconComponent = iconMap[feature.icone] || BookOpen;
                const isActive = activeFeatureId === feature.id;

                return (
                  <button
                    key={feature.id}
                    onClick={() => onSelectFeature(feature.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-2.5 group relative ${
                      isActive
                        ? 'bg-white text-[#1877F2] font-bold shadow-sm border border-blue-300 ring-2 ring-blue-100'
                        : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div
                      className={`mt-0.5 p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-[#1877F2]'
                          : 'bg-slate-100 text-slate-500 group-hover:text-[#1877F2]'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs truncate font-semibold leading-tight">
                          {feature.nome}
                        </span>

                        {feature.badge && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-[#C85A00] shrink-0">
                            {feature.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                        {feature.descricao}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        );
      })}

    </nav>
  );
};
