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
  sort_order integer not null default 100,
  series_key text,
  series_path text,
  series_order smallint,
  series_requires text[] not null default '{}'::text[],
  emulation_tier smallint
);

-- Metadados para jogos importados do IGDB. Também migra instalações que já
-- executaram uma versão anterior deste arquivo.
alter table public.atlas_games
  add column if not exists theme_tags text[] not null default '{}'::text[],
  add column if not exists source text not null default 'atlas',
  add column if not exists source_id text,
  add column if not exists cover_url text,
  add column if not exists external_metadata jsonb not null default '{}'::jsonb,
  add column if not exists series_key text,
  add column if not exists series_path text,
  add column if not exists series_order smallint,
  add column if not exists series_requires text[] not null default '{}'::text[],
  add column if not exists emulation_tier smallint;

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
  ('zelda-skyward-sword', 'The Legend of Zelda: Skyward Sword', 'The Legend of Zelda', 2011, array['Wii','Switch'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura de ação que acompanha o início da história de Hyrule.', true, true, 5, 19),
  ('zelda-minish-cap', 'The Legend of Zelda: The Minish Cap', 'The Legend of Zelda', 2004, array['GBA'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura de ação com exploração, itens e quebra-cabeças.', true, true, 4, 20),
  ('zelda-four-swords', 'The Legend of Zelda: Four Swords', 'The Legend of Zelda', 2002, array['GBA'], array['action-adventure'], array['exploration','puzzle-solving'], array['pc-emulation'], 'Aventura portátil de ação com exploração e quebra-cabeças.', true, true, 3, 20),
  ('zelda-phantom-hourglass', 'The Legend of Zelda: Phantom Hourglass', 'The Legend of Zelda', 2007, array['DS'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura de ação com exploração, itens e quebra-cabeças.', true, true, 3, 21),
  ('zelda-spirit-tracks', 'The Legend of Zelda: Spirit Tracks', 'The Legend of Zelda', 2009, array['DS'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura de ação com exploração, itens e quebra-cabeças.', true, true, 3, 22),
  ('zelda-wind-waker', 'The Legend of Zelda: The Wind Waker', 'The Legend of Zelda', 2002, array['GameCube','Wii U'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura marítima de ação com exploração de ilhas e masmorras.', true, true, 5, 22),
  ('zelda-ocarina-of-time', 'The Legend of Zelda: Ocarina of Time', 'The Legend of Zelda', 1998, array['N64','3DS'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura de ação em 3D com exploração e masmorras.', true, true, 5, 23),
  ('zelda-majoras-mask', 'The Legend of Zelda: Majora’s Mask', 'The Legend of Zelda', 2000, array['N64','3DS'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling','time-loop'], array['pc-emulation'], 'Aventura de ação em 3D com exploração e um ciclo temporal.', true, true, 5, 24),
  ('zelda-twilight-princess', 'The Legend of Zelda: Twilight Princess', 'The Legend of Zelda', 2006, array['GameCube','Wii','Wii U'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura de ação em Hyrule com exploração e masmorras.', true, true, 5, 25),
  ('zelda-four-swords-adventures', 'The Legend of Zelda: Four Swords Adventures', 'The Legend of Zelda', 2004, array['GameCube'], array['action-adventure'], array['exploration','puzzle-solving'], array['pc-emulation'], 'Aventura de ação que continua a história da Four Sword.', true, true, 3, 26),
  ('zelda-oracle-of-ages', 'The Legend of Zelda: Oracle of Ages', 'The Legend of Zelda', 2001, array['GBC'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura portátil de ação e quebra-cabeças.', true, true, 3, 25),
  ('zelda-oracle-of-seasons', 'The Legend of Zelda: Oracle of Seasons', 'The Legend of Zelda', 2001, array['GBC'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura portátil de ação e exploração.', true, true, 3, 26),
  ('zelda-links-awakening', 'The Legend of Zelda: Link’s Awakening', 'The Legend of Zelda', 1993, array['GB','GBC','Switch'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation','pc'], 'Aventura de ação portátil com exploração e masmorras.', true, true, 4, 27),
  ('zelda-a-link-between-worlds', 'The Legend of Zelda: A Link Between Worlds', 'The Legend of Zelda', 2013, array['3DS'], array['action-adventure'], array['exploration','puzzle-solving','dungeon-crawling'], array['pc-emulation'], 'Aventura de ação com exploração e uma Hyrule vista de duas formas.', true, true, 4, 29),
  ('zelda-tri-force-heroes', 'The Legend of Zelda: Tri Force Heroes', 'The Legend of Zelda', 2015, array['3DS'], array['action-adventure'], array['puzzle'], array['pc-emulation'], 'Aventura cooperativa de quebra-cabeças no universo de Zelda.', true, true, 3, 30),
  ('zelda-echoes-of-wisdom', 'The Legend of Zelda: Echoes of Wisdom', 'The Legend of Zelda', 2024, array['Switch'], array['action-adventure'], array['exploration','puzzle-solving'], array['pc-emulation'], 'Aventura de exploração e quebra-cabeças protagonizada por Zelda.', true, true, 4, 31),
  ('zelda-the-legend-of-zelda', 'The Legend of Zelda', 'The Legend of Zelda', 1986, array['NES'], array['action-adventure'], array['exploration','dungeon-crawling'], array['pc-emulation'], 'Aventura clássica de exploração e descoberta em Hyrule.', true, true, 4, 32),
  ('zelda-adventure-of-link', 'Zelda II: The Adventure of Link', 'The Legend of Zelda', 1987, array['NES'], array['action-adventure','rpg'], array['exploration','platforming'], array['pc-emulation'], 'Aventura de ação e RPG em uma jornada por Hyrule.', true, true, 3, 33),
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
  ('a-short-hike', 'A Short Hike', 'A Short Hike', 2019, array['PC','Switch','PS4','Xbox One'], array['adventure','simulation'], array['exploration','light-platforming','short-experience'], array['pc'], 'Pequena aventura de exploração em uma ilha aberta.', true, true, 3, 63),
  ('pokemon-yellow', 'Pokémon Yellow Version: Special Pikachu Edition', 'Pokémon', 1998, array['GB'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'Uma versão especial da primeira jornada de Kanto, com Pikachu acompanhando o treinador.', true, true, 4, 70),
  ('pokemon-crystal', 'Pokémon Crystal Version', 'Pokémon', 2000, array['GBC'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'Aventura portátil em Johto com captura de criaturas e batalhas em turnos.', true, true, 4, 71),
  ('pokemon-ruby', 'Pokémon Ruby Version', 'Pokémon', 2002, array['GBA'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'Uma jornada em Hoenn com captura, equipe e batalhas em turnos.', true, true, 4, 72),
  ('pokemon-leafgreen', 'Pokémon LeafGreen Version', 'Pokémon', 2004, array['GBA'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'Uma nova versão da aventura de Kanto para Game Boy Advance.', true, true, 4, 73),
  ('pokemon-diamond', 'Pokémon Diamond Version', 'Pokémon', 2006, array['DS'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'Aventura em Sinnoh com exploração, captura e batalhas por turnos.', true, true, 4, 74),
  ('pokemon-black', 'Pokémon Black Version', 'Pokémon', 2010, array['DS'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'Uma nova região e um elenco de criaturas para conhecer em uma jornada por Unova.', true, true, 4, 75),
  ('pokemon-x', 'Pokémon X', 'Pokémon', 2013, array['3DS'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'Aventura em Kalos com exploração e batalhas em uma perspectiva renovada.', true, true, 4, 76),
  ('pokemon-sun', 'Pokémon Sun', 'Pokémon', 2016, array['3DS'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'Uma jornada por Alola com desafios regionais e criaturas para colecionar.', true, true, 4, 77),
  ('pokemon-sword', 'Pokémon Sword', 'Pokémon', 2019, array['Switch'], array['rpg'], array['creature-collection','turn-based-combat','exploration'], array['pc-emulation'], 'Uma aventura em Galar com exploração, captura e batalhas em turnos.', true, true, 4, 78),
  ('pokemon-legends-arceus', 'Pokémon Legends: Arceus', 'Pokémon', 2022, array['Switch'], array['action-rpg'], array['creature-collection','real-time-capture','exploration'], array['pc-emulation'], 'Uma expedição por uma antiga Sinnoh com exploração e captura mais ativa.', true, true, 5, 79),
  ('pokemon-scarlet', 'Pokémon Scarlet', 'Pokémon', 2022, array['Switch'], array['rpg'], array['creature-collection','turn-based-combat','open-world-exploration'], array['pc-emulation'], 'Uma jornada aberta por Paldea com captura de criaturas e batalhas em turnos.', true, true, 4, 80),
  ('mario-super-mario-bros', 'Super Mario Bros.', 'Super Mario', 1985, array['NES'], array['platformer'], array['precision-platforming','power-ups'], array['pc-emulation'], 'Plataforma clássica de rolagem lateral com fases curtas e segredos.', true, true, 5, 81),
  ('mario-super-mario-bros-3', 'Super Mario Bros. 3', 'Super Mario', 1988, array['NES','GBA'], array['platformer'], array['precision-platforming','power-ups','world-map'], array['pc-emulation'], 'Plataforma 2D com mundos temáticos, habilidades e exploração de fases.', true, true, 5, 82),
  ('mario-super-mario-world', 'Super Mario World', 'Super Mario', 1990, array['SNES','GBA'], array['platformer'], array['precision-platforming','power-ups','world-map'], array['pc-emulation'], 'Aventura de plataforma 2D com caminhos secretos e exploração de fases.', true, true, 5, 83),
  ('mario-super-mario-64', 'Super Mario 64', 'Super Mario', 1996, array['N64','DS'], array['platformer','adventure'], array['3d-platforming','exploration','collectibles'], array['pc-emulation'], 'Plataforma 3D de exploração livre em mundos organizados por objetivos.', true, true, 5, 84),
  ('mario-super-mario-sunshine', 'Super Mario Sunshine', 'Super Mario', 2002, array['GameCube'], array['platformer','adventure'], array['3d-platforming','exploration','collectibles'], array['pc-emulation'], 'Aventura de plataforma 3D em uma ilha com exploração e desafios de movimento.', true, true, 4, 85),
  ('mario-new-super-mario-bros', 'New Super Mario Bros.', 'Super Mario', 2006, array['DS'], array['platformer'], array['precision-platforming','power-ups','collectibles'], array['pc-emulation'], 'Plataforma 2D portátil com fases diretas e habilidades clássicas.', true, true, 4, 86),
  ('mario-super-mario-galaxy', 'Super Mario Galaxy', 'Super Mario', 2007, array['Wii'], array['platformer','adventure'], array['3d-platforming','gravity-mechanics','exploration'], array['pc-emulation'], 'Plataforma 3D com pequenos planetas, gravidade variável e exploração.', true, true, 5, 87),
  ('mario-super-mario-galaxy-2', 'Super Mario Galaxy 2', 'Super Mario', 2010, array['Wii'], array['platformer','adventure'], array['3d-platforming','gravity-mechanics','exploration'], array['pc-emulation'], 'Plataforma 3D com fases inventivas, gravidade variável e novos desafios.', true, true, 5, 88),
  ('mario-super-mario-3d-land', 'Super Mario 3D Land', 'Super Mario', 2011, array['3DS'], array['platformer'], array['3d-platforming','precision-platforming','power-ups'], array['pc-emulation'], 'Plataforma 3D portátil com fases compactas e foco em movimento preciso.', true, true, 4, 89),
  ('mario-super-mario-3d-world', 'Super Mario 3D World', 'Super Mario', 2013, array['Wii U','Switch'], array['platformer'], array['3d-platforming','co-op','power-ups'], array['pc-emulation'], 'Plataforma 3D com fases em grupo, exploração e cooperação local.', true, true, 4, 90),
  ('mario-super-mario-odyssey', 'Super Mario Odyssey', 'Super Mario', 2017, array['Switch'], array['platformer','adventure'], array['3d-platforming','exploration','collectibles'], array['pc-emulation'], 'Aventura de plataforma 3D com exploração aberta e habilidades de captura.', true, true, 5, 91),
  ('paper-mario-thousand-year-door', 'Paper Mario: The Thousand-Year Door', 'Paper Mario', 2004, array['GameCube','Switch'], array['rpg','adventure'], array['turn-based-combat','timed-actions','exploration'], array['pc-emulation'], 'RPG de aventura com combate por turnos, personagens marcantes e exploração.', true, true, 5, 92),
  ('kirby-adventure', 'Kirby’s Adventure', 'Kirby', 1993, array['NES','GBA'], array['platformer'], array['ability-copy','precision-platforming','exploration'], array['pc-emulation'], 'Plataforma colorida com habilidades copiadas e fases de exploração lateral.', true, true, 4, 93),
  ('kirby-super-star-ultra', 'Kirby Super Star Ultra', 'Kirby', 2008, array['DS'], array['platformer','action-adventure'], array['ability-copy','co-op','short-experiences'], array['pc-emulation'], 'Uma coleção de aventuras de plataforma com habilidades e modos variados.', true, true, 4, 94),
  ('kirby-squeak-squad', 'Kirby: Squeak Squad', 'Kirby', 2006, array['DS'], array['platformer'], array['ability-copy','exploration','collectibles'], array['pc-emulation'], 'Plataforma portátil com habilidades copiadas e exploração de fases.', true, true, 3, 95),
  ('kirby-return-to-dream-land', 'Kirby’s Return to Dream Land', 'Kirby', 2011, array['Wii','Switch'], array['platformer'], array['ability-copy','co-op','precision-platforming'], array['pc-emulation'], 'Aventura de plataforma cooperativa com habilidades e fases coloridas.', true, true, 4, 96),
  ('kirby-planet-robobot', 'Kirby: Planet Robobot', 'Kirby', 2016, array['3DS'], array['platformer','action-adventure'], array['ability-copy','exploration','mech-suit'], array['pc-emulation'], 'Plataforma portátil que combina habilidades copiadas e uma armadura mecânica.', true, true, 4, 97),
  ('kirby-epic-yarn', 'Kirby’s Epic Yarn', 'Kirby', 2010, array['Wii'], array['platformer'], array['light-platforming','crafting','co-op'], array['pc-emulation'], 'Plataforma acolhedora com fases feitas de tecido e transformação de formas.', true, true, 3, 98),
  ('yoshis-island', 'Super Mario World 2: Yoshi’s Island', 'Yoshi', 1995, array['SNES','GBA'], array['platformer'], array['precision-platforming','exploration','collectibles'], array['pc-emulation'], 'Aventura de plataforma com exploração de fases e habilidades de Yoshi.', true, true, 5, 99),
  ('donkey-kong-country', 'Donkey Kong Country', 'Donkey Kong', 1994, array['SNES','GBA'], array['platformer'], array['precision-platforming','co-op','collectibles'], array['pc-emulation'], 'Plataforma 2D de ritmo ágil com exploração e segredos nas fases.', true, true, 5, 100),
  ('f-zero-gx', 'F-Zero GX', 'F-Zero', 2003, array['GameCube'], array['racing'], array['high-speed-racing','time-trial','precision-control'], array['pc-emulation'], 'Corrida futurista veloz com pistas técnicas e veículos antigravidade.', true, true, 4, 101),
  ('luigis-mansion', 'Luigi’s Mansion', 'Luigi’s Mansion', 2001, array['GameCube','3DS'], array['action-adventure'], array['exploration','puzzle-solving','ghost-catching'], array['pc-emulation'], 'Aventura de exploração em uma mansão com quebra-cabeças e fantasmas.', true, true, 4, 102),
  ('animal-crossing-wild-world', 'Animal Crossing: Wild World', 'Animal Crossing', 2005, array['DS'], array['simulation','life-sim'], array['relationships','customization','collecting'], array['pc-emulation'], 'Simulação de vida em uma vila com atividades cotidianas e relações com vizinhos.', true, true, 4, 103),
  ('pikmin', 'Pikmin', 'Pikmin', 2001, array['GameCube','Wii'], array['strategy','adventure'], array['real-time-strategy','exploration','resource-management'], array['pc-emulation'], 'Estratégia em tempo real com exploração, criaturas companheiras e gestão de tempo.', true, true, 5, 104),
  ('chibi-robo', 'Chibi-Robo!', 'Chibi-Robo!', 2005, array['GameCube'], array['adventure','simulation'], array['exploration','helping-others','collectibles'], array['pc-emulation'], 'Aventura de exploração em miniatura sobre ajudar uma família e cuidar da casa.', true, true, 3, 105),
  ('warioware-mega-microgames', 'WarioWare, Inc.: Mega Microgame$!', 'WarioWare', 2003, array['GBA'], array['action','party'], array['short-experiences','reflexes','score-chasing'], array['pc-emulation'], 'Coleção de microjogos rápidos que mudam de desafio em poucos segundos.', true, true, 4, 106),
  ('rhythm-heaven', 'Rhythm Heaven', 'Rhythm Heaven', 2008, array['DS'], array['rhythm','music'], array['rhythm-timing','reflexes','short-experiences'], array['pc-emulation'], 'Desafios musicais curtos guiados pelo ritmo, pela escuta e pelo tempo certo.', true, true, 4, 107),
  ('phoenix-wright-ace-attorney', 'Phoenix Wright: Ace Attorney', 'Ace Attorney', 2001, array['GBA','DS'], array['adventure','visual-novel'], array['investigation','deduction','dialogue-choices'], array['pc-emulation'], 'Aventura investigativa de tribunal baseada em reunir pistas e argumentar.', true, true, 5, 108),
  ('professor-layton-curious-village', 'Professor Layton and the Curious Village', 'Professor Layton', 2007, array['DS'], array['adventure','puzzle'], array['logic-puzzles','investigation','exploration'], array['pc-emulation'], 'Aventura de investigação que combina exploração e uma coleção de enigmas.', true, true, 4, 109),
  ('wario-land-shake-it', 'Wario Land: Shake It!', 'Wario Land', 2008, array['Wii'], array['platformer'], array['exploration','collectibles','time-limit'], array['pc-emulation'], 'Plataforma 2D com exploração de fases, tesouros e desafios de tempo.', true, true, 3, 110),
  ('punch-out-wii', 'Punch-Out!!', 'Punch-Out!!', 2009, array['Wii'], array['sports','fighting'], array['pattern-recognition','reflexes','boss-fights'], array['pc-emulation'], 'Boxe arcade baseado em observar padrões e reagir no momento certo.', true, true, 4, 111),
  ('super-smash-bros-melee', 'Super Smash Bros. Melee', 'Super Smash Bros.', 2001, array['GameCube'], array['fighting','party'], array['local-multiplayer','reflexes','competitive-play'], array['pc-emulation'], 'Luta de arena com personagens variados e foco em partidas locais.', true, true, 4, 112),
  ('mario-kart-double-dash', 'Mario Kart: Double Dash!!', 'Mario Kart', 2003, array['GameCube'], array['racing','party'], array['local-multiplayer','item-racing','team-play'], array['pc-emulation'], 'Corrida arcade com itens, pistas variadas e duplas de personagens.', true, true, 4, 113),
  ('okami', 'Ōkami', 'Ōkami', 2006, array['PS2','Wii','PC','PS4','Switch'], array['action-adventure'], array['exploration','puzzle-solving','brush-mechanics'], array['pc','pc-emulation'], 'Aventura de ação inspirada em mitos japoneses com exploração e pintura interativa.', true, true, 5, 114),
  ('sin-and-punishment-star-successor', 'Sin & Punishment: Star Successor', 'Sin & Punishment', 2009, array['Wii'], array['shooter'], array['rail-shooter','reflexes','boss-fights'], array['pc-emulation'], 'Ação de tiro em trilhos com movimento rápido, esquivas e batalhas contra chefes.', true, true, 3, 115),
  ('excitebots-trick-racing', 'Excitebots: Trick Racing', 'Excite', 2009, array['Wii'], array['racing'], array['stunt-racing','high-speed-racing','score-chasing'], array['pc-emulation'], 'Corrida arcade com manobras, obstáculos e desafios de pontuação.', true, true, 3, 116),
  ('wii-sports', 'Wii Sports', 'Wii Sports', 2006, array['Wii'], array['sports','party'], array['motion-controls','local-multiplayer','short-experiences'], array['pc-emulation'], 'Coleção de esportes acessíveis pensada para partidas curtas e multiplayer local.', true, true, 4, 117),
  ('wii-fit', 'Wii Fit', 'Wii Fit', 2007, array['Wii'], array['sports','simulation'], array['motion-controls','balance','daily-routine'], array['pc-emulation'], 'Atividades de equilíbrio e movimento organizadas em sessões curtas.', true, true, 2, 118),
  ('nintendogs', 'Nintendogs', 'Nintendogs', 2005, array['DS'], array['simulation','life-sim'], array['pet-care','training','daily-routine'], array['pc-emulation'], 'Simulação portátil de cuidar, treinar e brincar com cães.', true, true, 3, 119),
  ('super-monkey-ball', 'Super Monkey Ball', 'Super Monkey Ball', 2001, array['GameCube'], array['platformer','party'], array['physics-puzzles','precision-control','time-trial'], array['pc-emulation'], 'Desafios de habilidade em que se guia uma esfera por pistas suspensas.', true, true, 4, 120),
  ('pilotwings-64', 'Pilotwings 64', 'Pilotwings', 1996, array['N64'], array['simulation','adventure'], array['flight-simulation','precision-control','score-chasing'], array['pc-emulation'], 'Desafios de voo e manobras com diferentes veículos e objetivos.', true, true, 3, 121),
  ('hades', 'Hades', 'Hades', 2020, array['PC','Switch','PS4','Xbox One'], array['action-rpg','roguelike'], array['dungeon-crawling','builds','repeated-runs'], array['pc'], 'Ação roguelike com combates rápidos, progressão entre tentativas e narrativa reativa.', true, true, 5, 122),
  ('dead-cells', 'Dead Cells', 'Dead Cells', 2018, array['PC','Android','iOS','Switch','PS4','Xbox One'], array['action','roguelike'], array['metroidvania','builds','precision-combat'], array['pc','android'], 'Ação roguelike com exploração de áreas interligadas e combate preciso.', true, true, 5, 123),
  ('slay-the-spire', 'Slay the Spire', 'Slay the Spire', 2019, array['PC','Android','iOS','Switch'], array['strategy','roguelike'], array['deck-building','turn-based-combat','repeated-runs'], array['pc','android'], 'Estratégia de construção de baralho em jornadas curtas com escolhas de rota.', true, true, 5, 124),
  ('into-the-breach', 'Into the Breach', 'Into the Breach', 2018, array['PC','Switch','Android','iOS'], array['strategy','tactics'], array['grid-tactics','turn-based-combat','short-experiences'], array['pc','android'], 'Estratégia tática por turnos em mapas pequenos com informação clara sobre ameaças.', true, true, 5, 125),
  ('undertale', 'Undertale', 'Undertale', 2015, array['PC','PS4','Switch'], array['rpg'], array['turn-based-combat','dialogue-choices','character-driven'], array['pc'], 'RPG narrativo com escolhas, personagens singulares e batalhas pouco convencionais.', true, true, 5, 126),
  ('cuphead', 'Cuphead', 'Cuphead', 2017, array['PC','Switch','PS4','Xbox One'], array['platformer','run-and-gun'], array['boss-fights','precision-platforming','pattern-recognition'], array['pc'], 'Ação e plataforma com animação clássica e chefes que exigem aprender padrões.', true, true, 4, 127),
  ('shovel-knight-treasure-trove', 'Shovel Knight: Treasure Trove', 'Shovel Knight', 2019, array['PC','Wii U','3DS','Switch','PS4','Xbox One'], array['platformer','action-adventure'], array['precision-platforming','boss-fights','collectibles'], array['pc','pc-emulation'], 'Aventura de plataforma retrô com fases, chefes e campanhas de ação.', true, true, 4, 128),
  ('ori-and-the-blind-forest', 'Ori and the Blind Forest', 'Ori', 2015, array['PC','Xbox One','Switch'], array['platformer','action-adventure'], array['metroidvania','precision-platforming','exploration'], array['pc'], 'Plataforma de exploração com movimento preciso e um mundo interligado.', true, true, 5, 129),
  ('gris', 'GRIS', 'GRIS', 2018, array['PC','Switch','PS4','Android','iOS'], array['platformer','adventure'], array['light-platforming','visual-storytelling','exploration'], array['pc','android'], 'Aventura visual de plataforma com desafios leves e exploração contemplativa.', true, true, 4, 130),
  ('limbo', 'LIMBO', 'LIMBO', 2010, array['PC','Xbox 360','PS3','Switch','Android','iOS'], array['platformer','puzzle'], array['physics-puzzles','precision-platforming','environmental-storytelling'], array['pc','android'], 'Plataforma de quebra-cabeças em um mundo monocromático e silencioso.', true, true, 4, 131),
  ('inside', 'INSIDE', 'INSIDE', 2016, array['PC','PS4','Xbox One','Switch','iOS'], array['platformer','puzzle'], array['physics-puzzles','environmental-storytelling','stealth'], array['pc'], 'Aventura de plataforma e quebra-cabeças contada por cenário e movimento.', true, true, 5, 132),
  ('fez', 'FEZ', 'FEZ', 2012, array['PC','Xbox 360','PS4','PS Vita'], array['platformer','puzzle'], array['spatial-reasoning','exploration','perspective-shifting'], array['pc'], 'Quebra-cabeças de plataforma em que girar o mundo revela novos caminhos.', true, true, 4, 133),
  ('braid', 'Braid', 'Braid', 2008, array['PC','Xbox 360','PS3'], array['platformer','puzzle'], array['time-manipulation','logic-puzzles','precision-platforming'], array['pc'], 'Plataforma de quebra-cabeças que usa manipulação do tempo para abrir caminhos.', true, true, 4, 134),
  ('the-witness', 'The Witness', 'The Witness', 2016, array['PC','PS4','Xbox One','iOS'], array['puzzle','adventure'], array['logic-puzzles','observation','open-world-exploration'], array['pc'], 'Ilha aberta de quebra-cabeças que ensina suas regras por observação.', true, true, 5, 135),
  ('firewatch', 'Firewatch', 'Firewatch', 2016, array['PC','PS4','Xbox One','Switch'], array['adventure'], array['exploration','dialogue-choices','environmental-storytelling'], array['pc'], 'Aventura narrativa de exploração em uma floresta com conversas por rádio.', true, true, 4, 136),
  ('outer-wilds', 'Outer Wilds', 'Outer Wilds', 2019, array['PC','PS4','Xbox One','Switch'], array['adventure','puzzle'], array['exploration','time-loop','deduction'], array['pc'], 'Exploração espacial guiada por curiosidade, descobertas e um ciclo temporal.', true, true, 5, 137),
  ('return-of-the-obra-dinn', 'Return of the Obra Dinn', 'Return of the Obra Dinn', 2018, array['PC','Switch','PS4','Xbox One'], array['adventure','puzzle'], array['deduction','investigation','observation'], array['pc'], 'Investigação em primeira pessoa que pede deduzir o destino da tripulação.', true, true, 5, 138),
  ('papers-please', 'Papers, Please', 'Papers, Please', 2013, array['PC','iOS','Android'], array['simulation','puzzle'], array['document-inspection','time-management','moral-choices'], array['pc','android'], 'Simulação de inspeção de documentos com decisões difíceis e tempo limitado.', true, true, 4, 139),
  ('vampire-survivors', 'Vampire Survivors', 'Vampire Survivors', 2022, array['PC','Android','iOS','Switch'], array['action','roguelike'], array['auto-attacks','builds','survival'], array['pc','android'], 'Ação de sobrevivência em partidas curtas com combinações de armas e melhorias.', true, true, 4, 140),
  ('balatro', 'Balatro', 'Balatro', 2024, array['PC','Switch','PS4','PS5','Xbox One','Android','iOS'], array['strategy','card-game'], array['deck-building','combo-building','score-chasing'], array['pc','android'], 'Jogo de cartas e pontuação que combina pôquer com construções roguelike.', true, true, 5, 141),
  ('dredge', 'DREDGE', 'DREDGE', 2023, array['PC','Switch','PS4','PS5','Xbox One'], array['adventure','simulation'], array['fishing','exploration','inventory-management'], array['pc'], 'Aventura de pesca e exploração com mistérios em um arquipélago isolado.', true, true, 4, 142),
  ('unpacking', 'Unpacking', 'Unpacking', 2021, array['PC','Switch','PS4','Xbox One','Android','iOS'], array['puzzle','simulation'], array['spatial-reasoning','organization','visual-storytelling'], array['pc','android'], 'Quebra-cabeças calmo sobre organizar pertences ao longo de várias mudanças.', true, true, 4, 143),
  ('disco-elysium', 'Disco Elysium', 'Disco Elysium', 2019, array['PC','PS4','PS5','Xbox One','Switch'], array['rpg','adventure'], array['dialogue-choices','investigation','character-building'], array['pc'], 'RPG investigativo guiado por diálogo, escolhas e desenvolvimento de personagem.', true, true, 5, 144),
  ('crosscode', 'CrossCode', 'CrossCode', 2018, array['PC','PS4','Xbox One','Switch'], array['action-rpg'], array['puzzle-solving','dungeon-crawling','real-time-combat'], array['pc'], 'RPG de ação com combate em tempo real, masmorras e quebra-cabeças.', true, true, 4, 145),
  ('chants-of-sennaar', 'Chants of Sennaar', 'Chants of Sennaar', 2023, array['PC','Switch','PS4','Xbox One'], array['adventure','puzzle'], array['language-decoding','observation','deduction'], array['pc'], 'Aventura de quebra-cabeças sobre decifrar idiomas e compreender povos diferentes.', true, true, 4, 146),
  ('tactical-breach-wizards', 'Tactical Breach Wizards', 'Tactical Breach Wizards', 2024, array['PC'], array['strategy','tactics'], array['grid-tactics','turn-based-combat','rewind-mechanics'], array['pc'], 'Estratégia tática por turnos com feitiços, planejamento e possibilidade de rever ações.', true, true, 4, 147),
  ('what-remains-of-edith-finch', 'What Remains of Edith Finch', 'What Remains of Edith Finch', 2017, array['PC','PS4','Xbox One','Switch'], array['adventure'], array['exploration','environmental-storytelling','short-experience'], array['pc'], 'Aventura narrativa curta que revela histórias de uma família ao explorar sua casa.', true, true, 4, 148),
  ('katana-zero', 'Katana ZERO', 'Katana ZERO', 2019, array['PC','Switch'], array['action','platformer'], array['precision-combat','time-manipulation','stealth'], array['pc'], 'Ação de plataforma em fases curtas com combate preciso e manipulação do tempo.', true, true, 4, 149)
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

-- A cronologia oficial de Zelda tem três ramificações depois de Ocarina of Time.
-- Os pré-requisitos impedem sugestões adiantadas e deixam cada caminho independente.
update public.atlas_games set
  series_key = 'zelda', series_path = 'common', series_order = 1, series_requires = '{}'::text[]
where id = 'zelda-skyward-sword';

update public.atlas_games set
  series_key = 'zelda', series_path = 'common', series_order = 2,
  series_requires = array['zelda-skyward-sword']::text[]
where id = 'zelda-minish-cap';

update public.atlas_games set
  series_key = 'zelda', series_path = 'common', series_order = 3,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap']::text[]
where id = 'zelda-four-swords';

update public.atlas_games set
  series_key = 'zelda', series_path = 'common', series_order = 4,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords']::text[]
where id = 'zelda-ocarina-of-time';

update public.atlas_games set
  series_key = 'zelda', series_path = 'fallen', series_order = 1,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time']::text[]
where id = 'zelda-a-link-to-the-past';

update public.atlas_games set
  series_key = 'zelda', series_path = 'fallen', series_order = 2,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time','zelda-a-link-to-the-past']::text[]
where id = 'zelda-links-awakening';

update public.atlas_games set
  series_key = 'zelda', series_path = 'fallen', series_order = 3,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time','zelda-a-link-to-the-past','zelda-links-awakening']::text[]
where id in ('zelda-oracle-of-ages','zelda-oracle-of-seasons');

update public.atlas_games set
  series_key = 'zelda', series_path = 'fallen', series_order = 4,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time','zelda-a-link-to-the-past','zelda-links-awakening','zelda-oracle-of-ages','zelda-oracle-of-seasons']::text[]
where id = 'zelda-a-link-between-worlds';

update public.atlas_games set
  series_key = 'zelda', series_path = 'fallen', series_order = 5,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time','zelda-a-link-to-the-past','zelda-links-awakening','zelda-oracle-of-ages','zelda-oracle-of-seasons','zelda-a-link-between-worlds']::text[]
where id = 'zelda-tri-force-heroes';

update public.atlas_games set
  series_key = 'zelda', series_path = 'fallen', series_order = 6,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time','zelda-a-link-to-the-past','zelda-links-awakening','zelda-oracle-of-ages','zelda-oracle-of-seasons','zelda-a-link-between-worlds','zelda-tri-force-heroes']::text[]
where id = 'zelda-echoes-of-wisdom';

update public.atlas_games set
  series_key = 'zelda', series_path = 'fallen', series_order = 7,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time','zelda-a-link-to-the-past','zelda-links-awakening','zelda-oracle-of-ages','zelda-oracle-of-seasons','zelda-a-link-between-worlds','zelda-tri-force-heroes','zelda-echoes-of-wisdom']::text[]
where id = 'zelda-the-legend-of-zelda';

update public.atlas_games set
  series_key = 'zelda', series_path = 'fallen', series_order = 8,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time','zelda-a-link-to-the-past','zelda-links-awakening','zelda-oracle-of-ages','zelda-oracle-of-seasons','zelda-a-link-between-worlds','zelda-tri-force-heroes','zelda-echoes-of-wisdom','zelda-the-legend-of-zelda']::text[]
where id = 'zelda-adventure-of-link';

update public.atlas_games set
  series_key = 'zelda', series_path = 'child', series_order = 1,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time']::text[]
where id = 'zelda-majoras-mask';

update public.atlas_games set
  series_key = 'zelda', series_path = 'child', series_order = 2,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time','zelda-majoras-mask']::text[]
where id = 'zelda-twilight-princess';

update public.atlas_games set
  series_key = 'zelda', series_path = 'child', series_order = 3,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time','zelda-majoras-mask','zelda-twilight-princess']::text[]
where id = 'zelda-four-swords-adventures';

update public.atlas_games set
  series_key = 'zelda', series_path = 'adult', series_order = 1,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time']::text[]
where id = 'zelda-wind-waker';

update public.atlas_games set
  series_key = 'zelda', series_path = 'adult', series_order = 2,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time','zelda-wind-waker']::text[]
where id = 'zelda-phantom-hourglass';

update public.atlas_games set
  series_key = 'zelda', series_path = 'adult', series_order = 3,
  series_requires = array['zelda-skyward-sword','zelda-minish-cap','zelda-four-swords','zelda-ocarina-of-time','zelda-wind-waker','zelda-phantom-hourglass']::text[]
where id = 'zelda-spirit-tracks';
