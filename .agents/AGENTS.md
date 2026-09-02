# Diretrizes e Instruções do Projeto JPSchool AI Studios

Estas regras são lidas automaticamente pelo assistente de IA antes de cada comando executado neste repositório.

## 1. Segurança & Credenciais
- NUNCA inserir chaves de API (`GEMINI_API_KEY`), credenciais do Google (`GOOGLE_SERVICE_ACCOUNT_KEY`), nem URLs/IDs confidenciais diretamente no código-fonte ou em arquivos commitados.
- Todas as chaves e IDs confidenciais devem ser lidos do ambiente (`.env`) ou configurados dinamicamente via painel Admin (**Configurações do Sistema**).
- No painel Admin, valores sensíveis devem ser exibidos sempre de forma mascarada (`••••••••••••••••`), utilizando `<input type="password">` ao editar, sem botão de exibição em texto puro.

## 2. Arquitetura de Dados & Google Drive
- O **Google Drive** é a fonte única de verdade para os materiais didáticos (editais, leis, apostilas e simulados em PDF).
- Não exigir cadastros manuais duplicados na plataforma para PDFs que já estejam no Drive. A plataforma deve ler as subpastas organizadas por Cargo/Curso no Drive e permitir ingestão automatizada.

## 3. Qualidade de Código & Compilação
- Após qualquer alteração no código React/TypeScript, executar a verificação estática de tipos (`tsc --noEmit` / `npm run lint`) para garantir zero erros de compilação.
- Manter o servidor local ativo em modo de desenvolvimento (`npm run dev`).

## 4. Proibição Absoluta de Dados Falsos / Fake / Simulados
- NÃO CRIAR DADOS MOCKADOS OU FALSOS: É terminantemente proibido inserir no código-fonte listas fictícias ou simuladas de matrículas, vendas, pagamentos, tickets de suporte, leads, leis, editais, materiais de estudo, questões fictícias ou logins falsos.
- As coleções operacionais e de conteúdo da plataforma devem iniciar completamente limpas (`[]` vazio), permitindo que apenas dados reais sejam cadastrados pelo administrador ou ingeridos diretamente a partir do Google Drive / banco relacional real.
- EXCEÇÃO ÚNICA PERMITIDA: Apenas elementos puramente estéticos e visuais do Frontend da Landing Page comercial (como imagens institucionais de vitrine, banners promocionais do site e ícones da interface gráfica).
