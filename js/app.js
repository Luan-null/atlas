const view = document.querySelector('#view');
const startSound = document.querySelector('#entry-start-sound');
const desktopViewport = window.matchMedia('(min-width: 1024px) and (min-height: 600px)');
let cleanupCurrentScreen = () => {};
let routeTransitionTimer = 0;
let entrySession = null;

function getRoute() {
  return window.location.hash === '#login' ? 'login' : 'home';
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
      await backend.loadSave(user.id);
      setFeedback('Conta conectada. Seu save está pronto para receber o progresso do Atlas.', 'success');
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

window.addEventListener('hashchange', renderRoute);
desktopViewport.addEventListener('change', renderRoute);
renderRoute();
