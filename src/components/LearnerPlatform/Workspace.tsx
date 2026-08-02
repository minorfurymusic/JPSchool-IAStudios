import React, { useState } from 'react';
import { EstudioFeature, FeatureId, FonteEstudo, ProducaoResultado, Questao, Flashcard, SlideItem } from '../../types';
import { executeEstudioFeature, registerDownload } from '../../services/api';
import {
  Send,
  Mic,
  Paperclip,
  Play,
  Pause,
  Save,
  Download,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Volume2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Share2,
  ExternalLink,
  BookOpen,
  Layers,
  BarChart3,
  Flame,
  HelpCircle,
  Table as TableIcon,
  Video,
} from 'lucide-react';

interface WorkspaceProps {
  activeFeature: EstudioFeature;
  selectedSources: FonteEstudo[];
  isRetaFinal: boolean;
  onQuotaUsed: () => void;
  onSaveNote: (producao: ProducaoResultado) => void;
  allQuestions: Questao[];
}

const mockFlashcards = [
  {
    frente: 'Qual é a duração exata do Estágio Probatório do professor em SC segundo a Lei Complementar nº 688/SC?',
    verso: '3 anos (36 meses) com avaliação especial de desempenho realizada por comissão nomeada. [Fonte oficial: LC 688/SC]',
  },
  {
    frente: 'A quem a escola deve notificar em caso de faltas injustificadas repetidas (ECA)?',
    verso: 'Ao Conselho Tutelar da respectiva localidade (Art. 56 ECA). [Fonte oficial: ECA Lei 8.069/90]',
  },
  {
    frente: 'O que caracteriza a Educação Integral no Currículo Base de Santa Catarina?',
    verso: 'O desenvolvimento multidimensional pleno do sujeito (cognitivo, físico, afetivo, social e cultural). [Fonte oficial: Currículo Base SC]',
  }
];

const mockSlides = [
  {
    titulo: '1. LDB 9.394/96 - Artigo 13 (Deveres Docentes)',
    bullets: [
      'Participação obrigatória na elaboração da proposta pedagógica da escola.',
      'Zelo contínuo pelo aprendizado e frequência dos educandos.',
      'Colaboração com as atividades de articulação da escola com as famílias.'
    ],
    notaOrador: 'Lembrar a turma de que a banca FEPESE costuma trocar "famílias" por "associações de bairro".'
  },
  {
    titulo: '2. Lei Complementar 688/SC - Carreira e Prazos',
    bullets: [
      'Duração do Estágio Probatório de 3 anos (36 meses).',
      'Avaliação especial de desempenho realizada por comissão nomeada.',
      'Estabilidade assegurada somente após aprovação na comissão.'
    ],
    notaOrador: 'Foco na FEPESE: eles adoram dizer que a estabilidade é imediata ou que o estágio dura 2 anos.'
  },
  {
    titulo: '3. Currículo Base SC - Educação Integral',
    bullets: [
      'Educação voltada ao sujeito multidimensional (cognitivo, físico, afetivo).',
      'Não significa mero aumento de carga horária para tempo integral.',
      'Envolvimento da comunidade e territórios educativos.'
    ],
    notaOrador: 'Destaque que a ACAFE cobra a integralidade como princípio formativo e pedagógico.'
  },
  {
    titulo: '4. Revisão em 3 Pontos para a FEPESE',
    bullets: [
      'Legislação de SC: LC 688/SC tem prazo fixo de 36 meses.',
      'LDB Art. 13: Docente elabora e cumpre plano de trabalho.',
      'ECA Art. 56: Notificação obrigatória ao Conselho Tutelar.'
    ],
    notaOrador: 'Revisar esses 3 artigos na véspera. São os de maior incidência no Raio-X!'
  }
];

