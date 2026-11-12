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
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
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
  // 7. PARTÍCULAS FLUTUANTES (Canvas)
  // ══════════════════════════════════════════════════
  // ══════════════════════════════════════════════════
  const canvas = document.getElementById('particlesCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animFrameId;

    function resizeCanvas() {
      const hero = canvas.parentElement;
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.opacityDirection = Math.random() > 0.5 ? 1 : -1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Pulsar opacidade
        this.opacity += this.opacityDirection * 0.003;
        if (this.opacity > 0.6) this.opacityDirection = -1;
        if (this.opacity < 0.1) this.opacityDirection = 1;

        // Reposicionar se sair da tela
        if (this.x < -10 || this.x > canvas.width + 10 || this.y < -10 || this.y > canvas.height + 10) {
          this.reset();
        }
      }

      draw() {
        const isDark = document.body.classList.contains('dark-theme');
        const color = isDark ? `rgba(0, 180, 255, ${this.opacity})` : `rgba(0, 102, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    function initParticles() {
      resizeCanvas();
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 18000), 60);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    function drawLines() {
      const isDark = document.body.classList.contains('dark-theme');
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.15;
            const color = isDark ? `rgba(0, 180, 255, ${opacity})` : `rgba(0, 102, 255, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      drawLines();
      animFrameId = requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        cancelAnimationFrame(animFrameId);
        initParticles();
        animateParticles();
      }, 200);
    });
  }


  // ══════════════════════════════════════════════════
  // 8. TYPEWRITER NA HERO (Loop Contínuo)
  // ══════════════════════════════════════════════════
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    const defaultPhrases = [
      { text: 'Um pouco de mim e muito ', highlight: 'código', end: '.' },
      { text: 'Criando soluções com ', highlight: 'excelência', end: '.' },
      { text: 'Transformando ideias em ', highlight: 'realidade', end: '.' },
    ];
    const getPhrases = () => window.__heroPhrases || defaultPhrases;
    let currentPhrase = 0;

    heroTitle.innerHTML = '<span class="typewriter-cursor"></span>';

    function getFullText(phrase) {
      return phrase.text + phrase.highlight + phrase.end;
    }

    function typePhrase() {
      const phrase = getPhrases()[currentPhrase % getPhrases().length];
      const cursorEl = heroTitle.querySelector('.typewriter-cursor');
      let charIndex = 0;

      // Fase 1: Digitar texto normal
      function typeText() {
        if (charIndex < phrase.text.length) {
          const textNode = document.createTextNode(phrase.text[charIndex]);
          heroTitle.insertBefore(textNode, cursorEl);
          charIndex++;
          setTimeout(typeText, 55 + Math.random() * 40);
        } else {
          // Fase 2: Digitar palavra highlight dentro do <span>
          const spanEl = document.createElement('span');
          spanEl.textContent = '';
          heroTitle.insertBefore(spanEl, cursorEl);
          let hlIndex = 0;

          function typeHighlight() {
            if (hlIndex < phrase.highlight.length) {
              spanEl.textContent += phrase.highlight[hlIndex];
              hlIndex++;
              setTimeout(typeHighlight, 55 + Math.random() * 40);
            } else {
              // Fase 3: Digitar ponto final
              const dotNode = document.createTextNode(phrase.end);
              heroTitle.insertBefore(dotNode, cursorEl);

              // Pausa antes de apagar
              setTimeout(eraseAll, 2500);
            }
          }
          typeHighlight();
        }
      }

      // Fase 4: Apagar tudo (de trás pra frente)
      function eraseAll() {
        const fullLength = getFullText(phrase).length;
        let remaining = fullLength;

        function eraseChar() {
          if (remaining > 0) {
            // Pegar os nós antes do cursor e remover o último caractere
            const nodes = [];
            for (let i = 0; i < heroTitle.childNodes.length; i++) {
              if (heroTitle.childNodes[i] === cursorEl) break;
              nodes.push(heroTitle.childNodes[i]);
            }

            if (nodes.length > 0) {
              const lastNode = nodes[nodes.length - 1];

              if (lastNode.nodeType === Node.TEXT_NODE) {
                if (lastNode.textContent.length > 1) {
                  lastNode.textContent = lastNode.textContent.slice(0, -1);
                } else {
                  lastNode.remove();
                }
              } else if (lastNode.tagName === 'SPAN' && lastNode !== cursorEl) {
                if (lastNode.textContent.length > 1) {
                  lastNode.textContent = lastNode.textContent.slice(0, -1);
                } else if (lastNode.textContent.length === 1) {
                  lastNode.textContent = '';
                  lastNode.remove();
                } else {
                  lastNode.remove();
                }
              }
            }

            remaining--;
            setTimeout(eraseChar, 30 + Math.random() * 20);
          } else {
            // Avançar para próxima frase
            currentPhrase = (currentPhrase + 1) % getPhrases().length;
            // Pausa antes de digitar a próxima
            setTimeout(typePhrase, 800);
          }
        }
        eraseChar();
      }

      typeText();
    }

    // Iniciar typewriter com delay
    setTimeout(typePhrase, 600);
  }

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

  // um único handler de scroll (com requestAnimationFrame) para as duas seções
  let ticking = false;
  function onScrollScenes() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateManifesto();
      updateShowcase();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScrollScenes, { passive: true });
  window.addEventListener('resize', () => { fitFrames(); onScrollScenes(); });
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
    btn.querySelector('span').textContent = open ? 'Ler menos' : 'Ler mais';
  });
});
