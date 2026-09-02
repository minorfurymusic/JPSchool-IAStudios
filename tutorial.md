# Guia do Administrador e TI — Tutorial de Uso do JPSchool AI Studios

Este documento descreve detalhadamente o funcionamento, as ferramentas e os fluxos de trabalho do painel administrativo (**Admin Backstage**) do **JPSchool AI Studios**. Este tutorial é voltado exclusivamente para os perfis administrativos (`super_admin`, `admin` e `ti`).

---

## 1. Visão Geral dos Perfis e Acesso

A plataforma gerencia o acesso através de privilégios específicos:

*   **Super Admin (`super_admin`):** Acesso completo e irrestrito a todas as áreas operacionais, de gestão de conteúdo e editor de TI do site.
*   **Admin (`admin`):** Foco em gestão comercial, faturamento, suporte aos alunos e curadoria do acervo educacional.
*   **TI (`ti`):** Foco no editor visual da página de vendas (plataforma comercial), planos, depoimentos e métricas técnicas.

Para acessar o painel administrativo, o usuário correspondente deve fazer login pelo formulário no cabeçalho. Ao ser detectado o perfil de administrador, um botão **"Backstage Admin"** ficará visível na barra de navegação.

---

## 2. Guia de Uso: Painel de Dados Operacionais (Comercial & Financeiro)

A seção **Dados Operacionais** serve para monitorar o status da escola de forma integrada. Ela é dividida em sub-abas no topo esquerdo do Backstage:

### A. Matrículas
*   **O que faz:** Exibe a lista de todos os alunos com acesso ativo ou inativo.
*   **Alterar Status:** Na tabela, cada linha possui um seletor dinâmico de status (Ativa, Trial, Suspensa, Expirada, Cancelada). Ao alterar o valor, o sistema atualiza a permissão imediatamente e registra um log de auditoria automática.
*   **CRUD completo:**
    *   **Criar nova matrícula:** Clique em **"Cadastrar Nova Matrícula"**, insira o e-mail do usuário, selecione o curso/edital desejado, escolha a origem (Manual, Compra ou Cupom) e defina o status.
    *   **Editar:** Clique no ícone do Lápis para alterar dados cadastrais de uma matrícula.
    *   **Excluir:** Clique na Lixeira vermelha para revogar o acesso permanentemente.

### B. Pagamentos
*   **O que faz:** Histórico completo de faturamento dos planos de estudos vendidos.
*   **CRUD completo:**
    *   **Adicionar Pagamento:** Ideal para lançar vendas manuais (ex: PIX direto ou transferência). Informe o valor em centavos (ex: `49700` para R$ 497,00), parcelas, método de pagamento, gateway e status.
    *   **Editar/Excluir:** Permite atualizar o status da transação para "Estornado" ou "Aprovado" em caso de conciliação posterior.

### C. Códigos de Acesso (Cupons)
*   **O que faz:** Controle de códigos promocionais que os usuários inserem para obter dias de acesso cortesia.
*   **CRUD completo:** Crie novos códigos promocionais configurando a quantidade de dias permitida e o limite máximo de resgates do cupom.

### D. Tickets de Suporte
*   **O que faz:** Central de atendimento aos chamados abertos pelos alunos na plataforma.
*   **Responder Chamados:** Clique em **"Responder"** no chamado aberto, digite a orientação técnica ou pedagógica desejada e envie. O status mudará automaticamente.

### E. Configurações Globais
*   **O que faz:** Variáveis operacionais da plataforma em tempo real.
    *   `RETATIVIDADE_DIAS_PROVA`: Controla o contador regressivo na Área do Aluno.
    *   `SENHA_MIN_CARACTERES`: Regra de validação de novas senhas.
    *   `BLOQUEIO_TENTATIVAS_MAX`: Quantidade de erros de login permitidos antes do bloqueio de IP/usuário.
*   **Edição Inline:** Altere o valor diretamente na tabela e clique no ícone do disquete (Salvar) para aplicar globalmente.

