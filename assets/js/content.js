// Carrega textos, projetos e tecnologias do Supabase e aplica na página.
// Se der erro ou demorar, o HTML estático continua valendo (o site nunca quebra).
// Tudo é inserido com textContent/atributos (nunca innerHTML), para evitar XSS.
(function () {
  const TIMEOUT_MS = 2500;
  const isHttps = (u) => typeof u === 'string' && /^https:\/\//i.test(u);
  const isImg = (u) => isHttps(u) || /^imagens\//.test(u || '');

  async function load() {
    if (!window.supabase || !window.SUPABASE_URL) return;
    const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const [content, projects, skills] = await Promise.all([
      db.from('site_content').select('key,value'),
      db.from('projects').select('title,description,url,image_url').eq('visible', true).order('position'),
      db.from('skills').select('name').eq('visible', true).order('position'),
    ]);

    if (!content.error && content.data) applyContent(Object.fromEntries(content.data.map((r) => [r.key, r.value])));
    if (!projects.error && projects.data && projects.data.length) renderProjects(projects.data);
    if (!skills.error && skills.data && skills.data.length) renderSkills(skills.data);
  }

  function applyContent(c) {
    document.querySelectorAll('[data-content]').forEach((el) => {
      const v = c[el.dataset.content];
      if (typeof v === 'string' && v !== '') el.textContent = v;
    });

    // Frases animadas do hero: "texto |destaque|fim"
    if (c.hero_phrases) {
      const list = c.hero_phrases.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const m = l.match(/^(.*?)\|(.+?)\|(.*)$/);
        return m ? { text: m[1], highlight: m[2], end: m[3] } : { text: l, highlight: '', end: '' };
      });
      if (list.length) window.__heroPhrases = list;
    }

    // WhatsApp (número e mensagem)
    const num = (c.whatsapp_number || '').replace(/\D/g, '');
    if (num) {
      document.querySelectorAll('a[data-wa]').forEach((a) => {
        const msg = a.dataset.waMsg || c.whatsapp_message || '';
        a.href = 'https://wa.me/' + num + (msg ? '?text=' + encodeURIComponent(msg) : '');
      });
    }
    if (isHttps(c.linkedin_url)) document.querySelectorAll('a[data-link="linkedin"]').forEach((a) => (a.href = c.linkedin_url));
    if (isHttps(c.github_url)) document.querySelectorAll('a[data-link="github"]').forEach((a) => (a.href = c.github_url));

    // E-mail (montado no navegador, não fica em texto puro no HTML)
    const emailLink = document.getElementById('emailLink');
    if (emailLink && /^[^@\s]+@[^@\s]+$/.test(c.contact_email || '')) {
      const [u, d] = c.contact_email.split('@');
      emailLink.dataset.u = u;
      emailLink.dataset.d = d;
    }
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderProjects(list) {
    const grid = document.querySelector('.projects-grid');
    if (!grid) return;
    grid.replaceChildren();
    list.forEach((p) => {
      if (!isHttps(p.url)) return;
      const card = el('div', 'project-card reveal tilt-card');

      const thumb = el('div', 'project-thumb');
      if (isImg(p.image_url) && p.image_url) {
        const img = el('img', 'project-img');
        img.src = p.image_url;
        img.alt = 'Preview ' + p.title;
        img.loading = 'lazy';
        thumb.appendChild(img);
      }
      thumb.appendChild(el('div', 'thumb-glow'));

      const body = el('div', 'project-body');
      body.appendChild(el('h3', 'project-title', p.title));
      body.appendChild(el('p', 'project-desc', p.description));
      const a = el('a', 'project-link', 'Acessar projeto ');
      a.href = p.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', 'Acessar projeto ' + p.title);
      const icon = el('i', 'fas fa-arrow-right');
      a.appendChild(icon);
      body.appendChild(a);

      card.append(thumb, body);
      grid.appendChild(card);
    });
  }

  function renderSkills(list) {
    const box = document.getElementById('skillsContainer');
    if (!box) return;
    box.replaceChildren();
    list.forEach((s) => box.appendChild(el('span', 'skill-badge stagger-item', s.name)));
  }

  // script.js espera esta promessa antes de ligar animações/eventos
  window.contentReady = Promise.race([
    load().catch(() => {}),
    new Promise((r) => setTimeout(r, TIMEOUT_MS)),
  ]);
})();
