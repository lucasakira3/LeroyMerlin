# Backlog: Fluxo de Loja Física e Jornada Guiada do Cliente

Segundo backlog de ideias inovadoras pro LeroyMerlin MVP — foco específico em **melhorar o fluxo dentro da loja física** e guiar o cliente do início ao fim da visita, complementando o backlog anterior ([`product-backlog-ia-jornada.md`](./product-backlog-ia-jornada.md), já implementado). Cada ideia é descrita com detalhe técnico suficiente pra qualquer desenvolvedor pegar e implementar sem precisar re-derivar o desenho: o que já existe no projeto que ajuda, exatamente o que precisa ser criado (arquivos, estruturas de dado, algoritmos), esforço estimado e riscos.

Convenções técnicas do projeto que todas as ideias abaixo seguem (não repetidas em cada seção):
- **Sem backend/banco de dados real.** Tudo é `localStorage` no navegador. Padrão de leitura/escrita: uma função `ler()`/`salvar()` privada por arquivo em `lib/`, com `try/catch` em volta do `JSON.parse` (dado corrompido vira lista vazia, nunca quebra a tela).
- **Reatividade entre componentes** é feita via `window.dispatchEvent(new Event('lm-<algo>-change'))` dentro da própria função que salva, e `window.addEventListener('lm-<algo>-change', ...)` em quem precisa reagir ao vivo (ver `lib/clientFavoritos.ts`, `lib/clientCarrinho.ts`, `lib/clientNotificacoes.ts`).
- **Nada de dado fake por trás de números "aleatórios".** Quando uma feature precisa de uma variação que pareça arbitrária mas precisa ser sempre igual pro mesmo produto (ex: desconto, imagem escolhida), o padrão é um hash determinístico do `id` do produto (ver `lib/ofertas.ts`, `lib/marcas.ts`, `lib/categoriaImagens.ts`) — nunca `Math.random()` puro, porque isso mudaria a cada reload.
- **IA generativa** já está integrada via Gemini em várias rotas `app/api/*/route.ts` (`/api/duvidas`, `/api/projeto`, `/api/perfil/sugestoes`, `/api/diagnostico-visual`, `/api/vision`) — reaproveitar o cliente Gemini já configurado, nunca criar uma segunda integração paralela.
- **Notificações reais** (não simuladas) usam `lib/clientNotificacoes.ts` → `adicionarNotificacao(email, { tipo, titulo, mensagem, href })`, com `tipo` hoje limitado a `'pedido' | 'agendamento' | 'entrevista'` (union type que precisa crescer se uma ideia nova disparar notificação).
- **Layout físico da loja**: 50 corredores dispostos em 2 fileiras de 25 (`components/StoreMap.tsx`), com um slug normalizado tipo `"corredor-14"` (ou letras especiais tipo `"e-3"` pra Elétrica) resolvido por `getCorredorRowIndex(corridorNorm)` → `{ row: 1|2, idx: 0-24 }`. Todo produto do catálogo já carrega esse slug no campo `corredor_normalizado`. Qualquer ideia que precise "saber onde o produto fica fisicamente" usa essa função — nunca inventar um segundo sistema de coordenadas.

---

## Grupo A — Navegação física dentro da loja

### 1. Rota de Compra Inteligente (roteamento tipo GPS de corredor)

**O que é, em uma frase:** dado o carrinho ou uma lista de materiais do Projeto Guiado, calcular a ordem de corredores que minimiza a caminhada total e desenhar essa rota como uma linha sobre o `StoreMap`, em vez de só mostrar pins soltos.

**Por que importa:** hoje o mapa mostra *onde* cada produto está, mas não *em que ordem* ir buscar tudo — o cliente ainda precisa decidir sozinho a sequência, indo e voltando pela loja sem necessidade. É a diferença entre "aqui está um mapa" e "aqui está o caminho".

**Como funcionaria, na prática:**
1. Em qualquer tela que já tenha uma lista de produtos com localização (carrinho, resultado do Projeto Guiado, lista de comparação), um botão novo "Ver rota no mapa".
2. Abre o `StoreMap` com os pins de sempre, mas agora conectados por uma polyline SVG numerada (1, 2, 3...) na ordem sugerida de visita.
3. Abaixo do mapa, uma lista textual simples reforça a mesma ordem: "1. Corredor 14 — Furadeira · 2. Corredor 9 — Fio elétrico · 3. Corredor 48 — Tinta".

