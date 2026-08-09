# Backlog: IA na Jornada do Cliente

Backlog de features inovadoras pra evoluir o LeroyMerlin MVP, focadas em usar IA pra transformar a jornada do cliente dentro da loja — não só adicionar telas novas, mas mudar a forma como ele interage com o app.

Contexto: o desafio da FIAP pede pra resolver 3 dores centrais do cliente em loja física:
1. **Assimetria de informação** — o cliente não sabe o nome técnico do que precisa; esse conhecimento fica só com o vendedor.
2. **Último metro** — mesmo sabendo o que quer, é difícil achar o produto exato no meio da loja.
3. **Inércia do suporte** — sistemas engessados e vendedores ocupados fazem o cliente desistir de pedir ajuda.

As 4 features abaixo atacam essas dores de formas diferentes. Cada uma tem uma seção explicando o que é, por que importa, como funcionaria na prática, o que já existe no projeto que ajuda, o que falta construir, e uma estimativa de esforço.

---

## 1. Copiloto agêntico da jornada

### O que é, em uma frase
Um assistente de IA único, por voz ou texto, que não só responde perguntas — ele **executa ações reais no app** por você: busca produtos, aplica filtros, abre comparações, monta listas de compra, tudo enquanto conversa.

### Por que importa
Hoje a IA no app é "burra" no sentido de que só responde dentro de uma caixinha (o chat do produto responde sobre aquele produto; o Projeto Guiado só gera uma lista). O cliente ainda precisa navegar manualmente entre telas pra juntar tudo. O copiloto agêntico inverte isso: o cliente fala o que quer, em uma frase natural, e o app reage sozinho na frente dele.

Isso ataca as 3 dores ao mesmo tempo, porque a navegação inteira deixa de depender do cliente saber onde clicar.

### Como funcionaria, na prática
1. Cliente abre um chat persistente (ícone fixo, tipo um "balão" que acompanha ele em qualquer tela do app, não só dentro do drawer de um produto).
2. Ele digita ou fala algo como: *"quero pintar meu quarto de 12 metros, tenho até 400 reais, e queria comparar tinta fosca com acetinada"*.
3. Por trás, a IA entende esse pedido e decide quais ações tomar — não é só gerar uma resposta em texto, ela **chama funções reais do app**: busca produtos de tinta, aplica o filtro de preço até R$400, seleciona as opções fosca/acetinada, e abre elas no comparador.
4. Enquanto isso acontece, o cliente vê a tela mudando ao vivo (os filtros se marcam sozinhos, os resultados aparecem, o comparador abre) — e a IA narra o que está fazendo: *"encontrei 6 opções de tinta dentro do seu orçamento, separei as 2 melhores avaliadas pra você comparar"*.
5. O cliente pode continuar a conversa naturalmente: *"adiciona a mais barata no carrinho"* — e o item entra no carrinho sem ele precisar tocar em nenhum botão.

### O que já existe no projeto que ajuda
- Já tem chat com IA (Gemini) integrado no drawer do produto — a base de conversação já existe, só falta ela ganhar "mãos" pra agir na interface.
- Já tem toda a infraestrutura de busca, filtros, comparador e carrinho prontos — o copiloto não cria essas funcionalidades do zero, ele **aprende a operar as que já existem**.
- Já tem entrada por voz (usada no Projeto Guiado, via Web Speech API do navegador) — reaproveitável aqui.

### O que falta construir
- Trocar o uso simples da API do Gemini por "function calling" (a IA recebe uma lista de "ferramentas" disponíveis — buscar produto, aplicar filtro, abrir comparador, adicionar ao carrinho — e decide sozinha quais chamar e com quais parâmetros, baseado no que o cliente pediu).
- Um componente de chat "flutuante" global (visível em qualquer tela, não preso a um produto específico).
- Conectar cada "ferramenta" que a IA pode chamar às funções que já existem no código (ex: a ferramenta "aplicar filtro de preço" simplesmente chama o `setFiltroPrecoMax` que já existe no componente de busca).
- Feedback visual de "a IA está agindo agora" (ex: um pequeno indicador tipo "🤖 buscando produtos...", pra o cliente entender que algo está acontecendo, não travou).

### Esforço estimado
**Alto.** É a feature mais ambiciosa da lista — não é um componente novo isolado, é uma camada que atravessa o app inteiro. Mas também é a que reaproveita mais coisa que já existe (o "trabalho pesado" de busca/filtro/carrinho já está pronto, o copiloto só aprende a acioná-los).

