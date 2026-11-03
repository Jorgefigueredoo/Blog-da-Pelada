-- =====================================================================
-- Row Level Security — todas as tabelas.
-- Visitante (anon): só leitura do que é público.
-- Admin (authenticated + linha em admins): escrita.
-- Reações e comentários: nenhum insert via anon; entram só por Route
-- Handler no servidor, com service role, depois de validação e rate limit.
-- =====================================================================

alter table public.admins          enable row level security;
alter table public.jogadores       enable row level security;
alter table public.peladas         enable row level security;
alter table public.posts           enable row level security;
alter table public.post_fotos      enable row level security;
alter table public.post_jogadores  enable row level security;
alter table public.presencas       enable row level security;
alter table public.partidas        enable row level security;
alter table public.gols            enable row level security;
alter table public.reacoes         enable row level security;
alter table public.comentarios     enable row level security;
alter table public.manutencao_log  enable row level security;

-- ---------------------------------------------------------------------
-- Privilégios: anon nunca escreve, e não enxerga visitante_hash.
-- (RLS já bloquearia; isto é a segunda tranca.)
-- ---------------------------------------------------------------------
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke all on public.admins from anon;
revoke all on public.manutencao_log from anon;
revoke all on public.v_cota_semanal from anon;

revoke select on public.comentarios from anon;
grant select (id, post_id, apelido, corpo, status, criado_em) on public.comentarios to anon;

revoke select on public.reacoes from anon;
grant select (id, post_id, emoji, criado_em) on public.reacoes to anon;

revoke execute on function public.fotos_semana() from anon, public;
revoke execute on function public.uso_storage() from anon, public;
grant execute on function public.fotos_semana() to authenticated, service_role;
grant execute on function public.uso_storage() to authenticated, service_role;

-- ---------------------------------------------------------------------
-- admins: sem acesso público
-- ---------------------------------------------------------------------
create policy "admins: admin lê" on public.admins
  for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------
create policy "posts: público lê publicados" on public.posts
  for select to anon, authenticated
  using (publicado and publicado_em <= now());

create policy "posts: admin lê tudo" on public.posts
  for select to authenticated using ((select public.is_admin()));

create policy "posts: admin insere" on public.posts
  for insert to authenticated with check ((select public.is_admin()));

create policy "posts: admin edita" on public.posts
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "posts: admin apaga" on public.posts
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Tabelas de leitura pública e escrita de admin
-- ---------------------------------------------------------------------
create policy "jogadores: público lê" on public.jogadores
  for select to anon, authenticated using (true);
create policy "jogadores: admin escreve" on public.jogadores
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "peladas: público lê" on public.peladas
  for select to anon, authenticated using (true);
create policy "peladas: admin escreve" on public.peladas
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "partidas: público lê" on public.partidas
  for select to anon, authenticated using (true);
create policy "partidas: admin escreve" on public.partidas
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "gols: público lê" on public.gols
  for select to anon, authenticated using (true);
create policy "gols: admin escreve" on public.gols
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "presencas: público lê" on public.presencas
  for select to anon, authenticated using (true);
create policy "presencas: admin escreve" on public.presencas
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Fotos e marcações só aparecem junto com o post: a subconsulta em posts
-- passa pela RLS de posts, então rascunho não vaza galeria nem marcação.
create policy "post_fotos: público lê se o post é visível" on public.post_fotos
  for select to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy "post_fotos: admin escreve" on public.post_fotos
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "post_jogadores: público lê se o post é visível" on public.post_jogadores
  for select to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy "post_jogadores: admin escreve" on public.post_jogadores
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- comentarios: público só vê aprovados; nenhuma policy de insert
-- ---------------------------------------------------------------------
create policy "comentarios: público lê aprovados" on public.comentarios
  for select to anon, authenticated
  using (status = 'aprovado' and exists (select 1 from public.posts p where p.id = post_id));

create policy "comentarios: admin lê tudo" on public.comentarios
  for select to authenticated using ((select public.is_admin()));

create policy "comentarios: admin modera" on public.comentarios
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "comentarios: admin apaga" on public.comentarios
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- reacoes: leitura pública (sem o hash, ver grants acima); nenhuma policy de insert
-- ---------------------------------------------------------------------
create policy "reacoes: público lê" on public.reacoes
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- manutencao_log: só admin lê; escrita pelo cron (service role)
-- ---------------------------------------------------------------------
create policy "manutencao_log: admin lê" on public.manutencao_log
  for select to authenticated using ((select public.is_admin()));
