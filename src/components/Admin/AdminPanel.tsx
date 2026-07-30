import React, { useState } from 'react';
import {
  Settings,
  Layout,
  Image,
  CreditCard,
  MousePointer,
  Save,
  RotateCcw,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { SiteConfig, PlanItem, CarouselSlide, PlatformFeatureItem } from '../../types';

interface AdminPanelProps {
  siteConfig: SiteConfig;
  onUpdateConfig: (newConfig: SiteConfig) => void;
  onResetDefault: () => void;
  onExitAdmin: () => void;
  onPreviewSalesSite: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  siteConfig,
  onUpdateConfig,
  onResetDefault,
  onExitAdmin,
  onPreviewSalesSite,
}) => {
  const [activeTab, setActiveTab] = useState<'texts' | 'carousel' | 'plans' | 'buttons' | 'categories'>('texts');
  const [formData, setFormData] = useState<SiteConfig>(JSON.parse(JSON.stringify(siteConfig)));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('bg-blue-100 text-[#1877F2]');

  const handleSave = () => {
    onUpdateConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

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
    };

    setFormData((prev) => ({
      ...prev,
      sourceCategories: [...(prev.sourceCategories || []), newCat],
    }));

    setNewCatName('');
    setNewCatDesc('');
  };

  const handleDeleteCategory = (catId: string) => {
    if ((formData.sourceCategories || []).length <= 1) {
      alert('É necessário manter pelo menos 1 categoria de fontes.');
      return;
    }
    if (confirm('Tem certeza que deseja remover esta categoria de fontes?')) {
      setFormData((prev) => ({
        ...prev,
        sourceCategories: (prev.sourceCategories || []).filter((c) => c.id !== catId),
      }));
    }
  };

  const handleReset = () => {
    if (confirm('Deseja realmente restaurar os textos e imagens para o padrão original do site?')) {
      onResetDefault();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Helper for adding slide
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

  // Helper for deleting slide
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
                <span className="font-extrabold text-base tracking-tight text-white">Painel de Controle Admin / TI</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Layout & Textos Comerciais
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Gerenciador de Aparência do Site de Vendas JPSchool IA</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onPreviewSalesSite}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center space-x-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Ver Site de Vendas</span>
            </button>

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
        
        {/* Success Alert */}
        {saveSuccess && (
          <div className="bg-emerald-500 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Alterações salvas com sucesso! O site de vendas foi atualizado em tempo real.</span>
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
            <span>2. Carrossel de Imagens (carrossel-1)</span>
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
            <span>3. Planos e Preços Exibidos</span>
          </button>

          <button
            onClick={() => setActiveTab('buttons')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'buttons'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span>4. Contato & Suporte</span>
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
            <span>5. Categorias de Materiais</span>
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
                <label className="block font-bold text-slate-700 mb-1">Frase Subtítulo do Hero (Apresentação Principal)</label>
                <textarea
                  rows={3}
                  value={formData.heroSubtitle}
                  onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Conforme solicitado: Frase curta sem complicações tecnológicas.</p>
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
            </div>
          </div>
        )}

        {/* TAB 2: CARROSSEL DE IMAGENS */}
        {activeTab === 'carousel' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#2D3748] flex items-center space-x-2">
                  <Image className="w-5 h-5 text-[#1877F2]" />
                  <span>Gerenciar Slides do Carrossel (carrossel-1)</span>
                </h2>
                <p className="text-xs text-slate-500">Adicione ou troque imagens e textos do carrossel em destaque no Hero.</p>
              </div>

              <button
                onClick={handleAddSlide}
                className="px-3.5 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
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
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
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

        {/* TAB 3: PLANOS E PREÇOS */}
        {activeTab === 'plans' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-[#2D3748] flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-[#1877F2]" />
                <span>Gerenciar Produtos e Valores dos Planos</span>
              </h2>
              <p className="text-xs text-slate-500">Altere preços, parcelamentos e nomes dos produtos comercializados.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.plans.map((plan, planIdx) => (
                <div key={plan.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                    <span className="font-extrabold text-[#1877F2] text-xs">Produto #{planIdx + 1}: {plan.name}</span>
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
                      <label className="block font-bold text-slate-700 mb-1">Descrição / Subtítulo</label>
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CONTATO & SUPORTE */}
        {activeTab === 'buttons' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-[#2D3748] flex items-center space-x-2">
                <MousePointer className="w-5 h-5 text-[#1877F2]" />
                <span>Textos de Botões e Contato de Vendas</span>
              </h2>
              <p className="text-xs text-slate-500">Configure rótulos de botões de chamada e atalhos.</p>
            </div>

            <div className="space-y-4 max-w-2xl text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Texto do Botão Principal do Hero</label>
                <input
                  type="text"
                  value={formData.ctaButtonText}
                  onChange={(e) => setFormData({ ...formData, ctaButtonText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Restaurar Configurações Padrão</p>
                  <p className="text-slate-500">Volta todos os textos, imagens e planos para a versão inicial do sistema.</p>
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

        {/* TAB 5: CATEGORIAS DE MATERIAIS */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-[#2D3748] flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-[#1877F2]" />
                <span>Gerenciar Categorias dos Materiais de Estudo</span>
              </h2>
              <p className="text-xs text-slate-500">
                Crie, edite e organize as categorias de agrupamento exibidas na barra lateral de estudos do aluno.
              </p>
            </div>

            {/* Form to Add New Category */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center space-x-2 font-bold text-[#1877F2]">
                <Plus className="w-4 h-4" />
                <span>Criar Nova Categoria de Fontes</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <span>Adicionar Categoria ao Sistema</span>
              </button>
            </div>

            {/* List of Existing Categories */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-700">Categorias Ativas ({formData.sourceCategories?.length || 0})</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.sourceCategories || []).map((cat) => (
                  <div key={cat.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative text-xs">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1 pr-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={cat.nome}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                sourceCategories: (prev.sourceCategories || []).map((c) =>
                                  c.id === cat.id ? { ...c, nome: val } : c
                                ),
                              }));
                            }}
                            className="font-extrabold text-slate-800 bg-white px-2 py-1 border border-slate-200 rounded-lg text-xs w-full focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

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
                          className="text-[11px] text-slate-500 bg-white px-2 py-1 border border-slate-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                        title="Remover categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="font-medium text-slate-500">Visual do Badge:</span>
                      <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${cat.corBadge || 'bg-slate-200 text-slate-800'}`}>
                        {cat.nome}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