### Riscos
- Function calling do Gemini precisa de um desenho cuidadoso de quais "ferramentas" expor e como description cada uma pra IA entender quando usar — se mal desenhado, ela erra a ação ou trava perguntando confirmação toda hora.
- Precisa de um bom fallback: se a IA não tiver certeza do que fazer, ela deve perguntar ao cliente em vez de agir errado (ex: "encontrei tinta em 3 corredores diferentes, qual loja você prefere?").

---

## 2. Diagnóstico visual do problema (câmera)

### O que é, em uma frase
Em vez do cliente digitar ou procurar o produto, ele **tira uma foto do problema** — um cano vazando, uma parede rachada, um cômodo bagunçado — e a IA identifica o que está errado e recomenda os produtos certos.

### Por que importa
É a resposta mais direta pra dor #1 do edital: o cliente muitas vezes nem sabe o nome técnico do que precisa ("aquele negócio que estanca vazamento" em vez de "veda-rosca" ou "fita teflon"). Com uma foto, ele não precisa saber nome nenhum — só mostra o problema.

### Como funcionaria, na prática
1. Na tela de busca, ao lado da opção já existente de "buscar produto por foto" (que hoje busca o próprio produto), adiciona uma opção separada: *"Não sei o nome, mas posso te mostrar o problema"*.
2. Cliente tira ou envia uma foto — por exemplo, uma torneira pingando.
3. A IA (usando a capacidade de visão do Gemini, que já é usada no projeto pra outras coisas) analisa a imagem e responde em linguagem simples: *"Parece um vazamento na conexão da torneira. Isso geralmente é resolvido trocando o vedante ou a arruela. Aqui estão os produtos que você provavelmente precisa:"* — seguido de uma lista de produtos reais do catálogo (vedante, fita veda-rosca, chave de grifo).
4. Cada produto sugerido abre normalmente no drawer, com a rota no mapa da loja, como qualquer outro resultado de busca.

### O que já existe no projeto que ajuda
- Busca por imagem já existe (`components/SearchSection.tsx`, área de arrastar/soltar foto) — a interface de upload de imagem já está pronta, essa feature usa o mesmo ponto de entrada com um "modo" diferente.
- A API do Gemini usada no projeto já suporta entrada multimodal (texto + imagem) — não é uma tecnologia nova pro projeto, é um uso novo dela.

### O que falta construir
- Uma rota de API nova (ex: `/api/diagnostico-visual`) que recebe a imagem e um prompt específico pedindo à IA pra identificar o problema (não o produto em si) e sugerir categorias/palavras-chave de busca.
- Cruzar a resposta da IA com o catálogo real de produtos (a IA identifica o problema em texto livre, mas os produtos sugeridos precisam existir de verdade no estoque — provavelmente reaproveitando a busca semântica que já existe, passando o diagnóstico da IA como se fosse o texto de busca).
- Ajuste de UI simples: um toggle ou botão "problema" vs. "produto" na área de busca por foto.

### Esforço estimado
**Médio.** Reaproveita muita coisa que já existe (upload de imagem, API do Gemini, busca semântica). O trabalho principal é o prompt de diagnóstico e conectar a saída dele à busca já existente.

### Riscos
- Qualidade do diagnóstico depende de quão boa é a foto (iluminação, ângulo) — vale ter uma mensagem de fallback amigável quando a IA não tiver certeza ("não consegui identificar bem o problema, pode descrever com suas palavras?").

---

## 3. Agente proativo por comportamento

### O que é, em uma frase
Em vez de esperar o cliente pedir ajuda, a IA **observa o comportamento de navegação** (quantos produtos parecidos ele abriu, quanto tempo ficou numa categoria) e oferece ajuda sozinha, no momento certo.

### Por que importa
Ataca a dor #3 (inércia do suporte) de um jeito mais sutil — simula o que um bom vendedor de loja física faz: percebe quando alguém está indeciso e se aproxima, sem esperar ser chamado.

### Como funcionaria, na prática
1. O app acompanha em segundo plano ações do cliente na sessão atual — por exemplo, quantos produtos da mesma categoria ele abriu no drawer, ou quanto tempo passou na mesma tela de categoria sem adicionar nada ao carrinho.
2. Quando um padrão de indecisão é detectado (ex: abriu 4 furadeiras diferentes em poucos minutos, sem comprar nenhuma), aparece uma sugestão discreta e não-intrusiva — tipo um balãozinho no canto: *"Notei que você está olhando várias furadeiras. Quer que eu compare as 3 mais parecidas com o que você já viu?"*
3. Se o cliente aceitar, abre o comparador já preenchido com os produtos que ele mesmo visitou. Se ignorar, a sugestão some sozinha depois de um tempo, sem insistir.

