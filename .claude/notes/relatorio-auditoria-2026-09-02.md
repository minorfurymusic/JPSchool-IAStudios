# Relatório Consolidado — JPSchool AI Studios
**Data:** 02/09/2026 · **Branch analisado:** `claude/app-report-last-editor-97u19h` (= conteúdo do `main` na data)

Este relatório junta três análises: (1) auditoria técnica completa de bugs/lógica/código morto, (2) análise de UX separada para aluno e admin, (3) comparação com concorrentes e ideias de produto.

---

## 1. Resumo Executivo — Plano de Ação Prioritário

Antes de qualquer lançamento real (uso com pagamento/dados de verdade), estes **9 itens são bloqueadores** — envolvem segurança e quebras funcionais que afetam todo mundo, não casos raros:

1. **App abre sem login, direto como Super Admin** (`App.tsx`) — qualquer visitante em uma aba nova cai no painel administrativo completo.
2. **Autenticação do backend é um header que o próprio cliente controla** (`server.ts` `requireAuth`) — dá pra virar admin só mudando um header na requisição, sem senha.
3. **Rota `GET /api/configuracoes` duplicada e sem autenticação** expõe `GEMINI_API_KEY` e a chave da conta de serviço do Google em texto puro.
4. **Cotas diárias (5 produções/5 downloads) são uma única variável global** — compartilhada por todos os usuários ao mesmo tempo, não por aluno.
5. **Rotas de geração de IA e download não exigem login** — somado ao item 4, qualquer um esgota a cota de todo mundo e gasta a chave paga do Gemini.
6. **Bug de precedência quebra a tela inteira (tela branca)** ao gerar "Resumo em Áudio" — não existe tratamento de erro (`ErrorBoundary`) para conter isso.
7. **Download do material gerado sempre produz um arquivo com "[object Object]"** — a funcionalidade paga (consome cota) não entrega nada útil, em praticamente todas as ferramentas.
8. **Botões "Acessar Plataforma"/"Matricular-se" na home logam o visitante como Admin TI**, não como aluno — resquício do bug antigo, corrigido só em um dos três lugares.
9. **Logout não bloqueia o link discreto "[TI]" do rodapé** — some da tela mas o clique ainda leva pro Backstage sem pedir senha de novo.

Depois desses, a maior alavanca de produto de curto prazo é **conectar ou remover as telas de código morto** (cadastro manual de fontes/questões no Admin, troca rápida de status de matrícula, `ClassesCatalog`) e **padronizar o feedback visual** (parar de usar `alert()` nativo em 4+ lugares diferentes).

Depois disso, dá pra pensar nas ideias de diferenciação da seção 5.

---

## 2. Auditoria Técnica

### 2.1 Status dos bugs já conhecidos (relatório anterior no README)

