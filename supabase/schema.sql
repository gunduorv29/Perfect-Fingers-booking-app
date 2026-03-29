-- ============================================================
-- Perfect Finger Braids — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================


-- ── PROFILES ──
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        text not null default 'client' check (role in ('client', 'admin')),
  created_at  timestamptz default now()
);

-- ── SERVICES ──
create table if not exists public.services (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  description text,
  duration    int  not null,   -- minutes
  price       numeric not null,
  deposit     numeric,
  icon        text default '✦',
  created_at  timestamptz default now()
);

-- ── APPOINTMENTS ──
create table if not exists public.appointments (
  id                 uuid default gen_random_uuid() primary key,
  client_id          uuid references public.profiles(id) on delete cascade,
  service_id         uuid references public.services(id) on delete set null,
  appointment_date   date not null,
  appointment_time   time not null,
  status             text not null default 'pending'
                       check (status in ('pending','confirmed','cancelled','completed')),
  notes              text,
  created_at         timestamptz default now()
);


-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.services     enable row level security;
alter table public.appointments enable row level security;

-- Drop existing policies first (safe to re-run)
drop policy if exists "Users view own profile"        on public.profiles;
drop policy if exists "Users update own profile"      on public.profiles;
drop policy if exists "Admin full access profiles"    on public.profiles;
drop policy if exists "Anyone can view services"      on public.services;
drop policy if exists "Admin manages services"        on public.services;
drop policy if exists "Clients view own appointments" on public.appointments;
drop policy if exists "Clients create appointments"   on public.appointments;
drop policy if exists "Clients cancel own"            on public.appointments;
drop policy if exists "Admin full access appointments" on public.appointments;

-- Profiles
create policy "Users view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admin full access profiles"
  on public.profiles for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Services (public read)
create policy "Anyone can view services"
  on public.services for select
  using (true);

create policy "Admin manages services"
  on public.services for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Appointments
create policy "Clients view own appointments"
  on public.appointments for select
  using (auth.uid() = client_id);

create policy "Clients create appointments"
  on public.appointments for insert
  with check (auth.uid() = client_id);

create policy "Clients cancel own"
  on public.appointments for update
  using (auth.uid() = client_id);

create policy "Admin full access appointments"
  on public.appointments for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- SEED: 8 starter services
-- ============================================================
insert into public.services (name, description, duration, price, deposit, icon) values
  ('Knotless Box Braids',    'Lightweight, tension-free knotless braids that start with your natural hair. Beginner-friendly and long-lasting.',             180, 120, 40, '🌿'),
  ('Classic Box Braids',     'Timeless and versatile box braids with extensions in your choice of length, size, and color.',                                 180, 100, 35, '✦'),
  ('Goddess Braids',         'Bohemian braids with curly ends for a romantic, goddess-inspired look perfect for any occasion.',                              240, 140, 50, '🌸'),
  ('Feed-In Braids',         'Natural-looking cornrows with gradually added extension hair for a seamless, scalp-friendly protective style.',                150, 80,  30, '⬡'),
  ('Stitch Braids',          'Cornrows with a distinct stitched parting pattern. Clean graphic lines that make a bold statement.',                           150, 90,  30, '🔶'),
  ('Passion Twists',         'Lightweight bohemian twists with wavy hair for a textured, effortless look with incredible bounce.',                          240, 150, 50, '🌀'),
  ('Senegalese Twists',      'Silky rope-like twists using Kanekalon hair. Smooth finish with maximum length and flexibility.',                             210, 130, 45, '🪢'),
  ('Cornrows (Straight Back)','Classic straight-back cornrows, clean and sleek. A simple, low-maintenance protective style staple.',                        90,  60,  20, '⬟')
on conflict do nothing;


-- ============================================================
-- HOW TO SET YOURSELF AS ADMIN
-- After signing up, run this with your user ID:
--
-- update public.profiles
-- set role = 'admin'
-- where id = 'YOUR-USER-UUID-HERE';
--
-- Find your UUID in Supabase: Authentication > Users
-- ============================================================