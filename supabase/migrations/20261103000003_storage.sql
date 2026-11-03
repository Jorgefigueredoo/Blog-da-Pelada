-- =====================================================================
-- Storage: bucket `midia`, leitura pública, escrita só de admin.
--
-- Layout dos arquivos (nome com UUID, nunca sobrescrito):
--   posts/<uuid>/full.webp     1600px — capa e lightbox
--   posts/<uuid>/thumb.webp    400px  — cards e grid
--   jogadores/<uuid>/thumb.webp
-- (.jpg em vez de .webp quando o navegador não codifica WebP)
--
-- Limite de 2 MB por arquivo: o que chega aqui já foi comprimido no
-- navegador (~200 KB o maior). O original nunca é enviado.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('midia', 'midia', true, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Upload: admin, e o `full` de post respeita a cota semanal de fotos.
create policy "midia: admin envia" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'midia'
    and (select public.is_admin())
    and (
      name not like 'posts/%'
      or storage.filename(name) not like 'full.%'
      or public.fotos_semana() < public.limite_fotos_semana()
    )
  );

create policy "midia: admin lista" on storage.objects
  for select to authenticated
  using (bucket_id = 'midia' and (select public.is_admin()));

create policy "midia: admin atualiza" on storage.objects
  for update to authenticated
  using (bucket_id = 'midia' and (select public.is_admin()))
  with check (bucket_id = 'midia' and (select public.is_admin()));

create policy "midia: admin apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'midia' and (select public.is_admin()));
