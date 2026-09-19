import { GoogleGenerativeAI, GoogleGenerativeAIFetchError, type GenerativeModel } from "@google/generative-ai";

let cliente: GoogleGenerativeAI | null = null;
const modelosCache = new Map<string, GenerativeModel>();

// A checagem da GEMINI_API_KEY só acontece na primeira vez que um modelo é de fato usado
// (dentro de uma rota, em tempo de requisição) — não no carregamento do módulo. Isso importa
// porque o Next.js importa toda rota de API durante "Collecting page data" no build, mesmo
// pra rotas nunca chamadas nesse build; checar a chave no topo do módulo (como era antes)
// faz UMA variável de ambiente faltando/mal configurada no Vercel derrubar o build inteiro,
// não só as rotas que de fato dependem dela — foi exatamente o erro visto no primeiro deploy
// ("Failed to collect configuration for /api/diagnostico-visual").
function getModelo(nome: string): GenerativeModel {
  const existente = modelosCache.get(nome);
  if (existente) return existente;

  if (!cliente) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY não configurada. Crie um .env.local com sua chave de https://aistudio.google.com/app/apikey"
      );
    }
    cliente = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  const modelo = cliente.getGenerativeModel({ model: nome });
  modelosCache.set(nome, modelo);
  return modelo;
}

// O tier gratuito da API do Gemini devolve erro transitório (503 "model overloaded", 429
// rate limit, 500) com alguma frequência — visto na prática 2026-09-18 durante uma sessão de
// testes (3 chamadas seguidas a /api/projeto falharam, a 4ª passou sem nenhuma mudança de
// código). Sem retry, isso aparece pro usuário como "não foi possível processar", inclusive
// ao vivo numa demonstração. Detecta só os códigos/mensagens conhecidos como transitórios —
// um erro de verdade (prompt inválido, chave errada) continua falhando na hora, sem esperar.
export function ehErroTransitorio(erro: unknown): boolean {
  // GoogleGenerativeAIFetchError expõe o status HTTP direto (ver node_modules/@google/
  // generative-ai/dist/src/errors.d.ts) — mais confiável que caçar número na mensagem.
  if (erro instanceof GoogleGenerativeAIFetchError && erro.status != null) {
    return erro.status === 429 || erro.status === 500 || erro.status === 503;
  }
  const msg = erro instanceof Error ? erro.message : String(erro);
  return /\[(429|500|503)\s/.test(msg) || /overloaded|rate limit|unavailable|deadline exceeded/i.test(msg);
}

export async function comRetry<T>(chamada: () => Promise<T>, esperaBaseMs = 700): Promise<T> {
  const MAX_TENTATIVAS = 3;
  const ESPERA_BASE_MS = esperaBaseMs;
  let ultimoErro: unknown;
  for (let tentativa = 0; tentativa < MAX_TENTATIVAS; tentativa++) {
    try {
      return await chamada();
    } catch (erro) {
      ultimoErro = erro;
      if (!ehErroTransitorio(erro) || tentativa === MAX_TENTATIVAS - 1) throw erro;
      // Espera crescente (700ms, 1400ms) — dá tempo real pro problema passageiro se resolver
      // sem deixar o usuário esperando demais numa rota que já tem timeout do Vercel.
      await new Promise(resolve => setTimeout(resolve, ESPERA_BASE_MS * (tentativa + 1)));
    }
  }
  throw ultimoErro;
}

// Proxy preserva a mesma API pública de antes (flashModel.generateContent(...) continua
// funcionando idêntico em todo call site existente) sem precisar de nenhuma mudança nas
// 6 rotas que já importam flashModel — só adia a inicialização de "no import" pra "no
// primeiro uso real". generateContent (o único método de fato chamado pelas rotas hoje)
// ganha retry automático nesse mesmo ponto central, sem precisar tocar em cada rota.
function criarModeloPreguicoso(nome: string): GenerativeModel {
  return new Proxy({} as GenerativeModel, {
    get(_target, prop, receiver) {
      const modelo = getModelo(nome);
      const valor = Reflect.get(modelo, prop, receiver);
      if (typeof valor !== "function") return valor;
      const funcaoLigada = valor.bind(modelo);
      if (prop === "generateContent") {
        return (...args: Parameters<GenerativeModel["generateContent"]>) => comRetry(() => funcaoLigada(...args));
      }
      return funcaoLigada;
    },
  });
}

// text-embedding-004: 768 dimensões, gratuito no tier Free da Google AI
export const embeddingModel = criarModeloPreguicoso("text-embedding-004");

// gemini-2.5-flash: mais recente, suporte a visão e texto
export const flashModel = criarModeloPreguicoso("gemini-2.5-flash");