**Algoritmo (client-side, sem custo de API):** como o layout é só 2 fileiras retas (não um labirinto 2D complexo), o problema não precisa de um solver de TSP genérico — é o mesmo caso de "roteamento serpentina" (*S-shape / serpentine routing*) usado de verdade em logística de armazém: percorrer a fileira 1 em ordem crescente de `idx`, depois a fileira 2 (também em ordem, ou decrescente se a saída/entrada entre fileiras for mais curta terminando do lado oposto de onde começou). Implementação:
```ts
// lib/rotaLoja.ts
interface ParadaRota { corredorNormalizado: string; row: 1 | 2; idx: number }

export function calcularRota(corredores: string[]): ParadaRota[] {
  const paradas = corredores
    .map(c => ({ corredorNormalizado: c, pos: getCorredorRowIndex(c) }))
    .filter((p): p is { corredorNormalizado: string; pos: { row: 1|2; idx: number } } => p.pos !== null)
    .map(p => ({ corredorNormalizado: p.corredorNormalizado, row: p.pos.row, idx: p.pos.idx }))

  // remove corredores duplicados (dois produtos no mesmo corredor = 1 parada só)
  const unicos = Array.from(new Map(paradas.map(p => [p.corredorNormalizado, p])).values())

  // ordena por fileira, depois por posição — fileira 2 em ordem invertida
  // pra terminar perto de onde a fileira 1 começou (caminho em "S")
  return unicos.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.row === 1 ? a.idx - b.idx : b.idx - a.idx
  })
}
```
Isso é `O(n log n)`, roda instantaneamente no navegador, e é **exatamente o mesmo tipo de heurística usada em picking de armazém real** — não é uma simplificação ingênua, é o algoritmo padrão da indústria pra esse tipo de layout retangular de 2 fileiras.

**O que já existe que ajuda:** `getCorredorRowIndex` e o sistema de coordenadas pixel (`getPos`) em `StoreMap.tsx`, o próprio componente de mapa (só precisa aceitar uma prop nova `rota?: ParadaRota[]` e desenhar uma `<polyline>` ligando os centros dos corredores na ordem recebida).

**O que falta construir:** `lib/rotaLoja.ts` (função acima), prop nova em `StoreMap.tsx` pra desenhar a polyline + numeração nos pins, e o botão "Ver rota" nas 3 telas mencionadas (reaproveitando os IDs de produto já disponíveis em cada uma).

**Esforço estimado:** Baixo/Médio — o algoritmo é simples, o trabalho real é visual (desenhar a linha e os números sobre o SVG existente).

**Riscos:** nenhum técnico relevante. Cuidado de UX: deixar claro que é uma sugestão de ordem, não uma obrigação (cliente pode ignorar e navegar como quiser).

---

### 2. Modo Mãos Livres (assistente de voz contínuo, não um comando isolado)

**O que é, em uma frase:** hoje a busca por voz é um comando único ("ouve uma frase, faz uma busca, acabou"); a ideia é uma sessão de voz contínua que encadeia busca → rota → carrinho numa única conversa falada, sem o cliente tocar na tela.

**Por que importa:** o cenário real é o cliente com as mãos ocupadas empurrando um carrinho — um comando de voz isolado ainda exige tocar a tela pra continuar o fluxo (abrir o produto, adicionar ao carrinho). Um modo contínuo elimina esse atrito por completo.

**Como funcionaria, na prática:**
1. Um botão "Modo mãos livres" (ícone de fone/microfone grande) entra num estado de escuta contínua usando a mesma Web Speech API já usada no Projeto Guiado (`SpeechRecognition`, com `continuous: true` em vez de uma captura única).
2. Cada frase reconhecida vira uma mensagem enviada pro mesmo backend de function calling descrito na ideia "Copiloto agêntico" do backlog anterior (se aquela feature existir) — ou, numa versão mais simples sem function calling, um parser de intenção leve local: se a frase contém um verbo de ação conhecido ("adiciona", "compara", "onde fica"), decide a ação; senão, trata como busca.
3. A cada ação, a IA responde por voz (Web Speech Synthesis, `SpeechSynthesisUtterance`) confirmando o que fez: "Adicionei ao carrinho. Também quer o parafuso pra instalar?".

**O que já existe que ajuda:** captura de voz já implementada em `components/ProjetoWizard.tsx`/`SearchBar.tsx` (Web Speech API do navegador, sem custo de API externa pra reconhecimento); toda a infraestrutura de busca/carrinho já pronta.

**O que falta construir:** `lib/hooks/useVozContinua.ts` (wrapper de `SpeechRecognition` em modo `continuous`), um parser de intenção simples (`lib/intencaoVoz.ts` — dicionário de verbos → ação, ex: `/adicion(a|e)/ → 'carrinho'`), e o componente de UI do modo (indicador visual de "ouvindo", histórico da conversa em texto pra quem preferir ler).

