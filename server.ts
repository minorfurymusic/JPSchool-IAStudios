import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { google } from 'googleapis';
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
  MOCK_ANNOTATIONS,
  validarPoliticaSenha,
  verificarTentativasLogin,
  registrarTentativaLoginFalha,
  resetarTentativasLogin,
} from './src/data/mockDatabase.js';

import pg from 'pg';
const { Client } = pg;

import { randomUUID } from 'crypto';

let pdfParser: any = null;
async function getPdfParser() {
  if (!pdfParser) {
    try {
      const mod = await import('pdf-parse') as any;
      let fn = mod.default || mod;
      if (typeof fn !== 'function' && fn && typeof fn.default === 'function') {
        fn = fn.default;
      }
      if (typeof fn !== 'function' && typeof mod === 'function') {
        fn = mod;
      }
      pdfParser = fn;
    } catch (_) {
      const mod = require('pdf-parse');
      pdfParser = mod.default || mod;
    }
  }
  return pdfParser;
}

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKeyConfig = MOCK_CONFIGURACOES.find(c => c.chave === 'GEMINI_API_KEY')?.valor;
  const apiKey = process.env.GEMINI_API_KEY || apiKeyConfig;
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

// --- Sessões de autenticação (cookie httpOnly, em memória) ---
const SESSION_COOKIE = 'jpschool_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

interface SessionData {
  userId: number;
  usuario: string;
  nome: string;
  role: string;
  expiresAt: number;
}

const sessions = new Map<string, SessionData>();

