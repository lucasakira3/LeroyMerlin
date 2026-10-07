-- ════════════════════════════════════════════════════════════════════════════════════
-- Leroy Merlin MVP — banco de dados (Supabase / Postgres)
-- Etapa 1: pedidos e atendimento (cliente no celular, funcionário no computador).
-- Etapa 2: contas e login de verdade (fim do arquivo).
--
-- COMO USAR: no painel do Supabase abra "SQL Editor", cole este arquivo inteiro e clique
-- em "Run". Pode rodar de novo quantas vezes quiser: nada é apagado nem duplicado.
--
-- Como o site usa estas tabelas (ver lib/sync/ e app/api/sync/route.ts):
--   • O navegador NUNCA fala direto com o banco. Quem lê e grava é o servidor do site, com
--     a chave secreta. Por isso todas as tabelas têm RLS ligado e NENHUMA política: com a
--     chave pública não dá pra ler nem gravar nada.
--   • Cada aparelho continua guardando uma cópia no próprio navegador e troca só as
--     mudanças com o banco. `atualizado_em` é o relógio dessa troca: o aparelho pede "o que
--     mudou depois de tal hora".
--   • As regras de "quem ganha" quando dois aparelhos mexem na mesma linha ficam aqui no
--     banco (gatilhos "mesclar"), não no site: pedido atendido não volta a pendente,
--     agendamento cancelado não volta a confirmado, etapa do pedido só vale a mais recente.
-- ════════════════════════════════════════════════════════════════════════════════════

-- ── Tabelas ──────────────────────────────────────────────────────────────────────────
-- Ids em texto porque nascem no aparelho do cliente (número do pedido "LM...", "AG-...",
-- "AJ-..."), antes de existir conexão com o banco.

create table if not exists public.clientes (
  id text primary key,                         -- e-mail em minúsculas
  nome text not null default '',
  criado_em timestamptz,
  atualizado_em timestamptz not null default clock_timestamp()
);
comment on table public.clientes is 'Nome de cada cliente cadastrado (sem senha). Serve pro painel do funcionário mostrar quem fez o pedido.';

create table if not exists public.pedidos (
  id text primary key,                         -- número do pedido (ex.: LMMUR9QLFK)
  cliente_email text not null,
  metodo text not null check (metodo in ('retirada', 'entrega')),
  total numeric(12, 2) not null check (total >= 0),
  feito_em timestamptz not null,
  dados jsonb not null,                        -- o pedido inteiro: itens, loja, endereço, pagamento
  atualizado_em timestamptz not null default clock_timestamp()
);
comment on table public.pedidos is 'Pedidos finalizados no site. Um pedido é um retrato do momento da compra: não muda depois.';

create table if not exists public.pedidos_status (
  id text primary key,                         -- número do pedido
  cliente_email text,
  etapa smallint not null check (etapa between 0 and 9),
  definida_em timestamptz not null,            -- quando o funcionário mudou a etapa
  atualizado_em timestamptz not null default clock_timestamp()
);
comment on table public.pedidos_status is 'Etapa do pedido definida à mão pelo funcionário (separar, pronto, entregue).';

create table if not exists public.ajuda_corredor (
  id text primary key,
  produto_id text not null,
  produto_nome text not null,
  corredor text not null,
  cliente_nome text,
  pedido_em timestamptz not null,
  atendido boolean not null default false,
  atualizado_em timestamptz not null default clock_timestamp()
);
comment on table public.ajuda_corredor is 'Pedidos de ajuda feitos pelo cliente de dentro da loja, com produto e corredor.';

create table if not exists public.agendamentos (
  id text primary key,
  cliente_email text,
  cliente_nome text,
  servico text,
  loja text,
  data text,                                   -- como o cliente escolheu (dd/mm/aaaa)
  horario text,
  status text not null default 'confirmado' check (status in ('confirmado', 'cancelado')),
  dados jsonb not null,                        -- o agendamento inteiro (telefone, observação...)
  atualizado_em timestamptz not null default clock_timestamp()
);
comment on table public.agendamentos is 'Visitas agendadas pelo cliente com um especialista da loja.';

create table if not exists public.chamados (
  id text primary key,                         -- id do agendamento
  atendido boolean not null default false,
  notas jsonb not null default '[]'::jsonb,    -- [{ texto, data }]
  atualizado_em timestamptz not null default clock_timestamp()
);
comment on table public.chamados is 'O que o funcionário anotou sobre cada agendamento, e se já atendeu.';