**Esforço estimado:** Médio — a parte de voz contínua e feedback em áudio é nova (síntese de voz não é usada em nenhum outro lugar do projeto ainda), mas o roteamento de ações reaproveita tudo que já existe.

**Riscos:** reconhecimento de voz contínuo em ambiente de loja (barulho de fundo) é o maior risco prático — vale ter sempre um fallback visual (texto reconhecido aparece na tela, cliente pode corrigir por toque se a IA entender errado).

---

### 3. Botão SOS de Corredor (chamado de ajuda geolocalizado por corredor)

**O que é, em uma frase:** um botão "Preciso de ajuda aqui", disponível em qualquer tela de produto, que dispara um chamado real e imediato pro painel do funcionário — já com o corredor e o produto anexados, tipo uma campainha de mesa de restaurante.

**Por que importa:** fecha o ciclo cliente↔funcionário em tempo real. É diferente de "Tire Dúvidas" (que é um chat com IA) porque aqui o cliente quer uma pessoa de verdade, no lugar físico onde ele está — e o funcionário já sabe exatamente onde ir e sobre o que, sem precisar perguntar.

**Como funcionaria, na prática:**
1. Botão flutuante no `ProdutoDrawer` (ou em qualquer tela com produto aberto): "🆘 Preciso de ajuda aqui".
2. Ao tocar, cria um chamado usando a mesma estrutura de fila que já existe no painel do funcionário (`lib/chamadosFuncionario.ts`, hoje alimentada pelos agendamentos de visita) — só que esse chamado nasce direto do cliente andando pela loja, não de um agendamento prévio.
3. No painel do funcionário (`app/funcionario/chamados/page.tsx`), o chamado aparece com prioridade alta, mostrando corredor + nome do produto + horário, pra qualquer funcionário livre atender.
4. Cliente vê um status simples ("Chamado enviado — um funcionário já foi avisado") e pode cancelar se resolver sozinho.

**O que já existe que ajuda:** `lib/chamadosFuncionario.ts` e a tela `app/funcionario/chamados/page.tsx` já são reais e funcionam (fila, nota, encerrar chamado) — construídos sobre agendamentos; precisam só de uma segunda origem de chamado.

**O que falta construir:** generalizar `chamadosFuncionario.ts` pra aceitar uma origem `'agendamento' | 'sos-corredor'` (hoje só lê de `AgendamentosLista`), um novo tipo `ChamadoSOS { produtoId, corredor, criadoEm, status }` guardado à parte (`lib/chamadosSOS.ts`, mesmo padrão de localStorage), e o botão + estado (enviado/cancelado) no lado do cliente.

**Esforço estimado:** Baixo/Médio — reaproveita quase toda a fila já existente, só muda a origem do dado.

**Riscos:** sem um funcionário real "puxando" a fila em loja real, isso é conceitual pro MVP — mas tecnicamente já é um sistema de fila funcional de verdade (só falta o hardware/pessoa do outro lado, que é fora do escopo de qualquer app).

---

### 4. Leitura de Prateleira em Tempo Real (etiqueta desatualizada → preço/estoque ao vivo)

**O que é, em uma frase:** cliente aponta a câmera pra placa/etiqueta de um corredor (ou de uma prateleira específica), a IA lê o texto da placa (nome da categoria, ou um código impresso nela) e devolve o preço, estoque e promoções **atuais** direto do sistema — resolvendo o problema real de etiqueta física desatualizada.

**Por que importa:** em loja física, o preço na etiqueta impressa pode estar desatualizado (troca de preço, promoção nova). Isso dá ao cliente uma forma de confirmar o preço real na hora, sem precisar achar um funcionário ou caixa de autoatendimento.

**Como funcionaria, na prática:**
1. Reaproveita a mesma área de "buscar produto por foto" já existente, com um modo novo: "Ler placa do corredor".
2. Cliente fotografa a placa/etiqueta (que already existe fisicamente identificando o corredor, ex: "CORREDOR 14 — FERRAMENTAS ELÉTRICAS").
3. A IA (Gemini vision, mesma capacidade já usada em `/api/diagnostico-visual`) faz OCR simples da placa e devolve a categoria/subcategoria identificada em texto.
4. O app cruza esse texto com o catálogo real (mesma busca semântica/textual já usada em outras telas) e mostra a lista de produtos daquele corredor com preço e estoque **atuais** (incluindo desconto de `/ofertas`, se houver).

