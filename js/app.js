const view = document.querySelector('#view');
const startSound = document.querySelector('#entry-start-sound');
const desktopViewport = window.matchMedia('(min-width: 1024px) and (min-height: 600px)');
let cleanupCurrentScreen = () => {};
let routeTransitionTimer = 0;
let entrySession = null;

function getRoute() {
  const route = window.location.hash.slice(1);
  return ['login', 'profile-setup', 'first-game'].includes(route) ? route : 'home';
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function navigateTo(route) {
  if (route === getRoute() || routeTransitionTimer || view.classList.contains('is-leaving')) return false;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    window.location.hash = route;
    return true;
  }

  view.classList.add('is-leaving');
  routeTransitionTimer = window.setTimeout(() => {
    routeTransitionTimer = 0;
    window.location.hash = route;
  }, 360);
  return true;
}

function renderRoute() {
  const shouldAnimateIn = view.classList.contains('is-leaving');
  if (routeTransitionTimer) {
    window.clearTimeout(routeTransitionTimer);
    routeTransitionTimer = 0;
  }

  cleanupCurrentScreen();

  if (!desktopViewport.matches) {
    startSound.pause();
    startSound.currentTime = 0;
    view.innerHTML = '';
    view.classList.remove('is-leaving', 'is-entering');
    cleanupCurrentScreen = () => {};
    return;
  }

  if (getRoute() === 'login') {
    cleanupCurrentScreen = renderLogin();
  } else if (getRoute() === 'profile-setup') {
    cleanupCurrentScreen = renderProfileSetup();
  } else if (getRoute() === 'first-game') {
    cleanupCurrentScreen = renderFirstGame();
  } else if (entrySession) {
    view.replaceChildren(entrySession.element);
    entrySession.resume();
    cleanupCurrentScreen = entrySession.pause;
  } else {
    entrySession = renderEntry();
    cleanupCurrentScreen = entrySession.pause;
  }

  if (shouldAnimateIn) {
    view.classList.remove('is-leaving');
    view.classList.add('is-entering');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => view.classList.remove('is-entering'));
    });
  }
}

function renderEntry() {
  view.innerHTML = `
    <section class="entry-screen" aria-label="Tela inicial do Atlas">
      <img
        class="entry-poster"
        src="assets/img/atlas-title-scene.png"
        alt=""
        draggable="false"
      />

      <video
        class="entry-video entry-video--loop"
        src="assets/video/loop.mp4"
        poster="assets/img/atlas-title-scene.png"
        muted
        loop
        playsinline
        preload="auto"
        aria-hidden="true"
      ></video>

      <div class="entry-content">
        <div class="entry-panel">
          <img class="entry-logo" src="assets/img/logo.png" alt="Atlas" draggable="false" />
          <div class="entry-start-float">
            <button class="button primary entry-start" type="button">
              <span>INICIAR</span>
              <span class="entry-start__arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>

      <audio
        class="entry-background-audio"
        src="assets/audio/Atlas%20Title%20Game%20(Extended%20Seamless%20Loop).mp3"
        loop
        preload="auto"
        aria-hidden="true"
      ></audio>

      <button class="entry-audio" type="button" aria-label="Ativar música" aria-pressed="false">
        <svg class="entry-audio__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10v4h3l5 4V6l-5 4H4z" />
          <path class="entry-audio__waves" d="M16 9a5 5 0 0 1 0 6M18.5 6.5a9 9 0 0 1 0 11" />
          <path class="entry-audio__slash" d="m16 9 5 6m0-6-5 6" />
        </svg>
      </button>
    </section>
  `;

  const screen = view.querySelector('.entry-screen');
  const loop = view.querySelector('.entry-video--loop');
  const backgroundAudio = view.querySelector('.entry-background-audio');
  const audioButton = view.querySelector('.entry-audio');
  const startButton = view.querySelector('.entry-start');

  // O título espera um instante depois que o loop começa, e o botão vem em seguida.
  const titleRevealDelayMs = 500;
  const startRevealDelayMs = 400;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let soundEnabled = false;
  let titleHasAppeared = false;
  let audioRequestId = 0;
  backgroundAudio.volume = 0.38;

  function updateAudioButton(enabled) {
    soundEnabled = enabled;
    screen.classList.toggle('is-sound-on', enabled);
    audioButton.setAttribute('aria-pressed', String(enabled));
    audioButton.setAttribute('aria-label', enabled ? 'Desativar música' : 'Ativar música');
  }

  function startBackgroundAudio() {
    const requestId = ++audioRequestId;

    backgroundAudio.play()
      .then(() => {
        if (requestId === audioRequestId) updateAudioButton(true);
      })
      .catch(() => {
        if (requestId !== audioRequestId) return;
        backgroundAudio.pause();
        updateAudioButton(false);
      });
  }

  function revealTitle() {
    if (titleHasAppeared) return;
    titleHasAppeared = true;
    screen.classList.add('is-title-visible');
    window.setTimeout(() => screen.classList.add('is-start-visible'), startRevealDelayMs);
  }

  function startLoop() {
    loop.loop = true;
    loop.muted = true;

    loop.play()
      .then(() => window.setTimeout(revealTitle, titleRevealDelayMs))
      .catch(() => {
        screen.classList.add('is-static');
        window.setTimeout(revealTitle, titleRevealDelayMs);
      });
  }

  function playStartClick() {
    startSound.pause();
    startSound.currentTime = 0;
    const playback = startSound.play();
    if (playback) playback.catch(() => {});
  }

  startButton.addEventListener('click', () => {
    if (navigateTo('login')) playStartClick();
  });

  audioButton.addEventListener('click', () => {
    if (soundEnabled) {
      audioRequestId++;
      backgroundAudio.pause();
      updateAudioButton(false);
    } else {
      startBackgroundAudio();
    }
  });

  // Tenta tocar a música ao abrir; se o navegador bloquear, o botão permite iniciar após um clique.
  startBackgroundAudio();

  if (reducedMotion) {
    screen.classList.add('is-static');
    loop.pause();
    revealTitle();
  } else {
    startLoop();
  }

  function cleanupEntry() {
    audioRequestId++;
    loop.pause();
    backgroundAudio.pause();
  }

  function resumeEntry() {
    if (!reducedMotion && !screen.classList.contains('is-static') && loop.paused) {
      loop.play().catch(() => {
        screen.classList.add('is-static');
        revealTitle();
      });
    }

    if (soundEnabled) startBackgroundAudio();
  }

  return { element: screen, pause: cleanupEntry, resume: resumeEntry };
}

