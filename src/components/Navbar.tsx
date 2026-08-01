import React, { useState } from 'react';
import { User, CotasState } from '../types';
import { TEST_USERS } from '../data/mockDatabase';
import {
  GraduationCap,
  UserCheck,
  LogOut,
  ArrowRight,
  ShoppingCart,
  Settings,
  Lock,
  X,
  Sparkles,
  Calendar,
  Download,
  Cpu,
  ShieldCheck,
  Wrench,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'sales' | 'platform' | 'admin_backstage' | 'admin_ti';
  onViewChange: (view: 'sales' | 'platform' | 'admin_backstage' | 'admin_ti') => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  onLoginWithUser: (user: User) => void;
  cartCount: number;
  onOpenCart: () => void;
  companyName?: string;
  user?: User;
  cotas?: CotasState;
  isRetaFinal?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  isLoggedIn,
  onLogout,
  onLoginWithUser,
  cartCount = 1,
  onOpenCart,
  companyName = 'JPSchool',
  user,
  cotas,
  isRetaFinal = true,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [inputUsuario, setInputUsuario] = useState('');
  const [inputSenha, setInputSenha] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const foundUser = TEST_USERS.find(
      (u) =>
        u.usuario.toLowerCase() === inputUsuario.trim().toLowerCase() &&
        u.senha === inputSenha.trim()
    );

    if (foundUser) {
      onLoginWithUser(foundUser);
      setShowLoginModal(false);
      setInputUsuario('');
      setInputSenha('');

      if (foundUser.role === 'admin') {
        onViewChange('admin_backstage');
      } else if (foundUser.role === 'ti') {
        onViewChange('admin_ti');
      } else {
        onViewChange('platform');
      }
    } else {
      setLoginError('Usuário ou senha incorretos. Utilize as credenciais de teste.');
    }
  };

  const handleQuickLogin = (testUser: User) => {
    onLoginWithUser(testUser);
    setShowLoginModal(false);
    if (testUser.role === 'admin') {
      onViewChange('admin_backstage');
    } else if (testUser.role === 'ti') {
      onViewChange('admin_ti');
    } else {
      onViewChange('platform');
    }
  };

  // Helper for rendering quota indicator dots
  const renderDots = (used: number, max: number) => {
    const dots = [];
    for (let i = 0; i < max; i++) {
      dots.push(
        <span
          key={i}
          className={`w-2 h-2 rounded-full inline-block transition-all ${
            i < used ? 'bg-[#1877F2]' : 'bg-slate-200 border border-slate-300'
          }`}
        />
      );
    }
    return dots;
  };

  // Helper for dynamic days countdown
  const getDaysRemaining = (dateString?: string) => {
    if (!dateString) return 47;
    const targetDate = new Date(dateString);
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining(user?.dataProva);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[60px] py-2 flex items-center justify-between gap-3">
          
          {/* Brand Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer shrink-0"
            onClick={() => onViewChange('sales')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1877F2] to-[#4285F4] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#2D3748]">
                  {companyName}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">Inteligência Artificial para Concursos</p>
            </div>
          </div>

          {/* MIDDLE BLOCK: Student Info (Only in Platform view) */}
          {currentView === 'platform' && user && (
            <div className="flex-1 flex flex-wrap items-center justify-center gap-2 py-0.5 px-1">
              
              {/* User Name + Short Course */}
              <div className="flex items-center space-x-2 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1877F2] to-slate-800 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  {user.nome ? user.nome.charAt(0) : 'J'}
                </div>
                <div>
                  <h1 className="text-xs font-extrabold text-[#2D3748] leading-tight">
                    {user.nome}
                  </h1>
                  <p className="text-[10px] font-semibold text-slate-500 leading-tight">
                    {user.turmaNome || 'Plataforma de Estudos'}
                  </p>
                </div>
              </div>

              {/* Reta Final Notice */}
              {isRetaFinal && (
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl px-2.5 py-1 flex items-center space-x-1.5 text-[11px] text-amber-900 shadow-2xs font-medium max-w-xs text-left">
                  <Sparkles className="w-3.5 h-3.5 text-[#C85A00] shrink-0" />
                  <span className="leading-tight">
                    Reta final: faltam {daysRemaining} dias para a prova.<br className="hidden sm:inline" /> Siga nosso plano de reta final.
                  </span>
                </div>
              )}

              {/* Produções Quota */}
              {cotas && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 flex items-center space-x-1.5 text-[11px] shadow-2xs shrink-0">
                  <Cpu className="w-3.5 h-3.5 text-[#1877F2]" />
                  <div>
                    <div className="flex items-center space-x-1 font-bold text-slate-700 text-[10px]">
                      <span>Produções:</span>
                      <span className="text-[#1877F2]">{cotas.producoesUsadas}/{cotas.producoesMax}</span>
                    </div>
                    <div className="flex items-center space-x-0.5 mt-0.5">
                      {renderDots(cotas.producoesUsadas, cotas.producoesMax)}
                    </div>
                  </div>
                </div>
              )}

              {/* Downloads Quota */}
              {cotas && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 flex items-center space-x-1.5 text-[11px] shadow-2xs shrink-0">
                  <Download className="w-3.5 h-3.5 text-[#C85A00]" />
                  <div>
                    <div className="flex items-center space-x-1 font-bold text-slate-700 text-[10px]">
                      <span>Downloads:</span>
                      <span className="text-[#C85A00]">{cotas.downloadsUsados}/{cotas.downloadsMax}</span>
                    </div>
                    <div className="flex items-center space-x-0.5 mt-0.5">
                      {renderDots(cotas.downloadsUsados, cotas.downloadsMax)}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            
            {/* View Switching shortcuts when logged in */}
            {isLoggedIn && user && (
              <div className="flex items-center space-x-1.5">
                {user.role === 'admin' && currentView !== 'admin_backstage' && (
                  <button
                    onClick={() => onViewChange('admin_backstage')}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1877F2] rounded-xl text-xs font-bold border border-blue-200 transition-all flex items-center space-x-1"
                    title="Ir para Backstage de Conteúdo"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Backstage Admin</span>
                  </button>
                )}

                {user.role === 'ti' && currentView !== 'admin_ti' && (
                  <button
                    onClick={() => onViewChange('admin_ti')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition-all flex items-center space-x-1"
                    title="Ir para Painel de TI"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Painel TI</span>
                  </button>
                )}

                {user.role === 'cliente' && currentView !== 'platform' && (
                  <button
                    onClick={() => onViewChange('platform')}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1877F2] rounded-xl text-xs font-bold border border-blue-200 transition-all flex items-center space-x-1"
                    title="Ir para Área do Aluno"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Área do Aluno</span>
                  </button>
                )}
              </div>
            )}

            {/* Shopping Cart Icon Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-slate-700 hover:text-[#1877F2] hover:bg-slate-100 rounded-xl transition-all border border-slate-200/80 bg-white shadow-2xs"
              title="Abrir Carrinho de Compras"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1877F2] text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Dynamic Login / Logout Button */}
            {isLoggedIn ? (
              <button
                onClick={onLogout}
                className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs"
                title="Sair da conta"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair ({user?.usuario})</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-[#1877F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center space-x-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Login Modal for Admin, TI, and Cliente */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 space-y-5">
            
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-[#1877F2]">
                <Lock className="w-5 h-5" />
                <h3 className="font-extrabold text-lg text-[#2D3748]">Acesso ao Sistema</h3>
              </div>
              <p className="text-xs text-slate-500">
                Informe o seu usuário e senha para acessar o painel correspondente.
              </p>
            </div>

            {/* Manual Form Login */}
            <form onSubmit={handleLoginSubmit} className="space-y-3 pt-2 border-t border-slate-100">
              {loginError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Usuário</label>
                <input
                  type="text"
                  required
                  placeholder="Digite seu usuário"
                  value={inputUsuario}
                  onChange={(e) => setInputUsuario(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Senha</label>
                <input
                  type="password"
                  required
                  placeholder="Digite sua senha"
                  value={inputSenha}
                  onChange={(e) => setInputSenha(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
};
