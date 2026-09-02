import React, { useState } from 'react';
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
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface StudioSidebarProps {
  features: EstudioFeature[];
  activeFeatureId: FeatureId;
  onSelectFeature: (featureId: FeatureId) => void;
  isRetaFinal: boolean;
}

const EXPANDED_GROUPS_KEY = 'jpschool_studio_expanded_groups';

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
  // Grupos ficam sempre recolhidos por padrão — só abrem quando o aluno clica,
  // e esse estado persiste (localStorage) entre atualizações de página.
  const [expandedGroups, setExpandedGroups] = useState<Record<GroupId, boolean>>(() => {
    try {
      const saved = localStorage.getItem(EXPANDED_GROUPS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { g1: false, g2: false, g3: false, g4: false };
  });

  const toggleGroup = (groupId: GroupId) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Group configs (nomes curtos — a barra é horizontal, precisa caber)
  const groupMeta: Record<GroupId, { title: string; short: string; color: string; border: string; bg: string; chipBg: string }> = {
    g1: {
      title: 'Essencial do Dia a Dia',
      short: 'Essencial',
      color: 'text-[#1877F2]',
      border: 'border-blue-200',
      bg: 'bg-blue-50/60',
      chipBg: 'bg-blue-100/70',
    },
    g2: {
      title: 'Gerar Material de Estudo',
      short: 'Gerar Material',
      color: 'text-indigo-600',
      border: 'border-indigo-200',
      bg: 'bg-indigo-50/60',
      chipBg: 'bg-indigo-100/70',
    },
    g3: {
      title: 'Avaliar e Corrigir',
      short: 'Avaliar',
      color: 'text-emerald-700',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/60',
      chipBg: 'bg-emerald-100/70',
    },
    g4: {
      title: 'Reta Final (Revisão Intensiva)',
      short: 'Reta Final',
      color: 'text-[#C85A00]',
      border: 'border-amber-300',
      bg: 'bg-amber-50/80',
      chipBg: 'bg-amber-100/80',
    },
  };

  // Determine group order based on Reta Final mode
  const groupOrder: GroupId[] = isRetaFinal
    ? ['g4', 'g1', 'g2', 'g3']
    : ['g1', 'g2', 'g3', 'g4'];

  return (
    <nav className="w-full shrink-0 bg-white border-b border-slate-200 font-sans">

      {/* Header + Group Tabs (tudo compacto, uma única faixa) */}
      <div className="px-4 py-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 pr-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#1877F2]" />
          <h2 className="font-bold text-[11px] text-[#2D3748] uppercase tracking-wide">Estúdio de IA</h2>
        </div>

        {groupOrder.map((groupId) => {
          const meta = groupMeta[groupId];
          const groupFeatures = features.filter((f) => f.grupo === groupId);
          const isExpanded = !!expandedGroups[groupId];
          const activeInGroup = groupFeatures.some((f) => f.id === activeFeatureId);

          return (
            <button
              key={groupId}
              onClick={() => toggleGroup(groupId)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                isExpanded
                  ? `${meta.chipBg} ${meta.color} ${meta.border}`
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              } ${isRetaFinal && groupId === 'g4' ? 'ring-2 ring-amber-300' : ''}`}
            >
              {groupId === 'g4' && <Flame className="w-3 h-3 shrink-0" />}
              <span>{meta.short}</span>
              <span className="text-[9px] opacity-70">({groupFeatures.length})</span>
              {activeInGroup && (
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" title="Ferramenta ativa neste grupo" />
              )}
              {isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Expanded groups render their tool pills right below the tab row */}
      {groupOrder.filter((g) => expandedGroups[g]).map((groupId) => {
        const meta = groupMeta[groupId];
        const groupFeatures = features.filter((f) => f.grupo === groupId);

        return (
          <div key={groupId} className={`px-4 py-2.5 border-t ${meta.border} ${meta.bg}`}>
            <div className="flex flex-wrap gap-1.5">
              {groupFeatures.map((feature) => {
                const IconComponent = iconMap[feature.icone] || BookOpen;
                const isActive = activeFeatureId === feature.id;

                return (
                  <button
                    key={feature.id}
                    onClick={() => onSelectFeature(feature.id)}
                    title={feature.descricao}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
                      isActive
                        ? 'bg-white text-[#1877F2] border-blue-300 shadow-2xs ring-1 ring-blue-100'
                        : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/80'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{feature.nome}</span>
                    {feature.badge && (
                      <span className="text-[8px] font-extrabold px-1 py-0.5 rounded bg-amber-100 text-[#C85A00] shrink-0">
                        {feature.badge}
                      </span>
                    )}
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