### O que já existe no projeto que ajuda
- Já existe rastreio de histórico de produtos visitados (`lib/clientFavoritos.ts` / histórico usado em "Minha Conta") — a base de "o que o cliente andou vendo" já está sendo guardada.
- Já existe o comparador de produtos pronto pra receber uma lista de IDs e mostrar lado a lado.

### O que falta construir
- Uma lógica simples de "detecção de padrão" rodando no navegador (sem precisar de IA pesada aqui — é mais regra do tipo "3+ produtos da mesma categoria em N minutos sem adicionar ao carrinho").
- O componente do balão de sugestão proativa (pequeno, discreto, fácil de fechar).
- Conectar a sugestão aceita ao comparador já existente (reaproveitando a função `definirComparador` que já foi criada).

### Esforço estimado
**Baixo/Médio.** É a mais simples tecnicamente das 4 — não depende de nenhuma chamada nova de IA generativa, só de regras sobre dados que já são coletados. O trabalho é mais de UX (deixar a sugestão útil sem ser irritante) do que técnico.

### Riscos
- Se mal calibrado, pode parecer "invasivo" ou repetitivo — vale ter um limite de quantas vezes por sessão a sugestão aparece.

---

## 4. Timeline de projeto gerada por IA

### O que é, em uma frase
Evolução do Projeto Guiado que já existe: em vez de só listar os materiais necessários, a IA monta uma **sequência de etapas no tempo** — o que comprar e fazer primeiro, o que depende do quê.

### Por que importa
Hoje o Projeto Guiado responde "o que comprar". Essa feature responde "em que ordem fazer" — que é a pergunta seguinte natural de quem nunca fez uma reforma e não sabe que, por exemplo, não dá pra comprar tinta antes de saber a metragem exata da parede preparada.

### Como funcionaria, na prática
1. Depois que o Projeto Guiado gera a lista de materiais (fluxo que já existe), adiciona uma seção nova: *"Ordem sugerida"*.
2. A IA organiza os mesmos itens já identificados em etapas — por exemplo, pra uma reforma de banheiro: *"Etapa 1: remoção e preparo (compre isso primeiro) → Etapa 2: hidráulica → Etapa 3: acabamento (piso, azulejo) → Etapa 4: pintura e detalhes"*.
3. Cada etapa mostra só os produtos daquele momento, ajudando o cliente a não comprar tudo de uma vez sem necessidade (ou pior, esquecer algo que só descobre que precisa no meio do processo).

### O que já existe no projeto que ajuda
- O Projeto Guiado inteiro já existe e já faz a parte difícil (entender a descrição do cliente e identificar os materiais) — essa feature só adiciona uma camada de organização em cima do resultado que já é gerado.

### O que falta construir
- Ajustar o prompt que já é usado no Projeto Guiado pra, além de listar os materiais, também classificar cada um em uma etapa/fase do projeto.
- Um componente visual de timeline/etapas (pode ser simples — uma lista vertical com os grupos, sem precisar de nada elaborado).

### Esforço estimado
**Baixo.** É a menor mudança técnica das 4 — é essencialmente um ajuste no prompt de uma feature que já existe, mais uma forma diferente de exibir o resultado.

### Riscos
- Nenhum risco técnico grande. O cuidado é o prompt não inventar uma ordem genérica que não faça sentido pro projeto específico do cliente.

---

## Ordem sugerida de implementação

| # | Feature | Esforço | Impacto na demo |
|---|---------|---------|------------------|
| 1 | Diagnóstico visual do problema | Médio | Alto — visual, fácil de entender em 10 segundos de vídeo |
| 2 | Timeline de projeto | Baixo | Médio — reforça o Projeto Guiado que já existe |
| 3 | Agente proativo | Baixo/Médio | Médio — sutil, mas mostra "inteligência" sem precisar de script |
| 4 | Copiloto agêntico | Alto | Muito alto — a mais impressionante, mas a mais arriscada de fazer funcionar bem a tempo |

Sugestão de caminho: começar pelas **2 e 3** (mais rápidas, quase sem risco, já deixam o app mais "esperto"), depois **1** (bom equilíbrio custo/impacto), e deixar a **4** como o "grande final" se sobrar tempo — ela é a mais forte pra impressionar, mas também a que mais pode dar errado em cima da hora se for deixada pro fim sem tempo de testar direito.
