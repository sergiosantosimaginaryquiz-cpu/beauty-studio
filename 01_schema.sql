-- ============================================================
-- Beauty Studio Cátia Gonçalves — esquema da base de dados
-- Executar no Supabase: SQL Editor → colar → Run
-- ============================================================


-- ------------------------------------------------------------
-- Administradores e função de verificação
-- ------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ------------------------------------------------------------
-- Categorias e serviços
-- ------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  price numeric(8,2) not null default 0,
  promo_price numeric(8,2),
  promo_label text,
  duration int not null default 60,          -- minutos
  image_url text,
  featured boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger services_updated before update on public.services
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- Promoções
-- ------------------------------------------------------------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  label text default 'Esta semana',
  original_price numeric(8,2),
  promo_price numeric(8,2),
  image_url text,
  service_id uuid references public.services(id) on delete set null,
  start_date date,
  end_date date,
  active boolean not null default true,
  cta_text text default 'Aproveitar promoção',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Galeria / trabalhos
-- ------------------------------------------------------------
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  title text,
  category text not null default 'outros',   -- manicure | verniz-gel | francesinhas | nail-art | gel | outros
  description text,
  aspect text not null default 'portrait',   -- square | portrait | landscape
  featured boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.instagram_posts (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  caption text,
  permalink text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Disponibilidade
-- ------------------------------------------------------------
create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = domingo
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  check (end_time > start_time)
);

-- Encerramentos, férias e horários especiais.
-- kind = 'closed'  → fechado entre date e end_date (inclusive)
-- kind = 'special' → aberto apenas entre start_time e end_time nesse dia
create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  end_date date,
  kind text not null default 'closed' check (kind in ('closed','special')),
  reason text,
  start_time time,
  end_time time,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Marcações e contactos
-- ------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete set null,
  service_name text,                          -- cópia para histórico
  service_price numeric(8,2),
  duration int not null default 60,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  date date not null,
  time time not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','completed','cancelled')),
  notes text,
  admin_notes text,
  created_at timestamptz not null default now()
);
create index if not exists appointments_date_idx on public.appointments(date);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'whatsapp',
  context text,
  message text,
  page text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Definições (linha única) e conteúdo editável
-- ------------------------------------------------------------
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'Beauty Studio Cátia Gonçalves',
  phone text,
  whatsapp text,
  whatsapp_message text default 'Olá! Gostaria de marcar uma sessão no Beauty Studio Cátia Gonçalves.',
  email text,
  address text,
  address_line2 text,
  postal_code text,
  city text,
  parking_info text,
  instagram text,
  facebook text,
  tiktok text,
  google_maps_url text,
  google_maps_embed text,
  slot_interval int not null default 30,
  min_notice_hours int not null default 12,
  booking_window_days int not null default 60,
  updated_at timestamptz not null default now()
);
create trigger settings_updated before update on public.settings
  for each row execute function public.touch_updated_at();

