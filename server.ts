import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import {
  OFFICIAL_SOURCES,
  MOCK_QUESTIONS,
  WHITELIST_DOMAINS,
  TEST_USERS,
  MOCK_MATRICULAS,
  MOCK_PAGAMENTOS,
  MOCK_CODIGOS_ACESSO,
  MOCK_TICKETS,
  MOCK_LOGS_AUDITORIA,
  MOCK_CONFIGURACOES,
  MOCK_LEADS,
  MOCK_CAMPANHAS_COTA,
  validarPoliticaSenha,
  verificarTentativasLogin,
  registrarTentativaLoginFalha,
  resetarTentativasLogin,
} from './src/data/mockDatabase.js';

import pg from 'pg';
const { Client } = pg;

let pdfParser: any = null;
async function getPdfParser() {
  if (!pdfParser) {
    const mod = await import('pdf-parse');
    pdfParser = mod.default || mod;
  }
  return pdfParser;
}

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set. Falling back to intelligent local synthesis.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory quota store for session
let userQuotas = {
  producoesUsadas: 2,
  producoesMax: 5,
  downloadsUsados: 1,
  downloadsMax: 5,
  data: new Date().toISOString().split('T')[0],
};

function resetQuotaIfNewDay() {
  const today = new Date().toISOString().split('T')[0];
  if (userQuotas.data !== today) {
    userQuotas = {
      producoesUsadas: 0,
      producoesMax: 5,
      downloadsUsados: 0,
      downloadsMax: 5,
      data: today,
    };
  }
}

// Helper: pg Client Connection for Neon
async function getPgClient(): Promise<pg.Client | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  try {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id SERIAL PRIMARY KEY,
        document_name VARCHAR(255) NOT NULL,
        source_id INT NOT NULL,
        chunk_index INT NOT NULL,
        content TEXT NOT NULL,
        embedding vector(768),
        imagens_associadas TEXT[] DEFAULT '{}',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    return client;
  } catch (err) {
    console.error('Failed to connect to Neon PostgreSQL database. Falling back to local storage.', err);
    return null;
  }
}

// Helper: Cosine Similarity for Vector Math
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper: Gemini Embedding generator
async function getEmbedding(ai: GoogleGenAI | null, text: string): Promise<number[]> {
  if (!ai) {
    const vec = new Array(768).fill(0).map((_, i) => Math.sin(i + text.length));
    return vec;
  }
  try {
    const res: any = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });
    const vals = res.embedding?.values || res.embeddings?.values || res.embedding || res.embeddings;
    if (Array.isArray(vals)) {
      return vals;
    }
  } catch (err) {
    console.error('Error generating embedding', err);
  }
  return new Array(768).fill(0).map((_, i) => Math.sin(i + text.length));
}

// Data structures for indexing
interface DocumentChunk {
  id: number;
  document_name: string;
  source_id: number;
  chunk_index: number;
  content: string;
  embedding: number[];
  imagens_associadas: string[];
  criado_em: string;
}

