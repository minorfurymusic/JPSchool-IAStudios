import React, { useState, useRef } from 'react';
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
  CalendarCheck,
} from 'lucide-react';

interface WorkspaceProps {
  activeFeature: EstudioFeature;
  selectedSources: FonteEstudo[];
  isRetaFinal: boolean;
  onQuotaUsed: () => void;
  onSaveNote: (producao: ProducaoResultado) => void;
  allQuestions: Questao[];
}

const DEFAULT_FLASHCARDS = [
  {
    frente: 'Qual é a duração exata do Estágio Probatório na LC 688/SC para professores?',
    verso: '3 anos (36 meses), condicionado à avaliação especial de desempenho realizada por comissão paritária.',
    materia: 'Legislação SC',
    fonte: 'LC 688/SC, Art. 18'
  },
  {
    frente: 'A quem a escola deve comunicar faltas injustificadas reiteradas e evasão escolar (ECA)?',
    verso: 'Ao Conselho Tutelar do município, esgotados os recursos escolares (Art. 56, inciso II do ECA).',
    materia: 'Legislação Educacional',
    fonte: 'ECA Lei 8.069/90'
  },
  {
    frente: 'Como o Currículo Base do Território Catarinense (CBTC) define a Educação Integral?',
    verso: 'Formação multidimensional que integra as dimensões cognitiva, física, afetiva, cultural e social do indivíduo.',
    materia: 'Didática e Currículo',
    fonte: 'Currículo Base SC'
  },
  {
    frente: 'Qual a incumbência prioritária do docente prevista no Artigo 13 da LDB?',
    verso: 'Participar da elaboração da proposta pedagógica da escola e zelar pela aprendizagem de todos os alunos.',
    materia: 'Legislação Educacional',
    fonte: 'LDB 9.394/96, Art. 13'
  }
];

