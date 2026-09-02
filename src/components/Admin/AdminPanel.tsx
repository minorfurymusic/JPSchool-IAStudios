import React, { useState } from 'react';
import {
  Settings,
  Layout,
  Image,
  CreditCard,
  Save,
  RotateCcw,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  SlidersHorizontal,
  MessageSquare,
  Layers,
  Sparkles,
  Search,
  Folder,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { generateAutoSubcategories, fetchSources, saveCursosMaterias } from '../../services/api';
import { SiteConfig, PlanItem, CarouselSlide, PlatformFeatureItem, TestimonialItem, BlockVisibility, CategoriaFonte } from '../../types';

interface AdminPanelProps {
  siteConfig: SiteConfig;
  onUpdateConfig: (newConfig: SiteConfig) => void;
  onResetDefault: () => void;
  onExitAdmin: () => void;
  onPreviewSalesSite?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  siteConfig,
  onUpdateConfig,
  onResetDefault,
  onExitAdmin,
  onPreviewSalesSite,
}) => {
  type AdminTab = 'texts' | 'carousel' | 'plans' | 'testimonials' | 'categories' | 'pillars' | 'visibility';
  const [activeTab, setActiveTab] = useState<AdminTab>('texts');
  const [formData, setFormData] = useState<SiteConfig>(JSON.parse(JSON.stringify(siteConfig)));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('bg-blue-100 text-[#1877F2]');
  const [newCatCurso, setNewCatCurso] = useState('Professor SED - História');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [openCourseAccordions, setOpenCourseAccordions] = useState<Record<string, boolean>>({
    'Professor SED - História': true
  });
  const [selectedCategoriesByCourse, setSelectedCategoriesByCourse] = useState<Record<string, Record<string, boolean>>>({});

  // New Testimonial State
  const [newTestName, setNewTestName] = useState('');
  const [newTestRole, setNewTestRole] = useState('');
  const [newTestText, setNewTestText] = useState('');
  const [newTestStars, setNewTestStars] = useState(5);

  // New Pillar/Feature State
  const [newPillarTitle, setNewPillarTitle] = useState('');
  const [newPillarDesc, setNewPillarDesc] = useState('');

  const handleSave = () => {
    onUpdateConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Deseja realmente restaurar os textos e imagens para o padrão original do site?')) {
      onResetDefault();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Block Visibility Toggles
  const handleToggleBlock = (blockKey: keyof BlockVisibility) => {
    setFormData((prev) => {
      const currentVis = prev.blockVisibility || {
        showHero: true,
        showCarousel: true,
        showPillars: true,
        showPlans: true,
        showTestimonials: true,
        showCategories: true,
      };
      return {
        ...prev,
        blockVisibility: {
          ...currentVis,
          [blockKey]: !currentVis[blockKey],
        },
      };
    });
  };

  // --- CATEGORIES HANDLERS (ITEM 1, 2, 3) ---
  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      alert('Informe o nome da categoria.');
      return;
    }

    const newCat = {
      id: `cat-${Date.now()}`,
      nome: newCatName.trim(),
      descricao: newCatDesc.trim() || 'Categoria de materiais de apoio',
      corBadge: newCatColor,
      cursoNome: newCatCurso.trim() || 'Professor SED - História',
    };

    const updatedCategories = [...(formData.sourceCategories || []), newCat];
    const newConfig = { ...formData, sourceCategories: updatedCategories };
    setFormData(newConfig); // só entra no site após "Salvar Alterações", igual às outras abas

    // A lista de categorias que alimenta a Área do Aluno é um dado à parte (vem do
    // Drive/RAG, não do rascunho do site) — por isso sincroniza direto, sem esperar o Salvar.
    syncCategoriesToBackend(updatedCategories);

    setNewCatName('');
    setNewCatDesc('');
  };

  const syncCategoriesToBackend = async (cats: CategoriaFonte[]) => {
    try {
      const courseMap: Record<string, any[]> = {};
      cats.forEach((c) => {
        const cNome = c.cursoNome || 'Professor SED - História';
        if (!courseMap[cNome]) courseMap[cNome] = [];
        courseMap[cNome].push({
          id: c.id,
          nome: c.nome,
          corBadge: c.corBadge,
          driveFolderName: (c as any).driveFolderName || c.nome,
          totalFiles: 0,
          ingestedFiles: 0,
        });
      });
      const cursosPayload = Object.keys(courseMap).map((cursoNome, idx) => ({
        id: `curso-${idx + 1}`,
        nome: cursoNome,
        materias: courseMap[cursoNome],
      }));
      await saveCursosMaterias(cursosPayload);
    } catch (err) {
      console.warn('Erro ao sincronizar categorias com o backend:', err);
    }
  };

  const handleDeleteCategory = (catId: string) => {
    if ((formData.sourceCategories || []).length <= 1) {
      alert('É necessário manter pelo menos 1 categoria de fontes.');
      return;
    }
    if (confirm('Tem certeza que deseja remover esta categoria de fontes? Ela sumirá do painel do aluno.')) {
      const updatedCategories = (formData.sourceCategories || []).filter((c) => c.id !== catId);
      const newConfig = { ...formData, sourceCategories: updatedCategories };
      setFormData(newConfig);
      syncCategoriesToBackend(updatedCategories);
    }
  };

  const handleDeleteSubcategory = (catId: string, subId: string) => {
    if (confirm('Deseja remover esta subcategoria? Os arquivos cadastrados retornarão com segurança para a categoria principal sem serem excluídos.')) {
      const updatedCategories = (formData.sourceCategories || []).map((cat) => {
        if (cat.id === catId && cat.subcategorias) {
          return {
            ...cat,
            subcategorias: cat.subcategorias.filter((s) => s.id !== subId),
          };
        }
        return cat;
      });

      const newConfig = { ...formData, sourceCategories: updatedCategories };
      setFormData(newConfig);

      try {
        const savedSourcesStr = localStorage.getItem('jpschool_official_sources');
        if (savedSourcesStr) {
          const sources: any[] = JSON.parse(savedSourcesStr);
          const updatedSources = sources.map((s) => {
            if (s.subcategoriaId === subId) {
              return { ...s, subcategoriaId: undefined, subcategoriaNome: undefined };
            }
            return s;
          });
          localStorage.setItem('jpschool_official_sources', JSON.stringify(updatedSources));
        }
      } catch (e) {}
    }
  };

  const [isGeneratingSubcats, setIsGeneratingSubcats] = useState(false);
  const [subcatMessage, setSubcatMessage] = useState<string | null>(null);

  const handleAutoSubcategories = async (categoriaNome?: string) => {
    try {
      setIsGeneratingSubcats(true);
      setSubcatMessage('Inteligência Artificial analisando materiais e organizando subcategorias por assunto...');
      const res = await generateAutoSubcategories(categoriaNome);
      if (res.success) {
        setSubcatMessage(res.message);
        if (res.subcategorias && Array.isArray(res.subcategorias)) {
          const currentCategories = formData.sourceCategories || [];
          const updatedCategories = currentCategories.map((cat) => {
            if (!categoriaNome || cat.nome.toLowerCase().includes(categoriaNome.toLowerCase())) {
              return {
                ...cat,
                subcategorias: res.subcategorias,
              };
            }
            return cat;
          });
          const newCfg = { ...formData, sourceCategories: updatedCategories };
          setFormData(newCfg);
        }

        if (res.sources && Array.isArray(res.sources)) {
          try {
            localStorage.setItem('jpschool_official_sources', JSON.stringify(res.sources));
          } catch (e) {}
        }
      } else {
        setSubcatMessage(res.error || 'Erro ao gerar subcategorias.');
      }
    } catch (err: any) {
      setSubcatMessage(err.message || 'Erro de conexão ao gerar subcategorias.');
    } finally {
      setIsGeneratingSubcats(false);
    }
  };

  // --- CAROUSEL SLIDES HANDLERS (ITEM 7) ---
  const handleAddSlide = () => {
    const newSlide: CarouselSlide = {
      id: Date.now(),
      title: 'Novo Slide do Carrossel',
      subtitle: 'Descrição rápida das vantagens da funcionalidade.',
      badge: 'Novo Recurso',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
    };
    setFormData((prev) => ({
      ...prev,
      carouselSlides: [...prev.carouselSlides, newSlide],
    }));
  };

  const handleDeleteSlide = (id: number) => {
    if (formData.carouselSlides.length <= 1) {
      alert('O carrossel precisa conter pelo menos 1 slide.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      carouselSlides: prev.carouselSlides.filter((s) => s.id !== id),
    }));
  };

  // --- PLANS HANDLERS (ITEM 7) ---
  const handleAddPlan = () => {
    const newPlan: PlanItem = {
      id: `plano-${Date.now()}`,
      name: 'Novo Plano de Estudos',
      price: '599,99',
      installments: 'até 10x de R$ 59,99',
      subtitle: 'Descrição personalizada da modalidade de acesso.',
      features: [
        'Acesso completo ao Tutor IA treinado em Leis Oficiais',
        'Gerador de Plano de Estudos e Cronograma',
        'Simulados ilimitados e Banco de Questões',
      ],
      ctaText: 'Garantir Acesso ao Novo Plano',
    };
    setFormData((prev) => ({
      ...prev,
      plans: [...prev.plans, newPlan],
    }));
  };

  const handleDeletePlan = (planId: string) => {
    if (formData.plans.length <= 1) {
      alert('É necessário manter pelo menos 1 plano de vendas.');
      return;
    }
    if (confirm('Deseja realmente remover este plano?')) {
      setFormData((prev) => ({
        ...prev,
        plans: prev.plans.filter((p) => p.id !== planId),
      }));
    }
  };

  // --- TESTIMONIALS HANDLERS (ITEM 5 & ITEM 7) ---
  const handleAddTestimonial = () => {
    if (!newTestName.trim()) {
      alert('Informe o nome do professor no depoimento.');
      return;
    }
    const newTest: TestimonialItem = {
      id: `test-${Date.now()}`,
      name: newTestName.trim(),
      role: newTestRole.trim() || 'Aprovado(a) em Concurso Público',
      text: newTestText.trim() || 'Excelente plataforma de estudos! O tutor de IA me economizou meses de preparação.',
      stars: newTestStars,
    };
    setFormData((prev) => ({
      ...prev,
      testimonials: [...(prev.testimonials || []), newTest],
    }));
    setNewTestName('');
    setNewTestRole('');
    setNewTestText('');
  };

  const handleDeleteTestimonial = (testId: string) => {
    if (confirm('Deseja remover este depoimento?')) {
      setFormData((prev) => ({
        ...prev,
        testimonials: (prev.testimonials || []).filter((t) => t.id !== testId),
      }));
    }
  };

  // --- PILLARS/FEATURES HANDLERS (ITEM 7) ---
  const handleAddPillar = () => {
    if (!newPillarTitle.trim()) {
      alert('Informe o título da funcionalidade.');
      return;
    }
    const newPillar: PlatformFeatureItem = {
      id: `pillar-${Date.now()}`,
      title: newPillarTitle.trim(),
      description: newPillarDesc.trim() || 'Descrição dos benefícios para a rotina de estudos.',
      iconName: 'Sparkles',
    };
    setFormData((prev) => ({
      ...prev,
      pillarsFeatures: [...(prev.pillarsFeatures || []), newPillar],
    }));
    setNewPillarTitle('');
    setNewPillarDesc('');
  };

  const handleDeletePillar = (pillarId: string) => {
    if (confirm('Deseja remover esta funcionalidade da lista?')) {
      setFormData((prev) => ({
        ...prev,
        pillarsFeatures: (prev.pillarsFeatures || []).filter((p) => p.id !== pillarId),
      }));
    }
  };

  const currentVis = formData.blockVisibility || {
    showHero: true,
    showCarousel: true,
    showPillars: true,
    showPlans: true,
    showTestimonials: true,
    showCategories: true,
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      
      {/* Admin Header Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1877F2] to-blue-500 flex items-center justify-center text-white shadow-md">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white">Painel de Controle TI</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Gerenciador do Site & Plataforma
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Edição de Textos, Blocos, Depoimentos, Planos e Categorias</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {onPreviewSalesSite && (
              <button
                onClick={onPreviewSalesSite}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center space-x-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Ver Site de Vendas</span>
              </button>
            )}

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>

            <button
              onClick={onExitAdmin}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              title="Sair do painel admin"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Admin Content Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">

        {/* Save Model Notice — evita confusão sobre quando uma edição realmente vale */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2">
          <Save className="w-3.5 h-3.5 shrink-0" />
          <span>Suas edições ficam como rascunho até você clicar em "Salvar Alterações" — em todas as abas, sem exceção.</span>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="bg-emerald-500 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Alterações salvas com sucesso! As atualizações foram aplicadas em tempo real.</span>
            </div>
            <button onClick={() => setSaveSuccess(false)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap gap-2 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('texts')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'texts'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>1. Textos Hero & Marca</span>
          </button>

          <button
            onClick={() => setActiveTab('carousel')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'carousel'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>2. Carrossel ({formData.carouselSlides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'plans'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>3. Planos e Preços ({formData.plans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('testimonials')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'testimonials'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>4. Depoimentos ({(formData.testimonials || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'categories'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>5. Categorias ({(formData.sourceCategories || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pillars')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'pillars'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>6. Recursos / Pilares ({(formData.pillarsFeatures || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('visibility')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'visibility'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>7. Visibilidade de Blocos</span>
          </button>
        </div>

        {/* TAB 1: TEXTOS HERO & MARCA */}
        {activeTab === 'texts' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-[#2D3748] flex items-center space-x-2">
                <Layout className="w-5 h-5 text-[#1877F2]" />
                <span>Editar Títulos e Subtítulos do Hero</span>
              </h2>
              <p className="text-xs text-slate-500">Ajuste as frases principais exibidas no topo do site de vendas público.</p>
            </div>

            <div className="space-y-4 max-w-3xl text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título Inicial do Hero (Pré-destaque)</label>
                <input
                  type="text"
                  value={formData.heroTitle}
                  onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Texto em Destaque Colorido</label>
                <input
                  type="text"
                  value={formData.heroHighlight}
                  onChange={(e) => setFormData({ ...formData, heroHighlight: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Frase Subtítulo do Hero</label>
                <textarea
                  rows={3}
                  value={formData.heroSubtitle}
                  onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Comercial da Empresa / Marca</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-mail de Contato Institucional</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Restaurar Configurações Padrão</p>
                  <p className="text-slate-500">Volta todos os textos, imagens, depoimentos e planos para o padrão original.</p>
                </div>

                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restaurar Padrão</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CARROSSEL DE IMAGENS (ITEM 7: Adicionar mais slides) */}
        {activeTab === 'carousel' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#2D3748] flex items-center space-x-2">
                  <Image className="w-5 h-5 text-[#1877F2]" />
                  <span>Gerenciar Slides do Carrossel ({formData.carouselSlides.length} slides)</span>
                </h2>
                <p className="text-xs text-slate-500">Adicione novos slides sem limite fixo ou edite os existentes.</p>
              </div>

              <button
                onClick={handleAddSlide}
                className="px-4 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Slide</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.carouselSlides.map((slide, idx) => (
                <div key={slide.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 relative">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-xs font-extrabold text-[#1877F2] uppercase">Slide #{idx + 1}</span>
                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Título do Slide</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            carouselSlides: prev.carouselSlides.map((s) => (s.id === slide.id ? { ...s, title: val } : s)),
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Subtítulo Explicativo</label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            carouselSlides: prev.carouselSlides.map((s) => (s.id === slide.id ? { ...s, subtitle: val } : s)),
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Selo / Badge Destaque</label>
                      <input
                        type="text"
                        value={slide.badge}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            carouselSlides: prev.carouselSlides.map((s) => (s.id === slide.id ? { ...s, badge: val } : s)),
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">URL da Imagem de Exibição</label>
                      <input
                        type="text"
                        value={slide.imageUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            carouselSlides: prev.carouselSlides.map((s) => (s.id === slide.id ? { ...s, imageUrl: val } : s)),
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none font-mono text-[11px]"
                      />
                    </div>

                    <div className="pt-2">
                      <p className="block font-bold text-slate-500 text-[10px] uppercase mb-1">Prévia da Imagem:</p>
                      <div className="h-28 rounded-xl bg-slate-200 overflow-hidden relative">
                        <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PLANOS E PREÇOS (ITEM 4 & ITEM 7: Adicionar/Remover Planos flexíveis) */}
        {activeTab === 'plans' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#2D3748] flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-[#1877F2]" />
                  <span>Gerenciar Produtos e Planos de Vendas ({formData.plans.length} planos)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Esta é a ÚNICA seção oficial de preços do site de vendas. Adicione novos planos ou altere valores.
                </p>
              </div>

              <button
                onClick={handleAddPlan}
                className="px-4 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Plano</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.plans.map((plan, planIdx) => (
                <div key={plan.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 relative">
                  <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                    <span className="font-extrabold text-[#1877F2] text-xs">Plano #{planIdx + 1}: {plan.name}</span>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir plano"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nome do Plano</label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            plans: prev.plans.map((p) => (p.id === plan.id ? { ...p, name: val } : p)),
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Preço À Vista (R$)</label>
                        <input
                          type="text"
                          value={plan.price}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              plans: prev.plans.map((p) => (p.id === plan.id ? { ...p, price: val } : p)),
                            }));
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-500 outline-none text-[#1877F2]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Texto do Parcelamento</label>
                        <input
                          type="text"
                          value={plan.installments}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              plans: prev.plans.map((p) => (p.id === plan.id ? { ...p, installments: val } : p)),
                            }));
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Selo de Destaque (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: Mais Recomendado"
                        value={plan.popularBadge || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            plans: prev.plans.map((p) => (p.id === plan.id ? { ...p, popularBadge: val || undefined } : p)),
                          }));
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Descrição / Subtítulo do Plano</label>
                      <input
                        type="text"
                        value={plan.subtitle}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            plans: prev.plans.map((p) => (p.id === plan.id ? { ...p, subtitle: val } : p)),
                          }));
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DEPOIMENTOS (ITEM 5: Editor de Depoimentos & ITEM 7) */}
        {activeTab === 'testimonials' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-[#2D3748] flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-[#1877F2]" />
                <span>Editor de Depoimentos da Home</span>
              </h2>
              <p className="text-xs text-slate-500">
                Altere, adicione ou remova os depoimentos reais exibidos na seção de prova social do site de vendas.
              </p>
            </div>

            {/* Form to Add New Testimonial */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center space-x-2 font-bold text-[#1877F2]">
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Depoimento Real</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome do Professor</label>
                  <input
                    type="text"
                    placeholder="Ex: Profa. Maria Silva"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cargo / Resultado de Aprovação</label>
                  <input
                    type="text"
                    placeholder="Ex: Aprovada SED-SC 1º Lugar"
                    value={newTestRole}
                    onChange={(e) => setNewTestRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Avaliação em Estrelas</label>
                  <select
                    value={newTestStars}
                    onChange={(e) => setNewTestStars(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={5}>5 Estrelas (Excelente)</option>
                    <option value={4}>4 Estrelas (Muito Bom)</option>
                    <option value={3}>3 Estrelas (Regular)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Depoimento em Texto</label>
                <textarea
                  rows={2}
                  placeholder="Ex: O simulado inteligente me deu a confiança necessária para gabaritar a prova da FEPESE."
                  value={newTestText}
                  onChange={(e) => setNewTestText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                onClick={handleAddTestimonial}
                className="px-4 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Depoimento no Site</span>
              </button>
            </div>

            {/* List of Existing Testimonials */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs text-slate-700">Depoimentos Cadastrados ({(formData.testimonials || []).length})</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.testimonials || []).map((t, idx) => (
                  <div key={t.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative text-xs">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1 pr-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={t.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                testimonials: (prev.testimonials || []).map((item) =>
                                  item.id === t.id ? { ...item, name: val } : item
                                ),
                              }));
                            }}
                            className="font-extrabold text-slate-800 bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs w-full focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <input
                            type="text"
                            value={t.role}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                testimonials: (prev.testimonials || []).map((item) =>
                                  item.id === t.id ? { ...item, role: val } : item
                                ),
                              }));
                            }}
                            className="text-[11px] text-emerald-700 font-bold bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <textarea
                          rows={2}
                          value={t.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              testimonials: (prev.testimonials || []).map((item) =>
                                item.id === t.id ? { ...item, text: val } : item
                              ),
                            }));
                          }}
                          className="text-xs text-slate-600 bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <button
                        onClick={() => handleDeleteTestimonial(t.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                        title="Remover depoimento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CATEGORIAS DE MATERIAIS (ITEM 1: Sincronização ↔ Aluno, ITEM 2: Excluir, ITEM 3: Editar Nome/Badge) */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-[#2D3748] flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-[#1877F2]" />
                <span>Gerenciar Categorias dos Materiais de Estudo ({formData.sourceCategories?.length || 0})</span>
              </h2>
              <p className="text-xs text-slate-500">
                Qualquer categoria criada ou alterada aqui sincroniza automaticamente no painel lateral de estudos do aluno.
              </p>
            </div>

            {/* Form to Add New Category */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center space-x-2 font-bold text-[#1877F2]">
                <Plus className="w-4 h-4" />
                <span>Criar Nova Categoria de Fontes</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Curso / Cargo</label>
                  <input
                    type="text"
                    placeholder="Ex: Professor SED - História"
                    value={newCatCurso}
                    onChange={(e) => setNewCatCurso(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome da Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Estatutos Municipais"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Descrição / Detalhes</label>
                  <input
                    type="text"
                    placeholder="Ex: Leis de prefeituras de SC"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estilo do Badge</label>
                  <select
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="bg-blue-100 text-[#1877F2]">Azul (Normativa)</option>
                    <option value="bg-emerald-100 text-emerald-800">Verde (Legislação SC)</option>
                    <option value="bg-amber-100 text-amber-800">Amarelo (Educacional)</option>
                    <option value="bg-purple-100 text-purple-800">Roxo (Didática)</option>
                    <option value="bg-rose-100 text-rose-800">Rosa (Especial)</option>
                    <option value="bg-slate-200 text-slate-800">Cinza (Provas/Geral)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Categoria ao Curso</span>
              </button>
            </div>

            {/* Real-time Category & Course Search Bar (POSITIONED DIRECTLY ABOVE COURSES) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="relative flex-1 min-w-[280px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="🔍 Buscar por Curso, Cargo ou Categoria..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  />
                  {categorySearchQuery && (
                    <button
                      onClick={() => setCategorySearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white"
                    >
                      ✕ Limpar
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const all: Record<string, boolean> = {};
                      (formData.sourceCategories || []).forEach((c) => {
                        all[c.cursoNome || 'Professor SED - História'] = true;
                      });
                      setOpenCourseAccordions(all);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-300"
                  >
                    [+] Expandir Todos os Cursos
                  </button>
                  <button
                    onClick={() => setOpenCourseAccordions({})}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-300"
                  >
                    [-] Recolher Todos os Cursos
                  </button>
                </div>
              </div>
            </div>

            {/* List of Existing Categories Grouped by Course (SANFONA ACCORDION) */}
            <div className="space-y-4">
              {(() => {
                const allCategories = formData.sourceCategories || [];
                const search = categorySearchQuery.toLowerCase().trim();

                const filteredCategories = allCategories.filter((cat) => {
                  if (!search) return true;
                  const matchCat = cat.nome.toLowerCase().includes(search) || (cat.descricao && cat.descricao.toLowerCase().includes(search));
                  const matchCurso = (cat.cursoNome || 'Professor SED - História').toLowerCase().includes(search);
                  const matchSub = cat.subcategorias && cat.subcategorias.some((s) => s.nome.toLowerCase().includes(search));
                  return matchCat || matchCurso || matchSub;
                });

                const courseGroups: Record<string, CategoriaFonte[]> = {};
                filteredCategories.forEach((cat) => {
                  const cursoName = cat.cursoNome || 'Professor SED - História';
                  if (!courseGroups[cursoName]) courseGroups[cursoName] = [];
                  courseGroups[cursoName].push(cat);
                });

                const courseNames = Object.keys(courseGroups);

                if (courseNames.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                      Nenhum curso ou categoria encontrado com o termo "{categorySearchQuery}".
                    </div>
                  );
                }

                return courseNames.map((cursoName) => {
                  const catsInCourse = courseGroups[cursoName];
                  const isOpen = openCourseAccordions[cursoName] !== false; // open by default unless set to false

                  return (
                    <div key={cursoName} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-lg text-white">
                      {/* Course Header Bar (Clickable Accordion) */}
                      <div
                        className="p-4.5 bg-slate-800/90 hover:bg-slate-800 flex items-center justify-between flex-wrap gap-3 cursor-pointer select-none border-b border-slate-800"
                        onClick={() => {
                          setOpenCourseAccordions((prev) => ({
                            ...prev,
                            [cursoName]: !isOpen,
                          }));
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <button className="text-slate-400 hover:text-white p-1">
                            {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </button>
                          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                            <Folder className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                              <span>🎓 Curso / Cargo: {cursoName}</span>
                              <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-full border border-blue-500/30">
                                {catsInCourse.length} Categorias
                              </span>
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Clique para {isOpen ? 'recolher' : 'expandir'} a visualização das categorias deste curso.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleAutoSubcategories(cursoName)}
                            disabled={isGeneratingSubcats}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border flex items-center space-x-2 shadow-md ${
                              isGeneratingSubcats
                                ? 'bg-indigo-950 border-indigo-800 text-indigo-300 animate-pulse'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-indigo-400 shadow-indigo-500/20 cursor-pointer hover:scale-102'
                            }`}
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSubcats ? 'animate-spin' : ''}`} />
                            <span>✨ Organizar Subcategorias do Curso</span>
                          </button>
                        </div>
                      </div>

                      {/* Grid of Categories for this Course (Only shown when expanded) */}
                      {isOpen && (
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40">
                          {catsInCourse.map((cat) => (
                            <div key={cat.id} className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700/80 space-y-3 relative text-xs text-slate-200 shadow-sm">
                              <div className="flex justify-between items-start">
                                <div className="space-y-2 flex-1 pr-2">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Nome da Categoria</label>
                                    <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
                                      {cat.cursoNome || cursoName}
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={cat.nome}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const updatedCategories = (formData.sourceCategories || []).map((c) =>
                                        c.id === cat.id ? { ...c, nome: val } : c
                                      );
                                      const newCfg = { ...formData, sourceCategories: updatedCategories };
                                      setFormData(newCfg);
                                    }}
                                    className="font-extrabold text-white bg-slate-900 px-2.5 py-1.5 border border-slate-700 rounded-lg text-xs w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Descrição</label>
                                  <input
                                    type="text"
                                    value={cat.descricao || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFormData((prev) => ({
                                        ...prev,
                                        sourceCategories: (prev.sourceCategories || []).map((c) =>
                                          c.id === cat.id ? { ...c, descricao: val } : c
                                        ),
                                      }));
                                    }}
                                    placeholder="Descrição da categoria..."
                                    className="text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1.5 border border-slate-700 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Estilo do Badge</label>
                                  <select
                                    value={cat.corBadge || 'bg-blue-100 text-[#1877F2]'}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFormData((prev) => ({
                                        ...prev,
                                        sourceCategories: (prev.sourceCategories || []).map((c) =>
                                          c.id === cat.id ? { ...c, corBadge: val } : c
                                        ),
                                      }));
                                    }}
                                    className="text-[11px] font-medium bg-slate-900 text-white px-2.5 py-1.5 border border-slate-700 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                  >
                                    <option value="bg-blue-100 text-[#1877F2]">Azul (Normativa)</option>
                                    <option value="bg-emerald-100 text-emerald-800">Verde (Legislação SC)</option>
                                    <option value="bg-amber-100 text-amber-800">Amarelo (Educacional)</option>
                                    <option value="bg-purple-100 text-purple-800">Roxo (Didática)</option>
                                    <option value="bg-rose-100 text-rose-800">Rosa (Especial)</option>
                                    <option value="bg-slate-200 text-slate-800">Cinza (Provas/Geral)</option>
                                  </select>
                                </div>

                                {/* Subcategorias Ativas da Categoria */}
                                <div className="pt-2.5 border-t border-slate-700/80 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center space-x-1">
                                      <Sparkles className="w-3 h-3 text-indigo-400" />
                                      <span>Subcategorias Geradas ({cat.subcategorias?.length || 0})</span>
                                    </label>
                                    <button
                                      onClick={() => handleAutoSubcategories(cat.nome)}
                                      disabled={isGeneratingSubcats}
                                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center space-x-1"
                                    >
                                      <span>+ Gerar Tópicos</span>
                                    </button>
                                  </div>

                                  {(!cat.subcategorias || cat.subcategorias.length === 0) ? (
                                    <p className="text-[10px] text-slate-400 italic bg-slate-900/70 p-2 rounded-lg border border-dashed border-slate-700">
                                      Nenhuma subcategoria gerada ainda. Vincule PDFs nesta categoria no RAG e clique em "+ Gerar Tópicos".
                                    </p>
                                  ) : (
                                    <div className="space-y-1">
                                      {cat.subcategorias.map((sub) => (
                                        <div key={sub.id} className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px]">
                                          <div className="flex items-center space-x-1.5 min-w-0 pr-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                                            <span className="font-bold text-slate-200 truncate">{sub.nome}</span>
                                          </div>
                                          <button
                                            onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                                            className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-950/50 rounded transition-colors shrink-0"
                                            title="Excluir subcategoria (os PDFs retornarão com segurança para a categoria pai)"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-xl transition-colors shrink-0 ml-1"
                                title="Remover Categoria"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* TAB 6: PILARES / RECURSOS (ITEM 7: Flexibilidade em todas as abas) */}
        {activeTab === 'pillars' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#2D3748] flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-[#1877F2]" />
                  <span>Gerenciar Funcionalidades e Pilares ({formData.pillarsFeatures.length} itens)</span>
                </h2>
                <p className="text-xs text-slate-500">Adicione ou edite os cartões de recursos exibidos na home.</p>
              </div>
            </div>

            {/* Form to Add New Pillar */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center space-x-2 font-bold text-[#1877F2]">
                <Plus className="w-4 h-4" />
                <span>Adicionar Nova Funcionalidade em Destaque</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Título do Recurso</label>
                  <input
                    type="text"
                    placeholder="Ex: Simulador com Inteligência Emocional"
                    value={newPillarTitle}
                    onChange={(e) => setNewPillarTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Descrição Explicativa</label>
                  <input
                    type="text"
                    placeholder="Ex: Feedback ao vivo sobre tempo de resposta e pegadinhas."
                    value={newPillarDesc}
                    onChange={(e) => setNewPillarDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleAddPillar}
                className="px-4 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar ao Site</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.pillarsFeatures.map((pillar) => (
                <div key={pillar.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative text-xs">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1 pr-2">
                      <input
                        type="text"
                        value={pillar.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            pillarsFeatures: prev.pillarsFeatures.map((p) =>
                              p.id === pillar.id ? { ...p, title: val } : p
                            ),
                          }));
                        }}
                        className="font-extrabold text-slate-800 bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs w-full focus:ring-2 focus:ring-blue-500 outline-none"
                      />

                      <textarea
                        rows={2}
                        value={pillar.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            pillarsFeatures: prev.pillarsFeatures.map((p) =>
                              p.id === pillar.id ? { ...p, description: val } : p
                            ),
                          }));
                        }}
                        className="text-xs text-slate-600 bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handleDeletePillar(pillar.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                      title="Remover recurso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: VISIBILIDADE DOS BLOCOS DA HOME (ITEM 6: Toggles de visibilidade por bloco) */}
        {activeTab === 'visibility' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-[#2D3748] flex items-center space-x-2">
                <Eye className="w-5 h-5 text-[#1877F2]" />
                <span>Controle de Visibilidade dos Blocos da Home</span>
              </h2>
              <p className="text-xs text-slate-500">
                Ligue ou desligue qualquer seção do site público instantaneamente sem precisar apagar os conteúdos cadastrados.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              
              {/* Hero Header Toggle */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800">Bloco Hero (Topo)</h4>
                  <p className="text-[11px] text-slate-500">Título principal e destaques</p>
                </div>
                <button
                  onClick={() => handleToggleBlock('showHero')}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${
                    currentVis.showHero !== false
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {currentVis.showHero !== false ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visível</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Oculto</span>
                    </>
                  )}
                </button>
              </div>

              {/* Carousel Toggle */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800">Carrossel de Slides</h4>
                  <p className="text-[11px] text-slate-500">Slides de imagens do Hero</p>
                </div>
                <button
                  onClick={() => handleToggleBlock('showCarousel')}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${
                    currentVis.showCarousel !== false
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {currentVis.showCarousel !== false ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visível</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Oculto</span>
                    </>
                  )}
                </button>
              </div>

              {/* Pillars/Features Toggle */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800">Pilares / Funcionalidades</h4>
                  <p className="text-[11px] text-slate-500">Grid de recursos principais</p>
                </div>
                <button
                  onClick={() => handleToggleBlock('showPillars')}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${
                    currentVis.showPillars !== false
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {currentVis.showPillars !== false ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visível</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Oculto</span>
                    </>
                  )}
                </button>
              </div>

              {/* Plans/Pricing Toggle */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800">Planos e Preços</h4>
                  <p className="text-[11px] text-slate-500">Cards de investimento e vendas</p>
                </div>
                <button
                  onClick={() => handleToggleBlock('showPlans')}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${
                    currentVis.showPlans !== false
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {currentVis.showPlans !== false ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visível</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Oculto</span>
                    </>
                  )}
                </button>
              </div>

              {/* Testimonials Toggle */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800">Seção de Depoimentos</h4>
                  <p className="text-[11px] text-slate-500">Prova social de professores</p>
                </div>
                <button
                  onClick={() => handleToggleBlock('showTestimonials')}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${
                    currentVis.showTestimonials !== false
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {currentVis.showTestimonials !== false ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visível</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Oculto</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};
