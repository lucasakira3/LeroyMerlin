/**
 * processar-csv.ts — Diego Dados | Leroy Merlin MVP Build
 *
 * Processa o CSV de produtos da Leroy Merlin e gera produtos.json normalizado.
 *
 * Uso:
 *   npx tsx scripts/processar-csv.ts
 *   npx tsx scripts/processar-csv.ts --amostra   (gera só os primeiros 50)
 *
 * Saída:
 *   squads/leroy-mvp-build/data/produtos.json
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface ProdutoJSON {
  id: string;
  categoria: string;
  produto: string;
  pergunta: string;
  resposta_ia: string;
  corredor: string;
  corredor_normalizado: string;
  complexidade: string;
  especificacoes: string;
  tags: string[];
  estoque: number;
  sustentabilidade: string;
  embedding: never[];
  embedding_text: string;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(ROOT, "data", "base_versão_beta_treinamento_leroy.csv");
const OUTPUT_DIR = path.join(ROOT, "data");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "produtos.json");

const AMOSTRA_SIZE = 50;
const AMOSTRA_FLAG = process.argv.includes("--amostra");

// ---------------------------------------------------------------------------
// Correção de encoding (UTF-8 mal lido como Latin-1)
// ---------------------------------------------------------------------------

function corrigirEncoding(texto: string): string {
  // Ordem importa: substituições compostas primeiro
  return texto
    .replace(/Ã§Ã£o/g, "ção")
    .replace(/Ã£o/g, "ão")
    .replace(/Ã¢/g, "â")
    .replace(/Ã£/g, "ã")
    .replace(/Ã§/g, "ç")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã¡/g, "á")
    .replace(/Ãª/g, "ª")
    .replace(/Ãº/g, "º")
    .replace(/Ã /g, "à")
    .replace(/Ã/g, "Â")
    .replace(/Ã/g, "Ã")
    .replace(/Ã/g, "É")
    .replace(/Ã/g, "Í")
    .replace(/Ã/g, "Ó")
    .replace(/Ã/g, "Ú")
    .replace(/Ã/g, "Á")
    .replace(/Ã/g, "Ç");
}

// ---------------------------------------------------------------------------
// Normalização de corredor
// ---------------------------------------------------------------------------

/**
 * Devolve { corredor, corredor_normalizado } conforme a faixa de ID.
 *
 * Faixas:
 *   LM-0001 a LM-2000 → corredor pode ser numérico puro (ex: "39") ou
 *                        já conter "Corredor XX, Setor Y" — extraímos o número.
 *   LM-2001 a LM-3000 → corredor no formato C-XX
 *   LM-3001 a LM-5000 → corredor no formato D-XX / T-XX / P-XX / S-XX / E-XX / X-XX
 */
function normalizarCorredor(
  corredorBruto: string,
  idNum: number
): { corredor: string; corredor_normalizado: string } {
  const raw = corredorBruto.trim();

  // Faixas 1 e 2 (LM-0001 a LM-2000) — corredores numéricos
  if (idNum <= 2000) {
    // Tenta extrair número do corredor (pode vir como "14" ou "Corredor 14, Setor A")
    const match = raw.match(/(\d+)/);
    const num = match ? parseInt(match[1], 10) : 0;
    const padded = String(num).padStart(2, "0");
    return {
      corredor: `Corredor ${padded}`,
      corredor_normalizado: `corredor-${padded}`,
    };
  }

  // Faixas 3+ (LM-2001 a LM-5000) — prefixos C, D, T, P, S, E, X
  // O valor bruto já vem no formato correto: "C-01", "D-27", "T-36", etc.
  const prefixMatch = raw.match(/^([A-Z])-(\d+)$/i);
  if (prefixMatch) {
    const prefix = prefixMatch[1].toUpperCase();
    const num = prefixMatch[2].padStart(2, "0");
    return {
      corredor: `${prefix}-${num}`,
      corredor_normalizado: `${prefix.toLowerCase()}-${num}`,
    };
  }

  // Fallback — retorna o bruto normalizado
  return {
    corredor: raw,
    corredor_normalizado: raw.toLowerCase().replace(/\s+/g, "-"),
  };
}

