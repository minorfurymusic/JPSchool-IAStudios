import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/SalesSite/Hero';
import { Pillars } from './components/SalesSite/Pillars';
import { ClassesCatalog } from './components/SalesSite/ClassesCatalog';
import { Pricing } from './components/SalesSite/Pricing';
import { SocialProof } from './components/SalesSite/SocialProof';
import { Footer } from './components/SalesSite/Footer';
import { CartDrawer } from './components/CartDrawer';
import { AdminPanel } from './components/Admin/AdminPanel';
import { AdminBackstage } from './components/Admin/AdminBackstage';

import { SourcesSidebar } from './components/LearnerPlatform/SourcesSidebar';
import { StudioSidebar } from './components/LearnerPlatform/StudioSidebar';
import { Workspace } from './components/LearnerPlatform/Workspace';
import { NotesDrawer } from './components/LearnerPlatform/NotesDrawer';

import {
  TEST_USERS,
  CURRENT_USER,
  INITIAL_COTAS,
  OFFICIAL_SOURCES,
  FEATURES,
  MOCK_QUESTIONS,
  MOCK_ANNOTATIONS,
} from './data/mockDatabase';
import { DEFAULT_SITE_CONFIG } from './data/siteConfig';
import { User, CotasState, FeatureId, FonteEstudo, AnotacaoItem, ProducaoResultado, SiteConfig, PlanItem } from './types';
import { fetchCotas, fetchSources, fetchQuestions, fetchCursosMaterias } from './services/api';

