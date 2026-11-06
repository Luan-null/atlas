import { withSupabase } from 'npm:@supabase/server@1'

const GAME_FIELDS = [
  'id',
  'name',
  'slug',
  'summary',
  'first_release_date',
  'franchise.name',
  'franchises.name',
  'cover.image_id',
  'genres.name',
  'platforms.name',
  'themes.name',
  'keywords.name',
].join(',')

let cachedAppToken: { value: string; expiresAt: number } | null = null

const DIRECT_IGDB_COVER_IDS: Record<string, number> = {
  // IGDB's canonical Minecraft: Java Edition entry. Using its ID avoids
  // title-search ambiguity and keeps this seed game's cover deterministic.
  minecraft: 121,
}

class HttpError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status })
}

function cleanStrings(values: Array<{ name?: string } | string> | undefined, max = 30) {
  if (!Array.isArray(values)) return []
  return [...new Set(values
    .map((value) => typeof value === 'string' ? value : value?.name)
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean))]
    .slice(0, max)
}

function slugTag(value: string) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const aliases: Record<string, string> = {
    'role-playing-rpg': 'rpg',
    'role-playing': 'rpg',
    'rpg': 'rpg',
    'platform': 'platformer',
    'platformer': 'platformer',
    'real-time-strategy-rts': 'strategy',
    'turn-based-strategy': 'strategy',
    'strategy': 'strategy',
    'point-and-click': 'adventure',
  }
  return aliases[normalized] || normalized
}

function derivePlayContexts(platforms: string[]) {
  const contexts = new Set<string>()
  for (const platform of platforms) {
    const name = platform.toLocaleLowerCase('en')
    if (/(windows|pc|linux|mac|steam deck|steam os)/.test(name)) contexts.add('pc')
    if (name.includes('android')) contexts.add('android')

    // Consoles and handhelds are valid in the user's current PC emulation setup.
    if (/(nintendo|game boy|gameboy|gba|gbc|^gb$|^ds$|^3ds$|^nes$|^snes$|^n64$|playstation|^ps[1-5]$|xbox|sega|dreamcast|atari|arcade)/i.test(platform)) {
      contexts.add('pc-emulation')
    }
  }
  return [...contexts]
}

function normalizeGame(game: Record<string, any>) {
  const platforms = cleanStrings(game.platforms)
  const genres = cleanStrings(game.genres)
  const themes = cleanStrings(game.themes)
  const keywords = cleanStrings(game.keywords, 40)
  const franchise = game.franchise?.name || game.franchises?.[0]?.name || null
  const imageId = typeof game.cover?.image_id === 'string' ? game.cover.image_id : null
  const releaseYear = Number.isFinite(game.first_release_date)
    ? new Date(game.first_release_date * 1000).getUTCFullYear()
    : null

  return {
    id: `igdb-${game.id}`,
    title: String(game.name || '').trim(),
    franchise,
    release_year: releaseYear,
    platforms,
    genre_tags: [...new Set(genres.map(slugTag).filter(Boolean))],
    mechanic_tags: [...new Set(keywords.map(slugTag).filter(Boolean))].slice(0, 30),
    theme_tags: [...new Set(themes.map(slugTag).filter(Boolean))].slice(0, 20),
    play_contexts: derivePlayContexts(platforms),
    short_description: typeof game.summary === 'string' ? game.summary.trim().slice(0, 1200) : '',
    is_profile_selectable: true,
    is_recommendation_candidate: true,
    curation_score: 1,
    sort_order: 10000,
    source: 'igdb',
    source_id: String(game.id),
    cover_url: imageId
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`
      : null,
    external_metadata: {
      slug: typeof game.slug === 'string' ? game.slug : null,
      igdb_url: typeof game.slug === 'string' ? `https://www.igdb.com/games/${game.slug}` : null,
    },
  }
}

function normalizeTitle(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter((word) => word !== 'the' && word !== 'version')
    .join(' ')
}

function coverTitleMatches(candidateTitle: string, catalogTitle: string) {
  const candidate = normalizeTitle(candidateTitle)
  const catalog = normalizeTitle(catalogTitle)
  if (candidate === catalog) return true

  // IGDB catalogs the base Minecraft game as "Minecraft: Java Edition".
  const knownAliases: Record<string, string[]> = {
    minecraft: ['minecraft java edition'],
  }
  return knownAliases[catalog]?.includes(candidate) ?? false
}

