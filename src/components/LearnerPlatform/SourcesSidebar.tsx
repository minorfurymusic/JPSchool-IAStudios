import React, { useState, useMemo } from 'react';
import { FonteEstudo, CategoriaFonte } from '../../types';
import { BookOpen, CheckSquare, Square, ChevronDown, ChevronRight, Search, Lock } from 'lucide-react';

interface SourcesSidebarProps {
  sources: FonteEstudo[];
  categories?: CategoriaFonte[];
  onToggleSource: (id: number) => void;
  onSelectAll: () => void;
}

export const SourcesSidebar: React.FC<SourcesSidebarProps> = ({
  sources,
  categories = [
    { id: 'cat-leg-educ', nome: 'Legislação Educacional', corBadge: 'bg-amber-100 text-amber-800' },
    { id: 'cat-estatuto', nome: 'Estatuto do Servidor', corBadge: 'bg-emerald-100 text-emerald-800' },
    { id: 'cat-didatica', nome: 'Didática e Currículo', corBadge: 'bg-purple-100 text-purple-800' },
    { id: 'cat-portugues', nome: 'Língua Portuguesa', corBadge: 'bg-blue-100 text-[#1877F2]' },
    { id: 'cat-hist-geo-sc', nome: 'História e Geografia de SC', corBadge: 'bg-rose-100 text-rose-800' },
    { id: 'cat-provas', nome: 'Provas Anteriores', corBadge: 'bg-slate-200 text-slate-800' },
  ],
  onToggleSource,
  onSelectAll,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const selectedCount = sources.filter((s) => s.selecionada).length;
  const allSelected = sources.length > 0 && selectedCount === sources.length;

  // Helper to match category for a source
  const getCategoryForSource = (source: FonteEstudo): CategoriaFonte => {
    if (source.categoriaId) {
      const match = categories.find((c) => c.id === source.categoriaId);
      if (match) return match;
    }

    // Match by materia or keywords
    const srcMat = (source.materia || '').toLowerCase();
    const srcTit = (source.titulo || '').toLowerCase();

    const found = categories.find((c) => {
      const catNome = c.nome.toLowerCase();
      if (catNome === srcMat || srcMat.includes(catNome) || catNome.includes(srcMat)) return true;
      if (catNome.includes('quest') && (srcMat.includes('quest') || srcTit.includes('simulado') || srcTit.includes('questoes'))) return true;
      if (catNome.includes('portug') && (srcMat.includes('portug') || srcTit.includes('portug'))) return true;
      if (catNome.includes('hist') && (srcMat.includes('hist') || srcTit.includes('hist') || srcMat.includes('geo') || srcTit.includes('geo'))) return true;
      if (catNome.includes('legis') && (srcMat.includes('legis') || srcTit.includes('lei') || srcTit.includes('ldb') || srcTit.includes('eca') || srcTit.includes('estatuto'))) return true;
      if (catNome.includes('didat') && (srcMat.includes('didat') || srcTit.includes('didat') || srcTit.includes('curr') || srcTit.includes('cbtc'))) return true;
      return false;
    });

    if (found) return found;

    return {
      id: 'cat-outros',
      nome: source.materia || 'Outros Assuntos',
      corBadge: 'bg-slate-100 text-slate-700',
    };
  };

  // Group sources by category
  const groupedCategories = useMemo(() => {
    const groups: { category: CategoriaFonte; items: FonteEstudo[] }[] = [];

    // Map each configurable category
    categories.forEach((cat) => {
      const items = sources.filter((s) => {
        const sourceCat = getCategoryForSource(s);
        return s.categoriaId === cat.id || sourceCat.id === cat.id;
      });

      // Filter items by search term if provided
      const filteredItems = items.filter((s) => {
        if (!searchTerm.trim()) return true;
        const query = searchTerm.toLowerCase();
        return (
          s.titulo.toLowerCase().includes(query) ||
          s.materia.toLowerCase().includes(query) ||
          s.banca.toLowerCase().includes(query) ||
          cat.nome.toLowerCase().includes(query)
        );
      });

      if (!searchTerm.trim() || filteredItems.length > 0 || cat.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        groups.push({ category: cat, items: filteredItems });
      }
    });

    // Catch any unassigned items
    const assignedIds = new Set(groups.flatMap((g) => g.items.map((i) => i.id)));
    const unassigned = sources.filter((s) => !assignedIds.has(s.id)).filter((s) => {
      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase();
      return s.titulo.toLowerCase().includes(query) || s.materia.toLowerCase().includes(query);
    });

    if (unassigned.length > 0) {
      groups.push({
        category: { id: 'cat-outros', nome: 'Outros Assuntos', corBadge: 'bg-slate-100 text-slate-700' },
        items: unassigned,
      });
    }

    return groups;
  }, [sources, categories, searchTerm]);

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Select or deselect all items within a single category
  const handleToggleCategoryAll = (e: React.MouseEvent, items: FonteEstudo[]) => {
    e.stopPropagation();
    const allCategorySelected = items.every((i) => i.selecionada);

    items.forEach((item) => {
      if (item.selecionada === allCategorySelected) {
        onToggleSource(item.id);
      }
    });
  };

  return (
    <aside className="bg-white border-r border-slate-200 w-full lg:w-80 shrink-0 p-4 space-y-3.5 font-sans flex flex-col lg:h-[calc(100vh-60px)] lg:max-h-none overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2 text-[#2D3748]">
          <BookOpen className="w-4 h-4 text-[#1877F2]" />
          <h2 className="font-extrabold text-sm">Materiais de Estudo</h2>
        </div>
        
        <button
          onClick={onSelectAll}
          className="text-[11px] font-bold text-[#1877F2] hover:underline flex items-center space-x-1"
        >
          <span>{allSelected ? 'Desmarcar Todos' : 'Marcar Todos'}</span>
        </button>
      </div>

      {/* Simple Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar matéria ou conteúdo..."
          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
        />
      </div>

      {/* VERTICAL ACCORDION LIST (MATÉRIA → SUBMATÉRIAS/CONTEÚDOS) */}
      <div className="space-y-2 overflow-y-auto pr-1 flex-1">
        {groupedCategories.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Nenhum material encontrado com o termo "{searchTerm}".
          </div>
        ) : (
          groupedCategories.map(({ category, items }) => {
            // Auto-expand if user is searching
            const isCollapsed = searchTerm.trim() ? false : !!collapsedCategories[category.id];
            const selectedInGroup = items.filter((i) => i.selecionada).length;
            const allInGroupSelected = items.length > 0 && selectedInGroup === items.length;

            return (
              <div
                key={category.id}
                className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all"
              >
                {/* Accordion Category Header */}
                <div
                  onClick={() => toggleCategoryCollapse(category.id)}
                  className="bg-slate-50/90 hover:bg-slate-100 px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none border-b border-slate-200/60 transition-colors"
                >
                  <div className="flex items-center space-x-2 overflow-hidden mr-1">
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md truncate ${category.corBadge || 'bg-slate-200 text-slate-800'}`}>
                      {category.nome}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] font-bold text-slate-500">
                      {selectedInGroup}/{items.length}
                    </span>

                    <button
                      onClick={(e) => handleToggleCategoryAll(e, items)}
                      className="text-[10px] text-[#1877F2] font-semibold hover:underline"
                      title={allInGroupSelected ? 'Desmarcar matéria' : 'Marcar matéria'}
                    >
                      {allInGroupSelected ? 'Desmarcar' : 'Marcar'}
                    </button>
                  </div>
                </div>

                {/* Accordion Submatérias/Items List */}
                {!isCollapsed && (
                  <div className="p-2 space-y-2 bg-slate-50/40">
                    {items.length === 0 ? (
                      <div className="py-3 px-3 text-center text-[11px] text-slate-400 font-medium italic bg-white rounded-xl border border-dashed border-slate-200">
                        Nenhum material cadastrado nesta categoria ainda.
                      </div>
                    ) : (
                      (() => {
                        // Group items by subcategory if subcategories exist
                        const subcatGroups: Record<string, FonteEstudo[]> = {};
                        items.forEach(s => {
                          const subName = s.subcategoriaNome || '📌 Outros Tópicos & Complementares';
                          if (!subcatGroups[subName]) subcatGroups[subName] = [];
                          subcatGroups[subName].push(s);
                        });

                        const subcatEntries = Object.entries(subcatGroups);
                        const hasMultipleSubcats = subcatEntries.length > 1 || (subcatEntries.length === 1 && subcatEntries[0][0] !== '📌 Outros Tópicos & Complementares');

                        if (!hasMultipleSubcats) {
                          return items.map((source) => (
                            <div
                              key={source.id}
                              onClick={() => onToggleSource(source.id)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                source.selecionada
                                  ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start space-x-2.5">
                                <div className="mt-0.5 text-[#1877F2] shrink-0">
                                  {source.selecionada ? (
                                    <CheckSquare className="w-4 h-4" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>

                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <p className="text-[11px] font-bold text-[#2D3748] leading-tight">
                                    {source.titulo}
                                  </p>
                                  <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-500">
                                    <span>{source.banca}</span>
                                    <span>•</span>
                                    <span>{source.tamanho}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        }

                        return subcatEntries.map(([subName, subItems]) => (
                          <div key={subName} className="space-y-1.5 pt-1.5 border-t border-slate-200/60 first:border-0 first:pt-0">
                            <div className="flex items-center justify-between px-1 py-0.5">
                              <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider flex items-center space-x-1">
                                <span>⚡ {subName}</span>
                                <span className="text-slate-400 font-mono">({subItems.length})</span>
                              </span>
                            </div>
                            {subItems.map((source) => (
                              <div
                                key={source.id}
                                onClick={() => onToggleSource(source.id)}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                  source.selecionada
                                    ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-start space-x-2.5">
                                  <div className="mt-0.5 text-[#1877F2] shrink-0">
                                    {source.selecionada ? (
                                      <CheckSquare className="w-4 h-4" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-400" />
                                    )}
                                  </div>

                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-[#2D3748] leading-tight">
                                      {source.titulo}
                                    </p>
                                    <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-500">
                                      <span>{source.banca}</span>
                                      <span>•</span>
                                      <span>{source.tamanho}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ));
                      })()
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Protection Notice */}
      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
        <div className="flex items-center space-x-1 font-bold text-slate-600">
          <Lock className="w-3 h-3 text-[#C85A00]" />
          <span>Proteção de Direitos e Cotas</span>
        </div>
        <p className="leading-snug">
          Os PDFs originais são protegidos contra download direto. Converse com o Tutor IA para gerar resumos e simulados com base nas fontes marcadas.
        </p>
      </div>

    </aside>
  );
};