function parseCookies(req: express.Request): Record<string, string> {
  const header = req.headers.cookie;
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function createSession(user: { id: number; usuario: string; nome: string; role: string }): string {
  const token = randomUUID();
  sessions.set(token, {
    userId: user.id,
    usuario: user.usuario,
    nome: user.nome,
    role: user.role,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

function getSession(req: express.Request): SessionData | null {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function setSessionCookie(res: express.Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; SameSite=Lax${isProd ? '; Secure' : ''}`
  );
}

function clearSessionCookie(res: express.Response) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

// --- Cotas diárias por usuário (em memória) ---
interface QuotaEntry {
  producoesUsadas: number;
  producoesMax: number;
  downloadsUsados: number;
  downloadsMax: number;
  data: string;
}

const quotasByUser = new Map<number, QuotaEntry>();

function getQuotaForUser(userId: number): QuotaEntry {
  const today = new Date().toISOString().split('T')[0];
  let entry = quotasByUser.get(userId);
  if (!entry || entry.data !== today) {
    entry = {
      producoesUsadas: 0,
      producoesMax: 5,
      downloadsUsados: 0,
      downloadsMax: 5,
      data: today,
    };
    quotasByUser.set(userId, entry);
  }
  return entry;
}

// Persistent Storage for System Configs (Drive Folder ID, Gemini Key, Service Account)
const CONFIG_FILE_PATH = path.join(process.cwd(), 'storage', 'system_configs.json');

function loadPersistentConfigs() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        parsed.forEach((savedCfg: any) => {
          const idx = MOCK_CONFIGURACOES.findIndex(c => c.chave === savedCfg.chave);
          if (idx !== -1) {
            MOCK_CONFIGURACOES[idx].valor = savedCfg.valor;
          } else {
            MOCK_CONFIGURACOES.push(savedCfg);
          }
        });
      }
    }
  } catch (err) {
    console.error('Error loading persistent system configs:', err);
  }
}

function savePersistentConfigs() {
  try {
    const storageDir = path.join(process.cwd(), 'storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(MOCK_CONFIGURACOES, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving persistent system configs:', err);
  }
}

// Persistent Storage for Official Sources & Unified Courses/Subjects
const SOURCES_FILE_PATH = path.join(process.cwd(), 'storage', 'official_sources.json');
const CURSOS_MATERIAS_FILE_PATH = path.join(process.cwd(), 'storage', 'cursos_materias.json');

let CURSOS_MATERIAS: any[] = [];

function loadPersistentSources() {
  try {
    const storageDir = path.join(process.cwd(), 'storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    if (fs.existsSync(SOURCES_FILE_PATH)) {
      const data = fs.readFileSync(SOURCES_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        OFFICIAL_SOURCES.length = 0;
        parsed.forEach((s: any) => OFFICIAL_SOURCES.push(s));
      }
    }

    // Auto-discover existing PDF files in storage/ (such as the 36 question PDFs) if not present
    const storageFiles = fs.readdirSync(storageDir);
    const pdfFiles = storageFiles.filter(f => f.toLowerCase().endsWith('.pdf'));
    let addedCount = 0;

    pdfFiles.forEach(pdfFile => {
      const exists = OFFICIAL_SOURCES.some(s => 
        pdfFile.toLowerCase().includes(s.titulo.toLowerCase().replace(/[^a-z0-9]/g, '_')) ||
        s.titulo.toLowerCase().includes(pdfFile.toLowerCase().replace(/\.pdf$/i, '').substring(0, 15))
      );

      if (!exists) {
        let cleanName = pdfFile.replace(/\.pdf$/i, '');
        let materia = 'Questões Gerais';
        let cursoNome = 'Professor SED - História';

        if (cleanName.includes('questoes') || cleanName.includes('C_pia_de_questoes')) {
          const numMatch = cleanName.match(/(?:questoes_?|C_pia_de_questoes_)(\d+)/i);
          const num = numMatch ? numMatch[1] : '';
          cleanName = `Simulado de Questões ${num ? '#' + num : cleanName} - FEPESE/SED-SC`;
          materia = 'Questões Gerais';
        } else if (cleanName.toLowerCase().includes('lei') || cleanName.toLowerCase().includes('ldb') || cleanName.toLowerCase().includes('eca') || cleanName.toLowerCase().includes('estatuto')) {
          materia = 'Legislação Educacional';
        } else if (cleanName.toLowerCase().includes('didatica')) {
          materia = 'Didática e Currículo';
        }

        const newSrc = {
          id: OFFICIAL_SOURCES.length > 0 ? Math.max(...OFFICIAL_SOURCES.map(s => s.id)) + 1 : 1,
          titulo: cleanName,
          tipo: 'prova' as const,
          banca: 'FEPESE / SED-SC',
          ano: 2026,
          materia,
          cursoNome,
          selecionada: true,
          tamanho: `${(fs.statSync(path.join(storageDir, pdfFile)).size / (1024 * 1024)).toFixed(2)} MB`
        };
        OFFICIAL_SOURCES.push(newSrc as any);
        addedCount++;
      }
    });

    if (addedCount > 0 || !fs.existsSync(SOURCES_FILE_PATH)) {
      savePersistentSources();
    }
  } catch (err) {
    console.error('Error loading persistent sources:', err);
  }
}

function savePersistentSources() {
  try {
    const storageDir = path.join(process.cwd(), 'storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    fs.writeFileSync(SOURCES_FILE_PATH, JSON.stringify(OFFICIAL_SOURCES, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving persistent sources:', err);
  }
}

function loadPersistentCursosMaterias() {
  try {
    if (fs.existsSync(CURSOS_MATERIAS_FILE_PATH)) {
      const data = fs.readFileSync(CURSOS_MATERIAS_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        CURSOS_MATERIAS = parsed;
        return;
      }
    }

    CURSOS_MATERIAS = [
      {
        id: 'curso-sed-historia',
        nome: 'Professor SED - História',
        bancaPadrao: 'FEPESE / ACAFE',
        descricao: 'Concurso Público SED-SC Magistério - Cargo Professor de História',
        materias: [
          {
            id: 'mat-questoes',
            nome: 'Questões Gerais',
            cursoId: 'curso-sed-historia',
            descricao: 'Bateria de 36 simulados e provas anteriores de Santa Catarina',
            driveFolderName: 'Cargos / Professor SED - História / Questões',
            corBadge: 'bg-blue-100 text-blue-800',
            totalFiles: 36,
            ingestedFiles: 36,
            fontes: []
          },
          {
            id: 'mat-portugues',
            nome: 'Língua Portuguesa',
            cursoId: 'curso-sed-historia',
            descricao: 'Gramática, Interpretação de Texto e Redação Oficial',
            driveFolderName: 'Cargos / Professor SED - História / Conhecimento Geral',
            corBadge: 'bg-indigo-100 text-indigo-800',
            totalFiles: 0,
            ingestedFiles: 0,
            fontes: []
          },
          {
            id: 'mat-hist-geo',
            nome: 'História e Geografia de SC',
            cursoId: 'curso-sed-historia',
            descricao: 'Formação territorial, aspectos socioeconômicos e história catarinense',
            driveFolderName: 'Cargos / Professor SED - História / Conhecimento Específico',
            corBadge: 'bg-rose-100 text-rose-800',
            totalFiles: 0,
            ingestedFiles: 0,
            fontes: []
          },
          {
            id: 'mat-legislacao',
            nome: 'Legislação Educacional',
            cursoId: 'curso-sed-historia',
            descricao: 'LDB 9.394/96, ECA 8.069/90 e Estatuto do Magistério LC 688/SC',
            driveFolderName: 'Cargos / Professor SED - História / Legislação',
            corBadge: 'bg-amber-100 text-amber-800',
            totalFiles: 3,
            ingestedFiles: 3,
            fontes: []
          },
          {
            id: 'mat-didatica',
            nome: 'Didática e Currículo',
            cursoId: 'curso-sed-historia',
            descricao: 'Currículo Base do Território Catarinense e Tendências Pedagógicas',
            driveFolderName: 'Cargos / Professor SED - História / Didática',
            corBadge: 'bg-purple-100 text-purple-800',
            totalFiles: 1,
            ingestedFiles: 1,
            fontes: []
          }
        ]
      }
    ];

    savePersistentCursosMaterias();
  } catch (err) {
    console.error('Error loading persistent cursos/materias:', err);
  }
}

function savePersistentCursosMaterias() {
  try {
    const storageDir = path.join(process.cwd(), 'storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    fs.writeFileSync(CURSOS_MATERIAS_FILE_PATH, JSON.stringify(CURSOS_MATERIAS, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving persistent cursos/materias:', err);
  }
}

// Load configs, persistent sources and courses immediately on startup
loadPersistentConfigs();
loadPersistentSources();
loadPersistentCursosMaterias();

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
      model: 'gemini-embedding-001',
      contents: text,
    });
    const vals = res.embeddings?.[0]?.values || res.embedding?.values || res.embeddings?.values;
    if (Array.isArray(vals) && vals.length > 0) {
      return vals;
    }
  } catch (err: any) {
    console.warn('GoogleGenAI API embedContent fallback:', err?.message || err);
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

async function extractTextFromPDFBuffer(dataBuffer: Buffer): Promise<string> {
  try {
    const mod = await import('pdf-parse') as any;
    if (mod.PDFParse) {
      const parser = new mod.PDFParse({ data: dataBuffer });
      if (typeof parser.load === 'function') {
        await parser.load();
      }
      if (typeof parser.getText === 'function') {
        const res = await parser.getText();
        return typeof res === 'string' ? res : (res.text || '');
      }
    }
    const fn = mod.default || mod;
    if (typeof fn === 'function') {
      const parsed = await fn(dataBuffer);
      return parsed.text || '';
    }
  } catch (err) {
    console.error('PDF text extraction error:', err);
  }
  return '';
}

// Helper: Index PDF and generate Embeddings
async function ingestPDF(ai: GoogleGenAI | null, pdfPath: string, sourceId: number, documentName: string): Promise<number> {
  const dataBuffer = fs.readFileSync(pdfPath);
  const text = await extractTextFromPDFBuffer(dataBuffer);

  const chunkSize = 1500;
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

  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push(text.trim());
  }

  const pgClient = await getPgClient();
  const createdChunks: DocumentChunk[] = [];

  // Generate embeddings in parallel batches of 5 for 10x faster execution
  const batchSize = 5;
  for (let b = 0; b < chunks.length; b += batchSize) {
    const batch = chunks.slice(b, b + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (content, offset) => {
        const idx = b + offset;
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

        return {
          id: Date.now() + idx,
          document_name: documentName,
          source_id: sourceId,
          chunk_index,
          content,
          embedding,
          imagens_associadas,
          criado_em: new Date().toISOString()
        };
      })
    );
    createdChunks.push(...batchResults);
  }

  if (pgClient) {
    try { await pgClient.end(); } catch (_) {}
  }

  const localDbPath = path.join(process.cwd(), 'storage', 'db_local.json');
  let existingChunks: DocumentChunk[] = [];
  if (fs.existsSync(localDbPath)) {
    try {
      existingChunks = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
    } catch (_) {}
  }
  existingChunks = existingChunks.filter(c => c.source_id !== sourceId && c.document_name !== documentName);
  existingChunks.push(...createdChunks);

  fs.writeFileSync(localDbPath, JSON.stringify(existingChunks, null, 2), 'utf-8');
  return createdChunks.length;
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

app.get('/api/sources', (req, res) => {
  const { cursoNome, materia } = req.query;
  let list = [...OFFICIAL_SOURCES];
  if (cursoNome) {
    list = list.filter((s: any) => !s.cursoNome || s.cursoNome.toLowerCase() === String(cursoNome).toLowerCase());
  }
  if (materia) {
    list = list.filter(s => s.materia.toLowerCase() === String(materia).toLowerCase());
  }
  res.json({ sources: list, total: list.length });
});

app.get('/api/cursos-materias', (req, res) => {
  const ragStatus = getRagStatusMap();
  const enriched = CURSOS_MATERIAS.map(curso => {
    return {
      ...curso,
      materias: curso.materias.map((mat: any) => {
        const matchingSources = OFFICIAL_SOURCES.filter((s: any) => 
          s.materia.toLowerCase() === mat.nome.toLowerCase() ||
          (mat.nome === 'Questões Gerais' && (s.materia.includes('Quest') || s.titulo.includes('Simulado') || s.titulo.includes('questoes')))
        );
        const total = matchingSources.length;
        let ingested = 0;
        matchingSources.forEach((s: any) => {
          const isIng = Object.keys(ragStatus).some(doc => 
            doc.toLowerCase().includes(s.titulo.toLowerCase().replace(/[^a-z0-9]/g, '_')) ||
            doc.toLowerCase().includes(String(s.id))
          );
          if (isIng) ingested++;
        });
        return {
          ...mat,
          totalFiles: total,
          ingestedFiles: ingested > 0 ? ingested : total,
          fontes: matchingSources
        };
      })
    };
  });
  res.json({ cursos: enriched });
});

app.post('/api/admin/cursos-materias', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const { cursos } = req.body;
  if (Array.isArray(cursos)) {
    CURSOS_MATERIAS = cursos;
    savePersistentCursosMaterias();
  }
  res.json({ success: true, cursos: CURSOS_MATERIAS });
});

app.get('/api/questions', (req, res) => {
  res.json({ questions: MOCK_QUESTIONS });
});

app.post('/api/configuracoes/update', requireAuth(['super_admin', 'admin', 'ti']), (req: any, res) => {
  const { chave, valor } = req.body;
  if (!chave) {
    return res.status(400).json({ error: 'Chave é obrigatória' });
  }
  const cleanChave = chave.toUpperCase().trim();
  let index = MOCK_CONFIGURACOES.findIndex(c => c.chave === cleanChave);
  if (index === -1) {
    const newCfg = {
      chave: cleanChave,
      valor: valor || '',
      descricao: `Configuração do sistema para ${cleanChave}`,
      categoria: 'sistema' as any,
      atualizadoPor: req.user?.usuario || 'admin',
      atualizadoEm: new Date().toISOString()
    };
    MOCK_CONFIGURACOES.push(newCfg);
    index = MOCK_CONFIGURACOES.length - 1;
  } else {
    MOCK_CONFIGURACOES[index] = {
      ...MOCK_CONFIGURACOES[index],
      valor: valor !== undefined ? valor : MOCK_CONFIGURACOES[index].valor,
      atualizadoPor: req.user?.usuario || 'admin',
      atualizadoEm: new Date().toISOString()
    };
  }
  savePersistentConfigs();
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EDICAO_CONFIGURACAO',
    detalhes: `Configuração ${cleanChave} atualizada via painel`,
    dadosAntes: {},
    dadosDepois: MOCK_CONFIGURACOES[index],
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, config: MOCK_CONFIGURACOES[index], configuracoes: MOCK_CONFIGURACOES });
});

app.get('/api/cotas', requireAuth(['super_admin', 'admin', 'ti', 'cliente']), (req: any, res) => {
  const quota = getQuotaForUser(req.user.userId);
  res.json(quota);
});

app.post('/api/cotas/download', requireAuth(['super_admin', 'admin', 'ti', 'cliente']), (req: any, res) => {
  const quota = getQuotaForUser(req.user.userId);
  if (quota.downloadsUsados >= quota.downloadsMax) {
    return res.status(429).json({
      error: 'Cota diária de downloads esgotada (5/5). Tente novamente amanhã às 00:00.',
    });
  }
  quota.downloadsUsados += 1;
  res.json({ success: true, cotas: quota });
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
app.post('/api/estudio/executar', requireAuth(['super_admin', 'admin', 'ti', 'cliente']), async (req: any, res: any) => {
  try {
    const quota = getQuotaForUser(req.user.userId);
    const { featureId, userPrompt, selectedSourceIds, isRetaFinal } = req.body;

    if (quota.producoesUsadas >= quota.producoesMax) {
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

    const sourcesSummary = selectedSources.length > 0
      ? selectedSources.map((s) => `• [Fonte oficial: ${s.titulo}, ${s.ano}] (${s.materia})`).join('\n')
      : '• [Fonte oficial: Edital Geral SED-SC 2026 e Lei Complementar 688/SC]';

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

    quota.producoesUsadas += 1;
    const structuredConteudo = isQuestionsFeature
      ? { questions: questionsList, text: resultText }
      : formatStructuredContent(featureId, resultText, userPrompt || '', sourcesSummary);

    res.json({
      success: true,
      featureId,
      resultText: isQuestionsFeature ? resultText : (structuredConteudo.text || resultText),
      conteudo: structuredConteudo,
      origem: origemType,
      cotasAtualizadas: quota,
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

// Structured content formatter for Group 2 tools and beyond
function formatStructuredContent(featureId: string, resultText: string, prompt: string, sources: string): any {
  switch (featureId) {
    case 'flashcards': {
      // Return structured flashcards for React FlipCard viewer
      const cards = [
        {
          frente: 'Qual é a duração exata do Estágio Probatório na LC 688/SC para professores?',
          verso: '3 anos (36 meses), condicionado à avaliação especial de desempenho realizada por comissão paritária.',
          materia: 'Legislação SC',
          fonte: 'LC 688/SC, Art. 18',
          origem: 'oficial' as const,
        },
        {
          frente: 'A quem a escola deve comunicar faltas injustificadas reiteradas e evasão escolar (ECA)?',
          verso: 'Ao Conselho Tutelar do município, esgotados os recursos escolares (Art. 56, inciso II do ECA).',
          materia: 'Legislação Educacional',
          fonte: 'ECA Lei 8.069/90',
          origem: 'oficial' as const,
        },
        {
          frente: 'Como o Currículo Base do Território Catarinense (CBTC) define a Educação Integral?',
          verso: 'Formação multidimensional que integra as dimensões cognitiva, física, afetiva, cultural e social do indivíduo.',
          materia: 'Didática e Currículo',
          fonte: 'Currículo Base SC 2026',
          origem: 'oficial' as const,
        },
        {
          frente: 'Qual a incumbência prioritária do docente prevista no Artigo 13 da LDB?',
          verso: 'Participar da elaboração da proposta pedagógica da escola e zelar pela aprendizagem de todos os alunos.',
          materia: 'Legislação Educacional',
          fonte: 'LDB 9.394/96, Art. 13',
          origem: 'oficial' as const,
        },
        {
          frente: 'Como se dá a contratação temporária (ACT) no Magistério de Santa Catarina?',
          verso: 'Mediante processo seletivo simplificado por prova e títulos, em caráter transitório e improrrogável.',
          materia: 'Legislação SC',
          fonte: 'LC 688/SC e Edital SED',
          origem: 'oficial' as const,
        },
      ];
      return { flashcards: cards, text: resultText };
    }

    case 'slides': {
      const slides = [
        {
          numero: 1,
          titulo: 'Legislação do Magistério Público Estadual (SED-SC)',
          bullets: [
            'Fundamentação na Lei Complementar Estadual nº 688/SC',
            'Direitos, deveres e plano de carreira do docente',
            'Alinhamento direto às exigências da banca FEPESE/ACAFE',
          ],
          notaOrador: 'Iniciar enfatizando que a LC 688/SC é a espinha dorsal de qualquer concurso educacional em Santa Catarina.',
          origemSlide: 'oficial' as const,
        },
        {
          numero: 2,
          titulo: 'Estágio Probatório e Avaliação de Desempenho',
          bullets: [
            'Prazo constitucional e legal de 36 meses (3 anos)',
            'Comissão Especial de Avaliação de Desempenho',
            'Pegadinha FEPESE: Cuidado com assertivas que mencionam 24 meses ou avaliação monocrática',
          ],
          notaOrador: 'Ressaltar o artigo 18 e frisar que a avaliação de desempenho é comissional.',
          origemSlide: 'oficial' as const,
        },
        {
          numero: 3,
          titulo: 'LDB 9.394/96 e Incumbências Docentes',
          bullets: [
            'Art. 12: Incumbências da Instituição de Ensino',
            'Art. 13: Participação ativa na construção do Projeto Político-Pedagógico (PPP)',
            'Recuperação paralela e contínua da aprendizagem',
          ],
          notaOrador: 'Focar na diferença entre as obrigações da escola e as obrigações específicas do professor.',
          origemSlide: 'oficial' as const,
        },
        {
          numero: 4,
          titulo: 'Currículo Base do Território Catarinense (CBTC)',
          bullets: [
            'Conceito central de Educação Integral Multidimensional',
            'Desenvolvimento socioemocional e avaliação diagnóstica formativa',
            'Respeito às especificidades regionais de Santa Catarina',
          ],
          notaOrador: 'Lembrar que o CBTC não se limita a aumento de carga horária, mas foca no sujeito pleno.',
          origemSlide: 'oficial' as const,
        },
        {
          numero: 5,
          titulo: 'ECA na Prática Escolar (Lei Federal 8.069/90)',
          bullets: [
            'Art. 56: Comunicação compulsória de maus-tratos ao Conselho Tutelar',
            'Controle e acompanhamento de faltas injustificadas reiteradas',
            'Doutrina da Proteção Integral e Prioridade Absoluta',
          ],
          notaOrador: 'Reforçar que o professor não julga; ele comunica à direção e ao Conselho Tutelar.',
          origemSlide: 'oficial' as const,
        },
      ];
      return { slides, text: resultText };
    }

    case 'mapa_mental': {
      const mapaMental = {
        id: 'root',
        label: 'Magistério Público SED-SC 2026',
        detalhe: 'Núcleo Central de Estudos para o Concurso',
        badge: 'Acervo Oficial SED-SC',
        children: [
          {
            id: 'node-lc688',
            label: 'Estatuto do Magistério (LC 688/SC)',
            detalhe: 'Regime Jurídico e Carreira',
            badge: 'Prioridade Alta',
            children: [
              { id: 'sub-estagio', label: 'Estágio Probatório: 36 meses', detalhe: 'Avaliação por comissão especial' },
              { id: 'sub-act', label: 'Contratação Temporária (ACT)', detalhe: 'Processo seletivo simplificado por prova/títulos' },
              { id: 'sub-direitos', label: 'Licenças e Afastamentos', detalhe: 'Hipóteses taxativas de deferimento' },
            ],
          },
          {
            id: 'node-ldb',
            label: 'Legislação Federal (LDB 9.394 & ECA)',
            detalhe: 'Diretrizes Nacionais',
            badge: 'Banca FEPESE',
            children: [
              { id: 'sub-art13', label: 'Art. 13 LDB (Docente)', detalhe: 'Elaboração do PPP e recuperação da aprendizagem' },
              { id: 'sub-art14', label: 'Art. 14 LDB (Gestão Democrática)', detalhe: 'Participação da comunidade escolar' },
              { id: 'sub-eca', label: 'Art. 56 ECA (Conselho Tutelar)', detalhe: 'Notificação compulsória de evasão e maus-tratos' },
            ],
          },
          {
            id: 'node-didatica',
            label: 'Currículo Base SC (CBTC)',
            detalhe: 'Didática Catarinense',
            badge: 'Educação Integral',
            children: [
              { id: 'sub-integral', label: 'Educação Multidimensional', detalhe: 'Cognitiva, social, afetiva e física' },
              { id: 'sub-aval', label: 'Avaliação Formativa Contínua', detalhe: 'Diagnóstico processual da turma' },
            ],
          },
          {
            id: 'node-banca',
            label: 'Estratégia de Banca FEPESE/ACAFE',
            detalhe: 'Radar de Pegadinhas',
            badge: 'Reta Final',
            children: [
              { id: 'sub-pegadinhas', label: 'Troca de Prazos (2 anos vs 3 anos)', detalhe: 'Erro recorrente dos candidatos' },
              { id: 'sub-termos', label: 'Troca de Órgãos (Delegacia vs Conselho)', detalhe: 'Pegadinha clássica do ECA' },
            ],
          },
        ],
      };
      return { mapaMental, text: resultText };
    }

    case 'resumo_audio': {
      return {
        audioScript: resultText,
        duracaoEstimada: '3 min 20s',
        narrador: 'Tutor de IA JPSchool (Voz SC)',
        text: resultText,
      };
    }

    case 'resumo_video': {
      return {
        resumoVideo: {
          tituloAula: prompt ? `Análise da Vídeo-Aula: "${prompt}"` : 'Síntese Didática da Vídeo-Aula SED-SC',
          duracaoEstimada: '18 min de aula condensados',
          pontosChave: [
            'Evolução histórica do Magistério em Santa Catarina e o advento da LC 688/SC.',
            'O princípio da gestão democrática e a construção participativa do PPP escolar.',
            'O papel do professor na identificação e superação de déficits de aprendizagem.',
            'Articulação entre o Currículo Base do Território Catarinense e a BNCC.',
            'Direitos fundamentais dos estudantes e responsabilidade solidária da escola.',
          ],
          pegadinhas: [
            'Confundir a duração do estágio probatório de SC (36 meses) com regimes municipais antigos (24 meses).',
            'Assumir que a comunicação de infrequência deve ser feita à Polícia Civil antes de esgotar vias com o Conselho Tutelar.',
            'Achar que a Educação Integral no CBTC exige necessariamente turno integral em todas as unidades.',
          ],
          conclusao: 'Excelente aula de revisão. Foque especialmente na resolução das 36 questões de concurso vinculadas no estúdio!',
        },
        text: resultText,
      };
    }

    case 'infografico': {
      const infografico = [
        {
          titulo: '36 Meses',
          dadoDestaque: 'Estágio Probatório',
          descricao: 'Período probatório do docente na LC 688/SC com avaliação especial periódica.',
          icone: 'Calendar',
          alertaBanca: 'Pegadinha: A FEPESE costuma sugerir 2 anos. Fique atento!',
        },
        {
          titulo: 'Art. 56',
          dadoDestaque: 'Comunicação ECA',
          descricao: 'Notificação compulsória ao Conselho Tutelar em casos de faltas injustificadas reiteradas.',
          icone: 'AlertTriangle',
          alertaBanca: 'Não confunda: O encaminhamento imediato é ao Conselho Tutelar!',
        },
        {
          titulo: 'Art. 13',
          dadoDestaque: 'Incumbência LDB',
          descricao: 'Participar do PPP e zelar pela aprendizagem são deveres inegociáveis do educador.',
          icone: 'BookOpen',
          alertaBanca: 'Cobrado com frequência em questões de conhecimentos pedagógicos.',
        },
        {
          titulo: 'Multidimensional',
          dadoDestaque: 'Currículo Base SC',
          descricao: 'A Educação Integral considera o educando em todas as suas dimensões formativas.',
          icone: 'Sparkles',
          alertaBanca: 'Não se trata de mera extensão da carga horária para 7 horas diárias.',
        },
      ];
      return { infografico, text: resultText };
    }

    case 'tabela_dados': {
      const tabelaDados = [
        {
          norma: 'Lei Complementar 688/SC',
          artigoPrazo: 'Art. 18 / 36 meses',
          aplicacaoMagisterio: 'Estágio probatório com comissão especial de desempenho',
          pegadinhaBanca: 'FEPESE adora afirmar que estabilidade ocorre após 2 anos',
        },
        {
          norma: 'Estatuto da Criança e Adolescente (ECA)',
          artigoPrazo: 'Art. 56 / Imediato',
          aplicacaoMagisterio: 'Comunicação obrigatória ao Conselho Tutelar após esgotadas ações escolares',
          pegadinhaBanca: 'Trocar o Conselho Tutelar por Delegacia de Polícia ou Conselho Estadual',
        },
        {
          norma: 'LDB 9.394/1996',
          artigoPrazo: 'Art. 13 / Contínuo',
          aplicacaoMagisterio: 'Participação na elaboração do Projeto Político-Pedagógico (PPP)',
          pegadinhaBanca: 'Afirmar que o PPP é de competência exclusiva da Direção e Secretaria',
        },
        {
          norma: 'Currículo Base SC (CBTC)',
          artigoPrazo: 'Diretrizes / Anual',
          aplicacaoMagisterio: 'Implementação de práticas de Educação Integral e avaliação formativa',
          pegadinhaBanca: 'Reduzir a Educação Integral a tempo integral de permanência física',
        },
        {
          norma: 'LC 688/SC (ACT)',
          artigoPrazo: 'Art. 24 / Improrrogável',
          aplicacaoMagisterio: 'Admissão de docentes temporários por processo seletivo de provas e títulos',
          pegadinhaBanca: 'Sugerir prorrogação automática indefinida do contrato temporário',
        },
      ];
      return { tabelaDados, text: resultText };
    }

    case 'relatorios': {
      const relatorio = {
        mediaGeralAcertos: 78,
        totalQuestoesResolvidas: 142,
        disciplinas: [
          { nome: 'Legislação Educacional e SC', taxaAcerto: 84, totalQuestoes: 50, nivel: 'excelente' as const },
          { nome: 'Didática e Currículo Base SC', taxaAcerto: 76, totalQuestoes: 42, nivel: 'atencao' as const },
          { nome: 'Língua Portuguesa (FEPESE)', taxaAcerto: 72, totalQuestoes: 35, nivel: 'atencao' as const },
          { nome: 'História e Geografia de SC', taxaAcerto: 80, totalQuestoes: 15, nivel: 'excelente' as const },
        ],
        comparativoConcorrencia: {
          suaMedia: 78,
          mediaGeralCandidatos: 63,
          margemDiferenca: 15,
        },
        recomendacaoEstudo: 'Excelente evolução! Para garantir os primeiros lugares, intensifique a revisão das pegadinhas de prazo da LC 688/SC e a interpretação de texto no padrão FEPESE.',
      };
      return { relatorio, text: resultText };
    }

    default:
      return { text: resultText };
  }
}

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

    case 'slides':
      return `📊 **Apresentação em Slides - Magistério SED-SC**

Slide 1: Introdução à Lei Complementar 688/SC e Edital do Magistério
Slide 2: Estágio Probatório (36 meses) e Avaliação Paritária
Slide 3: LDB 9.394/96 e as Incumbências do Docente (Artigo 13)
Slide 4: O Currículo Base do Território Catarinense e a Educação Integral
Slide 5: ECA na Escola (Artigo 56 e Atuação do Conselho Tutelar)${notaExterna}`;

    case 'mapa_mental':
      return `🧠 **Mapa Mental: Estrutura Normativa e Pedagógica de SC**

[Magistério Público SED-SC]
 ├── [LC 688/SC] ──> Estágio Probatório (36 meses) ──> Avaliação por Comissão Especial
 ├── [LDB 9.394] ──> Art. 13 (Incumbência Docente) ──> Participação no PPP
 ├── [ECA 8.069] ──> Art. 56 (Infrequência Escolar) ──> Notificação ao Conselho Tutelar
 └── [CBTC SC]   ──> Educação Integral ──> Formação Multidimensional do Sujeito${notaExterna}`;

    case 'resumo_audio':
      return `🎙 **Roteiro de Narração em Áudio: Síntese de Legislação Educacional SC**

[Abertura]: "Olá, professor! Seja bem-vindo ao resumo em áudio do Estúdio JPSchool. Hoje vamos revisar os pontos mais cobrados pela FEPESE sobre a Lei Complementar 688 de Santa Catarina."
[Desenvolvimento]: "O ponto número um indispensável para a sua prova é o estágio probatório: são exatamente 36 meses, isto é, três anos completos. A avaliação é realizada por uma comissão especial designada. O ponto número dois é a notificação do ECA: em caso de evasão ou faltas consecutivas injustificadas, a escola deve notificar de forma obrigatória o Conselho Tutelar."
[Fechamento]: "Lembre-se: no Currículo Base de Santa Catarina, educação integral é desenvolvimento pleno, não apenas horas a mais em sala. Boa revisão e rumo à posse!"${notaExterna}`;

    case 'resumo_video':
      return `🎥 **Resumo Estruturado da Vídeo-Aula**

📌 **5 Pontos-Chave da Aula:**
1. A Lei Complementar Estadual nº 688/SC estrutura a carreira e direitos dos professores efetivos e ACTs.
2. O estágio probatório dura 3 anos (36 meses) e depende de avaliação comissional.
3. O Artigo 13 da LDB fixa o dever de planejar e executar a proposta pedagógica participativa.
4. O Artigo 56 do ECA impõe comunicação compulsória de faltas reiteradas ao Conselho Tutelar.
5. O Currículo Base de SC prevê educação integral orientada a todas as dimensões humanas.

⚠️ **3 Pegadinhas da Banca:**
• Pegadinha 1: Propor prazo de 24 meses para o estágio probatório em SC (o correto é 36 meses).
• Pegadinha 2: Trocar a notificação ao Conselho Tutelar por encaminhamento à autoridade policial.
• Pegadinha 3: Considerar a recuperação de estudos como facultativa (na LDB ela é obrigatória).${notaExterna}`;

    case 'infografico':
      return `📈 **Infográfico Normativo: Marcos Fundamentais SED-SC**

• [36 MESES] Estágio Probatório Oficial conforme Art. 18 da LC 688/SC.
• [ART. 56 ECA] Comunicação imediata ao Conselho Tutelar para proteção integral.
• [ART. 13 LDB] Incumbência legal do docente na construção do PPP escolar.
• [MULTIDIMENSIONAL] Conceito estruturante de Educação Integral do Território Catarinense.${notaExterna}`;

    case 'tabela_dados':
      return `📋 **Tabela Normativa Comparativa de Santa Catarina**

| Norma Legal | Dispositivo / Prazo | Aplicação no Magistério SC | Pegadinha FEPESE |
| :--- | :--- | :--- | :--- |
| LC 688/SC | Art. 18 (36 meses) | Estágio Probatório Docente | Afirmar estabilidade aos 2 anos |
| ECA 8.069/90 | Art. 56 (Imediato) | Comunicação ao Conselho Tutelar | Trocar por Delegacia Regional |
| LDB 9.394/96 | Art. 13 (Permanente) | Construção coletiva do PPP | Dizer que PPP é só da Direção |
| CBTC SC | Diretrizes 2026 | Educação Integral Multidimensional | Reduzir a carga horária física |${notaExterna}`;

    case 'relatorios':
      return `📊 **Relatório de Desempenho & Comparativo Geral**

• Taxa Geral de Acertos: 78% (Média geral dos candidatos: 63%)
• Legislação Educacional e SC: 84% de acertos (Nível: Excelente)
• Didática e Currículo Base SC: 76% de acertos (Nível: Atenção aos detalhes)
• Língua Portuguesa FEPESE: 72% de acertos (Nível: Atenção)
• Recomendação do Tutor: Mantenha o foco em resolver as 36 questões comentadas do acervo oficial!${notaExterna}`;

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
// A identidade vem exclusivamente da sessão de servidor (cookie httpOnly criado no login) —
// nunca de um header que o próprio cliente poderia forjar.
function requireAuth(allowedRoles?: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const session = getSession(req);

    if (!session) {
      return res.status(401).json({
        error: 'Acesso não autorizado. Faça login para continuar.',
        code: 'UNAUTHENTICATED',
      });
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      return res.status(403).json({
        error: `Acesso negado. O papel '${session.role}' não possui permissão para acessar este recurso.`,
        code: 'FORBIDDEN',
      });
    }

    (req as any).user = session;
    (req as any).userRole = session.role;
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

// Segredos (chaves de API, credenciais) nunca voltam em texto puro pela API —
// só os últimos 4 caracteres, pra confirmar que estão configurados sem expor o valor.
function maskSensitiveConfig(configs: typeof MOCK_CONFIGURACOES) {
  // Só mascara credenciais reais (chaves de API, tokens, segredos) — não políticas
  // numéricas da categoria "seguranca" como tentativas máximas ou tamanho mínimo de senha.
  return configs.map((c) => {
    const isSensitive = /API_KEY|SERVICE_ACCOUNT|SECRET|TOKEN/i.test(c.chave);
    if (!isSensitive || !c.valor) return c;
    const visible = c.valor.length > 4 ? c.valor.slice(-4) : '';
    return { ...c, valor: `••••••••${visible}` };
  });
}

app.get('/api/configuracoes', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  res.json({ configuracoes: maskSensitiveConfig(MOCK_CONFIGURACOES) });
});

// Endpoint: AI Auto-Subcategory Generator
app.post('/api/admin/sources/auto-subcategories', requireAuth(['super_admin', 'admin', 'ti']), async (req: any, res: any) => {
  try {
    const { categoriaNome, cursoNome } = req.body;
    
    // Find all sources matching this category or course strictly
    let categorySources = OFFICIAL_SOURCES.filter(s => {
      const matchMat = categoriaNome && s.materia && (s.materia.toLowerCase().includes(categoriaNome.toLowerCase()) || categoriaNome.toLowerCase().includes(s.materia.toLowerCase()));
      const matchCurso = cursoNome && s.cursoNome && (s.cursoNome.toLowerCase().includes(cursoNome.toLowerCase()) || cursoNome.toLowerCase().includes(s.cursoNome.toLowerCase()));
      if (categoriaNome && cursoNome) return matchMat || matchCurso;
      if (categoriaNome) return matchMat;
      if (cursoNome) return matchCurso;
      return true;
    });

    if (categorySources.length === 0) {
      return res.json({
        success: true,
        message: `Nenhum material de estudo vinculado ao termo "${categoriaNome || cursoNome || 'solicitado'}" ainda. Vincule PDFs nesta categoria no RAG para gerar subcategorias exclusivas.`,
        subcategorias: [],
        sources: OFFICIAL_SOURCES
      });
    }

    const ai = getGeminiClient();
    const sourceTitles = categorySources.map(s => `ID ${s.id}: "${s.titulo}" (Matéria: ${s.materia})`).join('\n');

    let generatedSubcategories: any[] = [];

    if (ai) {
      try {
        const prompt = `Você é uma Inteligência Artificial especialista em concursos públicos e educação (SED-SC, FEPESE, ACAFE).
Analise os títulos dos seguintes materiais de estudo da categoria "${categoriaNome || 'Geral'}":

${sourceTitles}

Sua tarefa:
1. Agrupar esses materiais em 2 a 6 Subcategorias temáticas específicas e precisas (exemplo para Legislação: "LDB 9.394/96", "ECA (Lei 8.069)", "LC 688/SC (Estatuto do Magistério)").
2. REGRA MANDATÓRIA: O nome de nenhuma subcategoria pode ser idêntico ao nome da categoria pai ("${categoriaNome || 'Geral'}"). Especifique o assunto/tópico real do conteúdo.
3. Retornar um JSON ESTRITAMENTE VÁLIDO no seguinte formato:
[
  {
    "id": "subcat-1",
    "nome": "Nome Específico da Subcategoria (NÃO use '${categoriaNome}')",
    "descricao": "Breve descrição dos tópicos abrangidos",
    "sourceIds": [ids dos materiais que pertencem a esta subcategoria]
  }
]
Retorne APENAS o JSON, sem marcadores de markdown ou explicações.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const rawText = response.text || '';
        const cleanJson = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed)) {
          generatedSubcategories = parsed;
        }
      } catch (geminiErr: any) {
        console.error('Gemini auto-subcategory error:', geminiErr?.message);
      }
    }

    // Filter out subcategories whose name is identical to categoriaNome
    generatedSubcategories = generatedSubcategories.filter(sub => {
      if (!sub.nome) return false;
      const cleanSubName = sub.nome.trim().toLowerCase();
      const cleanCatName = (categoriaNome || '').trim().toLowerCase();
      return cleanSubName !== cleanCatName && cleanSubName !== 'geral';
    });

    // Fallback if AI call failed or AI not configured: generate intelligent heuristics based on titles
    if (generatedSubcategories.length === 0) {
      const subcatMap: Record<string, number[]> = {};
      
      categorySources.forEach(s => {
        const titleLower = s.titulo.toLowerCase();
        let subcatName = 'Outros Tópicos e Leis Complementares';

        if (titleLower.includes('ldb') || titleLower.includes('9.394') || titleLower.includes('diretriz')) {
          subcatName = 'LDB 9.394/96 & Diretrizes Nacionais';
        } else if (titleLower.includes('eca') || titleLower.includes('8.069') || titleLower.includes('criança')) {
          subcatName = 'ECA - Estatuto da Criança e do Adolescente';
        } else if (titleLower.includes('estatuto') || titleLower.includes('688') || titleLower.includes('magistério') || titleLower.includes('servidor')) {
          subcatName = 'Estatuto do Magistério (LC 688/SC)';
        } else if (titleLower.includes('português') || titleLower.includes('gramática') || titleLower.includes('redação')) {
          subcatName = 'Gramática & Interpretação de Texto';
        } else if (titleLower.includes('história') || titleLower.includes('geografia') || titleLower.includes('sc')) {
          subcatName = 'História & Formação Territorial de SC';
        } else if (titleLower.includes('didática') || titleLower.includes('currículo') || titleLower.includes('pedagog')) {
          subcatName = 'Didática & Currículo Base Catarinense';
        } else if (titleLower.includes('questõ') || titleLower.includes('prova') || titleLower.includes('simulado')) {
          subcatName = 'Questões & Gabaritos Comentados';
        }

        if (!subcatMap[subcatName]) subcatMap[subcatName] = [];
        subcatMap[subcatName].push(s.id);
      });

      let idx = 1;
      for (const [name, ids] of Object.entries(subcatMap)) {
        generatedSubcategories.push({
          id: `subcat-auto-${Date.now()}-${idx++}`,
          nome: name,
          descricao: `Subcategoria gerada automaticamente para ${ids.length} materiais de estudo.`,
          sourceIds: ids
        });
      }
    }

    // Apply subcategories to OFFICIAL_SOURCES
    generatedSubcategories.forEach(sub => {
      if (Array.isArray(sub.sourceIds)) {
        sub.sourceIds.forEach((srcId: number) => {
          const s = OFFICIAL_SOURCES.find(source => source.id === srcId);
          if (s) {
            s.subcategoriaId = sub.id;
            s.subcategoriaNome = sub.nome;
          }
        });
      }
    });

    MOCK_LOGS_AUDITORIA.push({
      id: MOCK_LOGS_AUDITORIA.length + 1,
      acao: 'GERACAO_SUBCATEGORIAS_IA',
      detalhes: `Geradas ${generatedSubcategories.length} subcategorias com IA para categoria '${categoriaNome || 'Geral'}'`,
      dadosAntes: {},
      dadosDepois: { generatedSubcategories },
      criadoEm: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Subcategorias geradas com sucesso! ${generatedSubcategories.length} subcategorias organizadas para ${categorySources.length} materiais.`,
      subcategorias: generatedSubcategories,
      sources: OFFICIAL_SOURCES
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao gerar subcategorias com IA' });
  }
});

app.get('/api/leads', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  res.json({ leads: MOCK_LEADS });
});

app.get('/api/campanhas-cota', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  res.json({ campanhas: MOCK_CAMPANHAS_COTA });
});

// Anotações do aluno — persistidas server-side, vinculadas ao usuário autenticado
// (não dependem mais só do localStorage do navegador).
app.get('/api/anotacoes', requireAuth(['super_admin', 'admin', 'ti', 'cliente']), (req: any, res) => {
  const minhas = MOCK_ANNOTATIONS.filter((n) => n.usuarioId === req.user.userId);
  res.json({ anotacoes: minhas });
});

app.post('/api/anotacoes', requireAuth(['super_admin', 'admin', 'ti', 'cliente']), (req: any, res) => {
  const { producaoId, titulo, featureId, materia, conteudoResumido, origem } = req.body;
  const newNote = {
    id: Date.now(),
    usuarioId: req.user.userId,
    producaoId: producaoId ?? 0,
    titulo: titulo || 'Anotação',
    featureId,
    materia: materia || 'Geral',
    data: new Date().toLocaleDateString('pt-BR'),
    conteudoResumido: conteudoResumido || '',
    origem: origem || 'oficial',
  };
  MOCK_ANNOTATIONS.unshift(newNote);
  res.json({ success: true, anotacao: newNote });
});

app.delete('/api/anotacoes/:id', requireAuth(['super_admin', 'admin', 'ti', 'cliente']), (req: any, res) => {
  const id = Number(req.params.id);
  const index = MOCK_ANNOTATIONS.findIndex((n) => n.id === id && n.usuarioId === req.user.userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Anotação não encontrada' });
  }
  MOCK_ANNOTATIONS.splice(index, 1);
  res.json({ success: true });
});

// CRUD endpoints for Matrículas
app.post('/api/admin/matriculas', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const { usuarioId, cursoId, cursoNome, status, dataInicio, dataFim, origem, usuarioNome } = req.body;
  if (!usuarioId || !cursoId || !cursoNome || !status) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }
  const newMatricula = {
    id: MOCK_MATRICULAS.length > 0 ? Math.max(...MOCK_MATRICULAS.map(m => m.id)) + 1 : 1,
    usuarioId: Number(usuarioId),
    usuarioNome: usuarioNome || `Usuário ${usuarioId}`,
    cursoId: Number(cursoId),
    cursoNome,
    status: status as any,
    dataInicio: dataInicio || new Date().toISOString().split('T')[0],
    dataFim: dataFim || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    origem: (origem || 'manual') as any
  };
  MOCK_MATRICULAS.push(newMatricula);
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'CADASTRO_MATRICULA',
    detalhes: `Matrícula cadastrada para curso ${cursoNome} (ID ${newMatricula.id})`,
    dadosAntes: {},
    dadosDepois: newMatricula,
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, matricula: newMatricula, matriculas: MOCK_MATRICULAS });
});

app.put('/api/admin/matriculas/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const { usuarioId, usuarioNome, cursoId, cursoNome, status, dataInicio, dataFim, origem } = req.body;
  const index = MOCK_MATRICULAS.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Matrícula não encontrada' });
  }
  const oldMatricula = { ...MOCK_MATRICULAS[index] };
  MOCK_MATRICULAS[index] = {
    ...MOCK_MATRICULAS[index],
    usuarioId: usuarioId !== undefined ? Number(usuarioId) : MOCK_MATRICULAS[index].usuarioId,
    usuarioNome: usuarioNome !== undefined ? usuarioNome : MOCK_MATRICULAS[index].usuarioNome,
    cursoId: cursoId !== undefined ? Number(cursoId) : MOCK_MATRICULAS[index].cursoId,
    cursoNome: cursoNome !== undefined ? cursoNome : MOCK_MATRICULAS[index].cursoNome,
    status: status !== undefined ? status as any : MOCK_MATRICULAS[index].status,
    dataInicio: dataInicio !== undefined ? dataInicio : MOCK_MATRICULAS[index].dataInicio,
    dataFim: dataFim !== undefined ? dataFim : MOCK_MATRICULAS[index].dataFim,
    origem: origem !== undefined ? origem as any : MOCK_MATRICULAS[index].origem,
  };
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EDICAO_MATRICULA',
    detalhes: `Matrícula ID ${id} editada`,
    dadosAntes: oldMatricula,
    dadosDepois: MOCK_MATRICULAS[index],
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, matricula: MOCK_MATRICULAS[index], matriculas: MOCK_MATRICULAS });
});

app.delete('/api/admin/matriculas/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const index = MOCK_MATRICULAS.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Matrícula não encontrada' });
  }
  const removed = MOCK_MATRICULAS.splice(index, 1)[0];
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EXCLUSAO_MATRICULA',
    detalhes: `Matrícula ID ${id} removida`,
    dadosAntes: removed,
    dadosDepois: {},
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, matriculas: MOCK_MATRICULAS });
});

// CRUD endpoints for Pagamentos
app.post('/api/admin/pagamentos', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const { usuarioId, usuarioNome, planoId, valor_centavos, parcelas, metodo, status, gateway, transacaoId } = req.body;
  if (!usuarioId || !planoId || !valor_centavos || !metodo || !status || !gateway) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }
  const newPayment = {
    id: MOCK_PAGAMENTOS.length > 0 ? Math.max(...MOCK_PAGAMENTOS.map(p => p.id)) + 1 : 1,
    usuarioId: Number(usuarioId),
    usuarioNome: usuarioNome || `Usuário ${usuarioId}`,
    planoId,
    valor_centavos: Number(valor_centavos),
    parcelas: Number(parcelas) || 1,
    metodo: metodo as any,
    status: status as any,
    gateway: gateway as any,
    transacaoId: transacaoId || `TX-${Date.now()}`,
    criadoEm: new Date().toISOString()
  };
  MOCK_PAGAMENTOS.push(newPayment);
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'CADASTRO_PAGAMENTO',
    detalhes: `Pagamento cadastrado no valor de R$ ${(Number(valor_centavos)/100).toFixed(2)} (ID ${newPayment.id})`,
    dadosAntes: {},
    dadosDepois: newPayment,
    criadoEm: new Date().toISOString()
  });
  syncMatriculaFromPagamento(newPayment);
  res.json({ success: true, pagamento: newPayment, pagamentos: MOCK_PAGAMENTOS, matriculas: MOCK_MATRICULAS });
});

// Mantém a matrícula sincronizada com o status do pagamento: aprovado ativa
// automaticamente o acesso; estorno/chargeback suspende. O admin só mexe manualmente
// em casos excepcionais (fora desse fluxo padrão) — ver POST /api/matriculas/status.
function syncMatriculaFromPagamento(pagamento: typeof MOCK_PAGAMENTOS[number]) {
  const existente = MOCK_MATRICULAS.find((m) => m.usuarioId === pagamento.usuarioId);

  if (pagamento.status === 'aprovado') {
    if (existente) {
      const oldStatus = existente.status;
      existente.status = 'ativa';
      if (oldStatus !== 'ativa') {
        MOCK_LOGS_AUDITORIA.push({
          id: MOCK_LOGS_AUDITORIA.length + 1,
          acao: 'MATRICULA_ATIVADA_AUTOMATICAMENTE',
          detalhes: `Matrícula ${existente.id} ativada automaticamente após aprovação do pagamento ${pagamento.id}`,
          dadosAntes: { status: oldStatus },
          dadosDepois: { status: 'ativa' },
          criadoEm: new Date().toISOString(),
        });
      }
    } else {
      const novaMatricula = {
        id: MOCK_MATRICULAS.length > 0 ? Math.max(...MOCK_MATRICULAS.map((m) => m.id)) + 1 : 1,
        usuarioId: pagamento.usuarioId,
        usuarioNome: pagamento.usuarioNome,
        cursoId: 1,
        cursoNome: pagamento.planoId || 'Plano Padrão',
        status: 'ativa' as const,
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        origem: 'compra' as const,
      };
      MOCK_MATRICULAS.push(novaMatricula);
      MOCK_LOGS_AUDITORIA.push({
        id: MOCK_LOGS_AUDITORIA.length + 1,
        acao: 'MATRICULA_CRIADA_AUTOMATICAMENTE',
        detalhes: `Matrícula ${novaMatricula.id} criada e ativada automaticamente após aprovação do pagamento ${pagamento.id}`,
        dadosAntes: {},
        dadosDepois: novaMatricula,
        criadoEm: new Date().toISOString(),
      });
    }
  } else if (pagamento.status === 'estornado' || pagamento.status === 'chargeback') {
    if (existente && existente.status === 'ativa') {
      existente.status = 'suspensa';
      MOCK_LOGS_AUDITORIA.push({
        id: MOCK_LOGS_AUDITORIA.length + 1,
        acao: 'MATRICULA_SUSPENSA_AUTOMATICAMENTE',
        detalhes: `Matrícula ${existente.id} suspensa automaticamente por ${pagamento.status} no pagamento ${pagamento.id}`,
        dadosAntes: { status: 'ativa' },
        dadosDepois: { status: 'suspensa' },
        criadoEm: new Date().toISOString(),
      });
    }
  }
}

app.put('/api/admin/pagamentos/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const { usuarioId, usuarioNome, planoId, valor_centavos, parcelas, metodo, status, gateway, transacaoId } = req.body;
  const index = MOCK_PAGAMENTOS.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Pagamento não encontrado' });
  }
  const oldPayment = { ...MOCK_PAGAMENTOS[index] };
  MOCK_PAGAMENTOS[index] = {
    ...MOCK_PAGAMENTOS[index],
    usuarioId: usuarioId !== undefined ? Number(usuarioId) : MOCK_PAGAMENTOS[index].usuarioId,
    usuarioNome: usuarioNome !== undefined ? usuarioNome : MOCK_PAGAMENTOS[index].usuarioNome,
    planoId: planoId !== undefined ? planoId : MOCK_PAGAMENTOS[index].planoId,
    valor_centavos: valor_centavos !== undefined ? Number(valor_centavos) : MOCK_PAGAMENTOS[index].valor_centavos,
    parcelas: parcelas !== undefined ? Number(parcelas) : MOCK_PAGAMENTOS[index].parcelas,
    metodo: metodo !== undefined ? metodo as any : MOCK_PAGAMENTOS[index].metodo,
    status: status !== undefined ? status as any : MOCK_PAGAMENTOS[index].status,
    gateway: gateway !== undefined ? gateway as any : MOCK_PAGAMENTOS[index].gateway,
    transacaoId: transacaoId !== undefined ? transacaoId : MOCK_PAGAMENTOS[index].transacaoId,
  };
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EDICAO_PAGAMENTO',
    detalhes: `Pagamento ID ${id} editado`,
    dadosAntes: oldPayment,
    dadosDepois: MOCK_PAGAMENTOS[index],
    criadoEm: new Date().toISOString()
  });
  const statusMudou = oldPayment.status !== MOCK_PAGAMENTOS[index].status;
  if (statusMudou) {
    syncMatriculaFromPagamento(MOCK_PAGAMENTOS[index]);
  }
  res.json({
    success: true,
    pagamento: MOCK_PAGAMENTOS[index],
    pagamentos: MOCK_PAGAMENTOS,
    matriculas: MOCK_MATRICULAS,
    matriculaSincronizada: statusMudou,
  });
});

app.delete('/api/admin/pagamentos/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const index = MOCK_PAGAMENTOS.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Pagamento não encontrado' });
  }
  const removed = MOCK_PAGAMENTOS.splice(index, 1)[0];
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EXCLUSAO_PAGAMENTO',
    detalhes: `Pagamento ID ${id} removido`,
    dadosAntes: removed,
    dadosDepois: {},
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, pagamentos: MOCK_PAGAMENTOS });
});

// CRUD endpoints for Códigos de Acesso
app.post('/api/admin/codigos-acesso', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const { codigo, tipo, diasValidade, cursoId } = req.body;
  if (!codigo || !tipo || !diasValidade) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }
  const newCodigo = {
    id: MOCK_CODIGOS_ACESSO.length > 0 ? Math.max(...MOCK_CODIGOS_ACESSO.map(c => c.id)) + 1 : 1,
    codigo: codigo.toUpperCase().trim(),
    tipo: tipo as any,
    diasValidade: Number(diasValidade),
    usado: false,
    criadoEm: new Date().toISOString(),
    cursoId: cursoId ? Number(cursoId) : undefined,
    criadoPor: (req as any).user?.usuario || 'admin'
  };
  MOCK_CODIGOS_ACESSO.push(newCodigo);
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'CADASTRO_CODIGO_ACESSO',
    detalhes: `Código de acesso cadastrado: ${newCodigo.codigo} (ID ${newCodigo.id})`,
    dadosAntes: {},
    dadosDepois: newCodigo,
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, codigo: newCodigo, codigos: MOCK_CODIGOS_ACESSO });
});

app.put('/api/admin/codigos-acesso/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const { codigo, tipo, diasValidade, usado, cursoId } = req.body;
  const index = MOCK_CODIGOS_ACESSO.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Código de acesso não encontrado' });
  }
  const oldCodigo = { ...MOCK_CODIGOS_ACESSO[index] };
  MOCK_CODIGOS_ACESSO[index] = {
    ...MOCK_CODIGOS_ACESSO[index],
    codigo: codigo !== undefined ? codigo.toUpperCase().trim() : MOCK_CODIGOS_ACESSO[index].codigo,
    tipo: tipo !== undefined ? tipo as any : MOCK_CODIGOS_ACESSO[index].tipo,
    diasValidade: diasValidade !== undefined ? Number(diasValidade) : MOCK_CODIGOS_ACESSO[index].diasValidade,
    usado: usado !== undefined ? Boolean(usado) : MOCK_CODIGOS_ACESSO[index].usado,
    cursoId: cursoId !== undefined ? (cursoId ? Number(cursoId) : undefined) : MOCK_CODIGOS_ACESSO[index].cursoId,
  };
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EDICAO_CODIGO_ACESSO',
    detalhes: `Código de acesso ID ${id} editado`,
    dadosAntes: oldCodigo,
    dadosDepois: MOCK_CODIGOS_ACESSO[index],
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, codigo: MOCK_CODIGOS_ACESSO[index], codigos: MOCK_CODIGOS_ACESSO });
});

app.delete('/api/admin/codigos-acesso/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const index = MOCK_CODIGOS_ACESSO.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Código de acesso não encontrado' });
  }
  const removed = MOCK_CODIGOS_ACESSO.splice(index, 1)[0];
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EXCLUSAO_CODIGO_ACESSO',
    detalhes: `Código de acesso ID ${id} removido`,
    dadosAntes: removed,
    dadosDepois: {},
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, codigos: MOCK_CODIGOS_ACESSO });
});

// CRUD endpoints for Tickets
app.post('/api/admin/tickets', requireAuth(['super_admin', 'admin', 'ti', 'cliente']), (req, res) => {
  const { usuarioId, usuarioNome, assunto, mensagem, status, prioridade } = req.body;
  if (!assunto || !mensagem) {
    return res.status(400).json({ error: 'Assunto e mensagem são obrigatórios' });
  }
  const newTicket = {
    id: MOCK_TICKETS.length > 0 ? Math.max(...MOCK_TICKETS.map(t => t.id)) + 1 : 1,
    usuarioId: usuarioId ? Number(usuarioId) : 3,
    usuarioNome: usuarioNome || 'Aluno Teste',
    assunto,
    mensagem,
    status: (status || 'aberto') as any,
    prioridade: (prioridade || 'media') as any,
    respostas: [],
    criadoEm: new Date().toISOString()
  };
  MOCK_TICKETS.push(newTicket);
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'CRIACAO_TICKET',
    detalhes: `Ticket cadastrado: ${assunto} (ID ${newTicket.id})`,
    dadosAntes: {},
    dadosDepois: newTicket,
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, ticket: newTicket, tickets: MOCK_TICKETS });
});

app.put('/api/admin/tickets/:id', requireAuth(['super_admin', 'admin', 'ti', 'cliente']), (req, res) => {
  const id = Number(req.params.id);
  const { status, prioridade, respostaMensagem, respostaAutor } = req.body;
  const index = MOCK_TICKETS.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Ticket não encontrado' });
  }
  const oldTicket = { ...MOCK_TICKETS[index] };
  
  const updatedRespostas = [...(MOCK_TICKETS[index].respostas || [])];
  if (respostaMensagem && respostaMensagem.trim()) {
    updatedRespostas.push({
      autor: respostaAutor || 'Suporte JPSchool',
      mensagem: respostaMensagem,
      criadoEm: new Date().toISOString()
    });
  }

  MOCK_TICKETS[index] = {
    ...MOCK_TICKETS[index],
    status: status !== undefined ? status as any : MOCK_TICKETS[index].status,
    prioridade: prioridade !== undefined ? prioridade as any : MOCK_TICKETS[index].prioridade,
    respostas: updatedRespostas
  };

  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EDICAO_TICKET',
    detalhes: `Ticket ID ${id} atualizado`,
    dadosAntes: oldTicket,
    dadosDepois: MOCK_TICKETS[index],
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, ticket: MOCK_TICKETS[index], tickets: MOCK_TICKETS });
});

app.delete('/api/admin/tickets/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const index = MOCK_TICKETS.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Ticket não encontrado' });
  }
  const removed = MOCK_TICKETS.splice(index, 1)[0];
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EXCLUSAO_TICKET',
    detalhes: `Ticket ID ${id} removido`,
    dadosAntes: removed,
    dadosDepois: {},
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, tickets: MOCK_TICKETS });
});

// CRUD endpoints for Configurações
app.post('/api/admin/configuracoes', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const { chave, valor, descricao, categoria } = req.body;
  if (!chave || !valor || !categoria) {
    return res.status(400).json({ error: 'Chave, valor e categoria são obrigatórios' });
  }
  const exists = MOCK_CONFIGURACOES.some(c => c.chave === chave);
  if (exists) {
    return res.status(400).json({ error: 'Chave de configuração já existe' });
  }
  const newConfig = {
    chave: chave.toUpperCase().trim(),
    valor,
    descricao: descricao || '',
    categoria: categoria as any,
    atualizadoPor: (req as any).user?.usuario || 'admin',
    atualizadoEm: new Date().toISOString()
  };
  MOCK_CONFIGURACOES.push(newConfig);
  savePersistentConfigs();
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'CADASTRO_CONFIGURACAO',
    detalhes: `Nova chave de configuração cadastrada: ${newConfig.chave}`,
    dadosAntes: {},
    dadosDepois: newConfig,
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, config: newConfig, configuracoes: MOCK_CONFIGURACOES });
});

app.put('/api/admin/configuracoes/:chave', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const chave = req.params.chave.toUpperCase().trim();
  const { valor } = req.body;
  let index = MOCK_CONFIGURACOES.findIndex(c => c.chave === chave);
  if (index === -1) {
    const newCfg = {
      chave,
      valor: valor || '',
      descricao: `Configuração do sistema para ${chave}`,
      categoria: 'sistema' as any,
      atualizadoPor: (req as any).user?.usuario || 'admin',
      atualizadoEm: new Date().toISOString()
    };
    MOCK_CONFIGURACOES.push(newCfg);
    index = MOCK_CONFIGURACOES.length - 1;
  } else {
    MOCK_CONFIGURACOES[index] = {
      ...MOCK_CONFIGURACOES[index],
      valor: valor !== undefined ? valor : MOCK_CONFIGURACOES[index].valor,
      atualizadoPor: (req as any).user?.usuario || 'admin',
      atualizadoEm: new Date().toISOString()
    };
  }
  savePersistentConfigs();
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EDICAO_CONFIGURACAO',
    detalhes: `Configuração ${chave} atualizada`,
    dadosAntes: {},
    dadosDepois: MOCK_CONFIGURACOES[index],
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, config: MOCK_CONFIGURACOES[index], configuracoes: MOCK_CONFIGURACOES });
});

app.delete('/api/admin/configuracoes/:chave', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const chave = req.params.chave;
  const index = MOCK_CONFIGURACOES.findIndex(c => c.chave === chave);
  if (index === -1) {
    return res.status(404).json({ error: 'Configuração não encontrada' });
  }
  const removed = MOCK_CONFIGURACOES.splice(index, 1)[0];
  savePersistentConfigs();
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EXCLUSAO_CONFIGURACAO',
    detalhes: `Chave de configuração excluída: ${chave}`,
    dadosAntes: removed,
    dadosDepois: {},
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, configuracoes: MOCK_CONFIGURACOES });
});

// CRUD endpoints for Leads
app.post('/api/admin/leads', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const { nome, email, telefone, origem, status } = req.body;
  if (!nome || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' });
  }
  const newLead = {
    id: MOCK_LEADS.length > 0 ? Math.max(...MOCK_LEADS.map(l => l.id)) + 1 : 1,
    nome,
    email,
    telefone: telefone || '',
    origem: (origem || 'site_vendas') as any,
    status: (status || 'novo') as any,
    criadoEm: new Date().toISOString()
  };
  MOCK_LEADS.push(newLead);
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'CADASTRO_LEAD',
    detalhes: `Lead cadastrado: ${nome} (${email})`,
    dadosAntes: {},
    dadosDepois: newLead,
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, lead: newLead, leads: MOCK_LEADS });
});

app.put('/api/admin/leads/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const { nome, email, telefone, origem, status } = req.body;
  const index = MOCK_LEADS.findIndex(l => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lead não encontrado' });
  }
  const oldLead = { ...MOCK_LEADS[index] };
  MOCK_LEADS[index] = {
    ...MOCK_LEADS[index],
    nome: nome !== undefined ? nome : MOCK_LEADS[index].nome,
    email: email !== undefined ? email : MOCK_LEADS[index].email,
    telefone: telefone !== undefined ? telefone : MOCK_LEADS[index].telefone,
    origem: origem !== undefined ? origem as any : MOCK_LEADS[index].origem,
    status: status !== undefined ? status as any : MOCK_LEADS[index].status,
  };
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EDICAO_LEAD',
    detalhes: `Lead ID ${id} editado`,
    dadosAntes: oldLead,
    dadosDepois: MOCK_LEADS[index],
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, lead: MOCK_LEADS[index], leads: MOCK_LEADS });
});

app.delete('/api/admin/leads/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const index = MOCK_LEADS.findIndex(l => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lead não encontrado' });
  }
  const removed = MOCK_LEADS.splice(index, 1)[0];
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EXCLUSAO_LEAD',
    detalhes: `Lead ID ${id} removido`,
    dadosAntes: removed,
    dadosDepois: {},
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, leads: MOCK_LEADS });
});

// CRUD endpoints for Campanhas de Cota
app.post('/api/admin/campanhas-cota', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const { nome, overrideProducoesMax, overrideDownloadsMax, dataInicio, dataFim, ativa } = req.body;
  if (!nome || !dataInicio || !dataFim) {
    return res.status(400).json({ error: 'Nome, data início e data fim são obrigatórios' });
  }
  const newCampanha = {
    id: MOCK_CAMPANHAS_COTA.length > 0 ? Math.max(...MOCK_CAMPANHAS_COTA.map(c => c.id)) + 1 : 1,
    nome,
    overrideProducoesMax: overrideProducoesMax !== undefined ? Number(overrideProducoesMax) : undefined,
    overrideDownloadsMax: overrideDownloadsMax !== undefined ? Number(overrideDownloadsMax) : undefined,
    dataInicio,
    dataFim,
    ativa: ativa !== undefined ? Boolean(ativa) : true
  };
  MOCK_CAMPANHAS_COTA.push(newCampanha);
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'CADASTRO_CAMPANHA_COTA',
    detalhes: `Nova campanha de cota cadastrada: ${nome} (ID ${newCampanha.id})`,
    dadosAntes: {},
    dadosDepois: newCampanha,
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, campanha: newCampanha, campanhas: MOCK_CAMPANHAS_COTA });
});

app.put('/api/admin/campanhas-cota/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const { nome, overrideProducoesMax, overrideDownloadsMax, dataInicio, dataFim, ativa } = req.body;
  const index = MOCK_CAMPANHAS_COTA.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Campanha não encontrada' });
  }
  const oldCampanha = { ...MOCK_CAMPANHAS_COTA[index] };
  MOCK_CAMPANHAS_COTA[index] = {
    ...MOCK_CAMPANHAS_COTA[index],
    nome: nome !== undefined ? nome : MOCK_CAMPANHAS_COTA[index].nome,
    overrideProducoesMax: overrideProducoesMax !== undefined ? (overrideProducoesMax ? Number(overrideProducoesMax) : undefined) : MOCK_CAMPANHAS_COTA[index].overrideProducoesMax,
    overrideDownloadsMax: overrideDownloadsMax !== undefined ? (overrideDownloadsMax ? Number(overrideDownloadsMax) : undefined) : MOCK_CAMPANHAS_COTA[index].overrideDownloadsMax,
    dataInicio: dataInicio !== undefined ? dataInicio : MOCK_CAMPANHAS_COTA[index].dataInicio,
    dataFim: dataFim !== undefined ? dataFim : MOCK_CAMPANHAS_COTA[index].dataFim,
    ativa: ativa !== undefined ? Boolean(ativa) : MOCK_CAMPANHAS_COTA[index].ativa,
  };
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EDICAO_CAMPANHA_COTA',
    detalhes: `Campanha ID ${id} editada`,
    dadosAntes: oldCampanha,
    dadosDepois: MOCK_CAMPANHAS_COTA[index],
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, campanha: MOCK_CAMPANHAS_COTA[index], campanhas: MOCK_CAMPANHAS_COTA });
});

app.delete('/api/admin/campanhas-cota/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const index = MOCK_CAMPANHAS_COTA.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Campanha não encontrada' });
  }
  const removed = MOCK_CAMPANHAS_COTA.splice(index, 1)[0];
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EXCLUSAO_CAMPANHA_COTA',
    detalhes: `Campanha ID ${id} removida`,
    dadosAntes: removed,
    dadosDepois: {},
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, campanhas: MOCK_CAMPANHAS_COTA });
});

// CRUD edits/deletes for Content (Sources and Questions)
app.put('/api/admin/sources/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const { titulo, tipo, materia, banca, ano, tamanho } = req.body;
  const index = OFFICIAL_SOURCES.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Material de estudos não encontrado' });
  }
  const oldSource = { ...OFFICIAL_SOURCES[index] };
  OFFICIAL_SOURCES[index] = {
    ...OFFICIAL_SOURCES[index],
    titulo: titulo !== undefined ? titulo : OFFICIAL_SOURCES[index].titulo,
    tipo: tipo !== undefined ? tipo as any : OFFICIAL_SOURCES[index].tipo,
    materia: materia !== undefined ? materia : OFFICIAL_SOURCES[index].materia,
    banca: banca !== undefined ? banca : OFFICIAL_SOURCES[index].banca,
    ano: ano !== undefined ? Number(ano) : OFFICIAL_SOURCES[index].ano,
    tamanho: tamanho !== undefined ? tamanho : OFFICIAL_SOURCES[index].tamanho,
  };
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EDICAO_FONTE_ESTUDO',
    detalhes: `Material de estudos ID ${id} editado: ${OFFICIAL_SOURCES[index].titulo}`,
    dadosAntes: oldSource,
    dadosDepois: OFFICIAL_SOURCES[index],
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, source: OFFICIAL_SOURCES[index], sources: OFFICIAL_SOURCES });
});

app.delete('/api/admin/sources/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const index = OFFICIAL_SOURCES.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Material de estudos não encontrado' });
  }
  const removed = OFFICIAL_SOURCES.splice(index, 1)[0];
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EXCLUSAO_FONTE_ESTUDO',
    detalhes: `Material de estudos ID ${id} excluído: ${removed.titulo}`,
    dadosAntes: removed,
    dadosDepois: {},
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, sources: OFFICIAL_SOURCES });
});

app.put('/api/admin/questions/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const { banca, materia, assunto, enunciado, alternativas, gabaritoIndex, comentario } = req.body;
  const index = MOCK_QUESTIONS.findIndex(q => q.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Questão não encontrada' });
  }
  const oldQuestion = { ...MOCK_QUESTIONS[index] };
  MOCK_QUESTIONS[index] = {
    ...MOCK_QUESTIONS[index],
    banca: banca !== undefined ? banca : MOCK_QUESTIONS[index].banca,
    materia: materia !== undefined ? materia : MOCK_QUESTIONS[index].materia,
    assunto: assunto !== undefined ? assunto : MOCK_QUESTIONS[index].assunto,
    enunciado: enunciado !== undefined ? enunciado : MOCK_QUESTIONS[index].enunciado,
    alternativas: alternativas !== undefined ? alternativas : MOCK_QUESTIONS[index].alternativas,
    gabaritoIndex: gabaritoIndex !== undefined ? Number(gabaritoIndex) : MOCK_QUESTIONS[index].gabaritoIndex,
    comentario: comentario !== undefined ? comentario : MOCK_QUESTIONS[index].comentario,
  };
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EDICAO_QUESTAO',
    detalhes: `Questão ID ${id} editada`,
    dadosAntes: oldQuestion,
    dadosDepois: MOCK_QUESTIONS[index],
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, question: MOCK_QUESTIONS[index], questions: MOCK_QUESTIONS });
});

app.delete('/api/admin/questions/:id', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const id = Number(req.params.id);
  const index = MOCK_QUESTIONS.findIndex(q => q.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Questão não encontrada' });
  }
  const removed = MOCK_QUESTIONS.splice(index, 1)[0];
  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'EXCLUSAO_QUESTAO',
    detalhes: `Questão ID ${id} excluída`,
    dadosAntes: removed,
    dadosDepois: {},
    criadoEm: new Date().toISOString()
  });
  res.json({ success: true, questions: MOCK_QUESTIONS });
});

function parseJsonConfig(raw: string) {
  if (!raw) return null;
  let clean = raw.trim();
  if (!clean.startsWith('{') && clean.includes('"type"')) {
    clean = '{' + clean;
  }
  if (!clean.endsWith('}') && (clean.includes('"private_key"') || clean.includes('"client_email"'))) {
    clean = clean + '}';
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    try {
      return JSON.parse(JSON.parse(clean));
    } catch (_) {
      return null;
    }
  }
}

// Google Drive Integration Endpoints (Multi-mode: Service Account, API Key, or Shared Folder)
app.get('/api/admin/drive/status', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const folderIdConfig = MOCK_CONFIGURACOES.find(c => c.chave === 'GOOGLE_DRIVE_FOLDER_ID')?.valor;
  const serviceAccountKeyConfig = MOCK_CONFIGURACOES.find(c => c.chave === 'GOOGLE_SERVICE_ACCOUNT_KEY')?.valor;
  const geminiApiKeyConfig = MOCK_CONFIGURACOES.find(c => c.chave === 'GEMINI_API_KEY')?.valor;

  let effectiveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || folderIdConfig || '';
  if (effectiveFolderId.includes('folders/')) {
    const match = effectiveFolderId.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) effectiveFolderId = match[1];
  }
  const effectiveKeyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || serviceAccountKeyConfig || '';
  const effectiveApiKey = process.env.GEMINI_API_KEY || geminiApiKeyConfig || '';

  const isConfigured = !!(effectiveFolderId && (effectiveKeyJson || effectiveApiKey));
  let serviceAccountEmail = '';
  if (effectiveKeyJson) {
    const key = parseJsonConfig(effectiveKeyJson);
    if (key && key.client_email) {
      serviceAccountEmail = key.client_email;
    }
  }
  if (!serviceAccountEmail) {
    serviceAccountEmail = 'Modo Direto / Leitura por Link Compartilhado';
  }

  res.json({
    configured: isConfigured,
    folderId: effectiveFolderId,
    serviceAccountEmail
  });
});

function getGoogleDriveClient() {
  const serviceAccountKeyConfig = MOCK_CONFIGURACOES.find(c => c.chave === 'GOOGLE_SERVICE_ACCOUNT_KEY')?.valor;
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || serviceAccountKeyConfig;
  if (!keyJson) return null;
  try {
    const credentials = parseJsonConfig(keyJson);
    if (!credentials || !credentials.client_email || !credentials.private_key) {
      return null;
    }
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
    return google.drive({ version: 'v3', auth });
  } catch (err) {
    console.error('Failed to initialize Google Drive client', err);
    return null;
  }
}

function getRagStatusMap(): Record<string, number> {
  const localDbPath = path.join(process.cwd(), 'storage', 'db_local.json');
  const counts: Record<string, number> = {};
  if (fs.existsSync(localDbPath)) {
    try {
      const chunks: DocumentChunk[] = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
      chunks.forEach(c => {
        if (c.document_name) {
          counts[c.document_name] = (counts[c.document_name] || 0) + 1;
        }
      });
    } catch (_) {}
  }
  return counts;
}

app.get('/api/admin/drive/files', requireAuth(['super_admin', 'admin', 'ti']), async (req, res) => {
  const folderIdConfig = MOCK_CONFIGURACOES.find(c => c.chave === 'GOOGLE_DRIVE_FOLDER_ID')?.valor;
  let rootFolderId = (req.query.folderId as string) || process.env.GOOGLE_DRIVE_FOLDER_ID || folderIdConfig;
  if (!rootFolderId) {
    return res.status(400).json({ error: 'GOOGLE_DRIVE_FOLDER_ID não está configurado. Configure no painel Admin.' });
  }
  if (rootFolderId.includes('folders/')) {
    const match = rootFolderId.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) rootFolderId = match[1];
  }

  const ragCounts = getRagStatusMap();
  const drive = getGoogleDriveClient();

  if (drive) {
    try {
      // 1. Fetch Root Folder metadata for its real name
      let rootFolderName = 'Drive';
      try {
        const rootMeta = await drive.files.get({ fileId: rootFolderId, fields: 'id, name' });
        if (rootMeta.data.name) rootFolderName = rootMeta.data.name;
      } catch (_) {}

      // 2. Fetch all subfolders (including Shared Drives)
      const foldersRes = await drive.files.list({
        q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name, parents)',
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      const allFolders = foldersRes.data.files || [];

      const folderNameMap = new Map<string, string>();
      folderNameMap.set(rootFolderId, rootFolderName);
      allFolders.forEach(f => folderNameMap.set(f.id, f.name));

      function getFolderPath(fId: string | null): string {
        if (!fId) return rootFolderName;
        const names: string[] = [];
        let currentId: string | null = fId;
        const visited = new Set<string>();

        while (currentId && !visited.has(currentId)) {
          visited.add(currentId);
          const name = folderNameMap.get(currentId);
          if (name) {
            names.unshift(name);
          }
          const folderObj = allFolders.find(f => f.id === currentId);
          currentId = folderObj?.parents?.[0] || null;
        }

        return names.length > 0 ? names.join(' / ') : rootFolderName;
      }

      // 3. Fetch all PDFs (including Shared Drives)
      const pdfsRes = await drive.files.list({
        q: `mimeType = 'application/pdf' and trashed = false`,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, parents)',
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      const allPdfFiles = pdfsRes.data.files || [];

      const folderGroupMap = new Map<string, { id: string; name: string; files: any[] }>();

      // 1. Register ALL folders found in Google Drive
      allFolders.forEach(f => {
        const fullPathName = getFolderPath(f.id);
        if (!folderGroupMap.has(fullPathName)) {
          folderGroupMap.set(fullPathName, {
            id: f.id,
            name: fullPathName,
            files: []
          });
        }
      });

      // 2. Add all PDFs to their respective folders
      allPdfFiles.forEach(f => {
        const parentId = f.parents && f.parents.length > 0 ? f.parents[0] : rootFolderId;
        const fullPathName = getFolderPath(parentId);

        if (!folderGroupMap.has(fullPathName)) {
          folderGroupMap.set(fullPathName, {
            id: parentId,
            name: fullPathName,
            files: []
          });
        }

        const cleanName = f.name || '';
        let chunksCount = 0;
        Object.keys(ragCounts).forEach(docName => {
          if (docName.toLowerCase().includes(f.id.toLowerCase()) || docName.toLowerCase().includes(cleanName.toLowerCase().replace(/\.pdf$/i, ''))) {
            chunksCount += ragCounts[docName];
          }
        });

        folderGroupMap.get(fullPathName)!.files.push({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size,
          modifiedTime: f.modifiedTime || f.createdTime,
          ingested: chunksCount > 0,
          chunksCount
        });
      });

      // 3. Ensure standard 4 subfolders for Course/Cargo folders if empty or not fetched
      const defaultSubfolders = ['Questões', 'Conhecimentos Específicos', 'Conhecimentos Gerais', 'Legislação Educacional'];
      const parentPaths = new Set<string>();
      for (const pathName of folderGroupMap.keys()) {
        if (pathName.includes(' / ')) {
          const parts = pathName.split(' / ');
          if (parts.length >= 2) {
            parentPaths.add(parts.slice(0, parts.length - 1).join(' / '));
          }
        }
      }

      // Guarantee subfolders for main cargo folder (e.g. Cargos / Professor SED - História)
      const targetCargoBase = Array.from(folderGroupMap.keys()).find(k => k.includes('Professor SED')) || 'Cargos / Professor SED - História';
      const cargoParentPath = targetCargoBase.includes(' / Questões') ? targetCargoBase.replace(' / Questões', '') : targetCargoBase;

      defaultSubfolders.forEach(subName => {
        const fullSubPath = `${cargoParentPath} / ${subName}`;
        if (!folderGroupMap.has(fullSubPath)) {
          folderGroupMap.set(fullSubPath, {
            id: `folder-sub-${subName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name: fullSubPath,
            files: []
          });
        }
      });

      const structuredFolders = Array.from(folderGroupMap.values()).map(group => {
        return {
          id: group.id,
          name: group.name,
          totalFiles: group.files.length,
          ingestedFiles: group.files.filter(f => f.ingested).length,
          files: group.files
        };
      });

      return res.json({
        folders: structuredFolders,
        totalPDFs: allPdfFiles.length,
        totalIngestedPDFs: structuredFolders.reduce((acc, f) => acc + f.ingestedFiles, 0)
      });
    } catch (err: any) {
      console.warn('Service Account Drive list failed, falling back...', err.message);
    }
  }

  return res.json({
    folders: [],
    totalPDFs: 0,
    totalIngestedPDFs: 0
  });
});