**O que já existe que ajuda:** rota `/api/diagnostico-visual` já processa imagem + prompt de identificação; busca por categoria já existe (`/api/categoria/[slug]`); `lib/ofertas.ts` já teria os preços/promoções certos automaticamente, já que é o mesmo dado usado em qualquer outra tela.

**O que falta construir:** uma rota nova (ou parâmetro novo na existente) `/api/leitura-placa` com prompt específico de OCR-e-categorização ("leia o texto desta placa de corredor de loja e diga a que categoria de produtos ela se refere, dentre: Ferramentas, Elétrica, Hidráulica..."), e a tela de resultado (lista simples reaproveitando o grid/lista de categoria já existente).

**Esforço estimado:** Médio — a parte difícil (visão computacional) já está resolvida pelo Gemini; o trabalho é o prompt e conectar a categoria identificada à busca existente.

**Riscos:** qualidade de OCR depende de foto legível (ângulo, iluminação, reflexo em placa plástica) — sempre ter fallback pra busca manual se a IA não reconhecer.

---

## Grupo B — Assistência inteligente durante a decisão de compra

### 5. Termômetro de Orçamento Vivo

**O que é, em uma frase:** o orçamento hoje é uma resposta de quiz usada uma vez (Entrevista Guiada); a ideia é transformar isso numa barra de progresso viva, visível durante toda a navegação, que reage a cada item adicionado ao carrinho e sugere trocas quando o cliente se aproxima do limite.

**Por que importa:** ninguém pensa em orçamento só uma vez no início — pensa a cada item que coloca no carrinho. Um orçamento "vivo" transforma um dado estático (resposta de formulário) num copiloto financeiro ativo durante a jornada inteira.

**Como funcionaria, na prática:**
1. Ao responder a Entrevista Guiada (ou a qualquer momento em "Minha Conta"), o cliente define um valor numérico de orçamento (hoje é uma faixa tipo "R$300–600" — vira um valor exato opcional, ex: R$500).
2. Uma barra fixa (ex: no rodapé do carrinho, ou um widget pequeno no header) mostra `total do carrinho / orçamento`, mudando de cor (verde → amarelo → vermelho) conforme se aproxima ou passa do limite.
3. Ao ultrapassar 90% do orçamento, a IA sugere uma troca concreta: para cada item do carrinho acima de uma faixa de preço, busca no catálogo um produto da mesma categoria com preço menor (`lib/perfilSugestoes.ts` já tem lógica de pontuação por categoria e faixa de preço, reaproveitável) e oferece "Trocar [item caro] por [item mais barato] e economizar R$X".

**O que já existe que ajuda:** `lib/clientCarrinho.ts` (total do carrinho já calculado em `app/carrinho/page.tsx`), `lib/perfilSugestoes.ts` (motor de pontuação por categoria/faixa de preço, construído pra Entrevista Guiada mas genérico o bastante pra reaproveitar aqui).

**O que falta construir:** um campo `orcamentoValor?: number` no `Perfil` (`types/perfil.ts`), um componente `components/TermometroOrcamento.tsx` (barra de progresso simples, sem dependência nova), e uma função `lib/sugestaoEconomia.ts` que, dado um item caro do carrinho, busca uma alternativa mais barata na mesma categoria.

**Esforço estimado:** Baixo/Médio — a parte de "buscar alternativa mais barata" é essencialmente um filtro + sort por preço no catálogo já existente (`lib/ordenarProdutos.ts` já faz sort por preço).

**Riscos:** a sugestão de troca precisa ser genuinamente comparável (mesma categoria, função similar) — cuidado pra IA/heurística não sugerir trocar uma furadeira por um martelo só porque é mais barato.

---

### 6. Assistente de Compatibilidade de Peças

**O que é, em uma frase:** cliente fotografa uma peça que já tem instalada em casa (uma torneira, uma tomada, uma dobradiça) e a IA identifica as especificações visuais (tipo de rosca, formato, cor, tamanho aparente) pra encontrar a peça de reposição/complemento compatível no catálogo — diferente do "Diagnóstico visual" (que resolve um *problema*), aqui o objetivo é *compatibilidade* com algo que já existe.

**Por que importa:** um erro comum em reforma é comprar a peça errada por não saber o nome técnico do padrão (ex: "rosca BSP de 1/2 polegada") — o cliente sabe reconhecer visualmente o que já tem em casa, mas não sabe descrever tecnicamente.

