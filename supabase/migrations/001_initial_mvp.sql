create extension if not exists pgcrypto;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 800),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null check (role in ('staff', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id),
  guest_name text not null check (char_length(guest_name) between 1 and 120),
  guest_contact text not null check (char_length(guest_contact) between 1 and 180),
  preferred_time text check (char_length(preferred_time) <= 180),
  notes text check (char_length(notes) <= 800),
  budget text check (char_length(budget) <= 120),
  status text not null default 'new' check (
    status in ('new', 'contacted', 'accepted', 'declined', 'completed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_service_assignments (
  staff_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, service_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists service_requests_set_updated_at on public.service_requests;
create trigger service_requests_set_updated_at
before update on public.service_requests
for each row execute function public.set_updated_at();

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_profile_role() = 'admin', false)
$$;

alter table public.services enable row level security;
alter table public.profiles enable row level security;
alter table public.service_requests enable row level security;
alter table public.staff_service_assignments enable row level security;

drop policy if exists "Anyone can read active services" on public.services;
create policy "Anyone can read active services"
on public.services
for select
using (active = true or public.is_admin());

drop policy if exists "Admins manage services" on public.services;
create policy "Admins manage services"
on public.services
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users read their own profile" on public.profiles;
create policy "Users read their own profile"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles"
on public.profiles
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Guests create service requests" on public.service_requests;
create policy "Guests create service requests"
on public.service_requests
for insert
with check (status = 'new');

drop policy if exists "Staff read assigned requests" on public.service_requests;
create policy "Staff read assigned requests"
on public.service_requests
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.staff_service_assignments assignments
    where assignments.staff_id = auth.uid()
      and assignments.service_id = service_requests.service_id
  )
);

drop policy if exists "Staff update assigned request statuses" on public.service_requests;
create policy "Staff update assigned request statuses"
on public.service_requests
for update
using (
  public.is_admin()
  or exists (
    select 1
    from public.staff_service_assignments assignments
    where assignments.staff_id = auth.uid()
      and assignments.service_id = service_requests.service_id
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.staff_service_assignments assignments
    where assignments.staff_id = auth.uid()
      and assignments.service_id = service_requests.service_id
  )
);

drop policy if exists "Users read their own assignments" on public.staff_service_assignments;
create policy "Users read their own assignments"
on public.staff_service_assignments
for select
using (staff_id = auth.uid() or public.is_admin());

drop policy if exists "Admins manage assignments" on public.staff_service_assignments;
create policy "Admins manage assignments"
on public.staff_service_assignments
for all
using (public.is_admin())
with check (public.is_admin());

insert into public.services (title, description)
values
  (
    'Community Help',
    'Practical support projects for people who need encouragement, assistance, or a helpful hand.'
  ),
  (
    'Youth Service Ideas',
    'Small youth-led service concepts that teach stewardship, responsibility, and care for others.'
  ),
  (
    'Church Support',
    'Volunteer work that supports ministry, events, outreach, and the everyday needs of the church family.'
  )
on conflict do nothing;
