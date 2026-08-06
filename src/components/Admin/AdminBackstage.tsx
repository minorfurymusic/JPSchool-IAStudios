import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  HelpCircle,
  BarChart3,
  LogOut,
  ShieldCheck,
  Layers,
  ArrowLeft,
  Users,
  CreditCard,
  Key,
  MessageSquare,
  History,
  Settings,
  Mail,
  Calendar,
  Save,
  Edit2,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Search,
} from 'lucide-react';
import { User, SiteConfig } from '../../types';
import {
  fetchMatriculas,
  updateMatriculaStatus,
  fetchPagamentos,
  fetchCodigosAcesso,
  fetchTickets,
  fetchLogsAuditoria,
  fetchConfiguracoes,
  updateConfiguracaoValue,
  fetchLeads,
  fetchCampanhasCota,
  fetchSources,
  fetchQuestions,
  addOfficialSource,
  addQuestion,
  fetchSourcesIndexStatus,
  ingestDocumentSource,
} from '../../services/api';
import { AdminPanel } from './AdminPanel';

interface AdminBackstageProps {
  user: User;
  onLogout: () => void;
  onGoToPlatform: () => void;
  siteConfig: SiteConfig;
  onUpdateConfig: (newConfig: SiteConfig) => void;
  onResetDefault: () => void;
}