**Como funcionaria, na prática:**
1. Mesmo ponto de entrada de busca por foto, modo "Já tenho uma peça parecida com essa, quero uma igual ou compatível".
2. A IA (Gemini vision) descreve as características técnicas prováveis a partir da imagem (formato de rosca, número aproximado de furos de fixação, estilo/acabamento) e gera uma frase de busca técnica a partir disso.
3. Essa frase alimenta a busca semântica já existente no catálogo, mesma forma que a busca por texto normal funciona hoje.
4. Resultado mostra produtos com um aviso claro: "Baseado na foto, isso parece compatível — confirme as medidas antes de comprar" (a IA não tem certeza absoluta a partir só de uma foto, então a mensagem nunca promete 100%).

**O que já existe que ajuda:** infraestrutura de busca por imagem e busca semântica textual já prontas; é o mesmo padrão do "Diagnóstico visual" já documentado no primeiro backlog, só com um prompt e um enquadramento de resultado diferentes.

**O que falta construir:** variante de prompt na rota de visão já existente (ou uma nova, `/api/compatibilidade-peca`), e o aviso de "confirme antes de comprar" na tela de resultado.

**Esforço estimado:** Baixo — é quase inteiramente reaproveitamento do "Diagnóstico visual" com um prompt diferente; se aquela feature já existir no código, essa é majoritariamente cópia + ajuste de texto.

**Riscos:** maior chance de erro do que o diagnóstico de problema (peças parecidas visualmente podem ter roscas/padrões incompatíveis) — o aviso de "confirme antes de comprar" não é opcional, é a proteção principal contra frustração do cliente.

---

### 7. Comparador por Apontar-e-Fotografar

**O que é, em uma frase:** em vez de escolher manualmente quais produtos comparar, o cliente fotografa produtos físicos na prateleira, um de cada vez, e cada foto identificada vai se acumulando automaticamente no comparador — "aponte, fotografe, e quando quiser, compare tudo que já fotografou".

**Por que importa:** o comparador de hoje exige que o cliente já tenha aberto/visitado os produtos no app antes de decidir comparar. Essa ideia inverte o fluxo: comparar é uma decisão que o cliente toma *andando pela loja*, produto físico por produto físico, sem precisar ter navegado no app antes.

**Como funcionaria, na prática:**
1. Um modo de câmera persistente ("Modo comparação") que, a cada foto tirada, identifica o produto (mesma busca por imagem já existente) e, em vez de abrir o resultado normal, adiciona automaticamente ao comparador (`lib/clientComparador.ts`, já suporta bulk-set via `definirComparador`).
2. Um contador pequeno mostra "3 produtos no comparador" enquanto o cliente continua fotografando (até o limite de 3 já existente).
3. Ao terminar, um botão "Ver comparação" leva direto pra `/comparar`, já preenchida.

**O que já existe que ajuda:** busca por imagem, `lib/clientComparador.ts` com `definirComparador(ids)` já pronta pra receber uma lista de uma vez, página `/comparar` já pronta.

**O que falta construir:** o "modo câmera persistente" (UI que mantém a câmera aberta entre fotos, em vez de fechar a cada resultado — ajuste de fluxo, não de infraestrutura), e a lógica de ir empilhando IDs identificados até o limite de 3.

**Esforço estimado:** Baixo — praticamente 100% composição de peças já existentes, o único componente genuinamente novo é a UI de câmera contínua.

**Riscos:** identificação errada de produto por foto (a busca por imagem pode confundir produtos visualmente parecidos) — sempre mostrar uma confirmação rápida ("Isso é uma Furadeira X, correto?") antes de adicionar ao comparador, pra não poluir a comparação com o produto errado.

---

## Grupo C — Personalização contínua (antes, durante e depois da compra)

### 8. Perfil Adaptativo de Estilo de Decisão

**O que é, em uma frase:** além do perfil de conteúdo já coletado (moradia, orçamento, áreas de interesse), inferir um estilo comportamental — "decide rápido" vs. "pesquisa muito" — a partir do comportamento real de navegação, e adaptar a densidade de informação mostrada de acordo.

**Por que importa:** dois clientes com o mesmo orçamento e a mesma categoria de interesse podem querer experiências completamente diferentes — um quer "me mostra o mais vendido e pronto", outro quer "me mostra todas as specs, avaliações e comparações antes de decidir". Adaptar a UI a esse estilo (sem perguntar diretamente) é personalização de verdade, não só filtro de conteúdo.

**Como funcionaria, na prática:**
1. Métricas já coletáveis no navegador: tempo médio até adicionar ao carrinho depois de abrir um produto, quantos produtos da mesma categoria são abertos antes de decidir, se o comparador é usado com frequência.
2. Uma pontuação simples (0 a 100, "índice de deliberação") é calculada a partir dessas métricas e guardada em `localStorage` por sessão/e-mail.
3. Cards de produto e a tela de detalhe se adaptam: cliente com índice baixo ("decide rápido") vê um botão de "Adicionar" mais proeminente e menos texto acima da dobra; cliente com índice alto ("pesquisa muito") vê as especificações e avaliações expandidas por padrão, sem precisar rolar/clicar pra abrir.

