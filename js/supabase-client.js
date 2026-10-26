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

  window.AtlasBackend = Object.freeze({ client, loadSave, saveProgress });
})();