export const Workspace: React.FC<WorkspaceProps> = ({
  activeFeature,
  selectedSources,
  isRetaFinal,
  onQuotaUsed,
  onSaveNote,
  allQuestions,
}) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastResultado, setLastResultado] = useState<ProducaoResultado | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);

  // Photo upload state
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);

  // Interactive Question State for Quiz/Simulado
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  // Flashcards Viewer State
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState<number>(1);

  // Slides Deck State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Checklist Items State
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({
    'c1': true,
    'c2': false,
    'c3': true,
    'c4': false,
    'c5': false,
  });

  // Handle Feature Execution
  const handleExecute = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      let promptToUse = userPrompt || '';
      if (uploadedImageName) {
        promptToUse = `[Análise da Imagem Anexada: ${uploadedImageName}] ${promptToUse}`;
      }
      if (videoUrlInput) {
        promptToUse = `[URL da Aula: ${videoUrlInput}] ${promptToUse}`;
      }

      const resultado = await executeEstudioFeature({
        featureId: activeFeature.id,
        userPrompt: promptToUse,
        selectedSourceIds: selectedSources.filter((s) => s.selecionada).map((s) => s.id),
        isRetaFinal,
      });

      setLastResultado(resultado);
      onQuotaUsed();
      
      // Reset interactive sub-states
      setSelectedAnswers({});
      setSubmittedQuiz(false);
      setCardIndex(0);
      setIsFlipped(false);
      setCurrentSlideIndex(0);
      setIsPlayingAudio(false);

    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao executar funcionalidade no estúdio.');
    } finally {
      setIsLoading(false);
    }
  };

  // Voice recording simulation
  const handleToggleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
      setUserPrompt((prev) => prev + (prev ? ' ' : '') + 'Qual é a idade máxima e prazos da LC 688/SC no estágio probatório?');
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setUserPrompt((prev) => prev + (prev ? ' ' : '') + 'Quais são as principais pegadinhas da FEPESE sobre LDB e Conselho Tutelar?');
      }, 3000);
    }
  };

  // Photo upload simulation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImageName(file.name);
      setUserPrompt(`[OCR Foto Anexada: ${file.name}] Por favor, corrija esta redação/questão com base nos critérios do edital.`);
    }
  };

  // Download Handler (tied to quota)
  const handleDownloadPDF = async () => {
    const res = await registerDownload();
    if (!res.success) {
      alert(res.error);
      return;
    }
    onQuotaUsed();

    // Trigger fake browser download file
    const element = document.createElement('a');
    const file = new Blob([lastResultado?.conteudo || 'Material de Estudo JPSchool'], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `JPSchool_${activeFeature.id}_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Audio Speech Synthesis simulation
  const handleToggleTTS = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      if ('speechSynthesis' in window) {
        const textToSpeak = lastResultado?.conteudo || 'Olá, professor. Hoje vamos falar sobre o Estatuto do Magistério de Santa Catarina.';
        const utterance = new SpeechSynthesisUtterance(textToSpeak.slice(0, 300));
        utterance.rate = audioPlaybackRate;
        utterance.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setIsPlayingAudio(false), 5000);
      }
    }
  };

  // Render Result Helper
  const renderFormattedTextWithBadges = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.includes('[Fonte oficial:')) {
        return (
          <p key={i} className="my-1.5 flex items-center flex-wrap gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-xs font-semibold">
            <span className="shrink-0">📗</span>
            <span>{line}</span>
          </p>
        );
      } else if (line.includes('[Complemento externo:') || line.includes('Aviso de Cobertura:')) {
        return (
          <p key={i} className="my-1.5 flex items-center flex-wrap gap-1 text-amber-900 bg-amber-50 border border-amber-300 p-2 rounded-xl text-xs font-semibold">
            <span className="shrink-0">🌐</span>
            <span>{line}</span>
          </p>
        );
      } else if (line.startsWith('•') || line.startsWith('-')) {
        return (
          <li key={i} className="ml-4 text-xs text-slate-700 leading-relaxed my-1">
            {line.replace(/^[•-]\s*/, '')}
          </li>
        );
      } else if (line.startsWith('#') || line.startsWith('**') && line.endsWith('**')) {
        return (
          <h4 key={i} className="font-bold text-[#2D3748] text-sm mt-3 mb-1">
            {line.replace(/\*\*/g, '').replace(/^#+\s*/, '')}
          </h4>
        );
      }
      return (
        <p key={i} className="text-xs text-slate-700 leading-relaxed my-1">
          {line}
        </p>
      );
    });
  };

  return (
    <main className="flex-1 bg-slate-100/60 p-4 sm:p-6 space-y-6 font-sans overflow-y-auto">
      
      {/* Active Feature Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 min-w-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1877F2] border border-blue-200 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5 text-[#1877F2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-base sm:text-lg font-bold text-[#2D3748] truncate">
                  {activeFeature.nome}
                </h2>
                {activeFeature.badge && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-[#C85A00] shrink-0">
                    {activeFeature.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {activeFeature.descricao}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
              Base: {activeFeature.kRag} Referências
            </span>
            <span className={`px-2.5 py-1 rounded-lg border font-semibold shrink-0 ${
              activeFeature.permiteFallback
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-[#C85A00] border-amber-200'
            }`}>
              {activeFeature.permiteFallback ? '🌐 Fallback Web Permitido' : '🔒 100% Acervo Oficial'}
            </span>
          </div>
        </div>

        {/* Input Bar Section */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          
          {/* Inputs for Video URL if Video Feature */}
          {activeFeature.id === 'resumo_video' && (
            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4 text-[#1877F2]" />
              <input
                type="text"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="Insira a URL do YouTube ou Vídeo da Aula (ex: https://youtube.com/watch?v=sed-sc)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {/* Expandable Prompt Container */}
          <div className="rounded-2xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-slate-50/50 p-3 transition-all space-y-2">
            <textarea
              rows={2}
              value={userPrompt}
              onChange={(e) => {
                setUserPrompt(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.max(64, e.target.scrollHeight)}px`;
              }}
              placeholder={`Digite sua dúvida ou instrução para ${activeFeature.nome} (ex: focar na banca FEPESE)...`}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none resize-y min-h-[64px] leading-relaxed p-1"
            />

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              
              <div className="flex items-center space-x-2">
                {/* Paperclip Attachment Input */}
                <label
                  className="p-2 text-slate-500 hover:text-[#1877F2] hover:bg-slate-200/60 rounded-xl cursor-pointer transition-all flex items-center space-x-1.5 text-xs font-semibold"
                  title="Anexar Foto, Documento ou Imagem (OCR)"
                >
                  <Paperclip className="w-4 h-4 text-slate-600" />
                  <span className="hidden sm:inline text-slate-600 text-[11px]">Anexar</span>
                  <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handlePhotoUpload} className="hidden" />
                </label>

                {/* Voice Microphone Input */}
                <button
                  onClick={handleToggleVoice}
                  className={`p-2 rounded-xl transition-all flex items-center space-x-1.5 text-xs font-semibold ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-slate-500 hover:text-[#1877F2] hover:bg-slate-200/60'
                  }`}
                  title="Falar por Voz (Gravar Áudio)"
                >
                  <Mic className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">{isRecording ? 'Gravando...' : 'Voz'}</span>
                </button>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleExecute}
                disabled={isLoading}
                className="px-5 py-2 bg-[#1877F2] hover:bg-blue-600 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center space-x-1.5"
              >
                {isLoading ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Gerar</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Attached Files Notification */}
          {uploadedImageName && (
            <div className="text-[11px] bg-blue-50 text-[#1877F2] px-3 py-1.5 rounded-xl border border-blue-200 flex items-center justify-between">
              <span>Imagem Anexada: <strong>{uploadedImageName}</strong></span>
              <button onClick={() => setUploadedImageName(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isRecording && (
            <p className="text-[11px] text-rose-600 font-bold animate-pulse">
              🎤 Ocupado gravando sua voz... Fale agora sua pergunta.
            </p>
          )}

        </div>

      </div>

      {/* Error Callout */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="font-bold text-rose-900 underline text-[11px]">
            Fechar
          </button>
        </div>
      )}

      {/* Output Display Area */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        
        {/* Output Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#2D3748]">Resultado Gerado pelo Tutor</span>
            {lastResultado && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                lastResultado.origem === 'oficial'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {lastResultado.origem === 'oficial' ? '📗 100% Biblioteca Oficial' : '🌐 Complemento Externo Incluso'}
              </span>
            )}
          </div>

          {lastResultado && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onSaveNote(lastResultado);
                  alert('Salvo com sucesso na aba "Minhas Anotações"!');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <Save className="w-3.5 h-3.5 text-[#1877F2]" />
                <span>Salvar nas Anotações</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                className="px-3 py-1.5 bg-[#C85A00] hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar (Consome Cota)</span>
              </button>
            </div>
          )}
        </div>

        {/* Feature-Specific Renderers */}

        {/* 1. QUIZ / SIMULADO / QUESTÕES / 500 QUESTÕES RETA FINAL */}
        {['simulado', 'fazer_questoes', 'questoes_500', 'teste'].includes(activeFeature.id) && (
          <div className="space-y-6">
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
              <div>
                <p className="font-bold">Bateria de Questões FEPESE/ACAFE</p>
                <p className="text-[11px] text-slate-600">Selecione a alternativa e confira o gabarito comentado.</p>
              </div>
              <span className="text-xs font-bold bg-white text-[#1877F2] px-3 py-1 rounded-xl border border-blue-200">
                {Object.keys(selectedAnswers).length} de {allQuestions.length} Respondidas
              </span>
            </div>

            <div className="space-y-6">
              {allQuestions.map((q, qIndex) => {
                const userSelected = selectedAnswers[q.id];
                const isCorrect = userSelected === q.gabaritoIndex;

                return (
                  <div key={q.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-[#1877F2] bg-blue-100/80 px-2.5 py-1 rounded-lg">
                        Questão {qIndex + 1} • {q.banca} ({q.ano})
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {q.materia}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-[#2D3748] leading-relaxed">
                      {q.enunciado}
                    </p>

                    {/* Alternatives */}
                    <div className="space-y-2">
                      {q.alternativas.map((alt, altIdx) => {
                        const isThisSelected = userSelected === altIdx;

                        return (
                          <div
                            key={altIdx}
                            onClick={() => {
                              setSelectedAnswers((prev) => ({ ...prev, [q.id]: altIdx }));
                            }}
                            className={`p-3 rounded-2xl text-xs transition-all cursor-pointer border ${
                              isThisSelected
                                ? 'bg-blue-100 border-[#1877F2] font-bold text-[#1877F2]'
                                : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700'
                            }`}
                          >
                            {alt}
                          </div>
                        );
                      })}
                    </div>

                    {/* Feedback & Commentary if selected */}
                    {userSelected !== undefined && (
                      <div className={`p-4 rounded-2xl text-xs space-y-2 ${
                        isCorrect ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' : 'bg-rose-50 border border-rose-300 text-rose-900'
                      }`}>
                        <div className="flex items-center space-x-1.5 font-bold">
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Resposta Correta!</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-600" />
                              <span>Resposta Incorreta. Tente analisar o gabarito comentado abaixo.</span>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed">{q.comentario}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. FLASHCARDS VIEWER */}
        {activeFeature.id === 'flashcards' && (
          <div className="max-w-md mx-auto space-y-4 text-center">
            <div className="text-xs text-slate-500 font-semibold">
              Cartão {cardIndex + 1} de {mockFlashcards.length} • Clique no cartão para virar e conferir a resposta
            </div>

            {/* 3D Flip Card Effect */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-64 rounded-3xl bg-gradient-to-tr from-blue-50 to-slate-50 border-2 border-[#1877F2] p-6 shadow-lg cursor-pointer flex flex-col items-center justify-center space-y-3 transition-transform hover:scale-[1.01]"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1877F2] bg-white px-3 py-1 rounded-full border border-blue-200">
                {isFlipped ? 'VERSO • RESPOSTA LEGAL' : 'FRENTE • PERGUNTA DA BANCA'}
              </span>

              <p className="text-sm font-bold text-[#2D3748] px-4 leading-relaxed">
                {isFlipped
                  ? mockFlashcards[cardIndex].verso
                  : mockFlashcards[cardIndex].frente}
              </p>

              <span className="text-[10px] text-slate-400 italic">
                (Clique para virar)
              </span>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setTimeout(() => {
                    setCardIndex((prev) => (prev + 1) % mockFlashcards.length);
                  }, 150);
                }}
                className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl"
              >
                Preciso Revisar
              </button>
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setTimeout(() => {
                    setCardIndex((prev) => (prev + 1) % mockFlashcards.length);
                  }, 150);
                }}
                className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl"
              >
                Já Memorizei
              </button>
            </div>
          </div>
        )}

        {/* 3. RESUMO EM ÁUDIO (PLAYER) */}
        {activeFeature.id === 'resumo_audio' && (
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 max-w-xl mx-auto shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-xs">Resumo Narração em Áudio</h3>
                  <p className="text-[10px] text-slate-400">Tutor New School AI • Voz Narrativa SC</p>
                </div>
              </div>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-md">
                3 min 20s
              </span>
            </div>

            {/* Simulated Waveform */}
            <div className="h-12 bg-slate-800 rounded-2xl flex items-center justify-center space-x-1 px-4 overflow-hidden">
              {[...Array(32)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-blue-400 transition-all ${
                    isPlayingAudio ? 'animate-pulse' : 'opacity-40'
                  }`}
                  style={{ height: `${Math.max(20, (i * 17) % 100)}%` }}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAudioPlaybackRate(audioPlaybackRate === 1 ? 1.25 : audioPlaybackRate === 1.25 ? 1.5 : 1)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-300"
                >
                  {audioPlaybackRate}x
                </button>
              </div>

              <button
                onClick={handleToggleTTS}
                className="w-12 h-12 rounded-full bg-[#1877F2] hover:bg-blue-500 text-white font-bold flex items-center justify-center shadow-lg shadow-blue-500/30"
              >
                {isPlayingAudio ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              <span className="text-[11px] text-slate-400 font-mono">01:12 / 03:20</span>
            </div>
          </div>
        )}

        {/* 4. SLIDES PRESENTATION DECK */}
        {activeFeature.id === 'slides' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="bg-slate-900 rounded-3xl p-8 text-white min-h-[280px] flex flex-col justify-between border border-slate-800 shadow-xl relative">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Slide {currentSlideIndex + 1} de {mockSlides.length}</span>
                <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  📗 [Fonte Oficial: SED-SC]
                </span>
              </div>

              <div className="space-y-3 my-4">
                <h3 className="text-lg font-extrabold text-blue-400">
                  {mockSlides[currentSlideIndex].titulo}
                </h3>
                <ul className="space-y-2 text-xs text-slate-200">
                  {mockSlides[currentSlideIndex].bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-[11px] text-slate-400 italic bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <strong>Nota do Orador:</strong> {mockSlides[currentSlideIndex].notaOrador}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                className="px-4 py-2 bg-slate-200 disabled:opacity-40 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                onClick={() => setCurrentSlideIndex(Math.min(mockSlides.length - 1, currentSlideIndex + 1))}
                disabled={currentSlideIndex === mockSlides.length - 1}
                className="px-4 py-2 bg-[#1877F2] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* DEFAULT / STANDARD TEXT OUTPUT READER WITH SOURCE BADGES */}
        {!['simulado', 'fazer_questoes', 'questoes_500', 'teste', 'flashcards', 'resumo_audio', 'slides'].includes(activeFeature.id) && (
          <div className="space-y-4">
            {lastResultado ? (
              <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-3xl border border-slate-200 text-xs leading-relaxed space-y-2">
                {renderFormattedTextWithBadges(lastResultado.conteudo)}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Nenhum resultado gerado ainda neste turno.</p>
                <p className="text-[11px] max-w-md mx-auto">
                  Clique no botão <strong>"Gerar"</strong> acima ou digite sua dúvida personalizada para processar os documentos da biblioteca oficial.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

    </main>
  );
};
