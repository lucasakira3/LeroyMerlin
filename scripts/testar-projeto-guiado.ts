/**
 * testar-projeto-guiado.ts — harness de aceitação do Projeto Guiado (P0 do backlog pós-banca)
 *
 * Chama gerarProjetoIA() direto (sem precisar do servidor Next rodando) contra um conjunto
 * fixo de descrições de projeto — sempre as mesmas, pra dar pra comparar uma rodada com a
 * outra — e mede se a resposta cobre o que um projeto desse tipo realmente precisa: número
 * de itens compatível com o escopo declarado, e mais de uma categoria do catálogo envolvida
 * (o sintoma exato que a Leroy Merlin reportou na banca de 21/09: "peço reforma de banheiro,
 * só volta louça e revestimento").
 *
 * Uso:
 *   npx tsx scripts/testar-projeto-guiado.ts
 *
 * Precisa de GEMINI_API_KEY em .env.local (mesma chave usada pelo app). Cada rodada faz de
 * 10 a 20 chamadas reais à API (uma por caso de teste, mais uma segunda se o retry de
 * qualidade de lib/projetoGuiado.ts disparar) — não rodar em loop nem em CI, é uma checagem
 * deliberada, não automática.
 *
 * Grava um snapshot completo em docs/projeto-guiado-testes/resultado-<timestamp>.json —
 * é a prova "com número, não com opinião" citada no backlog pós-banca pra mostrar antes/
 * depois na apresentação final.
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

import { gerarProjetoIA, FAIXAS_ESCOPO, type ProjetoIA } from "../lib/projetoGuiado";

const PASTA_SAIDA = path.join(process.cwd(), "docs", "projeto-guiado-testes");
const DELAY_ENTRE_CHAMADAS_MS = 700;

// Fixo de propósito: o valor deste harness é comparar a mesma pergunta antes/depois de uma
// mudança de prompt, não cobrir todo tipo de projeto possível. Inclui literalmente a frase
// que motivou o P0 ("quero reformar meu banheiro") mais uma mistura de reparo/médio/amplo e
// de casos com/sem kit de referência em lib/kitsProjeto.ts, pra também medir o "modo geral"
// (sem kit) da IA, não só os projetos que já têm uma lista curada por trás.
const CASOS_DE_TESTE: { descricao: string; comodos?: string[] }[] = [
  { descricao: "Quero reformar meu banheiro, ele está bem antigo e quero trocar tudo" },
  { descricao: "Preciso trocar a torneira da cozinha que está pingando" },
  { descricao: "Quero pintar meu quarto de 12 metros quadrados, cor clara" },
  { descricao: "Vou trocar o piso da sala, hoje é cerâmica e quero porcelanato" },
  { descricao: "Preciso instalar um ponto de tomada novo e trocar o disjuntor do quarto" },
  { descricao: "Quero montar uma horta pequena no quintal de casa" },
  { descricao: "Minha pia está vazando embaixo, o cano parece rachado" },
  { descricao: "Vou reformar a cozinha inteira: piso, pintura, elétrica e hidráulica" },
  { descricao: "Quero instalar prateleiras na sala de estar" },
  { descricao: "Preciso fazer uma reforma completa de dois banheiros e da área de serviço" },
];

interface ResultadoCaso {
  descricao: string;
  ok: boolean;
  erro?: string;
  escopo?: string;
  quantidadeItens?: number;
  pisoEsperado?: number;
  dentroDoPiso?: boolean;
  categoriasDistintas?: string[];
  cobreFerramentas?: boolean;
  projeto?: ProjetoIA;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

async function rodarCaso(caso: (typeof CASOS_DE_TESTE)[number]): Promise<ResultadoCaso> {
  try {
    const projeto = await gerarProjetoIA(caso.descricao, caso.comodos);
    const piso = FAIXAS_ESCOPO[projeto.escopo]?.min ?? 0;
    const categorias = Array.from(new Set(projeto.itens.map((i) => i.categoria.trim())));
    const cobreFerramentas = projeto.itens.some((i) => normalizar(i.categoria).includes("ferramenta"));

    return {
      descricao: caso.descricao,
      ok: true,
      escopo: projeto.escopo,
      quantidadeItens: projeto.itens.length,
      pisoEsperado: piso,
      dentroDoPiso: projeto.itens.length >= piso,
      categoriasDistintas: categorias,
      cobreFerramentas,
      projeto,
    };
  } catch (err) {
    return {
      descricao: caso.descricao,
      ok: false,
      erro: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  console.log(`Rodando ${CASOS_DE_TESTE.length} casos de teste contra o Projeto Guiado...\n`);

  const resultados: ResultadoCaso[] = [];
  for (const caso of CASOS_DE_TESTE) {
    process.stdout.write(`  → "${caso.descricao.slice(0, 50)}${caso.descricao.length > 50 ? "..." : ""}"`);
    const resultado = await rodarCaso(caso);
    resultados.push(resultado);
    console.log(
      resultado.ok
        ? ` — ${resultado.quantidadeItens} itens, ${resultado.categoriasDistintas?.length} categorias, escopo ${resultado.escopo} ${resultado.dentroDoPiso ? "✅" : "⚠️ abaixo do piso"}`
        : ` — ❌ ERRO: ${resultado.erro}`
    );
    await sleep(DELAY_ENTRE_CHAMADAS_MS);
  }

  console.log("\n" + "=".repeat(72));
  console.table(
    resultados.map((r) => ({
      descrição: r.descricao.length > 42 ? r.descricao.slice(0, 39) + "..." : r.descricao,
      escopo: r.escopo ?? "-",
      itens: r.quantidadeItens ?? "-",
      "piso esperado": r.pisoEsperado ?? "-",
      "dentro do piso": r.ok ? (r.dentroDoPiso ? "✅" : "⚠️") : "❌",
      categorias: r.categoriasDistintas?.length ?? "-",
      ferramentas: r.ok ? (r.cobreFerramentas ? "sim" : "não") : "-",
    }))
  );

  const validos = resultados.filter((r) => r.ok);
  const dentroDoPiso = validos.filter((r) => r.dentroDoPiso).length;
  const mediaCategorias =
    validos.length > 0
      ? (validos.reduce((soma, r) => soma + (r.categoriasDistintas?.length ?? 0), 0) / validos.length).toFixed(1)
      : "0";
  const comFerramentas = validos.filter((r) => r.cobreFerramentas).length;

  console.log(`\nResumo:`);
  console.log(`  ${validos.length}/${resultados.length} casos responderam sem erro`);
  console.log(`  ${dentroDoPiso}/${validos.length} ficaram dentro do piso de itens esperado pro escopo declarado`);
  console.log(`  ${comFerramentas}/${validos.length} cobriram a categoria Ferramentas`);
  console.log(`  Média de categorias distintas por projeto: ${mediaCategorias}`);

  if (!existsSync(PASTA_SAIDA)) mkdirSync(PASTA_SAIDA, { recursive: true });
  const arquivo = path.join(PASTA_SAIDA, `resultado-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(arquivo, JSON.stringify(resultados, null, 2), "utf-8");
  console.log(`\nSnapshot completo salvo em ${path.relative(process.cwd(), arquivo)}`);
}

main().catch((err) => {
  console.error("Falha ao rodar o harness:", err);
  process.exit(1);
});