**O que já existe que ajuda:** `lib/hooks/useProductTracker.ts` já rastreia visitas por categoria (`trackProductView`) — é a mesma base de dado, só precisa de uma segunda camada de cálculo em cima dela.

**O que falta construir:** `lib/indiceDeliberacao.ts` (calcula a pontuação a partir do histórico já coletado por `useProductTracker`), e ajustes condicionais de layout nos componentes já existentes (`ProductCard.tsx`, `ProdutoDrawer.tsx`) baseados nessa pontuação — sem duplicar componente, só condicionar classes/seções visíveis.

**Esforço estimado:** Médio — o cálculo em si é simples, mas ajustar vários componentes existentes pra respeitar o índice sem quebrar o design atual exige cuidado.

**Riscos:** é fácil errar a inferência com pouco dado (sessão nova, sem histórico) — sempre ter um estado neutro/padrão (layout de hoje) até acumular sinal suficiente, nunca assumir um estilo com poucos eventos.

---

### 9. Memória da Casa (lembretes de recompra por ciclo de vida do produto)

**O que é, em uma frase:** usando o histórico real de pedidos do cliente, a IA sabe que tinta impermeabilizante dura cerca de 12 meses, filtro de água uns 6, e manda uma notificação proativa quando esse prazo se aproxima — "sua última reforma foi há X meses, hora de revisar Y?".

**Por que importa:** transforma a loja de "compra pontual" pra "cuidado contínuo da casa" — um ângulo de retenção que nenhuma ferramenta de e-commerce tradicional exemplifica bem, e que só é possível porque o histórico de compra real já existe no app.

**Como funcionaria, na prática:**
1. Uma tabela de ciclo de vida por categoria/palavra-chave (`lib/cicloVidaProduto.ts`): `{ termo: 'impermeabilizante', mesesDuracao: 12 }`, `{ termo: 'filtro', mesesDuracao: 6 }` etc. — curada manualmente com uns 15-20 termos comuns do catálogo, mesmo espírito de `lib/especificacaoIcones.ts` (heurística por palavra-chave).
2. Uma rotina (rodando no `useEffect` de carregamento de `/conta`, ou de qualquer página logada) verifica os pedidos do cliente (`lib/clientPedidos.ts`) contra essa tabela: se um item comprado há mais de `mesesDuracao` meses corresponde a um termo da tabela, e ainda não foi gerada notificação pra esse pedido específico, dispara `adicionarNotificacao`.
3. A notificação leva de volta pra busca do mesmo produto/categoria, facilitando a recompra.

**O que já existe que ajuda:** `lib/clientPedidos.ts` (histórico real, com data), `lib/clientNotificacoes.ts` (sistema de notificação pronto).

**O que falta construir:** `lib/cicloVidaProduto.ts` (tabela + função `precisaLembrete(pedido, hoje)`), estender `TipoNotificacao` em `clientNotificacoes.ts` pra incluir `'lembrete-recompra'`, e um marcador (`Set` de ids de pedido já notificados, salvo em `localStorage`) pra não repetir o mesmo lembrete toda vez que a tela carrega.

**Esforço estimado:** Baixo — é checagem de data e string matching sobre dado que já existe, sem IA generativa envolvida (determinístico, no espírito de `lib/statusPedido.ts`).

**Riscos:** a tabela de duração é uma estimativa genérica, não personalizada (não sabe se o cliente usou muito ou pouco o produto) — deixar isso claro no texto da notificação ("pode ser hora de revisar", não "está vencido").

---

### 10. Resgate de Carrinho/Projeto Abandonado

**O que é, em uma frase:** se o cliente monta uma lista de materiais no Projeto Guiado ou enche o carrinho e passa muito tempo sem finalizar, o app detecta isso e manda um lembrete depois, oferecendo continuar de onde parou.

**Por que importa:** resolve um problema real de qualquer loja (abandono de carrinho) usando só a infraestrutura de notificação e persistência que já existe — não precisa de e-mail marketing nem de nada externo.

