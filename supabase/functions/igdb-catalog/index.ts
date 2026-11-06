import { withSupabase } from 'npm:@supabase/server@1'

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
      throw new HttpError(429, 'IGDB_RATE_LIMIT', 'A atualização das capas atingiu o limite temporário do IGDB. Aguarde um pouco e tente novamente.')
    }
    throw new HttpError(502, 'IGDB_REQUEST_FAILED', 'O IGDB não respondeu à atualização das capas agora. Tente novamente em instantes.')
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
        throw new HttpError(400, 'INVALID_BODY', 'A solicitação de atualização das capas está inválida.')
      }

      const action = payload.action
      if (action !== 'backfill-covers') {
        throw new HttpError(400, 'INVALID_ACTION', 'A ação solicitada não existe.')
      }

      const { clientId, clientSecret } = await getIGDBCredentials()
      const accessToken = await getAppAccessToken(clientId, clientSecret)
      return jsonResponse(await backfillMissingCovers(ctx, clientId, accessToken))
    } catch (error) {
      if (error instanceof HttpError) {
        return jsonResponse({ error: error.message, code: error.code }, error.status)
      }
      console.error('IGDB catalog function failed:', error)
      return jsonResponse({
        error: 'Não foi possível concluir a atualização das capas agora. Tente novamente em instantes.',
        code: 'INTERNAL_ERROR',
      }, 500)
    }
  }),
}