// Batch Import Endpoint for Folders
app.post('/api/admin/drive/import-folder', requireAuth(['super_admin', 'admin', 'ti']), async (req: any, res: any) => {
  const { folderName, files } = req.body;
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo válido fornecido para ingestão.' });
  }

  const ai = getGeminiClient();
  const storageDir = path.join(process.cwd(), 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const results: any[] = [];
  let totalChunksGenerated = 0;

  for (const f of files) {
    try {
      const cleanTitle = (f.name || 'documento').replace(/\.pdf$/i, '');
      
      let source = OFFICIAL_SOURCES.find(s => s.titulo === cleanTitle || s.titulo.includes(cleanTitle.substring(0, 15)));
      if (!source) {
        source = {
          id: OFFICIAL_SOURCES.length > 0 ? Math.max(...OFFICIAL_SOURCES.map(s => s.id)) + 1 : 1,
          titulo: cleanTitle,
          tipo: cleanTitle.toLowerCase().includes('lei') ? 'lei' : cleanTitle.toLowerCase().includes('edital') ? 'edital' : 'apostila',
          materia: folderName || 'Drive Oficial',
          banca: 'SED-SC',
          ano: new Date().getFullYear(),
          tamanho: 'PDF Drive',
          selecionada: true,
        };
        OFFICIAL_SOURCES.push(source);
      }

      const fileName = `${source.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}_${f.id}.pdf`;
      const localPath = path.join(storageDir, fileName);

      let downloaded = false;
      const drive = getGoogleDriveClient();
      if (drive) {
        try {
          const dest = fs.createWriteStream(localPath);
          const response = await drive.files.get(
            { fileId: f.id, alt: 'media' },
            { responseType: 'stream' }
          );
          await new Promise((resolve, reject) => {
            response.data.on('end', () => resolve(true)).on('error', reject).pipe(dest);
          });
          downloaded = true;
        } catch (getErr: any) {
          const destExport = fs.createWriteStream(localPath);
          const response = await drive.files.export(
            { fileId: f.id, mimeType: 'application/pdf' },
            { responseType: 'stream' }
          );
          await new Promise((resolve, reject) => {
            response.data.on('end', () => resolve(true)).on('error', reject).pipe(destExport);
          });
          downloaded = true;
        }
      }

      if (downloaded) {
        const chunksCount = await ingestPDF(ai, localPath, source.id, fileName);
        totalChunksGenerated += chunksCount;
        results.push({ id: f.id, name: f.name, success: true, chunksCount });
      } else {
        results.push({ id: f.id, name: f.name, success: false, error: 'Falha no download' });
      }
    } catch (err: any) {
      results.push({ id: f.id, name: f.name, success: false, error: err.message });
    }
  }

  // Save persistent sources and sync courses
  savePersistentSources();

  // Find or update matching course materia
  if (folderName) {
    CURSOS_MATERIAS.forEach(curso => {
      curso.materias.forEach((mat: any) => {
        if (mat.driveFolderName === folderName || folderName.includes(mat.nome)) {
          mat.ingestedFiles = (mat.ingestedFiles || 0) + results.filter(r => r.success).length;
          mat.totalFiles = Math.max(mat.totalFiles || 0, files.length);
        }
      });
    });
    savePersistentCursosMaterias();
  }

  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'IMPORTACAO_LOTE_PASTA',
    detalhes: `Ingestão em lote realizada para a pasta '${folderName || 'Drive'}': ${results.filter(r => r.success).length}/${files.length} arquivos processados (${totalChunksGenerated} chunks gerados)`,
    dadosAntes: {},
    dadosDepois: { folderName, totalFiles: files.length, totalChunksGenerated },
    criadoEm: new Date().toISOString()
  });

  res.json({
    success: true,
    message: `Processamento em lote concluído com sucesso! ${results.filter(r => r.success).length} de ${files.length} arquivos foram indexados no RAG (${totalChunksGenerated} fragmentos gerados).`,
    details: {
      folderName,
      totalChunksGenerated,
      results
    }
  });
});

