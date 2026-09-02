import { CotasState, ProducaoResultado, FeatureId, AnotacaoItem, User } from '../types';

// Todas as chamadas usam cookies de sessão (httpOnly) — nunca um header de papel
// controlado pelo próprio cliente.
function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...options, credentials: 'include' });
}

// --- Autenticação ---
export async function login(usuario: string, senha: string): Promise<{ success: boolean; user?: User; error?: string; bloqueado?: boolean; tempoRestanteMinutos?: number }> {
  const res = await authFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: data.error, bloqueado: data.bloqueado, tempoRestanteMinutos: data.tempoRestanteMinutos };
  }
  return { success: true, user: data.user };
}

export async function logout(): Promise<void> {
  try {
    await authFetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    // best-effort
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await authFetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch (e) {
    return null;
  }
}

export async function fetchCotas(): Promise<CotasState> {
  try {
    const res = await authFetch('/api/cotas');
    if (!res.ok) throw new Error('Falha ao carregar cotas');
    return await res.json();
  } catch (err) {
    console.warn('API /api/cotas error, using local fallback state');
    return {
      producoesUsadas: 0,
      producoesMax: 5,
      downloadsUsados: 0,
      downloadsMax: 5,
      resetTime: '00:00',
    };
  }
}

export async function fetchSources(): Promise<any[]> {
  try {
    const res = await fetch('/api/sources');
    const data = await res.json();
    return data.sources || [];
  } catch (err) {
    console.error('Error fetching sources, returning empty fallback', err);
    return [];
  }
}

export async function fetchQuestions(): Promise<any[]> {
  try {
    const res = await fetch('/api/questions');
    const data = await res.json();
    return data.questions || [];
  } catch (err) {
    console.error('Error fetching questions, returning empty fallback', err);
    return [];
  }
}

export async function registerDownload(): Promise<{ success: boolean; cotas?: CotasState; error?: string }> {
  try {
    const res = await authFetch('/api/cotas/download', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Erro no registro de download' };
    }
    return { success: true, cotas: data.cotas };
  } catch (err: any) {
    return { success: true }; // allow local download preview
  }
}

export async function executeEstudioFeature(params: {
  featureId: FeatureId;
  userPrompt: string;
  selectedSourceIds: number[];
  isRetaFinal: boolean;
}): Promise<ProducaoResultado> {
  const res = await authFetch('/api/estudio/executar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao comunicar com o servidor do estúdio');
  }

  return {
    id: Date.now(),
    featureId: params.featureId,
    titulo: `Produção: ${params.featureId}`,
    conteudo: data.conteudo !== undefined ? data.conteudo : data.resultText,
    resultText: data.resultText,
    trechos: data.trechos || [],
    origem: data.origem || 'oficial',
    dominiosExt: data.dominiosExt || [],
    criadoEm: new Date().toLocaleDateString('pt-BR'),
  };
}

// Anotações do aluno (persistidas no cadastro do usuário, não só no navegador)
export async function fetchAnotacoes(): Promise<any[]> {
  try {
    const res = await authFetch('/api/anotacoes');
    if (!res.ok) return [];
    const data = await res.json();
    return data.anotacoes || [];
  } catch (err) {
    return [];
  }
}

