# Contexto para anexar em conversas sobre o JPSchool IA

## Projeto
JPSchool AI Studios — plataforma de preparação para concursos públicos de professores (SED-SC e Prefeituras), com Tutor de IA e RAG sobre fontes oficiais.

Repositório: `minorfurymusic/JPSchool-IAStudios`
Branch de trabalho atual: `claude/app-report-last-editor-97u19h` (sincronizado com `main` em 2026-09-02, sem alterar o `main`)
Autor até agora: minorfurymusic

## Stack
- Front-end: React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + lucide-react + motion
- Back-end: Express (`server.ts`), servindo também o Vite em dev
- IA: `@google/genai` (Gemini), com fallback local quando `GEMINI_API_KEY` não está configurada
- Novas dependências (adicionadas após a sincronização com o main): `pdf-parse` (ingestão de PDFs), `pg` (Postgres — uso ainda a confirmar), `googleapis`
- Persistência: predominantemente mock (`src/data/mockDatabase.ts`) + `localStorage`; há indícios de início de pipeline RAG real (ingestão de PDF, `storage/official_sources.json`) — checar estado atual antes de assumir

## Estrutura (views principais, unificadas conforme commit "unifica arquitetura em 2 areas")
- Plataforma do aluno — fontes oficiais / workspace do tutor / estúdio de ferramentas de IA (grupos: Essencial, Gerar Material, Avaliar e Corrigir, Reta Final)
- Admin Backstage — gestão de conteúdo, usuários, pagamentos, ingestão de fontes, métricas de dashboard (bastante expandido nos últimos commits)

## Documentação já existente no repositório (não duplicar, ler antes)
- `README.md` — visão geral + diagnóstico técnico detalhado (arquitetura, banco mockado, fluxos de dados, bugs conhecidos)
- `ARQUITETURA_DADOS.md` — referência técnica de arquitetura de dados
- `DIAGNOSTICO.md` — diagnóstico
- `tutorial.md` — tutorial
- `.agents/AGENTS.md` — instruções para agentes

## Bugs conhecidos documentados no README (verificar se já corrigidos antes de reportar de novo)
- Modelo de IA inválido no backend (`gemini-3.6-flash` não existe)
- Usuário padrão errado (`TEST_USERS[2]` = Admin TI, deveria ser `TEST_USERS[3]` = cliente) em `App.tsx` (login padrão e checkout)
- Prompt do Workspace ignora imagem/vídeo anexado quando há texto (short-circuit com `||`)
- Flashcards não avançam de cartão (cardIndex nunca incrementa)
- Slides com conteúdo estático repetido
- Notes Drawer sem botão de acesso
- Admin Backstage sem botão de retorno à plataforma
- Sidebars com scroll duplo em telas pequenas
- Cálculo do carrinho quebra com preços não numéricos (ex: "Sob Consulta")

## Regras operacionais específicas deste projeto
- Rodar com `npm run dev` (Express + Vite na porta 3000, dentro do container — **não** acessível pelo navegador local do usuário sem ele rodar o projeto na própria máquina).
- Para validar mudanças visuais, usar Playwright headless (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, já que `chromium-cli` não está disponível neste ambiente) e enviar screenshot.
- `GEMINI_API_KEY` não configurada por padrão — funcionalidades de IA usam fallback local; avisar se o usuário quiser IA real.
- Ao sincronizar com o GitHub: nunca alterar o `main` diretamente; trazer atualizações para o branch local, comparar antes de sobrescrever.

## Pendências/decisões em aberto
- Confirmar se `pg` (Postgres) já está em uso real ou é preparação futura.
- Substituir mock por banco de dados real (se ainda não feito).
- Configurar chave do Gemini para respostas de IA reais.
- Corrigir os bugs listados no README, se ainda não corrigidos.
- (atualizar aqui conforme decisões forem tomadas em novas conversas)
