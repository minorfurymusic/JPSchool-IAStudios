# Checklist — Ideias aprovadas para implementar depois

Itens discutidos e aprovados em conceito, mas propositalmente adiados. Não implementar sem revisitar esta lista com o Jean primeiro.

## 1. "Comece por Aqui" — metodologia de estudo guiada
Problema que resolve: aluno se perde com ~20 ferramentas de IA sem saber por onde começar.
Ideia: um passo a passo/tutorial fixo no topo do Estúdio, apresentando a metodologia própria da JPSchool (sequência sugerida de uso das ferramentas), não só uma lista de botões soltos.

## 2. Revisão espaçada / trilha por ponto fraco
Formato: sugestão contextual, não um botão dedicado. Ex: "Faz 2 semanas que você viu [assunto] — revisar agora aumenta a retenção." Buscar e citar um estudo real de repetição espaçada antes de definir qualquer número/percentual — nunca inventar estatística.
Depende de: registrar quando o aluno estudou cada assunto (hoje não é rastreado por assunto/data).

## 3. Cronograma adaptativo com IA
Já existe um botão de cronograma (Gerar/Acompanhar Plano de Estudo). Ideia aprovada: cruzar atividade real (questões respondidas, simulados concluídos, desempenho neles) como sinal primário, e tempo de acesso só como sinal secundário — tempo logado sozinho não comprova estudo real.

## 4. Gamificação leve
Ideias: streak de dias estudando consecutivos; taxa de acerto por matéria comparada à média agregada dos outros alunos (sem expor identidade); selo ao concluir 100% de uma trilha/matéria.
Dá para calcular com os dados que já existem (logs de auditoria, respostas de questões) — sem infraestrutura nova.

## 5. IA proativa
Notificar o aluno (e-mail/push, quando existir) quando o sistema detectar pouco uso ou proximidade da prova, em vez de esperar ele voltar sozinho.

## 6. Paginação nas tabelas do Admin Backstage
Não urgente com o volume atual de registros. Revisitar quando a base de matrículas/pagamentos/logs crescer de verdade.

## 7. Raio-X da Banca — 2 óticas (depende do item 8)
**Ótica 1 — prioridade de estudo por incidência histórica:** análise dos últimos 5 anos de provas, distribuída por assunto, definindo prioridade de estudo e de exercícios. O admin anexa esse documento de análise dentro de cada curso individual. Depende de existir o conceito de curso individual (item 8) e de uma forma de anexar documento por curso.

**Ótica 2 — estatística real de acerto:** cálculo agregado de "X alunos responderam, Y acertaram" por assunto, considerando **exclusivamente** as questões reais da banca (banco de dados), separadas das questões geradas pela IA (existe um botão dentro do Estúdio que gera questões parecidas, não idênticas às do banco).
**Bloqueio atual:** o sistema não registra em lugar nenhum se um aluno acertou ou errou uma questão — isso vive só na tela e se perde. Precisa criar esse registro (quem respondeu o quê, certo/errado, questão oficial vs. gerada por IA) antes de conseguir calcular qualquer estatística.

## 8. Unificação de Cursos/Matérias + telas de conteúdo (confirmado)
Hoje existem duas portas de entrada para o mesmo dado (`storage/cursos_materias.json`): a aba "Categorias" do Editor de Layout e a tela "Gestão de Conteúdo" (Drive/processamento). Decisão tomada: **unificar as duas em uma só tela**, junto com o modelo de cursos por área (Professor + disciplina; Educação Infantil e Educação Especial como cursos separados fora do bloco Professor). O Raio-X ótica 1 depende disso.
