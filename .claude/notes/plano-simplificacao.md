# Plano de Simplificação e Melhoria — JPSchool AI Studios
**Data:** 02/09/2026 · Baseado em análise do código atual (commit `e683f56`)

---

## Resumo em uma frase

O sistema funciona, mas tem **três "verdades" competindo** sobre onde os dados moram, e o **mesmo código escrito 13 vezes**. Resolver essas duas coisas corta o tamanho do código quase pela metade, elimina uma classe inteira de bugs, e destrava 5 funcionalidades do roadmap que hoje estão bloqueadas.

---

## Onde o sistema está hoje

| Arquivo | Linhas | Observação |
|---|---|---|
| `AdminBackstage.tsx` | 3.958 | 8 telas de CRUD + gestão de conteúdo, tudo em um componente |
| `server.ts` | 3.347 | 62 rotas + RAG + Drive + auth + fallback de IA, tudo em um arquivo |
| `AdminPanel.tsx` | 1.605 | editor de layout com 7 abas |
| `Workspace.tsx` | 1.251 | 12 renderizadores de resultado em cascata de `if` |
| **demais 15 arquivos** | 4.367 | tamanho saudável |
| **Total** | **14.528** | **70% do código está em 4 arquivos** |

---

## Problema nº 1 — Três fontes de verdade competindo

Hoje um dado pode morar em três lugares diferentes, e nenhum deles conversa com o outro:

| Onde mora | O que guarda | O que acontece |
|---|---|---|
| **localStorage do navegador** | textos do site, planos, **preços**, depoimentos, categorias | Só existe no navegador de quem editou |
| **Arquivos JSON em disco** | configurações, fontes de estudo, cursos/matérias, anotações | Sobrevive a restart ✅ |
| **Memória RAM do servidor** | matrículas, pagamentos, tickets, códigos de acesso, logs, leads, campanhas, questões, usuários | Some a cada restart ❌ |

### Consequência mais grave: o Editor de Layout não funciona de verdade

Confirmei no código: **não existe nenhuma rota no backend que salve a configuração do site.** O `siteConfig` (textos do hero, planos, preços, depoimentos) é lido e gravado apenas em `localStorage`.

Na prática isso significa: **quando o admin edita o site de vendas, um visitante real não vê nada disso.** O visitante recebe o `DEFAULT_SITE_CONFIG` que está escrito no código. Se o admin muda o preço de R$ 499 para R$ 599, o site continua vendendo por R$ 499 para todo mundo, menos para o navegador dele.

Esse é o bug mais caro do sistema hoje, porque ele é **silencioso** — o admin salva, vê a mudança na tela dele, e acredita que está no ar.

### Segunda consequência: perder pagamento em restart

Matrículas e pagamentos vivem só na RAM. Se o servidor reiniciar (deploy, queda, manutenção), todo pagamento aprovado e toda matrícula ativa desaparecem. As anotações do aluno já foram resolvidas; essas não.

### O que muda

Uma fonte de verdade só: **o servidor**. Todo dado de negócio passa a viver no backend com uma camada única de armazenamento. O navegador guarda apenas preferência de interface (qual aba estava aberta, qual grupo do estúdio estava expandido) — nunca dado de negócio.

---

## Problema nº 2 — O mesmo código escrito 13 vezes

O sistema tem 13 entidades administrativas (matrículas, pagamentos, códigos de acesso, tickets, logs, configurações, leads, campanhas, fontes, questões, anotações, cursos/matérias, drive). Cada uma tem:

- 4 rotas quase idênticas no backend (~60 linhas cada)
- 3 handlers quase idênticos no frontend (~70 linhas)
- 1 formulário + 1 tabela (~180 linhas)

São **13 cópias da mesma estrutura**, com os nomes trocados. É por isso que os dois maiores arquivos existem.

### Por que isso importa (não é só estética)

Cada correção precisa ser aplicada 13 vezes, e é exatamente aí que as coisas se perdem. Dois exemplos reais que a auditoria encontrou:
- O log de auditoria registrava **"admin"** para toda ação, independentemente de quem fez — porque o trecho que envia a identidade foi copiado errado em 35 lugares.
- O botão de trocar status de matrícula existia no código, funcionava, e **nunca foi ligado a nenhum botão** — se perdeu no meio da repetição.

### O que muda

Um **molde genérico**: uma função no backend que gera as 4 rotas para qualquer entidade, e um componente de tabela+formulário no frontend que se configura por uma descrição de campos.

As 13 entidades passam de ~250 linhas cada para ~15 linhas de configuração cada. Uma correção passa a valer para todas de uma vez.

---

## Problema nº 3 — O tipo `any` que já causou 3 bugs

O resultado gerado pela IA é tipado como `conteudo: any`. Isso desliga a verificação do compilador exatamente no ponto mais usado do produto. Os três bugs que corrigimos nas últimas semanas vieram todos daí:

1. Tela branca ao gerar "Resumo em Áudio" (precedência de operador com `any`)
2. Download gerando arquivo com `[object Object]`
3. Botão de áudio (TTS) quebrando pelo mesmo motivo