function getIGDBCoverMatch(
  games: Array<Record<string, any>>,
  title: string,
  releaseYear: number | null,
) {
  const exactMatches = games.filter((game) =>
    typeof game.name === 'string' &&
    coverTitleMatches(game.name, title) &&
    typeof game.cover?.image_id === 'string'
  )

  if (releaseYear !== null) {
    const sameYear = exactMatches.filter((game) =>
      Number.isFinite(game.first_release_date) &&
      new Date(game.first_release_date * 1000).getUTCFullYear() === releaseYear
    )
    if (sameYear.length === 1) return sameYear[0]
    if (sameYear.length > 1) return null

    const closeYearMatches = exactMatches.flatMap((game) => {
      if (!Number.isFinite(game.first_release_date)) return []
      const year = new Date(game.first_release_date * 1000).getUTCFullYear()
      return Math.abs(year - releaseYear) <= 1 ? [{ game, distance: Math.abs(year - releaseYear) }] : []
    })
    if (!closeYearMatches.length) return null

    const nearestDistance = Math.min(...closeYearMatches.map(({ distance }) => distance))
    const nearestMatches = closeYearMatches.filter(({ distance }) => distance === nearestDistance)
    return nearestMatches.length === 1 ? nearestMatches[0].game : null
  }

  return exactMatches.length === 1 ? exactMatches[0] : null
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function getAppAccessToken(clientId: string, clientSecret: string) {
  if (cachedAppToken && cachedAppToken.expiresAt > Date.now() + 60_000) {
    return cachedAppToken.value
  }

  const tokenUrl = new URL('https://id.twitch.tv/oauth2/token')
  tokenUrl.searchParams.set('client_id', clientId)
  tokenUrl.searchParams.set('client_secret', clientSecret)
  tokenUrl.searchParams.set('grant_type', 'client_credentials')

  const response = await fetch(tokenUrl, { method: 'POST' })
  if (!response.ok) {
    console.error('Twitch OAuth token request failed:', response.status)
    throw new HttpError(502, 'TWITCH_AUTH_FAILED', 'Não foi possível autenticar no IGDB. Confira as credenciais configuradas no Supabase.')
  }

  const payload = await response.json()
  if (!payload.access_token || !Number.isFinite(payload.expires_in)) {
    throw new HttpError(502, 'TWITCH_AUTH_INVALID', 'O serviço de autenticação do IGDB retornou uma resposta inesperada.')
  }

  cachedAppToken = {
    value: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  }
  return cachedAppToken.value
}

async function requestIGDB(query: string, clientId: string, accessToken: string) {
  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body: query,
  })

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 600)
    console.error('IGDB games request failed:', response.status, detail)
    if (response.status === 429) {
      throw new HttpError(429, 'IGDB_RATE_LIMIT', 'A busca atingiu o limite temporário do IGDB. Aguarde um pouco e tente novamente.')
    }
    throw new HttpError(502, 'IGDB_REQUEST_FAILED', 'O IGDB não respondeu à busca agora. Tente novamente em instantes.')
  }

  return await response.json() as Array<Record<string, any>>
}

