import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

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

// Proxy preserva a mesma API pública de antes (flashModel.generateContent(...) continua
// funcionando idêntico em todo call site existente) sem precisar de nenhuma mudança nas
// 6 rotas que já importam flashModel — só adia a inicialização de "no import" pra "no
// primeiro uso real".
function criarModeloPreguicoso(nome: string): GenerativeModel {
  return new Proxy({} as GenerativeModel, {
    get(_target, prop, receiver) {
      const modelo = getModelo(nome);
      const valor = Reflect.get(modelo, prop, receiver);
      return typeof valor === "function" ? valor.bind(modelo) : valor;
    },
  });
}

// text-embedding-004: 768 dimensões, gratuito no tier Free da Google AI
export const embeddingModel = criarModeloPreguicoso("text-embedding-004");

// gemini-2.5-flash: mais recente, suporte a visão e texto
export const flashModel = criarModeloPreguicoso("gemini-2.5-flash");