export async function createAnotacao(note: {
  producaoId?: number;
  titulo: string;
  featureId: string;
  materia?: string;
  conteudoResumido: string;
  origem: string;
}): Promise<any> {
  const res = await authFetch('/api/anotacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  return await res.json();
}

export async function deleteAnotacao(id: number): Promise<any> {
  const res = await authFetch(`/api/anotacoes/${id}`, { method: 'DELETE' });
  return await res.json();
}

export async function fetchMatriculas(): Promise<any[]> {
  const res = await authFetch('/api/matriculas');
  const data = await res.json();
  return data.matriculas || [];
}

export async function updateMatriculaStatus(id: number, status: string): Promise<any> {
  const res = await authFetch('/api/matriculas/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
  return await res.json();
}

export async function fetchPagamentos(): Promise<any[]> {
  const res = await authFetch('/api/pagamentos');
  const data = await res.json();
  return data.pagamentos || [];
}

export async function fetchCodigosAcesso(): Promise<any[]> {
  const res = await authFetch('/api/codigos-acesso');
  const data = await res.json();
  return data.codigos || [];
}

export async function fetchTickets(): Promise<any[]> {
  const res = await authFetch('/api/tickets');
  const data = await res.json();
  return data.tickets || [];
}

export async function fetchLogsAuditoria(): Promise<any[]> {
  const res = await authFetch('/api/logs-auditoria');
  const data = await res.json();
  return data.logs || [];
}

export async function fetchConfiguracoes(): Promise<any[]> {
  const res = await authFetch('/api/configuracoes');
  const data = await res.json();
  return data.configuracoes || [];
}

export async function updateConfiguracaoValue(chave: string, valor: string): Promise<any> {
  const res = await authFetch('/api/configuracoes/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chave, valor }),
  });
  return await res.json();
}

export async function fetchLeads(): Promise<any[]> {
  const res = await authFetch('/api/leads');
  const data = await res.json();
  return data.leads || [];
}

export async function fetchCampanhasCota(): Promise<any[]> {
  const res = await authFetch('/api/campanhas-cota');
  const data = await res.json();
  return data.campanhas || [];
}

export async function addOfficialSource(source: { titulo: string; tipo: string; materia: string; banca: string; ano?: number; tamanho?: string; selecionada?: boolean }): Promise<any> {
  const res = await authFetch('/api/admin/sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(source),
  });
  return await res.json();
}

export async function addQuestion(question: { banca?: string; materia?: string; assunto?: string; enunciado: string; alternativas: string[]; gabaritoIndex: number; comentario?: string }): Promise<any> {
  const res = await authFetch('/api/admin/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question),
  });
  return await res.json();
}

export async function fetchSourcesIndexStatus(): Promise<Record<number, number>> {
  const res = await authFetch('/api/admin/sources/status');
  const data = await res.json();
  return data.counts || {};
}

export async function ingestDocumentSource(sourceId: number): Promise<any> {
  const res = await authFetch('/api/admin/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro na ingestão do PDF');
  }
  return data;
}

// Matrículas CRUD
export async function createMatricula(matricula: any): Promise<any> {
  const res = await authFetch('/api/admin/matriculas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(matricula),
  });
  return await res.json();
}

export async function updateMatricula(id: number, matricula: any): Promise<any> {
  const res = await authFetch(`/api/admin/matriculas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(matricula),
  });
  return await res.json();
}

export async function deleteMatricula(id: number): Promise<any> {
  const res = await authFetch(`/api/admin/matriculas/${id}`, { method: 'DELETE' });
  return await res.json();
}

// Pagamentos CRUD
export async function createPagamento(pagamento: any): Promise<any> {
  const res = await authFetch('/api/admin/pagamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pagamento),
  });
  return await res.json();
}

export async function updatePagamento(id: number, pagamento: any): Promise<any> {
  const res = await authFetch(`/api/admin/pagamentos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pagamento),
  });
  return await res.json();
}

export async function deletePagamento(id: number): Promise<any> {
  const res = await authFetch(`/api/admin/pagamentos/${id}`, { method: 'DELETE' });
  return await res.json();
}

// Códigos de Acesso CRUD
export async function createCodigoAcesso(codigo: any): Promise<any> {
  const res = await authFetch('/api/admin/codigos-acesso', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(codigo),
  });
  return await res.json();
}

export async function updateCodigoAcesso(id: number, codigo: any): Promise<any> {
  const res = await authFetch(`/api/admin/codigos-acesso/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(codigo),
  });
  return await res.json();
}

export async function deleteCodigoAcesso(id: number): Promise<any> {
  const res = await authFetch(`/api/admin/codigos-acesso/${id}`, { method: 'DELETE' });
  return await res.json();
}

// Tickets CRUD
export async function createTicket(ticket: any): Promise<any> {
  const res = await authFetch('/api/admin/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket),
  });
  return await res.json();
}

export async function updateTicket(id: number, ticket: any): Promise<any> {
  const res = await authFetch(`/api/admin/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket),
  });
  return await res.json();
}