// Helper: Query Vector database (Neon pgvector or local JSON file)
async function queryVectorDatabase(ai: GoogleGenAI | null, queryText: string, sourceIds: number[], limit: number = 4): Promise<DocumentChunk[]> {
  const queryEmbedding = await getEmbedding(ai, queryText);
  
  const pgClient = await getPgClient();
  if (pgClient) {
    try {
      const embeddingStr = `[${queryEmbedding.join(',')}]`;
      const queryStr = `
        SELECT id, document_name, source_id, chunk_index, content, embedding::double precision[] as embedding, imagens_associadas, criado_em
        FROM document_chunks
        WHERE source_id = ANY($1)
        ORDER BY embedding <=> $2
        LIMIT $3;
      `;
      const res = await pgClient.query(queryStr, [sourceIds, embeddingStr, limit]);
      await pgClient.end();
      return res.rows.map(row => ({
        id: row.id,
        document_name: row.document_name,
        source_id: row.source_id,
        chunk_index: row.chunk_index,
        content: row.content,
        embedding: row.embedding,
        imagens_associadas: row.imagens_associadas || [],
        criado_em: row.criado_em.toISOString(),
      }));
    } catch (err) {
      console.error('Neon vector query failed. Falling back to local JSON query.', err);
      try { await pgClient.end(); } catch (_) {}
    }
  }

  // Fallback local JSON query
  const localDbPath = path.join(process.cwd(), 'storage', 'db_local.json');
  let chunks: DocumentChunk[] = [];
  try {
    if (fs.existsSync(localDbPath)) {
      const data = fs.readFileSync(localDbPath, 'utf-8');
      chunks = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading local JSON database', err);
  }

  const filteredChunks = chunks.filter(c => sourceIds.includes(c.source_id));
  const pool = filteredChunks.length > 0 ? filteredChunks : chunks;

  const scored = pool.map(c => ({
    chunk: c,
    score: cosineSimilarity(queryEmbedding, c.embedding)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.chunk);
}

// Helper: Index PDF and generate Embeddings
async function ingestPDF(ai: GoogleGenAI | null, pdfPath: string, sourceId: number, documentName: string): Promise<number> {
  const dataBuffer = fs.readFileSync(pdfPath);
  const pdf = await getPdfParser();
  const parsedPdf = await pdf(dataBuffer);
  const text = parsedPdf.text;

  const chunkSize = 800;
  const overlap = 200;
  const chunks: string[] = [];
  
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + chunkSize).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }
    i += (chunkSize - overlap);
  }

  const pgClient = await getPgClient();
  const createdChunks: DocumentChunk[] = [];

  for (let idx = 0; idx < chunks.length; idx++) {
    const content = chunks[idx];
    const embedding = await getEmbedding(ai, content);
    const chunk_index = idx + 1;
    const imagens_associadas: string[] = [];

    if (pgClient) {
      try {
        await pgClient.query(`
          INSERT INTO document_chunks (document_name, source_id, chunk_index, content, embedding, imagens_associadas)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [documentName, sourceId, chunk_index, content, `[${embedding.join(',')}]`, imagens_associadas]);
      } catch (err) {
        console.error(`Neon insert failed for chunk ${idx}`, err);
      }
    }

    createdChunks.push({
      id: Date.now() + idx,
      document_name: documentName,
      source_id: sourceId,
      chunk_index,
      content,
      embedding,
      imagens_associadas,
      criado_em: new Date().toISOString()
    });
  }

  if (pgClient) {
    await pgClient.end();
  }

  const localDbPath = path.join(process.cwd(), 'storage', 'db_local.json');
  let existingChunks: DocumentChunk[] = [];
  if (fs.existsSync(localDbPath)) {
    try {
      existingChunks = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
    } catch (_) {}
  }
  existingChunks = existingChunks.filter(c => c.source_id !== sourceId);
  existingChunks.push(...createdChunks);

  fs.writeFileSync(localDbPath, JSON.stringify(existingChunks, null, 2), 'utf-8');
  return chunks.length;
}

// Helper: Find local questions based on keywords
function findLocalQuestions(prompt: string, sourceIds: number[]): any[] {
  const query = prompt.toLowerCase();
  const keywords = query.split(/\s+/).filter(w => w.length > 3);
  
  return MOCK_QUESTIONS.filter(q => {
    const bodyMatch = q.enunciado.toLowerCase().includes(query) || 
                      q.assunto.toLowerCase().includes(query) ||
                      q.materia.toLowerCase().includes(query);
    if (bodyMatch) return true;
    
    const matches = keywords.filter(kw => q.enunciado.toLowerCase().includes(kw) || q.assunto.toLowerCase().includes(kw));
    return matches.length >= 2;
  });
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'JPSchool Backend Engine' });
});

app.get('/api/cotas', (req, res) => {
  resetQuotaIfNewDay();
  res.json(userQuotas);
});

app.post('/api/cotas/download', (req, res) => {
  resetQuotaIfNewDay();
  if (userQuotas.downloadsUsados >= userQuotas.downloadsMax) {
    return res.status(429).json({
      error: 'Cota diária de downloads esgotada (5/5). Tente novamente amanhã às 00:00.',
    });
  }
  userQuotas.downloadsUsados += 1;
  res.json({ success: true, cotas: userQuotas });
});

// Admin Document Ingest Route (Google Drive Local)
app.post('/api/admin/ingest', requireAuth(['super_admin', 'admin', 'ti']), async (req: any, res: any) => {
  const { sourceId } = req.body;
  if (!sourceId) {
    return res.status(400).json({ error: 'sourceId é obrigatório' });
  }

  const source = OFFICIAL_SOURCES.find(s => s.id === Number(sourceId));
  if (!source) {
    return res.status(404).json({ error: 'Fonte de estudos não encontrada' });
  }

  const storageDir = path.join(process.cwd(), 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const files = fs.readdirSync(storageDir);
  const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf') && (
    f.toLowerCase().includes(source.titulo.toLowerCase().substring(0, 10)) ||
    f.toLowerCase().includes(String(sourceId)) ||
    files.length === 1
  ));

  if (!pdfFile) {
    return res.status(404).json({
      error: `Nenhum arquivo PDF correspondente encontrado na pasta 'storage/'. Por favor, coloque um arquivo PDF com o ID '${sourceId}' ou contendo '${source.titulo.substring(0, 10)}' no nome.`
    });
  }

  try {
    const ai = getGeminiClient();
    const pdfPath = path.join(storageDir, pdfFile);
    const totalChunks = await ingestPDF(ai, pdfPath, source.id, pdfFile);
    res.json({
      success: true,
      message: `Documento '${pdfFile}' processado com sucesso!`,
      details: {
        sourceId: source.id,
        documento: pdfFile,
        chunksIndexados: totalChunks
      }
    });
  } catch (err: any) {
    console.error('Ingestion failed', err);
    res.status(500).json({ error: 'Falha durante a ingestão do PDF', details: err.message });
  }
});

// Main Studio Execution Endpoint (Vector RAG + Hybrid Questions)
app.post('/api/estudio/executar', async (req: any, res: any) => {
  try {
    resetQuotaIfNewDay();
    const { featureId, userPrompt, selectedSourceIds, isRetaFinal } = req.body;

    if (userQuotas.producoesUsadas >= userQuotas.producoesMax) {
      return res.status(429).json({
        error: 'Cota diária de produções esgotada (5/5). Você atingiu o limite diário anti-pirataria do plano aluno. Renova às 00:00.',
      });
    }

    const selectedSources = OFFICIAL_SOURCES.filter((s) =>
      selectedSourceIds?.includes(s.id)
    );

    const ai = getGeminiClient();

    let contextText = '';
    let referencedImages: string[] = [];
    if (selectedSourceIds && selectedSourceIds.length > 0) {
      try {
        const matchingChunks = await queryVectorDatabase(ai, userPrompt || '', selectedSourceIds.map(Number), 4);
        if (matchingChunks.length > 0) {
          contextText = matchingChunks.map(c => `[Trecho da fonte: ${c.document_name}, Índice Chunk: ${c.chunk_index}]\n${c.content}`).join('\n\n');
          matchingChunks.forEach(c => {
            if (c.imagens_associadas && c.imagens_associadas.length > 0) {
              referencedImages.push(...c.imagens_associadas);
            }
          });
        }
      } catch (err) {
        console.error('Failed to run vector query', err);
      }
    }

    const userBanca = selectedSources[0]?.banca || 'FEPESE / ACAFE';
    const isQuestionsFeature = ['simulado', 'fazer_questoes', 'questoes_500', 'teste'].includes(featureId);
    let resultText = '';
    let questionsList: any[] = [];
    let origemType: 'oficial' | 'oficial+externo' | 'somente_externo' = 'oficial';

    if (isQuestionsFeature) {
      const countMatch = (userPrompt || '').match(/\b(\d+)\b/);
      const numRequested = countMatch ? Math.min(20, Math.max(1, parseInt(countMatch[1]))) : 5;

      const localQuestions = findLocalQuestions(userPrompt || '', selectedSourceIds || []);
      const K = localQuestions.length;

      if (K >= numRequested) {
        questionsList = localQuestions.slice(0, numRequested);
        resultText = `Localizadas ${questionsList.length} questões prontas no acervo correspondendo aos critérios.`;
      } else {
        const numToGenerate = numRequested - K;
        questionsList = [...localQuestions];

        if (ai) {
          try {
            const systemPrompt = `Você é o gerador de questões inéditas JPSchool para a banca ${userBanca}.
Gere exatamente ${numToGenerate} questões de múltipla escolha com base no contexto do edital e leis oficiais de SC fornecidos abaixo.
Cada questão deve seguir rigidamente a metodologia e estilo de cobrança da banca ${userBanca}.

CONTEXTO (RAG):
${contextText || 'Edital e leis gerais do Magistério de Santa Catarina.'}

Formate a resposta como um array JSON de objetos de questão. Cada objeto deve conter exatamente estas chaves:
- enunciado: string (enunciado da questão)
- alternativas: array contendo 5 strings (opção A até E)
- gabaritoIndex: number (0 para A, 1 para B, 2 para C, 3 para D, 4 para E)
- comentario: string (comentário detalhado de gabarito e justificativa legal de SC)
- assunto: string
- materia: string

Retorne APENAS o array JSON.`;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: systemPrompt,
              config: {
                responseMimeType: 'application/json'
              }
            });
            const generatedText = response.text || '';
            const parsedQuestions = JSON.parse(generatedText);
            if (Array.isArray(parsedQuestions)) {
              parsedQuestions.forEach((q, idx) => {
                questionsList.push({
                  id: Date.now() + idx + 100,
                  banca: userBanca,
                  ano: new Date().getFullYear(),
                  materia: q.materia || 'Legislação / Didática SC',
                  assunto: q.assunto || 'Tema Específico',
                  enunciado: q.enunciado,
                  alternativas: q.alternativas || [],
                  gabaritoIndex: q.gabaritoIndex ?? 0,
                  comentario: q.comentario || '',
                  taxaAcertoGeral: 65,
                  origem: 'inedita_oficial'
                });
              });
              resultText = `Retornadas ${K} questões prontas do acervo e geradas ${numToGenerate} questões inéditas via IA.`;
            } else {
              throw new Error('Parsed response is not an array');
            }
          } catch (err) {
            console.error('Failed to generate fallback questions via Gemini API. Generating placeholders.', err);
            for (let idx = 0; idx < numToGenerate; idx++) {
              questionsList.push({
                id: Date.now() + idx + 200,
                banca: userBanca,
                ano: new Date().getFullYear(),
                materia: 'Legislação SC',
                assunto: 'Estágio Probatório',
                enunciado: `[Questão Inédita ${idx + 1}] Sobre o tema "${userPrompt || 'educação'}", qual o procedimento correto com base nas normas gerais do concurso?`,
                alternativas: [
                  'A) Procedimento padrão de estabilidade após 3 anos.',
                  'B) Notificação imediata ao MEC.',
                  'C) Afastamento sem remuneração.',
                  'D) Estabilidade imediata sem estágio probatório.',
                  'E) Prorrogação discricionária.'
                ],
                gabaritoIndex: 0,
                comentario: 'Gabarito A: O estágio probatório para servidores de SC é de 36 meses (3 anos) conforme LC 688/SC.',
                taxaAcertoGeral: 70,
                origem: 'inedita_oficial'
              });
            }
            resultText = `Retornadas ${K} questões prontas e geradas ${numToGenerate} questões simuladas locais (Gemini indisponível).`;
          }
        } else {
          for (let idx = 0; idx < numToGenerate; idx++) {
            questionsList.push({
              id: Date.now() + idx + 200,
              banca: userBanca,
              ano: new Date().getFullYear(),
              materia: 'Didática Geral',
              assunto: 'Métodos Ativos',
              enunciado: `[Questão Sintética ${idx + 1}] Questão inédita baseada nas palavras-chave do prompt: "${userPrompt || 'Didática'}".`,
              alternativas: [
                'A) Alternativa correta da questão sintética.',
                'B) Alternativa incorreta 1.',
                'C) Alternativa incorreta 2.',
                'D) Alternativa incorreta 3.',
                'E) Alternativa incorreta 4.'
              ],
              gabaritoIndex: 0,
              comentario: 'Comentário sobre a questão gerada sinteticamente.',
              taxaAcertoGeral: 60,
              origem: 'inedita_oficial'
            });
          }
          resultText = `Retornadas ${K} questões prontas e geradas ${numToGenerate} questões simuladas locais (Chave API não configurada).`;
        }
      }
    } else {
      const allowsFallback = !['radar_pegadinhas', 'raio_x', 'questoes_500'].includes(featureId);
      const keywordsOutsideSc = ['federal', 'brás', 'são paulo', 'matemática avançada', 'geografia mundial'];
      const needsExternalFallback = allowsFallback && keywordsOutsideSc.some((kw) =>
        (userPrompt || '').toLowerCase().includes(kw)
      );
      if (needsExternalFallback) {
        origemType = 'oficial+externo';
      }

      const sourcesSummary = selectedSources.length > 0
        ? selectedSources.map((s) => `• [Fonte oficial: ${s.titulo}, ${s.ano}] (${s.materia})`).join('\n')
        : '• [Fonte oficial: Edital Geral SED-SC 2026 e Lei Complementar 688/SC]';

      const globalSystemPrompt = `
Você é o Tutor JPSchool, especialista em concursos públicos de professores em Santa Catarina (SED-SC e Prefeituras).

FONTES SELECIONADAS:
${sourcesSummary}

CONTEÚDO EXTRAÍDO DA BIBLIOTECA (RAG):
${contextText || 'Nenhum trecho específico encontrado no banco vetorial. Responda com base no seu conhecimento de treinamento sobre o edital de SC.'}

REGRAS INVIOLÁVEIS DE CITAÇÃO E TRANSMISSÃO:
1. Use PRIORITARIAMENTE os TRECHOS DA BIBLIOTECA OFICIAL fornecidos sob o título "CONTEÚDO EXTRAÍDO DA BIBLIOTECA (RAG)" para fundamentar sua resposta.
2. Regra de Sinalização:
   - Para trechos baseados na biblioteca oficial, inclua explicitamente a tag: [Fonte oficial: SED-SC / Lei Comp. 688/SC, 2026]
   - Se o assunto envolver conhecimento complementar externo (não presente no edital oficial), use a tag: [Complemento externo: planalto.gov.br] e insira a nota: "Esta parte da resposta não consta na biblioteca oficial — buscamos a informação complementar em fontes externas."

3. Linguagem acolhedora, clara, sem jargões técnicos de TI (como "RAG", "prompt", "LLM").
4. Foco prático para o professor da rede pública.
BANCA DO CURSO: ${userBanca}
MODO ATIVO: ${isRetaFinal ? 'RETA FINAL (≤ 30 dias para a prova)' : 'Normal'}
      `;

      if (ai) {
        try {
          const fullPrompt = `${globalSystemPrompt}\n\nFUNCIONALIDADE SOLICITADA: ${featureId}\nINSTRUÇÕES / PERGUNTA DO ALUNO:\n${userPrompt || 'Executar conforme o padrão da funcionalidade'}`;
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
          });
          resultText = response.text || '';
        } catch (err) {
          console.error('Gemini API call error, falling back to local generator:', err);
          resultText = generateFallbackResponse(featureId, userPrompt, sourcesSummary, needsExternalFallback);
        }
      } else {
        resultText = generateFallbackResponse(featureId, userPrompt, sourcesSummary, needsExternalFallback);
      }
    }

    userQuotas.producoesUsadas += 1;
    const conteudo = isQuestionsFeature ? { questions: questionsList, text: resultText } : resultText;

    res.json({
      success: true,
      featureId,
      resultText: isQuestionsFeature ? resultText : resultText,
      conteudo,
      origem: origemType,
      cotasAtualizadas: userQuotas,
      trechos: [
        {
          texto: 'Conforme preceitua a Lei Complementar N° 688/SC e a LDB 9.394/96...',
          tipo: 'oficial',
          fonte: selectedSources[0]?.titulo || 'Edital SED-SC 2026',
          ano: 2026,
        },
        ...(origemType === 'oficial+externo'
          ? [
              {
                texto: 'Informação complementar de abrangência legislativa federal...',
                tipo: 'externo' as const,
                fonte: 'Portal do Planalto',
                dominio: 'planalto.gov.br',
              },
            ]
          : []),
      ],
    });
  } catch (error: any) {
    console.error('Error in /api/estudio/executar:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar solicitação no estúdio.' });
  }
});

// Helper response generator if API key is not present or offline
function generateFallbackResponse(featureId: string, prompt: string, sources: string, externalFallback: boolean): string {
  const notaExterna = externalFallback
    ? '\n\n🌐 **Aviso de Cobertura:** Esta parte da resposta não consta na biblioteca oficial — buscamos a informação complementar em fontes externas (planalto.gov.br).'
    : '';

  switch (featureId) {
    case 'plano_estudo':
      return `📅 **Plano de Estudo Personalizado - Rumo à Aprovação SED-SC**

📗 [Fonte oficial: Edital SED-SC 2026, 2026]
Distribuímos sua rotina em blocos de 45 minutos com foco na banca FEPESE/ACAFE.

• **Segunda-feira (Legislação SC):**
  - Block 1 (45 min): Estatuto do Magistério (LC 688/SC) - Estágio Probatório e Direitos.
  - Block 2 (45 min): Resolução de 10 Questões do acervo.
• **Terça-feira (Didática e Currículo):**
  - Block 1 (45 min): Currículo Base do Território Catarinense (Educação Integral).
  - Block 2 (45 min): Flashcards de Tendências Pedagógicas.
• **Quarta-feira (Português para Concursos):**
  - Block 1 (45 min): Compreensão de textos e coesão textual no padrão FEPESE.
• **Quinta-feira (LDB e ECA):**
  - Block 1 (45 min): Artigos 12 e 13 da LDB + Artigo 56 do ECA.
• **Sexta-feira (Revisão & Questões):**
  - Block 1 (45 min): Radar de Pegadinhas das provas anteriores.
• **Sábado (Simulado Ativo):**
  - Block 1 (90 min): Simulado quinzenal de 40 questões.
• **Domingo:** Descanso focado ou revisão leve de anotações.${notaExterna}`;

    case 'simulado':
    case 'fazer_questoes':
    case 'questoes_500':
      return `📝 **Simulado Oficial - Padrão FEPESE/ACAFE**

📗 [Fonte oficial: Acervo de Provas Anteriores SED-SC]
1. **(FEPESE - SED-SC 2024)** Segundo a Lei Complementar Estadual nº 688/SC, o Estágio Probatório do professor contratado na Rede Estadual de Ensino de Santa Catarina possui qual duração?
   - A) 2 anos com avaliação do Conselho Escolar.
   - B) 3 anos (36 meses) com avaliação especial de desempenho realizada por comissão.
   - C) 5 anos sem exigência de relatório.
   - D) 1 ano renovável automaticamente.
   **Gabarito: B** - [Fonte oficial: LC 688/SC, Art. 18]

2. **(ACAFE - 2024)** O Currículo Base do Território Catarinense estabelece a Educação Integral como:
   - A) Mero aumento de carga horária para 7 horas.
   - B) Formação multidimensional do sujeito (cognitiva, social, afetiva e física).
   - C) Ensino focado exclusivamente em provas teóricas.
   **Gabarito: B** - [Fonte oficial: Currículo Base SC, Pág. 34]${notaExterna}`;

    case 'resumir':
      return `📖 **Resumo Estruturado: ${prompt || 'Legislação e Didática SC'}**