create table if not exists public.conversas (
  id text primary key,                         -- e-mail do cliente
  cliente_nome text,
  atendida_em timestamptz,                     -- quando o funcionário encerrou o atendimento
  atualizado_em timestamptz not null default clock_timestamp()
);
comment on table public.conversas is 'Uma conversa por cliente com o especialista (chat de pessoa pra pessoa, não é a IA).';

create table if not exists public.mensagens (
  id text primary key,
  cliente_email text not null,
  autor text not null check (autor in ('cliente', 'funcionario')),
  texto text not null,
  enviada_em timestamptz not null,
  atualizado_em timestamptz not null default clock_timestamp()
);
comment on table public.mensagens is 'Mensagens das conversas com o especialista. Mensagem enviada não muda depois.';

-- O que foi apagado (agendamento removido, "apagar meus dados"): os outros aparelhos leem
-- daqui pra saber que devem tirar a linha da cópia deles.
create table if not exists public.remocoes (
  tabela text not null,
  id text not null,
  cliente_email text,
  removido_em timestamptz not null default clock_timestamp(),
  primary key (tabela, id)
);
comment on table public.remocoes is 'Registro do que foi apagado, pra os outros aparelhos apagarem também.';

-- ── Índices ──────────────────────────────────────────────────────────────────────────
-- O site sempre pergunta "o que mudou depois de tal hora" (painel do funcionário) ou
-- "o que mudou desse cliente depois de tal hora" (cliente logado).
create index if not exists clientes_atualizado_em_idx on public.clientes (atualizado_em);
create index if not exists pedidos_atualizado_em_idx on public.pedidos (atualizado_em);
create index if not exists pedidos_cliente_idx on public.pedidos (cliente_email, atualizado_em);
create index if not exists pedidos_status_atualizado_em_idx on public.pedidos_status (atualizado_em);
create index if not exists pedidos_status_cliente_idx on public.pedidos_status (cliente_email, atualizado_em);
create index if not exists ajuda_corredor_atualizado_em_idx on public.ajuda_corredor (atualizado_em);
create index if not exists agendamentos_atualizado_em_idx on public.agendamentos (atualizado_em);
create index if not exists agendamentos_cliente_idx on public.agendamentos (cliente_email, atualizado_em);
create index if not exists chamados_atualizado_em_idx on public.chamados (atualizado_em);
create index if not exists conversas_atualizado_em_idx on public.conversas (atualizado_em);
create index if not exists mensagens_atualizado_em_idx on public.mensagens (atualizado_em);
create index if not exists mensagens_cliente_idx on public.mensagens (cliente_email, atualizado_em);
create index if not exists remocoes_removido_em_idx on public.remocoes (removido_em);
create index if not exists remocoes_cliente_idx on public.remocoes (cliente_email, removido_em);

-- ── Gatilhos ─────────────────────────────────────────────────────────────────────────
-- Os gatilhos de uma tabela rodam em ordem alfabética do nome: "t1_mesclar" antes de
-- "t2_carimbar".

-- Carimba a hora da mudança. Se a gravação não mudou nada, é descartada: sem isso, cada
-- aparelho que reenviasse uma linha igual faria todos os outros baixarem ela de novo.
create or replace function public.sync_carimbar() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (to_jsonb(new) - 'atualizado_em') = (to_jsonb(old) - 'atualizado_em') then
    return null;
  end if;
  new.atualizado_em := clock_timestamp();
  return new;
end $$;

-- Etapa do pedido: vale a definida por último. Uma gravação atrasada, de um aparelho que
-- ficou sem internet, não desfaz uma mais nova.
create or replace function public.sync_mesclar_pedidos_status() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.definida_em <= old.definida_em then
    return null;
  end if;
  new.cliente_email := coalesce(new.cliente_email, old.cliente_email);
  return new;
end $$;

-- Pedido de ajuda atendido não volta a pendente.
create or replace function public.sync_mesclar_ajuda_corredor() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atendido := old.atendido or new.atendido;
  return new;
end $$;

-- Agendamento cancelado não volta a confirmado.
create or replace function public.sync_mesclar_agendamentos() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.status = 'cancelado' then
    new.status := 'cancelado';
  end if;
  return new;
end $$;