**Como funcionaria, na prática:**
1. Toda vez que o carrinho ou um projeto guiado é salvo/atualizado, grava um timestamp de "última atividade" junto com o dado (`lib/clientCarrinho.ts` e o resultado do Projeto Guiado já são persistidos — só falta o timestamp).
2. Numa checagem simples ao abrir o app (ex: no layout raiz, uma vez por sessão), compara `Date.now()` menos esse timestamp: se passou mais de N horas (configurável, ex: 24h) sem checkout/finalização, e ainda não foi notificado sobre esse abandono específico, dispara uma notificação.
3. O link da notificação leva direto de volta pro carrinho ou pro resultado do projeto salvo, sem precisar refazer nada.

**O que já existe que ajuda:** persistência de carrinho e de resultado de projeto já existem; sistema de notificação já pronto.

**O que falta construir:** campo `atualizadoEm` nas estruturas de carrinho/projeto (se não existir), uma verificação leve (`lib/resgateAbandono.ts`) chamada uma vez por sessão, e mais um valor no union type `TipoNotificacao` (`'carrinho-abandonado' | 'projeto-abandonado'`).

**Esforço estimado:** Baixo — é comparação de timestamp, nenhuma lógica nova complexa.

**Riscos:** calibrar o tempo de espera pra não parecer insistente (notificar cedo demais incomoda; tarde demais perde a janela de reengajamento) — 24h é um ponto de partida razoável, ajustável.

---

### 11. Devolução/Troca Assistida por IA

**O que é, em uma frase:** hoje não existe nenhum fluxo pós-venda além de "comprar de novo" — a ideia é um fluxo de devolução/troca onde o cliente fotografa o produto com defeito, descreve o problema, e a IA já classifica o motivo e pré-preenche uma solicitação.

**Por que importa:** é uma lacuna real no fluxo de pós-venda hoje (o app cobre muito bem descoberta → compra → acompanhamento de entrega, mas nada depois disso) — e devolução assistida é exatamente o tipo de fricção que faz cliente desistir de voltar a comprar.

**Como funcionaria, na prática:**
1. Em "Meus Pedidos" (`/conta`), cada item ganha uma opção "Solicitar troca/devolução".
2. Cliente fotografa o produto (defeito visível, se houver) e escreve uma frase livre descrevendo o problema.
3. A IA (mesmo padrão de visão + texto já usado no diagnóstico visual) classifica automaticamente o motivo dentre categorias pré-definidas (defeito de fabricação, arrependimento, produto errado enviado, incompatibilidade) e sugere o próximo passo (troca por outro produto, reembolso, ou "leve à loja física com este comprovante").
4. Gera um "protocolo" local (número + resumo) salvo junto ao pedido original, visível em "Meus Pedidos" com um status (`Solicitado → Em análise → Concluído`, mesmo padrão visual de `lib/statusPedido.ts`/`PedidoTimeline.tsx`).

**O que já existe que ajuda:** `lib/clientPedidos.ts` (pedido original com itens), `lib/statusPedido.ts`/`components/PedidoTimeline.tsx` (padrão de timeline de status já pronto e reaproveitável), infraestrutura de visão computacional já madura no projeto.

**O que falta construir:** `types/devolucao.ts` (`Devolucao { pedidoNumero, produtoId, motivo, descricao, fotoBase64?, status, criadoEm }`), `lib/clientDevolucoes.ts` (mesmo padrão de localStorage por e-mail), rota `/api/devolucao/classificar` (recebe foto+texto, devolve motivo sugerido), UI nova em `/conta` (formulário + lista de solicitações).

**Esforço estimado:** Médio — é uma feature nova de ponta a ponta (não só extensão de algo existente), mas cada peça individual reaproveita um padrão já validado no projeto (localStorage por e-mail, timeline visual, visão computacional).

**Riscos:** é só um fluxo simulado (sem reembolso real, sem integração com loja física de verdade) — deixar isso claro na UI ("sua solicitação será analisada na loja") pra não prometer um processamento automático que o MVP não pode cumprir de verdade.

---

### 12. Régua Virtual de Medição via Câmera

**O que é, em uma frase:** usando a câmera do celular e um objeto de referência de tamanho conhecido (ex: um cartão de crédito, ou uma folha A4), estimar a medida real de uma parede/piso/objeto na foto, e já calcular a quantidade certa de material a comprar (m² de piso, litros de tinta).

**Por que importa:** "quanto material eu preciso comprar" é uma das perguntas mais comuns e mais erradas de se responder de cabeça (gente compra pouco e tem que voltar, ou compra demais e desperdiça) — resolver isso com a câmera, sem precisar de trena, é um diferencial forte.

