-- ============================================================
-- Dados iniciais — tudo isto é editável no painel /admin
-- Executar depois de 0001_schema.sql
-- ============================================================

insert into public.settings (id, business_name, phone, whatsapp, whatsapp_message, email,
  address, address_line2, postal_code, city, parking_info, instagram, facebook, tiktok, google_maps_url)
values (1, 'Beauty Studio Cátia Gonçalves', '+351 900 000 000', '351900000000',
  'Olá! Gostaria de marcar uma sessão no Beauty Studio Cátia Gonçalves.',
  'ola@beautystudiocatia.pt',
  'Av. Amália Rodrigues', 'Moinhos da Funcheira', '2650-000', 'Amadora',
  'Estacionamento gratuito na rua, junto ao estúdio.',
  'https://www.instagram.com/beautystudiocatia', null, null,
  'https://maps.google.com/?q=Av.+Amália+Rodrigues,+Moinhos+da+Funcheira')
on conflict (id) do nothing;

insert into public.content (section, title, subtitle, body, cta_text, extra) values
('hero', 'A beleza está nos detalhes.',
 'Manicure, nail art e cuidados personalizados para realçar a sua beleza.', null, 'Marcar sessão',
 '{"secondary_cta":"Ver trabalhos","tagline":"Manicure • Nail Art • Cuidados"}'),
('about', 'Mais do que unhas. Um momento para si.',
 'Olá, sou a Cátia.',
 'Criei este estúdio para ser um lugar onde cada detalhe é pensado para si. Trabalho com técnicas atuais, produtos de qualidade profissional e muita atenção à saúde das suas unhas — porque um resultado bonito começa sempre por um cuidado verdadeiro.',
 'Conhecer o estúdio',
 '{"stats":[{"value":"8+","label":"anos de experiência"},{"value":"2000+","label":"clientes felizes"},{"value":"100%","label":"material esterilizado"}],"philosophy":"Precisão, higiene e um atendimento pessoal, sem pressas."}'),
('studio', 'Um espaço pensado para si.', 'Luz natural, calma e conforto — venha conhecer o estúdio.', null, 'Como chegar', '{}'),
('promotions', 'Momentos especiais', 'Sem promoções neste momento', 'Mas temos sempre algo especial preparado para si.', null, '{}'),
('instagram', 'Siga o nosso trabalho', 'Inspiração diária, novos designs e bastidores do estúdio.', null, '@beautystudiocatia', '{}'),
('booking', 'Pronta para o seu momento?', 'Escolha o serviço, a data e a hora. Nós tratamos do resto.', null, 'Marcar sessão', '{}')
on conflict (section) do nothing;

insert into public.categories (name, slug, description, sort_order) values
('Manicure',  'manicure',  'Cuidado completo das mãos e unhas naturais.', 1),
('Unhas de gel', 'gel',    'Aplicação, manutenção e extensão em gel.', 2),
('Nail Art',  'nail-art',  'Detalhes desenhados à mão, à sua medida.', 3)
on conflict (slug) do nothing;

insert into public.services (name, description, category_id, price, promo_price, promo_label, duration, featured, sort_order)
select s.name, s.description, c.id, s.price, s.promo_price, s.promo_label, s.duration, s.featured, s.sort_order
from (values
  ('Manicure', 'Limpeza, cutículas e hidratação. Acabamento com verniz tradicional.', 'manicure', 15.00, null::numeric, null, 45, false, 1),
  ('Manicure com verniz gel', 'Cuidado completo + acabamento perfeito que dura até 3 semanas.', 'manicure', 22.00, null, null, 60, true, 2),
  ('Manicure francesa', 'O clássico intemporal, com linha fina e precisa.', 'manicure', 25.00, null, null, 60, false, 3),
  ('Manutenção de verniz gel', 'Remoção, preparação e nova aplicação.', 'manicure', 20.00, null, null, 60, false, 4),
  ('Aplicação de gel', 'Unhas de gel sobre a unha natural, com forma à sua escolha.', 'gel', 35.00, null, null, 90, true, 1),
  ('Manutenção de gel', 'Preenchimento e reequilíbrio da estrutura.', 'gel', 30.00, 25.00, 'Promoção', 75, false, 2),
  ('Extensão de gel', 'Extensão com molde para o comprimento que deseja.', 'gel', 45.00, null, null, 120, false, 3),
  ('Remoção de gel', 'Remoção cuidada, sem danificar a unha natural.', 'gel', 12.00, null, null, 30, false, 4),
  ('Nail Art simples', 'Pequenos detalhes: linhas, pontos, foil ou pedras.', 'nail-art', 5.00, null, null, 15, false, 1),
  ('Francesinha', 'Francesa clássica, colorida ou invertida.', 'nail-art', 8.00, null, null, 20, false, 2),
  ('Nail Art personalizada', 'Um design criado para si, unha a unha.', 'nail-art', 15.00, null, null, 45, true, 3)
) as s(name, description, cat, price, promo_price, promo_label, duration, featured, sort_order)
join public.categories c on c.slug = s.cat;

-- Horário: segunda a sexta 09:00–18:00, sábado 09:00–13:00
insert into public.availability (day_of_week, start_time, end_time)
select d, '09:00', '18:00' from generate_series(1,5) d;
insert into public.availability (day_of_week, start_time, end_time) values (6, '09:00', '13:00');

-- Exemplo de dias especiais
insert into public.blocked_dates (date, kind, reason) values
  ('2026-12-24', 'closed', 'Véspera de Natal'),
  ('2026-12-25', 'closed', 'Natal');
insert into public.blocked_dates (date, kind, reason, start_time, end_time) values
  ('2026-12-26', 'special', 'Horário especial', '10:00', '16:00');

insert into public.promotions (title, description, label, original_price, promo_price, start_date, end_date, cta_text)
values ('Francesinha + Nail Art', 'Verniz gel com francesinha e um detalhe de nail art à sua escolha.',
        'Esta semana', 35.00, 29.00, current_date, (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
        'Aproveitar promoção');

-- Galeria inicial sem imagens (mostra composições decorativas até carregar as fotos no admin)
insert into public.gallery (title, category, aspect, featured, sort_order) values
  ('Nude acetinado', 'verniz-gel', 'portrait', true, 1),
  ('Francesa fina', 'francesinhas', 'square', false, 2),
  ('Pérolas e dourado', 'nail-art', 'landscape', true, 3),
  ('Rosa pó', 'manicure', 'portrait', false, 4),
  ('Amêndoa natural', 'gel', 'square', false, 5),
  ('Linhas douradas', 'nail-art', 'portrait', false, 6),
  ('Francesa invertida', 'francesinhas', 'portrait', false, 7),
  ('Leitoso', 'verniz-gel', 'square', false, 8);

insert into public.instagram_posts (caption, sort_order) values
  ('Nude clássico', 1), ('Francesa', 2), ('Detalhe dourado', 3),
  ('Rosa pó', 4), ('Nail art', 5), ('O estúdio', 6);

-- ============================================================
-- Criar o primeiro administrador:
-- 1) Supabase → Authentication → Users → Add user (email + password)
-- 2) Executar (substituir o email):
--    insert into public.admins (user_id)
--    select id from auth.users where email = 'catia@exemplo.pt';
-- ============================================================
