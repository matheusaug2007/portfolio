document.addEventListener('DOMContentLoaded', async () => {

  // Espera o conteúdo do Supabase (ou o tempo limite) antes de ligar animações e eventos
  try { await window.contentReady; } catch (e) { /* segue com o HTML estático */ }

  // E-mail montado no navegador (evita coleta por robôs de spam)
  const emailLink = document.getElementById('emailLink');
  if (emailLink) {
    emailLink.href = 'mailto:' + emailLink.dataset.u + '@' + emailLink.dataset.d;
  }

  // ══════════════════════════════════════════════════
  // 1. CURSOR PERSONALIZADO (Desktop)
  // ══════════════════════════════════════════════════
  const cursor = document.getElementById('customCursor');
  const ring = document.getElementById('customCursorRing');

  if (cursor && ring) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    // Adicionar eventos de hover nos botões e links
    function updateHoverListeners() {
      const interactiveElements = document.querySelectorAll('a, button, input, textarea, .project-card, .about-photo-frame');
      interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', () => {
          document.body.classList.add('hover-active');
        });
        el.addEventListener('mouseleave', () => {
          document.body.classList.remove('hover-active');
        });
      });
    }
    updateHoverListeners();
  }

  // ══════════════════════════════════════════════════
  // 2. HEADER SCROLLED
  // ══════════════════════════════════════════════════
  const header = document.getElementById('header');
  // O logo do cabeçalho só aparece depois que a Hero sai da tela
  const homeSection = document.getElementById('home');
  function updateHeader() {
    header.classList.toggle('scrolled', window.scrollY > 40);
    document.body.classList.toggle('is-intro', window.scrollY < 40); // primeira tela: só o nome
    const heroGone = !homeSection || homeSection.getBoundingClientRect().bottom < 110;
    header.classList.toggle('logo-on', heroGone);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
  // quem navega pelo teclado precisa enxergar o menu: Tab libera o cabeçalho na primeira tela
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') document.body.classList.remove('is-intro');
  });

  // ══════════════════════════════════════════════════
  // 3. MENU HAMBÚRGUER (Mobile)
  // ══════════════════════════════════════════════════
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // ══════════════════════════════════════════════════
  // 4. REVEAL AO SCROLL (Intersection Observer)
  // ══════════════════════════════════════════════════
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(el => observer.observe(el));

  // ══════════════════════════════════════════════════
  // 5. DARK MODE
  // ══════════════════════════════════════════════════
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');

    if (document.body.classList.contains('dark-theme')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  });

  // ══════════════════════════════════════════════════
  // 6. SCROLL PROGRESS BAR
  // ══════════════════════════════════════════════════
  const scrollProgress = document.getElementById('scrollProgress');

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = scrollPercent + '%';
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  // ══════════════════════════════════════════════════
  // 10. PHOTO REVEAL AO SCROLL
  // ══════════════════════════════════════════════════
  const photoReveal = document.getElementById('photoReveal');
  const photoMask = document.getElementById('photoRevealMask');

  if (photoReveal && photoMask) {
    function updatePhotoReveal() {
      const rect = photoReveal.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Começar o reveal quando a foto entra na tela por baixo
      const startReveal = windowH;
      const endReveal = windowH * 0.3;

      if (rect.top >= startReveal) {
        // Ainda não entrou na tela — totalmente coberta
        photoMask.style.transform = 'scaleY(1)';
      } else if (rect.top <= endReveal) {
        // Totalmente revelada
        photoMask.style.transform = 'scaleY(0)';
      } else {
        // Em progresso — calcular a porcentagem
        const progress = 1 - (rect.top - endReveal) / (startReveal - endReveal);
        const maskScale = 1 - progress;
        photoMask.style.transform = `scaleY(${Math.max(0, maskScale)})`;
      }
    }

    window.addEventListener('scroll', updatePhotoReveal, { passive: true });
    updatePhotoReveal();
  }

  // ══════════════════════════════════════════════════
  // 12. STAGGER ANIMATION NOS SKILL BADGES
  // ══════════════════════════════════════════════════
  const staggerContainers = document.querySelectorAll('.stagger-container');

  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const items = entry.target.querySelectorAll('.stagger-item');
        items.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add('stagger-visible');
          }, index * 120);
        });
        staggerObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '0px 0px -20px 0px'
  });

  staggerContainers.forEach(container => staggerObserver.observe(container));

  // ══════════════════════════════════════════════════
  // 13. EFEITO MAGNÉTICO NOS LINKS DE CONTATO
  // ══════════════════════════════════════════════════
  const magneticElements = document.querySelectorAll('.magnetic');

  magneticElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Movimento suave seguindo o cursor dentro do elemento
      const moveX = x * 0.3;
      const moveY = y * 0.3;

      el.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.08)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0) scale(1)';
    });
  });

  // ══════════════════════════════════════════════════
  // 14. LINK ATIVO NO MENU (conforme a seção visível)
  // ══════════════════════════════════════════════════
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  const sectionMap = new Map();
  navAnchors.forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (sec) sectionMap.set(sec, a);
  });

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navAnchors.forEach((a) => a.classList.remove('active'));
        sectionMap.get(entry.target).classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sectionMap.forEach((_, sec) => navObserver.observe(sec));

  // ══════════════════════════════════════════════════
  // 15. MANIFESTO + VITRINE DE PROJETOS (guiados pelo scroll)
  // ══════════════════════════════════════════════════
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

  // quanto da seção "alta" já foi rolado (0 a 1) — a parte fixa (sticky) dura (altura - tela)
  const sectionProgress = (el) => {
    const total = el.offsetHeight - window.innerHeight;
    return total > 0 ? clamp(-el.getBoundingClientRect().top / total) : 0;
  };

  // ── Manifesto: as palavras vão acendendo ──
  const manifesto = document.getElementById('manifesto');
  const manifestoText = document.getElementById('manifestoText');
  const manifestoMeter = document.getElementById('manifestoMeter');
  let manifestoWords = [];

  if (manifesto && manifestoText) {
    const frag = document.createDocumentFragment();
    [...manifestoText.childNodes].forEach((node) => {
      const hl = node.nodeType === 1 && node.classList.contains('hl');
      node.textContent.split(/\s+/).filter(Boolean).forEach((word) => {
        const span = document.createElement('span');
        span.className = 'mw' + (hl ? ' hl' : '');
        span.textContent = word;
        frag.appendChild(span);
      });
    });
    manifestoText.replaceChildren(frag);
    manifestoWords = [...manifestoText.children];
  }

  function updateManifesto() {
    if (!manifestoWords.length) return;
    const p = sectionProgress(manifesto);
    const n = manifestoWords.length;
    manifestoWords.forEach((w, i) => {
      const lit = clamp(p * 1.2 * n - i);
      w.style.opacity = (0.13 + 0.87 * lit).toFixed(3);
      w.style.transform = 'translateY(' + ((1 - lit) * 18).toFixed(1) + 'px)';
    });
    if (manifestoMeter) manifestoMeter.style.width = (p * 100).toFixed(1) + '%';
  }

  // ── Vitrine de projetos ──
  const track = document.getElementById('showcaseTrack');
  const stage = document.getElementById('showcaseStage');
  let updateShowcase = () => {};
  let fitFrames = () => {};

  if (track && stage) {
    const shots = [...track.querySelectorAll('.sc-shot')];
    const texts = [...track.querySelectorAll('.sc-text')];
    const dotsBox = document.getElementById('scDots');
    const urlEl = document.getElementById('scUrl');
    const openEl = document.getElementById('scOpen');
    const screenEl = document.getElementById('scScreen');
    const N = Math.min(shots.length, texts.length);
    const steps = N + 1; // projetos + painel final
    track.style.setProperty('--steps', steps);

    // numeração "01 / 03" e bolinhas
    texts.forEach((t, i) => {
      const n = document.createElement('span');
      n.className = 'sc-n';
      n.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
      t.prepend(n);
    });
    const dots = [];
    for (let i = 0; i < N; i++) {
      const d = document.createElement('i');
      dotsBox.appendChild(d);
      dots.push(d);
    }

    const hostOf = (u) => { try { return new URL(u).host; } catch (e) { return ''; } };
    let active = -1;
    function setActive(idx) {
      if (idx === active) return;
      active = idx;
      shots.forEach((el, i) => el.classList.toggle('active', i === idx));
      texts.forEach((el, i) => el.classList.toggle('active', i === idx));
      dots.forEach((el, i) => el.classList.toggle('on', i === idx));
      stage.classList.toggle('is-end', idx >= N);
      if (idx < N && urlEl) urlEl.textContent = hostOf(shots[idx].dataset.url);
      // tela clicável: abre o projeto que está na vitrine agora
      if (openEl) {
        if (idx < N) {
          const title = texts[idx].querySelector('.project-title');
          openEl.href = shots[idx].dataset.url;
          openEl.setAttribute('aria-label', 'Abrir projeto ' + (title ? title.textContent : ''));
          openEl.tabIndex = 0;
        } else {
          openEl.tabIndex = -1;
        }
      }
    }

    // o site real roda dentro do dispositivo, em tamanho "de verdade" e reduzido para caber
    const mobileMQ = window.matchMedia('(max-width: 768px)');
    fitFrames = function () {
      const w = screenEl.clientWidth;
      const h = screenEl.clientHeight;
      if (!w) return;
      const nativeW = mobileMQ.matches ? 390 : 1280;
      const scale = w / nativeW;
      track.querySelectorAll('.sc-frame').forEach((fr) => {
        fr.style.width = nativeW + 'px';
        fr.style.height = (h / scale) + 'px';
        fr.style.transform = 'scale(' + scale + ')';
      });
    };

    // só carrega os sites quando a vitrine está perto de aparecer
    let framesLoaded = false;
    function loadFrames() {
      if (framesLoaded) return;
      framesLoaded = true;
      track.querySelectorAll('.sc-frame').forEach((fr) => {
        fr.addEventListener('load', () => fr.parentElement.classList.add('loaded'));
        fr.src = fr.dataset.src;
      });
    }
    new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadFrames();
    }, { rootMargin: '100% 0px' }).observe(track);

    updateShowcase = function () {
      const p = sectionProgress(track);
      track.style.setProperty('--p', p.toFixed(4));
      setActive(Math.min(N, Math.floor(p * steps)));
    };
  }

  // ══════════════════════════════════════════════════
  // 16. GOTA ACOMPANHA O SCROLL (do nome até o ponto final da frase)
  // ══════════════════════════════════════════════════
  // A gota (#heroOrb) é fixa na tela. Em repouso ela fica onde está #orbHome (atrás do nome).
  // Ao rolar, sai desse ponto e vai até #orbAnchor (o "." depois de "um pouco de mim"),
  // encolhendo até o tamanho do ponto. O progresso vem só do scroll: sem relógio, sem salto.
  const orbEl = document.getElementById('heroOrb');
  const orbHome = document.getElementById('orbHome');
  const orbAnchor = document.getElementById('orbAnchor');
  const introSection = document.getElementById('intro');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const SPHERE = 0.7; // a esfera ocupa cerca de 70% do canvas da gota
  const orb = { size: 0, hx: 0, hy: 0, ax: 0, ay: 0, aw: 0 };

  // posição no documento ignorando transforms (a frase entra com transform, e isso não deve mexer na meta)
  function docCenter(el) {
    let x = 0, y = 0;
    for (let n = el; n; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
    return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2, w: el.offsetWidth, h: el.offsetHeight };
  }

  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function measureOrb() {
    if (!orbEl || !orbHome) return;
    const h = docCenter(orbHome);
    // #orbHome usa translate:-50% no X: o centro dele é a própria borda esquerda
    orb.size = h.w;
    orb.hx = h.x - h.w / 2;
    orb.hy = h.y;
    if (orbAnchor) {
      const a = docCenter(orbAnchor);
      orb.ax = a.x; orb.ay = a.y; orb.aw = a.w;
    }
    orbEl.style.width = orbEl.style.height = orb.size + 'px';
    orbEl.classList.add('is-placed');
    updateOrb();
  }

  function updateOrb() {
    if (!orbEl || !orb.size) return;
    const sy = window.scrollY;
    let cx = orb.hx, cy = orb.hy - sy, sc = 1, p = 0;

    if (reduceMotion.matches || !orbAnchor) {
      // sem viagem: a gota fica na Hero e rola junto com a página
    } else {
      const vh = window.innerHeight;
      const end = orb.ay - 0.58 * vh;          // scroll em que o ponto final chega a 58% da tela
      p = end > 0 ? clamp(sy / end) : 1;
      const e = easeInOut(p);
      // meta = posição ATUAL do ponto final na tela (ele sobe com a página); até chegar,
      // a gota fica "presa" à tela e vai deslizando para a meta; ao chegar (e = 1) gruda nela
      cx = orb.hx + (orb.ax - orb.hx) * e;
      cy = orb.hy + ((orb.ay - sy) - orb.hy) * e;
      sc = 1 + ((orb.aw / (orb.size * SPHERE)) - 1) * e;
    }
    orbEl.dataset.p = p.toFixed(3);
    orbEl.style.transform = 'translate3d(' + (cx - orb.size / 2).toFixed(1) + 'px,' + (cy - orb.size / 2).toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')';
  }

  // a frase aparece linha por linha quando a seção entra na tela
  if (introSection) {
    new IntersectionObserver((entries, io) => {
      if (entries[0].isIntersecting) { introSection.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.2 }).observe(introSection);
  }

  measureOrb();
  if (document.fonts) document.fonts.ready.then(measureOrb);
  window.addEventListener('load', measureOrb);

  // um único handler de scroll (com requestAnimationFrame) para as duas seções
  let ticking = false;
  function onScrollScenes() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateManifesto();
      updateShowcase();
      updateOrb();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScrollScenes, { passive: true });
  window.addEventListener('resize', () => { fitFrames(); measureOrb(); onScrollScenes(); });
  fitFrames();
  updateManifesto();
  updateShowcase();

});

// "Ler mais" do Sobre (só aparece no celular, onde o segundo parágrafo começa recolhido)
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('aboutMore');
  const box = btn && btn.closest('.about-text');
  if (!btn || !box) return;
  btn.addEventListener('click', () => {
    const open = box.classList.toggle('expanded');
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('span').textContent = open ? (btn.dataset.less || 'Ler menos') : (btn.dataset.more || 'Ler mais');
  });
});
