import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Zap, CreditCard, X, ArrowRight, MessageCircle } from 'lucide-react';
import { PlanItem } from '../../types';

interface PricingProps {
  plans?: PlanItem[];
  selectedTurmaName?: string;
  onEnrollSuccess: () => void;
}

export const Pricing: React.FC<PricingProps> = ({
  plans,
  selectedTurmaName,
  onEnrollSuccess,
}) => {
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [activePlan, setActivePlan] = useState<PlanItem | null>(null);
  const [enrollName, setEnrollName] = useState('');
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollCpf, setEnrollCpf] = useState('');

  const defaultPlans: PlanItem[] = [
    {
      id: 'sed-act-2026',
      name: 'SED ACT 2026',
      price: '499,99',
      installments: 'até 6x de R$ 83,33',
      subtitle: 'Preparação direcionada para o processo seletivo ACT da Rede Estadual (SED-SC).',
      features: [
        'Acesso completo ao Tutor IA treinado em Editais e Leis Oficiais',
        'Gerador de Plano de Estudos e Cronograma Personalizado',
        'Simulados ilimitados no padrão das bancas (FEPESE / ACAFE)',
        'Radar de Pegadinhas de Banca e Glossário Pedagógico',
        'Geração de Flashcards e Mapas Mentais por Disciplina',
        'Correção de Redação com critérios oficiais',
        'Suporte técnico via e-mail e atendimento prioritário',
      ],
      ctaText: 'Inscrever-se no SED ACT 2026 (R$ 499,99)',
    },
    {
      id: 'anual-professor',
      name: 'Anual Professor',
      price: '899,99',
      installments: 'até 12x de R$ 74,99',
      subtitle: 'Passaporte ilimitado por 12 meses cobrindo SED-SC (ACT e Efetivos) e Prefeituras de SC.',
      popularBadge: 'Mais Recomendado',
      features: [
        'Tudo do Plano SED ACT 2026 incluído',
        'Acesso estendido por 12 meses completos para todos os concursos',
        'Cobertura de Prefeituras de SC (Joinville, Floripa, Blumenau, etc.)',
        'Prioridade máxima no processamento do Tutor de IA',
        'Análise Avançada de Desempenho com Raio-X por Banca',
        'Correções de Redação e Discursivas Prioritárias',
        'Atualizações automáticas de legislação e novos editais',
      ],
      ctaText: 'Garantir Plano Anual Professor (R$ 899,99)',
    },
  ];

  const items = plans || defaultPlans;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Inscrição confirmada com sucesso no plano ${activePlan?.name || 'JPSchool IA'} para ${
        enrollName || 'Prof. Aluno'
      }!\nSeu acesso à Plataforma do Aluno foi liberado.`
    );
    setShowCheckoutModal(false);
    onEnrollSuccess();
  };

  return (
    <section className="py-20 bg-white border-b border-slate-200" id="planos">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1877F2]">
            Investimento em sua Carreira Pública
          </span>
          <h2 className="text-3xl font-extrabold text-[#2D3748] tracking-tight">
            Planos com Tutor IA Exclusivo
          </h2>
          <p className="text-slate-600 text-sm">
            Escolha o plano ideal para a sua rotina de estudos e tenha acesso imediato a todo o ecossistema de inteligência artificial.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {items.map((plan) => {
            const isPopular = !!plan.popularBadge;
            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative overflow-hidden ${
                  isPopular
                    ? 'bg-gradient-to-b from-blue-50/50 via-white to-white border-2 border-[#1877F2] shadow-xl'
                    : 'bg-slate-50 border border-slate-200 shadow-sm hover:border-blue-300'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-[#1877F2] text-white text-[10px] font-extrabold uppercase px-4 py-1.5 rounded-bl-xl tracking-wider">
                    {plan.popularBadge}
                  </div>
                )}

                <div>
                  <div className="mb-4">
                    <h3 className="text-2xl font-extrabold text-[#2D3748]">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{plan.subtitle}</p>
                  </div>

                  <div className="my-6">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-xs font-bold text-slate-500">R$</span>
                      <span className="text-4xl font-extrabold text-[#1877F2]">{plan.price}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{plan.installments}</p>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-700 mb-8 border-t border-slate-200/80 pt-6">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setActivePlan(plan);
                    setShowCheckoutModal(true);
                  }}
                  className={`w-full py-4 font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center space-x-2 ${
                    isPopular
                      ? 'bg-[#1877F2] hover:bg-blue-600 text-white shadow-blue-500/20'
                      : 'bg-slate-900 hover:bg-[#1877F2] text-white'
                  }`}
                >
                  {isPopular && <Zap className="w-4 h-4 fill-current" />}
                  <span>{plan.ctaText}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* WhatsApp Contact Banner */}
        <div className="mt-16 bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold flex items-center justify-center md:justify-start space-x-2">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <span>Dúvidas sobre os planos ou o sistema?</span>
            </h3>
            <p className="text-slate-300 text-xs">
              Entre em contato conosco e tire todas as suas dúvidas antes de realizar sua inscrição.
            </p>
          </div>

          <a
            href="https://api.whatsapp.com/send?phone=5548999999999&text=Ol%C3%A1!%20Gostaria%20de%20d%C3%BAvidas%20sobre%20os%20planos%20JPSchool%20IA"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 shrink-0 flex items-center space-x-2"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Atendimento no WhatsApp</span>
          </a>
        </div>

      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && activePlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-8">
            
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-[#1877F2]">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-bold text-lg text-[#2D3748]">Inscrição no {activePlan.name}</h3>
              </div>

              <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200/80 text-xs text-slate-700 space-y-1">
                <div className="flex justify-between font-bold text-[#1877F2]">
                  <span>{activePlan.name}</span>
                  <span>R$ {activePlan.price}</span>
                </div>
                <p className="text-[11px] text-slate-500">{activePlan.installments}</p>
                {selectedTurmaName && (
                  <p className="text-[11px] text-slate-600 font-semibold pt-1 border-t border-blue-200/60">
                    Turma Selecionada: {selectedTurmaName}
                  </p>
                )}
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={enrollName}
                    onChange={(e) => setEnrollName(e.target.value)}
                    placeholder="Ex: Prof. Roberto da Silva"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">E-mail para Acesso</label>
                  <input
                    type="email"
                    required
                    value={enrollEmail}
                    onChange={(e) => setEnrollEmail(e.target.value)}
                    placeholder="roberto.silva@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">CPF</label>
                  <input
                    type="text"
                    required
                    value={enrollCpf}
                    onChange={(e) => setEnrollCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ambiente seguro. Liberação imediata do acesso.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  <span>Confirmar Inscrição e Acessar Plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
