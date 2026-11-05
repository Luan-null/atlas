(() => {
  const config = window.ATLAS_SUPABASE_CONFIG;
  const sdk = window.supabase;

  if (!config?.url || !config?.publishableKey || !sdk?.createClient) {
    window.AtlasBackend = null;
    return;
  }

  const client = sdk.createClient(config.url, config.publishableKey);
  const initialProgress = {
    schemaVersion: 1,
    currentMilestone: null,
    completedMilestones: [],
  };

  async function readSave(userId) {
    const { data, error } = await client
      .from('atlas_saves')
      .select('progress, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function loadSave(userId) {
    const existingSave = await readSave(userId);
    if (existingSave) return existingSave;

    const { data, error } = await client
      .from('atlas_saves')
      .insert({ user_id: userId, progress: initialProgress })
      .select('progress, updated_at')
      .single();

    if (error?.code === '23505') {
      const saveAfterConcurrentInsert = await readSave(userId);
      if (saveAfterConcurrentInsert) return saveAfterConcurrentInsert;
    }

    if (error) throw error;
    return data;
  }

  async function saveProgress(progress) {
    if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
      throw new TypeError('O progresso do Atlas precisa ser um objeto.');
    }

    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('AUTH_REQUIRED');

    const { data, error } = await client
      .from('atlas_saves')
      .upsert({ user_id: user.id, progress }, { onConflict: 'user_id' })
      .select('progress, updated_at')
      .single();

    if (error) throw error;
    return data;
  }

  async function loadGameCatalog() {
    const { data, error } = await client
      .from('atlas_games')
      .select('id, title, franchise, release_year, platforms, genre_tags, mechanic_tags, theme_tags, play_contexts, short_description, is_profile_selectable, is_recommendation_candidate, curation_score, sort_order, source, source_id, cover_url')
      .eq('is_profile_selectable', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async function invokeIGDBCatalog(body) {
    const { data, error } = await client.functions.invoke('igdb-catalog', { body });
    if (error) {
      let message = 'Não foi possível acessar o catálogo do IGDB.';
      let code = '';
      try {
        if (error.context instanceof Response) {
          const details = await error.context.clone().json();
          message = details.error || message;
          code = details.code || '';
        } else if (error.message) {
          message = error.message;
        }
      } catch {
        // O gateway pode retornar uma resposta sem JSON quando a função ainda não existe.
      }
      const requestError = new Error(message);
      requestError.code = code;
      throw requestError;
    }
    return data;
  }

  async function searchIGDB(query) {
    return invokeIGDBCatalog({ action: 'search', query });
  }

  async function importIGDBGame(gameId) {
    return invokeIGDBCatalog({ action: 'import', gameId });
  }

  window.AtlasBackend = Object.freeze({
    client,
    loadSave,
    saveProgress,
    loadGameCatalog,
    searchIGDB,
    importIGDBGame,
  });
})();
