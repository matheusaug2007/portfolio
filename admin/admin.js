// Painel administrativo. Segurança real = login do Supabase + RLS no banco.
// Aqui nunca usamos innerHTML com dados: tudo via textContent/atributos.
(function () {
  const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
  const $ = (id) => document.getElementById(id);
  const BUCKET = 'portfolio-images';
  const MAX_IMG = 2 * 1024 * 1024;
  const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

  function el(tag, props, ...kids) {
    const n = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
    });
    kids.forEach((c) => c && n.append(c));
    return n;
  }

  let toastTimer;
  function toast(msg, isError) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.className = 'toast'), 3500);
  }
  const fail = (err) => toast(err && err.message ? 'Erro: ' + err.message : 'Algo deu errado', true);

  // ── Login ─────────────────────────────────────────
  async function showForSession() {
    const { data } = await db.auth.getSession();
    const logged = !!data.session;
    $('loginView').hidden = logged;
    $('appView').hidden = !logged;
    if (logged) { loadTexts(); loadProjects(); loadSkills(); }
  }

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('loginMsg').textContent = '';
    const { error } = await db.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
    if (error) { $('loginMsg').textContent = 'E-mail ou senha incorretos.'; return; }
    $('password').value = '';
    showForSession();
  });

  $('logoutBtn').addEventListener('click', async () => { await db.auth.signOut(); showForSession(); });

  $('tabs').addEventListener('click', (e) => {
    const tab = e.target.dataset && e.target.dataset.tab;
    if (!tab) return;
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b === e.target));
    ['texts', 'projects', 'skills'].forEach((t) => ($('tab-' + t).hidden = t !== tab));
  });

  // ── Textos ────────────────────────────────────────
  let textRows = [];
  async function loadTexts() {
    const { data, error } = await db.from('site_content').select('key,label,value,sort').order('sort');
    if (error) return fail(error);
    textRows = data;
    const box = $('textsList');
    box.replaceChildren();
    data.forEach((r) => {
      const long = r.value.length > 70 || /phrases|_p\d|pitch|desc/.test(r.key);
      const input = long
        ? el('textarea', { 'data-key': r.key, maxlength: 2000, rows: r.key === 'hero_phrases' ? 4 : 3 })
        : el('input', { 'data-key': r.key, maxlength: 2000, type: 'text' });
      input.value = r.value;
      box.append(el('div', { class: 'field' }, el('label', { text: r.label }, input)));
    });
  }

  $('saveTexts').addEventListener('click', async (ev) => {
    const btn = ev.currentTarget; btn.disabled = true;
    try {
      const changes = [...document.querySelectorAll('#textsList [data-key]')]
        .filter((i) => { const r = textRows.find((x) => x.key === i.dataset.key); return r && r.value !== i.value; });
      if (!changes.length) return toast('Nada para salvar.');
      for (const i of changes) {
        const v = i.value.trim();
        if (i.dataset.key.endsWith('_url') && v && !/^https:\/\//i.test(v)) throw new Error('Links precisam começar com https://');
        const { error } = await db.from('site_content').update({ value: v, updated_at: new Date().toISOString() }).eq('key', i.dataset.key);
        if (error) throw error;
      }
      toast('Textos salvos!');
      await loadTexts();
    } catch (e) { fail(e); } finally { btn.disabled = false; }
  });

  // ── Reordenar (serve para projetos e tecnologias) ─
  async function move(table, rows, index, dir) {
    const j = index + dir;
    if (j < 0 || j >= rows.length) return;
    const list = rows.slice();
    [list[index], list[j]] = [list[j], list[index]];
    for (let k = 0; k < list.length; k++) {
      if (list[k].position !== k + 1) {
        const { error } = await db.from(table).update({ position: k + 1 }).eq('id', list[k].id);
        if (error) return fail(error);
      }
    }
  }

  // ── Projetos ──────────────────────────────────────
  let projects = [];
  async function loadProjects() {
    const { data, error } = await db.from('projects').select('*').order('position');
    if (error) return fail(error);
    projects = data;
    const box = $('projectsList');
    box.replaceChildren();
    data.forEach((p, i) => box.append(projectCard(p, i)));
  }

  function projectCard(p, index) {
    const isNew = !p.id;
    const title = el('input', { type: 'text', maxlength: 80, value: p.title || '', placeholder: 'Nome do projeto' });
    const desc = el('textarea', { maxlength: 600 }); desc.value = p.description || '';
    const url = el('input', { type: 'url', maxlength: 500, value: p.url || '', placeholder: 'https://...' });
    const img = el('input', { type: 'text', maxlength: 500, value: p.image_url || '', placeholder: 'Link da imagem (ou envie um arquivo)' });
    const visible = el('input', { type: 'checkbox' }); visible.checked = p.visible !== false;
    const preview = el('img', { class: 'thumb', alt: 'Prévia da imagem' });
    const setPreview = () => { if (img.value) { preview.src = img.value.startsWith('imagens/') ? '/' + img.value : img.value; preview.hidden = false; } else preview.hidden = true; };
    setPreview();
    img.addEventListener('change', setPreview);

    const file = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
    file.addEventListener('change', async () => {
      const f = file.files[0]; if (!f) return;
      if (!EXT[f.type]) return toast('Use JPG, PNG ou WebP.', true);
      if (f.size > MAX_IMG) return toast('A imagem passa de 2 MB.', true);
      const path = 'projects/' + crypto.randomUUID() + '.' + EXT[f.type];
      const { error } = await db.storage.from(BUCKET).upload(path, f, { contentType: f.type, upsert: false });
      if (error) return fail(error);
      img.value = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      setPreview();
      toast('Imagem enviada. Clique em Salvar no projeto.');
    });

    const save = el('button', { class: 'btn primary', type: 'button', text: isNew ? 'Criar projeto' : 'Salvar' });
    save.addEventListener('click', async () => {
      if (!title.value.trim()) return toast('Dê um nome ao projeto.', true);
      if (!/^https:\/\//i.test(url.value.trim())) return toast('O link do projeto precisa começar com https://', true);
      const row = { title: title.value.trim(), description: desc.value.trim(), url: url.value.trim(), image_url: img.value.trim(), visible: visible.checked };
      save.disabled = true;
      const res = isNew
        ? await db.from('projects').insert({ ...row, position: projects.length + 1 })
        : await db.from('projects').update(row).eq('id', p.id);
      save.disabled = false;
      if (res.error) return fail(res.error);
      toast('Projeto salvo!');
      loadProjects();
    });

    const actions = el('div', { class: 'row' }, save);
    if (!isNew) {
      actions.append(
        el('button', { class: 'btn', type: 'button', text: '↑', title: 'Subir', onclick: async () => { await move('projects', projects, index, -1); loadProjects(); } }),
        el('button', { class: 'btn', type: 'button', text: '↓', title: 'Descer', onclick: async () => { await move('projects', projects, index, 1); loadProjects(); } }),
        el('button', { class: 'btn danger', type: 'button', text: 'Excluir', onclick: async () => {
          if (!confirm('Excluir o projeto "' + p.title + '"? Isso não pode ser desfeito.')) return;
          const { error } = await db.from('projects').delete().eq('id', p.id);
          if (error) return fail(error);
          toast('Projeto excluído.'); loadProjects();
        } })
      );
    } else {
      actions.append(el('button', { class: 'btn', type: 'button', text: 'Cancelar', onclick: () => loadProjects() }));
    }

    return el('div', { class: 'card item' },
      el('label', { text: 'Nome' }, title),
      el('label', { text: 'Descrição' }, desc),
      el('label', { text: 'Link do projeto' }, url),
      el('label', { text: 'Imagem' }, img),
      el('label', { text: 'Enviar nova imagem (JPG/PNG/WebP, até 2 MB)' }, file),
      preview,
      el('label', { class: 'check' }, visible, document.createTextNode('Visível no site')),
      actions
    );
  }

  $('addProject').addEventListener('click', () => {
    const box = $('projectsList');
    if (box.querySelector('[data-draft]')) return;
    const card = projectCard({}, -1);
    card.setAttribute('data-draft', '1');
    box.prepend(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // ── Tecnologias ───────────────────────────────────
  let skills = [];
  async function loadSkills() {
    const { data, error } = await db.from('skills').select('*').order('position');
    if (error) return fail(error);
    skills = data;
    const box = $('skillsList');
    box.replaceChildren();
    data.forEach((s, i) => {
      const name = el('input', { type: 'text', maxlength: 40, value: s.name });
      const visible = el('input', { type: 'checkbox' }); visible.checked = s.visible;
      box.append(el('div', { class: 'card item' }, el('div', { class: 'row' },
        name,
        el('label', { class: 'check' }, visible, document.createTextNode('Visível')),
        el('button', { class: 'btn primary', type: 'button', text: 'Salvar', onclick: async () => {
          if (!name.value.trim()) return toast('O nome não pode ficar vazio.', true);
          const { error: e } = await db.from('skills').update({ name: name.value.trim(), visible: visible.checked }).eq('id', s.id);
          if (e) return fail(e); toast('Salvo!');
        } }),
        el('button', { class: 'btn', type: 'button', text: '↑', title: 'Subir', onclick: async () => { await move('skills', skills, i, -1); loadSkills(); } }),
        el('button', { class: 'btn', type: 'button', text: '↓', title: 'Descer', onclick: async () => { await move('skills', skills, i, 1); loadSkills(); } }),
        el('button', { class: 'btn danger', type: 'button', text: 'Excluir', onclick: async () => {
          if (!confirm('Excluir "' + s.name + '"?')) return;
          const { error: e } = await db.from('skills').delete().eq('id', s.id);
          if (e) return fail(e); toast('Excluída.'); loadSkills();
        } })
      )));
    });
  }

  $('skillForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = $('newSkill').value.trim();
    if (!v) return;
    const { error } = await db.from('skills').insert({ name: v, position: skills.length + 1 });
    if (error) return fail(error);
    $('newSkill').value = '';
    toast('Adicionada!'); loadSkills();
  });

  showForSession();
})();