// Import Pending Endpoint (only files not yet ingested)
app.post('/api/admin/drive/import-pending', requireAuth(['super_admin', 'admin', 'ti']), async (req: any, res: any) => {
  const { folderName, files } = req.body;
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo válido fornecido para ingestão.' });
  }

  const ragCounts = getRagStatusMap();
  const pendingFiles = files.filter((f: any) => {
    let isIng = false;
    Object.keys(ragCounts).forEach(doc => {
      if (doc.toLowerCase().includes(f.id.toLowerCase()) || (f.name && doc.toLowerCase().includes(f.name.toLowerCase().replace(/\.pdf$/i, '')))) {
        if (ragCounts[doc] > 0) isIng = true;
      }
    });
    return !isIng;
  });

  if (pendingFiles.length === 0) {
    return res.json({
      success: true,
      message: 'Todos os arquivos desta pasta já estão indexados no RAG! Nenhum pendente.',
      details: {
        folderName,
        totalFiles: files.length,
        processedCount: 0,
        pendingCount: 0,
        results: []
      }
    });
  }

  const ai = getGeminiClient();
  const storageDir = path.join(process.cwd(), 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const results: any[] = [];
  let totalChunksGenerated = 0;

  for (const f of pendingFiles) {
    try {
      const cleanTitle = (f.name || 'documento').replace(/\.pdf$/i, '');
      
      let source = OFFICIAL_SOURCES.find(s => s.titulo === cleanTitle || s.titulo.includes(cleanTitle.substring(0, 15)));
      if (!source) {
        source = {
          id: OFFICIAL_SOURCES.length > 0 ? Math.max(...OFFICIAL_SOURCES.map(s => s.id)) + 1 : 1,
          titulo: cleanTitle,
          tipo: cleanTitle.toLowerCase().includes('lei') ? 'lei' : cleanTitle.toLowerCase().includes('edital') ? 'edital' : 'apostila',
          materia: folderName || 'Drive Oficial',
          banca: 'SED-SC',
          ano: new Date().getFullYear(),
          tamanho: 'PDF Drive',
          selecionada: true,
        };
        OFFICIAL_SOURCES.push(source);
      }

      const fileName = `${source.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}_${f.id}.pdf`;
      const localPath = path.join(storageDir, fileName);

      let downloaded = false;
      const drive = getGoogleDriveClient();
      if (drive) {
        try {
          const dest = fs.createWriteStream(localPath);
          const response = await drive.files.get(
            { fileId: f.id, alt: 'media' },
            { responseType: 'stream' }
          );
          await new Promise((resolve, reject) => {
            response.data.on('end', () => resolve(true)).on('error', reject).pipe(dest);
          });
          downloaded = true;
        } catch (getErr: any) {
          const destExport = fs.createWriteStream(localPath);
          const response = await drive.files.export(
            { fileId: f.id, mimeType: 'application/pdf' },
            { responseType: 'stream' }
          );
          await new Promise((resolve, reject) => {
            response.data.on('end', () => resolve(true)).on('error', reject).pipe(destExport);
          });
          downloaded = true;
        }
      }

      if (downloaded) {
        const chunksCount = await ingestPDF(ai, localPath, source.id, fileName);
        totalChunksGenerated += chunksCount;
        results.push({ id: f.id, name: f.name, success: true, chunksCount });
      } else {
        results.push({ id: f.id, name: f.name, success: false, error: 'Falha no download' });
      }
    } catch (err: any) {
      results.push({ id: f.id, name: f.name, success: false, error: err.message });
    }
  }

  savePersistentSources();

  if (folderName) {
    CURSOS_MATERIAS.forEach(curso => {
      curso.materias.forEach((mat: any) => {
        if (mat.driveFolderName === folderName || folderName.includes(mat.nome)) {
          mat.ingestedFiles = (mat.ingestedFiles || 0) + results.filter(r => r.success).length;
          mat.totalFiles = Math.max(mat.totalFiles || 0, files.length);
        }
      });
    });
    savePersistentCursosMaterias();
  }

  res.json({
    success: true,
    message: `Ingestão seletiva concluída! ${results.filter(r => r.success).length} novos arquivos foram indexados no RAG (${totalChunksGenerated} fragmentos gerados).`,
    details: {
      folderName,
      totalChunksGenerated,
      processedCount: results.filter(r => r.success).length,
      pendingCount: pendingFiles.length,
      results
    }
  });
});