📗 [Fonte oficial: Lei Complementar 688/SC e LDB 9.394/96]
1. **Conceito Fundamental:**
   O Magistério Público Estadual de SC organiza-se em carreira estruturada por cargos de provimento efetivo e contratação temporária (ACT), primando pela valorização do docente e formação continuada.

2. **Base Legal Citada:**
   • Art. 13 da LDB: Incumbência do docente em participar da proposta pedagógica e zelar pelo aprendizado.
   • Art. 18 da LC 688/SC: Período de 36 meses de estágio probatório com comissão especial.

3. **Aplicação Prática em SC:**
   Nas escolas estaduais catarinenses, a avaliação diagnóstica deve subsidiar o plano de aula adaptado à realidade regional e diversidade de saberes.

4. **Pontos de Atenção na FEPESE:**
   A banca gosta de trocar o termo "Conselho Tutelar" por "Direção Regional" e alterar a duração do estágio probatório para 2 anos. Fique atento!${notaExterna}`;

    case 'tirar_duvida':
      return `💬 **Resposta do Tutor JPSchool**

📗 [Fonte oficial: Edital SED-SC e LDB 9.394/96]
Olá, Professor(a)! Analisando sua dúvida sobre **"${prompt || 'Processo Seletivo ACT'}"**:

Em Santa Catarina, os processos seletivos para professores ACTs priorizam a pontuação combinada de **tempo de serviço na rede pública estadual** e **habilitação acadêmica (Licenciatura Plena/Pós-Graduação)**. Além disso, na prova objetiva promovida pela banca oficial, as questões de Legislação e Didática têm peso decisivo no desempate.

