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

            {/* Content Placeholders */}
            <div className="bg-slate-850 rounded-3xl p-6 sm:p-8 border border-slate-800 min-h-[300px] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700">
                <Layers className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-white">Módulo de {contentTab.toUpperCase()} (Gestão de Conteúdo)</h3>
                <p className="text-xs text-slate-400">
                  O banco de dados foi resetado e este painel Admin está pronto para receber novas estruturas de conteúdo conforme os próximos testes.
                </p>
              </div>
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
