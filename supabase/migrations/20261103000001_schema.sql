-- =====================================================================
-- Blog da Pelada de Quarta — schema
-- Ordem importa: peladas vem antes de posts (posts.pelada_id referencia).
-- Nenhuma coluna guarda imagem: só URLs em text (regra do orçamento).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------

-- quem pode administrar (inserido manualmente, ver README)
create table public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nome text not null,
  criado_em timestamptz not null default now()
);

-- elenco
create table public.jogadores (
  id uuid primary key default gen_random_uuid(),
  apelido text not null unique,
  nome_completo text,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  foto_url text,                       -- só a versão thumb (400px)
  posicao text,
  bordao text,
  desde date,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- cada quarta-feira
create table public.peladas (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  local text,
  observacao text,
  criado_em timestamptz not null default now()
);

-- posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo text not null,
  chapeu text,
  chamada text,
  corpo text not null,                 -- texto simples, parágrafos separados por \n\n
  capa_url_thumb text,                 -- 400px, cards do feed
  capa_url_full text,                  -- 1600px, matéria + og:image (nunca podada)
  autor_id uuid references public.admins(id) on delete set null,
  publicado boolean not null default false,
  publicado_em timestamptz,
  pelada_id uuid references public.peladas(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint posts_publicacao_coerente check (not publicado or publicado_em is not null)
);

-- fotos extras do post (galeria)
create table public.post_fotos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  url_thumb text not null,             -- 400px, mantido para sempre
  url_full text,                       -- 1600px; vira null quando a poda de 6 meses roda
  legenda text,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

-- jogadores citados no post
create table public.post_jogadores (
  post_id uuid not null references public.posts(id) on delete cascade,
  jogador_id uuid not null references public.jogadores(id) on delete cascade,
  primary key (post_id, jogador_id)
);

create table public.presencas (
  pelada_id uuid not null references public.peladas(id) on delete cascade,
  jogador_id uuid not null references public.jogadores(id) on delete cascade,
  presente boolean not null default true,
  primary key (pelada_id, jogador_id)
);

create table public.partidas (
  id uuid primary key default gen_random_uuid(),
  pelada_id uuid not null references public.peladas(id) on delete cascade,
  ordem int not null check (ordem > 0),
  time_a text not null,
  time_b text not null,
  gols_a int not null default 0 check (gols_a >= 0),
  gols_b int not null default 0 check (gols_b >= 0),
  unique (pelada_id, ordem)
);

create table public.gols (
  id uuid primary key default gen_random_uuid(),
  partida_id uuid not null references public.partidas(id) on delete cascade,
  jogador_id uuid not null references public.jogadores(id) on delete cascade,
  assistencia_id uuid references public.jogadores(id) on delete set null,
  contra boolean not null default false,
  minuto int check (minuto is null or minuto between 0 and 200),
  constraint gols_assistencia_de_outro check (assistencia_id is null or assistencia_id <> jogador_id)
);

-- reações (sem login; escrita só via Route Handler com service role)
create table public.reacoes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  emoji text not null check (emoji in ('🤣','⚽','🐐','🤡','🥶','🫡')),
  visitante_hash text not null,        -- sha256, nunca IP cru
  criado_em timestamptz not null default now(),
  unique (post_id, emoji, visitante_hash)
);

-- comentários (sem login, moderados; escrita só via Route Handler)
create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  apelido text not null check (char_length(apelido) between 2 and 24),
  corpo text not null check (char_length(corpo) between 2 and 500),
  visitante_hash text not null,
  status text not null default 'pendente'
    check (status in ('pendente','aprovado','removido')),
  criado_em timestamptz not null default now()
);

-- log dos crons (poda de fotos, keep-alive)
create table public.manutencao_log (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('poda_fotos','keep_alive')),
  arquivos_apagados int not null default 0,
  bytes_liberados bigint not null default 0,
  detalhes jsonb,
  executado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index posts_publicado_idx on public.posts (publicado, publicado_em desc);
create index comentarios_post_status_idx on public.comentarios (post_id, status);
create index reacoes_post_idx on public.reacoes (post_id);
create index gols_jogador_idx on public.gols (jogador_id);

-- FKs consultadas com frequência
create index posts_pelada_idx on public.posts (pelada_id);
create index post_fotos_post_idx on public.post_fotos (post_id, ordem);
create index post_jogadores_jogador_idx on public.post_jogadores (jogador_id);
create index presencas_jogador_idx on public.presencas (jogador_id);
create index partidas_pelada_idx on public.partidas (pelada_id, ordem);
create index gols_partida_idx on public.gols (partida_id);
create index manutencao_log_tipo_idx on public.manutencao_log (tipo, executado_em desc);

-- ---------------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------------

create or replace function public.is_admin() returns boolean
language sql security definer stable
set search_path = ''
as $$
  select exists (select 1 from public.admins where id = (select auth.uid()));
$$;

-- Início da semana da pelada (quarta 00:00, horário de Brasília) que contém `ref`.
-- isodow: seg=1 … dom=7; quarta=3 → dias desde a última quarta = (isodow + 4) % 7.
create or replace function public.inicio_semana(ref timestamptz default now())
returns timestamptz
language sql stable
set search_path = ''
as $$
  select (
    (ref at time zone 'America/Sao_Paulo')::date
    - ((extract(isodow from (ref at time zone 'America/Sao_Paulo'))::int + 4) % 7)
  )::timestamp at time zone 'America/Sao_Paulo';
$$;

create or replace function public.limite_posts_semana() returns int
language sql immutable as $$ select 5 $$;

