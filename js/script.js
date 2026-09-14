// ==========================================================
// Boot sequence
// ==========================================================
(function boot() {
  const screen = document.getElementById("boot-screen");
  const log = document.getElementById("boot-log");
  const skipBtn = document.getElementById("skip-boot");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const lines = [
    "[  OK  ] Started Load Kernel Modules",
    "[  OK  ] Mounted /home/lanchi",
    "[  OK  ] Reached target Ricing Complete",
    "[  OK  ] Started i3 Window Manager",
    "arch login: lanchi",
    "Password: ****************",
    "Last login from 127.0.0.1",
    "$ ./launch-portfolio.sh",
  ];

  function finish() {
    screen.classList.add("hidden");
    setTimeout(() => screen.remove(), 600);
  }

  if (prefersReducedMotion) {
    finish();
    return;
  }

  let i = 0;
  function typeLine() {
    if (i >= lines.length) {
      setTimeout(finish, 500);
      return;
    }
    log.textContent += (i > 0 ? "\n" : "") + lines[i];
    i++;
    setTimeout(typeLine, 220);
  }
  typeLine();

  skipBtn.addEventListener("click", finish);
  // Safety net: never block the site for more than a few seconds.
  setTimeout(finish, 4000);
})();

// ==========================================================
// Status bar clock
// ==========================================================
(function clock() {
  const el = document.getElementById("clock");
  if (!el) return;
  function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    el.textContent = `${hh}:${mm}`;
  }
  tick();
  setInterval(tick, 15000);
})();

// ==========================================================
// Active workspace highlight on scroll
// ==========================================================
(function activeNav() {
  const links = document.querySelectorAll(".ws");
  const sections = Array.from(links)
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = "#" + entry.target.id;
          links.forEach((l) =>
            l.classList.toggle("active", l.getAttribute("href") === id)
          );
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px" }
  );

  sections.forEach((s) => observer.observe(s));
})();

// ==========================================================
// Scroll parallax
// ==========================================================
(function parallax() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) return;

  const layers = document.querySelectorAll(".parallax");
  if (!layers.length) return;

  let ticking = false;

  function update() {
    const y = window.scrollY;
    layers.forEach((el) => {
      const depth = parseFloat(el.dataset.depth || "0");
      el.style.transform = `translateY(${y * depth * -1}px)`;
    });
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  update();
})();

// ==========================================================
// Reveal achievement tiles on scroll
// ==========================================================
(function revealTiles() {
  const tiles = document.querySelectorAll(".tile");
  if (!tiles.length) return;

  if (!("IntersectionObserver" in window)) {
    tiles.forEach((t) => t.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  tiles.forEach((t) => observer.observe(t));
})();

// ==========================================================
// Music player
// ==========================================================
(function player() {
  const audio = document.getElementById("audio");
  const toggleBtn = document.getElementById("play-toggle");
  const trackName = document.getElementById("track-name");
  const playerEl = document.getElementById("player");

  let usingFallback = false;
  let fallbackCtx = null;
  let fallbackNodes = [];
  let isPlaying = false;

  function startFallbackAmbient() {
    if (fallbackCtx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    fallbackCtx = new Ctx();

    const masterGain = fallbackCtx.createGain();
    masterGain.gain.value = 0.05;
    masterGain.connect(fallbackCtx.destination);

    // Two slightly detuned oscillators for a soft ambient pad,
    // plus a slow filter sweep so it doesn't sit static.
    const freqs = [110, 165];
    freqs.forEach((f) => {
      const osc = fallbackCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;

      const gain = fallbackCtx.createGain();
      gain.gain.value = 0.5;

      const filter = fallbackCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(masterGain);
      osc.start();

      fallbackNodes.push({ osc, gain, filter });
    });

    // Slow LFO on filter cutoff for gentle movement.
    const lfo = fallbackCtx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = fallbackCtx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    fallbackNodes.forEach(({ filter }) => lfoGain.connect(filter.frequency));
    lfo.start();
    fallbackNodes.push({ osc: lfo });

    trackName.textContent = "không tìm thấy audio/theme.mp3 — phát nhạc nền demo";
  }

  function stopFallbackAmbient() {
    if (!fallbackCtx) return;
    fallbackNodes.forEach((n) => {
      try { n.osc.stop(); } catch (e) {}
    });
    fallbackCtx.close();
    fallbackCtx = null;
    fallbackNodes = [];
  }

  function play() {
    audio
      .play()
      .then(() => {
        usingFallback = false;
        trackName.textContent = "đang phát: theme.mp3";
      })
      .catch(() => {
        usingFallback = true;
        startFallbackAmbient();
      });
    isPlaying = true;
    toggleBtn.textContent = "❚❚";
    playerEl.classList.add("playing");
  }

  function pause() {
    audio.pause();
    if (usingFallback) stopFallbackAmbient();
    isPlaying = false;
    toggleBtn.textContent = "▶";
    playerEl.classList.remove("playing");
  }

  toggleBtn.addEventListener("click", () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  });

  // If the mp3 fails to even load (404), fall back immediately on next play.
  audio.addEventListener("error", () => {
    usingFallback = true;
  });
})();