function renderLogin() {
  view.innerHTML = `
    <section class="login-screen" aria-labelledby="login-title">
      <img class="login-backdrop" src="assets/img/atlas-title-scene.png" alt="" />
      <a class="login-back" href="#home" aria-label="Voltar">
        <svg class="login-back__icon" viewBox="0 0 40 28" fill="none" aria-hidden="true">
          <path class="login-back__route" d="M34 18H8m0 0 8-8m-8 8 8 8" />
          <path class="login-back__compass" d="m30 3.5 1.4 3.8 3.8 1.4-3.8 1.4L30 14l-1.4-3.9-3.8-1.4 3.8-1.4L30 3.5Z" />
          <circle class="login-back__point" cx="35.5" cy="18" r="1.2" />
        </svg>
      </a>

      <div class="login-layout">
        <div class="login-brand">
          <img src="assets/img/logo.png" alt="Atlas" />
        </div>

        <div class="login-card">
          <p class="login-eyebrow">SEU SAVE</p>
          <h1 id="login-title">Entre no Atlas</h1>
          <p class="login-description">Acesse sua conta para continuar de onde parou.</p>

          <form class="login-form">
            <label for="login-email">E-mail</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autocomplete="username"
              placeholder="voce@email.com"
              required
            />

            <label for="login-password">Senha</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="Sua senha"
              required
            />

            <button class="button primary login-submit" type="submit">
              <span>ENTRAR</span><span aria-hidden="true">→</span>
            </button>
          </form>
          <p class="login-feedback" role="status" aria-live="polite" hidden></p>
          <button class="login-mode-toggle" type="button">Primeira vez no Atlas? Criar conta</button>
          <button class="button primary login-signout" type="button" hidden>Sair da conta</button>
        </div>
      </div>
    </section>
  `;

  const form = view.querySelector('.login-form');
  const feedback = view.querySelector('.login-feedback');
  const email = view.querySelector('#login-email');
  const password = view.querySelector('#login-password');
  const backLink = view.querySelector('.login-back');
  const title = view.querySelector('#login-title');
  const description = view.querySelector('.login-description');
  const submitLabel = view.querySelector('.login-submit span:first-child');
  const modeToggle = view.querySelector('.login-mode-toggle');
  const signOutButton = view.querySelector('.login-signout');
  const backend = window.AtlasBackend;
  let authMode = 'login';

  function setFeedback(message, tone = 'info') {
    feedback.textContent = message;
    feedback.dataset.tone = tone;
    feedback.hidden = !message;
  }

  function setAuthMode(mode) {
    authMode = mode;
    const creatingAccount = mode === 'signup';
    title.textContent = creatingAccount ? 'Crie sua conta' : 'Entre no Atlas';
    description.textContent = creatingAccount
      ? 'Seu progresso ficará guardado na sua conta.'
      : 'Acesse sua conta para continuar de onde parou.';
    submitLabel.textContent = creatingAccount ? 'CRIAR CONTA' : 'ENTRAR';
    password.autocomplete = creatingAccount ? 'new-password' : 'current-password';
    modeToggle.textContent = creatingAccount ? 'Já tem uma conta? Entrar' : 'Primeira vez no Atlas? Criar conta';
    setFeedback('');
  }

  function setBusy(busy) {
    form.querySelector('button[type="submit"]').disabled = busy;
    modeToggle.disabled = busy;
    signOutButton.disabled = busy;
  }

  function getAuthErrorMessage(error, mode) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('invalid login credentials')) {
      return 'Não foi possível entrar. Confira seu e-mail, senha e se o endereço já foi confirmado.';
    }
    if (message.includes('password should be at least')) {
      return 'A senha não atende ao mínimo configurado no serviço. Tente uma senha mais longa.';
    }
    if (message.includes('rate limit')) {
      return 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.';
    }
    return mode === 'signup'
      ? 'Não foi possível criar a conta. Confira o e-mail e tente novamente.'
      : 'Não foi possível entrar. Confira os dados e tente novamente.';
  }

  function getSaveErrorMessage(error) {
    if (['42P01', 'PGRST205'].includes(error?.code)) {
      return 'A conta conectou, mas a tabela de save ainda não existe. Execute supabase/schema.sql no SQL Editor do Supabase.';
    }
    if (['42501', 'PGRST301'].includes(error?.code)) {
      return 'A conta conectou, mas as regras de acesso do save ainda precisam ser aplicadas. Execute supabase/schema.sql no SQL Editor do Supabase.';
    }
    return 'A conta conectou, mas não foi possível carregar o save. Confira a configuração da tabela no Supabase.';
  }

  async function showSignedInState(user) {
    form.hidden = true;
    modeToggle.hidden = true;
    signOutButton.hidden = false;
    setFeedback('Conta conectada. Carregando seu save…');

    try {
      const save = await backend.loadSave(user.id);
      setFeedback('Conta conectada. Seu save está pronto para receber o progresso do Atlas.', 'success');
      const nextRoute = save.progress?.profile?.setupComplete ? 'first-game' : 'profile-setup';
      window.setTimeout(() => navigateTo(nextRoute), 550);
    } catch (error) {
      setFeedback(getSaveErrorMessage(error), 'error');
    }
  }

  async function restoreSession() {
    if (!backend?.client) {
      setFeedback('Não foi possível conectar ao serviço de contas. Confira a conexão com a internet e tente novamente.', 'error');
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await backend.client.auth.getSession();
      if (error) throw error;
      if (data.session?.user) await showSignedInState(data.session.user);
    } catch {
      setFeedback('Não foi possível recuperar sua sessão. Entre novamente.', 'error');
    } finally {
      setBusy(false);
    }
  }

  backLink.addEventListener('click', (event) => {
    event.preventDefault();
    navigateTo('home');
  });

  modeToggle.addEventListener('click', () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!backend?.client) {
      setFeedback('Não foi possível conectar ao serviço de contas. Confira a conexão com a internet e tente novamente.', 'error');
      return;
    }

    setBusy(true);
    setFeedback(authMode === 'signup' ? 'Criando sua conta…' : 'Entrando no Atlas…');

    try {
      if (authMode === 'signup') {
        const { data, error } = await backend.client.auth.signUp({
          email: email.value.trim(),
          password: password.value,
          options: { emailRedirectTo: new URL('./', window.location.href).href },
        });
        if (error) throw error;

        if (data.session?.user) {
          await showSignedInState(data.session.user);
        } else {
          setAuthMode('login');
          password.value = '';
          setFeedback('Conta criada. Confirme seu e-mail pelo link enviado antes de entrar.', 'success');
        }
      } else {
        const { data, error } = await backend.client.auth.signInWithPassword({
          email: email.value.trim(),
          password: password.value,
        });
        if (error) throw error;
        await showSignedInState(data.user);
      }
    } catch (error) {
      setFeedback(getAuthErrorMessage(error, authMode), 'error');
    } finally {
      setBusy(false);
    }
  });

  signOutButton.addEventListener('click', async () => {
    if (!backend?.client) return;
    setBusy(true);
    try {
      const { error } = await backend.client.auth.signOut();
      if (error) throw error;
      form.hidden = false;
      modeToggle.hidden = false;
      signOutButton.hidden = true;
      password.value = '';
      setAuthMode('login');
      setFeedback('Você saiu da sua conta.');
    } catch {
      setFeedback('Não foi possível sair da conta. Tente novamente.', 'error');
    } finally {
      setBusy(false);
    }
  });

  email.focus({ preventScroll: true });
  restoreSession();
  return () => {};
}

