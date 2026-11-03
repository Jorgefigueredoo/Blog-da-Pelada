-- =====================================================================
-- Seed de exemplo: 8 jogadores fictícios, 2 rodadas, 3 posts.
-- As datas são relativas à semana atual, para o layout sempre parecer fresco
-- (as duas quartas anteriores à semana corrente; a cota desta semana fica zerada).
-- Os posts não têm capa: o layout mostra o fundo de gramado no lugar.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Elenco
-- ---------------------------------------------------------------------
insert into public.jogadores (id, apelido, nome_completo, slug, posicao, bordao, desde) values
  ('11111111-0000-4000-8000-000000000001', 'Paredão',      'Ricardo Almeida',   'paredao',      'goleiro',        'Aqui não passa nem pensamento.',            '2019-03-06'),
  ('11111111-0000-4000-8000-000000000002', 'Canela',       'Fábio Nogueira',    'canela',       'zagueiro',       'Na dúvida, chutão.',                        '2019-03-06'),
  ('11111111-0000-4000-8000-000000000003', 'Tonhão',       'Antônio Ribeiro',   'tonhao',       'zagueiro',       'Passa a bola ou passa o jogador, nunca os dois.', '2020-08-12'),
  ('11111111-0000-4000-8000-000000000004', 'Maestro',      'Gustavo Pereira',   'maestro',      'meia',           'Eu vi o passe antes de você correr.',       '2019-03-06'),
  ('11111111-0000-4000-8000-000000000005', 'Pé de Pano',   'Leandro Souza',     'pe-de-pano',   'meia',           'Foi de propósito.',                         '2021-02-03'),
  ('11111111-0000-4000-8000-000000000006', 'Fominha',      'Marcelo Duarte',    'fominha',      'atacante',       'Tava livre? Não vi.',                       '2019-03-06'),
  ('11111111-0000-4000-8000-000000000007', 'Jorginho 7',   'Jorge Martins',     'jorginho-7',   'atacante',       'Camisa 7 não volta pra marcar.',            '2022-05-11'),
  ('11111111-0000-4000-8000-000000000008', 'Coringa',      'Paulo Henrique',    'coringa',      'o que sobrar',   'Me bota em qualquer lugar, menos no gol.',  '2023-01-18');

-- ---------------------------------------------------------------------
-- Rodadas: as duas quartas anteriores à semana corrente
-- ---------------------------------------------------------------------
insert into public.peladas (id, data, local, observacao) values
  ('22222222-0000-4000-8000-000000000001',
   ((public.inicio_semana() at time zone 'America/Sao_Paulo')::date - 14),
   'Society do Zé', 'Choveu no segundo tempo. Ninguém foi embora, ninguém marcou também.'),
  ('22222222-0000-4000-8000-000000000002',
   ((public.inicio_semana() at time zone 'America/Sao_Paulo')::date - 7),
   'Society do Zé', 'Noite de casa cheia, teve até reserva.');

insert into public.presencas (pelada_id, jogador_id, presente)
select '22222222-0000-4000-8000-000000000001', id, slug <> 'coringa'
from public.jogadores;

insert into public.presencas (pelada_id, jogador_id, presente)
select '22222222-0000-4000-8000-000000000002', id, true
from public.jogadores;

