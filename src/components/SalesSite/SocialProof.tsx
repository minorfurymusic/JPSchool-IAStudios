import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { TestimonialItem } from '../../types';

interface SocialProofProps {
  testimonials?: TestimonialItem[];
}

export const SocialProof: React.FC<SocialProofProps> = ({ testimonials }) => {
  const defaultTestimonials: TestimonialItem[] = [
    {
      id: 'test-1',
      name: 'Profa. Juliana Medeiros',
      role: 'Aprovada ACT 1º Lugar - Joinville/SC',
      text: 'O Radar de Pegadinhas da FEPESE salvou minha prova! O Tutor de IA mostrou exatamente onde a banca tentava me enganar nos prazos do Estágio Probatório.',
      stars: 5,
    },
    {
      id: 'test-2',
      name: 'Prof. Carlos Eduardo Silveira',
      role: 'Aprovado SED-SC Anos Iniciais - Florianópolis',
      text: 'Trabalho o dia todo em duas escolas e não tinha tempo para resumos longos. O resumo em áudio e os simulados diretos no botão me economizaram semanas de estudo.',
      stars: 5,
    },
    {
      id: 'test-3',
      name: 'Profa. Regina Coeli Santos',
      role: 'Aprovada Prefeitura de Blumenau',
      text: 'Tinha receio de não saber mexer em IA. A interface do JPSchool é super simples, sem termos difíceis. É só clicar e estudar!',
      stars: 5,
    },
  ];

  const items = testimonials && testimonials.length > 0 ? testimonials : defaultTestimonials;

  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200" id="depoimentos">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1877F2]">
            Depoimentos Reais de Professores em SC
          </span>
          <h2 className="text-3xl font-extrabold text-[#2D3748] tracking-tight">
            Quem Usou, Foi Aprovado
          </h2>
          <p className="text-slate-600 text-sm">
            Veja a experiência de docentes catarinenses que simplificaram a rotina de estudos com o nosso Tutor de IA.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((t, idx) => (
            <div
              key={t.id || idx}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-xl transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-1 text-amber-400">
                  {[...Array(t.stars || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-blue-200" />
                <p className="text-slate-700 text-xs leading-relaxed italic">
                  "{t.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1877F2] font-bold flex items-center justify-center text-xs uppercase">
                  {t.name ? t.name.charAt(0) : 'P'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#2D3748]">{t.name}</h4>
                  <p className="text-[10px] text-emerald-700 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{t.role}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