function getPlatformNames(platforms = []) {
  const labels = {
    GBA: 'Game Boy Advance',
    DS: 'Nintendo DS',
    '3DS': 'Nintendo 3DS',
    N64: 'Nintendo 64',
    GBC: 'Game Boy Color',
    GB: 'Game Boy',
    SNES: 'Super Nintendo',
    Switch: 'Nintendo Switch',
    PC: 'PC',
    Android: 'Android',
    iOS: 'iOS',
    'PS4': 'PlayStation 4',
    'Xbox One': 'Xbox One',
    various: 'vários sistemas',
  };
  return platforms.map((platform) => labels[platform] || platform).join(' · ');
}

function renderGameSignalButtons(gameId, selectedStatus = '') {
  const signals = [
    ['played', 'Joguei'],
    ['liked', 'Gostei'],
    ['favorite', 'Favorito'],
    ['disliked', 'Não gostei'],
  ];
  return `
    <div class="profile-game-signals" role="group" aria-label="Como foi sua experiência?" data-game-id="${escapeHTML(gameId)}">
      ${signals.map(([status, label]) => `
        <button class="profile-signal${selectedStatus === status ? ' is-selected' : ''}" type="button" data-status="${status}" aria-pressed="${selectedStatus === status}">${label}</button>
      `).join('')}
    </div>
  `;
}

function renderGameCard(game, selectedStatus = '') {
  const platformText = getPlatformNames(game.platforms || []);
  const detail = [game.franchise, game.release_year, platformText].filter(Boolean).join(' · ');
  const cover = typeof game.cover_url === 'string' && /^https:\/\/images\.igdb\.com\//.test(game.cover_url)
    ? `<img class="profile-game-card__cover" src="${escapeHTML(game.cover_url)}" alt="Capa de ${escapeHTML(game.title)}" loading="lazy" />`
    : `<span class="profile-game-card__cover-placeholder" aria-hidden="true">${escapeHTML(game.title.slice(0, 1))}</span>`;
  return `
    <article class="profile-game-card" data-game-id="${escapeHTML(game.id)}" data-franchise="${escapeHTML(game.franchise || '')}">
      <div class="profile-game-card__main">
        ${cover}
        <div class="profile-game-card__info">
          <h3>${escapeHTML(game.title)}</h3>
          <p>${escapeHTML(detail)}</p>
        </div>
      </div>
      ${renderGameSignalButtons(game.id, selectedStatus)}
    </article>
  `;
}

function interleaveCatalogByFranchise(catalog) {
  const groups = new Map();
  for (const game of catalog) {
    const key = game.franchise || game.title;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(game);
  }

  const mixed = [];
  while (mixed.length < catalog.length) {
    let added = false;
    for (const franchiseGames of groups.values()) {
      const nextGame = franchiseGames.shift();
      if (!nextGame) continue;
      mixed.push(nextGame);
      added = true;
    }
    if (!added) break;
  }
  return mixed;
}

