import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY não configurada. Crie um .env.local com sua chave de https://aistudio.google.com/app/apikey"
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// text-embedding-004: 768 dimensões, gratuito no tier Free da Google AI
export const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

// gemini-2.5-flash: mais recente, suporte a visão e texto
export const flashModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});
