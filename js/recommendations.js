(() => {
  const tagLabels = Object.freeze({
    'rpg': 'RPG',
    'action-adventure': 'aventura de ação',
    'platformer': 'plataforma',
    'sandbox': 'sandbox',
    'survival': 'sobrevivência',
    'simulation': 'simulação',
    'strategy': 'estratégia',
    'puzzle': 'quebra-cabeças',
    'first-person': 'primeira pessoa',
    'creature-collection': 'coleção de criaturas',
    'turn-based-combat': 'combate em turnos',
    'exploration': 'exploração',
    'puzzle-solving': 'quebra-cabeças',
    'dungeon-crawling': 'masmorras',
    'time-loop': 'ciclo temporal',
    'ability-copy': 'habilidades copiadas',
    'connected-world': 'mundo interligado',
    'building': 'construção',
    'crafting': 'criação de itens',
    'boss-fights': 'chefes',
    'farming': 'cultivo',
    'relationships': 'relações entre personagens',
    'party-building': 'montagem de equipe',
    'elemental-puzzles': 'quebra-cabeças elementais',
    'timed-actions': 'comandos no tempo certo',
    'ability-unlocks': 'habilidades que abrem caminhos',
    'grid-tactics': 'estratégia em grade',
    'time-limit': 'desafios de tempo',
    'time-travel': 'viagens no tempo',
    'physics-puzzles': 'quebra-cabeças de física',
    'spatial-reasoning': 'raciocínio espacial',
    'precision-platforming': 'plataforma de precisão',
    'accessibility-options': 'opções de acessibilidade',
    'light-platforming': 'plataforma leve',
    'short-experience': 'experiência curta',
  });

  const signalWeight = Object.freeze({ played: 0.3, liked: 1, favorite: 1.5 });
  const negativeSignalWeight = 1.25;
  const emulationPlatformTiers = new Map([
    ['gb', 1], ['game boy', 1], ['gbc', 1], ['game boy color', 1],
    ['gba', 1], ['game boy advance', 1], ['nes', 1], ['nintendo entertainment system', 1],
    ['snes', 1], ['super nintendo', 1], ['super nintendo entertainment system', 1],
    ['ds', 1], ['nds', 1], ['nintendo ds', 1],
    ['n64', 2], ['nintendo 64', 2], ['ps1', 2], ['psx', 2], ['playstation', 2],
    ['playstation 1', 2], ['gamecube', 2], ['game cube', 2], ['nintendo gamecube', 2], ['gc', 2],
    ['ps2', 2], ['playstation 2', 2], ['dreamcast', 2], ['psp', 2], ['playstation portable', 2],
    ['wii', 3], ['nintendo wii', 3], ['3ds', 3], ['nintendo 3ds', 3],
    ['wii u', 4], ['wiiu', 4], ['switch', 4], ['nintendo switch', 4],
    ['ps3', 4], ['playstation 3', 4], ['xbox 360', 4],
  ]);

  function overlapCount(left = [], right = []) {
    const rightSet = new Set(right);
    return left.filter((value) => rightSet.has(value)).length;
  }

  function formatTag(tag) {
    return tagLabels[tag] || tag.replaceAll('-', ' ');
  }

  function normalizePlatformName(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('en')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function getEmulationTier(game) {
    const explicitTier = Number(game.emulation_tier);
    if (Number.isInteger(explicitTier) && explicitTier >= 1 && explicitTier <= 4) return explicitTier;
    const platforms = Array.isArray(game.platforms) ? game.platforms : [];
    if (!platforms.length) return 4;
    return Math.min(...platforms.map((platform) => emulationPlatformTiers.get(normalizePlatformName(platform)) || 4));
  }

  function isZeldaGame(game) {
    const name = `${game.franchise || ''} ${game.title || ''}`
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('en');
    return name.includes('zelda');
  }

  function getKnownGameIds(profile, progress) {
    const knownIds = new Set(
      (profile.gameSignals || [])
        .filter(({ status }) => ['played', 'liked', 'favorite', 'disliked'].includes(status))
        .map(({ gameId }) => gameId),
    );
    for (const milestone of progress?.completedMilestones || []) {
      const gameId = typeof milestone === 'string' ? milestone : milestone?.gameId;
      if (gameId) knownIds.add(gameId);
    }
    if (progress?.currentMilestone?.status === 'completed' && progress.currentMilestone.gameId) {
      knownIds.add(progress.currentMilestone.gameId);
    }
    return knownIds;
  }

  function getSeriesPathLocks(games, profile, progress) {
    const locks = { ...(profile.seriesPaths || {}) };
    const gamesById = new Map(games.map((game) => [game.id, game]));
    const observedPaths = new Map();
    const observedIds = [
      ...(profile.gameSignals || []).map(({ gameId }) => gameId),
      ...(progress?.completedMilestones || []).map((milestone) => typeof milestone === 'string' ? milestone : milestone?.gameId),
      progress?.currentMilestone?.gameId,
    ].filter(Boolean);

    for (const gameId of observedIds) {
      const game = gamesById.get(gameId);
      if (!game?.series_key || !game.series_path || game.series_path === 'common') continue;
      if (!observedPaths.has(game.series_key)) observedPaths.set(game.series_key, new Set());
      observedPaths.get(game.series_key).add(game.series_path);
    }

    for (const [seriesKey, paths] of observedPaths) {
      if (!locks[seriesKey] && paths.size === 1) locks[seriesKey] = [...paths][0];
    }
    return locks;
  }

  function followsSeriesOrder(game, knownIds, gamesById, profile, seriesPathLocks) {
    const seriesOrder = game.series_order;
    const hasSequence = Boolean(game.series_key) && seriesOrder !== null && seriesOrder !== undefined &&
      Number.isInteger(Number(seriesOrder)) && Number(seriesOrder) >= 1;
    const validZeldaPath = ['common', 'fallen', 'child', 'adult'].includes(game.series_path);
    if (isZeldaGame(game) && (!hasSequence || game.series_key !== 'zelda' || !validZeldaPath)) return false;
    if (game.series_key && !hasSequence) return false;
    const lockedPath = seriesPathLocks[game.series_key];
    if (lockedPath && game.series_path && game.series_path !== 'common' && game.series_path !== lockedPath) return false;
    return (game.series_requires || []).every((requiredGameId) => {
      const requiredGame = gamesById.get(requiredGameId);
      if (!requiredGame) return false;
      if (!canAccess(requiredGame, profile)) return true;
      return knownIds.has(requiredGameId);
    });
  }

  function keepSeriesFrontier(options, ratings, replayAllowed) {
    const seriesGroups = new Map();
    for (const game of options) {
      if (!game.series_key) continue;
      const groupKey = `${game.series_key}:${game.series_path || 'main'}`;
      if (!seriesGroups.has(groupKey)) seriesGroups.set(groupKey, []);
      seriesGroups.get(groupKey).push(game);
    }

    const nextIds = new Set();
    for (const games of seriesGroups.values()) {
      const unplayed = games.filter((game) => !ratings.has(game.id));
      const frontier = unplayed.length
        ? unplayed
        : replayAllowed ? games : [];
      if (!frontier.length) continue;
      const nextOrder = Math.min(...frontier.map((game) => Number(game.series_order)));
      for (const game of frontier) {
        if (Number(game.series_order) === nextOrder) nextIds.add(game.id);
      }
    }

    return options.filter((game) => !game.series_key || nextIds.has(game.id));
  }

  function canAccess(game, profile) {
    const selectedContexts = profile.playContexts || [];
    const gameContexts = game.play_contexts || [];
    if (!selectedContexts.length) return true;
    if (!gameContexts.length) return false;
    const maxEmulationTier = Number(profile.maxEmulationTier) || 0;
    return gameContexts.some((context) =>
      selectedContexts.includes(context) &&
      (context !== 'pc-emulation' || getEmulationTier(game) <= maxEmulationTier)
    );
  }

  function isGameEligible(games, gameId, profile = {}, progress = {}) {
    const ratings = new Map((profile.gameSignals || []).map(({ gameId: ratedGameId, status }) => [ratedGameId, status]));
    const knownIds = getKnownGameIds(profile, progress);
    const seriesPathLocks = getSeriesPathLocks(games, profile, progress);
    const gamesById = new Map(games.map((candidate) => [candidate.id, candidate]));
    const eligible = keepSeriesFrontier(games.filter((game) =>
      game.is_recommendation_candidate &&
      ratings.get(game.id) !== 'disliked' &&
      (profile.replayAllowed === true || !ratings.has(game.id)) &&
      canAccess(game, profile) &&
      followsSeriesOrder(game, knownIds, gamesById, profile, seriesPathLocks)
    ), ratings, profile.replayAllowed === true);
    return eligible.some((game) => game.id === gameId);
  }

  function makeReason(candidate, gamesById, profile, candidateStatus, sharedTags, knownIds) {
    if (candidateStatus === 'favorite') {
      return 'Você marcou este jogo como favorito e deixou aberta a possibilidade de rejogar.';
    }
    if (candidateStatus === 'liked') {
      return 'Você contou que gostou deste jogo; ele pode ser um bom ponto de partida para a Jornada.';
    }
    if (candidateStatus === 'played' && profile.replayAllowed === true) {
      return 'Você já conhece este jogo e deixou aberta a possibilidade de rejogar.';
    }

    if (candidate.series_key === 'zelda') {
      const previousGames = (candidate.series_requires || [])
        .map((gameId) => gamesById.get(gameId))
        .filter((game) => game && knownIds.has(game.id) && canAccess(game, profile));
      const previousGame = previousGames[previousGames.length - 1];
      if (previousGame) return `Segue a cronologia oficial de Zelda depois de ${previousGame.title}.`;
      return 'Abre o caminho cronológico de Zelda com um título compatível com seu acesso.';
    }

    const signals = (profile.gameSignals || [])
      .filter((signal) => ['liked', 'favorite'].includes(signal.status))
      .map((signal) => ({ ...signal, game: gamesById.get(signal.gameId) }))
      .filter((signal) => signal.game);

    const sameFranchise = signals.find((signal) =>
      signal.game.franchise && signal.game.franchise === candidate.franchise
    );
    if (sameFranchise) {
      return `Continua por uma franquia que você curte: ${candidate.franchise}.`;
    }

    if (sharedTags.length) {
      return `Conecta com ${signals[0]?.game.title || 'seus interesses'} por ${formatTag(sharedTags[0])}.`;
    }

    if (candidate.genre_tags?.length) {
      return `É uma porta de entrada curada para explorar ${formatTag(candidate.genre_tags[0])}.`;
    }
    return 'É uma experiência curada para ampliar seu repertório.';
  }

  function recommendFirstGame(games, profile = {}, excludedIds = [], progress = {}) {
    const candidateGames = games.filter((game) => game.is_recommendation_candidate);
    const gamesById = new Map(games.map((game) => [game.id, game]));
    const ratings = new Map((profile.gameSignals || []).map(({ gameId, status }) => [gameId, status]));
    const knownIds = getKnownGameIds(profile, progress);
    const seriesPathLocks = getSeriesPathLocks(games, profile, progress);
    const isEligible = (game) =>
      ratings.get(game.id) !== 'disliked' &&
      (profile.replayAllowed === true || !ratings.has(game.id)) &&
      canAccess(game, profile) &&
      followsSeriesOrder(game, knownIds, gamesById, profile, seriesPathLocks);

    let options = candidateGames.filter((game) =>
      !excludedIds.includes(game.id) && isEligible(game)
    );

    if (!options.length && excludedIds.length) {
      options = candidateGames.filter(isEligible);
    }
    options = keepSeriesFrontier(options, ratings, profile.replayAllowed === true);
    if (!options.length) return null;

    const positiveSignals = (profile.gameSignals || [])
      .filter(({ status }) => ['liked', 'favorite'].includes(status))
      .map((signal) => ({ ...signal, game: gamesById.get(signal.gameId) }))
      .filter((signal) => signal.game);
    const negativeSignals = (profile.gameSignals || [])
      .filter(({ status }) => status === 'disliked')
      .map((signal) => ({ ...signal, game: gamesById.get(signal.gameId) }))
      .filter((signal) => signal.game);

    const ranked = options.map((game) => {
      const status = ratings.get(game.id);
      const sharedTags = new Set();
      let similarity = 0;

      for (const signal of positiveSignals) {
        const weight = signalWeight[signal.status] || 0;
        const sharedGenres = overlapCount(game.genre_tags, signal.game.genre_tags);
        const sharedMechanics = overlapCount(game.mechanic_tags, signal.game.mechanic_tags);
        const sharedThemes = overlapCount(game.theme_tags, signal.game.theme_tags);
        const sameFranchise = game.franchise && game.franchise === signal.game.franchise;

        similarity += (sameFranchise ? 2.5 : 0) * weight;
        similarity += Math.min(sharedGenres, 2) * 1.1 * weight;
        similarity += Math.min(sharedMechanics, 3) * 0.65 * weight;
        similarity += Math.min(sharedThemes, 2) * 0.55 * weight;

        const gameTags = [...(game.genre_tags || []), ...(game.mechanic_tags || []), ...(game.theme_tags || [])];
        const signalTags = [...(signal.game.genre_tags || []), ...(signal.game.mechanic_tags || []), ...(signal.game.theme_tags || [])];
        for (const tag of gameTags) {
          if (signalTags.includes(tag)) {
            sharedTags.add(tag);
          }
        }
      }

      for (const signal of negativeSignals) {
        const sameFranchise = game.franchise && game.franchise === signal.game.franchise;
        const sharedGenres = overlapCount(game.genre_tags, signal.game.genre_tags);
        const sharedMechanics = overlapCount(game.mechanic_tags, signal.game.mechanic_tags);
        const sharedThemes = overlapCount(game.theme_tags, signal.game.theme_tags);
        similarity -= negativeSignalWeight * (
          (sameFranchise ? 2.5 : 0) +
          Math.min(sharedGenres, 2) * 1.1 +
          Math.min(sharedMechanics, 3) * 0.65 +
          Math.min(sharedThemes, 2) * 0.55
        );
      }

      const replayBonus = status === 'favorite' ? 2.4 : status === 'liked' ? 1.7 : status === 'played' ? 0.35 : 0;
      const discoveryBonus = status ? 0 : 1.25;
      const score =
        similarity + replayBonus + discoveryBonus + (game.curation_score || 0) * 0.35;

      return {
        game,
        score,
        status,
        sharedTags: [...sharedTags],
      };
    });

    ranked.sort((left, right) => {
      const orderDifference = Number(left.game.sort_order ?? Number.MAX_SAFE_INTEGER) - Number(right.game.sort_order ?? Number.MAX_SAFE_INTEGER);
      return right.score - left.score || orderDifference || left.game.title.localeCompare(right.game.title);
    });

    const chosen = ranked[0];
    return {
      game: chosen.game,
      reason: makeReason(chosen.game, gamesById, profile, chosen.status, chosen.sharedTags, knownIds),
      score: chosen.score,
    };
  }

  window.AtlasRecommendations = Object.freeze({ recommendFirstGame, isGameEligible, formatTag });
})();