async function getSignedInSave() {
  const backend = window.AtlasBackend;
  if (!backend?.client) throw new Error('NO_BACKEND');
  const { data, error } = await backend.client.auth.getSession();
  if (error) throw error;
  if (!data.session?.user) return null;
  const save = await backend.loadSave(data.session.user.id);
  return { backend, save, user: data.session.user };
}

function renderProfileSetup() {
  view.innerHTML = `
    <section class="profile-screen" aria-labelledby="profile-setup-title">
      <img class="profile-screen__backdrop" src="assets/img/atlas-title-scene.png" alt="" />
      <div class="profile-shell">
        <header class="profile-heading">
          <div>
            <div class="profile-heading__eyebrow">
              <button class="profile-step-back" type="button" aria-label="Voltar para preferências" title="Voltar para preferências" hidden>
                <svg class="profile-step-back__icon" viewBox="0 0 40 28" fill="none" aria-hidden="true">
                  <path class="login-back__route" d="M34 18H8m0 0 8-8m-8 8 8 8" />
                  <path class="login-back__compass" d="m30 3.5 1.4 3.8 3.8 1.4-3.8 1.4L30 14l-1.4-3.9-3.8-1.4 3.8-1.4L30 3.5Z" />
                  <circle class="login-back__point" cx="35.5" cy="18" r="1.2" />
                </svg>
              </button>
              <p class="login-eyebrow">PONTO DE PARTIDA</p>
            </div>
            <h1 id="profile-setup-title">Onde começa sua jornada?</h1>
            <p>Primeiro, vamos ajustar suas formas de jogar.</p>
          </div>
          <button class="profile-signout" type="button">Sair da conta</button>
        </header>

        <form class="profile-setup-layout">
          <section class="profile-panel profile-preferences profile-step" data-profile-step="preferences" aria-labelledby="profile-access-title">
            <p class="login-eyebrow">PREFERÊNCIAS · ETAPA 1 DE 2</p>
            <h2 id="profile-access-title">Onde você consegue jogar?</h2>
            <p class="profile-panel__copy">Isso ajuda a sugerir jogos que cabem no seu acesso atual.</p>

            <div class="profile-preference-options">
              <label class="profile-choice">
                <input type="checkbox" name="playContext" value="pc-emulation" />
                <span><strong>PC com emulação</strong><small>Para jogos de consoles e portáteis</small></span>
              </label>
              <label class="profile-choice">
                <input type="checkbox" name="playContext" value="pc" />
                <span><strong>Jogos de PC</strong><small>Jogos disponíveis para computador</small></span>
              </label>
              <label class="profile-choice">
                <input type="checkbox" name="playContext" value="android" />
                <span><strong>Android</strong><small>Jogos leves para celular</small></span>
              </label>
            </div>

            <fieldset class="profile-emulation-setting" hidden>
              <legend>Até que nível seu PC roda emulação?</legend>
              <p>Escolha a faixa mais alta que funciona bem. É uma estimativa e você poderá mudar depois.</p>
              <div class="profile-emulation-options">
                <label class="profile-emulation-choice">
                  <input type="radio" name="maxEmulationTier" value="1" />
                  <span><strong>Portáteis e clássicos</strong><small>GB, GBA, NES, SNES e DS</small></span>
                </label>
                <label class="profile-emulation-choice">
                  <input type="radio" name="maxEmulationTier" value="2" />
                  <span><strong>3D clássico</strong><small>N64, PlayStation, GameCube e PS2</small></span>
                </label>
                <label class="profile-emulation-choice">
                  <input type="radio" name="maxEmulationTier" value="3" />
                  <span><strong>Wii e 3DS</strong><small>Uma faixa acima dos consoles clássicos</small></span>
                </label>
                <label class="profile-emulation-choice">
                  <input type="radio" name="maxEmulationTier" value="4" />
                  <span><strong>Mais exigentes</strong><small>Wii U, Switch, PS3 e Xbox 360</small></span>
                </label>
              </div>
            </fieldset>

            <div class="profile-replay-setting">
              <label class="profile-choice">
                <input type="checkbox" name="replayAllowed" />
                <span><strong>Posso rejogar jogos conhecidos</strong><small>O Atlas pode considerar títulos que você já jogou.</small></span>
              </label>
            </div>

            <p class="profile-feedback profile-preferences-feedback" role="status" aria-live="polite"></p>
            <button class="button primary profile-step-continue" type="button">
              <span>CONTINUAR PARA OS JOGOS</span><span aria-hidden="true">→</span>
            </button>
            <p class="profile-privacy-note">Você poderá mudar essas respostas depois.</p>
          </section>

          <section class="profile-games-panel profile-step" data-profile-step="games" aria-labelledby="profile-setup-title" hidden>
            <div class="profile-games-toolbar">
              <div class="profile-search-control">
                <label class="profile-search-label" for="profile-game-search">Buscar jogos</label>
                <input class="profile-game-search" id="profile-game-search" type="search" placeholder="Nome ou franquia" autocomplete="off" />
              </div>
              <span class="profile-game-count" aria-live="polite"></span>
            </div>
            <div class="profile-game-list" aria-label="Catálogo inicial" aria-live="polite">
              <p class="profile-feedback">Carregando o catálogo inicial…</p>
            </div>

            <p class="profile-feedback profile-setup-feedback" role="status" aria-live="polite"></p>
          </section>
          <div class="profile-step-actions" hidden>
            <button class="button primary profile-submit" type="submit">
              <span>MOSTRAR PRIMEIRO JOGO</span><span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  `;

  const screen = view.querySelector('.profile-screen');
  const form = view.querySelector('.profile-setup-layout');
  const list = view.querySelector('.profile-game-list');
  const search = view.querySelector('.profile-game-search');
  const count = view.querySelector('.profile-game-count');
  const feedback = view.querySelector('.profile-setup-feedback');
  const preferencesFeedback = view.querySelector('.profile-preferences-feedback');
  const preferencesStep = view.querySelector('[data-profile-step="preferences"]');
  const gamesStep = view.querySelector('[data-profile-step="games"]');
  const profileTitle = view.querySelector('#profile-setup-title');
  const profileIntro = view.querySelector('.profile-heading > div > p:last-child');
  const continueButton = view.querySelector('.profile-step-continue');
  const emulationSettings = view.querySelector('.profile-emulation-setting');
  const emulationContextInput = view.querySelector('[name="playContext"][value="pc-emulation"]');
  const replayAllowedInput = view.querySelector('[name="replayAllowed"]');
  const backButton = view.querySelector('.profile-step-back');
  const stepActions = view.querySelector('.profile-step-actions');
  const submitButton = view.querySelector('.profile-submit');
  const signoutButton = view.querySelector('.profile-signout');
  const gamesPerPage = 24;
  submitButton.disabled = true;
  let games = [];
  let ratings = new Map();
  let loadedProgress = null;
  let loading = true;
  let visibleGamesLimit = gamesPerPage;

  function syncEmulationSettings() {
    emulationSettings.hidden = !emulationContextInput.checked;
  }

  emulationContextInput.addEventListener('change', syncEmulationSettings);
  syncEmulationSettings();

  function updateCount() {
    const countValue = ratings.size;
    count.textContent = countValue ? `${countValue} ${countValue === 1 ? 'jogo marcado' : 'jogos marcados'}` : 'Opcional';
  }

  function updateGames() {
    const query = search.value.trim().toLocaleLowerCase('pt-BR');
    const visibleGames = games.filter((game) => {
      const matchesSearch = !query || `${game.title} ${game.franchise || ''}`.toLocaleLowerCase('pt-BR').includes(query);
      return matchesSearch;
    });
    const gamesToRender = query ? visibleGames : visibleGames.slice(0, visibleGamesLimit);
    const showMoreButton = !query && visibleGames.length > gamesToRender.length
      ? `<div class="profile-game-load-more-wrap"><button class="profile-game-load-more" type="button">VER MAIS JOGOS <span aria-hidden="true">↓</span></button><p>Mostrando ${gamesToRender.length} de ${visibleGames.length}</p></div>`
      : '';

    list.innerHTML = loading
      ? '<p class="profile-feedback">Carregando o catálogo inicial…</p>'
      : visibleGames.length
        ? `${gamesToRender.map((game) => renderGameCard(game, ratings.get(game.id))).join('')}${showMoreButton}`
        : '<p class="profile-feedback">Nenhum jogo encontrado. Tente outro nome.</p>';
    updateCount();
  }

  function setFeedback(message, tone = 'info') {
    feedback.textContent = message;
    feedback.dataset.tone = tone;
  }

  function setPreferencesFeedback(message, tone = 'info') {
    preferencesFeedback.textContent = message;
    preferencesFeedback.dataset.tone = tone;
  }

  function showProfileStep(step) {
    const showPreferences = step === 'preferences';
    screen.classList.toggle('profile-screen--games', !showPreferences);
    preferencesStep.hidden = !showPreferences;
    gamesStep.hidden = showPreferences;
    backButton.hidden = showPreferences;
    stepActions.hidden = showPreferences;
    profileTitle.textContent = showPreferences ? 'Onde começa sua jornada?' : 'Agora, vamos aos jogos';
    profileIntro.textContent = showPreferences
      ? 'Primeiro, vamos ajustar suas formas de jogar.'
      : 'Marque o que jogou, gostou ou não quer repetir. Isso ajuda a calibrar as sugestões.';
    if (!showPreferences) search.focus({ preventScroll: true });
  }

  async function loadSetup() {
    try {
      const session = await getSignedInSave();
      if (!session) {
        window.location.hash = 'login';
        return;
      }

      loadedProgress = session.save.progress || {};
      const profile = loadedProgress.profile || {};
      ratings = new Map((profile.gameSignals || []).map(({ gameId, status }) => [gameId, status]));
      if (typeof profile.replayAllowed === 'boolean') replayAllowedInput.checked = profile.replayAllowed;
      if ([1, 2, 3, 4].includes(Number(profile.maxEmulationTier))) {
        const savedTier = view.querySelector(`[name="maxEmulationTier"][value="${Number(profile.maxEmulationTier)}"]`);
        if (savedTier) savedTier.checked = true;
      }

      if (Array.isArray(profile.playContexts)) {
        view.querySelectorAll('[name="playContext"]').forEach((input) => {
          input.checked = profile.playContexts.includes(input.value);
        });
      }
      syncEmulationSettings();

      games = interleaveCatalogByFranchise(await session.backend.loadGameCatalog());
      loading = false;
      if (!games.length) throw new Error('EMPTY_CATALOG');
      updateGames();
      submitButton.disabled = false;

      if (games.some((game) => game.source === 'atlas' && !game.cover_url)) {
        void fillMissingCovers(session.backend);
      }
    } catch (error) {
      loading = false;
      list.innerHTML = '';
      const message = error.message === 'EMPTY_CATALOG'
        ? 'O catálogo ainda está vazio. Execute supabase/seed_games.sql no SQL Editor do Supabase.'
        : ['42P01', 'PGRST205'].includes(error.code)
          ? 'A tabela de jogos ainda não existe. Execute supabase/seed_games.sql no SQL Editor do Supabase.'
          : ['42703', 'PGRST204'].includes(error.code)
            ? 'Atualize o catálogo executando novamente a versão atual de supabase/seed_games.sql no SQL Editor do Supabase.'
            : ['42501', 'PGRST301'].includes(error.code)
              ? 'A conta não tem acesso ao catálogo. Execute supabase/seed_games.sql no SQL Editor do Supabase.'
              : 'Não foi possível carregar os jogos. Confira a conexão e a configuração do Supabase.';
      setFeedback(message, 'error');
      list.innerHTML = `<p class="profile-feedback" data-tone="error">${escapeHTML(message)}</p>`;
      submitButton.disabled = true;
    }
  }

  search.addEventListener('input', updateGames);
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') event.preventDefault();
  });
  async function fillMissingCovers(backend) {
    try {
      let offset = 0;
      let coversChanged = false;
      while (true) {
        const result = await backend.backfillIGDBCovers(offset);
        if (!result) break;
        if (result.updated) coversChanged = true;
        if (!result.hasMore || result.nextOffset <= offset) break;
        offset = result.nextOffset;
      }
      if (coversChanged) {
        games = interleaveCatalogByFranchise(await backend.loadGameCatalog());
        updateGames();
      }
    } catch (error) {
      console.warn('Não foi possível carregar automaticamente as capas pendentes do catálogo.', error);
    }
  }

  continueButton.addEventListener('click', () => {
    const playContexts = [...form.querySelectorAll('[name="playContext"]:checked')];
    if (!playContexts.length) {
      setPreferencesFeedback('Escolha pelo menos uma forma de jogar para continuar.', 'error');
      return;
    }
    if (emulationContextInput.checked && !form.querySelector('[name="maxEmulationTier"]:checked')) {
      setPreferencesFeedback('Escolha até que nível seu computador roda emulação para filtrar jogos compatíveis.', 'error');
      return;
    }
    setPreferencesFeedback('');
    showProfileStep('games');
  });

  backButton.addEventListener('click', () => {
    showProfileStep('preferences');
    continueButton.focus({ preventScroll: true });
  });

  list.addEventListener('click', (event) => {
    if (event.target.closest('.profile-game-load-more')) {
      visibleGamesLimit += gamesPerPage;
      updateGames();
      return;
    }

    const button = event.target.closest('.profile-signal');
    if (!button) return;
    const gameId = button.closest('.profile-game-signals').dataset.gameId;
    const nextStatus = button.dataset.status;
    if (ratings.get(gameId) === nextStatus) ratings.delete(gameId);
    else ratings.set(gameId, nextStatus);
    updateGames();
  });

  signoutButton.addEventListener('click', async () => {
    const backend = window.AtlasBackend;
    if (!backend?.client) return;
    signoutButton.disabled = true;
    try {
      const { error } = await backend.client.auth.signOut();
      if (error) throw error;
      window.location.hash = 'home';
    } catch {
      setFeedback('Não foi possível sair da conta. Tente novamente.', 'error');
      signoutButton.disabled = false;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!preferencesStep.hidden) {
      continueButton.click();
      return;
    }
    const playContexts = [...form.querySelectorAll('[name="playContext"]:checked')].map((input) => input.value);
    if (!playContexts.length) {
      setFeedback('Escolha pelo menos uma forma de jogar para filtrar a primeira sugestão.', 'error');
      return;
    }
    const maxEmulationTierInput = form.querySelector('[name="maxEmulationTier"]:checked');
    if (playContexts.includes('pc-emulation') && !maxEmulationTierInput) {
      showProfileStep('preferences');
      setPreferencesFeedback('Escolha até que nível seu computador roda emulação para filtrar jogos compatíveis.', 'error');
      submitButton.disabled = false;
      return;
    }

    const backend = window.AtlasBackend;
    submitButton.disabled = true;
    setFeedback('Organizando seu ponto de partida…');
    try {
      const profile = {
        ...(loadedProgress.profile || {}),
        setupComplete: true,
        gameSignals: [...ratings].map(([gameId, status]) => ({ gameId, status })),
        playContexts,
        replayAllowed: replayAllowedInput.checked,
        maxEmulationTier: playContexts.includes('pc-emulation') ? Number(maxEmulationTierInput.value) : null,
        updatedAt: new Date().toISOString(),
      };
      const suggestion = window.AtlasRecommendations.recommendFirstGame(games, profile, [], loadedProgress);
      if (!suggestion) {
        setFeedback('Não há jogos disponíveis com esse acesso, limite de emulação e progressão de séries. Revise as preferências ou marque mais jogos conhecidos.', 'error');
        submitButton.disabled = false;
        return;
      }
      const nextProgress = {
        ...loadedProgress,
        profile,
        firstRecommendation: {
          gameId: suggestion.game.id,
          reason: suggestion.reason,
          seenGameIds: [],
          generatedAt: new Date().toISOString(),
        },
      };
      await backend.saveProgress(nextProgress);
      navigateTo('first-game');
    } catch {
      setFeedback('Não foi possível salvar seu perfil. Confira a conexão e tente novamente.', 'error');
      submitButton.disabled = false;
    }
  });

  loadSetup();
  return () => {};
}

