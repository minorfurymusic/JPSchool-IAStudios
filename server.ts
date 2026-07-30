import express from 'express';
import path from 'path';
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

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'JPSchool IA Backend Engine' });
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

// Main Studio Execution Endpoint
app.post('/api/estudio/executar', async (req, res) => {
  try {
    resetQuotaIfNewDay();
    const { featureId, userPrompt, selectedSourceIds, isRetaFinal } = req.body;

    // Check quota
    if (userQuotas.producoesUsadas >= userQuotas.producoesMax) {
      return res.status(429).json({
        error: 'Cota diária de produções esgotada (5/5). Você atingiu o limite diário anti-pirataria do plano aluno. Renova às 00:00.',
      });
    }

    const selectedSources = OFFICIAL_SOURCES.filter((s) =>
      selectedSourceIds?.includes(s.id)
    );

    const sourcesSummary = selectedSources.length > 0
      ? selectedSources.map((s) => `• [Fonte oficial: ${s.titulo}, ${s.ano}] (${s.materia})`).join('\n')
      : '• [Fonte oficial: Edital Geral SED-SC 2026 e Lei Complementar 688/SC]';

    const ai = getGeminiClient();

    // RAG fallback simulation rules
    // Features in G4 like 'radar_pegadinhas', 'raio_x', 'questoes_500' do NOT allow web fallback
    const noFallbackFeatures = ['radar_pegadinhas', 'raio_x', 'questoes_500'];
    const allowsFallback = !noFallbackFeatures.includes(featureId);

    // Simulate whether prompt goes beyond official SC library
    const keywordsOutsideSc = ['federal', 'brás', 'são paulo', 'matemática avançada', 'geografia mundial'];
    const needsExternalFallback = allowsFallback && keywordsOutsideSc.some((kw) =>
      (userPrompt || '').toLowerCase().includes(kw)
    );

    let resultText = '';
    let origemType: 'oficial' | 'oficial+externo' | 'somente_externo' = needsExternalFallback
      ? 'oficial+externo'
      : 'oficial';

    const userBanca = selectedSources[0]?.banca || 'FEPESE / ACAFE';
    const globalSystemPrompt = `
Você é o Tutor JPSchool AI, especialista em concursos públicos de professores em Santa Catarina (SED-SC e Prefeituras).

REGRAS INVIOLÁVEIS DE CITAÇÃO E TRANSMISSÃO:
1. Use PRIORITARIAMENTE os TRECHOS DA BIBLIOTECA OFICIAL fornecidos:
${sourcesSummary}

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
          model: 'gemini-3.6-flash',
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

    // Increment quota on success
    userQuotas.producoesUsadas += 1;

    res.json({
      success: true,
      featureId,
      resultText,
      origem: origemType,
      cotasAtualizadas: userQuotas,
      trechos: [
        {
          texto: 'Conforme preceitua a Lei Complementar N° 688/SC e a LDB 9.394/96...',
          tipo: 'oficial',
          fonte: selectedSources[0]?.titulo || 'Edital SED-SC 2026',
          ano: 2026,
        },
        ...(needsExternalFallback
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
      return `💬 **Resposta do Tutor JPSchool AI**

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
    console.log(`JPSchool IA Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