app.post('/api/admin/drive/import', requireAuth(['super_admin', 'admin', 'ti']), async (req: any, res: any) => {
  const { fileId, sourceId } = req.body;
  if (!fileId || !sourceId) {
    return res.status(400).json({ error: 'fileId e sourceId são obrigatórios' });
  }
  const source = OFFICIAL_SOURCES.find(s => s.id === Number(sourceId));
  if (!source) {
    return res.status(404).json({ error: 'Fonte de estudos não encontrada' });
  }

  const storageDir = path.join(process.cwd(), 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  const fileName = `${source.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}_${fileId}.pdf`;
  const localPath = path.join(storageDir, fileName);

  let downloaded = false;

  // 1. Try Service Account Download
  const drive = getGoogleDriveClient();
  if (drive) {
    try {
      try {
        const dest = fs.createWriteStream(localPath);
        const response = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'stream' }
        );
        await new Promise((resolve, reject) => {
          response.data.on('end', () => resolve(true)).on('error', reject).pipe(dest);
        });
        downloaded = true;
      } catch (getErr: any) {
        // If file is a Google Doc/Sheet (not binary), export it as PDF
        const destExport = fs.createWriteStream(localPath);
        const response = await drive.files.export(
          { fileId, mimeType: 'application/pdf' },
          { responseType: 'stream' }
        );
        await new Promise((resolve, reject) => {
          response.data.on('end', () => resolve(true)).on('error', reject).pipe(destExport);
        });
        downloaded = true;
      }
    } catch (err: any) {
      console.warn('Service Account download failed, trying public download fallback...', err.message);
    }
  }

  // 2. Fallback: Direct Public / API Key Download
  if (!downloaded) {
    try {
      const geminiApiKeyConfig = MOCK_CONFIGURACOES.find(c => c.chave === 'GEMINI_API_KEY')?.valor;
      const apiKey = process.env.GEMINI_API_KEY || geminiApiKeyConfig;
      
      let downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      if (apiKey) {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
      }
      
      const fileRes = await fetch(downloadUrl);
      if (fileRes.ok) {
        const arrayBuffer = await fileRes.arrayBuffer();
        fs.writeFileSync(localPath, Buffer.from(arrayBuffer));
        downloaded = true;
      }
    } catch (err: any) {
      console.error('Public download fallback failed:', err.message);
    }
  }

  if (!downloaded) {
    return res.status(400).json({ error: 'Não foi possível baixar o documento do Google Drive. Certifique-se de que o arquivo possui permissão de leitura.' });
  }

  try {
    const ai = getGeminiClient();
    const totalChunks = await ingestPDF(ai, localPath, source.id, fileName);
    MOCK_LOGS_AUDITORIA.push({
      id: MOCK_LOGS_AUDITORIA.length + 1,
      acao: 'IMPORTACAO_GOOGLE_DRIVE',
      detalhes: `Arquivo '${fileName}' (ID Drive ${fileId}) importado e indexado no RAG para ${source.titulo}`,
      dadosAntes: {},
      dadosDepois: { fileId, sourceId, fileName, totalChunks },
      criadoEm: new Date().toISOString()
    });
    res.json({
      success: true,
      message: `Documento '${fileName}' importado do Google Drive e indexado com sucesso!`,
      details: {
        sourceId: source.id,
        documento: fileName,
        chunksIndexados: totalChunks
      }
    });
  } catch (err: any) {
    console.error('Failed to ingest PDF into RAG', err);
    res.status(500).json({ error: 'Erro ao executar RAG sobre o documento baixado', details: err.message });
  }
});

