// Carrega textos, projetos e tecnologias do Supabase e aplica na página.
// Se der erro ou demorar, o HTML estático continua valendo (o site nunca quebra).
// Tudo é inserido com textContent/atributos (nunca innerHTML), para evitar XSS.
(function () {
  // Cloudflare Web Analytics. Fica aqui (e não no HTML) para não contar visitas quando o site
  // está dentro do iframe de prévia do painel /admin.
  if (window.parent === window) {
    const beacon = document.createElement('script');
    beacon.type = 'module';
    beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    beacon.setAttribute('data-cf-beacon', '{"token": "7608e650b709424786162cbe5b64b6dc"}');
    document.head.appendChild(beacon);
  }

  const TIMEOUT_MS = 2500;
  const isHttps = (u) => typeof u === 'string' && /^https:\/\//i.test(u);
  const isImg = (u) => isHttps(u) || /^imagens\//.test(u || '');

  async function load() {
    if (!window.supabase || !window.SUPABASE_URL) return;
    const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const [content, projects, skills, sections] = await Promise.all([
      db.from('site_content').select('key,value'),
      db.from('projects').select('title,description,url,image_url').eq('visible', true).order('position'),
      db.from('skills').select('name').eq('visible', true).order('position'),
      db.from('secoes').select('chave,visivel'),
    ]);

    if (!content.error && content.data) applyContent(Object.fromEntries(content.data.map((r) => [r.key, r.value])));
    if (!projects.error && projects.data && projects.data.length) renderProjects(projects.data);
    if (!skills.error && skills.data && skills.data.length) renderSkills(skills.data);
    // Se a tabela ainda não existir (ou der erro), nenhuma seção é ocultada.
    if (!sections.error && sections.data) applySections(sections.data);
  }

  // ── Seções ocultas pelo painel ───────────────────
  // Cada trecho do HTML marcado com data-section="chave" some quando a seção está inativa.
  // A lista fica guardada no navegador (localStorage) para theme-init.js já esconder antes de pintar a página.
  function applySections(list) {
    const hidden = list.filter((s) => s.visivel === false).map((s) => s.chave);
    document.querySelectorAll('[data-section]').forEach((n) => {
      n.hidden = hidden.indexOf(n.dataset.section) !== -1;
    });
    const cl = document.documentElement.classList;
    [...cl].filter((k) => k.indexOf('hide-') === 0).forEach((k) => cl.remove(k));
    hidden.forEach((k) => { if (/^[a-z_]+$/.test(k)) cl.add('hide-' + k); });
    try { localStorage.setItem('hidden-sections', JSON.stringify(hidden)); } catch (e) { /* sem storage: tudo bem */ }
  }

  // Texto com formatação simples: "\n" vira quebra de linha e |palavra| vira destaque.
  // spec = "tag.classe" do destaque (ex.: "b.hl", "span", "strong"). Tudo via textContent (sem innerHTML).
  function rich(node, text, spec) {
    const parts = String(spec || 'span').split('.');
    const frag = document.createDocumentFragment();
    text.split('\n').forEach((line, i) => {
      if (i) frag.appendChild(document.createElement('br'));
      const seg = line.split('|');
      seg.forEach((s, j) => {
        if (!s) return;
        if (j % 2 === 1 && j < seg.length - 1) frag.appendChild(el(parts[0], parts[1] || '', s));
        else frag.appendChild(document.createTextNode(s));
      });
    });
    node.replaceChildren(frag);
  }

  function applyContent(c) {
    document.querySelectorAll('[data-content]').forEach((n) => {
      const v = c[n.dataset.content];
      if (typeof v !== 'string' || v === '') return;
      if (n.dataset.rich) rich(n, v, n.dataset.rich);
      else n.textContent = v;
    });

    // Frase em destaque: o rótulo de acessibilidade acompanha o texto
    const manifesto = document.getElementById('manifesto');
    if (manifesto && c.manifesto_text) manifesto.setAttribute('aria-label', c.manifesto_text.replace(/\|/g, ''));

    // Faixa de tecnologias (um item por linha; o conteúdo é duplicado para o loop ficar contínuo)
    const track = document.querySelector('.marquee-track');
    const marquee = (c.marquee_items || '').split('\n').map((l) => l.trim()).filter(Boolean);
    if (track && marquee.length) {
      track.replaceChildren();
      [0, 1].forEach(() => marquee.forEach((t) => track.appendChild(el('span', 'marquee-item', t))));
    }

    // Terminal do início: skills separadas por vírgula
    const termSkills = document.getElementById('terminalSkills');
    const skillsList = (c.terminal_skills || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (termSkills && skillsList.length) {
      termSkills.replaceChildren();
      skillsList.forEach((s, i) => {
        if (i) termSkills.appendChild(document.createTextNode(', '));
        termSkills.appendChild(el('span', 'code-val', '"' + s + '"'));
      });
    }

    // Foto do Sobre
    const photo = document.querySelector('img.about-photo');
    if (photo && c.about_photo_url && isImg(c.about_photo_url)) photo.src = c.about_photo_url;

    // Textos do botão "Ler mais / Ler menos" (script.js alterna entre os dois)
    const more = document.getElementById('aboutMore');
    if (more) {
      if (c.about_more) more.dataset.more = c.about_more;
      if (c.about_less) more.dataset.less = c.about_less;
      if (more.getAttribute('aria-expanded') === 'true' && c.about_less) {
        const lbl = more.querySelector('span');
        if (lbl) lbl.textContent = c.about_less;
      }
    }

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
    // Vitrine: cada projeto vira uma "tela" (site real dentro do dispositivo) + um bloco de texto.
    // O script.js liga a rolagem, as bolinhas e o carregamento dos sites depois que isto roda.
    const screen = document.getElementById('scScreen');
    const copy = document.getElementById('scCopy');
    if (!screen || !copy) return;
    const valid = list.filter((p) => isHttps(p.url));
    if (!valid.length) return; // nada válido: mantém o HTML estático
    screen.querySelectorAll('.sc-shot').forEach((n) => n.remove());
    copy.replaceChildren();

    valid.forEach((p) => {
      const shot = el('div', 'sc-shot');
      shot.dataset.url = p.url;
      if (isImg(p.image_url) && p.image_url) {
        const img = el('img', 'sc-poster');
        img.src = p.image_url;
        img.alt = 'Preview ' + p.title;
        img.loading = 'lazy';
        shot.appendChild(img);
      }
      const frame = el('iframe', 'sc-frame');
      frame.title = 'Prévia do site ' + p.title;
      frame.tabIndex = -1;
      frame.loading = 'lazy';
      frame.dataset.src = p.url;
      shot.appendChild(frame);
      screen.appendChild(shot);

      const text = el('article', 'sc-text');
      text.appendChild(el('h3', 'project-title', p.title));
      text.appendChild(el('p', 'project-desc', p.description));
      const a = el('a', 'project-link', 'Acessar projeto ');
      a.href = p.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', 'Acessar projeto ' + p.title);
      a.appendChild(el('i', 'fas fa-arrow-right'));
      text.appendChild(a);
      copy.appendChild(text);
    });

    // o link que cobre a tela precisa ficar por cima dos sites
    const open = document.getElementById('scOpen');
    if (open) screen.appendChild(open);
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

  // ── Modo prévia ───────────────────────────────────
  // Só ativo quando o site roda dentro de um iframe do mesmo domínio (painel /admin).
  // Aceita apenas mensagens do mesmo origin e só aplica texto (textContent), sem salvar nada.
  if (window.parent !== window) {
    document.documentElement.classList.add('in-preview'); // prévia do painel: mostra todos os textos
    const FOCUS_FALLBACK = {
      hero_phrases: '#heroTitle',
      marquee_items: '.marquee',
      terminal_skills: '#terminalSkills',
      about_less: '#aboutMore',
      about_photo_url: '#photoReveal',
      whatsapp_number: '#contact',
      whatsapp_message: '#contact',
      linkedin_url: '#contact',
      github_url: '#contact',
      contact_email: '#contact',
    };

    const style = document.createElement('style');
    style.textContent = '.preview-flash{outline:2px solid #4f7cff!important;outline-offset:6px;border-radius:6px;transition:outline-color .4s}';
    document.head.appendChild(style);

    window.addEventListener('message', (e) => {
      if (e.origin !== window.location.origin || e.source !== window.parent || !e.data) return;

      if (e.data.type === 'preview-content' && e.data.content && typeof e.data.content === 'object') {
        const c = {};
        Object.entries(e.data.content).forEach(([k, v]) => { if (typeof v === 'string') c[k] = v; });
        applyContent(c);
      }

      if (e.data.type === 'preview-focus' && typeof e.data.key === 'string') {
        const key = e.data.key;
        const target =
          document.querySelector('[data-content="' + key.replace(/["\\]/g, '') + '"]') ||
          (FOCUS_FALLBACK[key] && document.querySelector(FOCUS_FALLBACK[key]));
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.querySelectorAll('.preview-flash').forEach((n) => n.classList.remove('preview-flash'));
        target.classList.add('preview-flash');
        setTimeout(() => target.classList.remove('preview-flash'), 1600);
      }
    });

    window.contentReady.then(() => {
      window.parent.postMessage({ type: 'preview-ready' }, window.location.origin);
    });
  }
})();
