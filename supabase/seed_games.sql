-- Catálogo inicial do Atlas. Execute este arquivo no SQL Editor do Supabase
-- depois de aplicar schema.sql. Os dados são públicos para contas autenticadas;
-- respostas de perfil continuam guardadas em atlas_saves.

create table if not exists public.atlas_games (
  id text primary key,
  title text not null,
  franchise text,
  release_year smallint,
  platforms text[] not null default '{}'::text[],
  genre_tags text[] not null default '{}'::text[],
  mechanic_tags text[] not null default '{}'::text[],
  play_contexts text[] not null default '{}'::text[],
  short_description text not null default '',
  is_profile_selectable boolean not null default true,
  is_recommendation_candidate boolean not null default true,
  curation_score smallint not null default 1 check (curation_score between 0 and 5),
  sort_order integer not null default 100
);

-- Metadados para jogos importados do IGDB. Também migra instalações que já
-- executaram uma versão anterior deste arquivo.
alter table public.atlas_games
  add column if not exists theme_tags text[] not null default '{}'::text[],
  add column if not exists source text not null default 'atlas',
  add column if not exists source_id text,
  add column if not exists cover_url text,
  add column if not exists external_metadata jsonb not null default '{}'::jsonb;

create unique index if not exists atlas_games_source_source_id_unique
  on public.atlas_games (source, source_id)
  where source_id is not null;

alter table public.atlas_games enable row level security;
revoke all on table public.atlas_games from public, anon, authenticated;
grant select on table public.atlas_games to authenticated;

drop policy if exists atlas_games_read_catalog on public.atlas_games;
create policy atlas_games_read_catalog
  on public.atlas_games
  for select
  to authenticated
  using (true);