function renderFirstGame() {
  view.innerHTML = `
    <section class="profile-screen first-game-screen" aria-labelledby="first-game-title">
      <img class="profile-screen__backdrop" src="assets/img/atlas-title-scene.png" alt="" />
      <div class="first-game-shell">
        <header class="profile-heading">
          <div>
            <p class="login-eyebrow">SUA PRIMEIRA SUGESTÃO</p>
            <h1 id="first-game-title">Um primeiro território para explorar</h1>
            <p>O Atlas cruzou seus interesses com novas possibilidades para abrir a Jornada.</p>
          </div>
          <button class="profile-signout" type="button">Sair da conta</button>
        </header>
        <article class="first-game-card is-loading" aria-live="polite">
          <div class="first-game-loading">
            <span class="first-game-loading__compass" aria-hidden="true"><i></i></span>
            <p class="login-eyebrow">CONSULTANDO SEU MAPA</p>
            <p class="profile-feedback" role="status">Preparando sua sugestão…</p>
          </div>
        </article>
      </div>
    </section>
  `;

  const card = view.querySelector('.first-game-card');
  const signoutButton = view.querySelector('.profile-signout');
  let loadedProgress = null;
  let games = [];
  let saving = false;
  let revealAnimationHandler = null;

  function setMessage(message, tone = 'info') {
    const feedback = card.querySelector('.profile-feedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.dataset.tone = tone;
  }

  function renderSuggestion(suggestionState) {
    const game = games.find((candidate) => candidate.id === suggestionState.gameId);
    if (!game) {
      card.classList.remove('is-loading', 'is-shuffling', 'is-revealing');
      card.innerHTML = '<p class="profile-feedback" data-tone="error">Não encontramos esse jogo no catálogo. Volte às seleções para gerar outra sugestão.</p><a class="profile-secondary-link" href="#profile-setup">Editar meu perfil</a>';
      return;
    }

    const profile = loadedProgress.profile || {};
    const isChosen = loadedProgress.currentMilestone?.gameId === game.id;
    const tags = [...new Set([...(game.genre_tags || []), ...(game.mechanic_tags || [])])].slice(0, 5);
    const tagChips = tags.map((tag) => `<span class="first-game-tag">${escapeHTML(window.AtlasRecommendations.formatTag(tag))}</span>`).join('');
    const description = game.short_description || 'Uma experiência escolhida para ampliar seu repertório.';
    const reason = suggestionState.reason || 'É uma experiência curada para ampliar seu repertório.';
    const yearLabel = game.release_year ? `Lançado em ${game.release_year}` : 'Uma experiência da sua seleção';
    const chosenMessage = isChosen
      ? `<p class="first-game-feedback" role="status">${escapeHTML(game.title)} ficou registrado como seu ponto de partida.</p>`
      : '';
    const cover = typeof game.cover_url === 'string' && /^https:\/\/images\.igdb\.com\//.test(game.cover_url)
      ? `<img class="first-game-art__image" src="${escapeHTML(game.cover_url)}" alt="Capa de ${escapeHTML(game.title)}" fetchpriority="high" />`
      : `<div class="first-game-art__placeholder" role="img" aria-label="Capa de ${escapeHTML(game.title)} indisponível">${escapeHTML(game.title.slice(0, 1))}</div>`;

    if (revealAnimationHandler) {
      card.removeEventListener('animationend', revealAnimationHandler);
      revealAnimationHandler = null;
    }
    card.classList.remove('is-loading', 'is-shuffling', 'is-revealing');
    card.innerHTML = `
      <div class="first-game-art">
        ${cover}
        <span class="first-game-art__caption">ARQUIVO DO ATLAS</span>
      </div>
      <div class="first-game-card__copy">
        <p class="login-eyebrow">${escapeHTML(game.franchise || 'DESCOBERTA')}</p>
        <h2>${escapeHTML(game.title)}</h2>
        <p class="first-game-year">${escapeHTML(yearLabel)} · ${escapeHTML(getPlatformNames(game.platforms || []))}</p>
        <p class="first-game-description">${escapeHTML(description)}</p>
        <div class="first-game-reason">
          <span>POR QUE ESTE JOGO?</span>
          <p>${escapeHTML(reason)}</p>
        </div>
        <div class="first-game-tags">${tagChips}</div>
      </div>
      <div class="first-game-actions">
        <p class="first-game-actions__eyebrow">UM CAMINHO PARA COMEÇAR</p>
        <button class="button primary first-game-choose" type="button"${isChosen ? ' disabled' : ''}>
          <span>${isChosen ? 'PONTO DE PARTIDA DEFINIDO' : 'COMEÇAR POR ESTE JOGO'}</span><span aria-hidden="true">→</span>
        </button>
        <button class="first-game-another" type="button">Ver outra sugestão</button>
        <a class="profile-secondary-link" href="#profile-setup">Editar minhas seleções</a>
        ${chosenMessage}
        <p class="profile-feedback first-game-feedback-line" role="status" aria-live="polite"></p>
      </div>
    `;
    const coverImage = card.querySelector('.first-game-art__image');
    coverImage?.addEventListener('error', () => {
      const fallback = document.createElement('div');
      fallback.className = 'first-game-art__placeholder';
      fallback.setAttribute('role', 'img');
      fallback.setAttribute('aria-label', `Capa de ${game.title} indisponível`);
      fallback.textContent = game.title.slice(0, 1);
      coverImage.replaceWith(fallback);
    }, { once: true });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void card.offsetWidth;
      card.classList.add('is-revealing');
      revealAnimationHandler = (event) => {
        if (event.target !== card) return;
        card.classList.remove('is-revealing');
        card.removeEventListener('animationend', revealAnimationHandler);
        revealAnimationHandler = null;
      };
      card.addEventListener('animationend', revealAnimationHandler);
    }

    const chooseButton = card.querySelector('.first-game-choose');
    const anotherButton = card.querySelector('.first-game-another');

    chooseButton.addEventListener('click', async () => {
      if (saving) return;
      saving = true;
      chooseButton.disabled = true;
      chooseButton.querySelector('span:first-child').textContent = 'SALVANDO…';
      try {
        const session = await getSignedInSave();
        if (!session) {
          window.location.hash = 'login';
          return;
        }
        const profile = { ...(session.save.progress.profile || {}) };
        if (game.series_key && game.series_path && game.series_path !== 'common') {
          profile.seriesPaths = { ...(profile.seriesPaths || {}), [game.series_key]: game.series_path };
        }
        const newProgress = {
          ...session.save.progress,
          profile,
          currentMilestone: { gameId: game.id, status: 'chosen', chosenAt: new Date().toISOString() },
        };
        await session.backend.saveProgress(newProgress);
        loadedProgress = newProgress;
        renderSuggestion(suggestionState);
      } catch {
        chooseButton.disabled = false;
        chooseButton.querySelector('span:first-child').textContent = 'TENTAR NOVAMENTE';
        setMessage('Não foi possível guardar sua escolha. Tente novamente.', 'error');
      } finally {
        saving = false;
      }
    });

    anotherButton.addEventListener('click', async () => {
      if (saving) return;
      saving = true;
      anotherButton.disabled = true;
      anotherButton.textContent = 'Buscando outra possibilidade…';
      try {
        const session = await getSignedInSave();
        if (!session) {
          window.location.hash = 'login';
          return;
        }
        const prior = session.save.progress.firstRecommendation || suggestionState;
        const excludedIds = [...new Set([...(prior.seenGameIds || []), prior.gameId])];
        const next = window.AtlasRecommendations.recommendFirstGame(
          games,
          session.save.progress.profile || {},
          excludedIds,
          session.save.progress,
        );
        if (!next) {
          anotherButton.disabled = false;
          anotherButton.textContent = 'Tentar outra vez';
          setMessage('Não há outra opção neste catálogo com as suas opções atuais de acesso e rejogo.', 'error');
          return;
        }
        const newRecommendation = {
          gameId: next.game.id,
          reason: next.reason,
          seenGameIds: excludedIds,
          generatedAt: new Date().toISOString(),
        };
        const newProgress = { ...session.save.progress, firstRecommendation: newRecommendation };
        await session.backend.saveProgress(newProgress);
        loadedProgress = newProgress;
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          card.classList.add('is-shuffling');
          await new Promise((resolve) => window.setTimeout(resolve, 220));
        }
        renderSuggestion(newRecommendation);
      } catch {
        anotherButton.disabled = false;
        anotherButton.textContent = 'Tentar outra vez';
        setMessage('Não foi possível buscar outra sugestão. Tente novamente.', 'error');
      } finally {
        saving = false;
      }
    });
  }

  async function loadRecommendation() {
    try {
      const session = await getSignedInSave();
      if (!session) {
        window.location.hash = 'login';
        return;
      }
      loadedProgress = session.save.progress || {};
      if (!loadedProgress.profile?.setupComplete) {
        window.location.hash = 'profile-setup';
        return;
      }
      games = await session.backend.loadGameCatalog();
      if (!games.length) {
        const emptyCatalogError = new Error('EMPTY_CATALOG');
        emptyCatalogError.code = 'EMPTY_CATALOG';
        throw emptyCatalogError;
      }
      const savedRecommendation = loadedProgress.firstRecommendation;
      let suggestionState = savedRecommendation && window.AtlasRecommendations.isGameEligible(
        games,
        savedRecommendation.gameId,
        loadedProgress.profile,
        loadedProgress,
      ) ? savedRecommendation : null;
      let suggestion = suggestionState
        ? { game: games.find((game) => game.id === suggestionState.gameId), reason: suggestionState.reason }
        : window.AtlasRecommendations.recommendFirstGame(games, loadedProgress.profile, [], loadedProgress);

      if (!suggestion) {
        card.classList.remove('is-loading');
        card.innerHTML = '<p class="profile-feedback" data-tone="error">Não há jogos disponíveis com esse acesso e a progressão atual das séries. Edite suas preferências ou marque jogos anteriores como conhecidos.</p><a class="profile-secondary-link" href="#profile-setup">Editar meu perfil</a>';
        return;
      }

      if (!suggestionState || suggestionState.gameId !== suggestion.game.id) {
        suggestionState = {
          gameId: suggestion.game.id,
          reason: suggestion.reason,
          seenGameIds: [],
          generatedAt: new Date().toISOString(),
        };
        loadedProgress = { ...loadedProgress, firstRecommendation: suggestionState };
        await session.backend.saveProgress(loadedProgress);
      }
      renderSuggestion(suggestionState);
    } catch (error) {
      const message = error.code === 'EMPTY_CATALOG' || ['42P01', 'PGRST205'].includes(error.code)
        ? 'O catálogo ainda não foi instalado. Execute supabase/seed_games.sql no SQL Editor do Supabase.'
        : ['42703', 'PGRST204'].includes(error.code)
          ? 'Atualize o catálogo executando novamente a versão atual de supabase/seed_games.sql no SQL Editor do Supabase.'
          : 'Não foi possível carregar a sugestão. Confira a conexão e o catálogo do Supabase.';
      card.classList.remove('is-loading');
      card.innerHTML = `<p class="profile-feedback" data-tone="error">${escapeHTML(message)}</p><a class="profile-secondary-link" href="#profile-setup">Editar minhas seleções</a>`;
    }
  }

  signoutButton.addEventListener('click', async () => {
    const backend = window.AtlasBackend;
    if (!backend?.client) return;
    signoutButton.disabled = true;
    try {
      const { error } = await backend.client.auth.signOut();
      if (error) throw error;
      window.location.hash = 'home';
    } catch {
      signoutButton.disabled = false;
    }
  });

  loadRecommendation();
  return () => {};
}

window.addEventListener('hashchange', renderRoute);
desktopViewport.addEventListener('change', renderRoute);
renderRoute();
