const view = document.querySelector('#view');

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
  let clickAudioContext = null;

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
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!clickAudioContext) clickAudioContext = new AudioContextClass();

    function playTone() {
      const now = clickAudioContext.currentTime;
      const envelope = clickAudioContext.createGain();
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(0.08, now + 0.009);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      envelope.connect(clickAudioContext.destination);

      [[392, 1, 'triangle'], [588, 0.24, 'sine']].forEach(([frequency, volume, type]) => {
        const oscillator = clickAudioContext.createOscillator();
        const voice = clickAudioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.88, now + 0.2);
        voice.gain.setValueAtTime(volume, now);
        oscillator.connect(voice);
        voice.connect(envelope);
        oscillator.start(now);
        oscillator.stop(now + 0.23);
      });
    }

    if (clickAudioContext.state === 'suspended') {
      clickAudioContext.resume().then(playTone).catch(() => {});
    } else {
      playTone();
    }
  }

  startButton.addEventListener('click', playStartClick);

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
    return;
  }

  startLoop();
}

renderEntry();
