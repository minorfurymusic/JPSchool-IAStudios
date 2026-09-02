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
  Plus,
  Trash2,
  Cloud,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { User, SiteConfig } from '../../types';
import { DEFAULT_SITE_CONFIG } from '../../data/siteConfig';
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
  createMatricula,
  updateMatricula,
  deleteMatricula,
  createPagamento,
  updatePagamento,
  deletePagamento,
  createCodigoAcesso,
  updateCodigoAcesso,
  deleteCodigoAcesso,
  createTicket,
  updateTicket,
  deleteTicket,
  createConfiguracao,
  deleteConfiguracao,
  createLead,
  updateLead,
  deleteLead,
  createCampanhaCota,
  updateCampanhaCota,
  deleteCampanhaCota,
  updateOfficialSource,
  deleteOfficialSource,
  updateQuestion,
  deleteQuestion,
  fetchDriveStatus,
  fetchDriveFiles,
  importDriveFile,
  importDriveFolder,
  generateAutoSubcategories,
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

  // CRUD state variables for Matrículas
  const [showAddMatricula, setShowAddMatricula] = useState(false);
  const [editingMatricula, setEditingMatricula] = useState<any | null>(null);
  const [matUsuarioId, setMatUsuarioId] = useState('');
  const [matUsuarioNome, setMatUsuarioNome] = useState('');
  const [matCursoId, setMatCursoId] = useState('101');
  const [matCursoNome, setMatCursoNome] = useState('Professor de Educação Básica - SED/SC 2026');
  const [matStatus, setMatStatus] = useState('ativa');
  const [matDataInicio, setMatDataInicio] = useState('');
  const [matDataFim, setMatDataFim] = useState('');
  const [matOrigem, setMatOrigem] = useState('manual');

  // CRUD state variables for Pagamentos
  const [showAddPagamento, setShowAddPagamento] = useState(false);
  const [editingPagamento, setEditingPagamento] = useState<any | null>(null);
  const [pagUsuarioId, setPagUsuarioId] = useState('');
  const [pagUsuarioNome, setPagUsuarioNome] = useState('');
  const [pagPlanoId, setPagPlanoId] = useState('plano-reta-final');
  const [pagValorCentavos, setPagValorCentavos] = useState('');
  const [pagParcelas, setPagParcelas] = useState('1');
  const [pagMetodo, setPagMetodo] = useState('pix');
  const [pagStatus, setPagStatus] = useState('aprovado');
  const [pagGateway, setPagGateway] = useState('mercadopago');
  const [pagTransacaoId, setPagTransacaoId] = useState('');

  // CRUD state variables for Códigos de Acesso
  const [showAddCodigo, setShowAddCodigo] = useState(false);
  const [editingCodigo, setEditingCodigo] = useState<any | null>(null);
  const [codCodigo, setCodCodigo] = useState('');
  const [codTipo, setCodTipo] = useState('trial');
  const [codDiasValidade, setCodDiasValidade] = useState('7');
  const [codUsado, setCodUsado] = useState(false);
  const [codCursoId, setCodCursoId] = useState('');

  // CRUD state variables for Tickets
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [ticUsuarioId, setTicUsuarioId] = useState('');
  const [ticUsuarioNome, setTicUsuarioNome] = useState('');
  const [ticAssunto, setTicAssunto] = useState('');
  const [ticMensagem, setTicMensagem] = useState('');
  const [ticStatus, setTicStatus] = useState('aberto');
  const [ticPrioridade, setTicPrioridade] = useState('media');
  const [ticRespostaMensagem, setTicRespostaMensagem] = useState('');

  // CRUD state variables for Configurações
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [cfgChave, setCfgChave] = useState('');
  const [cfgValor, setCfgValor] = useState('');
  const [cfgDescricao, setCfgDescricao] = useState('');
  const [cfgCategoria, setCfgCategoria] = useState('geral');

  // CRUD state variables for Leads
  const [showAddLead, setShowAddLead] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [ldNome, setLdNome] = useState('');
  const [ldEmail, setLdEmail] = useState('');
  const [ldTelefone, setLdTelefone] = useState('');
  const [ldOrigem, setLdOrigem] = useState('site_vendas');
  const [ldStatus, setLdStatus] = useState('novo');

  // CRUD state variables for Campanhas
  const [showAddCampanha, setShowAddCampanha] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<any | null>(null);
  const [camNome, setCamNome] = useState('');
  const [camOverrideProducoesMax, setCamOverrideProducoesMax] = useState('');
  const [camOverrideDownloadsMax, setCamOverrideDownloadsMax] = useState('');
  const [camDataInicio, setCamDataInicio] = useState('');
  const [camDataFim, setCamDataFim] = useState('');
  const [camAtiva, setCamAtiva] = useState(true);

  // Google Drive Sync states
  const [driveStatus, setDriveStatus] = useState<{ configured: boolean; folderId: string; serviceAccountEmail: string } | null>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveFolders, setDriveFolders] = useState<any[]>([]);
  const [totalDrivePDFs, setTotalDrivePDFs] = useState<number>(0);
  const [totalIngestedPDFs, setTotalIngestedPDFs] = useState<number>(0);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [batchIngestingFolderId, setBatchIngestingFolderId] = useState<string | null>(null);
  const cancelBatchRef = React.useRef(false);
  const [batchProgress, setBatchProgress] = useState<{
    active: boolean;
    folderId: string;
    folderName: string;
    currentIndex: number;
    totalFiles: number;
    currentFileName: string;
    processedCount: number;
    totalChunks: number;
    errorsCount: number;
  } | null>(null);
  const [folderCategories, setFolderCategories] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('jpschool_drive_folder_categories');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });
  const [fileCategories, setFileCategories] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('jpschool_drive_file_categories');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const handleSetFileCategory = (fileId: string, categoryName: string) => {
    setFileCategories((prev) => {
      const updated = { ...prev, [fileId]: categoryName };
      try {
        localStorage.setItem('jpschool_drive_file_categories', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSetFolderCategoryMassive = (folder: any, categoryName: string) => {
    setFolderCategories((prev) => {
      const updatedFolders = { ...prev, [folder.id]: categoryName };
      try {
        localStorage.setItem('jpschool_drive_folder_categories', JSON.stringify(updatedFolders));
      } catch (e) {}
      return updatedFolders;
    });

    if (folder.files && Array.isArray(folder.files)) {
      setFileCategories((prev) => {
        const updatedFiles = { ...prev };
        folder.files.forEach((f: any) => {
          updatedFiles[f.id] = categoryName;
        });
        try {
          localStorage.setItem('jpschool_drive_file_categories', JSON.stringify(updatedFiles));
        } catch (e) {}
        return updatedFiles;
      });
    }
  };

  const getActiveCategories = () => {
    if (siteConfig?.sourceCategories && Array.isArray(siteConfig.sourceCategories) && siteConfig.sourceCategories.length > 0) {
      const isCorrupted = siteConfig.sourceCategories.every((c: any) => c.nome.toLowerCase().includes('teste'));
      if (!isCorrupted) return siteConfig.sourceCategories;
    }
    try {
      const saved = localStorage.getItem('jpschool_site_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sourceCategories && Array.isArray(parsed.sourceCategories) && parsed.sourceCategories.length > 0) {
          const isCorrupted = parsed.sourceCategories.every((c: any) => c.nome.toLowerCase().includes('teste'));
          if (!isCorrupted) return parsed.sourceCategories;
        }
      }
    } catch (_) {}
    return DEFAULT_SITE_CONFIG.sourceCategories;
  };

  const detectCategoryForFolder = (folderName: string): string => {
    const lower = folderName.toLowerCase();
    const active = getActiveCategories();
    
    // Exact name match
    const exact = active.find((c: any) => c.nome.toLowerCase() === lower || lower.includes(c.nome.toLowerCase()));
    if (exact) return exact.nome;

    if (lower.includes('questõ') || lower.includes('questao') || lower.includes('questões')) {
      const qCat = active.find((c: any) => c.nome.toLowerCase().includes('questõ') || c.nome.toLowerCase().includes('questao'));
      if (qCat) return qCat.nome;
    }
    if (lower.includes('história') || lower.includes('historia') || lower.includes('geografia')) {
      const hCat = active.find((c: any) => c.nome.toLowerCase().includes('história') || c.nome.toLowerCase().includes('geografia'));
      if (hCat) return hCat.nome;
    }
    if (lower.includes('português') || lower.includes('portugues') || lower.includes('gramática')) {
      const pCat = active.find((c: any) => c.nome.toLowerCase().includes('português') || c.nome.toLowerCase().includes('portugues'));
      if (pCat) return pCat.nome;
    }
    if (lower.includes('didática') || lower.includes('didatica') || lower.includes('currículo')) {
      const dCat = active.find((c: any) => c.nome.toLowerCase().includes('didática') || c.nome.toLowerCase().includes('currículo'));
      if (dCat) return dCat.nome;
    }
    if (lower.includes('estatuto') || lower.includes('magistério')) {
      const eCat = active.find((c: any) => c.nome.toLowerCase().includes('estatuto') || c.nome.toLowerCase().includes('servidor'));
      if (eCat) return eCat.nome;
    }
    if (lower.includes('legislação') || lower.includes('legislacao') || lower.includes('ldb') || lower.includes('eca')) {
      const lCat = active.find((c: any) => c.nome.toLowerCase().includes('legislação') || c.nome.toLowerCase().includes('educacional'));
      if (lCat) return lCat.nome;
    }
    if (lower.includes('prova')) {
      const prCat = active.find((c: any) => c.nome.toLowerCase().includes('prova'));
      if (prCat) return prCat.nome;
    }

    return '';
  };

  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [selectedSourceForDrive, setSelectedSourceForDrive] = useState<string>('');
  const [driveSearchQuery, setDriveSearchQuery] = useState<string>('');

  // CRUD action handlers
  const handleCreateMatricula = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await createMatricula({
        usuarioId: Number(matUsuarioId),
        usuarioNome: matUsuarioNome,
        cursoId: Number(matCursoId),
        cursoNome: matCursoNome,
        status: matStatus,
        dataInicio: matDataInicio,
        dataFim: matDataFim,
        origem: matOrigem
      });
      if (res.success) {
        showStatus('Matrícula cadastrada com sucesso!', 'success');
        setMatriculas(res.matriculas);
        setShowAddMatricula(false);
        setMatUsuarioId(''); setMatUsuarioNome(''); setMatDataInicio(''); setMatDataFim('');
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao cadastrar matrícula', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMatricula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatricula) return;
    try {
      setIsLoading(true);
      const res = await updateMatricula(editingMatricula.id, {
        usuarioId: Number(matUsuarioId),
        usuarioNome: matUsuarioNome,
        cursoId: Number(matCursoId),
        cursoNome: matCursoNome,
        status: matStatus,
        dataInicio: matDataInicio,
        dataFim: matDataFim,
        origem: matOrigem
      });
      if (res.success) {
        showStatus('Matrícula atualizada com sucesso!', 'success');
        setMatriculas(res.matriculas);
        setEditingMatricula(null);
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao atualizar matrícula', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMatricula = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta matrícula?')) return;
    try {
      setIsLoading(true);
      const res = await deleteMatricula(id);
      if (res.success) {
        showStatus('Matrícula excluída com sucesso!', 'success');
        setMatriculas(res.matriculas);
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao excluir matrícula', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await createPagamento({
        usuarioId: Number(pagUsuarioId),
        usuarioNome: pagUsuarioNome,
        planoId: pagPlanoId,
        valor_centavos: Number(pagValorCentavos),
        parcelas: Number(pagParcelas),
        metodo: pagMetodo,
        status: pagStatus,
        gateway: pagGateway,
        transacaoId: pagTransacaoId
      });
      if (res.success) {
        showStatus('Pagamento cadastrado com sucesso!', 'success');
        setPagamentos(res.pagamentos);
        setShowAddPagamento(false);
        setPagUsuarioId(''); setPagUsuarioNome(''); setPagValorCentavos(''); setPagTransacaoId('');
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao cadastrar pagamento', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPagamento) return;
    try {
      setIsLoading(true);
      const res = await updatePagamento(editingPagamento.id, {
        usuarioId: Number(pagUsuarioId),
        usuarioNome: pagUsuarioNome,
        planoId: pagPlanoId,
        valor_centavos: Number(pagValorCentavos),
        parcelas: Number(pagParcelas),
        metodo: pagMetodo,
        status: pagStatus,
        gateway: pagGateway,
        transacaoId: pagTransacaoId
      });
      if (res.success) {
        showStatus('Pagamento atualizado com sucesso!', 'success');
        setPagamentos(res.pagamentos);
        setEditingPagamento(null);
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao atualizar pagamento', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePagamento = async (id: number) => {
    if (!confirm('Deseja realmente excluir este pagamento?')) return;
    try {
      setIsLoading(true);
      const res = await deletePagamento(id);
      if (res.success) {
        showStatus('Pagamento excluído com sucesso!', 'success');
        setPagamentos(res.pagamentos);
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao excluir pagamento', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await createCodigoAcesso({
        codigo: codCodigo,
        tipo: codTipo,
        diasValidade: Number(codDiasValidade),
        cursoId: codCursoId ? Number(codCursoId) : undefined
      });
      if (res.success) {
        showStatus('Código de acesso cadastrado!', 'success');
        setCodigos(res.codigos);
        setShowAddCodigo(false);
        setCodCodigo('');
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao cadastrar código', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCodigo) return;
    try {
      setIsLoading(true);
      const res = await updateCodigoAcesso(editingCodigo.id, {
        codigo: codCodigo,
        tipo: codTipo,
        diasValidade: Number(codDiasValidade),
        usado: codUsado,
        cursoId: codCursoId ? Number(codCursoId) : undefined
      });
      if (res.success) {
        showStatus('Código de acesso atualizado!', 'success');
        setCodigos(res.codigos);
        setEditingCodigo(null);
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao atualizar código', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCodigo = async (id: number) => {
    if (!confirm('Deseja realmente excluir este código?')) return;
    try {
      setIsLoading(true);
      const res = await deleteCodigoAcesso(id);
      if (res.success) {
        showStatus('Código de acesso excluído!', 'success');
        setCodigos(res.codigos);
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao excluir código', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await createTicket({
        usuarioId: ticUsuarioId ? Number(ticUsuarioId) : undefined,
        usuarioNome: ticUsuarioNome,
        assunto: ticAssunto,
        mensagem: ticMensagem,
        status: ticStatus,
        prioridade: ticPrioridade
      });
      if (res.success) {
        showStatus('Ticket criado com sucesso!', 'success');
        setTickets(res.tickets);
        setShowAddTicket(false);
        setTicAssunto(''); setTicMensagem(''); setTicUsuarioId(''); setTicUsuarioNome('');
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao criar ticket', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;
    try {
      setIsLoading(true);
      const res = await updateTicket(editingTicket.id, {
        status: ticStatus,
        prioridade: ticPrioridade,
        respostaMensagem: ticRespostaMensagem,
        respostaAutor: user.nome
      });
      if (res.success) {
        showStatus('Ticket respondido/atualizado com sucesso!', 'success');
        setTickets(res.tickets);
        setEditingTicket(null);
        setTicRespostaMensagem('');
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao atualizar ticket', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTicket = async (id: number) => {
    if (!confirm('Deseja realmente excluir este ticket?')) return;
    try {
      setIsLoading(true);
      const res = await deleteTicket(id);
      if (res.success) {
        showStatus('Ticket excluído com sucesso!', 'success');
        setTickets(res.tickets);
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao excluir ticket', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalValue = cfgValor.trim();
    if (cfgChave === 'GOOGLE_DRIVE_FOLDER_ID' && finalValue.includes('folders/')) {
      const match = finalValue.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        finalValue = match[1];
      }
    }
    try {
      setIsLoading(true);
      const res = await createConfiguracao({
        chave: cfgChave,
        valor: finalValue,
        descricao: cfgDescricao,
        categoria: cfgCategoria
      });
      if (res.success) {
        showStatus('Chave de configuração cadastrada!', 'success');
        setConfiguracoes(res.configuracoes);
        setShowAddConfig(false);
        setCfgChave(''); setCfgValor(''); setCfgDescricao('');
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao cadastrar configuração', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateConfigValue = async (chave: string) => {
    let finalValue = editingConfigValue.trim();
    if (chave === 'GOOGLE_DRIVE_FOLDER_ID' && finalValue.includes('folders/')) {
      const match = finalValue.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        finalValue = match[1];
      }
    }
    try {
      setIsLoading(true);
      const res = await updateConfiguracaoValue(chave, finalValue);
      if (res.success) {
        showStatus('Configuração atualizada com sucesso!', 'success');
        setConfiguracoes(res.configuracoes || configuracoes.map(c => c.chave === chave ? { ...c, valor: finalValue } : c));
        setEditingConfigChave(null);
        setEditingConfigValue('');
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao atualizar configuração', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfig = async (chave: string) => {
    if (!confirm(`Deseja realmente excluir a chave ${chave}?`)) return;
    try {
      setIsLoading(true);
      const res = await deleteConfiguracao(chave);
      if (res.success) {
        showStatus('Configuração excluída!', 'success');
        setConfiguracoes(res.configuracoes);
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao excluir configuração', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await createLead({
        nome: ldNome,
        email: ldEmail,
        telefone: ldTelefone,
        origem: ldOrigem,
        status: ldStatus
      });
      if (res.success) {
        showStatus('Lead cadastrado com sucesso!', 'success');
        setLeads(res.leads);
        setShowAddLead(false);
        setLdNome(''); setLdEmail(''); setLdTelefone('');
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao cadastrar lead', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      setIsLoading(true);
      const res = await updateLead(editingLead.id, {
        nome: ldNome,
        email: ldEmail,
        telefone: ldTelefone,
        origem: ldOrigem,
        status: ldStatus
      });
      if (res.success) {
        showStatus('Lead atualizado com sucesso!', 'success');
        setLeads(res.leads);
        setEditingLead(null);
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao atualizar lead', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!confirm('Deseja realmente excluir este lead?')) return;
    try {
      setIsLoading(true);
      const res = await deleteLead(id);
      if (res.success) {
        showStatus('Lead excluído com sucesso!', 'success');
        setLeads(res.leads);
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao excluir lead', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCampanha = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await createCampanhaCota({
        nome: camNome,
        overrideProducoesMax: camOverrideProducoesMax ? Number(camOverrideProducoesMax) : undefined,
        overrideDownloadsMax: camOverrideDownloadsMax ? Number(camOverrideDownloadsMax) : undefined,
        dataInicio: camDataInicio,
        dataFim: camDataFim,
        ativa: camAtiva
      });
      if (res.success) {
        showStatus('Campanha cadastrada com sucesso!', 'success');
        setCampanhas(res.campanhas);
        setShowAddCampanha(false);
        setCamNome(''); setCamOverrideProducoesMax(''); setCamOverrideDownloadsMax(''); setCamDataInicio(''); setCamDataFim('');
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao cadastrar campanha', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCampanha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampanha) return;
    try {
      setIsLoading(true);
      const res = await updateCampanhaCota(editingCampanha.id, {
        nome: camNome,
        overrideProducoesMax: camOverrideProducoesMax ? Number(camOverrideProducoesMax) : undefined,
        overrideDownloadsMax: camOverrideDownloadsMax ? Number(camOverrideDownloadsMax) : undefined,
        dataInicio: camDataInicio,
        dataFim: camDataFim,
        ativa: camAtiva
      });
      if (res.success) {
        showStatus('Campanha atualizada com sucesso!', 'success');
        setCampanhas(res.campanhas);
        setEditingCampanha(null);
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao atualizar campanha', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCampanha = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta campanha?')) return;
    try {
      setIsLoading(true);
      const res = await deleteCampanhaCota(id);
      if (res.success) {
        showStatus('Campanha excluída com sucesso!', 'success');
        setCampanhas(res.campanhas);
        const logsData = await fetchLogsAuditoria();
        setLogs(logsData);
      } else {
        showStatus(res.error || 'Erro ao excluir campanha', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource) return;
    try {
      setIsLoading(true);
      const res = await updateOfficialSource(editingSource.id, {
        titulo: srcTitle,
        tipo: srcType,
        materia: srcMateria,
        banca: srcBanca,
        ano: Number(srcAno),
        tamanho: srcSize
      });
      if (res.success) {
        showStatus('Material de estudos atualizado com sucesso!', 'success');
        setSources(res.sources);
        setEditingSource(null);
        setSrcTitle('');
      } else {
        showStatus(res.error || 'Erro ao atualizar material', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSource = async (id: number) => {
    if (!confirm('Deseja realmente excluir este material? Todos os fragmentos RAG vinculados a ele serão perdidos.')) return;
    try {
      setIsLoading(true);
      const res = await deleteOfficialSource(id);
      if (res.success) {
        showStatus('Material de estudos excluído com sucesso!', 'success');
        setSources(res.sources);
        const idxs = await fetchSourcesIndexStatus();
        setIndexStatus(idxs);
      } else {
        showStatus(res.error || 'Erro ao excluir material', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    try {
      setIsLoading(true);
      const res = await updateQuestion(editingQuestion.id, {
        banca: srcBanca,
        materia: qMateria,
        assunto: qAssunto,
        enunciado: qEnunciado,
        alternativas: [qAltA, qAltB, qAltC || 'N/A', qAltD || 'N/A', qAltE || 'N/A'].filter((a) => a.trim() !== ''),
        gabaritoIndex: qGabarito,
        comentario: qComentario
      });
      if (res.success) {
        showStatus('Questão atualizada com sucesso!', 'success');
        setQuestions(res.questions);
        setEditingQuestion(null);
        setQEnunciado(''); setQAltA(''); setQAltB(''); setQAltC(''); setQAltD(''); setQAltE(''); setQComentario('');
      } else {
        showStatus(res.error || 'Erro ao atualizar questão', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta questão?')) return;
    try {
      setIsLoading(true);
      const res = await deleteQuestion(id);
      if (res.success) {
        showStatus('Questão excluída com sucesso!', 'success');
        setQuestions(res.questions);
      } else {
        showStatus(res.error || 'Erro ao excluir questão', 'error');
      }
    } catch (err) {
      showStatus('Erro ao comunicar com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Drive Handlers
  const loadDriveFiles = async () => {
    try {
      setIsLoadingDrive(true);
      const statusRes = await fetchDriveStatus();
      setDriveStatus(statusRes);
      if (statusRes.configured) {
        const filesRes = await fetchDriveFiles();
        const folders = filesRes.folders || [];
        setDriveFolders(folders);
        setTotalDrivePDFs(filesRes.totalPDFs || 0);
        setTotalIngestedPDFs(filesRes.totalIngestedPDFs || 0);
        setDriveFiles(filesRes.files || []);

        setOpenFolders(prev => {
          const next = { ...prev };
          folders.forEach((f: any) => {
            if (next[f.id] === undefined) next[f.id] = true;
          });
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to load Drive files', err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleImportFolderPDFs = async (folder: any, onlyPending = false) => {
    if (!folder.files || folder.files.length === 0) return;

    const filesToProcess = onlyPending
      ? folder.files.filter((f: any) => !f.ingested)
      : folder.files;

    if (filesToProcess.length === 0) {
      showStatus('Todos os PDFs desta pasta já estão indexados no RAG! Nenhum pendente.', 'success');
      return;
    }

    cancelBatchRef.current = false;
    setIsLoading(true);
    setBatchIngestingFolderId(folder.id);

    let processed = 0;
    let totalChunks = 0;
    let errors = 0;

    for (let i = 0; i < filesToProcess.length; i++) {
      if (cancelBatchRef.current) {
        showStatus(`Ingestão interrompida pelo usuário (${processed} de ${filesToProcess.length} PDFs concluídos).`, 'error');
        break;
      }

      const file = filesToProcess[i];

      setBatchProgress({
        active: true,
        folderId: folder.id,
        folderName: folder.name,
        currentIndex: i + 1,
        totalFiles: filesToProcess.length,
        currentFileName: file.name,
        processedCount: processed,
        totalChunks,
        errorsCount: errors,
      });

      try {
        const cleanTitle = file.name.replace(/\.pdf$/i, '');
        const targetCategory = fileCategories[file.id] || folderCategories[folder.id] || detectCategoryForFolder(file.name || folder.name);
        const addRes = await addOfficialSource({
          titulo: cleanTitle,
          tipo: cleanTitle.toLowerCase().includes('lei') ? 'lei' : cleanTitle.toLowerCase().includes('edital') ? 'edital' : 'apostila',
          materia: targetCategory,
          banca: 'SED-SC',
          ano: new Date().getFullYear(),
          tamanho: 'PDF Drive',
          selecionada: true,
        });

        if (addRes.success && addRes.source) {
          const ingestRes = await importDriveFile(file.id, addRes.source.id);
          if (ingestRes.success) {
            processed++;
            totalChunks += (ingestRes.details?.chunksIndexados || 0);
          } else {
            errors++;
          }
        } else {
          errors++;
        }
      } catch (err) {
        errors++;
      }

      setBatchProgress({
        active: true,
        folderId: folder.id,
        folderName: folder.name,
        currentIndex: i + 1,
        totalFiles: filesToProcess.length,
        currentFileName: file.name,
        processedCount: processed,
        totalChunks,
        errorsCount: errors,
      });
    }

    setBatchProgress(null);
    setBatchIngestingFolderId(null);
    setIsLoading(false);

    // Refresh drive files once after the entire batch finishes
    await loadDriveFiles();

    if (!cancelBatchRef.current) {
      showStatus(`🎉 Ingestão concluída! ${processed} de ${filesToProcess.length} arquivos indexados (${totalChunks} fragmentos gerados).`, 'success');
    }
  };

  const handleCancelBatch = () => {
    cancelBatchRef.current = true;
  };

  useEffect(() => {
    if (activeSection === 'conteudo' && contentTab === 'aulas') {
      loadDriveFiles();
    }
  }, [activeSection, contentTab]);

  const handleImportDrivePDF = async (fileId: string, fileName: string, folderName?: string) => {
    try {
      setIsLoading(true);
      setIngesterId(fileId);
      const cleanTitle = fileName.replace(/\.pdf$/i, '');
      showStatus(`Baixando e processando "${cleanTitle}" do Google Drive...`, 'success');
      const targetCategory = fileCategories[fileId] || (folderName && folderCategories[folderName]) || detectCategoryForFolder(fileName || folderName || '');
      const addRes = await addOfficialSource({
        titulo: cleanTitle,
        tipo: cleanTitle.toLowerCase().includes('lei') ? 'lei' : cleanTitle.toLowerCase().includes('edital') ? 'edital' : 'apostila',
        materia: targetCategory,
        banca: 'SED-SC',
        ano: new Date().getFullYear(),
        tamanho: 'PDF Drive',
      });
      
      if (addRes.success && addRes.source) {
        setSources(addRes.sources);
        const sourceId = addRes.source.id;
        const ingestRes = await importDriveFile(fileId, sourceId);
        if (ingestRes.success) {
          showStatus(`Documento "${cleanTitle}" importado e indexado com sucesso no RAG! ${ingestRes.details?.chunksIndexados || 0} fragmentos gerados.`, 'success');
          await loadDriveFiles();
          const idxs = await fetchSourcesIndexStatus();
          setIndexStatus(idxs);
        } else {
          showStatus(ingestRes.error || 'Arquivo registrado, mas houve alerta na indexação RAG.', 'error');
        }
      } else {
        showStatus(addRes.error || 'Erro ao registrar PDF no acervo.', 'error');
      }
    } catch (err: any) {
      showStatus(err.message || 'Erro ao importar arquivo do Google Drive.', 'error');
    } finally {
      setIsLoading(false);
      setIngesterId(null);
    }
  };

  const [isGeneratingSubcats, setIsGeneratingSubcats] = useState(false);

  const handleGenerateSubcategories = async (categoriaNome?: string) => {
    try {
      setIsGeneratingSubcats(true);
      showStatus('Inteligência Artificial analisando materiais e organizando subcategorias...', 'success');
      const res = await generateAutoSubcategories(categoriaNome);
      if (res.success) {
        showStatus(res.message, 'success');
        const updatedSources = await fetchSources();
        setSources(updatedSources);

        if (res.subcategorias && Array.isArray(res.subcategorias)) {
          const currentCategories = getActiveCategories();
          const updatedCategories = currentCategories.map((cat: any) => {
            if (!categoriaNome || cat.nome.toLowerCase().includes(categoriaNome.toLowerCase())) {
              return {
                ...cat,
                subcategorias: res.subcategorias,
              };
            }
            return cat;
          });
          onUpdateConfig({
            ...siteConfig,
            sourceCategories: updatedCategories,
          });
        }
      } else {
        showStatus(res.error || 'Erro ao gerar subcategorias com IA.', 'error');
      }
    } catch (err: any) {
      showStatus(err.message || 'Erro de comunicação ao gerar subcategorias', 'error');
    } finally {
      setIsGeneratingSubcats(false);
    }
  };

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



  // Content states
  const [sources, setSources] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [indexStatus, setIndexStatus] = useState<Record<number, number>>({});

  // Forms visibility & editing states
  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingSource, setEditingSource] = useState<any | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

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

  const formatConfigDisplayValue = (chave: string, valor: string) => {
    if (!valor || valor.trim() === '') {
      return <span className="text-slate-500 italic text-[11px]">Não configurado(a)</span>;
    }
    
    const isSensitive = 
      chave === 'GEMINI_API_KEY' || 
      chave === 'GOOGLE_SERVICE_ACCOUNT_KEY' || 
      chave.includes('KEY') || 
      chave.includes('TOKEN') || 
      chave.includes('SECRET') || 
      chave.includes('SENHA');

    if (isSensitive) {
      return (
        <span className="font-mono bg-slate-900 px-2.5 py-1 border border-slate-800 rounded-md text-amber-400 font-bold tracking-widest text-[11px] select-none" title="Chave confidencial gravada com segurança">
          ••••••••••••••••
        </span>
      );
    }

    if (chave === 'GOOGLE_DRIVE_FOLDER_ID') {
      let cleanId = valor;
      if (valor.includes('folders/')) {
        const match = valor.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) cleanId = match[1];
      }
      const masked = cleanId.length > 8 ? `${cleanId.slice(0, 4)}...${cleanId.slice(-4)}` : '••••••••';
      return (
        <span className="font-mono bg-slate-900 px-2.5 py-1 border border-slate-800 rounded-md text-emerald-400 font-bold text-[11px]">
          {masked}
        </span>
      );
    }

    return (
      <span className="font-mono bg-slate-900 px-2.5 py-1 border border-slate-800 rounded-md text-emerald-400 font-bold text-[11px]">
        {valor}
      </span>
    );
  };

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

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Show add form for active sub-tab
                    if (operTab === 'matriculas') {
                      setEditingMatricula(null);
                      setMatUsuarioId(''); setMatUsuarioNome(''); setMatDataInicio(''); setMatDataFim('');
                      setShowAddMatricula(!showAddMatricula);
                    } else if (operTab === 'pagamentos') {
                      setEditingPagamento(null);
                      setPagUsuarioId(''); setPagUsuarioNome(''); setPagValorCentavos(''); setPagTransacaoId('');
                      setShowAddPagamento(!showAddPagamento);
                    } else if (operTab === 'codigos') {
                      setEditingCodigo(null);
                      setCodCodigo(''); setCodDiasValidade('7');
                      setShowAddCodigo(!showAddCodigo);
                    } else if (operTab === 'tickets') {
                      setEditingTicket(null);
                      setTicUsuarioId(''); setTicUsuarioNome(''); setTicAssunto(''); setTicMensagem('');
                      setShowAddTicket(!showAddTicket);
                    } else if (operTab === 'configuracoes') {
                      setCfgChave(''); setCfgValor(''); setCfgDescricao('');
                      setShowAddConfig(!showAddConfig);
                    } else if (operTab === 'leads') {
                      setEditingLead(null);
                      setLdNome(''); setLdEmail(''); setLdTelefone('');
                      setShowAddLead(!showAddLead);
                    } else if (operTab === 'campanhas') {
                      setEditingCampanha(null);
                      setCamNome(''); setCamOverrideProducoesMax(''); setCamOverrideDownloadsMax(''); setCamDataInicio(''); setCamDataFim('');
                      setShowAddCampanha(!showAddCampanha);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Registro</span>
                </button>

                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            {/* ENTITY CONTENT VIEWER */}
            <div className="bg-slate-850 border border-slate-800 rounded-3xl p-6 overflow-x-auto min-h-[300px]">
              
              {/* TAB 1: MATRICULAS */}
              {operTab === 'matriculas' && (
                <div className="space-y-6">
                  {(showAddMatricula || editingMatricula) && (
                    <form onSubmit={editingMatricula ? handleUpdateMatricula : handleCreateMatricula} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 max-w-xl text-left animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-sm font-bold text-white">{editingMatricula ? 'Editar Matrícula' : 'Nova Matrícula'}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">ID Usuário (Aluno)</label>
                          <input
                            type="number"
                            required
                            placeholder="Ex: 3"
                            value={matUsuarioId}
                            onChange={(e) => setMatUsuarioId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Nome do Aluno</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Jean RSL"
                            value={matUsuarioNome}
                            onChange={(e) => setMatUsuarioNome(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">ID Curso</label>
                          <input
                            type="number"
                            required
                            placeholder="Ex: 101"
                            value={matCursoId}
                            onChange={(e) => setMatCursoId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Nome do Curso</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Professor SED-SC 2026"
                            value={matCursoNome}
                            onChange={(e) => setMatCursoNome(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Data Início</label>
                          <input
                            type="date"
                            value={matDataInicio}
                            onChange={(e) => setMatDataInicio(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Data Fim</label>
                          <input
                            type="date"
                            value={matDataFim}
                            onChange={(e) => setMatDataFim(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Status da Matrícula</label>
                          <select
                            value={matStatus}
                            onChange={(e) => setMatStatus(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="ativa">Ativa</option>
                            <option value="cancelada">Cancelada</option>
                            <option value="expirada">Expirada</option>
                            <option value="suspensa">Suspensa</option>
                            <option value="trial">Trial / Cortesia</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Origem</label>
                          <select
                            value={matOrigem}
                            onChange={(e) => setMatOrigem(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="manual">Manual / Admin</option>
                            <option value="compra">Compra Direta</option>
                            <option value="codigo_acesso">Código de Acesso</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {isLoading ? 'Salvando...' : 'Salvar Matrícula'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddMatricula(false); setEditingMatricula(null); }}
                          className="px-4 py-2 bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3">ID</th>
                        <th className="pb-3">Aluno</th>
                        <th className="pb-3">Curso</th>
                        <th className="pb-3">Início</th>
                        <th className="pb-3">Fim</th>
                        <th className="pb-3">Origem</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Ações</th>
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
                              <div className="flex justify-end space-x-1.5">
                                <button
                                  onClick={() => {
                                    setEditingMatricula(m);
                                    setMatUsuarioId(String(m.usuarioId));
                                    setMatUsuarioNome(m.usuarioNome);
                                    setMatCursoId(String(m.cursoId));
                                    setMatCursoNome(m.cursoNome);
                                    setMatStatus(m.status);
                                    setMatDataInicio(m.dataInicio);
                                    setMatDataFim(m.dataFim);
                                    setMatOrigem(m.origem);
                                    setShowAddMatricula(false);
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-all"
                                  title="Editar Matrícula"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#1877F2]" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMatricula(m.id)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-all"
                                  title="Excluir Matrícula"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: PAGAMENTOS */}
              {operTab === 'pagamentos' && (
                <div className="space-y-6">
                  {(showAddPagamento || editingPagamento) && (
                    <form onSubmit={editingPagamento ? handleUpdatePagamento : handleCreatePagamento} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 max-w-xl text-left animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-sm font-bold text-white">{editingPagamento ? 'Editar Pagamento' : 'Novo Pagamento'}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">ID Aluno</label>
                          <input
                            type="number"
                            required
                            placeholder="Ex: 3"
                            value={pagUsuarioId}
                            onChange={(e) => setPagUsuarioId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Nome do Aluno</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Jean RSL"
                            value={pagUsuarioNome}
                            onChange={(e) => setPagUsuarioNome(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">ID Plano</label>
                          <input
                            type="text"
                            required
                            placeholder="plano-reta-final"
                            value={pagPlanoId}
                            onChange={(e) => setPagPlanoId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Valor em Centavos (R$ 497,00 = 49700)</label>
                          <input
                            type="number"
                            required
                            placeholder="Ex: 49700"
                            value={pagValorCentavos}
                            onChange={(e) => setPagValorCentavos(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Parcelas</label>
                          <input
                            type="number"
                            required
                            placeholder="Ex: 1"
                            value={pagParcelas}
                            onChange={(e) => setPagParcelas(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Método</label>
                          <select
                            value={pagMetodo}
                            onChange={(e) => setPagMetodo(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="pix">PIX</option>
                            <option value="cartao">Cartão de Crédito</option>
                            <option value="boleto">Boleto Bancário</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Status da Transação</label>
                          <select
                            value={pagStatus}
                            onChange={(e) => setPagStatus(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="aprovado">Aprovado</option>
                            <option value="pendente">Pendente</option>
                            <option value="recusado">Recusado</option>
                            <option value="estornado">Estornado</option>
                            <option value="chargeback">Chargeback</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Gateway</label>
                          <select
                            value={pagGateway}
                            onChange={(e) => setPagGateway(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="mercadopago">Mercado Pago</option>
                            <option value="infinitpay">InfinitPay</option>
                            <option value="manual">Manual / Caixa</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">ID da Transação no Gateway</label>
                          <input
                            type="text"
                            placeholder="Ex: MP-984210398"
                            value={pagTransacaoId}
                            onChange={(e) => setPagTransacaoId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {isLoading ? 'Salvando...' : 'Salvar Pagamento'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddPagamento(false); setEditingPagamento(null); }}
                          className="px-4 py-2 bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
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
                        <th className="pb-3 text-right">Ações</th>
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
                            <td className="py-4 text-[#1877F2] font-bold font-mono">
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
                            <td className="py-4 text-right">
                              <div className="flex justify-end space-x-1.5">
                                <button
                                  onClick={() => {
                                    setEditingPagamento(p);
                                    setPagUsuarioId(String(p.usuarioId));
                                    setPagUsuarioNome(p.usuarioNome);
                                    setPagPlanoId(p.planoId);
                                    setPagValorCentavos(String(p.valor_centavos));
                                    setPagParcelas(String(p.parcelas));
                                    setPagMetodo(p.metodo);
                                    setPagStatus(p.status);
                                    setPagGateway(p.gateway);
                                    setPagTransacaoId(p.transacaoId || '');
                                    setShowAddPagamento(false);
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-all"
                                  title="Editar Pagamento"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#1877F2]" />
                                </button>
                                <button
                                  onClick={() => handleDeletePagamento(p.id)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-all"
                                  title="Excluir Pagamento"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: CODIGOS DE ACESSO */}
              {operTab === 'codigos' && (
                <div className="space-y-6">
                  {(showAddCodigo || editingCodigo) && (
                    <form onSubmit={editingCodigo ? handleUpdateCodigo : handleCreateCodigo} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 max-w-xl text-left animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-sm font-bold text-white">{editingCodigo ? 'Editar Código' : 'Novo Código de Acesso'}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Código Promocional</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: JP-OFF-50"
                            value={codCodigo}
                            onChange={(e) => setCodCodigo(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Tipo de Acesso</label>
                          <select
                            value={codTipo}
                            onChange={(e) => setCodTipo(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="trial">Trial / Teste Grátis</option>
                            <option value="extensao">Extensão de Prazo</option>
                            <option value="cortesia">Cortesia Completa</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Validade (Dias)</label>
                          <input
                            type="number"
                            required
                            placeholder="Ex: 7"
                            value={codDiasValidade}
                            onChange={(e) => setCodDiasValidade(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">ID Curso Vínculo (Opcional)</label>
                          <input
                            type="number"
                            placeholder="Ex: 101"
                            value={codCursoId}
                            onChange={(e) => setCodCursoId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        {editingCodigo && (
                          <div className="sm:col-span-2 flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="codUsado"
                              checked={codUsado}
                              onChange={(e) => setCodUsado(e.target.checked)}
                              className="bg-slate-900 border border-slate-700 rounded text-blue-600 focus:ring-0 focus:ring-offset-0"
                            />
                            <label htmlFor="codUsado" className="text-xs text-slate-300">Marcar este cupom como já utilizado/resgatado</label>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {isLoading ? 'Salvando...' : 'Salvar Código'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddCodigo(false); setEditingCodigo(null); }}
                          className="px-4 py-2 bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3">ID</th>
                        <th className="pb-3">Código</th>
                        <th className="pb-3">Tipo</th>
                        <th className="pb-3">Validade (Dias)</th>
                        <th className="pb-3">Criado Por</th>
                        <th className="pb-3">Criado Em</th>
                        <th className="pb-3">Status de Uso</th>
                        <th className="pb-3 text-right">Ações</th>
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
                            <td className="py-4">
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
                            <td className="py-4 text-right">
                              <div className="flex justify-end space-x-1.5">
                                <button
                                  onClick={() => {
                                    setEditingCodigo(c);
                                    setCodCodigo(c.codigo);
                                    setCodTipo(c.tipo);
                                    setCodDiasValidade(String(c.diasValidade));
                                    setCodUsado(c.usado);
                                    setCodCursoId(c.cursoId ? String(c.cursoId) : '');
                                    setShowAddCodigo(false);
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-all"
                                  title="Editar Código"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#1877F2]" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCodigo(c.id)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-all"
                                  title="Excluir Código"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: TICKETS */}
              {operTab === 'tickets' && (
                <div className="space-y-6 text-left">
                  {(showAddTicket || editingTicket) && (
                    <form onSubmit={editingTicket ? handleUpdateTicket : handleCreateTicket} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 max-w-xl text-left animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-sm font-bold text-white">{editingTicket ? 'Responder / Atualizar Ticket' : 'Abrir Novo Ticket'}</h4>
                      
                      {editingTicket ? (
                        <div className="space-y-4">
                          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                            <p className="text-slate-400 font-bold">Assunto: <span className="text-white font-normal">{editingTicket.assunto}</span></p>
                            <p className="text-slate-400 font-bold mt-1">Mensagem do Aluno: <span className="text-white font-normal block mt-1 font-mono">{editingTicket.mensagem}</span></p>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                              <select
                                value={ticStatus}
                                onChange={(e) => setTicStatus(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="aberto">Aberto</option>
                                <option value="em_atendimento">Em Atendimento</option>
                                <option value="resolvido">Resolvido / Fechado</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">Prioridade</label>
                              <select
                                value={ticPrioridade}
                                onChange={(e) => setTicPrioridade(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="baixa">Baixa</option>
                                <option value="media">Média</option>
                                <option value="alta">Alta</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Escrever Resposta Oficial</label>
                            <textarea
                              required
                              rows={3}
                              placeholder="Digite a resposta que o aluno visualizará na Área do Aluno..."
                              value={ticRespostaMensagem}
                              onChange={(e) => setTicRespostaMensagem(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">ID Aluno (Opcional)</label>
                              <input
                                type="number"
                                placeholder="Ex: 3"
                                value={ticUsuarioId}
                                onChange={(e) => setTicUsuarioId(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">Nome do Aluno</label>
                              <input
                                type="text"
                                required
                                placeholder="Ex: Suporte Interno"
                                value={ticUsuarioNome}
                                onChange={(e) => setTicUsuarioNome(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Assunto</label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: Instabilidade no simulado do SED-SC"
                              value={ticAssunto}
                              onChange={(e) => setTicAssunto(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Mensagem Inicial</label>
                            <textarea
                              required
                              rows={3}
                              placeholder="Escreva a descrição do chamado..."
                              value={ticMensagem}
                              onChange={(e) => setTicMensagem(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                              <select
                                value={ticStatus}
                                onChange={(e) => setTicStatus(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="aberto">Aberto</option>
                                <option value="em_atendimento">Em Atendimento</option>
                                <option value="resolvido">Resolvido</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">Prioridade</label>
                              <select
                                value={ticPrioridade}
                                onChange={(e) => setTicPrioridade(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="baixa">Baixa</option>
                                <option value="media">Média</option>
                                <option value="alta">Alta</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {isLoading ? 'Salvando...' : 'Salvar Chamado'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddTicket(false); setEditingTicket(null); }}
                          className="px-4 py-2 bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-4">
                    {tickets
                      .filter((t) =>
                        t.assunto.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.usuarioNome.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((t) => (
                        <div key={t.id} className="p-5 bg-slate-800/40 border border-slate-850 rounded-2xl space-y-3">
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

                          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/50">
                            <button
                              onClick={() => {
                                setEditingTicket(t);
                                setTicStatus(t.status);
                                setTicPrioridade(t.prioridade);
                                setTicRespostaMensagem('');
                                setShowAddTicket(false);
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 flex items-center space-x-1 transition-all"
                            >
                              <Edit2 className="w-3 h-3 text-[#1877F2]" />
                              <span>Responder / Alterar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(t.id)}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-[10px] font-bold text-rose-400 flex items-center space-x-1 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
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
                <div className="space-y-6 text-left">
                  {showAddConfig && (
                    <form onSubmit={handleCreateConfig} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 max-w-xl text-left animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-sm font-bold text-white">Nova Configuração Global</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Chave/Identificador (Uppercase)</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: MAX_DAILY_CHAT_LIMIT"
                            value={cfgChave}
                            onChange={(e) => setCfgChave(e.target.value.toUpperCase())}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Valor da Configuração</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: 50"
                            value={cfgValor}
                            onChange={(e) => setCfgValor(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Categoria</label>
                          <select
                            value={cfgCategoria}
                            onChange={(e) => setCfgCategoria(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="geral">Geral</option>
                            <option value="limites">Limites IA</option>
                            <option value="suporte">Suporte</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Descrição</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Limite diário de prompts por usuário"
                            value={cfgDescricao}
                            onChange={(e) => setCfgDescricao(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {isLoading ? 'Salvando...' : 'Salvar Chave'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddConfig(false)}
                          className="px-4 py-2 bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3">Chave</th>
                        <th className="pb-3">Valor</th>
                        <th className="pb-3">Descrição</th>
                        <th className="pb-3">Última Atualização</th>
                        <th className="pb-3 text-right">Ações</th>
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
                                  type={
                                    c.chave.includes('KEY') ||
                                    c.chave.includes('TOKEN') ||
                                    c.chave.includes('SECRET') ||
                                    c.chave.includes('SENHA')
                                      ? 'password'
                                      : 'text'
                                  }
                                  value={editingConfigValue}
                                  onChange={(e) => setEditingConfigValue(e.target.value)}
                                  placeholder="Cole o novo valor para substituir..."
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono w-64"
                                />
                              ) : (
                                formatConfigDisplayValue(c.chave, c.valor)
                              )}
                            </td>
                            <td className="py-4 text-slate-400 text-[11px] max-w-xs">{c.descricao || 'N/A'}</td>
                            <td className="py-4 text-slate-500 font-mono text-[10px]">
                              {c.atualizadoPor || 'Admin'} em {new Date(c.atualizadoEm).toLocaleDateString()}
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex justify-end space-x-1.5 items-center">
                                {editingConfigChave === c.chave ? (
                                  <>
                                    <button
                                      onClick={() => handleUpdateConfigValue(c.chave)}
                                      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                      title="Salvar"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingConfigChave(null)}
                                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-350 border border-slate-700 rounded-lg text-xs"
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingConfigChave(c.chave);
                                        setEditingConfigValue(c.valor);
                                      }}
                                      className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
                                      title="Editar"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-[#1877F2]" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteConfig(c.chave)}
                                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-all"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 7: LEADS */}
              {operTab === 'leads' && (
                <div className="space-y-6 text-left">
                  {(showAddLead || editingLead) && (
                    <form onSubmit={editingLead ? handleUpdateLead : handleCreateLead} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 max-w-xl text-left animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-sm font-bold text-white">{editingLead ? 'Editar Lead' : 'Novo Lead'}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Nome Completo</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Jean RSL"
                            value={ldNome}
                            onChange={(e) => setLdNome(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">E-mail</label>
                          <input
                            type="email"
                            required
                            placeholder="Ex: contato@jean.com"
                            value={ldEmail}
                            onChange={(e) => setLdEmail(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Telefone / WhatsApp</label>
                          <input
                            type="text"
                            placeholder="Ex: (48) 99999-9999"
                            value={ldTelefone}
                            onChange={(e) => setLdTelefone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Origem do Cadastro</label>
                          <select
                            value={ldOrigem}
                            onChange={(e) => setLdOrigem(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="site_vendas">Site de Vendas</option>
                            <option value="checkout_incompleto">Checkout Abandonado</option>
                            <option value="whatsapp_chat">Atendimento WhatsApp</option>
                            <option value="manual">Manual / Planilha</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                          <select
                            value={ldStatus}
                            onChange={(e) => setLdStatus(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="novo">Novo Lead</option>
                            <option value="contatado">Contatado</option>
                            <option value="convertido">Convertido em Aluno</option>
                            <option value="perdido">Sem Interesse</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {isLoading ? 'Salvando...' : 'Salvar Lead'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddLead(false); setEditingLead(null); }}
                          className="px-4 py-2 bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3">ID</th>
                        <th className="pb-3">Nome</th>
                        <th className="pb-3">E-mail</th>
                        <th className="pb-3">Telefone</th>
                        <th className="pb-3">Origem</th>
                        <th className="pb-3">Criado Em</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Ações</th>
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
                            <td className="py-4">
                              <span className="bg-blue-600/20 text-blue-400 border border-blue-600/30 px-2 py-0.5 rounded font-semibold text-[9px] uppercase">
                                {l.status}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex justify-end space-x-1.5">
                                <button
                                  onClick={() => {
                                    setEditingLead(l);
                                    setLdNome(l.nome);
                                    setLdEmail(l.email);
                                    setLdTelefone(l.telefone || '');
                                    setLdOrigem(l.origem);
                                    setLdStatus(l.status);
                                    setShowAddLead(false);
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-all"
                                  title="Editar Lead"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#1877F2]" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLead(l.id)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-all"
                                  title="Excluir Lead"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 8: CAMPANHAS */}
              {operTab === 'campanhas' && (
                <div className="space-y-6 text-left">
                  {(showAddCampanha || editingCampanha) && (
                    <form onSubmit={editingCampanha ? handleUpdateCampanha : handleCreateCampanha} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 max-w-xl text-left animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-sm font-bold text-white">{editingCampanha ? 'Editar Campanha' : 'Nova Campanha'}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Nome da Campanha</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Black Friday 2026"
                            value={camNome}
                            onChange={(e) => setCamNome(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Override Produções Máximas diárias (Opcional)</label>
                          <input
                            type="number"
                            placeholder="Ex: 100"
                            value={camOverrideProducoesMax}
                            onChange={(e) => setCamOverrideProducoesMax(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Override Downloads Máximos diários (Opcional)</label>
                          <input
                            type="number"
                            placeholder="Ex: 50"
                            value={camOverrideDownloadsMax}
                            onChange={(e) => setCamOverrideDownloadsMax(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Data Início</label>
                          <input
                            type="date"
                            required
                            value={camDataInicio}
                            onChange={(e) => setCamDataInicio(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Data Fim</label>
                          <input
                            type="date"
                            required
                            value={camDataFim}
                            onChange={(e) => setCamDataFim(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="camAtiva"
                            checked={camAtiva}
                            onChange={(e) => setCamAtiva(e.target.checked)}
                            className="bg-slate-900 border border-slate-700 rounded text-blue-600 focus:ring-0 focus:ring-offset-0"
                          />
                          <label htmlFor="camAtiva" className="text-xs text-slate-300">Campanha Ativa</label>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {isLoading ? 'Salvando...' : 'Salvar Campanha'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddCampanha(false); setEditingCampanha(null); }}
                          className="px-4 py-2 bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3">ID</th>
                        <th className="pb-3">Nome da Campanha</th>
                        <th className="pb-3">Override Prod. Max</th>
                        <th className="pb-3">Override Down. Max</th>
                        <th className="pb-3">Início</th>
                        <th className="pb-3">Fim</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Ações</th>
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
                            <td className="py-4">
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
                            <td className="py-4 text-right">
                              <div className="flex justify-end space-x-1.5">
                                <button
                                  onClick={() => {
                                    setEditingCampanha(c);
                                    setCamNome(c.nome);
                                    setCamOverrideProducoesMax(c.overrideProducoesMax ? String(c.overrideProducoesMax) : '');
                                    setCamOverrideDownloadsMax(c.overrideDownloadsMax ? String(c.overrideDownloadsMax) : '');
                                    setCamDataInicio(c.dataInicio);
                                    setCamDataFim(c.dataFim);
                                    setCamAtiva(c.ativa);
                                    setShowAddCampanha(false);
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-all"
                                  title="Editar Campanha"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#1877F2]" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCampanha(c.id)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-all"
                                  title="Excluir Campanha"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        )}

        {/* SECTION 2: GESTÃO DE CONTEÚDO (RAG) */}
        {activeSection === 'conteudo' && (
          <div className="space-y-6">
            
            {/* Navigation Tabs for Content Management */}
            <div className="bg-slate-800/80 p-2 rounded-2xl border border-slate-700 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
              <button
                onClick={() => setContentTab('aulas')}
                className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                  contentTab === 'aulas' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span>1. Acervo & Apostilas (Google Drive)</span>
              </button>

              <button
                onClick={() => setContentTab('relatorios')}
                className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                  contentTab === 'relatorios' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>2. Desempenho do Acervo RAG</span>
              </button>
            </div>

            {/* Content Tabs Body */}
            <div className="bg-slate-850 rounded-3xl p-6 sm:p-8 border border-slate-800 min-h-[300px]">
              
              {/* TAB 1: CURSOS & AULAS (GOOGLE DRIVE HUB) */}
              {contentTab === 'aulas' && (
                <div className="space-y-6 w-full text-left">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                        <Cloud className="w-5 h-5 text-blue-500" />
                        <span>Gestão de Conteúdo via Google Drive</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        O Google Drive é a Fonte Única de Verdade. Todos os cursos, matérias, editais e apostilas são lidos diretamente das suas pastas do Drive.
                      </p>
                    </div>

                    <button
                      onClick={loadDriveFiles}
                      disabled={isLoadingDrive}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 disabled:opacity-50 shadow-md shadow-blue-500/10"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                      <span>Sincronizar com Google Drive</span>
                    </button>
                  </div>

                  {/* Shared Credentials Status */}
                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>Conexão com Google Drive Ativa</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 font-mono">
                        <p className="text-[10px] uppercase font-bold text-slate-500">ID da Pasta Raiz no Drive</p>
                        <p className="text-slate-300 break-all select-all font-semibold">
                          {driveStatus?.configured ? driveStatus.folderId : 'GOOGLE_DRIVE_FOLDER_ID não configurado (Configure em Painel Admin > Sistema)'}
                        </p>
                      </div>

                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 font-mono">
                        <p className="text-[10px] uppercase font-bold text-slate-500">E-mail de Serviço do Google Cloud</p>
                        <p className="text-slate-300 break-all select-all font-semibold">
                          {driveStatus?.configured ? driveStatus.serviceAccountEmail : 'GOOGLE_SERVICE_ACCOUNT_KEY não configurado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Drive Files List by Folders */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-white">Arquivos e Cursos Encontrados no Drive ({totalDrivePDFs} PDFs)</h4>
                      <span className="text-[11px] text-slate-400">Expanda a pasta e clique em <strong>⚡ Ingerir Todos os PDFs da Pasta</strong> para processamento em lote.</span>
                    </div>

                    {/* Real-time Batch Progress Card */}
                    {batchProgress && batchProgress.active && (
                      <div className="bg-slate-900 border-2 border-blue-500/80 p-5 rounded-2xl space-y-3 shadow-xl shadow-blue-500/10 animate-in fade-in slide-in-from-top-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl animate-spin">
                              <RotateCw className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                                <span>Ingestão em Lote RAG em Andamento</span>
                                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold rounded-md border border-blue-500/30">
                                  {Math.round((batchProgress.currentIndex / batchProgress.totalFiles) * 100)}%
                                </span>
                              </h4>
                              <p className="text-xs text-slate-300">
                                Pasta: <strong className="text-blue-400">{batchProgress.folderName}</strong>
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={handleCancelBatch}
                            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Interromper Ingestão</span>
                          </button>
                        </div>

                        {/* Progress Bar Track */}
                        <div className="space-y-1.5">
                          <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                            <div
                              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
                              style={{ width: `${(batchProgress.currentIndex / batchProgress.totalFiles) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                            <span>
                              Processando PDF <strong>{batchProgress.currentIndex}</strong> de <strong>{batchProgress.totalFiles}</strong>: <span className="text-slate-200 font-semibold">{batchProgress.currentFileName}</span>
                            </span>
                            <span className="text-emerald-400 font-bold">
                              {batchProgress.processedCount} Processados • {batchProgress.totalChunks} Chunks Gerados
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
                        <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Pastas no Drive</p>
                          <p className="text-lg font-extrabold text-white">{driveFolders.length}</p>
                        </div>
                      </div>

                      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
                        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">PDFs Encontrados</p>
                          <p className="text-lg font-extrabold text-white">{totalDrivePDFs}</p>
                        </div>
                      </div>

                      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Indexados no RAG</p>
                          <p className="text-lg font-extrabold text-emerald-400">{totalIngestedPDFs} / {totalDrivePDFs}</p>
                        </div>
                      </div>
                    </div>

                    {/* Drive Search Bar */}
                    <div className="relative mb-4">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="🔍 Buscar por Curso, Cargo ou Disciplina no Google Drive..."
                        value={driveSearchQuery}
                        onChange={(e) => setDriveSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                      />
                      {driveSearchQuery && (
                        <button
                          onClick={() => setDriveSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white"
                        >
                          ✕ Limpar
                        </button>
                      )}
                    </div>

                    {isLoadingDrive ? (
                      <div className="bg-slate-800/20 py-12 rounded-3xl border border-slate-800 text-center text-xs text-slate-500 animate-pulse">
                        Sincronizando conteúdos e organizando pastas do Google Drive...
                      </div>
                    ) : driveFolders.length === 0 ? (
                      <div className="bg-slate-800/20 py-12 rounded-3xl border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                        <p className="font-bold text-slate-300">Nenhum arquivo PDF encontrado no Google Drive.</p>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          Coloque arquivos PDF na sua pasta compartilhada do Drive organizada por Cargos/Cursos e clique em <strong>Sincronizar com Google Drive</strong> acima.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {driveFolders
                          .filter((folder) => {
                            if (!driveSearchQuery.trim()) return true;
                            const q = driveSearchQuery.toLowerCase().trim();
                            return folder.name.toLowerCase().includes(q) || (folder.files && folder.files.some((f: any) => f.name.toLowerCase().includes(q)));
                          })
                          .map((folder) => {
                          const isOpen = !!openFolders[folder.id];
                          const isBatching = batchIngestingFolderId === folder.id;
                          const allIngested = folder.ingestedFiles === folder.totalFiles && folder.totalFiles > 0;

                          return (
                            <div key={folder.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden transition-all shadow-md">
                              {/* Folder Header Bar */}
                              <div
                                className="p-4 bg-slate-800/80 hover:bg-slate-800 flex items-center justify-between flex-wrap gap-3 cursor-pointer select-none"
                                onClick={() => toggleFolder(folder.id)}
                              >
                                <div className="flex items-center space-x-3">
                                  <button className="text-slate-400 hover:text-white p-1">
                                    {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                  </button>
                                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                    {isOpen ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-bold text-white flex items-center space-x-2">
                                      <span>{folder.name}</span>
                                      {allIngested ? (
                                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold rounded-full border border-emerald-500/30">
                                          ✅ 100% Ingerido ({folder.totalFiles} PDFs)
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold rounded-full border border-amber-500/30">
                                          {folder.ingestedFiles}/{folder.totalFiles} No RAG
                                        </span>
                                      )}
                                    </h5>
                                    <p className="text-[11px] text-slate-400">
                                      {folder.totalFiles} arquivos PDF nesta pasta • {folder.ingestedFiles} indexados no RAG
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                                  {/* Mass Category Selector for Folder */}
                                  <div className="flex items-center space-x-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700">
                                    <span className="text-[11px] font-extrabold text-amber-400">🏷️ Categoria da Pasta:</span>
                                    <select
                                      value={folderCategories[folder.id] || ''}
                                      onChange={(e) => handleSetFolderCategoryMassive(folder, e.target.value)}
                                      className="bg-slate-900 text-blue-300 font-bold text-xs outline-none cursor-pointer hover:text-blue-200"
                                    >
                                      <option value="" className="bg-slate-900 text-slate-400">-- Selecionar Categoria para Todos os PDFs --</option>
                                      {getActiveCategories().map(cat => (
                                        <option key={cat.id} value={cat.nome} className="bg-slate-900 text-white">
                                          {cat.nome}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Dual Action Buttons: Ingerir Pendentes vs Re-ingerir Tudo */}
                                  <div className="flex items-center space-x-2">
                                    {/* Button 1: Ingerir Pendentes */}
                                    <button
                                      onClick={() => handleImportFolderPDFs(folder, true)}
                                      disabled={isLoading || isBatching || folder.totalFiles === 0 || folder.ingestedFiles >= folder.totalFiles}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1.5 ${
                                        isBatching
                                          ? 'bg-blue-900 border-blue-700 text-blue-300 animate-pulse'
                                          : folder.ingestedFiles < folder.totalFiles
                                          ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                                          : 'bg-slate-800/60 border-slate-700 text-slate-400 opacity-60 cursor-not-allowed'
                                      }`}
                                      title={folder.ingestedFiles >= folder.totalFiles ? 'Todos os PDFs desta pasta já foram ingeridos' : 'Ingerir apenas os PDFs pendentes'}
                                    >
                                      {isBatching ? (
                                        <>
                                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                          <span>Ingerindo...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3.5 h-3.5" />
                                          <span>
                                            {folder.ingestedFiles >= folder.totalFiles
                                              ? '✓ Todos Ingeridos'
                                              : `⚡ Ingerir Pendentes (${folder.totalFiles - folder.ingestedFiles})`}
                                          </span>
                                        </>
                                      )}
                                    </button>

                                    {/* Button 2: Re-ingerir Tudo */}
                                    <button
                                      onClick={() => handleImportFolderPDFs(folder, false)}
                                      disabled={isLoading || isBatching || folder.totalFiles === 0}
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1.5"
                                      title="Forçar a re-ingestão de todos os arquivos desta pasta"
                                    >
                                      <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Re-ingerir Tudo</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Folder Items Table */}
                              {isOpen && (
                                <div className="border-t border-slate-800 bg-slate-950/40">
                                  {folder.files.length === 0 ? (
                                    <p className="p-4 text-center text-xs text-slate-500">Nenhum PDF nesta pasta.</p>
                                  ) : (
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                          <th className="p-3 pl-6">PDF</th>
                                          <th className="p-3">🏷️ Categoria no Aluno</th>
                                          <th className="p-3">Modificado</th>
                                          <th className="p-3">Tamanho</th>
                                          <th className="p-3">Status RAG</th>
                                          <th className="p-3 text-right pr-6">Ação</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {folder.files.map((f: any) => {
                                          const isThisIngesting = ingesterId === f.id && isLoading;
                                          const currentCat = fileCategories[f.id] || folderCategories[folder.id] || detectCategoryForFolder(f.name || folder.name);
                                          return (
                                            <tr key={f.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                                              <td className="p-3 pl-6 font-bold text-slate-200 flex items-center space-x-2">
                                                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                                <span>{f.name}</span>
                                              </td>
                                              <td className="p-3 font-semibold text-slate-300">
                                                <select
                                                  value={currentCat}
                                                  onChange={(e) => handleSetFileCategory(f.id, e.target.value)}
                                                  className="bg-slate-900 border border-slate-700 text-blue-400 font-bold text-[11px] rounded-lg px-2.5 py-1 outline-none cursor-pointer shadow-xs hover:border-blue-500 transition-all"
                                                >
                                                  <option value="" className="bg-slate-900 text-slate-400 font-sans">-- Selecionar Categoria --</option>
                                                  {getActiveCategories().map(cat => (
                                                    <option key={cat.id} value={cat.nome} className="bg-slate-900 text-white font-sans">
                                                      {cat.nome}
                                                    </option>
                                                  ))}
                                                </select>
                                              </td>
                                              <td className="p-3 text-slate-400 font-mono text-[11px]">
                                                {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString('pt-BR') : 'N/A'}
                                              </td>
                                              <td className="p-3 text-slate-500 font-mono text-[11px]">
                                                {f.size ? `${(Number(f.size) / (1024 * 1024)).toFixed(2)} MB` : 'PDF'}
                                              </td>
                                              <td className="p-3">
                                                {f.ingested ? (
                                                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>Ingerido ({f.chunksCount} Chunks)</span>
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-[10px] font-semibold">
                                                    <span>⚪ Pendente</span>
                                                  </span>
                                                )}
                                              </td>
                                              <td className="p-3 text-right pr-6">
                                                <button
                                                  onClick={() => handleImportDrivePDF(f.id, f.name, folder.name)}
                                                  disabled={isLoading}
                                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                                    isThisIngesting
                                                      ? 'bg-blue-900 border-blue-800 text-blue-300 animate-pulse'
                                                      : f.ingested
                                                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                                                      : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white shadow-xs'
                                                  }`}
                                                >
                                                  {isThisIngesting ? 'Ingerindo...' : f.ingested ? '🔄 Re-ingerir' : '⚡ Ingerir no RAG'}
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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
