# Leroy Merlin — MVP FIAP Challenge 2026

Assistente de loja com IA para otimizar a jornada do cliente em lojas físicas da Leroy Merlin. Permite buscar produtos por texto, foto ou categoria, visualizar a localização no mapa da loja, montar listas de materiais para projetos e tirar dúvidas técnicas.

## Funcionalidades

- **Busca semântica** — encontra produtos por descrição em linguagem natural (ex: "parafuso para madeira molhada")
- **Busca por imagem** — fotografa o produto e o sistema identifica e localiza na loja
- **Mapa da loja** — mapa SVG interativo com 50 corredores e pins animados mostrando localização, preço e estoque
- **Navegação por categoria** — 8 categorias com filtros de complexidade e estoque
- **Projeto Guiado** — descreve o projeto (ex: "quero instalar um chuveiro") e recebe lista de materiais completa com localização de cada item
- **Tire Dúvidas** — chat com IA para dúvidas técnicas sobre produtos
- **Agendamento** — agenda atendimento com especialista na loja

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- Chave de API do Google Gemini (gratuita em [aistudio.google.com](https://aistudio.google.com/app/apikey))

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/lucasakira3/LeroyMerlin.git
cd LeroyMerlin

# 2. Instale as dependências
npm install

# 3. Configure a API key
cp .env.example .env.local
# Abra .env.local e substitua "sua_chave_aqui" pela sua chave do Gemini

# 4. Suba o servidor
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `GEMINI_API_KEY` | Chave da API do Google Gemini — obter em [aistudio.google.com](https://aistudio.google.com/app/apikey) |

## Observação sobre os produtos

O arquivo `data/produtos.json` (base com ~5000 produtos e embeddings pré-computados) não está incluído no repositório por ser grande. Para gerá-lo:

```bash
# Gerar embeddings para os produtos (requer GEMINI_API_KEY configurada)
# Atenção: consome cota da API — cerca de 5000 requisições
npm run embeddings
```

Enquanto os embeddings não estiverem gerados, a busca semântica funciona via fallback por texto.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google Gemini API](https://ai.google.dev/) — busca semântica, visão computacional e chat
