import { CotasState, ProducaoResultado, FeatureId, AnotacaoItem } from '../types';

export async function fetchCotas(): Promise<CotasState> {
  try {
    const res = await fetch('/api/cotas');
    if (!res.ok) throw new Error('Falha ao carregar cotas');
    return await res.json();
  } catch (err) {
    console.warn('API /api/cotas error, using local fallback state');
    return {
      producoesUsadas: 2,
      producoesMax: 5,
      downloadsUsados: 1,
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
    const res = await fetch('/api/cotas/download', { method: 'POST' });
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
  const res = await fetch('/api/estudio/executar', {
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
    trechos: data.trechos || [],
    origem: data.origem || 'oficial',
    dominiosExt: data.dominiosExt || [],
    criadoEm: new Date().toLocaleDateString('pt-BR'),
  };
}

export async function fetchMatriculas(): Promise<any[]> {
  const res = await fetch('/api/matriculas', { headers: { 'x-user-role': 'admin' } });
  const data = await res.json();
  return data.matriculas || [];
}

export async function updateMatriculaStatus(id: number, status: string): Promise<any> {
  const res = await fetch('/api/matriculas/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
    body: JSON.stringify({ id, status }),
  });
  return await res.json();
}

export async function fetchPagamentos(): Promise<any[]> {
  const res = await fetch('/api/pagamentos', { headers: { 'x-user-role': 'admin' } });
  const data = await res.json();
  return data.pagamentos || [];
}

export async function fetchCodigosAcesso(): Promise<any[]> {
  const res = await fetch('/api/codigos-acesso', { headers: { 'x-user-role': 'admin' } });
  const data = await res.json();
  return data.codigos || [];
}

export async function fetchTickets(): Promise<any[]> {
  const res = await fetch('/api/tickets', { headers: { 'x-user-role': 'admin' } });
  const data = await res.json();
  return data.tickets || [];
}

export async function fetchLogsAuditoria(): Promise<any[]> {
  const res = await fetch('/api/logs-auditoria', { headers: { 'x-user-role': 'admin' } });
  const data = await res.json();
  return data.logs || [];
}

export async function fetchConfiguracoes(): Promise<any[]> {
  const res = await fetch('/api/configuracoes', { headers: { 'x-user-role': 'admin' } });
  const data = await res.json();
  return data.configuracoes || [];
}

export async function updateConfiguracaoValue(chave: string, valor: string): Promise<any> {
  const res = await fetch('/api/configuracoes/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
    body: JSON.stringify({ chave, valor }),
  });
  return await res.json();
}

export async function fetchLeads(): Promise<any[]> {
  const res = await fetch('/api/leads', { headers: { 'x-user-role': 'admin' } });
  const data = await res.json();
  return data.leads || [];
}

export async function fetchCampanhasCota(): Promise<any[]> {
  const res = await fetch('/api/campanhas-cota', { headers: { 'x-user-role': 'admin' } });
  const data = await res.json();
  return data.campanhas || [];
}

export async function addOfficialSource(source: { titulo: string; tipo: string; materia: string; banca: string; ano?: number; tamanho?: string }): Promise<any> {
  const res = await fetch('/api/admin/sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
    body: JSON.stringify(source),
  });
  return await res.json();
}

export async function addQuestion(question: { banca?: string; materia?: string; assunto?: string; enunciado: string; alternativas: string[]; gabaritoIndex: number; comentario?: string }): Promise<any> {
  const res = await fetch('/api/admin/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
    body: JSON.stringify(question),
  });
  return await res.json();
}

export async function fetchSourcesIndexStatus(): Promise<Record<number, number>> {
  const res = await fetch('/api/admin/sources/status', { headers: { 'x-user-role': 'admin' } });
  const data = await res.json();
  return data.counts || {};
}

export async function ingestDocumentSource(sourceId: number): Promise<any> {
  const res = await fetch('/api/admin/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
    body: JSON.stringify({ sourceId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro na ingestão do PDF');
  }
  return data;
}

