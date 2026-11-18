-- Rodar no Supabase (SQL Editor) do projeto "portfolio".
-- É só aditivo: cria a tabela `secoes` e insere novas linhas em `site_content`
-- com os MESMOS textos que o site já mostra hoje (nada muda visualmente).
-- Pode ser rodado mais de uma vez (idempotente).

-- 1) Seções do site que podem ser ocultadas pelo painel
create table if not exists public.secoes (
  chave     text primary key check (chave ~ '^[a-z_]+$'),
  nome      text not null,
  descricao text not null default '',
  visivel   boolean not null default true,
  posicao   integer not null default 0
);

alter table public.secoes enable row level security;

drop policy if exists "secoes leitura publica" on public.secoes;
create policy "secoes leitura publica" on public.secoes
  for select to anon, authenticated using (true);

drop policy if exists "secoes admin escreve" on public.secoes;
create policy "secoes admin escreve" on public.secoes
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

grant select on public.secoes to anon, authenticated;
grant insert, update, delete on public.secoes to authenticated;

insert into public.secoes (chave, nome, descricao, posicao) values
  ('hero_terminal', 'Início: cartão do terminal',    'O cartão "matheus.json" ao lado do título do início.',  10),
  ('marquee',       'Faixa de tecnologias',           'A faixa que rola logo abaixo do início.',               20),
  ('about',         'Sobre mim',                      'Foto, textos e tecnologias. Também some do menu.',      30),
  ('about_facts',   'Sobre: Formação e Atuação',      'Os dois quadros de resumo dentro do Sobre.',            40),
  ('about_skills',  'Sobre: tecnologias principais',  'As etiquetas de tecnologias dentro do Sobre.',          50),
  ('manifesto',     'Frase em destaque',              'A frase que acende palavra por palavra ao rolar.',      60),
  ('projects',      'Projetos',                       'A vitrine de projetos. Também some do menu.',           70),
  ('contact',       'Contato',                        'Chamada para o WhatsApp e links. Também some do menu.', 80)
on conflict (chave) do nothing;

-- 2) Textos que estavam fixos no HTML e agora são editáveis
insert into public.site_content (key, label, value, sort) values
  ('nav_home',           'Menu: Início',                                'Início',   1),
  ('nav_about',          'Menu: Sobre',                                 'Sobre',    2),
  ('nav_projects',       'Menu: Projetos',                              'Projetos', 3),
  ('nav_contact',        'Menu: Contato',                               'Contato',  4),
  ('hero_btn_primary',   'Início: botão principal',                     'Fale Comigo!', 31),
  ('hero_btn_secondary', 'Início: botão secundário',                    'Ver Projetos', 32),
  ('terminal_name',      'Terminal: nome',                              'Matheus Augusto', 33),
  ('terminal_skills',    'Terminal: skills (separadas por vírgula)',    'HTML, CSS, JS', 34),
  ('terminal_target',    'Terminal: alvo',                              'Excelência', 35),
  ('terminal_status',    'Terminal: status',                            'Disponível', 36),
  ('marquee_items',      'Faixa de tecnologias (um item por linha)',    E'HTML5\nCSS3\nJavaScript\nPHP\nSQL\nSupabase\nResponsivo\nPerformance', 37),
  ('about_label',        'Sobre: rótulo da seção',                      'Sobre mim', 38),
  ('about_more',         'Sobre: botão "Ler mais" (celular)',           'Ler mais',  61),
  ('about_less',         'Sobre: botão "Ler menos" (celular)',          'Ler menos', 62),
  ('about_fact1_label',  'Sobre: quadro 1, título',                     'Formação', 63),
  ('about_fact1_value',  'Sobre: quadro 1, texto',                      'ADS · Unicesumar', 64),
  ('about_fact2_label',  'Sobre: quadro 2, título',                     'Atuação', 65),
  ('about_fact2_value',  'Sobre: quadro 2, texto',                      'Dev Web Freelancer', 66),
  ('about_skills_title', 'Sobre: título das tecnologias',               '// tecnologias principais', 67),
  ('about_photo_url',    'Sobre: foto',                                 'imagens/fotos_pessoais/matheus_bigode.jpeg', 68),
  ('manifesto_text',     'Frase em destaque (use |palavra| para destacar)',
                          'Eu transformo ideias em sites |rápidos,| |bonitos| e feitos sob medida para o seu |negócio| crescer.', 69),
  ('projects_label',     'Projetos: rótulo da seção',                   'Portfólio', 71),
  ('projects_end_title', 'Projetos: painel final, título',              E'E o próximo pode\nser |o seu.|', 72),
  ('projects_end_text',  'Projetos: painel final, texto',               'Tem uma ideia ou um negócio que precisa de um site? Vamos conversar.', 73),
  ('projects_end_btn',   'Projetos: painel final, botão',               'Falar comigo', 74),
  ('contact_label',      'Contato: rótulo da seção',                    'Contato', 79),
  ('contact_btn',        'Contato: botão principal',                    'Iniciar conversa no WhatsApp', 91),
  ('footer_copy',        'Rodapé: direitos (use |texto| para negrito)', '© 2026 |Matheus Augusto|. Todos os direitos reservados.', 151)
on conflict (key) do nothing;
