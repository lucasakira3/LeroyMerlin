# Snapshots de teste do Projeto Guiado

Resultados gerados por `npm run testar-projeto` (`scripts/testar-projeto-guiado.ts`) — o
harness de aceitação do **P0 do backlog pós-banca** (corrigir a cobertura rasa do Projeto
Guiado, apontada pela Leroy Merlin na banca de 21/09/2026).

Cada arquivo `resultado-<timestamp>.json` é um snapshot completo de uma rodada: as 10
descrições de teste fixas, a resposta real da IA pra cada uma, quantos itens, quantas
categorias distintas do catálogo cobriram, e se bateu o piso esperado pro escopo declarado.

**Por que isso fica versionado no repositório:** é a prova "com número, não com opinião" de
que a correção do P0 funcionou — dá pra rodar antes de mexer no prompt, guardar o resultado,
mexer, rodar de novo, e comparar os dois arquivos lado a lado na apresentação final (24/10).
Não apagar snapshots antigos só porque um novo foi gerado — o valor está na comparação.