export function App() {
  const [currentView, setCurrentView] = useState<'sales' | 'platform' | 'admin_backstage' | 'admin_ti'>(() => {
    try {
      const saved = localStorage.getItem('jpschool_current_view');
      if (saved) return saved as any;
    } catch (e) {}
    return 'admin_backstage';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('jpschool_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return TEST_USERS[0]; // Default to Super Admin
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('jpschool_is_logged_in');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return true;
  });

  const [isRetaFinal, setIsRetaFinal] = useState(true);
  const [selectedTurmaName, setSelectedTurmaName] = useState('SED ACT 2026');

  useEffect(() => {
    try {
      localStorage.setItem('jpschool_current_view', currentView);
    } catch (e) {}
  }, [currentView]);

  useEffect(() => {
    try {
      localStorage.setItem('jpschool_current_user', JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('jpschool_is_logged_in', JSON.stringify(isLoggedIn));
    } catch (e) {}
  }, [isLoggedIn]);

  // Site Configuration state editable via Admin Panel with localStorage persistence
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try {
      const saved = localStorage.getItem('jpschool_site_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sourceCategories && Array.isArray(parsed.sourceCategories) && parsed.sourceCategories.length > 0) {
          const isCorrupted = parsed.sourceCategories.every((c: any) => c.nome.toLowerCase().includes('teste'));
          if (isCorrupted) {
            localStorage.removeItem('jpschool_site_config');
            return DEFAULT_SITE_CONFIG;
          }
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SITE_CONFIG;
  });

  const handleUpdateSiteConfig = (newConfig: SiteConfig) => {
    setSiteConfig(newConfig);
    try {
      localStorage.setItem('jpschool_site_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetSiteConfig = () => {
    try {
      localStorage.removeItem('jpschool_site_config');
    } catch (e) {
      console.error(e);
    }
    setSiteConfig(DEFAULT_SITE_CONFIG);
  };

  // Cart Drawer state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartPlan, setCartPlan] = useState<PlanItem>(siteConfig.plans[0]);

  // Data states (Clean reset environment)
  const [sources, setSources] = useState<FonteEstudo[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeFeatureId, setActiveFeatureId] = useState<FeatureId>('plano_estudo');
  const [cotas, setCotas] = useState<CotasState>(INITIAL_COTAS);
  const [notes, setNotes] = useState<AnotacaoItem[]>(MOCK_ANNOTATIONS);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Sync cotas, sources, courses/materias, and questions from backend on mount/view change
  useEffect(() => {
    fetchCotas().then((c) => setCotas(c));
    fetchSources().then((s) => {
      setSources(s);
    });
    fetchCursosMaterias().then((res) => {
      if (res && Array.isArray(res.cursos) && res.cursos.length > 0) {
        const activeCourse = res.cursos.find((c: any) => c.nome === selectedTurmaName) || res.cursos[0];
        if (activeCourse && Array.isArray(activeCourse.materias) && activeCourse.materias.length > 0) {
          const backendCategories = activeCourse.materias.map((m: any) => ({
            id: m.id,
            nome: m.nome,
            corBadge: m.corBadge || 'bg-blue-100 text-blue-800',
          }));
          setSiteConfig((prev) => ({
            ...prev,
            sourceCategories: backendCategories,
          }));
        }
      }
    });
    fetchQuestions().then((q) => setQuestions(q));
  }, [currentView, selectedTurmaName]);

  // Login handler
  const handleLoginWithUser = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    try {
      localStorage.setItem('jpschool_current_user', JSON.stringify(user));
      localStorage.setItem('jpschool_is_logged_in', JSON.stringify(true));
    } catch (e) {}
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('sales');
    try {
      localStorage.setItem('jpschool_is_logged_in', JSON.stringify(false));
      localStorage.setItem('jpschool_current_view', 'sales');
    } catch (e) {}
  };

  // Handlers for sources
  const handleToggleSource = (id: number) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selecionada: !s.selecionada } : s))
    );
  };

  const handleSelectAllSources = () => {
    const allSelected = sources.every((s) => s.selecionada);
    setSources((prev) => prev.map((s) => ({ ...s, selecionada: !allSelected })));
  };

  // Handler for saving note
  const handleSaveNote = (producao: ProducaoResultado) => {
    const newNote: AnotacaoItem = {
      id: Date.now(),
      producaoId: producao.id,
      titulo: producao.titulo || `Anotação de ${producao.featureId}`,
      featureId: producao.featureId,
      materia: 'Geral',
      data: new Date().toLocaleDateString('pt-BR'),
      conteudoResumido:
        typeof producao.conteudo === 'string'
          ? producao.conteudo.slice(0, 150) + '...'
          : 'Conteúdo gerado no estúdio',
      origem: producao.origem,
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  // Handler for deleting note
  const handleDeleteNote = (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const activeFeature = FEATURES.find((f) => f.id === activeFeatureId) || FEATURES[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-[#1877F2]">
      
      {/* Navbar (Visible except when in full Admin Panel mode if preferred) */}
      {currentView !== 'admin_ti' && currentView !== 'admin_backstage' && (
        <Navbar
          currentView={currentView}
          onViewChange={setCurrentView}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onLoginWithUser={handleLoginWithUser}
          cartCount={1}
          onOpenCart={() => setIsCartOpen(true)}
          companyName={siteConfig.companyName}
          user={currentUser}
          cotas={cotas}
          isRetaFinal={isRetaFinal}
          onOpenNotes={() => setIsNotesOpen(true)}
        />
      )}

      {/* VIEW 1: SALES SITE (ÁREA PÚBLICA) */}
      {currentView === 'sales' && (
        <div className="flex-1 flex flex-col">
          {siteConfig.blockVisibility?.showHero !== false && (
            <Hero
              heroTitle={siteConfig.heroTitle}
              heroHighlight={siteConfig.heroHighlight}
              heroSubtitle={siteConfig.heroSubtitle}
              ctaButtonText={siteConfig.ctaButtonText}
              slides={siteConfig.carouselSlides}
              onStartLearner={() => {
                if (!isLoggedIn) {
                  handleLoginWithUser(TEST_USERS[2]); // jeanrsl
                }
                setCurrentView('platform');
              }}
              onSelectPlanClick={() => {
                const el = document.getElementById('planos');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          )}

          {siteConfig.blockVisibility?.showPillars !== false && (
            <Pillars features={siteConfig.pillarsFeatures} />
          )}

          {siteConfig.blockVisibility?.showPlans !== false && (
            <Pricing
              plans={siteConfig.plans}
              selectedTurmaName={selectedTurmaName}
              onEnrollSuccess={() => {
                handleLoginWithUser(TEST_USERS[2]); // jeanrsl
                setCurrentView('platform');
              }}
            />
          )}

          {siteConfig.blockVisibility?.showTestimonials !== false && (
            <SocialProof testimonials={siteConfig.testimonials} />
          )}

          <Footer
            companyName={siteConfig.companyName}
            contactEmail={siteConfig.contactEmail}
            onOpenAdmin={() => {
              if (currentUser.role === 'admin') {
                setCurrentView('admin_backstage');
              } else {
                setCurrentView('admin_ti');
              }
            }}
          />
        </div>
      )}

      {/* VIEW 2: LEARNER PLATFORM (ÁREA DO ALUNO - CLIENTE) */}
      {currentView === 'platform' && (
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Main 3-Column Studio Workspace */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
            
            {/* Left Column: Official Sources Checklist */}
            <SourcesSidebar
              sources={sources}
              categories={siteConfig.sourceCategories}
              onToggleSource={handleToggleSource}
              onSelectAll={handleSelectAllSources}
            />

            {/* Middle Column: Active Tool Interactive Workspace */}
            <Workspace
              activeFeature={activeFeature}
              selectedSources={sources}
              isRetaFinal={isRetaFinal}
              onQuotaUsed={() => {
                fetchCotas().then((c) => setCotas(c));
              }}
              onSaveNote={handleSaveNote}
              allQuestions={questions}
            />

            {/* Right Column: Studio 4-Group Feature Catalog */}
            <StudioSidebar
              features={FEATURES}
              activeFeatureId={activeFeatureId}
              onSelectFeature={setActiveFeatureId}
              isRetaFinal={isRetaFinal}
            />

          </div>

          {/* Notes Drawer Modal */}
          <NotesDrawer
            isOpen={isNotesOpen}
            onClose={() => setIsNotesOpen(false)}
            notes={notes}
            onDeleteNote={handleDeleteNote}
          />

        </div>
      )}

      {/* VIEW 3: ADMIN BACKSTAGE (GESTAO DE CONTEUDO PARA ADMIN) */}
      {currentView === 'admin_backstage' && (
        <AdminBackstage
          user={currentUser}
          onLogout={handleLogout}
          onGoToPlatform={() => setCurrentView('platform')}
          siteConfig={siteConfig}
          onUpdateConfig={handleUpdateSiteConfig}
          onResetDefault={handleResetSiteConfig}
        />
      )}

      {/* VIEW 4: ADMIN / TI PANEL (EDITOR VISUAL DO SITE E LAYOUT) */}
      {currentView === 'admin_ti' && (
        <AdminPanel
          siteConfig={siteConfig}
          onUpdateConfig={handleUpdateSiteConfig}
          onResetDefault={handleResetSiteConfig}
          onExitAdmin={() => setCurrentView('sales')}
          onPreviewSalesSite={() => setCurrentView('sales')}
        />
      )}

      {/* Global Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        selectedPlan={cartPlan}
        onSelectPlan={(plan) => setCartPlan(plan)}
        allPlans={siteConfig.plans}
        onCheckout={() => {
          handleLoginWithUser(TEST_USERS[3]); // jeanrsl
          setCurrentView('platform');
        }}
      />

    </div>
  );
}

export default App;