export async function deleteTicket(id: number): Promise<any> {
  const res = await authFetch(`/api/admin/tickets/${id}`, { method: 'DELETE' });
  return await res.json();
}

// Configurações CRUD (Create and Delete, Update already exists)
export async function createConfiguracao(config: any): Promise<any> {
  const res = await authFetch('/api/admin/configuracoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return await res.json();
}

export async function deleteConfiguracao(chave: string): Promise<any> {
  const res = await authFetch(`/api/admin/configuracoes/${chave}`, { method: 'DELETE' });
  return await res.json();
}

// Leads CRUD
export async function createLead(lead: any): Promise<any> {
  const res = await authFetch('/api/admin/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  return await res.json();
}

export async function updateLead(id: number, lead: any): Promise<any> {
  const res = await authFetch(`/api/admin/leads/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  return await res.json();
}

export async function deleteLead(id: number): Promise<any> {
  const res = await authFetch(`/api/admin/leads/${id}`, { method: 'DELETE' });
  return await res.json();
}

// Campanhas de Cota CRUD
export async function createCampanhaCota(campanha: any): Promise<any> {
  const res = await authFetch('/api/admin/campanhas-cota', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campanha),
  });
  return await res.json();
}

export async function updateCampanhaCota(id: number, campanha: any): Promise<any> {
  const res = await authFetch(`/api/admin/campanhas-cota/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campanha),
  });
  return await res.json();
}

export async function deleteCampanhaCota(id: number): Promise<any> {
  const res = await authFetch(`/api/admin/campanhas-cota/${id}`, { method: 'DELETE' });
  return await res.json();
}

// Sources CRUD updates/deletes
export async function updateOfficialSource(id: number, source: any): Promise<any> {
  const res = await authFetch(`/api/admin/sources/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(source),
  });
  return await res.json();
}

export async function deleteOfficialSource(id: number): Promise<any> {
  const res = await authFetch(`/api/admin/sources/${id}`, { method: 'DELETE' });
  return await res.json();
}

// Questions CRUD updates/deletes
export async function updateQuestion(id: number, question: any): Promise<any> {
  const res = await authFetch(`/api/admin/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question),
  });
  return await res.json();
}

export async function deleteQuestion(id: number): Promise<any> {
  const res = await authFetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
  return await res.json();
}

// Google Drive Sync API calls
export async function fetchDriveStatus(): Promise<{ configured: boolean; folderId: string; serviceAccountEmail: string }> {
  const res = await authFetch('/api/admin/drive/status');
  return await res.json();
}

export async function fetchDriveFiles(): Promise<{ folders: any[]; totalPDFs: number; totalIngestedPDFs: number; files?: any[] }> {
  const res = await authFetch('/api/admin/drive/files');
  return await res.json();
}

export async function importDriveFile(fileId: string, sourceId: number): Promise<any> {
  const res = await authFetch('/api/admin/drive/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, sourceId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao importar arquivo do Drive');
  }
  return data;
}

export async function importDriveFolder(folderName: string, files: any[]): Promise<any> {
  const res = await authFetch('/api/admin/drive/import-folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderName, files }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao importar pasta em lote');
  }
  return data;
}

export async function generateAutoSubcategories(categoriaNome?: string): Promise<any> {
  const res = await authFetch('/api/admin/sources/auto-subcategories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoriaNome }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao gerar subcategorias com IA');
  }
  return data;
}

export async function fetchCursosMaterias(): Promise<{ cursos: any[] }> {
  try {
    const res = await fetch('/api/cursos-materias');
    if (!res.ok) throw new Error('Falha ao carregar cursos e matérias');
    return await res.json();
  } catch (err) {
    console.warn('Erro ao carregar cursos-materias da API, usando fallback:', err);
    return { cursos: [] };
  }
}

export async function saveCursosMaterias(cursos: any[]): Promise<any> {
  const res = await authFetch('/api/admin/cursos-materias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cursos }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao salvar cursos e matérias');
  }
  return data;
}

export async function importDrivePending(folderName: string, files: any[]): Promise<any> {
  const res = await authFetch('/api/admin/drive/import-pending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderName, files }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao importar arquivos pendentes');
  }
  return data;
}
