# Leroy Merlin — MVP FIAP Challenge 2026

Assistente de loja com IA para otimizar a jornada do cliente em lojas físicas da Leroy Merlin. O sistema é dividido em duas frentes: um aplicativo interativo para o **cliente final** (focado em localização, IA e autoatendimento) e um painel de controle completo para o **funcionário da loja**.

---

## 🌟 Funcionalidades

### 🛒 Área do Cliente
Acesse a jornada principal em `/`
- **Busca semântica** — Encontra produtos por descrição em linguagem natural (ex: "parafuso para madeira molhada").
- **Busca por imagem** — Fotografe o produto e o sistema identifica e localiza na loja através de IA.
- **Mapa da loja interativo** — Mapa SVG interativo com corredores e pins animados mostrando localização, preço e estoque em tempo real.
- **Projeto Guiado** — Descreva o projeto (ex: "quero instalar um chuveiro") e receba uma lista de materiais completa com a localização de cada item.
- **Timeline do projeto** — Dentro do Projeto Guiado, a IA organiza os materiais em etapas cronológicas (ex: preparo → hidráulica → acabamento → pintura), mostrando a ordem sugerida de execução do projeto.
- **Tire Dúvidas (Chat com IA)** — Especialista virtual disponível 24h para tirar dúvidas técnicas sobre produtos e materiais.
- **Agendamento** — Agende um atendimento presencial com um especialista na loja física.

### 👔 Painel do Funcionário
Acesse a área administrativa em `/funcionario/login`
- **Dashboard Gerencial** — Visão geral com métricas de clientes ativos, alertas de estoque críticos e atividades recentes da loja em tempo real.
- **Gestão de Clientes** — Tabela detalhada para consulta e controle do status dos clientes e histórico de interações.
- **Controle de Estoque e Produtos** — Gerenciamento de inventário com botões rápidos de alteração de quantidade, alertas visuais de estoque baixo e adição de novos produtos.
- **Atendimento de Chamados** — Interface de chat integrada (estilo painel de suporte) para que os funcionários possam assumir e responder rapidamente às dúvidas dos clientes divididos por setores.

---

## 🚀 Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- Chave de API do Google Gemini (gratuita em [aistudio.google.com](https://aistudio.google.com/app/apikey))

---

## 🛠️ Instalação e Execução

```bash
# 1. Clone o repositório
git clone https://github.com/lucasakira3/LeroyMerlin.git
cd LeroyMerlin

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Abra .env.local e substitua "sua_chave_aqui" pela sua chave do Gemini

# 4. Inicie o servidor local
npm run dev
```

Acesse o sistema no seu navegador:
- **Área do Cliente:** [http://localhost:3000](http://localhost:3000)
- **Painel do Funcionário:** [http://localhost:3000/funcionario/login](http://localhost:3000/funcionario/login) (Qualquer e-mail e senha funcionam na simulação do MVP)

---

## ⚙️ Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `GEMINI_API_KEY` | Chave da API do Google Gemini — obter em [aistudio.google.com](https://aistudio.google.com/app/apikey) |

---

## 📦 Base de Dados de Produtos

O arquivo `data/produtos.json` (nossa base mockada com ~5000 produtos reais da Leroy Merlin e seus respectivos embeddings pré-computados) pode ser gerado dinamicamente através do script abaixo.

```bash
# Gerar embeddings para os produtos (requer GEMINI_API_KEY configurada)
# Atenção: Esta ação consome cota da API (cerca de 5000 requisições consecutivas)
npm run embeddings
```

> **Nota:** Enquanto os embeddings de IA não estiverem gerados localmente no seu projeto, a busca semântica irá operar de forma estática via fallback por texto simples.

---

## 💻 Stack Tecnológica

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Inteligência Artificial:** [Google Gemini API](https://ai.google.dev/) — Responsável pela busca semântica, visão computacional e sistema de chat especialista.
