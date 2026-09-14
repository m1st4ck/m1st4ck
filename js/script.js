const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const reports = [
  {
    title: "Report title one",
    date: "2026",
    tag: "Research",
    summary: "One short sentence summarizing what this report covers.",
    detail: "Write a longer description here. Cover the context, what you set out to do, the method you used, and the main findings or conclusions.",
    link: "https://your-link-here.com"
  },
  {
    title: "Report title two",
    date: "2025",
    tag: "Case study",
    summary: "One short sentence summarizing what this report covers.",
    detail: "Write a longer description here. Cover the context, what you set out to do, the method you used, and the main findings or conclusions.",
    link: "https://your-link-here.com"
  },
  {
    title: "Report title three",
    date: "2025",
    tag: "Whitepaper",
    summary: "One short sentence summarizing what this report covers.",
    detail: "Write a longer description here. Cover the context, what you set out to do, the method you used, and the main findings or conclusions.",
    link: "https://your-link-here.com"
  }
];

function renderReports() {
  const list = document.getElementById("report-list");
  if (!list) return;

  reports.forEach((report) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "report-item reveal";
    item.innerHTML = `
      <div class="report-main">
        <h3>${report.title}</h3>
        <p>${report.summary}</p>
      </div>
      <div class="report-meta">
        <span>${report.tag}</span>
        <span>${report.date}</span>
      </div>
    `;
    item.addEventListener("click", () => openReport(report));
    list.appendChild(item);
  });
}

function openReport(report) {
  document.getElementById("modal-meta").textContent = `${report.tag} — ${report.date}`;
  document.getElementById("modal-title").textContent = report.title;
  document.getElementById("modal-detail").textContent = report.detail;
  document.getElementById("modal-link").href = report.link;
  document.getElementById("report-modal").classList.add("open");
  document.getElementById("report-modal").setAttribute("aria-hidden", "false");
}

function closeReport() {
  document.getElementById("report-modal").classList.remove("open");
  document.getElementById("report-modal").setAttribute("aria-hidden", "true");
}

function initModal() {
  document.getElementById("modal-close").addEventListener("click", closeReport);
  document.getElementById("modal-backdrop").addEventListener("click", closeReport);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeReport();
  });
}

function initReveal() {
  const groups = document.querySelectorAll(".project-grid, .report-list");
  groups.forEach((group) => {
    const items = group.querySelectorAll(":scope > .reveal");
    items.forEach((el, i) => {
      el.style.transitionDelay = `${i * 0.08}s`;
    });
  });

  const items = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    items.forEach((el) => el.classList.add("in-view"));
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
    { threshold: 0.15 }
  );

  items.forEach((el) => observer.observe(el));
}

function initParallax() {
  if (prefersReducedMotion) return;
  const layers = document.querySelectorAll("[data-parallax]");
  if (!layers.length) return;

  let ticking = false;

  function update() {
    const y = window.scrollY;
    layers.forEach((el) => {
      const depth = parseFloat(el.dataset.parallax || "0");
      el.style.transform = `translateY(${y * depth}px)`;
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
}

function initActiveNav() {
  const links = document.querySelectorAll(".nav-item");
  const sections = Array.from(links)
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = "#" + entry.target.id;
          links.forEach((l) => {
            l.style.color = l.getAttribute("href") === id ? "var(--accent)" : "";
          });
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((s) => observer.observe(s));
}

function initPlayer() {
  const audio = document.getElementById("audio");
  const toggleBtn = document.getElementById("play-toggle");
  const label = document.getElementById("player-label");
  const iconPlay = document.getElementById("icon-play");
  const iconPause = document.getElementById("icon-pause");

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

    [110, 165].forEach((f) => {
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

      fallbackNodes.push({ osc, filter });
    });

    const lfo = fallbackCtx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = fallbackCtx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    fallbackNodes.forEach(({ filter }) => lfoGain.connect(filter.frequency));
    lfo.start();
    fallbackNodes.push({ osc: lfo });

    label.textContent = "Ambient (demo)";
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
        label.textContent = "Now playing";
      })
      .catch(() => {
        usingFallback = true;
        startFallbackAmbient();
      });
    isPlaying = true;
    iconPlay.classList.add("hidden");
    iconPause.classList.remove("hidden");
  }

  function pause() {
    audio.pause();
    if (usingFallback) stopFallbackAmbient();
    isPlaying = false;
    iconPlay.classList.remove("hidden");
    iconPause.classList.add("hidden");
    label.textContent = "Music";
  }

  toggleBtn.addEventListener("click", () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  });

  audio.addEventListener("error", () => {
    usingFallback = true;
  });
}

renderReports();
initModal();
initReveal();
initParallax();
initActiveNav();
initPlayer();