-- 24 imagens/semana × ~225 KB (thumb + full) ≈ 5,4 MB → meta de < 6 MB por rodada.
create or replace function public.limite_fotos_semana() returns int
language sql immutable as $$ select 24 $$;

-- Imagens de post (capa ou galeria) enviadas na semana corrente.
-- Conta os arquivos `full` no bucket: apagar uma foto libera a vaga.
create or replace function public.fotos_semana() returns int
language sql stable security definer
set search_path = ''
as $$
  select count(*)::int
  from storage.objects
  where bucket_id = 'midia'
    and name like 'posts/%'
    and storage.filename(name) like 'full.%'
    and created_at >= public.inicio_semana();
$$;

-- Uso do bucket para o painel de consumo do admin.
create or replace function public.uso_storage()
returns table (total_arquivos int, total_fotos int, total_bytes bigint)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'acesso negado' using errcode = '42501';
  end if;
  return query
    select count(*)::int,
           count(*) filter (where storage.filename(o.name) like 'thumb.%')::int,
           coalesce(sum((o.metadata->>'size')::bigint), 0)::bigint
    from storage.objects o
    where o.bucket_id = 'midia';
end;
$$;

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------

-- posts: carimba atualizado_em, cuida de publicado_em e aplica a trava de
-- 5 publicações por semana (quarta a terça). A Server Action também valida,
-- mas o trigger é a garantia final: duas abas publicando ao mesmo tempo não
-- passam do teto por causa do advisory lock.
create or replace function public.posts_antes_de_salvar() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  ja_publicadas int;
  semana timestamptz;
begin
  new.atualizado_em := now();

  -- Rascunho/despublicado: publicado_em fica como histórico ("já foi ao ar"),
  -- o que impede o slug de mudar depois que o link circulou. A cota só
  -- conta publicado = true, então despublicar libera a vaga.
  if not new.publicado then
    if tg_op = 'UPDATE' then
      new.publicado_em := old.publicado_em;
    end if;
    return new;
  end if;

  -- já estava publicado: a data de publicação não muda em edições
  if tg_op = 'UPDATE' and old.publicado then
    new.publicado_em := old.publicado_em;
    return new;
  end if;

  -- está sendo publicado agora (insert com data explícita só no seed)
  new.publicado_em := case when tg_op = 'INSERT' then coalesce(new.publicado_em, now()) else now() end;
  semana := public.inicio_semana(new.publicado_em);

  perform pg_advisory_xact_lock(hashtext('cota_semanal_posts'));

  select count(*) into ja_publicadas
  from public.posts p
  where p.publicado
    and p.id <> new.id
    and p.publicado_em >= semana
    and p.publicado_em < semana + interval '7 days';

  if ja_publicadas >= public.limite_posts_semana() then
    raise exception 'COTA_SEMANAL_ESTOURADA' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger posts_antes_de_salvar
  before insert or update on public.posts
  for each row execute function public.posts_antes_de_salvar();

-- ---------------------------------------------------------------------
-- Views (rankings agregados no banco, nunca no JavaScript)
-- ---------------------------------------------------------------------

-- Temporada = ano civil da pelada.
create view public.v_artilharia with (security_invoker = on) as
select
  j.id as jogador_id,
  j.apelido,
  j.slug,
  j.foto_url,
  j.ativo,
  count(g.id) filter (where not g.contra)::int as gols_total,
  count(g.id) filter (
    where not g.contra
      and extract(year from pe.data) = extract(year from (now() at time zone 'America/Sao_Paulo'))
  )::int as gols_temporada
from public.jogadores j
left join public.gols g on g.jogador_id = j.id
left join public.partidas pa on pa.id = g.partida_id
left join public.peladas pe on pe.id = pa.pelada_id
group by j.id;

-- % de presença sobre as peladas desde que o jogador entrou (jogadores.desde).
create view public.v_presenca with (security_invoker = on) as
select
  j.id as jogador_id,
  j.apelido,
  j.slug,
  j.foto_url,
  j.ativo,
  p.presencas,
  t.total as peladas_possiveis,
  case when t.total > 0
       then least(100, round(100.0 * p.presencas / t.total, 1))
       else 0 end as percentual
from public.jogadores j
cross join lateral (
  select count(*)::int as presencas
  from public.presencas pr
  where pr.jogador_id = j.id and pr.presente
) p
cross join lateral (
  select count(*)::int as total
  from public.peladas pe
  where pe.data >= coalesce(j.desde, '-infinity'::date)
) t;

-- Hall da Vergonha
create view public.v_gols_contra with (security_invoker = on) as
select
  j.id as jogador_id,
  j.apelido,
  j.slug,
  j.foto_url,
  count(g.id)::int as gols_contra,
  max(pe.data) as ultimo_vexame
from public.jogadores j
join public.gols g on g.jogador_id = j.id and g.contra
join public.partidas pa on pa.id = g.partida_id
join public.peladas pe on pe.id = pa.pelada_id
group by j.id;

-- Contagem de reações por post (sem expor visitante_hash)
create view public.v_reacoes_contagem with (security_invoker = on) as
select post_id, emoji, count(*)::int as total
from public.reacoes
group by post_id, emoji;

-- Cota da semana (posts e fotos), mostrada em /admin
create view public.v_cota_semanal with (security_invoker = on) as
select
  public.inicio_semana() as inicio,
  public.inicio_semana() + interval '7 days' as fim,
  (
    select count(*)::int from public.posts p
    where p.publicado
      and p.publicado_em >= public.inicio_semana()
      and p.publicado_em < public.inicio_semana() + interval '7 days'
  ) as publicadas,
  public.limite_posts_semana() as limite,
  public.fotos_semana() as fotos,
  public.limite_fotos_semana() as limite_fotos;