Fique atento aos prazos de apresentação de documentos e mantenha suas anotações revisadas no nosso Estúdio!${notaExterna}`;

    case 'flashcards':
      return `🗂 **Flashcards Gerados (Memorização Rápida)**

Card 1:
• **Frente:** Qual é a duração do Estágio Probatório na LC 688/SC?
• **Verso:** 3 anos (36 meses) com avaliação por comissão especial de desempenho.
• [Fonte oficial: LC 688/SC]

Card 2:
• **Frente:** A quem a escola deve notificar em caso de faltas injustificadas repetidas (ECA)?
• **Verso:** Ao Conselho Tutelar da respectiva localidade (Art. 56 ECA).
• [Fonte oficial: ECA Lei 8.069/90]

Card 3:
• **Frente:** O que caracteriza a Educação Integral no Currículo Base de SC?
• **Verso:** Desenvolvimento multidimensional pleno (cognitivo, físico, afetivo, cultural e social).
• [Fonte oficial: Currículo Base SC]${notaExterna}`;

    case 'corrigir_redacao':
      return `✍ **Relatório de Correção de Redação / Questão Discursiva**

📗 [Fonte oficial: Critérios de Correção FEPESE/ACAFE]

📊 **Nota Final: 9.2 / 10.0**

1. **Adequação ao Tema e Edital (2.5 / 2.5):**
   Demonstrou excelente domínio das diretrizes da Educação Integral do Território Catarinense.

