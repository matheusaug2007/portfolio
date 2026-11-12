// Aplica o tema salvo antes do primeiro paint (padrão: claro). Arquivo externo por causa da CSP (sem inline).
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');
