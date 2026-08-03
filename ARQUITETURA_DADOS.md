# Processo — Arquitetura de Dados JPSchool

Este é o documento de referência técnica que descreve como o sistema deve processar, armazenar e consultar cada tipo de conteúdo. Ele serve para orientar qualquer implementação futura (IA Studios, Antigravity ou desenvolvedores humanos) sem a necessidade de reexplicar as regras do zero.

---

## 1. Onde cada tipo de arquivo mora

| Tipo de conteúdo | Onde fica o arquivo original | O que vai para o Neon (Banco de Dados Relacional) |
| :--- | :--- | :--- |
| **Vídeo do professor explicando um assunto** | Fica no Drive/storage como vídeo, sempre. O aluno assiste o vídeo de verdade. | Só uma referência (link/ID) + transcrição em texto (para busca por palavra-chave ou similaridade). |
| **Imagens, mapas mentais prontos** | Ficam no Drive/storage como imagem (PNG/SVG), sempre. | Só a referência/link da imagem. |
| **Áudios (podcasts, resumos gravados)** | Ficam no Drive/storage como áudio, sempre. | Só a referência + transcrição opcional em texto. |
| **Apostilas/PDFs em texto (editais, leis)** | O PDF original fica no Drive como backup/origem. | O texto extraído (não o PDF em si) vai para o Neon, quebrado em chunks (fragmentos) + embeddings. |

> [!IMPORTANT]
> **Regra Geral:** O Neon guarda apenas texto e metadados — nunca arquivos binários grandes. Vídeo, áudio e imagem continuam existindo no storage e são apenas referenciados no banco de dados.

---

## 2. Fluxo de ingestão de uma apostila/PDF (Executado pelo Admin)

Esta operação roda apenas uma vez por material cadastrado (ou quando atualizado) — nunca a cada pergunta do aluno.

1. **Upload:** O Admin sobe o arquivo PDF no Drive/storage.
2. **Extração:** O backend lê esse arquivo, extrai o texto bruto e separa as imagens embutidas nas páginas do PDF.
3. **Chunking e Embeddings:** O texto extraído é quebrado em chunks (pedaços pequenos). Cada chunk é enviado para a API de embeddings do Gemini para gerar sua representação vetorial (vetor numérico de significado).
4. **Associação de Imagens:** Cada imagem extraída é salva como arquivo individual no storage e vinculada ao chunk de texto correspondente à sua página original de origem, usando o campo `imagens_associadas` no registro do banco.
5. **Legenda Multimodal:** Opcionalmente, cada imagem passa pelo Gemini Vision para gerar uma descrição em texto (legenda automática). Isso torna os elementos gráficos pesquisáveis na busca semântica.
6. **Persistência:** Chunks de texto + embeddings vetoriais + referências de imagem são persistidos no Neon. O PDF original permanece armazenado no Drive apenas como backup/origem.

---

## 3. Fluxo de resposta a uma pergunta do aluno (Execução em Tempo Real)

O Drive **nunca** é consultado durante as perguntas dos alunos — a consulta é feita direto nas tabelas otimizadas do Neon.

1. **Seleção:** O aluno seleciona o material (fontes) e a ação desejada no painel (ex: *"Resumo em Áudio"*).
2. **Validação:** O backend verifica se o aluno possui saldo de cotas diárias ativo no Neon.
3. **Busca Semântica (RAG):** O backend realiza uma busca vetorial no Neon baseada na similaridade de cossenos entre o embedding da pergunta do aluno e os chunks de texto indexados das fontes selecionadas.
4. **Prompting:** O backend recupera os chunks mais relevantes, monta o prompt composto (Contexto das fontes + Instruções específicas da funcionalidade) e envia para a API do Gemini.
5. **Geração:** O Gemini processa o prompt e retorna o texto correspondente (ex: o roteiro estruturado do resumo).
6. **Conversão de Formato (TTS):** Se a ação selecionada exigir outro formato (ex: áudio), o texto gerado passa por um microsserviço de Text-to-Speech (TTS) para gerar o arquivo de áudio.
7. **Anexação de Mídias:** Caso os chunks utilizados no contexto possuam referências de imagens no campo `imagens_associadas`, as URLs dessas imagens são resgatadas do storage e acopladas à resposta.
8. **Retorno:** O resultado final (texto + mídias/áudio) é renderizado para o aluno na interface.
9. **Arquivamento:** Opcionalmente, o histórico e a produção final gerada são arquivados no storage e apenas o ID de referência do histórico é salvo no Neon.
10. **Download:** Se o aluno clicar em "Baixar", o backend deduz 1 cota de download, aplica a marca d'água de segurança e serve o arquivo para o navegador.

---

## 4. Regra de Fallback (Busca Externa)

Caso a similaridade dos chunks encontrados na biblioteca oficial (Neon) fique abaixo de um limiar mínimo aceitável para responder com precisão ao assunto perguntado:
1. O sistema realiza uma busca complementar em fontes externas.
2. Apenas domínios autorizados na **whitelist de segurança** são consultados (ex: `planalto.gov.br`, `mec.gov.br`).
3. O tutor sinaliza visualmente na interface que aquela informação complementar foi obtida externamente, separando-a do material oficial do edital.

---

## 5. Gestão de Limites do Banco de Dados (Neon Free Tier)

* **Texto Puro:** Um arquivo PDF de 5MB, depois de limpo e extraído o texto puro, ocupa poucas centenas de KB no banco.
* **Storage Auxiliar:** Vídeos, áudios e imagens ficam 100% hospedados no Drive/Storage (limites de TB), mantendo o banco de dados Neon abaixo do limite gratuito de 500MB.
* **Política de Retenção:** As produções dos alunos (histórico) que crescem com o uso contínuo podem ter uma política de expiração, onde o histórico de texto é arquivado no storage local após X dias e removido do banco Neon ativo.
