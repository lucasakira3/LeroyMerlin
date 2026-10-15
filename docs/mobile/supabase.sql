-- Execute no SQL Editor de um projeto Supabase. Acesso somente pelas APIs Next.js.
create table if not exists public.mobile_chamados (
  id uuid primary key,
  "sessaoId" uuid not null,
  "clienteNome" text not null,
  "produtoId" text not null,
  "produtoNome" text not null,
  corredor text not null,
  status text not null check (status in ('pendente', 'a_caminho', 'atendido')),
  mensagem text not null,
  "criadoEm" timestamptz not null default now(),
  "atualizadoEm" timestamptz not null default now()
);
create index if not exists mobile_chamados_sessao on public.mobile_chamados ("sessaoId", "criadoEm" desc);
create table if not exists public.mobile_dispositivos (
  "sessaoId" uuid primary key,
  token text not null
);
alter table public.mobile_chamados enable row level security;
alter table public.mobile_dispositivos enable row level security;
revoke all on public.mobile_chamados, public.mobile_dispositivos from anon, authenticated;
grant all on public.mobile_chamados, public.mobile_dispositivos to service_role;
-- Sem policies públicas: SUPABASE_SECRET_KEY fica exclusivamente no servidor.
-- Essa chave acessa o banco com o papel service_role.
