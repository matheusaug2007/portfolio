// Aplica o tema salvo antes do primeiro paint (padrão: claro). Arquivo externo por causa da CSP (sem inline).
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');

// Esconde, antes do primeiro paint, as seções que o painel marcou como inativas na última visita
// (content.js confirma/atualiza isso assim que o Supabase responde). Evita a seção "piscar" na tela.
try {
  JSON.parse(localStorage.getItem('hidden-sections') || '[]').forEach(function (k) {
    if (/^[a-z_]+$/.test(k)) document.documentElement.classList.add('hide-' + k);
  });
} catch (e) { /* sem storage ou valor inválido: segue normal */ }

// Primeira tela só com o nome: sem cabeçalho, WhatsApp e barra de progresso até o visitante rolar
// (script.js tira esta classe ao rolar ou ao apertar Tab).
if (window.scrollY < 40) document.body.classList.add('is-intro');