// ---------------------------------------------------------------------------
// Normalização de tags
// ---------------------------------------------------------------------------

function normalizarTags(tagsStr: string): string[] {
  if (!tagsStr || tagsStr.trim() === "") return [];
  return tagsStr
    .split(",")
    .map((t) => t.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Parser de CSV robusto (suporta campos com vírgulas entre aspas)
// ---------------------------------------------------------------------------

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// ---------------------------------------------------------------------------
// Transformação de linha CSV → ProdutoJSON
// ---------------------------------------------------------------------------

function transformarLinha(
  fields: string[],
  encodingFixCount: { count: number }
): ProdutoJSON | null {
  if (fields.length < 11) return null;

  const [
    id_referencia,
    categoria_raw,
    produto_raw,
    pergunta_raw,
    resposta_raw,
    corredor_raw,
    complexidade_raw,
    especificacao_raw,
    tags_raw,
    estoque_raw,
    sustentabilidade_raw,
  ] = fields;

  // Aplicar correção de encoding
  const fixar = (s: string) => {
    const fixed = corrigirEncoding(s);
    if (fixed !== s) encodingFixCount.count++;
    return fixed;
  };

  const id = id_referencia.trim();
  if (!id.startsWith("LM-")) return null;

  const idNum = parseInt(id.replace("LM-", ""), 10);
  if (isNaN(idNum)) return null;

  const categoria = fixar(categoria_raw.trim());
  const produto = fixar(produto_raw.trim());
  const pergunta = fixar(pergunta_raw.trim());
  const resposta_ia = fixar(resposta_raw.trim());
  const complexidade = fixar(complexidade_raw.trim());
  const especificacoes = fixar(especificacao_raw.trim());
  const tagsStr = fixar(tags_raw.trim());
  const sustentabilidadeRaw = sustentabilidade_raw ? sustentabilidade_raw.trim() : "";
  const sustentabilidade = sustentabilidadeRaw || "N/A";

  const estoque = parseInt(estoque_raw.trim(), 10);
  const estoque_num = isNaN(estoque) ? 0 : estoque;

  const { corredor, corredor_normalizado } = normalizarCorredor(
    fixar(corredor_raw.trim()),
    idNum
  );

  const tags = normalizarTags(tagsStr);
  const embedding_text = `${produto} — ${pergunta} ${resposta_ia}`;

  return {
    id,
    categoria,
    produto,
    pergunta,
    resposta_ia,
    corredor,
    corredor_normalizado,
    complexidade,
    especificacoes,
    tags,
    estoque: estoque_num,
    sustentabilidade,
    embedding: [],
    embedding_text,
  };
}

// ---------------------------------------------------------------------------
// Relatório de qualidade
// ---------------------------------------------------------------------------

interface Relatorio {
  total: number;
  encodingCorrigido: number;
  erros: number;
  corredores: Record<string, number>;
  complexidades: Record<string, number>;
  sustentabilidades: Record<string, number>;
  categorias: Record<string, number>;
}

function gerarRelatorio(produtos: ProdutoJSON[], rel: Relatorio): string {
  const topCategorias = Object.entries(rel.categorias)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const linhas = [
    "# Relatório de Qualidade — Diego Dados",
    "",
    `**Data de processamento:** ${new Date().toISOString()}`,
    `**Arquivo de entrada:** base_versão_beta_treinamento_leroy.csv`,
    `**Arquivo de saída:** data/produtos.json`,
    "",
    "## Sumário",
    "",
    `- Total de registros processados: **${rel.total}**`,
    `- Registros com encoding corrigido: **${rel.encodingCorrigido}**`,
    `- Erros / linhas ignoradas: **${rel.erros}**`,
    "",
    "## Distribuição por Sistema de Corredor",
    "",
    "| Sistema | Quantidade |",
    "|---------|-----------|",
    ...Object.entries(rel.corredores)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Distribuição por Complexidade",
    "",
    "| Complexidade | Quantidade |",
    "|-------------|-----------|",
    ...Object.entries(rel.complexidades)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Distribuição por Sustentabilidade",
    "",
    "| Score | Quantidade |",
    "|-------|-----------|",
    ...Object.entries(rel.sustentabilidades)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Top 10 Categorias",
    "",
    "| Categoria | Quantidade |",
    "|-----------|-----------|",
    ...topCategorias.map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Validação de Campos",
    "",
    `- Produtos com embedding_text preenchido: **${produtos.filter((p) => p.embedding_text.length > 10).length}**`,
    `- Produtos com tags (array não vazio): **${produtos.filter((p) => p.tags.length > 0).length}**`,
    `- Produtos com estoque > 0: **${produtos.filter((p) => p.estoque > 0).length}**`,
    `- Produtos com sustentabilidade != N/A: **${produtos.filter((p) => p.sustentabilidade !== "N/A").length}**`,
    "",
    "## Status",
    "",
    "Processamento concluido com sucesso. O arquivo `produtos.json` esta pronto para uso com embeddings do Gemini.",
  ];

  return linhas.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("Diego Dados — Iniciando processamento do CSV...\n");

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`ERRO: Arquivo CSV nao encontrado em: ${CSV_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
  console.log(`Total de linhas no CSV (incluindo header): ${lines.length}`);

  // Pular header
  const dataLines = lines.slice(1);
  const limite = AMOSTRA_FLAG ? AMOSTRA_SIZE : dataLines.length;

  const produtos: ProdutoJSON[] = [];
  const rel: Relatorio = {
    total: 0,
    encodingCorrigido: 0,
    erros: 0,
    corredores: {},
    complexidades: {},
    sustentabilidades: {},
    categorias: {},
  };
  const encodingFix = { count: 0 };

  for (let i = 0; i < Math.min(limite, dataLines.length); i++) {
    const line = dataLines[i];
    if (!line.trim()) continue;

    const fields = parseCsvLine(line);
    const produto = transformarLinha(fields, encodingFix);

    if (!produto) {
      rel.erros++;
      continue;
    }

    produtos.push(produto);
    rel.total++;

    // Estatísticas de corredor
    const sistema = produto.corredor_normalizado.startsWith("corredor-")
      ? "Numérico (Corredor XX)"
      : produto.corredor_normalizado.match(/^[cC]-/)
      ? "Sistema C (C-XX)"
      : produto.corredor_normalizado.match(/^[dD]-/)
      ? "Prefixo D"
      : produto.corredor_normalizado.match(/^[tT]-/)
      ? "Prefixo T"
      : produto.corredor_normalizado.match(/^[pP]-/)
      ? "Prefixo P"
      : produto.corredor_normalizado.match(/^[sS]-/)
      ? "Prefixo S"
      : produto.corredor_normalizado.match(/^[eE]-/)
      ? "Prefixo E"
      : produto.corredor_normalizado.match(/^[xX]-/)
      ? "Prefixo X"
      : "Outro";
    rel.corredores[sistema] = (rel.corredores[sistema] || 0) + 1;

    rel.complexidades[produto.complexidade] =
      (rel.complexidades[produto.complexidade] || 0) + 1;
    rel.sustentabilidades[produto.sustentabilidade] =
      (rel.sustentabilidades[produto.sustentabilidade] || 0) + 1;
    rel.categorias[produto.categoria] =
      (rel.categorias[produto.categoria] || 0) + 1;
  }

  rel.encodingCorrigido = encodingFix.count;

  // Escrever JSON de saída
  const outputPath = AMOSTRA_FLAG
    ? path.join(ROOT, "output", "amostra.json")
    : OUTPUT_JSON;

  fs.writeFileSync(outputPath, JSON.stringify(produtos, null, 2), "utf-8");
  console.log(`\nArquivo gerado: ${outputPath}`);
  console.log(`Total processado: ${rel.total} produtos`);
  console.log(`Encoding corrigido em ${rel.encodingCorrigido} campos`);
  console.log(`Erros: ${rel.erros}`);

  // Relatório de qualidade
  const relatorioTexto = gerarRelatorio(produtos, rel);
  console.log("\n" + relatorioTexto);

  return { produtos, rel };
}

main();
