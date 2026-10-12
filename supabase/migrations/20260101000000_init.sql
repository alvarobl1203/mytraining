-- MyTraining — Esquema base
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- profiles
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  age int check (age is null or age between 14 and 100),
  gender text check (gender in ('Hombre','Mujer','Otro')),
  weight_kg numeric(5,2) check (weight_kg is null or weight_kg between 30 and 300),
  height_cm int check (height_cm is null or height_cm between 120 and 250),
  activity_level text check (
    activity_level in ('Sedentario','Ligero','Moderado','Activo','Muy Activo')
  ),
  available_equipment text[] not null default '{}'::text[],
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- exercises
-- ---------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (category in ('Fuerza','Hipertrofia','Cardio')),
  primary_muscle text not null,
  secondary_muscles text[] not null default '{}'::text[],
  equipment text not null,
  instructions text not null default '',
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists exercises_user_idx on public.exercises(user_id);
create index if not exists exercises_public_idx
  on public.exercises(is_public) where is_public = true;
create index if not exists exercises_primary_muscle_idx
  on public.exercises(primary_muscle);

-- ---------------------------------------------------------
-- routines
-- ---------------------------------------------------------
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  day_of_week int check (day_of_week is null or day_of_week between 0 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists routines_user_idx on public.routines(user_id);

-- ---------------------------------------------------------
-- routine_exercises
-- ---------------------------------------------------------
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  position int not null default 0,
  target_sets int not null default 3 check (target_sets between 1 and 20),
  target_reps_min int not null default 8 check (target_reps_min between 1 and 100),
  target_reps_max int not null default 12 check (target_reps_max between 1 and 100),
  target_rir int not null default 2 check (target_rir between 0 and 4),
  rest_seconds int not null default 90 check (rest_seconds between 15 and 600)
);

create index if not exists routine_exercises_routine_idx
  on public.routine_exercises(routine_id);

-- ---------------------------------------------------------
-- workouts
-- ---------------------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid references public.routines(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  notes text
);

create index if not exists workouts_user_started_idx
  on public.workouts(user_id, started_at desc);

-- ---------------------------------------------------------
-- workout_sets
-- ---------------------------------------------------------
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  set_number int not null,
  weight_kg numeric(6,2) check (weight_kg is null or weight_kg >= 0),
  reps int check (reps is null or reps >= 0),
  rir int check (rir is null or rir between 0 and 4),
  technique text not null default 'Normal'
    check (technique in ('Normal','Drop-Set','Rest-Pause')),
  cardio_seconds int,
  cardio_km numeric(6,2),
  cardio_kcal int,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists workout_sets_workout_idx
  on public.workout_sets(workout_id);
create index if not exists workout_sets_exercise_idx
  on public.workout_sets(exercise_id);

-- ---------------------------------------------------------
-- bodyweight_logs
-- ---------------------------------------------------------
create table if not exists public.bodyweight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(5,2) not null check (weight_kg between 30 and 300),
  logged_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists bodyweight_logs_user_idx
  on public.bodyweight_logs(user_id, logged_at desc);

-- ---------------------------------------------------------
-- Trigger updated_at
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_routines_updated_at on public.routines;
create trigger trg_routines_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.exercises           enable row level security;
alter table public.routines            enable row level security;
alter table public.routine_exercises   enable row level security;
alter table public.workouts            enable row level security;
alter table public.workout_sets        enable row level security;
alter table public.bodyweight_logs     enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles delete own" on public.profiles;
create policy "profiles delete own" on public.profiles
  for delete using (auth.uid() = id);

drop policy if exists "exercises select public or own" on public.exercises;
create policy "exercises select public or own" on public.exercises
  for select using (is_public = true or user_id = auth.uid());

drop policy if exists "exercises insert own" on public.exercises;
create policy "exercises insert own" on public.exercises
  for insert with check (user_id = auth.uid() and is_public = false);

drop policy if exists "exercises update own" on public.exercises;
create policy "exercises update own" on public.exercises
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "exercises delete own" on public.exercises;
create policy "exercises delete own" on public.exercises
  for delete using (user_id = auth.uid());

drop policy if exists "routines all own" on public.routines;
create policy "routines all own" on public.routines
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "routine_exercises all own" on public.routine_exercises;
create policy "routine_exercises all own" on public.routine_exercises
  for all using (
    exists (select 1 from public.routines r
            where r.id = routine_exercises.routine_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.routines r
            where r.id = routine_exercises.routine_id and r.user_id = auth.uid())
  );

drop policy if exists "workouts all own" on public.workouts;
create policy "workouts all own" on public.workouts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "workout_sets all own" on public.workout_sets;
create policy "workout_sets all own" on public.workout_sets
  for all using (
    exists (select 1 from public.workouts w
            where w.id = workout_sets.workout_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workouts w
            where w.id = workout_sets.workout_id and w.user_id = auth.uid())
  );

drop policy if exists "bodyweight_logs all own" on public.bodyweight_logs;
create policy "bodyweight_logs all own" on public.bodyweight_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------
-- Trigger: crear profile al registrar usuario
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, onboarding_completed)
  values (new.id, new.email, false)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();