const DEFAULT_SLIDES = [
  {
    numero: 1,
    titulo: 'Legislação do Magistério Público Estadual (SED-SC)',
    bullets: [
      'Fundamentação na Lei Complementar Estadual nº 688/SC',
      'Direitos, deveres e plano de carreira do docente',
      'Alinhamento direto às exigências da banca FEPESE/ACAFE'
    ],
    notaOrador: 'Iniciar enfatizando que a LC 688/SC é a espinha dorsal de qualquer concurso educacional em Santa Catarina.'
  },
  {
    numero: 2,
    titulo: 'Estágio Probatório e Avaliação de Desempenho',
    bullets: [
      'Prazo constitucional e legal de 36 meses (3 anos)',
      'Comissão Especial de Avaliação de Desempenho',
      'Pegadinha FEPESE: Cuidado com assertivas que mencionam 24 meses ou avaliação monocrática'
    ],
    notaOrador: 'Ressaltar o artigo 18 e frisar que a avaliação de desempenho é comissional.'
  },
  {
    numero: 3,
    titulo: 'LDB 9.394/96 e Incumbências Docentes',
    bullets: [
      'Art. 12: Incumbências da Instituição de Ensino',
      'Art. 13: Participação ativa na construção do Projeto Político-Pedagógico (PPP)',
      'Recuperação paralela e contínua da aprendizagem'
    ],
    notaOrador: 'Focar na diferença entre as obrigações da escola e as obrigações específicas do professor.'
  },
  {
    numero: 4,
    titulo: 'Currículo Base do Território Catarinense (CBTC)',
    bullets: [
      'Conceito central de Educação Integral Multidimensional',
      'Desenvolvimento socioemocional e avaliação diagnóstica formativa',
      'Respeito às especificidades regionais de Santa Catarina'
    ],
    notaOrador: 'Lembrar que o CBTC não se limita a aumento de carga horária, mas foca no sujeito pleno.'
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

  const activeQuestions = lastResultado && lastResultado.conteudo && Array.isArray(lastResultado.conteudo.questions)
    ? lastResultado.conteudo.questions
    : allQuestions;

  const currentFlashcards = lastResultado && lastResultado.conteudo && Array.isArray(lastResultado.conteudo.flashcards)
    ? lastResultado.conteudo.flashcards
    : DEFAULT_FLASHCARDS;

  const currentSlides = lastResultado && lastResultado.conteudo && Array.isArray(lastResultado.conteudo.slides)
    ? lastResultado.conteudo.slides
    : DEFAULT_SLIDES;

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
    'c1': false,
    'c2': false,
    'c3': false,
    'c4': false,
    'c5': false,
  });

  const toggleChecklistItem = (id: string) => {
    setChecklistState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Voice recognition (Web Speech API)
  const recognitionRef = useRef<any>(null);

  // Selected sources counter (visível na hora de gerar, ver item de UX sobre fontes)
  const selectedSourcesCount = selectedSources.filter((s) => s.selecionada).length;

  // Extrai sempre o texto plano do resultado (nunca o objeto), usado por download e TTS
  const getPlainText = (r: ProducaoResultado | null): string => {
    if (!r) return '';
    if (typeof r.conteudo === 'string') return r.conteudo;
    return r.conteudo?.text || r.conteudo?.audioScript || r.resultText || '';
  };

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

  // Voice recording via Web Speech API (transcrição real do navegador)
  const handleToggleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setErrorMsg('Reconhecimento de voz não é suportado neste navegador. Tente usar o Chrome.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setUserPrompt((prev) => prev + (prev ? ' ' : '') + transcript);
      }
    };
    recognition.onerror = () => {
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
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
      setErrorMsg(res.error || 'Não foi possível registrar o download.');
      return;
    }
    onQuotaUsed();

    const textContent = getPlainText(lastResultado) || 'Material de Estudo JPSchool';
    const element = document.createElement('a');
    const file = new Blob([textContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `JPSchool_${activeFeature.id}_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  // Audio Speech Synthesis (texto -> voz do navegador)
  const handleToggleTTS = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      if ('speechSynthesis' in window) {
        const textToSpeak = getPlainText(lastResultado) || 'Olá, professor. Hoje vamos falar sobre o Estatuto do Magistério de Santa Catarina.';
        const utterance = new SpeechSynthesisUtterance(textToSpeak.slice(0, 300));
        utterance.rate = audioPlaybackRate;
        utterance.lang = 'pt-BR';
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

          {/* Selected Sources Indicator — mostra o que está marcado antes de gerar */}
          <div
            className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl border ${
              selectedSourcesCount === 0
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-[#1877F2]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            {selectedSourcesCount === 0 ? (
              <span>Nenhum material selecionado — a resposta pode sair sem base oficial. Marque fontes em "Materiais de Estudo".</span>
            ) : (
              <span>{selectedSourcesCount} de {selectedSources.length} materiais selecionados como base para gerar.</span>
            )}
          </div>

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
                {Object.keys(selectedAnswers).length} de {activeQuestions.length} Respondidas
              </span>
            </div>

            <div className="space-y-6">
              {activeQuestions.map((q, qIndex) => {
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
              Cartão {cardIndex + 1} de {currentFlashcards.length} • Clique no cartão para virar e conferir a resposta
            </div>

            {/* 3D Flip Card Effect */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full min-h-[260px] rounded-3xl bg-gradient-to-tr from-blue-50 to-slate-50 border-2 border-[#1877F2] p-6 shadow-lg cursor-pointer flex flex-col items-center justify-center space-y-3 transition-transform hover:scale-[1.01]"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1877F2] bg-white px-3 py-1 rounded-full border border-blue-200">
                {isFlipped ? 'VERSO • RESPOSTA LEGAL' : 'FRENTE • PERGUNTA DA BANCA'}
              </span>

              <p className="text-sm font-bold text-[#2D3748] px-4 leading-relaxed">
                {isFlipped
                  ? (currentFlashcards[cardIndex]?.verso || 'Conteúdo do verso')
                  : (currentFlashcards[cardIndex]?.frente || 'Conteúdo da frente')}
              </p>

              {currentFlashcards[cardIndex]?.fonte && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                  📗 {currentFlashcards[cardIndex].fonte}
                </span>
              )}

              <span className="text-[10px] text-slate-400 italic">
                (Clique para virar)
              </span>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setTimeout(() => {
                    setCardIndex((prev) => (prev + 1) % Math.max(1, currentFlashcards.length));
                  }, 150);
                }}
                className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-all"
              >
                Preciso Revisar
              </button>
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setTimeout(() => {
                    setCardIndex((prev) => (prev + 1) % Math.max(1, currentFlashcards.length));
                  }, 150);
                }}
                className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition-all"
              >
                Já Memorizei
              </button>
            </div>
          </div>
        )}

        {/* 3. RESUMO EM ÁUDIO (PLAYER + ROTEIRO VISÍVEL) */}
        {activeFeature.id === 'resumo_audio' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-bold text-xs">Resumo Narração em Áudio</h3>
                    <p className="text-[10px] text-slate-400">Tutor New School AI • Voz Narrativa SC</p>
                  </div>
                </div>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2.5 py-1 rounded-lg">
                  {lastResultado?.conteudo?.duracaoEstimada || '3 min 20s'}
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
                  className="w-12 h-12 rounded-full bg-[#1877F2] hover:bg-blue-500 text-white font-bold flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform hover:scale-105"
                >
                  {isPlayingAudio ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                </button>

                <span className="text-[11px] text-slate-400 font-mono">
                  {isPlayingAudio ? 'Reproduzindo Voz...' : 'Pronto para ouvir'}
                </span>
              </div>
            </div>

            {/* Transcription / Script Text Box */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-[#2D3748] pb-2 border-b border-slate-100">
                <FileText className="w-4 h-4 text-[#1877F2]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Roteiro Completo da Narração</h4>
              </div>
              <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-2 text-slate-700">
                {renderFormattedTextWithBadges(
                  getPlainText(lastResultado) ||
                  'Clique no botão "Gerar" acima para processar o roteiro de narração em áudio desta matéria.'
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. SLIDES PRESENTATION DECK */}
        {activeFeature.id === 'slides' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="bg-slate-900 rounded-3xl p-8 text-white min-h-[300px] flex flex-col justify-between border border-slate-800 shadow-xl relative">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Slide {currentSlideIndex + 1} de {currentSlides.length}</span>
                <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  📗 [Fonte Oficial: SED-SC]
                </span>
              </div>

              <div className="space-y-3 my-4">
                <h3 className="text-lg font-extrabold text-blue-400">
                  {currentSlides[currentSlideIndex]?.titulo || 'Título do Slide'}
                </h3>
                <ul className="space-y-2 text-xs text-slate-200">
                  {(currentSlides[currentSlideIndex]?.bullets || []).map((bullet: string, bIdx: number) => (
                    <li key={bIdx} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {currentSlides[currentSlideIndex]?.notaOrador && (
                <div className="text-[11px] text-slate-400 italic bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <strong>Nota do Orador:</strong> {currentSlides[currentSlideIndex].notaOrador}
                </div>
              )}
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
                onClick={() => setCurrentSlideIndex(Math.min(currentSlides.length - 1, currentSlideIndex + 1))}
                disabled={currentSlideIndex >= currentSlides.length - 1}
                className="px-4 py-2 bg-[#1877F2] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 5. MAPA MENTAL INTERATIVO */}
        {activeFeature.id === 'mapa_mental' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {lastResultado?.conteudo?.mapaMental?.badge || 'Acervo Oficial SED-SC'}
                </span>
                <h3 className="text-base font-extrabold text-[#2D3748]">
                  {lastResultado?.conteudo?.mapaMental?.label || 'Magistério Público SED-SC 2026'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lastResultado?.conteudo?.mapaMental?.detalhe || 'Estrutura hierárquica visual de fixação de conteúdos do concurso'}
                </p>
              </div>

              {/* Tree Branches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(lastResultado?.conteudo?.mapaMental?.children || [
                  {
                    id: 'b1',
                    label: 'Estatuto do Magistério (LC 688/SC)',
                    detalhe: 'Regime Jurídico e Carreira',
                    badge: 'Prioridade Alta',
                    children: [
                      { id: 'sb1', label: 'Estágio Probatório: 36 meses', detalhe: 'Avaliação por comissão especial' },
                      { id: 'sb2', label: 'Contratação ACT', detalhe: 'Processo seletivo por prova/títulos' },
                    ]
                  },
                  {
                    id: 'b2',
                    label: 'Legislação Federal (LDB & ECA)',
                    detalhe: 'Diretrizes Nacionais',
                    badge: 'Banca FEPESE',
                    children: [
                      { id: 'sb3', label: 'Art. 13 LDB', detalhe: 'Incumbência do docente na proposta pedagógica' },
                      { id: 'sb4', label: 'Art. 56 ECA', detalhe: 'Notificação compulsória ao Conselho Tutelar' },
                    ]
                  },
                  {
                    id: 'b3',
                    label: 'Currículo Base SC (CBTC)',
                    detalhe: 'Didática Catarinense',
                    badge: 'Educação Integral',
                    children: [
                      { id: 'sb5', label: 'Dimensão Multidimensional', detalhe: 'Cognitiva, social, afetiva e física' },
                      { id: 'sb6', label: 'Avaliação Formativa', detalhe: 'Acompanhamento processual contínuo' },
                    ]
                  },
                  {
                    id: 'b4',
                    label: 'Estratégia de Prova FEPESE',
                    detalhe: 'Radar de Pegadinhas',
                    badge: 'Reta Final',
                    children: [
                      { id: 'sb7', label: 'Troca de Prazos', detalhe: 'Cuidado com pegadinhas de 24 vs 36 meses' },
                      { id: 'sb8', label: 'Troca de Órgãos', detalhe: 'Conselho Tutelar vs Delegacia' },
                    ]
                  }
                ]).map((branch: any) => (
                  <div key={branch.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-400 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900">{branch.label}</span>
                      {branch.badge && (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                          {branch.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{branch.detalhe}</p>

                    {branch.children && branch.children.length > 0 && (
                      <div className="pl-2 border-l-2 border-indigo-200 space-y-1.5 pt-1">
                        {branch.children.map((sub: any) => (
                          <div key={sub.id} className="text-[11px] bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                            <span className="font-bold text-[#2D3748] block">{sub.label}</span>
                            <span className="text-slate-400 text-[10px]">{sub.detalhe}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. RESUMO DE VÍDEO/AULA */}
        {activeFeature.id === 'resumo_video' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-[#2D3748] pb-2 border-b border-slate-100">
                <Video className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-sm font-extrabold">
                    {lastResultado?.conteudo?.resumoVideo?.tituloAula || 'Resumo da Vídeo-Aula com Análise de Prova'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {lastResultado?.conteudo?.resumoVideo?.duracaoEstimada || 'Síntese de pontos-chave e armadilhas da banca'}
                  </p>
                </div>
              </div>

              {/* 5 Pontos Chave */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-blue-700 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>5 Pontos-Chave da Aula para o Edital:</span>
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {(lastResultado?.conteudo?.resumoVideo?.pontosChave || [
                    'A Lei Complementar Estadual nº 688/SC estrutura a carreira e direitos dos professores efetivos e ACTs.',
                    'O estágio probatório dura 3 anos (36 meses) e depende de avaliação comissional.',
                    'O Artigo 13 da LDB fixa o dever de planejar e executar a proposta pedagógica participativa.',
                    'O Artigo 56 do ECA impõe comunicação compulsória de faltas reiteradas ao Conselho Tutelar.',
                    'O Currículo Base de SC prevê educação integral orientada a todas as dimensões humanas.'
                  ]).map((ponto: string, pIdx: number) => (
                    <div key={pIdx} className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-950 font-medium flex items-start space-x-2">
                      <span className="w-5 h-5 rounded-full bg-blue-200 text-[#1877F2] font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {pIdx + 1}
                      </span>
                      <span className="leading-relaxed">{ponto}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Pegadinhas */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-amber-800 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>3 Pegadinhas Clássicas da Banca FEPESE:</span>
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {(lastResultado?.conteudo?.resumoVideo?.pegadinhas || [
                    'Propor prazo de 24 meses para o estágio probatório em SC (o correto é 36 meses).',
                    'Trocar a notificação ao Conselho Tutelar por encaminhamento à autoridade policial.',
                    'Considerar a recuperação de estudos como facultativa (na LDB ela é obrigatória).'
                  ]).map((peg: string, pgIdx: number) => (
                    <div key={pgIdx} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start space-x-2">
                      <span className="shrink-0 text-amber-600 font-bold">⚠️</span>
                      <span className="leading-relaxed">{peg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. INFOGRÁFICO VISUAL */}
        {activeFeature.id === 'infografico' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(lastResultado?.conteudo?.infografico || [
                {
                  titulo: '36 Meses',
                  dadoDestaque: 'Estágio Probatório',
                  descricao: 'Período probatório do docente na LC 688/SC com avaliação especial periódica.',
                  alertaBanca: 'Pegadinha: A FEPESE costuma sugerir 2 anos. Fique atento!'
                },
                {
                  titulo: 'Art. 56',
                  dadoDestaque: 'Comunicação ECA',
                  descricao: 'Notificação compulsória ao Conselho Tutelar em casos de faltas injustificadas reiteradas.',
                  alertaBanca: 'Não confunda: O encaminhamento imediato é ao Conselho Tutelar!'
                },
                {
                  titulo: 'Art. 13',
                  dadoDestaque: 'Incumbência LDB',
                  descricao: 'Participar do PPP e zelar pela aprendizagem são deveres inegociáveis do educador.',
                  alertaBanca: 'Cobrado com frequência em questões de conhecimentos pedagógicos.'
                },
                {
                  titulo: 'Multidimensional',
                  dadoDestaque: 'Currículo Base SC',
                  descricao: 'A Educação Integral considera o educando em todas as suas dimensões formativas.',
                  alertaBanca: 'Não se trata de mera extensão da carga horária para 7 horas diárias.'
                }
              ]).map((info: any, iIdx: number) => (
                <div key={iIdx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-blue-100 text-[#1877F2]">
                    {info.titulo}
                  </span>
                  <h4 className="text-base font-extrabold text-[#2D3748]">{info.dadoDestaque}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{info.descricao}</p>
                  {info.alertaBanca && (
                    <div className="text-[10px] font-semibold text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200">
                      ⚡ {info.alertaBanca}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. TABELA DE DADOS NORMATIVOS */}
        {activeFeature.id === 'tabela_dados' && (
          <div className="space-y-4 max-w-4xl mx-auto overflow-x-auto">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TableIcon className="w-4 h-4 text-[#1877F2]" />
                  <h3 className="text-xs font-bold text-[#2D3748] uppercase tracking-wider">Tabela Normativa Comparativa</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                  Base Oficial SED-SC 2026
                </span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3 pl-4">Norma Legal</th>
                    <th className="p-3">Artigo / Prazo</th>
                    <th className="p-3">Aplicação no Magistério SC</th>
                    <th className="p-3 pr-4 text-rose-700">Pegadinha da Banca</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(lastResultado?.conteudo?.tabelaDados || [
                    {
                      norma: 'Lei Complementar 688/SC',
                      artigoPrazo: 'Art. 18 / 36 meses',
                      aplicacaoMagisterio: 'Estágio probatório com comissão especial de desempenho',
                      pegadinhaBanca: 'FEPESE adora afirmar que estabilidade ocorre após 2 anos'
                    },
                    {
                      norma: 'Estatuto da Criança (ECA)',
                      artigoPrazo: 'Art. 56 / Imediato',
                      aplicacaoMagisterio: 'Comunicação obrigatória ao Conselho Tutelar após ações escolares',
                      pegadinhaBanca: 'Trocar o Conselho Tutelar por Delegacia de Polícia ou Conselho Estadual'
                    },
                    {
                      norma: 'LDB 9.394/1996',
                      artigoPrazo: 'Art. 13 / Contínuo',
                      aplicacaoMagisterio: 'Participação na elaboração do Projeto Político-Pedagógico (PPP)',
                      pegadinhaBanca: 'Afirmar que o PPP é de competência exclusiva da Direção e Secretaria'
                    },
                    {
                      norma: 'Currículo Base SC (CBTC)',
                      artigoPrazo: 'Diretrizes / Anual',
                      aplicacaoMagisterio: 'Implementação de práticas de Educação Integral e avaliação formativa',
                      pegadinhaBanca: 'Reduzir a Educação Integral a tempo integral de permanência física'
                    }
                  ]).map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 pl-4 font-bold text-[#1877F2]">{row.norma}</td>
                      <td className="p-3 font-mono font-semibold text-slate-600">{row.artigoPrazo}</td>
                      <td className="p-3">{row.aplicacaoMagisterio}</td>
                      <td className="p-3 pr-4 text-rose-700 font-semibold bg-rose-50/40">{row.pegadinhaBanca}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9. RELATÓRIOS DE DESEMPENHO & HEATMAP */}
        {activeFeature.id === 'relatorios' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-extrabold text-[#2D3748]">Relatório de Desempenho & Comparativo</h3>
                    <p className="text-[10px] text-slate-500">Mapeamento de acertos e simulação de concorrência</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-emerald-600">
                    {lastResultado?.conteudo?.relatorio?.mediaGeralAcertos || 78}%
                  </span>
                  <span className="block text-[9px] text-slate-400 font-semibold">Taxa Geral de Acertos</span>
                </div>
              </div>

              {/* Progress bars by discipline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Desempenho por Disciplina:</h4>
                {(lastResultado?.conteudo?.relatorio?.disciplinas || [
                  { nome: 'Legislação Educacional e SC', taxaAcerto: 84, totalQuestoes: 50, nivel: 'excelente' },
                  { nome: 'Didática e Currículo Base SC', taxaAcerto: 76, totalQuestoes: 42, nivel: 'atencao' },
                  { nome: 'Língua Portuguesa (FEPESE)', taxaAcerto: 72, totalQuestoes: 35, nivel: 'atencao' },
                  { nome: 'História e Geografia de SC', taxaAcerto: 80, totalQuestoes: 15, nivel: 'excelente' },
                ]).map((disc: any, dIdx: number) => (
                  <div key={dIdx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#2D3748]">{disc.nome}</span>
                      <span className={disc.taxaAcerto >= 80 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                        {disc.taxaAcerto}% ({disc.totalQuestoes} questões resolvidas)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          disc.taxaAcerto >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${disc.taxaAcerto}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Benchmark with other candidates */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-indigo-900 block">Sua Margem Frente aos Candidatos:</span>
                  <span className="text-indigo-700 text-[11px]">Você está 15% acima da média de acertos estimada da banca SED-SC.</span>
                </div>
                <span className="text-sm font-extrabold text-indigo-700 bg-white px-3 py-1 rounded-xl shadow-2xs border border-indigo-200">
                  +15% Top 10%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 10. CHECKLIST DE VÉSPERA (RETA FINAL) */}
        {activeFeature.id === 'checklist_vespera' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {(() => {
              const items = [
                { id: 'c1', label: 'Revisar o Glossário da Banca e os termos mais recorrentes' },
                { id: 'c2', label: 'Refazer o último simulado completo e revisar os erros' },
                { id: 'c3', label: 'Reler o Radar de Pegadinhas das matérias com mais peso' },
                { id: 'c4', label: 'Conferir local, horário e documento oficial com foto para a prova' },
                { id: 'c5', label: 'Separar caneta, comprovante de inscrição e chegar com antecedência' },
              ];
              const doneCount = items.filter((i) => checklistState[i.id]).length;
              const progress = Math.round((doneCount / items.length) * 100);

              return (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[#2D3748]">
                      <CalendarCheck className="w-5 h-5 text-[#C85A00]" />
                      <h3 className="text-sm font-extrabold">Checklist de Véspera</h3>
                    </div>
                    <span className="text-xs font-bold text-[#C85A00] bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                      {doneCount}/{items.length} concluídos
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#C85A00] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleChecklistItem(item.id)}
                        className={`p-3 rounded-2xl border cursor-pointer select-none transition-all flex items-start space-x-2.5 ${
                          checklistState[item.id]
                            ? 'bg-emerald-50 border-emerald-300'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {checklistState[item.id] ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-xs leading-relaxed ${checklistState[item.id] ? 'text-emerald-900 line-through' : 'text-slate-700'}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {progress === 100 && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center">
                      🎉 Tudo pronto! Boa prova!
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* DEFAULT / STANDARD TEXT OUTPUT READER WITH SOURCE BADGES */}
        {!['simulado', 'fazer_questoes', 'questoes_500', 'teste', 'flashcards', 'slides', 'mapa_mental', 'resumo_audio', 'resumo_video', 'infografico', 'tabela_dados', 'relatorios', 'checklist_vespera'].includes(activeFeature.id) && (
          <div className="space-y-4">
            {lastResultado ? (
              <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-3xl border border-slate-200 text-xs leading-relaxed space-y-2">
                {renderFormattedTextWithBadges(getPlainText(lastResultado))}
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