Nenhum dos três teria passado se o tipo descrevesse as formas possíveis de conteúdo. O compilador teria apontado antes de chegar no aluno.

### O que muda

O conteúdo do resultado ganha um tipo que descreve suas formas reais (texto, questões, flashcards, slides, mapa mental, tabela...). Cada tipo de resultado vira um componente pequeno próprio, em vez de 12 blocos `if` dentro de um arquivo de 1.251 linhas.

---

## Problema nº 4 — Falta o registro mais importante do produto

Confirmei: **o sistema não guarda em lugar nenhum se o aluno acertou ou errou uma questão.** Isso vive só na tela e se perde quando ele sai.

Cinco itens do roadmap dependem desse registro que não existe:
- Raio-X da Banca (ótica 2 — "X responderam, Y acertaram")
- Pontos Fracos (hoje a ferramenta existe mas não tem dado real para analisar)
- Revisão espaçada
- Cronograma adaptativo
- Gamificação (streak, taxa de acerto comparada)

### O que muda

Passa a existir um registro de resposta: quem respondeu, qual questão, acertou ou não, quando, e se a questão era do banco oficial da banca ou gerada pela IA (essa separação é o que você pediu para o cálculo do Raio-X).

É uma estrutura pequena, mas é a que destrava metade do roadmap.

---

## O plano, em ordem

A ordem não é por dificuldade — é por **risco de perder dinheiro ou dado real**, depois por **desbloqueio de roadmap**, depois por **custo de manutenção**.

### Fase 1 — Uma fonte de verdade só
*Por quê: hoje dá para perder um pagamento aprovado, e o Editor de Layout não afeta visitante nenhum.*

1. Configuração do site passa a ser salva no servidor (o Editor de Layout passa a funcionar de verdade para visitantes)
2. Matrículas, pagamentos, tickets, códigos, logs, leads e campanhas passam a gravar em disco (mesma receita já validada nas anotações)
3. Uma camada única de armazenamento substitui as 4 funções `load/save` copiadas — e é ela que, no futuro, troca arquivo por banco de dados mexendo em um lugar só

### Fase 2 — Registrar o que o aluno faz
*Por quê: destrava 5 funcionalidades do roadmap que hoje estão paradas por falta de dado.*

1. Registro de respostas (quem, qual questão, acertou, quando, oficial vs. gerada por IA)
2. Com isso pronto, o Raio-X ótica 2 vira praticamente uma consulta, e Pontos Fracos passa a usar dado real

### Fase 3 — Unificar Cursos/Matérias
*Por quê: é a decisão que você já tomou (item 8), e o Raio-X ótica 1 depende dela.*

1. Modelo único: Curso → Matérias → Materiais/Questões, com vínculo explícito por ID (acaba a adivinhação por nome, que hoje classifica material errado quando o nome é ambíguo)
2. Uma tela só de gestão, no lugar das duas portas de entrada que hoje gravam no mesmo arquivo sem saber uma da outra
3. A matrícula do aluno passa a filtrar de verdade o que ele vê
4. Cursos por área: Professor + disciplina; Educação Infantil e Educação Especial separados
5. Anexar o documento de análise da banca por curso (destrava Raio-X ótica 1)

### Fase 4 — Cortar o código pela metade
*Por quê: reduz o custo de toda mudança futura e elimina a classe de bug "corrigi em 12 lugares, esqueci o 13º".*

1. Molde genérico de CRUD para as 13 entidades
2. `AdminBackstage` (3.958 linhas) quebrado em telas separadas
3. `Workspace` (1.251 linhas) quebrado em um componente por tipo de resultado
4. Fim do `conteudo: any`

**Resultado esperado:** de ~14.500 linhas para algo em torno de **8.000–9.000**, com mais funcionalidade do que hoje.

---

## O que eu **não** recomendo fazer

Simplificar não é trocar de tecnologia. Estas mudanças seriam caras e não resolvem nenhum problema real do sistema:

| Tentação | Por que não |
|---|---|
| Trocar Express por outro framework | Nenhum problema atual vem do Express |
| Adicionar Redux/Zustand | O estado do app não é complexo o bastante para justificar |
| Migrar para Next.js | Reescrita cara, ganho nenhum para o que o produto precisa |
| Colocar Postgres agora | Os arquivos JSON aguentam bem até alguns milhares de registros. Depois da Fase 1.3, trocar por banco vira mexer em **um arquivo só** — fazer antes é gastar tempo com infraestrutura em vez de produto |
| Reescrever do zero | O produto tem lógica de negócio boa acumulada. O problema é organização, não concepção |

---

## Ordem sugerida de execução

Fase 1 primeiro, sem discussão — é a única que envolve risco de perda real (dinheiro e dado) e de vender com preço errado.

Depois disso, Fases 2 e 3 podem ser feitas juntas (o modelo de cursos e o registro de respostas se encontram no Raio-X), e a Fase 4 pode ser feita aos poucos, entidade por entidade, sem parar o resto do trabalho.