create table if not exists public.content (
  id uuid primary key default gen_random_uuid(),
  section text not null unique,   -- hero | about | studio | instagram | booking | promotions
  title text,
  subtitle text,
  body text,
  cta_text text,
  image_url text,
  extra jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger content_updated before update on public.content
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- Vista de clientes (derivada das marcações)
-- ------------------------------------------------------------
create or replace view public.customers
with (security_invoker = true) as
select
  regexp_replace(customer_phone, '\s', '', 'g') as phone,
  (array_agg(customer_name order by created_at desc))[1] as name,
  (array_agg(customer_email order by created_at desc) filter (where customer_email is not null))[1] as email,
  count(*) as total_bookings,
  count(*) filter (where status = 'completed') as completed,
  coalesce(sum(service_price) filter (where status in ('confirmed','completed')), 0) as total_value,
  max(date) as last_visit,
  min(created_at) as first_contact
from public.appointments
group by 1;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.admins          enable row level security;
alter table public.categories      enable row level security;
alter table public.services        enable row level security;
alter table public.promotions      enable row level security;
alter table public.gallery         enable row level security;
alter table public.instagram_posts enable row level security;
alter table public.availability    enable row level security;
alter table public.blocked_dates   enable row level security;
alter table public.appointments    enable row level security;
alter table public.leads           enable row level security;
alter table public.settings        enable row level security;
alter table public.content         enable row level security;

-- Admin: acesso total em todas as tabelas
do $$
declare t text;
begin
  foreach t in array array['categories','services','promotions','gallery','instagram_posts',
                           'availability','blocked_dates','appointments','leads','settings','content']
  loop
    execute format('drop policy if exists "admin_all" on public.%I', t);
    execute format('create policy "admin_all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

create policy "admin_self" on public.admins for select to authenticated using (user_id = auth.uid());

-- Público: leitura apenas do que está ativo
create policy "public_read" on public.categories      for select to anon, authenticated using (active);
create policy "public_read" on public.services        for select to anon, authenticated using (active);
create policy "public_read" on public.gallery         for select to anon, authenticated using (active);
create policy "public_read" on public.instagram_posts for select to anon, authenticated using (active);
create policy "public_read" on public.availability    for select to anon, authenticated using (active);
create policy "public_read" on public.blocked_dates   for select to anon, authenticated using (true);
create policy "public_read" on public.settings        for select to anon, authenticated using (true);
create policy "public_read" on public.content         for select to anon, authenticated using (active);
-- Promoções expiradas desaparecem automaticamente
create policy "public_read" on public.promotions for select to anon, authenticated
  using (active
         and (start_date is null or start_date <= (now() at time zone 'Europe/Lisbon')::date)
         and (end_date   is null or end_date   >= (now() at time zone 'Europe/Lisbon')::date));

-- Público pode registar um contacto (clique no WhatsApp), nunca ler
create policy "public_insert" on public.leads for insert to anon, authenticated
  with check (channel in ('whatsapp','booking') and length(coalesce(context,'')) < 500);

-- As marcações NÃO são legíveis nem inseríveis diretamente pelo público:
-- usam as funções abaixo, que validam e expõem apenas horários ocupados.

-- ============================================================
-- Funções públicas de marcação
-- ============================================================
create or replace function public.get_busy_slots(p_date date)
returns table(start_time time, duration int)
language sql stable security definer set search_path = public as $$
  select a.time, a.duration from public.appointments a
  where a.date = p_date and a.status in ('pending','confirmed');
$$;

create or replace function public.request_appointment(
  p_service_id uuid,
  p_date date,
  p_time time,
  p_name text,
  p_phone text,
  p_email text default null,
  p_notes text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_service public.services%rowtype;
  v_id uuid;
  v_dow int := extract(dow from p_date);
  v_end time;
  v_ok boolean;
  v_today date := (now() at time zone 'Europe/Lisbon')::date;
begin
  if length(trim(coalesce(p_name,''))) < 2 or length(regexp_replace(coalesce(p_phone,''), '\D', '', 'g')) < 9 then
    raise exception 'INVALID_DATA';
  end if;
  if p_date < v_today then raise exception 'PAST_DATE'; end if;

  select * into v_service from public.services where id = p_service_id and active;
  if not found then raise exception 'INVALID_SERVICE'; end if;
  v_end := p_time + make_interval(mins => v_service.duration);

  -- Dia encerrado?
  if exists (select 1 from public.blocked_dates b
             where b.kind = 'closed' and p_date between b.date and coalesce(b.end_date, b.date)
               and (b.start_time is null or (p_time < b.end_time and v_end > b.start_time))) then
    raise exception 'CLOSED';
  end if;

  -- Dentro do horário (especial ou normal)?
  if exists (select 1 from public.blocked_dates b where b.kind = 'special' and b.date = p_date) then
    select exists (select 1 from public.blocked_dates b where b.kind = 'special' and b.date = p_date
                   and p_time >= b.start_time and v_end <= b.end_time) into v_ok;
  else
    select exists (select 1 from public.availability av where av.active and av.day_of_week = v_dow
                   and p_time >= av.start_time and v_end <= av.end_time) into v_ok;
  end if;
  if not v_ok then raise exception 'OUTSIDE_HOURS'; end if;

  -- Sobreposição com outra marcação?
  if exists (select 1 from public.appointments a
             where a.date = p_date and a.status in ('pending','confirmed')
               and p_time < a.time + make_interval(mins => a.duration) and v_end > a.time) then
    raise exception 'SLOT_TAKEN';
  end if;

  insert into public.appointments(service_id, service_name, service_price, duration,
                                  customer_name, customer_phone, customer_email, date, time, notes)
  values (v_service.id, v_service.name, coalesce(v_service.promo_price, v_service.price), v_service.duration,
          trim(p_name), trim(p_phone), nullif(trim(coalesce(p_email,'')), ''), p_date, p_time,
          nullif(trim(coalesce(p_notes,'')), ''))
  returning id into v_id;
  return v_id;
end $$;

grant execute on function public.get_busy_slots(date) to anon, authenticated;
grant execute on function public.request_appointment(uuid, date, time, text, text, text, text) to anon, authenticated;

-- ============================================================
-- Storage: bucket público "media" (escrita só para admins)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media_public_read" on storage.objects for select
  using (bucket_id = 'media');
create policy "media_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "media_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy "media_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
