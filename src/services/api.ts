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
    conteudo: data.resultText,
    trechos: data.trechos || [],
    origem: data.origem || 'oficial',
    dominiosExt: data.dominiosExt || [],
    criadoEm: new Date().toLocaleDateString('pt-BR'),
  };
}