| # | Bug reportado anteriormente | Status atual |
|---|---|---|
| A1 | Modelo `gemini-3.6-flash` inválido | ✅ **Corrigido** — usa `gemini-2.5-flash` / `gemini-embedding-001` |
| A2 | Usuário padrão errado (`TEST_USERS[2]` vs `[3]`) | ⚠️ **Corrigido, mas substituído por algo pior** — agora abre direto como Super Admin (ver item crítico #1) |
| A3 | Checkout loga como Admin TI em vez de cliente | ⚠️ **Parcialmente corrigido** — `CartDrawer` certo, mas `Hero.onStartLearner` e `Pricing.onEnrollSuccess` ainda erram |
| A4 | Short-circuit `\|\|` ignorando mídia anexada | ✅ **Corrigido** |
| A5 | Flashcards não avançam | ✅ **Corrigido** |
| A6 | Conteúdo estático nos slides | ✅ **Corrigido** |
| B1 | Sem botão para abrir Notes Drawer | ✅ **Corrigido** |
| B2 | Sem botão de retorno no Admin Backstage | ✅ **Corrigido** |
| C1 | Scroll duplo em sidebars | ✅ **Corrigido** |
| C2 | Cálculo do carrinho quebra com preço não numérico | ❌ **Ainda presente** |

### 2.2 Novos achados — CRÍTICOS (8)

**Autenticação / Acesso**
- **App inicia sem login, como Super Admin, direto no Backstage** (`src/App.tsx:32-54`) — estado padrão (sem sessão salva) deveria ser `view: 'sales'`, `isLoggedIn: false`, sem usuário definido.
- **Logout não impede acesso via link "[TI]" do rodapé** (`App.tsx:163-170`, `Footer.tsx:75-83`) — `handleLogout` não limpa `currentUser`, e o link só checa `role`, não `isLoggedIn`.
- **Autenticação do backend é um header client-controlado** (`server.ts:1460-1505`, `requireAuth`) — sem senha, token de sessão ou cookie assinado; qualquer requisição direta com `x-user-role: super_admin` passa. Agravado porque `src/services/api.ts` já manda esse header hardcoded (`'admin'`) em ~35 funções administrativas — um usuário `cliente` abrindo o DevTools reutiliza essas funções com acesso admin total.
- **`GET /api/configuracoes` duplicada, a primeira sem autenticação** (`server.ts:627` vs `1548`) — no Express, a primeira rota registrada responde; a segunda (com auth) nunca executa. Resultado: qualquer um não-logado lê `GEMINI_API_KEY` e a chave da conta de serviço do Google em texto puro.

**Cotas / Disponibilidade**
- **Cotas diárias são uma única variável global em memória** (`server.ts:72-92`) — não segmentadas por usuário. Um aluno usando o Estúdio consome a cota de todos os outros ao mesmo tempo; permite negação de serviço trivial.
- **Rotas `/api/estudio/executar` e `/api/cotas/download` sem `requireAuth`** (`server.ts:674, 735`) — combinado com o item acima, qualquer requisição anônima gasta a chave paga do Gemini e esgota a cota de todo mundo.

**Crash / Funcionalidade quebrada**
- **Bug de precedência de operadores quebra a tela ao gerar "Resumo em Áudio"** (`Workspace.tsx:710-715`) — `||` tem precedência maior que `?:`, então a expressão sempre cai no ramo que passa o objeto inteiro (não a string) pra uma função que espera texto (`.split('\n')`), lançando `TypeError`. Sem `ErrorBoundary` em `App.tsx`/`main.tsx`, o React desmonta a árvore inteira → **tela branca**.
- **CRUD manual de Fontes de Estudo e Questões é código morto — nenhum botão o abre** (`AdminBackstage.tsx`) — handlers e estados completos existem (`handleCreateSource`, `handleCreateQuestion`, etc.) mas não há botão de navegação para as abas `questoes`/`editais` nem JSX que as renderize. Na prática, não existe forma de cadastrar uma questão avulsa ou fonte fora do fluxo do Google Drive, e o banco de questões (`MOCK_QUESTIONS`) começa vazio sem nenhum caminho de UI pra populá-lo.

### 2.3 Novos achados — IMPORTANTES (8)

- **Botões de vendas logam como Admin TI em vez de cliente** — `Hero.onStartLearner` (`App.tsx:242`) e `Pricing.onEnrollSuccess` (`App.tsx:262`) usam `TEST_USERS[2]` em vez de `[3]`.
- **Cálculo de preço no carrinho quebra com texto livre** — `parseFloat(selectedPlan.price.replace(',', '.'))` (`CartDrawer.tsx:100,151`) sem validação; o campo de preço no Admin é texto livre.
- **Senha em texto puro persistida no `localStorage`** (`App.tsx:154-161`, `types.ts:6`) — sobrevive até após logout.
- **Download gera `[object Object]` para praticamente todas as ferramentas** (`Workspace.tsx:230-246`) — `resultado.conteudo` é sempre objeto desde a unificação do backend; o `Blob` converte via `String(obj)`.
- **Botão "Play" (TTS) do Resumo em Áudio quebra pelo mesmo motivo** (`Workspace.tsx:249-265`) — `.slice()` chamado num objeto.
- **Log de auditoria sempre atribui ações a "admin"**, nunca ao usuário real (`api.ts`, header hardcoded) — compromete a rastreabilidade que o próprio sistema de logs deveria garantir.
- **Rotas de estúdio/download sem auth** (repetido do crítico, listado aqui pela dimensão de abuso de API paga).
- **`resultText` do backend (string plana) é descartado pelo frontend** (`api.ts:72-81`) — é a causa raiz dos dois bugs de download/TTS acima; existe um fallback que nunca é alcançado.

### 2.4 Novos achados — MENORES (10)

- "Ver Site de Vendas" dentro do Backstage na verdade abre a Área do Aluno, não a home pública (`AdminBackstage.tsx:3453-3459`).
- `cartCount` fixo em `1`, não reflete estado real.
- `cartPlan` pode ficar obsoleto se o admin editar/excluir o plano selecionado.
- Anotações não persistem (somem ao recarregar) apesar do texto afirmar "backup local sincronizado".
- Botão "Baixar TXT" de uma anotação só mostra um `alert()`, não baixa nada.
- Handler de troca rápida de status de matrícula (`handleUpdateStatus`) e seu endpoint dedicado existem mas nunca são chamados — status só muda reabrindo o formulário inteiro.
- Tratamento de erro raso no fallback de importação do Google Drive (Service Account → download público) — difícil diagnosticar em produção.
- Mistura de `require`/`import` dinâmico em módulo ESM para `pdf-parse` — funciona hoje, risco em bundlers mais estritos.
- `ProducaoResultado.conteudo: any` esconde a incompatibilidade de tipos que causou os bugs de download/TTS — o TypeScript não pegou porque o tipo permite qualquer coisa.
- Dois modelos paralelos de "categoria" (via `siteConfig` local e via `CURSOS_MATERIAS` do backend) sincronizados por heurística de nome (`toLowerCase().includes(...)`) — frágil para nomes ambíguos.

### 2.5 Pontos positivos confirmados

- **Nenhuma injeção de SQL** — todas as queries usam parâmetros (`$1, $2...`) do driver `pg`, sem concatenação de string.
- **Nenhum uso de `dangerouslySetInnerHTML`, `eval` ou `new Function`** em todo o `src/`.
- **Nenhuma chave/segredo hardcoded** no código-fonte; `storage/` com segredos está corretamente no `.gitignore`.
- CRUD administrativo (matrículas, pagamentos, códigos, tickets, logs, leads, campanhas) é **consistente e bem padronizado** — confirmação antes de excluir, mensagens de status, log de auditoria automático.
- Fluxo de ingestão via Google Drive é um bom caminho "sem código" para quem não é técnico.

**Total: 26 problemas novos + 9 itens do relatório anterior revisados (7 corrigidos, 2 ainda presentes/parciais).**

---

## 3. Análise de UX — Para o Aluno

### Jornada de descoberta → compra
- **Confirmação de compra via `alert()` nativo** quebra a identidade visual numa compra de R$500-900; mesmo problema no cupom inválido do carrinho. → padronizar com modal/toast no estilo do produto.
- **`ClassesCatalog` (tela "Selecione sua Turma") é código morto** — nunca é renderizada; a escolha de turma acontece só dentro dos cards de preço, e `selectedTurmaName` fica travado no valor padrão.
- **Sem "esqueci minha senha" nem indicação clara de como logar depois da compra** pela Navbar.

### Entrada na Plataforma (layout de 3 colunas)
- **Nenhuma confirmação visível de quais fontes estão selecionadas** na hora de gerar conteúdo — grave porque o produto se vende pela promessa de respostas fundamentadas em editais oficiais; hoje o aluno pode gerar sem perceber que zerou a seleção. → chip fixo tipo "📚 3 fontes selecionadas" acima do prompt.
- **Sem contador global de fontes selecionadas**, só por categoria dentro de acordeões fechados.
- **Cota não avisa antes de esgotar** — só descobre no erro depois de escrever o prompt; `resetTime` existe no tipo mas nunca é exibido na UI (só dentro do texto de erro). → desabilitar "Gerar" visualmente ao chegar em 5/5, mostrar horário de reset de forma permanente.
- Inconsistência de feedback: erro de cota no download usa `alert()`, o resto da tela usa banner vermelho.

### As ~20 ferramentas de IA (Estúdio)
- **Ponto forte a preservar:** reordenação automática do grupo "Reta Final" pro topo quando a prova está perto — boa redução de sobrecarga de escolha no momento certo.
- Dentro de cada grupo ainda é uma lista plana sem indicação de "comece por aqui" pra quem é novo.
- "Raio-X da Banca" promete "estatística real de incidência" mas cai no mesmo renderizador de texto genérico — sem gráfico, enfraquece a percepção de valor.
- **Microfone "Falar por Voz" não grava nada de verdade** — depois de 3s injeta um texto fixo pré-definido, independente do que a pessoa falou. Risco de quebrar confiança no primeiro uso.
- **"Checklist de Véspera" não é um checklist** — existe estado pronto (`checklistState`) mas nada usa; cai como texto corrido, justo a ferramenta mais simbólica da reta final.

### Feedback e navegação (o que já funciona bem — manter)
- Selo verde/âmbar distinguindo conteúdo 100% oficial de complemento externo, linha a linha.
- Feedback de simulado não-punitivo, sempre com comentário visível.
- Fluxo de "Salvar nas Anotações" e busca no drawer funcionam bem.
- Durante o carregamento, a área de resultado não muda visualmente — pode confundir (achar que não funcionou e clicar de novo).

---

## 4. Análise de UX — Para o Admin

### Editor Visual do Site (AdminPanel)
- **Inconsistência grave de "salvar":** a aba "Categorias" salva instantaneamente a cada edição, as outras 5 abas só com o botão "Salvar Alterações" no topo — sem nenhuma pista visual da diferença. Risco real de perder edição sem perceber.
- **"Ver Site de Vendas" não abre o site de vendas** quando embutido no Backstage — leva pra Área do Aluno.

### Dados Operacionais (matrículas, pagamentos, códigos, tickets, logs, leads, campanhas)
- **Já funciona bem:** padrão de CRUD extremamente consistente entre as 6 sub-telas, curva de aprendizado baixa; busca zerada automaticamente ao trocar de aba.
- **Sem ação rápida de "Aprovar pagamento"/"Revogar acesso"** — qualquer mudança de status exige reabrir o formulário inteiro (todos os campos), lento e propenso a erro pra ação frequente. Existe handler pronto (`handleUpdateStatus`) nunca conectado a um botão.
- **Segurança invertida:** excluir (raro, destrutivo) tem confirmação obrigatória; aprovar pagamento ou revogar acesso de aluno pagante (frequente, alto impacto) não tem nenhuma.
- **Sem paginação em nenhuma tabela** — invisível hoje com mocks vazios, mas vai pesar assim que a base real crescer.
- Sem botão de "copiar código" ao lado dos códigos de acesso gerados.

### Gestão de Conteúdo / RAG
- **Bom fluxo de ingestão via Google Drive** — pasta → arquivos → categoria → status → ingestão em lote com progresso e opção de interromper.
- **Termos técnicos crus na tela pra operador não-técnico** (`GOOGLE_DRIVE_FOLDER_ID`, "RAG", "chunks", "vetorial", "pgvector") — trocar por linguagem de produto, reservar jargão pra um modo avançado.
- **Cadastro manual de fontes/questões desconectado** (repetido da auditoria técnica — handlers prontos, nenhum botão os abre).
- Abas "questoes" e "editais" existem como valor válido mas nunca aparecem como opção de navegação nem têm conteúdo renderizado.

### Top 5 prioridades de UX
**Aluno:** (1) mostrar fontes selecionadas perto do prompt · (2) avisar cota antes de esgotar + mostrar horário de reset · (3) padronizar feedback, parar de usar `alert()` · (4) decidir destino do `ClassesCatalog` · (5) implementar de verdade o Checklist de Véspera.

**Admin:** (1) unificar comportamento de "salvar" no editor de site · (2) ações rápidas de aprovar/revogar com confirmação · (3) corrigir "Ver Site de Vendas" · (4) simplificar linguagem técnica na tela de RAG · (5) conectar ou remover as telas mortas de cadastro manual.

---

## 5. Comparação com Concorrentes e Oportunidades

### Panorama do mercado (2026)
- **Gran Cursos Online (MAIA):** recomendação de curso por interesse, PDFs/aulas viram audiobook automaticamente, legendas automáticas, comentários explicativos de questões, e no plano PRO: **correção inteligente de discursivas**, salas de mentoria/interativas. ([grancursosonline.zendesk.com](https://grancursosonline.zendesk.com/hc/pt-br/articles/21798168734235-MAIA-a-Intelig%C3%AAncia-Artificial-do-Gran), [blog.grancursosonline.com.br](https://blog.grancursosonline.com.br/revisao-inteligente/))
- **QConcursos:** comentário automático de questões, **identificação de pontos fracos com trilha de revisão personalizada**, distinção entre "erro por desatenção" e "erro por não saber o conteúdo". ([fernandoaugustoblog.com.br](https://www.fernandoaugustoblog.com.br/melhor-inteligencia-artificial-estudar-concurso/))
- **Estratégia Concursos:** mapas mentais e **cronograma adaptativo** gerado por IA, monitor de performance. ([estudocerteiro.com.br](https://estudocerteiro.com.br/gran-cursos-ou-estrategia-concursos/))
- **Concursa AI / Clipping.ai:** IA treinada especificamente no padrão de cada banca (CESPE, FCC, Vunesp, IBFC...), cola-se o edital e a IA já gera questões, flashcards e plano de estudos no estilo daquela banca. ([app.concursaai.com](https://app.concursaai.com/), [clipping.ai](https://clipping.ai/))
- **Tendências gerais de EdTech/IA 2026:** repetição espaçada automatizada (intervalo de revisão ajustado por dificuldade real do aluno), IA proativa que inicia contato com quem está com dificuldade (em vez de esperar o aluno voltar), microlearning (5-10 min), gamificação com streaks, e um dado forte de onboarding — **quem faz a primeira pergunta em menos de 90s retém ~3x mais em 30 dias**. ([forasoft.com](https://www.forasoft.com/blog/article/ai-tutors-adaptive-learning-2026), [ttms.com](https://ttms.com/10-gamechanging-elearning-trends-to-watch/))

### O que o JPSchool já faz diferente (não perder isso)
- **Rastreabilidade de fonte oficial vs. externa** linha a linha na resposta (selo verde/âmbar) — nenhum concorrente pesquisado expõe isso de forma tão explícita; é um diferencial de confiança real pra quem estuda legislação.
- **Foco de nicho fechado** (SED-SC, Prefeituras de SC) — os grandes concorrentes são generalistas nacionais; dá pra ser muito mais específico no conteúdo (banca FURB, editais exatos) do que eles conseguem ser.
- **Agrupamento por fase de estudo** (Essencial → Gerar Material → Avaliar → Reta Final) já reflete uma jornada, diferente da maioria que só lista "ferramentas" soltas.

### Ideias priorizadas para incorporar

**Curto prazo (reforça o que já existe, baixo esforço relativo):**
1. **Trilha de revisão por ponto fraco** (como QConcursos) — a ferramenta "Pontos Fracos" já existe no G3; hoje é um resultado único. Evoluir pra alimentar automaticamente o que aparece sugerido no "Essencial do dia a dia", criando um ciclo fechado de revisão.
2. **Repetição espaçada real nos Flashcards** — hoje avança sequencialmente; aplicar intervalo crescente por cartão que o aluno já "memorizou" e repetição mais frequente pro que marcou "preciso revisar".
3. **Consertar e depois expandir o Resumo em Áudio de verdade** (ele está quebrado hoje, ver item crítico #6) — tem potencial de virar audiobook do edital pra ouvir no trajeto, como o Gran já faz — encaixa bem no público "professor com pouco tempo".
4. **Onboarding rápido até a primeira geração de IA** — dado o achado de UX de que a tela de 3 colunas pode sobrecarregar quem chega, e a estatística de mercado de que <90s até a primeira interação triplica retenção, vale medir e otimizar esse tempo especificamente.

**Médio prazo (diferenciação):**
5. **IA proativa** — hoje o aluno precisa lembrar de entrar e usar; notificação (e-mail/push, se existir app) quando detectar padrão de pouco uso ou proximidade da prova, similar ao "AI initiates contact" citado como tendência 2026.
6. **Correção de discursiva com rubrica visível** (como o Gran) — a ferramenta "Corrigir Redação" já existe; vale evoluir pra mostrar critérios pontuados (coesão, argumentação, norma culta) em vez de só texto corrido, aproveitando o padrão de rastreabilidade de fonte que já é forte no produto.
7. **Cronograma adaptativo** (como Estratégia Concursos) ligando dias-até-a-prova + desempenho em simulados pra reorganizar automaticamente o que aparece em destaque — já existe a lógica de "Reta Final" subir pro topo; é uma extensão natural dela.
8. **Gamificação leve** (streak de dias estudando, badge de "questões dominadas por matéria") — o público (professores com concurso à vista) responde bem a compromisso visível, e a base de dados (`MOCK_LOGS_AUDITORIA`, `Questao`) já tem o necessário pra calcular isso sem nova infraestrutura.

**Mais especulativo (avaliar apetite):**
9. **IA treinada/ajustada especificamente na banca FURB** (que aplica o concurso SED-SC 2026) — replicando a lógica do Clipping.ai de "padrão por banca", mas ainda mais nichado (uma banca só, não dezenas).

---

## 6. Próximos Passos Sugeridos
1. Corrigir os 9 itens bloqueadores da seção 1 antes de qualquer uso com dados reais.
2. Decidir, item a item, entre "conectar" ou "remover" o código morto identificado (CRUD de fontes/questões, `ClassesCatalog`, troca rápida de status).
3. Padronizar feedback visual (substituir todos os `alert()`/`confirm()` nativos por componentes do próprio design system).
4. Priorizar entre as ideias da seção 5 conforme o roadmap comercial (ex: se o foco imediato é o concurso SED-SC 2026, a ideia #9 pode valer mais que a #8 agora).
