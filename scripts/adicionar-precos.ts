import { readFileSync, writeFileSync } from "fs";
import path from "path";

const ARQUIVO = path.join(process.cwd(), "data", "produtos.json");

// Faixas de preço por complexidade (min, max em R$)
const FAIXA_COMPLEXIDADE: Record<string, [number, number]> = {
  Baixa:        [5,    35],
  DIY:          [10,   70],
  Média:        [20,   150],
  Alta:         [50,   350],
  Profissional: [120,  700],
  Especialista: [250,  1800],
};

// Multiplicador por categoria
const MULTI_CATEGORIA: Record<string, number> = {
  ferramentas:            1.0,
  elétrica:               0.8,
  hidráulica:             0.9,
  banheiros:              1.4,
  sanitários:             1.5,
  cozinhas:               1.6,
  pisos:                  1.1,
  cerâmica:               1.0,
  revestimento:           1.0,
  pintura:                0.7,
  iluminação:             1.0,
  jardim:                 0.8,
  construção:             0.7,
  madeiras:               0.9,
  energia:                1.2,
  sustentável:            1.1,
  climatização:           1.5,
  automação:              1.8,
  decoração:              1.1,
  organização:            0.8,
  manutenção:             0.9,
  ferramentas_precisão:   2.0,
};

function getMultiCategoria(categoria: string): number {
  const lower = categoria.toLowerCase();
  for (const [key, val] of Object.entries(MULTI_CATEGORIA)) {
    if (lower.includes(key)) return val;
  }
  return 1.0;
}

// Gerador determinístico: mesmo ID → mesmo preço sempre
function gerarPreco(id: string, complexidade: string, categoria: string, sustentabilidade: string): number {
  const num = parseInt(id.replace("LM-", "")) || 1;

  // Hash simples para variação dentro da faixa
  const hash = ((num * 2654435761) >>> 0) % 1000; // 0-999
  const ratio = hash / 999; // 0.0 a 1.0

  const [min, max] = FAIXA_COMPLEXIDADE[complexidade] ?? [20, 200];
  const base = min + ratio * (max - min);

  const multi = getMultiCategoria(categoria);

  // Produtos sustentáveis (Prata/Ouro) custam ~15-25% a mais
  const ecoBonus = sustentabilidade === "Ouro" ? 1.25
                 : sustentabilidade === "Prata" ? 1.15
                 : sustentabilidade === "Bronze" ? 1.05
                 : 1.0;

  const preco = base * multi * ecoBonus;

  // Arredonda para parecer preço real (ex: 49.90, 129.00, 2.450,00)
  if (preco < 20)   return Math.round(preco * 10) / 10;        // R$ 8,40
  if (preco < 100)  return Math.round(preco * 2) / 2;          // R$ 49,50
  if (preco < 500)  return Math.round(preco / 5) * 5;          // R$ 135,00
  if (preco < 2000) return Math.round(preco / 10) * 10;        // R$ 1.240,00
  return Math.round(preco / 50) * 50;                           // R$ 4.500,00
}

async function main() {
  console.log("Lendo produtos.json...");
  const raw = readFileSync(ARQUIVO, "utf-8");
  const cleaned = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
  const produtos = JSON.parse(cleaned);

  console.log(`Gerando preços para ${produtos.length} produtos...`);

  const atualizados = produtos.map((p: any) => ({
    ...p,
    preco: gerarPreco(p.id, p.complexidade, p.categoria, p.sustentabilidade),
  }));

  writeFileSync(ARQUIVO, JSON.stringify(atualizados, null, 2), "utf-8");

  // Estatísticas
  const precos = atualizados.map((p: any) => p.preco);
  const min = Math.min(...precos).toFixed(2);
  const max = Math.max(...precos).toFixed(2);
  const media = (precos.reduce((a: number, b: number) => a + b, 0) / precos.length).toFixed(2);

  console.log(`\n✓ Preços adicionados com sucesso!`);
  console.log(`  Menor preço:  R$ ${min}`);
  console.log(`  Maior preço:  R$ ${max}`);
  console.log(`  Preço médio:  R$ ${media}`);
  console.log(`\nArquivo salvo em: ${ARQUIVO}`);
}

main().catch(console.error);