export const AdminBackstage: React.FC<AdminBackstageProps> = ({
  user,
  onLogout,
  onGoToPlatform,
  siteConfig,
  onUpdateConfig,
  onResetDefault,
}) => {
  type MainSection = 'conteudo' | 'operacional' | 'ti';
  const [activeSection, setActiveSection] = useState<MainSection>('operacional');

  // Sub-tabs for content section
  const [contentTab, setContentTab] = useState<'aulas' | 'questoes' | 'editais' | 'relatorios'>('aulas');

  // Sub-tabs for operational section (Onda 1)
  type OperTab = 'matriculas' | 'pagamentos' | 'codigos' | 'tickets' | 'logs' | 'configuracoes' | 'leads' | 'campanhas';
  const [operTab, setOperTab] = useState<OperTab>('matriculas');

  // Operational states
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [codigos, setCodigos] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [configuracoes, setConfiguracoes] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [campanhas, setCampanhas] = useState<any[]>([]);

  // Search states for tables
  const [searchQuery, setSearchQuery] = useState('');

  // Editing config states
  const [editingConfigChave, setEditingConfigChave] = useState<string | null>(null);
  const [editingConfigValue, setEditingConfigValue] = useState('');

  // Loading and alerts
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch all operational data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [
        matriculasData,
        pagamentosData,
        codigosData,
        ticketsData,
        logsData,
        configData,
        leadsData,
        campanhasData,
      ] = await Promise.all([
        fetchMatriculas(),
        fetchPagamentos(),
        fetchCodigosAcesso(),
        fetchTickets(),
        fetchLogsAuditoria(),
        fetchConfiguracoes(),
        fetchLeads(),
        fetchCampanhasCota(),
      ]);

      setMatriculas(matriculasData);
      setPagamentos(pagamentosData);
      setCodigos(codigosData);
      setTickets(ticketsData);
      setLogs(logsData);
      setConfiguracoes(configData);
      setLeads(leadsData);
      setCampanhas(campanhasData);
    } catch (err) {
      console.error('Error loading admin operational data', err);
      showStatus('Erro ao carregar dados operacionais do backend.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'operacional') {
      loadData();
    }
  }, [activeSection]);

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Mutate matricula status
  const handleUpdateStatus = async (id: number, status: any) => {
    try {
      const res = await updateMatriculaStatus(id, status);
      if (res.success) {
        setMatriculas((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: res.matricula.status } : m))
        );
        showStatus(`Status da matrícula ${id} atualizado para ${status}!`, 'success');
        // Refresh audit logs
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao atualizar matrícula', 'error');
      }
    } catch (err) {
      showStatus('Erro de comunicação com o servidor', 'error');
    }
  };

  // Mutate config value
  const handleUpdateConfigValue = async (chave: string) => {
    try {
      const res = await updateConfiguracaoValue(chave, editingConfigValue);
      if (res.success) {
        setConfiguracoes((prev) =>
          prev.map((c) => (c.chave === chave ? { ...c, valor: res.config.valor } : c))
        );
        showStatus(`Configuração ${chave} atualizada com sucesso!`, 'success');
        setEditingConfigChave(null);
        // Refresh audit logs
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao atualizar configuração', 'error');
      }
    } catch (err) {
      showStatus('Erro de comunicação com o servidor', 'error');
    }
  };

  // Content states
  const [sources, setSources] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [indexStatus, setIndexStatus] = useState<Record<number, number>>({});

  // Forms visibility
  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // Source form fields
  const [srcTitle, setSrcTitle] = useState('');
  const [srcType, setSrcType] = useState('apostila');
  const [srcMateria, setSrcMateria] = useState('Legislação SC');
  const [srcBanca, setSrcBanca] = useState('FEPESE / ACAFE');
  const [srcAno, setSrcAno] = useState(new Date().getFullYear().toString());
  const [srcSize, setSrcSize] = useState('2.5 MB');

  // Question form fields
  const [qEnunciado, setQEnunciado] = useState('');
  const [qAltA, setQAltA] = useState('');
  const [qAltB, setQAltB] = useState('');
  const [qAltC, setQAltC] = useState('');
  const [qAltD, setQAltD] = useState('');
  const [qAltE, setQAltE] = useState('');
  const [qGabarito, setQGabarito] = useState(0);
  const [qMateria, setQMateria] = useState('Legislação SC');
  const [qAssunto, setQAssunto] = useState('Geral');
  const [qComentario, setQComentario] = useState('');

  // RAG action states
  const [ingesterId, setIngesterId] = useState<number | null>(null);

  const loadContentData = async () => {
    try {
      setIsLoading(true);
      const [srcs, qsts, idxs] = await Promise.all([
        fetchSources(),
        fetchQuestions(),
        fetchSourcesIndexStatus(),
      ]);
      setSources(srcs);
      setQuestions(qsts);
      setIndexStatus(idxs);
    } catch (err) {
      console.error('Error loading content management data', err);
      showStatus('Erro ao carregar dados do gerenciador de conteúdo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'conteudo') {
      loadContentData();
    }
  }, [activeSection]);

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srcTitle.trim()) {
      showStatus('Por favor, informe o título do material.', 'error');
      return;
    }
    try {
      setIsLoading(true);
      const res = await addOfficialSource({
        titulo: srcTitle,
        tipo: srcType,
        materia: srcMateria,
        banca: srcBanca,
        ano: Number(srcAno),
        tamanho: srcSize,
      });
      if (res.success) {
        showStatus('Material de estudo cadastrado com sucesso!', 'success');
        setSources(res.sources);
        setSrcTitle('');
        setShowAddSource(false);
      } else {
        showStatus(res.error || 'Erro ao cadastrar material.', 'error');
      }
    } catch (err) {
      showStatus('Erro de rede ao cadastrar material.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qEnunciado.trim() || !qAltA.trim() || !qAltB.trim()) {
      showStatus('Por favor, preencha o enunciado e pelo menos as duas primeiras alternativas.', 'error');
      return;
    }
    try {
      setIsLoading(true);
      const res = await addQuestion({
        banca: srcBanca,
        materia: qMateria,
        assunto: qAssunto,
        enunciado: qEnunciado,
        alternativas: [qAltA, qAltB, qAltC || 'N/A', qAltD || 'N/A', qAltE || 'N/A'].filter((a) => a.trim() !== ''),
        gabaritoIndex: qGabarito,
        comentario: qComentario,
      });
      if (res.success) {
        showStatus('Questão inédita cadastrada com sucesso!', 'success');
        setQuestions(res.questions);
        setQEnunciado('');
        setQAltA('');
        setQAltB('');
        setQAltC('');
        setQAltD('');
        setQAltE('');
        setQComentario('');
        setShowAddQuestion(false);
      } else {
        showStatus(res.error || 'Erro ao cadastrar questão.', 'error');
      }
    } catch (err) {
      showStatus('Erro de rede ao cadastrar questão.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngestRAG = async (sourceId: number) => {
    try {
      setIngesterId(sourceId);
      const res = await ingestDocumentSource(sourceId);
      if (res.success) {
        showStatus(`Documento indexado com sucesso! ${res.details.chunksIndexados} fragmentos cadastrados.`, 'success');
        const idxs = await fetchSourcesIndexStatus();
        setIndexStatus(idxs);
      } else {
        showStatus(res.error || 'Falha ao indexar arquivo.', 'error');
      }
    } catch (err: any) {
      showStatus(err.message || 'Erro ao processar indexação no RAG.', 'error');
    } finally {
      setIngesterId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased">
      
      {/* Admin Backstage Top Bar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white hidden sm:inline">Backstage Admin</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                  {user.role.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Usuário: <strong className="text-slate-200">{user.usuario}</strong> ({user.nome})</p>
            </div>
          </div>

          {/* Main Navigation Segments */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold text-slate-400">
            <button
              onClick={() => setActiveSection('operacional')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSection === 'operacional' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-slate-200'
              }`}
            >
              💼 Dados Operacionais (Onda 1)
            </button>
            <button
              onClick={() => setActiveSection('conteudo')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSection === 'conteudo' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-slate-200'
              }`}
            >
              📚 Gestão de Conteúdo (RAG)
            </button>
            <button
              onClick={() => setActiveSection('ti')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSection === 'ti' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-slate-200'
              }`}
            >
              🎨 Editor de Layout (TI)
            </button>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* onGoToPlatform Trigger Button */}
            <button
              onClick={onGoToPlatform}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Área do Aluno</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-xl transition-all border border-rose-500/30 flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">

        {/* Global Action Message Alerts */}
        {statusMessage && (
          <div className={`px-4 py-3 rounded-xl border text-xs font-bold flex items-center space-x-2 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-950/60 border-rose-500/30 text-rose-400'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* SECTION 1: DADOS OPERACIONAIS (ONDA 1) */}
        {activeSection === 'operacional' && (
          <div className="space-y-6">
            
            {/* Sub-Tabs Grid */}
            <div className="bg-slate-800/80 p-2 rounded-2xl border border-slate-700 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
              <button
                onClick={() => { setOperTab('matriculas'); setSearchQuery(''); }}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                  operTab === 'matriculas' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Matrículas ({matriculas.length})</span>
              </button>

              <button
                onClick={() => { setOperTab('pagamentos'); setSearchQuery(''); }}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                  operTab === 'pagamentos' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Pagamentos ({pagamentos.length})</span>
              </button>

              <button
                onClick={() => { setOperTab('codigos'); setSearchQuery(''); }}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                  operTab === 'codigos' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Códigos de Acesso ({codigos.length})</span>
              </button>

              <button
                onClick={() => { setOperTab('tickets'); setSearchQuery(''); }}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                  operTab === 'tickets' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Tickets ({tickets.length})</span>
              </button>

              <button
                onClick={() => { setOperTab('logs'); setSearchQuery(''); }}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                  operTab === 'logs' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Logs Auditoria ({logs.length})</span>
              </button>

              <button
                onClick={() => { setOperTab('configuracoes'); setSearchQuery(''); }}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                  operTab === 'configuracoes' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configurações ({configuracoes.length})</span>
              </button>

              <button
                onClick={() => { setOperTab('leads'); setSearchQuery(''); }}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                  operTab === 'leads' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Leads ({leads.length})</span>
              </button>

              <button
                onClick={() => { setOperTab('campanhas'); setSearchQuery(''); }}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                  operTab === 'campanhas' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Campanhas ({campanhas.length})</span>
              </button>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex items-center justify-between gap-4 bg-slate-850 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Pesquisar registros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={loadData}
                disabled={isLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            {/* ENTITY CONTENT VIEWER */}
            <div className="bg-slate-850 border border-slate-800 rounded-3xl p-6 overflow-x-auto min-h-[300px]">
              
              {/* TAB 1: MATRICULAS */}
              {operTab === 'matriculas' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Aluno</th>
                      <th className="pb-3">Curso</th>
                      <th className="pb-3">Início</th>
                      <th className="pb-3">Fim</th>
                      <th className="pb-3">Origem</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matriculas
                      .filter((m) =>
                        m.usuarioNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.cursoNome.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((m) => (
                        <tr key={m.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                          <td className="py-4 font-mono font-bold text-slate-500">{m.id}</td>
                          <td className="py-4 font-bold text-slate-200">{m.usuarioNome}</td>
                          <td className="py-4 text-slate-300 max-w-xs truncate">{m.cursoNome}</td>
                          <td className="py-4 text-slate-400">{m.dataInicio}</td>
                          <td className="py-4 text-slate-400">{m.dataFim}</td>
                          <td className="py-4">
                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase text-[9px]">
                              {m.origem}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                              m.status === 'ativa'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : m.status === 'suspensa'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <select
                              value={m.status}
                              onChange={(e) => handleUpdateStatus(m.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="ativa">Ativar</option>
                              <option value="suspensa">Suspender</option>
                              <option value="cancelada">Cancelar</option>
                              <option value="expirada">Expirar</option>
                              <option value="trial">Trial</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* TAB 2: PAGAMENTOS */}
              {operTab === 'pagamentos' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Aluno</th>
                      <th className="pb-3">Plano</th>
                      <th className="pb-3">Valor</th>
                      <th className="pb-3">Parcelas</th>
                      <th className="pb-3">Método</th>
                      <th className="pb-3">Gateway</th>
                      <th className="pb-3">Transação</th>
                      <th className="pb-3">Criado Em</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos
                      .filter((p) =>
                        p.usuarioNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.planoId.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((p) => (
                        <tr key={p.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                          <td className="py-4 font-mono font-bold text-slate-500">{p.id}</td>
                          <td className="py-4 font-bold text-slate-200">{p.usuarioNome}</td>
                          <td className="py-4 text-slate-300 font-semibold">{p.planoId}</td>
                          <td className="py-4 text-[#1877F2] font-bold">
                            R$ {(p.valor_centavos / 100).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-4 text-slate-400 font-mono">{p.parcelas}x</td>
                          <td className="py-4 uppercase text-slate-400 font-mono text-[10px]">{p.metodo}</td>
                          <td className="py-4 text-slate-400 font-mono text-[10px]">{p.gateway}</td>
                          <td className="py-4 text-slate-500 font-mono text-[10px]">{p.transacaoId || 'N/A'}</td>
                          <td className="py-4 text-slate-400">{new Date(p.criadoEm).toLocaleDateString('pt-BR')}</td>
                          <td className="py-4 text-right">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                              p.status === 'aprovado'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : p.status === 'pendente'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* TAB 3: CODIGOS DE ACESSO */}
              {operTab === 'codigos' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Código</th>
                      <th className="pb-3">Tipo</th>
                      <th className="pb-3">Validade (Dias)</th>
                      <th className="pb-3">Criado Por</th>
                      <th className="pb-3">Criado Em</th>
                      <th className="pb-3 text-right">Usado?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codigos
                      .filter((c) =>
                        c.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.criadoPor || '').toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((c) => (
                        <tr key={c.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                          <td className="py-4 font-mono font-bold text-slate-500">{c.id}</td>
                          <td className="py-4 font-mono font-bold text-blue-400 text-xs tracking-wider">{c.codigo}</td>
                          <td className="py-4 uppercase text-slate-300 font-semibold">{c.tipo}</td>
                          <td className="py-4 font-mono text-slate-400">{c.diasValidade} dias</td>
                          <td className="py-4 text-slate-400">{c.criadoPor || 'Sistemas'}</td>
                          <td className="py-4 text-slate-400">{new Date(c.criadoEm).toLocaleDateString('pt-BR')}</td>
                          <td className="py-4 text-right">
                            {c.usado ? (
                              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded font-semibold text-[9px] uppercase">
                                Usado (ID: {c.usadoPorUsuarioId})
                              </span>
                            ) : (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded font-semibold text-[9px] uppercase">
                                Disponível
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* TAB 4: TICKETS */}
              {operTab === 'tickets' && (
                <div className="space-y-4">
                  {tickets
                    .filter((t) =>
                      t.assunto.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.usuarioNome.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((t) => (
                      <div key={t.id} className="p-5 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                              TICKET #{t.id} • {t.usuarioNome}
                            </span>
                            <h3 className="font-extrabold text-sm text-slate-100">{t.assunto}</h3>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] font-bold">
                            <span className={`px-2 py-0.5 rounded uppercase ${
                              t.prioridade === 'alta' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'
                            }`}>{t.prioridade}</span>
                            <span className={`px-2 py-0.5 rounded uppercase ${
                              t.status === 'resolvido' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
                            }`}>{t.status}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed font-mono">
                          {t.mensagem}
                        </p>

                        {/* Responses */}
                        {t.respostas && t.respostas.length > 0 && (
                          <div className="pl-4 border-l-2 border-blue-500 space-y-2 mt-2">
                            {t.respostas.map((r: any, rIdx: number) => (
                              <div key={rIdx} className="space-y-1 text-xs bg-slate-900/40 p-2.5 rounded-xl">
                                <p className="font-bold text-blue-400 text-[10px]">{r.autor} • {new Date(r.criadoEm).toLocaleDateString()}</p>
                                <p className="text-slate-300 leading-relaxed">{r.mensagem}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* TAB 5: LOGS */}
              {operTab === 'logs' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Ação</th>
                      <th className="pb-3">Detalhes</th>
                      <th className="pb-3">Usuário</th>
                      <th className="pb-3">IP</th>
                      <th className="pb-3 text-right">Data/Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs
                      .filter((l) =>
                        l.acao.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (l.detalhes || '').toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((l) => (
                        <tr key={l.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 font-mono text-[11px]">
                          <td className="py-3 text-slate-500 font-bold">{l.id}</td>
                          <td className="py-3 text-blue-400 font-bold text-[10px]">{l.acao}</td>
                          <td className="py-3 text-slate-300">{l.detalhes}</td>
                          <td className="py-3 text-slate-400">{l.usuarioNome || 'Sistema'}</td>
                          <td className="py-3 text-slate-500">{l.ip || '127.0.0.1'}</td>
                          <td className="py-3 text-right text-slate-500">{new Date(l.criadoEm).toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* TAB 6: CONFIGURACOES */}
              {operTab === 'configuracoes' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Chave</th>
                      <th className="pb-3">Valor</th>
                      <th className="pb-3">Descrição</th>
                      <th className="pb-3">Última Atualização</th>
                      <th className="pb-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configuracoes
                      .filter((c) =>
                        c.chave.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.descricao || '').toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((c) => (
                        <tr key={c.chave} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                          <td className="py-4 font-mono font-bold text-blue-400">{c.chave}</td>
                          <td className="py-4">
                            {editingConfigChave === c.chave ? (
                              <input
                                type="text"
                                value={editingConfigValue}
                                onChange={(e) => setEditingConfigValue(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono w-28"
                              />
                            ) : (
                              <span className="font-mono bg-slate-850 px-2 py-1 border border-slate-800 rounded-md text-emerald-400 font-bold">
                                {c.valor}
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-slate-400 text-[11px] max-w-xs">{c.descricao || 'N/A'}</td>
                          <td className="py-4 text-slate-500 font-mono text-[10px]">
                            {c.atualizadoPor || 'Admin'} em {new Date(c.atualizadoEm).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-right">
                            {editingConfigChave === c.chave ? (
                              <div className="flex justify-end space-x-1.5">
                                <button
                                  onClick={() => handleUpdateConfigValue(c.chave)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                  title="Salvar"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingConfigChave(null)}
                                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                                  title="Cancelar"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingConfigChave(c.chave);
                                  setEditingConfigValue(c.valor);
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 flex items-center space-x-1 ml-auto"
                              >
                                <Edit2 className="w-3 h-3 text-[#1877F2]" />
                                <span>Editar</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* TAB 7: LEADS */}
              {operTab === 'leads' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Nome</th>
                      <th className="pb-3">E-mail</th>
                      <th className="pb-3">Telefone</th>
                      <th className="pb-3">Origem</th>
                      <th className="pb-3">Criado Em</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads
                      .filter((l) =>
                        l.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        l.email.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((l) => (
                        <tr key={l.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                          <td className="py-4 font-mono font-bold text-slate-500">{l.id}</td>
                          <td className="py-4 font-bold text-slate-200">{l.nome}</td>
                          <td className="py-4 text-blue-400 font-mono">{l.email}</td>
                          <td className="py-4 text-slate-400 font-mono">{l.telefone || 'N/A'}</td>
                          <td className="py-4 uppercase text-slate-400 text-[10px] font-mono">{l.origem}</td>
                          <td className="py-4 text-slate-500">{new Date(l.criadoEm).toLocaleDateString()}</td>
                          <td className="py-4 text-right">
                            <span className="bg-blue-600/20 text-blue-400 border border-blue-600/30 px-2 py-0.5 rounded font-semibold text-[9px] uppercase">
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* TAB 8: CAMPANHAS */}
              {operTab === 'campanhas' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Nome da Campanha</th>
                      <th className="pb-3">Override Prod. Max</th>
                      <th className="pb-3">Override Down. Max</th>
                      <th className="pb-3">Início</th>
                      <th className="pb-3">Fim</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campanhas
                      .filter((c) =>
                        c.nome.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((c) => (
                        <tr key={c.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                          <td className="py-4 font-mono font-bold text-slate-500">{c.id}</td>
                          <td className="py-4 font-bold text-slate-200">{c.nome}</td>
                          <td className="py-4 font-mono text-blue-400">{c.overrideProducoesMax || 'N/A'}</td>
                          <td className="py-4 font-mono text-[#C85A00]">{c.overrideDownloadsMax || 'N/A'}</td>
                          <td className="py-4 text-slate-400">{c.dataInicio}</td>
                          <td className="py-4 text-slate-400">{c.dataFim}</td>
                          <td className="py-4 text-right">
                            {c.ativa ? (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded font-semibold text-[9px] uppercase animate-pulse">
                                Ativa
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-slate-500 px-2.5 py-0.5 rounded font-semibold text-[9px] uppercase">
                                Inativa
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

            </div>
          </div>
        )}

        {/* SECTION 2: GESTÃO DE CONTEÚDO (RAG) */}
        {activeSection === 'conteudo' && (
          <div className="space-y-6">
            
            {/* Original content tabs */}
            <div className="bg-slate-800/80 p-2 rounded-2xl border border-slate-700 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
              <button
                onClick={() => setContentTab('aulas')}
                className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                  contentTab === 'aulas' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>1. Cursos & Aulas</span>
              </button>

              <button
                onClick={() => setContentTab('questoes')}
                className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                  contentTab === 'questoes' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>2. Banco de Questões</span>
              </button>

              <button
                onClick={() => setContentTab('editais')}
                className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                  contentTab === 'editais' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>3. Editais & Documentos</span>
              </button>

              <button
                onClick={() => setContentTab('relatorios')}
                className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                  contentTab === 'relatorios' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>4. Desempenho do Acervo</span>
              </button>
            </div>

            {/* Content Tabs Body */}
            <div className="bg-slate-850 rounded-3xl p-6 sm:p-8 border border-slate-800 min-h-[300px]">
              
              {/* TAB 1: CURSOS & AULAS */}
              {contentTab === 'aulas' && (
                <div className="space-y-6 w-full text-left">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Materiais de Estudo (Cursos & Aulas)</h3>
                      <p className="text-xs text-slate-400">Cadastre e gerencie a biblioteca oficial de conteúdos que aparece na barra lateral do aluno.</p>
                    </div>
                    <button
                      onClick={() => setShowAddSource(!showAddSource)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 shrink-0"
                    >
                      {showAddSource ? 'Cancelar' : 'Adicionar Novo Material'}
                    </button>
                  </div>

                  {showAddSource && (
                    <form onSubmit={handleCreateSource} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 max-w-xl animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-sm font-bold text-white">Novo Material de Estudo</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Título do Documento</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Estatuto do Magistério Público Estadual de SC"
                            value={srcTitle}
                            onChange={(e) => setSrcTitle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Tipo de Conteúdo</label>
                          <select
                            value={srcType}
                            onChange={(e) => setSrcType(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="lei">Lei Estadual / Legislação</option>
                            <option value="edital">Edital de Concurso</option>
                            <option value="apostila">Apostila em PDF</option>
                            <option value="mapa_mental">Mapas Mentais</option>
                            <option value="video">Vídeo Explicativo</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Matéria/Disciplina</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Legislação SC"
                            value={srcMateria}
                            onChange={(e) => setSrcMateria(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Banca Foco</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: FEPESE / ACAFE"
                            value={srcBanca}
                            onChange={(e) => setSrcBanca(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Ano</label>
                          <input
                            type="number"
                            required
                            placeholder="2026"
                            value={srcAno}
                            onChange={(e) => setSrcAno(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Tamanho Simulado</label>
                          <input
                            type="text"
                            placeholder="Ex: 2.5 MB"
                            value={srcSize}
                            onChange={(e) => setSrcSize(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {isLoading ? 'Cadastrando...' : 'Salvar Material de Estudo'}
                      </button>
                    </form>
                  )}

                  <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3 pl-4">ID</th>
                          <th className="p-3">Título</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Banca</th>
                          <th className="p-3">Matéria</th>
                          <th className="p-3 text-right pr-4">Ano (Tamanho)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sources.map((s) => (
                          <tr key={s.id} className="border-b border-slate-700/60 hover:bg-slate-800/30">
                            <td className="p-3 pl-4 font-mono font-bold text-slate-500">{s.id}</td>
                            <td className="p-3 font-bold text-slate-200">{s.titulo}</td>
                            <td className="p-3">
                              <span className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {s.tipo}
                              </span>
                            </td>
                            <td className="p-3 text-slate-300 font-semibold">{s.banca}</td>
                            <td className="p-3 text-slate-400">{s.materia}</td>
                            <td className="p-3 text-right pr-4 text-slate-500 font-mono">
                              {s.ano} ({s.tamanho})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: BANCO DE QUESTÕES */}
              {contentTab === 'questoes' && (
                <div className="space-y-6 w-full text-left">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Banco de Questões</h3>
                      <p className="text-xs text-slate-400">Cadastre e gerencie as questões de simulados e provas anteriores no JPSchool.</p>
                    </div>
                    <button
                      onClick={() => setShowAddQuestion(!showAddQuestion)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 shrink-0"
                    >
                      {showAddQuestion ? 'Cancelar' : 'Cadastrar Questão Inédita'}
                    </button>
                  </div>

                  {showAddQuestion && (
                    <form onSubmit={handleCreateQuestion} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 max-w-xl animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-sm font-bold text-white">Nova Questão Inédita</h4>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Enunciado da Questão</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Ex: Conforme preceitua o Estatuto do Magistério Público Estadual de SC..."
                          value={qEnunciado}
                          onChange={(e) => setQEnunciado(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Matéria/Disciplina</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Legislação SC"
                            value={qMateria}
                            onChange={(e) => setQMateria(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Assunto/Tema</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Estágio Probatório"
                            value={qAssunto}
                            onChange={(e) => setQAssunto(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400">Alternativas (A a E)</label>
                        <input
                          type="text"
                          required
                          placeholder="Alternativa A (Correta se Gabarito for A)"
                          value={qAltA}
                          onChange={(e) => setQAltA(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Alternativa B"
                          value={qAltB}
                          onChange={(e) => setQAltB(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        />
                        <input
                          type="text"
                          placeholder="Alternativa C"
                          value={qAltC}
                          onChange={(e) => setQAltC(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        />
                        <input
                          type="text"
                          placeholder="Alternativa D"
                          value={qAltD}
                          onChange={(e) => setQAltD(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        />
                        <input
                          type="text"
                          placeholder="Alternativa E"
                          value={qAltE}
                          onChange={(e) => setQAltE(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Gabarito (Alternativa Correta)</label>
                        <select
                          value={qGabarito}
                          onChange={(e) => setQGabarito(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value={0}>Alternativa A</option>
                          <option value={1}>Alternativa B</option>
                          <option value={2}>Alternativa C</option>
                          <option value={3}>Alternativa D</option>
                          <option value={4}>Alternativa E</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Comentário / Resolução</label>
                        <textarea
                          rows={2}
                          placeholder="Fundamentação teórica ou legal do gabarito..."
                          value={qComentario}
                          onChange={(e) => setQComentario(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {isLoading ? 'Salvando...' : 'Salvar Questão Inédita'}
                      </button>
                    </form>
                  )}

                  <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3 pl-4">ID</th>
                          <th className="p-3">Banca / Ano</th>
                          <th className="p-3">Matéria / Assunto</th>
                          <th className="p-3">Enunciado</th>
                          <th className="p-3 text-center">Gabarito</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questions.map((q) => (
                          <tr key={q.id} className="border-b border-slate-700/60 hover:bg-slate-800/30">
                            <td className="p-3 pl-4 font-mono font-bold text-slate-500">{q.id}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-200 block">{q.banca}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{q.ano}</span>
                            </td>
                            <td className="p-3">
                              <span className="text-slate-300 font-semibold block">{q.materia}</span>
                              <span className="text-[11px] text-slate-400 font-mono">{q.assunto}</span>
                            </td>
                            <td className="p-3 text-slate-400 max-w-sm truncate text-[11px] font-sans" title={q.enunciado}>
                              {q.enunciado}
                            </td>
                            <td className="p-3 text-center">
                              <span className="bg-slate-900 border border-slate-700 font-mono font-bold text-emerald-400 px-2.5 py-0.5 rounded text-[10px]">
                                {['A', 'B', 'C', 'D', 'E'][q.gabaritoIndex]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: EDITAIS & DOCUMENTOS */}
              {contentTab === 'editais' && (
                <div className="space-y-6 w-full text-left">
                  <div>
                    <h3 className="text-lg font-bold text-white">Indexador Vetorial de RAG (Google Drive Local)</h3>
                    <p className="text-xs text-slate-400">
                      Indexe documentos colocados na pasta <code>/storage</code> para habilitar respostas de alta precisão baseadas em leis de Santa Catarina.
                    </p>
                    <div className="mt-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-300">💡 Instrução de Funcionamento:</p>
                      <p>1. Salve um arquivo PDF correspondente ao material na pasta <code>storage/</code> local do seu projeto.</p>
                      <p>2. Dica: O arquivo PDF deve conter o ID do material ou palavra do título no nome (ex: <code>Edital_021_2026.pdf</code> para o ID 1).</p>
                      <p>3. Clique no botão de ação abaixo para extrair o texto, gerar os embeddings de RAG com o Gemini e salvá-los no Neon/banco local.</p>
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3 pl-4">ID</th>
                          <th className="p-3">Documento</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3 text-center">Chunks no Banco</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right pr-4">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sources.map((s) => {
                          const chunkCount = indexStatus[s.id] || 0;
                          const isIndexed = chunkCount > 0;
                          const isIngesting = ingesterId === s.id;

                          return (
                            <tr key={s.id} className="border-b border-slate-700/60 hover:bg-slate-800/30">
                              <td className="p-3 pl-4 font-mono font-bold text-slate-500">{s.id}</td>
                              <td className="p-3">
                                <span className="font-bold text-slate-200 block">{s.titulo}</span>
                                <span className="text-[10px] text-slate-500 font-mono">Banca: {s.banca}</span>
                              </td>
                              <td className="p-3 font-semibold text-slate-400 capitalize">{s.tipo}</td>
                              <td className="p-3 text-center font-mono font-bold text-slate-300">
                                {chunkCount}
                              </td>
                              <td className="p-3 text-center">
                                {isIndexed ? (
                                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                    INDEXADO
                                  </span>
                                ) : (
                                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                                    PENDENTE
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right pr-4">
                                <button
                                  onClick={() => handleIngestRAG(s.id)}
                                  disabled={isIngesting || isLoading}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                    isIndexed
                                      ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-white text-slate-400'
                                      : 'bg-blue-600 border-blue-500 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  {isIngesting ? 'Processando RAG...' : isIndexed ? 'Reindexar PDF' : 'Indexar PDF RAG'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: RELATORIOS */}
              {contentTab === 'relatorios' && (
                <div className="space-y-6 w-full text-left">
                  <div>
                    <h3 className="text-lg font-bold text-white">Desempenho do Acervo (Métricas RAG)</h3>
                    <p className="text-xs text-slate-400">Acompanhe estatísticas de uso de inteligência artificial e indexação vetorial.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 text-left space-y-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total de Materiais</p>
                      <p className="text-3xl font-extrabold text-white">{sources.length}</p>
                      <p className="text-[10px] text-slate-500">Fontes ativas no menu do aluno</p>
                    </div>
                    <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 text-left space-y-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Questões no Banco</p>
                      <p className="text-3xl font-extrabold text-white">{questions.length}</p>
                      <p className="text-[10px] text-slate-500">Questões prontas no acervo geral</p>
                    </div>
                    <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 text-left space-y-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Documentos Indexados</p>
                      <p className="text-3xl font-extrabold text-white">
                        {Object.values(indexStatus).filter((c) => (c as number) > 0).length} / {sources.length}
                      </p>
                      <p className="text-[10px] text-slate-500">Fontes integradas no RAG vetorial</p>
                    </div>
                    <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 text-left space-y-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total de Chunks Indexados</p>
                      <p className="text-3xl font-extrabold text-white">
                        {Object.values(indexStatus).reduce((a, b) => (a as number) + (b as number), 0)}
                      </p>
                      <p className="text-[10px] text-slate-500">Fragmentos vetoriais armazenados</p>
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 flex flex-col items-center justify-center text-center space-y-2 max-w-md mx-auto">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-center text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-200">Mapeamento Vetorial Ok</h4>
                    <p className="text-[10px] text-slate-500 max-w-sm">
                      O pipeline do RAG Híbrido está respondendo de forma integrada às buscas semânticas da Área do Aluno com banco local / Neon pgvector.
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* SECTION 3: EDITOR DE SITE (TI) */}
        {activeSection === 'ti' && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            {/* Embed the AdminPanel component to run layout edits in real-time */}
            <AdminPanel
              siteConfig={siteConfig}
              onUpdateConfig={onUpdateConfig}
              onResetDefault={onResetDefault}
              onExitAdmin={() => setActiveSection('operacional')}
              onPreviewSalesSite={onGoToPlatform}
            />
          </div>
        )}

      </main>
    </div>
  );
};
