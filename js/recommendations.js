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

  function overlapCount(left = [], right = []) {
    const rightSet = new Set(right);
    return left.filter((value) => rightSet.has(value)).length;
  }

  function formatTag(tag) {
    return tagLabels[tag] || tag.replaceAll('-', ' ');
  }

  function makeReason(candidate, gamesById, profile, candidateStatus, sharedTags) {
    if (candidateStatus === 'favorite') {
      return 'Você marcou este jogo como favorito e deixou aberta a possibilidade de rejogar.';
    }
    if (candidateStatus === 'liked') {
      return 'Você contou que gostou deste jogo; ele pode ser um bom ponto de partida para a Jornada.';
    }
    if (candidateStatus === 'played' && profile.replayAllowed !== false) {
      return 'Você já conhece este jogo e deixou aberta a possibilidade de rejogar.';
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

  function recommendFirstGame(games, profile = {}, excludedIds = []) {
    const candidateGames = games.filter((game) => game.is_recommendation_candidate);
    const gamesById = new Map(games.map((game) => [game.id, game]));
    const ratings = new Map((profile.gameSignals || []).map(({ gameId, status }) => [gameId, status]));
    const playContexts = profile.playContexts || [];
    const canAccess = (game) => {
      if (!playContexts.length || !game.play_contexts?.length) return true;
      return game.play_contexts.some((context) => playContexts.includes(context));
    };

    let options = candidateGames.filter((game) =>
      !excludedIds.includes(game.id) && canAccess(game) &&
      (profile.replayAllowed !== false || !ratings.has(game.id))
    );

    if (!options.length && excludedIds.length) {
      options = candidateGames.filter((game) =>
        canAccess(game) && (profile.replayAllowed !== false || !ratings.has(game.id))
      );
    }
    if (!options.length) return null;

    const positiveSignals = (profile.gameSignals || [])
      .filter(({ status }) => ['liked', 'favorite'].includes(status))
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

      const replayBonus = status === 'favorite' ? 2.4 : status === 'liked' ? 1.7 : status === 'played' ? 0.35 : 0;
      const discoveryBonus = status ? 0 : 1.25;
      const accessBonus = canAccess(game) ? 1 : 0;
      const score =
        similarity + replayBonus + discoveryBonus + accessBonus + (game.curation_score || 0) * 0.35;

      return {
        game,
        score,
        status,
        sharedTags: [...sharedTags],
      };
    });

    ranked.sort((left, right) =>
      right.score - left.score || left.game.sort_order - right.game.sort_order || left.game.title.localeCompare(right.game.title)
    );

    const chosen = ranked[0];
    return {
      game: chosen.game,
      reason: makeReason(chosen.game, gamesById, profile, chosen.status, chosen.sharedTags),
      score: chosen.score,
    };
  }

  window.AtlasRecommendations = Object.freeze({ recommendFirstGame, formatTag });
})();