async function backfillMissingCovers(ctx: any, clientId: string, accessToken: string) {
  const { data: games, error } = await ctx.supabaseAdmin
    .from('atlas_games')
    .select('id, title, release_year')
    .eq('is_profile_selectable', true)
    .eq('source', 'atlas')
    .is('cover_url', null)
    .order('sort_order', { ascending: true })
    .limit(40)

  if (error) {
    console.error('Atlas catalog cover lookup failed:', error.code, error.message)
    throw new HttpError(500, 'COVER_LOOKUP_FAILED', 'Não foi possível consultar as capas que faltam no catálogo.')
  }

  let updated = 0
  let unmatched = 0
  for (const [index, game] of (games || []).entries()) {
    if (index > 0) await delay(300)

    const directIGDBId = DIRECT_IGDB_COVER_IDS[game.id]
    let matches: Array<Record<string, any>>
    if (directIGDBId) {
      matches = await requestIGDB(
        `fields id,name,first_release_date,cover.image_id; where id = ${directIGDBId}; limit 1;`,
        clientId,
        accessToken,
      )
    } else {
      const safeTitle = String(game.title || '').replaceAll('\\', '\\\\').replaceAll('"', '\\"')
      matches = await requestIGDB(
        `search "${safeTitle}"; fields id,name,first_release_date,cover.image_id; limit 10;`,
        clientId,
        accessToken,
      )
    }
    const match = directIGDBId
      ? matches.find((candidate) => typeof candidate.cover?.image_id === 'string') ?? null
      : getIGDBCoverMatch(matches, game.title, game.release_year ?? null)
    if (!match) {
      unmatched += 1
      continue
    }

    const coverUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big/${match.cover.image_id}.jpg`
    const { data: changedRows, error: updateError } = await ctx.supabaseAdmin
      .from('atlas_games')
      .update({ cover_url: coverUrl })
      .eq('id', game.id)
      .is('cover_url', null)
      .select('id')

    if (updateError) {
      console.error('Atlas catalog cover update failed:', updateError.code, updateError.message)
      throw new HttpError(500, 'COVER_UPDATE_FAILED', 'Não foi possível salvar uma capa no catálogo.')
    }
    if (changedRows?.length) updated += 1
  }

  return {
    scanned: games?.length || 0,
    updated,
    unmatched,
  }
}

async function getIGDBCredentials() {
  const clientId = Deno.env.get('IGDB_CLIENT_ID')
  const clientSecret = Deno.env.get('IGDB_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new HttpError(503, 'IGDB_NOT_CONFIGURED', 'O IGDB ainda não está configurado. Adicione IGDB_CLIENT_ID e IGDB_CLIENT_SECRET nos Secrets do Supabase.')
  }
  return { clientId, clientSecret }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, ctx) => {
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Use uma solicitação POST.', code: 'METHOD_NOT_ALLOWED' }, 405)
    }

    try {
      const payload = await request.json().catch(() => null)
      if (!payload || typeof payload !== 'object') {
        throw new HttpError(400, 'INVALID_BODY', 'A solicitação da busca está inválida.')
      }

      const action = payload.action
      if (!['search', 'import', 'backfill-covers'].includes(action)) {
        throw new HttpError(400, 'INVALID_ACTION', 'A ação solicitada não existe.')
      }

      const { clientId, clientSecret } = await getIGDBCredentials()
      const accessToken = await getAppAccessToken(clientId, clientSecret)

      if (action === 'backfill-covers') {
        return jsonResponse(await backfillMissingCovers(ctx, clientId, accessToken))
      }

      if (action === 'search') {
        const rawQuery = typeof payload.query === 'string' ? payload.query.trim().replace(/\s+/g, ' ') : ''
        if (rawQuery.length < 2 || rawQuery.length > 100) {
          throw new HttpError(400, 'INVALID_QUERY', 'Digite pelo menos 2 caracteres para buscar um jogo.')
        }

        const safeQuery = rawQuery.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
        const games = await requestIGDB(
          `search "${safeQuery}"; fields ${GAME_FIELDS}; limit 10;`,
          clientId,
          accessToken,
        )
        return jsonResponse({ results: games.map(normalizeGame) })
      }

      const externalId = typeof payload.gameId === 'string' || typeof payload.gameId === 'number'
        ? String(payload.gameId)
        : ''
      if (!/^\d{1,12}$/.test(externalId)) {
        throw new HttpError(400, 'INVALID_GAME_ID', 'O jogo selecionado não tem um identificador válido.')
      }

      const games = await requestIGDB(
        `fields ${GAME_FIELDS}; where id = ${externalId}; limit 1;`,
        clientId,
        accessToken,
      )
      if (!games.length) throw new HttpError(404, 'GAME_NOT_FOUND', 'Esse jogo não foi encontrado no IGDB.')

      const catalogEntry = normalizeGame(games[0])
      const { data, error } = await ctx.supabaseAdmin
        .from('atlas_games')
        .upsert(catalogEntry, { onConflict: 'id' })
        .select('id, title, franchise, release_year, platforms, genre_tags, mechanic_tags, theme_tags, play_contexts, short_description, is_profile_selectable, is_recommendation_candidate, curation_score, sort_order, source, source_id, cover_url, external_metadata')
        .single()

      if (error) {
        console.error('IGDB catalog upsert failed:', error.code, error.message)
        throw new HttpError(500, 'CATALOG_IMPORT_FAILED', 'Não foi possível adicionar o jogo ao catálogo do Atlas.')
      }

      return jsonResponse({ game: data })
    } catch (error) {
      if (error instanceof HttpError) {
        return jsonResponse({ error: error.message, code: error.code }, error.status)
      }
      console.error('IGDB catalog function failed:', error)
      return jsonResponse({
        error: 'Não foi possível concluir a busca no IGDB agora. Tente novamente em instantes.',
        code: 'INTERNAL_ERROR',
      }, 500)
    }
  }),
}
