import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  HelpCircle,
  BarChart3,
  LogOut,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { User } from '../../types';

interface AdminBackstageProps {
  user: User;
  onLogout: () => void;
  onGoToPlatform?: () => void;
}

export const AdminBackstage: React.FC<AdminBackstageProps> = ({
  user,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'aulas' | 'questoes' | 'editais' | 'relatorios'>('aulas');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased">
      
      {/* Admin Backstage Top Bar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white">Backstage de Conteúdo</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                  Perfil: {user.role.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Usuário: <strong className="text-slate-200">{user.usuario}</strong> ({user.nome})</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-xl transition-all border border-rose-500/30 flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">

        {/* Navigation Tabs */}
        <div className="bg-slate-800/80 p-2 rounded-2xl border border-slate-700 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
          <button
            onClick={() => setActiveTab('aulas')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'aulas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Cursos & Aulas</span>
          </button>

          <button
            onClick={() => setActiveTab('questoes')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'questoes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>2. Banco de Questões</span>
          </button>

          <button
            onClick={() => setActiveTab('editais')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'editais'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>3. Editais & Documentos</span>
          </button>

          <button
            onClick={() => setActiveTab('relatorios')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'relatorios'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>4. Desempenho do Acervo</span>
          </button>
        </div>

        {/* Tab Content Placeholder / Ready State */}
        <div className="bg-slate-800/50 rounded-3xl p-6 sm:p-8 border border-slate-700 min-h-[300px] flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center text-blue-400 border border-slate-600">
            <Layers className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-bold text-white">Módulo de {activeTab.toUpperCase()} (Gestão de Conteúdo)</h3>
            <p className="text-xs text-slate-400">
              O banco de dados foi resetado e este painel Admin está pronto para receber novas estruturas de conteúdo conforme os próximos testes.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};
