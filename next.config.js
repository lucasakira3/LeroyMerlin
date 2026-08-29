/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16 gera AGENTS.md/CLAUDE.md automaticamente no root a cada build/dev;
  // desativado porque o projeto já mantém seu próprio CLAUDE.md com convenções reais.
  agentRules: false,
}

module.exports = nextConfig