-- Chamado: atendido não volta atrás, e as notas dos dois lados se somam (sem repetir).
create or replace function public.sync_mesclar_chamados() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atendido := old.atendido or new.atendido;
  new.notas := (
    select coalesce(jsonb_agg(nota order by nota ->> 'data'), '[]'::jsonb)
    from (
      select distinct nota
      from jsonb_array_elements(coalesce(old.notas, '[]'::jsonb) || coalesce(new.notas, '[]'::jsonb)) as nota
    ) as todas
  );
  return new;
end $$;

-- Conversa: fica a hora mais recente em que foi encerrada, e o nome não é apagado por um
-- envio que veio sem nome.
create or replace function public.sync_mesclar_conversas() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atendida_em := greatest(old.atendida_em, new.atendida_em);
  new.cliente_nome := coalesce(nullif(new.cliente_nome, ''), old.cliente_nome);
  return new;
end $$;

create or replace trigger t1_mesclar before update on public.pedidos_status
  for each row execute function public.sync_mesclar_pedidos_status();
create or replace trigger t1_mesclar before update on public.ajuda_corredor
  for each row execute function public.sync_mesclar_ajuda_corredor();
create or replace trigger t1_mesclar before update on public.agendamentos
  for each row execute function public.sync_mesclar_agendamentos();
create or replace trigger t1_mesclar before update on public.chamados
  for each row execute function public.sync_mesclar_chamados();
create or replace trigger t1_mesclar before update on public.conversas
  for each row execute function public.sync_mesclar_conversas();

create or replace trigger t2_carimbar before insert or update on public.clientes
  for each row execute function public.sync_carimbar();
create or replace trigger t2_carimbar before insert or update on public.pedidos
  for each row execute function public.sync_carimbar();
create or replace trigger t2_carimbar before insert or update on public.pedidos_status
  for each row execute function public.sync_carimbar();
create or replace trigger t2_carimbar before insert or update on public.ajuda_corredor
  for each row execute function public.sync_carimbar();
create or replace trigger t2_carimbar before insert or update on public.agendamentos
  for each row execute function public.sync_carimbar();
create or replace trigger t2_carimbar before insert or update on public.chamados
  for each row execute function public.sync_carimbar();
create or replace trigger t2_carimbar before insert or update on public.conversas
  for each row execute function public.sync_carimbar();
create or replace trigger t2_carimbar before insert or update on public.mensagens
  for each row execute function public.sync_carimbar();

-- ── Segurança ────────────────────────────────────────────────────────────────────────
-- RLS ligado e nenhuma política: só a chave secreta (usada pelo servidor do site) passa.
-- O revoke é a segunda trava: tira das chaves públicas até a permissão de tentar.
alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedidos_status enable row level security;
alter table public.ajuda_corredor enable row level security;
alter table public.agendamentos enable row level security;
alter table public.chamados enable row level security;
alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;
alter table public.remocoes enable row level security;

revoke all on table
  public.clientes, public.pedidos, public.pedidos_status, public.ajuda_corredor,
  public.agendamentos, public.chamados, public.conversas, public.mensagens, public.remocoes
from anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════════════════
-- ETAPA 2 — contas e login de verdade
--
-- Até aqui o site aceitava qualquer senha. Agora a senha de cada cliente é conferida no
-- servidor, e o painel do funcionário tem uma senha própria. Só o servidor do site lê estas
-- duas tabelas (lib/servidor/ e app/api/auth/): elas nunca são enviadas a nenhum aparelho.
-- Nenhuma senha é guardada: só o resultado de uma conta de mão única (scrypt, com sal), que
-- serve pra conferir a senha digitada mas não pra descobri-la.
-- ════════════════════════════════════════════════════════════════════════════════════

create table if not exists public.credenciais (
  email text primary key,                      -- e-mail em minúsculas
  senha_hash text not null,                    -- "scrypt$N$r$p$sal$hash" — nunca a senha
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
comment on table public.credenciais is 'Senha de cada cliente, embaralhada (scrypt). Só o servidor do site lê.';

-- Uma linha só: a senha compartilhada do painel do funcionário. O `check (id)` junto com a
-- chave primária garante que não existe segunda linha.
create table if not exists public.painel (
  id boolean primary key default true check (id),
  senha_hash text not null,
  atualizado_em timestamptz not null default now()
);
comment on table public.painel is 'Senha do painel do funcionário, embaralhada (scrypt). Uma linha só.';

alter table public.credenciais enable row level security;
alter table public.painel enable row level security;
revoke all on table public.credenciais, public.painel from anon, authenticated;

