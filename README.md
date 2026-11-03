# Pelada de Quarta

Jornal esportivo sensacionalista da pelada de toda quarta-feira.
Next.js 15 (App Router) + TypeScript + Tailwind + Supabase (Postgres, Auth por magic link, Storage). Deploy na Vercel.

## Rodando localmente

Pré-requisitos: Node 20+ e Docker.

```bash
npm install
npx supabase start      # sobe Postgres/Auth/Storage em Docker, aplica migrations e seed
npm run dev             # http://localhost:3000
```

O projeto usa as portas **553xx** (API em `55321`), para não colidir com outro Supabase local na 543xx.

| Serviço | URL |
|---|---|
| Site | http://localhost:3000 |
| Supabase Studio | http://127.0.0.1:55323 |
| Caixa de e-mail local (os magic links chegam aqui) | http://127.0.0.1:55324 |

O `.env.local` de desenvolvimento usa as chaves fixas do Supabase local (`npx supabase status` mostra todas).

Comandos úteis:

```bash
npm run db:reset    # recria o banco do zero: migrations + seed.sql
npm run db:types    # regenera types/database.ts a partir do banco
npm run test:rls    # prova que a anon key não lê/escreve o que não deve
npm run typecheck
npm run lint
```

## Criando o projeto no Supabase (produção)

1. Em https://supabase.com/dashboard crie um projeto no plano **Free**. Região: São Paulo (`sa-east-1`).
2. Aplique as migrations a partir desta pasta:
   ```bash
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF   # pede a senha do banco
   npx supabase db push                               # aplica supabase/migrations/*
   ```
   O `db push` **não** roda o `seed.sql`. Se quiser os dados de exemplo em produção, cole o conteúdo de
   `supabase/seed.sql` no SQL Editor do painel.
3. **Authentication → URL Configuration**
   - Site URL: `https://seu-dominio.vercel.app`
   - Redirect URLs: `https://seu-dominio.vercel.app/auth/callback`
4. **Authentication → Emails → Magic Link** (e também **Confirm signup**): troque o link do template por
   ```html
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Entrar na redação</a>
   ```
   Isso faz o link funcionar mesmo se o e-mail for aberto em outro aparelho ou navegador. O template
   completo está em `supabase/templates/magic_link.html`.
5. O SMTP padrão do Supabase manda **poucos e-mails por hora**. Para só 1 ou 2 admins isso basta. Se der
   "muito pedido de link", configure um SMTP próprio (Resend, Brevo…) em **Project Settings → Auth → SMTP**.

## Variáveis de ambiente

| Variável | Onde pegar | Exposta ao navegador? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL | sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` | sim (só lê o que a RLS libera) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` | **nunca**: só Route Handlers no servidor |
| `NEXT_PUBLIC_SITE_URL` | a URL pública do site (sem barra no fim) | sim |

Na Vercel: **Settings → Environment Variables**, as quatro, em Production (e em Preview, se usar).
Veja `.env.example`.

## Como se cadastrar como primeiro admin

Não existe cadastro público. Um admin é um usuário do Supabase Auth com uma linha na tabela `admins`.

1. Abra `/login` no site e peça o link com o seu e-mail. Clique no link do e-mail.
   Você cai na página "Você não é admin aqui, parça". Isso é esperado: agora o seu usuário existe em `auth.users`.
2. No **SQL Editor** do Supabase (ou no Studio local), rode trocando o e-mail e o nome:
   ```sql
   insert into public.admins (id, email, nome)
   select id, email, 'Jorge'
   from auth.users
   where email = 'seu-email@exemplo.com';
   ```
3. Recarregue `/admin`. Pronto.

Para tirar alguém da redação: `delete from public.admins where email = '...';`

## Regras da casa (o que o código garante)

- **Três clientes Supabase, que não se misturam**
  - `lib/supabase/publico.ts`: anônimo, só leitura (RLS), usado nas páginas públicas com ISR.
  - `lib/supabase/servidor.ts` e `lib/supabase/navegador.ts`: anon key + sessão do admin. A RLS só libera escrita a quem está em `admins`.
  - Service role: só dentro de Route Handlers (entra na Fase 4, com reações e comentários).
- **Trava de 5 matérias por semana** (quarta 00:00 até terça 23:59, horário de Brasília). A Server Action
  valida e um trigger no banco garante (`posts_antes_de_salvar`, com lock contra duas abas publicando
  ao mesmo tempo). Rascunho não conta; despublicar libera a vaga.
- **Cota de 24 fotos por semana**: capas e galeria, cerca de 5,4 MB por rodada. Imposta pela policy de upload do bucket.
- **Imagens**: comprimidas no navegador (thumb 400px ~25 KB + full 1600px ~200 KB, WebP). O original
  **não sobe nunca**. Servidas por `next/image`, que usa a CDN da Vercel, com cache de 1 ano.
- **Slug**: acompanha a manchete só enquanto a matéria nunca foi ao ar. Depois de publicada, o link é para sempre.
- **Retenção**: nada é apagado automaticamente. A capa mostra as 5 mais recentes e o resto fica no `/arquivo`.

## Estrutura

```
app/                  rotas (públicas, /admin, /login, /auth/callback)
components/           peças visuais (matéria, galeria, chapéu, admin)
lib/                  clientes Supabase, consultas, validação (Zod), imagem, datas
supabase/migrations/  schema, RLS, storage
supabase/seed.sql     8 jogadores, 2 rodadas, 3 matérias de exemplo
scripts/test-rls.ts   teste de segurança com a anon key
types/database.ts     tipos gerados (npm run db:types)
```
