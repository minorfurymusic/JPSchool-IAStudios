import React from 'react';
import { User, CotasState } from '../../types';
import { Sparkles, Calendar, Download, Cpu } from 'lucide-react';

interface TopHeaderProps {
  user: User;
  cotas: CotasState;
  isRetaFinal: boolean;
  onToggleRetaFinal?: () => void;
  onOpenNotes?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  user,
  cotas,
  isRetaFinal,
}) => {
  // Render quota dots
  const renderDots = (used: number, max: number) => {
    const dots = [];
    for (let i = 0; i < max; i++) {
      dots.push(
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full inline-block transition-all ${
            i < used ? 'bg-[#1877F2]' : 'bg-slate-200 border border-slate-300'
          }`}
        />
      );
    }
    return dots;
  };

  // Calculate dynamic days remaining until target exam date
  const getDaysRemaining = (dateString?: string) => {
    if (!dateString) return 47;
    const targetDate = new Date(dateString);
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining(user.dataProva);

  return (
    <div className="bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        
        {/* Main Header Bar (Name -> Reta Final -> Produções/Downloads/Prova) */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          
          {/* Left Welcome (Name + Short Course) */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1877F2] to-slate-800 text-white font-extrabold text-base flex items-center justify-center shadow-xs">
              {user.nome ? user.nome.charAt(0) : 'M'}
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#2D3748] leading-tight">
                {user.nome}
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                {user.turmaNome}
              </p>
            </div>
          </div>

          {/* Middle: Reta Final Notice fitted inline */}
          {isRetaFinal && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl px-3.5 py-2 flex items-center space-x-2 text-xs text-amber-900 shadow-2xs font-medium max-w-lg">
              <Sparkles className="w-4 h-4 text-[#C85A00] shrink-0" />
              <span className="leading-tight">
                Reta final: faltam {daysRemaining} dias para a prova. Siga nosso plano de reta final.
              </span>
            </div>
          )}

          {/* Right Quotas & Exam Countdown */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
            
            {/* Produções Quota */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-1.5 flex items-center space-x-2 text-xs shadow-2xs">
              <Cpu className="w-3.5 h-3.5 text-[#1877F2]" />
              <div>
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700">
                  <span>Produções:</span>
                  <span className="text-[#1877F2]">{cotas.producoesUsadas}/{cotas.producoesMax}</span>
                </div>
                <div className="flex items-center space-x-1 mt-0.5">
                  {renderDots(cotas.producoesUsadas, cotas.producoesMax)}
                </div>
              </div>
            </div>

            {/* Downloads Quota */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-1.5 flex items-center space-x-2 text-xs shadow-2xs">
              <Download className="w-3.5 h-3.5 text-[#C85A00]" />
              <div>
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700">
                  <span>Downloads:</span>
                  <span className="text-[#C85A00]">{cotas.downloadsUsados}/{cotas.downloadsMax}</span>
                </div>
                <div className="flex items-center space-x-1 mt-0.5">
                  {renderDots(cotas.downloadsUsados, cotas.downloadsMax)}
                </div>
              </div>
            </div>

            {/* Exam Countdown Badge */}
            <div className="bg-blue-50/90 border border-blue-200/80 text-blue-900 rounded-2xl px-3 py-1.5 flex items-center space-x-2 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 text-[#1877F2]" />
              <div>
                <span className="block text-[9px] text-blue-700 font-medium uppercase tracking-wider">Prova: 15/SET</span>
                <span className="text-[11px] font-extrabold">{daysRemaining} dias restantes</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
