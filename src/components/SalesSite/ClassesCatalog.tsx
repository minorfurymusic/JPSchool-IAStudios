import React from 'react';
import { ArrowRight, CheckCircle2, MapPin, Sparkles, Star } from 'lucide-react';

interface ClassesCatalogProps {
  onSelectTurma: (turmaName: string) => void;
}

export const ClassesCatalog: React.FC<ClassesCatalogProps> = ({ onSelectTurma }) => {
  const turmas = [
    {
      id: 'sed-act-2026',
      title: 'SED ACT 2026',
      price: 'R$ 499,99',
      installments: 'até 6x de R$ 83,33',
      banca: 'FEPESE / ACAFE',
      foco: 'Processo Seletivo ACT da Rede Estadual (SED-SC)',
      médias: 'Simulados de 40 Qs + Radar de Pegadinhas FEPESE',
      destaque: 'Turma Específica ACTs',
      corBadge: 'bg-[#1877F2] text-white',
      highlights: [
        'Tutor IA treinado em Editais e Leis Oficiais',
        'Plano de Estudos e Simulados FEPESE/ACAFE',
        'Radar de Pegadinhas e Glossário de Prova',
        'Correção de Redação e Flashcards',
      ],
    },
    {
      id: 'anual-professor',
      title: 'Anual Professor',
      price: 'R$ 899,99',
      installments: 'até 12x de R$ 74,99',
      banca: 'ACAFE / FEPESE / IBADE / FURB',
      foco: 'Passaporte Completo por 12 Meses (SED-SC + Prefeituras)',
      médias: 'Estatuto dos Servidores + LDB + Discursiva + Raio-X',
      destaque: 'Passaporte Completo',
      corBadge: 'bg-[#C85A00] text-white',
      highlights: [
        'Tudo do Plano SED ACT 2026',
        'Acesso por 12 meses ilimitados',
        'Cobertura Completa para Prefeituras de SC',
        'Análise Avançada de Desempenho e Raio-X',
      ],
    },
  ];

  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200" id="turmas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1877F2]">
            Turmas e Opções de Acesso
          </span>
          <h2 className="text-3xl font-extrabold text-[#2D3748] tracking-tight">
            Selecione sua Turma de Preparação
          </h2>
          <p className="text-slate-600 text-sm">
            Escolha o formato ideal para os seus objetivos e garanta seu acesso ao ecossistema de inteligência artificial.
          </p>
        </div>

        {/* 2 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {turmas.map((turma) => (
            <div
              key={turma.id}
              className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Badge */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${turma.corBadge}`}>
                    {turma.destaque}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Santa Catarina</span>
                  </span>
                </div>

                <h3 className="text-2xl font-extrabold text-[#2D3748] mb-1">
                  {turma.title}
                </h3>
                
                <div className="mt-3 mb-6">
                  <div className="text-3xl font-extrabold text-[#1877F2]">
                    {turma.price}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{turma.installments}</p>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-500">Bancas Atendidas:</span>
                    <span className="font-bold text-[#1877F2]">{turma.banca}</span>
                  </div>
                  <div className="flex justify-between items-start pt-1">
                    <span className="font-medium text-slate-500">Abrangência:</span>
                    <span className="font-bold text-slate-800 text-right max-w-[200px]">{turma.foco}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-700 mb-6">
                  <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Principais Recursos Inclusos:</p>
                  {turma.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => onSelectTurma(turma.title)}
                  className="w-full py-4 bg-slate-900 hover:bg-[#1877F2] text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  <span>Garantir Vaga no {turma.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
