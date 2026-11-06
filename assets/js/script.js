document.addEventListener('DOMContentLoaded', () => {

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
    const phrases = [
      { text: 'Um pouco de mim e muito ', highlight: 'código', end: '.' },
      { text: 'Criando soluções com ', highlight: 'excelência', end: '.' },
      { text: 'Transformando ideias em ', highlight: 'realidade', end: '.' },
    ];
    let currentPhrase = 0;

    heroTitle.innerHTML = '<span class="typewriter-cursor"></span>';

    function getFullText(phrase) {
      return phrase.text + phrase.highlight + phrase.end;
    }

    function typePhrase() {
      const phrase = phrases[currentPhrase];
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
            currentPhrase = (currentPhrase + 1) % phrases.length;
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
  // 9. PARALLAX NO SCROLL
  // ══════════════════════════════════════════════════
  const terminalContainer = document.querySelector('.terminal-container');
  const heroSection = document.querySelector('.hero');

  function handleParallax() {
    const scrollY = window.scrollY;

    // Parallax do terminal — flutua mais devagar
    if (terminalContainer && heroSection) {
      const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
      if (scrollY < heroBottom) {
        const offset = scrollY * 0.15;
        terminalContainer.style.transform = `translateY(${-offset}px)`;
      }
    }
  }

  window.addEventListener('scroll', handleParallax, { passive: true });

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
  // 11. TILT 3D NOS PROJECT CARDS
  // ══════════════════════════════════════════════════
  const tiltCards = document.querySelectorAll('.tilt-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  });

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
  // 14. WAVE SEPARATOR ANIMATION (via scroll suave)
  // ══════════════════════════════════════════════════
  const wavePaths = document.querySelectorAll('.wave-path');

  function animateWaves() {
    const scrollY = window.scrollY;
    wavePaths.forEach((path, index) => {
      const offset = Math.sin((scrollY * 0.003) + index) * 10;
      const d = path.getAttribute('d');
      // Leve mudança de posição Y com base no scroll
      path.style.transform = `translateY(${offset}px)`;
    });
  }

  window.addEventListener('scroll', animateWaves, { passive: true });

});