insert into public.partidas (id, pelada_id, ordem, time_a, time_b, gols_a, gols_b) values
  ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 1, 'Coletes', 'Sem colete', 2, 1),
  ('33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 2, 'Coletes', 'Sem colete', 0, 0),
  ('33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000002', 1, 'Coletes', 'Sem colete', 3, 2),
  ('33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000002', 2, 'Coletes', 'Sem colete', 1, 4);

insert into public.gols (partida_id, jogador_id, assistencia_id, contra, minuto) values
  -- rodada 1, partida 1: Coletes 2 x 1 Sem colete
  ('33333333-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000006', '11111111-0000-4000-8000-000000000004', false, 4),
  ('33333333-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000003', null,                                   true,  9),
  ('33333333-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000007', null,                                   false, 11),
  -- rodada 2, partida 1: Coletes 3 x 2 Sem colete
  ('33333333-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000006', null,                                   false, 2),
  ('33333333-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000006', '11111111-0000-4000-8000-000000000004', false, 6),
  ('33333333-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000008', false, 7),
  ('33333333-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000007', null,                                   false, 10),
  ('33333333-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000002', null,                                   true,  12),
  -- rodada 2, partida 2: Coletes 1 x 4 Sem colete
  ('33333333-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000004', null,                                   false, 3),
  ('33333333-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000007', '11111111-0000-4000-8000-000000000005', false, 5),
  ('33333333-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000007', null,                                   false, 8),
  ('33333333-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000008', '11111111-0000-4000-8000-000000000007', false, 9),
  ('33333333-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000003', null,                                   true,  13);

-- ---------------------------------------------------------------------
-- Posts (publicados na noite de cada rodada)
-- ---------------------------------------------------------------------
insert into public.posts (id, slug, titulo, chapeu, chamada, corpo, publicado, publicado_em, pelada_id) values
  ('44444444-0000-4000-8000-000000000001',
   'tonhao-marca-contra-e-culpa-a-chuva',
   'TONHÃO MARCA CONTRA E CULPA A CHUVA',
   'ESCÂNDALO',
   'Zagueiro desviou cruzamento para o próprio gol aos 9 minutos e alegou que "a bola estava molhada demais pra ter dono".',
   E'Foi numa quarta-feira chuvosa que o Society do Zé testemunhou mais um capítulo da longa e triste relação entre Tonhão e a bola.\n\nAos 9 minutos da primeira partida, o zagueiro foi cortar um cruzamento despretensioso e, com a precisão que nunca demonstrou no ataque, colocou no ângulo do próprio Paredão.\n\n"A bola estava molhada demais pra ter dono", declarou Tonhão à nossa reportagem, já de chinelo. Testemunhas afirmam que não chovia naquele minuto.\n\nO Hall da Vergonha agradece a contribuição.',
   true,
   ((public.inicio_semana() at time zone 'America/Sao_Paulo')::date - 14 + time '23:10') at time zone 'America/Sao_Paulo',
   '22222222-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000002',
   'fominha-faz-dois-e-nao-passa-a-bola-nem-pro-garcom',
   'FOMINHA FAZ DOIS E NÃO PASSA A BOLA NEM PRO GARÇOM',
   'EXCLUSIVO',
   'Atacante terminou a noite com dois gols, zero passes completos e um pedido formal de desculpas do Maestro, que deu a assistência.',
   E'Quem esteve no Society do Zé na última quarta viu Fominha em estado puro.\n\nForam dois gols na primeira partida, ambos marcados depois de ignorar pelo menos três companheiros livres. "Tava livre? Não vi", repetiu o atacante, fiel ao próprio bordão.\n\nNo bar depois do jogo, a reportagem flagrou Fominha pegando a última coxinha da travessa sem oferecer a ninguém. O garçom confirmou: "Nem pra mim ele tocou".\n\nO Maestro, autor da assistência no segundo gol, pediu desculpas publicamente ao grupo.',
   true,
   ((public.inicio_semana() at time zone 'America/Sao_Paulo')::date - 7 + time '23:05') at time zone 'America/Sao_Paulo',
   '22222222-0000-4000-8000-000000000002'),
  ('44444444-0000-4000-8000-000000000003',
   'virada-historica-sem-colete-atropela-e-coletes-pedem-var',
   'VIRADA HISTÓRICA: SEM COLETE ATROPELA E COLETES PEDEM VAR',
   'É TETRA',
   'Quatro a um na segunda partida. Jorginho 7 fez dois, não voltou pra marcar nenhuma vez e ainda assim saiu de campo ovacionado.',
   E'A segunda partida da noite entrou para a história da pelada como a maior goleada do ano.\n\nDepois de perder a primeira por 3 a 2, o time Sem colete voltou do intervalo de dois minutos completamente transformado. Jorginho 7 marcou duas vezes, Coringa deixou o dele e ainda teve gol contra de Tonhão — de novo.\n\nOs Coletes chegaram a pedir revisão de lance no VAR, que, como todo mundo sabe, é o celular do Canela apoiado na grade. A bateria tinha acabado no primeiro tempo.\n\nPlacar final: Coletes 1 x 4 Sem colete.',
   true,
   ((public.inicio_semana() at time zone 'America/Sao_Paulo')::date - 7 + time '23:40') at time zone 'America/Sao_Paulo',
   '22222222-0000-4000-8000-000000000002');

insert into public.post_jogadores (post_id, jogador_id) values
  ('44444444-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000003'),
  ('44444444-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000006'),
  ('44444444-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000004'),
  ('44444444-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000007'),
  ('44444444-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000008'),
  ('44444444-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000003');