insert into public.atlas_games (
  id, title, franchise, release_year, platforms, genre_tags, mechanic_tags,
  play_contexts, short_description, is_profile_selectable,
  is_recommendation_candidate, curation_score, sort_order
) values
  ('pokemon-firered', 'Pokémon FireRed', 'Pokémon', 2004, array['GBA'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'RPG de captura, formação de equipe e exploração.', true, true, 3, 10),
  ('pokemon-emerald', 'Pokémon Emerald', 'Pokémon', 2004, array['GBA'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'RPG de captura, formação de equipe e exploração.', true, true, 4, 11),
  ('pokemon-platinum', 'Pokémon Platinum', 'Pokémon', 2008, array['DS'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'RPG de captura, formação de equipe e exploração.', true, true, 4, 12),
  ('pokemon-heartgold', 'Pokémon HeartGold', 'Pokémon', 2009, array['DS'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'RPG de captura, formação de equipe e exploração.', true, true, 4, 13),
  ('pokemon-white', 'Pokémon White', 'Pokémon', 2010, array['DS'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'RPG de captura, formação de equipe e exploração.', true, true, 4, 14),
  ('pokemon-alpha-sapphire', 'Pokémon Alpha Sapphire', 'Pokémon', 2014, array['3DS'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'RPG de captura, formação de equipe e exploração.', true, true, 3, 15),
  ('pokemon-rom-hacks', 'Pokémon: hack roms', 'Pokémon', null, array['GBA','DS','various'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'Experiências feitas por fãs; o título específico pode ser acrescentado depois.', true, false, 0, 16),
  ('zelda-minish-cap', 'The Legend of Zelda: The Minish Cap', 'The Legend of Zelda', 2004, array['GBA'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura de ação com exploração, itens e quebra-cabeças.', true, true, 4, 20),
  ('zelda-phantom-hourglass', 'The Legend of Zelda: Phantom Hourglass', 'The Legend of Zelda', 2007, array['DS'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura de ação com exploração, itens e quebra-cabeças.', true, true, 3, 21),
  ('zelda-spirit-tracks', 'The Legend of Zelda: Spirit Tracks', 'The Legend of Zelda', 2009, array['DS'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura de ação com exploração, itens e quebra-cabeças.', true, true, 3, 22),
  ('zelda-ocarina-of-time', 'The Legend of Zelda: Ocarina of Time', 'The Legend of Zelda', 1998, array['N64','3DS'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura de ação em 3D com exploração e masmorras.', true, true, 5, 23),
  ('zelda-majoras-mask', 'The Legend of Zelda: Majora’s Mask', 'The Legend of Zelda', 2000, array['N64','3DS'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling','time-loop'], array['pc-emulation'], 'Aventura de ação em 3D com exploração e um ciclo temporal.', true, true, 5, 24),
  ('zelda-oracle-of-ages', 'The Legend of Zelda: Oracle of Ages', 'The Legend of Zelda', 2001, array['GBC'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura portátil de ação e quebra-cabeças.', true, true, 3, 25),
  ('zelda-oracle-of-seasons', 'The Legend of Zelda: Oracle of Seasons', 'The Legend of Zelda', 2001, array['GBC'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura portátil de ação e exploração.', true, true, 3, 26),
  ('zelda-links-awakening', 'The Legend of Zelda: Link’s Awakening', 'The Legend of Zelda', 1993, array['GB','GBC','Switch'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation','pc'], 'Aventura de ação portátil com exploração e masmorras.', true, true, 4, 27),
  ('zelda-a-link-to-the-past', 'The Legend of Zelda: A Link to the Past', 'The Legend of Zelda', 1991, array['SNES','GBA'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura de ação em 2D com exploração e masmorras.', true, true, 5, 28),
  ('kirby-amazing-mirror', 'Kirby & the Amazing Mirror', 'Kirby', 2004, array['GBA'], array['platformer','action-adventure'], array['exploration','ability-copy','connected-world'], array['pc-emulation'], 'Plataforma e exploração em um mundo conectado, com habilidades copiadas.', true, true, 3, 30),
  ('minecraft', 'Minecraft', 'Minecraft', 2011, array['PC','Android'], array['sandbox','survival'], array['building','crafting','exploration'], array['pc','android'], 'Construção e exploração em mundos gerados por blocos.', true, true, 3, 40),
  ('terraria', 'Terraria', 'Terraria', 2011, array['PC','Android'], array['sandbox','action-adventure'], array['building','crafting','exploration','boss-fights'], array['pc','android'], 'Exploração, construção e combate em um mundo 2D.', true, true, 3, 41),
  ('stardew-valley', 'Stardew Valley', 'Stardew Valley', 2016, array['PC','Android'], array['simulation','rpg'], array['farming','relationships','crafting','exploration'], array['pc','android'], 'Simulação de vida rural com cultivo, relações e exploração.', true, true, 3, 42),
  ('angry-birds-epic', 'Angry Birds Epic', 'Angry Birds', 2014, array['Android','iOS'], array['rpg','strategy'], array['turn-based-combat','party-building'], array['android'], 'RPG de batalhas em turnos no universo Angry Birds.', true, false, 0, 43),
  ('golden-sun', 'Golden Sun', 'Golden Sun', 2001, array['GBA'], array['rpg'], array['turn-based-combat','exploration','elemental-puzzles'], array['pc-emulation'], 'RPG de aventura com combate em turnos e quebra-cabeças elementais.', true, true, 5, 50),
  ('mario-and-luigi-superstar-saga', 'Mario & Luigi: Superstar Saga', 'Mario & Luigi', 2003, array['GBA'], array['rpg'], array['turn-based-combat','timed-actions','exploration'], array['pc-emulation'], 'RPG com combate em turnos e comandos de ação no tempo certo.', true, true, 4, 51),
  ('metroid-fusion', 'Metroid Fusion', 'Metroid', 2002, array['GBA'], array['action-adventure'], array['exploration','ability-unlocks','connected-world'], array['pc-emulation'], 'Aventura de ação em um mapa interligado, com habilidades que abrem caminhos.', true, true, 5, 52),
  ('castlevania-aria-of-sorrow', 'Castlevania: Aria of Sorrow', 'Castlevania', 2003, array['GBA'], array['action-adventure'], array['exploration','ability-unlocks','connected-world'], array['pc-emulation'], 'Ação e exploração em um castelo interligado, com habilidades colecionáveis.', true, true, 4, 53),
  ('advance-wars', 'Advance Wars', 'Advance Wars', 2001, array['GBA'], array['strategy'], array['turn-based-combat','grid-tactics'], array['pc-emulation'], 'Estratégia em turnos com unidades e mapas em grade.', true, true, 4, 54),
  ('wario-land-4', 'Wario Land 4', 'Wario Land', 2001, array['GBA'], array['platformer'], array['exploration','puzzle-solving','time-limit'], array['pc-emulation'], 'Plataforma 2D com exploração de fases e desafios de tempo.', true, true, 3, 55),
  ('fire-emblem-sacred-stones', 'Fire Emblem: The Sacred Stones', 'Fire Emblem', 2004, array['GBA'], array['strategy','rpg'], array['turn-based-combat','grid-tactics','party-building'], array['pc-emulation'], 'RPG tático com batalhas em grade e personagens que evoluem.', true, true, 5, 56),
  ('super-metroid', 'Super Metroid', 'Metroid', 1994, array['SNES'], array['action-adventure'], array['exploration','ability-unlocks','connected-world'], array['pc-emulation'], 'Aventura de ação em um mundo interligado que se abre com novas habilidades.', true, true, 5, 57),
  ('chrono-trigger', 'Chrono Trigger', 'Chrono Trigger', 1995, array['SNES','DS','PC'], array['rpg'], array['turn-based-combat','time-travel','party-building'], array['pc-emulation','pc'], 'RPG de aventura com combate em turnos e viagens no tempo.', true, true, 5, 58),
  ('portal', 'Portal', 'Portal', 2007, array['PC'], array['puzzle','first-person'], array['physics-puzzles','spatial-reasoning'], array['pc'], 'Jogo de quebra-cabeças em primeira pessoa baseado em portais.', true, true, 5, 60),
  ('celeste', 'Celeste', 'Celeste', 2018, array['PC','Switch','PS4','Xbox One'], array['platformer'], array['precision-platforming','accessibility-options'], array['pc'], 'Plataforma de precisão com foco em movimento e superação.', true, true, 4, 61),
  ('hollow-knight', 'Hollow Knight', 'Hollow Knight', 2017, array['PC','Switch','PS4','Xbox One'], array['action-adventure'], array['exploration','ability-unlocks','connected-world','boss-fights'], array['pc'], 'Aventura de ação em um mundo subterrâneo interligado.', true, true, 5, 62),
  ('a-short-hike', 'A Short Hike', 'A Short Hike', 2019, array['PC','Switch','PS4','Xbox One'], array['adventure','simulation'], array['exploration','light-platforming','short-experience'], array['pc'], 'Pequena aventura de exploração em uma ilha aberta.', true, true, 3, 63)
on conflict (id) do update set
  title = excluded.title,
  franchise = excluded.franchise,
  release_year = excluded.release_year,
  platforms = excluded.platforms,
  genre_tags = excluded.genre_tags,
  mechanic_tags = excluded.mechanic_tags,
  play_contexts = excluded.play_contexts,
  short_description = excluded.short_description,
  is_profile_selectable = excluded.is_profile_selectable,
  is_recommendation_candidate = excluded.is_recommendation_candidate,
  curation_score = excluded.curation_score,
  sort_order = excluded.sort_order;