**Como funcionaria, na prática:**
1. Cliente fotografa a parede/piso a medir, com o objeto de referência (cartão de crédito, ~8.5×5.4cm, tamanho padronizado mundialmente) visível na mesma foto, encostado na superfície.
2. Um prompt de visão pede à IA pra estimar a proporção pixel-por-centímetro usando o objeto de referência, e a partir disso estimar a dimensão aproximada da superfície fotografada.
3. O resultado (com uma margem de erro clara, ex: "aproximadamente 8m² ± 1m²") alimenta uma calculadora já conhecida no varejo de material de construção: litros de tinta = área ÷ rendimento médio por litro (rendimento varia por produto, mas uma média de 6-10m²/litro é aceitável pra estimativa); m² de piso = área + 10% de margem pra corte.
4. Sugere a quantidade e o produto certo do catálogo já na quantidade calculada.

**O que já existe que ajuda:** infraestrutura de visão computacional (Gemini) já madura no projeto.

**O que falta construir:** é a ideia tecnicamente mais avançada da lista — precisa de um prompt de visão cuidadosamente desenhado pra estimativa geométrica (a IA generativa de visão não faz medição de precisão como um algoritmo de visão computacional clássico faria, então a margem de erro deve ser comunicada com honestidade), uma calculadora de rendimento por categoria (`lib/calculadoraMaterial.ts`, tabela simples por tipo de produto), e a UI de captura com uma instrução visual clara de "encoste o cartão na parede".

**Esforço estimado:** Alto — é a única ideia da lista que depende de a IA generativa estimar bem uma proporção geométrica a partir de uma imagem, o que é inerentemente menos preciso que reconhecimento de objeto/texto (o restante do projeto usa visão só pra classificação/diagnóstico, nunca pra medição).

**Riscos:** o risco técnico central é a precisão da estimativa — se a IA errar a proporção, o cliente compra a quantidade errada de material de verdade. Mitigação obrigatória: sempre mostrar a margem de erro e arredondar a sugestão de compra pra cima (melhor sobrar um pouco de tinta do que faltar no meio do serviço).

---

## Ordem sugerida de implementação

| # | Feature | Grupo | Esforço | Impacto na demo |
|---|---------|-------|---------|------------------|
| 1 | Rota de Compra Inteligente | Navegação | Baixo/Médio | Alto — visual, fácil de mostrar em segundos, e é o pedido mais direto de "guiar o cliente na loja" |
| 5 | Termômetro de Orçamento Vivo | Personalização | Baixo/Médio | Alto — reforça uma feature já existente (Entrevista Guiada) com algo vivo e visível o tempo todo |
| 9 | Memória da Casa | Personalização | Baixo | Médio — conceito forte ("a loja lembra de você"), implementação simples |
| 3 | Botão SOS de Corredor | Navegação | Baixo/Médio | Médio/Alto — conecta cliente e funcionário ao vivo, os dois lados já existem |
| 10 | Resgate de Carrinho/Projeto Abandonado | Personalização | Baixo | Médio — resolve um problema real de retenção com pouquíssimo código novo |
| 7 | Comparador por Apontar-e-Fotografar | Assistência | Baixo | Médio/Alto — visualmente impressionante, praticamente 100% reaproveitamento |
| 4 | Leitura de Prateleira em Tempo Real | Navegação | Médio | Alto — resolve uma dor real (etiqueta desatualizada) de um jeito visualmente forte pra demo |
| 6 | Assistente de Compatibilidade de Peças | Assistência | Baixo | Médio — reaproveita quase tudo do Diagnóstico Visual já existente |
| 2 | Modo Mãos Livres | Navegação | Médio | Alto — impressiona bastante numa demo ao vivo, mas depende de reconhecimento de voz funcionar bem no momento da apresentação |
| 8 | Perfil Adaptativo de Estilo de Decisão | Personalização | Médio | Baixo/Médio — sutil, mais elegante tecnicamente do que vistoso numa demo curta |
| 11 | Devolução/Troca Assistida por IA | Personalização | Médio | Médio — cobre uma lacuna real (pós-venda), mas menos "uau" numa demo de 3 minutos |
| 12 | Régua Virtual de Medição | Assistência | Alto | Muito alto se funcionar bem — mas é a mais arriscada tecnicamente, deixar pro final se sobrar tempo |

**Caminho sugerido:** começar pelas ideias de esforço Baixo/Médio com maior impacto direto no "fluxo guiado" pedido (1, 5, 9, 3, 10) — todas reaproveitam fortemente o que já existe e já contam uma história coerente de "a loja te guia e lembra de você". Depois, se sobrar tempo, as de visão computacional (7, 4, 6) são um bom segundo bloco por reaproveitarem a mesma infraestrutura entre si. Voz contínua (2) e medição por câmera (12) são as apostas de maior risco/retorno — bons candidatos a "se der tempo", não a caminho crítico.