### F. Leads (Prospectos)
*   **O que faz:** Exibe contatos que preencheram formulários de interesse na página de vendas externa ou abandonaram o carrinho de compras.
*   **CRUD completo:** Cadastre leads manualmente após contato externo e atualize o status para "Contatado" ou "Convertido em Aluno".

### G. Campanhas de Cota
*   **O que faz:** Campanhas promocionais que alteram temporariamente as cotas diárias de prompts ou downloads do RAG para determinados períodos.
*   **CRUD completo:** Defina data de início e fim da campanha, e os limites diários personalizados.

---

## 3. Guia de Uso: Gestão de Conteúdo & RAG

Esta seção gerencia toda a inteligência e o material de estudo disponibilizado para a IA do aluno.

### A. Cursos & Aulas (Biblioteca Local)
*   **O que faz:** Cadastro de materiais didáticos (Leis Estaduais, Editais, Apostilas, etc.) exibidos no painel do aluno.
*   **CRUD completo:** Cadastre ou edite materiais preenchendo o título, disciplina, banca focada (FEPESE, ACAFE, etc.) e o tipo.

### B. Banco de Questões
*   **O que faz:** Acervo de questões de provas anteriores ou criadas pela equipe de professores.
*   **CRUD completo:** Cadastre questões inéditas fornecendo o enunciado estruturado em texto puro, preenchendo as alternativas de A a E, definindo o gabarito oficial e adicionando um comentário legal/explicativo fundamentado para o aluno estudar.

### C. Integração e Sincronização Google Drive (Editais & Documentos)
Toda a base documental de RAG do JPSchool está hospedada e pode ser sincronizada via **Google Drive**.

1.  **Compartilhamento Inicial:**
    *   No painel administrativo (Aba **"3. Editais & Documentos"**), identifique o e-mail da Conta de Serviço do Google Cloud exibido no card.
    *   Acesse o seu Google Drive pessoal e compartilhe a pasta correspondente (usando o ID da pasta listado no painel) com esse e-mail de conta de serviço, dando permissão de **Leitor** ou **Editor**.
2.  **Envio de PDFs:**
    *   Faça o upload de arquivos PDF correspondentes a leis estaduais, editais ou resumos na pasta compartilhada.
3.  **Sincronização & Indexação Vetorial:**
    *   No painel do JPSchool, clique em **"Atualizar Lista Drive"** para ver a lista de arquivos encontrados na pasta.
    *   No seletor **"Vincular ao Material"**, escolha a qual curso/disciplina cadastrado na biblioteca local aquele PDF se refere.
    *   Clique em **"Importar & Ingerir RAG"** ao lado do arquivo PDF desejado.
    *   O sistema fará o download automático do arquivo, fará o parsing do PDF, dividirá em chunks semânticos, gerará os embeddings vetoriais com a API Gemini (`text-embedding-004`) e gravará os vetores diretamente no Neon. O material passará de status **PENDENTE** para **INDEXADO** e já estará disponível para responder dúvidas dos alunos instantaneamente!

---

## 4. Guia de Uso: Editor de Layout (TI / Comercial)

A seção **Editor de Layout (TI)** permite editar a identidade visual e as ofertas comerciais expostas na vitrine da página de vendas externa sem mexer em uma única linha de código.

*   **Edição Textual:** Modifique o título principal do site, subtítulo de impacto e o link do vídeo de apresentação (Youtube/Vimeo).
*   **Gestão de Planos:** Cadastre ou edite os preços, quantidade de parcelas, cupons e a lista de benefícios inclusos em cada plano de assinatura.
*   **Depoimentos:** Altere fotos (URLs), nomes e relatos reais de alunos aprovados para aumentar a conversão de vendas.
*   **Categorias & Pilares:** Configure os blocos com pilares metodológicos explicativos exibidos no rodapé e corpo do site.
*   **Prévia:** Clique em **"Prévia da Página de Vendas"** para carregar a página comercial e validar as atualizações feitas.