2. **Fundamentação Legal e Teórica (2.3 / 2.5):**
   Mencionou a LDB 9.394/96 e a LC 688/SC adequadamente.

3. **Coesão e Estrutura Textual (2.4 / 2.5):**
   Uso de conectivos adequados e divisão clara em introdução, desenvolvimento e proposta.

4. **Domínio da Norma Culta (2.0 / 2.5):**
   Pequenos ajustes de regência verbal no 2º parágrafo.

💡 **Sugestão de Reescrita:**
*Original:* "A escola tem que fazer com que os alunos aprendam tudo."
*Sugestão:* "Cabe à instituição escolar assegurar o desenvolvimento pleno e a aprendizagem efetiva de todos os educandos, em consonância com o Artigo 13 da LDB."${notaExterna}`;

    default:
      return `✨ **Material Produção Estúdio: ${featureId}**

📗 [Fonte oficial: Base Normativa SED-SC 2026]
O conteúdo solicitado foi gerado com sucesso respeitando rigorosamente a literatura e legislação do Magistério Público Estadual de Santa Catarina.

• **Tópicos Principais:** Diretrizes Curriculares, Gestão Democrática e Legislação de SC.
• **Instrução para a Prova:** Revise os pontos de maior incidência identificados no nosso Raio-X!${notaExterna}`;
  }
}

// Middleware de Autenticação e Matriz de Permissões
function requireAuth(allowedRoles?: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization || (req.headers['x-user-role'] as string);

    if (!authHeader) {
      return res.status(401).json({
        error: 'Acesso não autorizado. Autenticação obrigatória (token/sessão não informado).',
        code: 'UNAUTHENTICATED',
      });
    }

    let role: string | undefined;

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim().toLowerCase();
      const matchedUser = TEST_USERS.find(
        (u) => u.usuario.toLowerCase() === token || u.role === token
      );
      if (matchedUser) {
        role = matchedUser.role;
      } else {
        role = token;
      }
    } else {
      role = authHeader.toLowerCase();
    }

    const validRoles = ['super_admin', 'admin', 'ti', 'cliente'];
    if (!role || !validRoles.includes(role)) {
      return res.status(401).json({
        error: 'Acesso não autorizado. Sessão ou token inválido.',
        code: 'INVALID_SESSION',
      });
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return res.status(403).json({
        error: `Acesso negado. O papel '${role}' não possui permissão para acessar este recurso.`,
        code: 'FORBIDDEN',
      });
    }

    (req as any).userRole = role;
    next();
  };
}

// API Routes for Onda 1 Entities (Protected by Auth & Role Permissions)
app.get('/api/matriculas', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  res.json({ matriculas: MOCK_MATRICULAS });
});

app.post('/api/matriculas/status', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const { id, status } = req.body;
  const matricula = MOCK_MATRICULAS.find(m => m.id === id);
  if (matricula) {
    const oldStatus = matricula.status;
    matricula.status = status;
    MOCK_LOGS_AUDITORIA.push({
      id: MOCK_LOGS_AUDITORIA.length + 1,
      acao: 'ALTERACAO_MATRICULA_STATUS',
      detalhes: `Status da matrícula ${id} alterado de ${oldStatus} para ${status}`,
      dadosAntes: { status: oldStatus },
      dadosDepois: { status },
      criadoEm: new Date().toISOString(),
    });
    res.json({ success: true, matricula });
  } else {
    res.status(404).json({ error: 'Matrícula não encontrada' });
  }
});

app.get('/api/pagamentos', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  res.json({ pagamentos: MOCK_PAGAMENTOS });
});

app.get('/api/codigos-acesso', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  res.json({ codigos: MOCK_CODIGOS_ACESSO });
});

app.get('/api/tickets', requireAuth(['super_admin', 'admin', 'ti', 'cliente']), (req, res) => {
  res.json({ tickets: MOCK_TICKETS });
});

app.get('/api/logs-auditoria', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  res.json({ logs: MOCK_LOGS_AUDITORIA });
});

app.get('/api/configuracoes', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  res.json({ configuracoes: MOCK_CONFIGURACOES });
});

app.post('/api/configuracoes/update', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const { chave, valor } = req.body;
  const config = MOCK_CONFIGURACOES.find(c => c.chave === chave);
  if (config) {
    const oldVal = config.valor;
    config.valor = valor;
    config.atualizadoEm = new Date().toISOString();
    config.atualizadoPor = req.headers['x-user-role'] as string || 'admin';
    MOCK_LOGS_AUDITORIA.push({
      id: MOCK_LOGS_AUDITORIA.length + 1,
      acao: 'ALTERACAO_CONFIGURACAO',
      detalhes: `Configuração ${chave} alterada de ${oldVal} para ${valor}`,
      dadosAntes: { valor: oldVal },
      dadosDepois: { valor },
      criadoEm: new Date().toISOString(),
    });
    res.json({ success: true, config });
  } else {
    res.status(404).json({ error: 'Configuração não encontrada' });
  }
});

app.get('/api/leads', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  res.json({ leads: MOCK_LEADS });
});

app.get('/api/campanhas-cota', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  res.json({ campanhas: MOCK_CAMPANHAS_COTA });
});

// API Routes for Onda 2 Security Rules (Backend Logic)
app.post('/api/auth/validar-senha', (req, res) => {
  const { senha } = req.body;
  const validacao = validarPoliticaSenha(senha);
  res.json(validacao);
});

app.post('/api/auth/login', (req, res) => {
  const { usuario, senha } = req.body;

  // 1. Check rate limit (5 failed attempts -> 15 min lock)
  const verificacao = verificarTentativasLogin(usuario || '');
  if (!verificacao.permitido) {
    return res.status(429).json({
      error: `Usuário temporariamente bloqueado. Muitas tentativas incorretas. Tente novamente em ${verificacao.tempoRestanteMinutos} minuto(s).`,
      bloqueado: true,
      tempoRestanteMinutos: verificacao.tempoRestanteMinutos,
    });
  }

  // 2. Authenticate credentials (Any failed password counts as 1 attempt)
  const userMatch = TEST_USERS.find(
    (u) => u.usuario.toLowerCase() === (usuario || '').trim().toLowerCase() && u.senha === senha
  );

  if (!userMatch) {
    const tentativa = registrarTentativaLoginFalha(usuario || '');
    return res.status(401).json({
      error: 'Usuário ou senha incorretos.',
      bloqueado: tentativa.bloqueado,
      tentativasRestantes: tentativa.tentativasRestantes,
    });
  }

  // 3. Success -> reset attempts counter and add audit log
  resetarTentativasLogin(usuario);
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    usuarioId: userMatch.id,
    usuarioNome: userMatch.nome,
    papel: userMatch.role,
    acao: 'LOGIN_SUCESSO',
    detalhes: `Autenticação bem sucedida para o papel ${userMatch.role}`,
    dadosAntes: {},
    dadosDepois: { loginTimestamp: new Date().toISOString() },
    ip: req.ip || '127.0.0.1',
    criadoEm: new Date().toISOString(),
  });

  res.json({ success: true, user: userMatch });
});

// Start Server Boot
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JPSchool Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