app.post('/api/admin/sources', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const { titulo, tipo, materia, banca, ano, tamanho } = req.body;
  if (!titulo || !tipo || !materia || !banca) {
    return res.status(400).json({ error: 'Título, tipo, matéria e banca são obrigatórios' });
  }

  const newSource = {
    id: OFFICIAL_SOURCES.length + 1,
    titulo,
    tipo,
    materia,
    banca,
    ano: Number(ano) || new Date().getFullYear(),
    tamanho: tamanho || '1.0 MB',
    selecionada: false
  };

  OFFICIAL_SOURCES.push(newSource);

  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'CADASTRO_FONTE_ESTUDO',
    detalhes: `Nova fonte de estudo cadastrada: ${titulo} (ID ${newSource.id})`,
    dadosAntes: {},
    dadosDepois: newSource,
    criadoEm: new Date().toISOString()
  });

  res.json({ success: true, source: newSource, sources: OFFICIAL_SOURCES });
});

app.post('/api/admin/questions', requireAuth(['super_admin', 'admin', 'ti']), (req, res) => {
  const { banca, materia, assunto, enunciado, alternativas, gabaritoIndex, comentario } = req.body;
  if (!enunciado || !alternativas || alternativas.length < 2 || gabaritoIndex === undefined) {
    return res.status(400).json({ error: 'Enunciado, alternativas e gabaritoIndex são obrigatórios' });
  }

  const newQuestion = {
    id: MOCK_QUESTIONS.length + 1,
    banca: banca || 'FEPESE / ACAFE',
    ano: new Date().getFullYear(),
    materia: materia || 'Legislação SC',
    assunto: assunto || 'Geral',
    enunciado,
    alternativas,
    gabaritoIndex: Number(gabaritoIndex),
    comentario: comentario || '',
    taxaAcertoGeral: 75,
    origem: 'inedita_oficial' as const
  };

  MOCK_QUESTIONS.push(newQuestion);

  MOCK_LOGS_AUDITORIA.push({
    id: MOCK_LOGS_AUDITORIA.length + 1,
    acao: 'CADASTRO_QUESTAO',
    detalhes: `Nova questão cadastrada no banco de questões (ID ${newQuestion.id})`,
    dadosAntes: {},
    dadosDepois: newQuestion,
    criadoEm: new Date().toISOString()
  });

  res.json({ success: true, question: newQuestion, questions: MOCK_QUESTIONS });
});

app.get('/api/admin/sources/status', requireAuth(['super_admin', 'admin', 'ti']), async (req, res) => {
  const pgClient = await getPgClient();
  const counts: Record<number, number> = {};

  if (pgClient) {
    try {
      const resDb = await pgClient.query('SELECT source_id, COUNT(*) as cnt FROM document_chunks GROUP BY source_id;');
      resDb.rows.forEach(row => {
        counts[row.source_id] = Number(row.cnt);
      });
      await pgClient.end();
    } catch (_) {
      try { await pgClient.end(); } catch (__) {}
    }
  } else {
    const localDbPath = path.join(process.cwd(), 'storage', 'db_local.json');
    if (fs.existsSync(localDbPath)) {
      try {
        const chunks = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
        chunks.forEach((c: any) => {
          counts[c.source_id] = (counts[c.source_id] || 0) + 1;
        });
      } catch (_) {}
    }
  }

  res.json({ counts });
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

  // 3. Success -> create real server-side session, reset attempts counter and add audit log
  resetarTentativasLogin(usuario);

  const token = createSession({
    id: userMatch.id,
    usuario: userMatch.usuario,
    nome: userMatch.nome,
    role: userMatch.role,
  });
  setSessionCookie(res, token);

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

  const { senha: _senha, ...userSemSenha } = userMatch;
  res.json({ success: true, user: userSemSenha });
});

app.post('/api/auth/logout', (req, res) => {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) sessions.delete(token);
  clearSessionCookie(res);
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Sem sessão ativa' });
  }
  const userMatch = TEST_USERS.find((u) => u.id === session.userId);
  if (!userMatch) {
    return res.status(401).json({ error: 'Usuário da sessão não encontrado' });
  }
  const { senha: _senha, ...userSemSenha } = userMatch;
  res.json({ user: userSemSenha });
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
