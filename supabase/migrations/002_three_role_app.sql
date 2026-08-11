alter table public.services
add column if not exists icon text;

create table if not exists public.service_activities (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  key text primary key check (key in ('mission', 'vision')),
  value text not null check (char_length(value) between 1 and 1600),
  updated_at timestamptz not null default now()
);

alter table public.service_requests
add column if not exists activity_id uuid references public.service_activities(id) on delete set null,
add column if not exists assigned_staff_id uuid references public.profiles(id) on delete set null,
add column if not exists phone text check (char_length(phone) <= 80),
add column if not exists email text check (char_length(email) <= 180),
add column if not exists messenger_name text check (char_length(messenger_name) <= 120),
add column if not exists preferred_date date;

update public.service_requests
set status = case
  when status = 'new' then 'pending'
  when status in ('contacted', 'accepted') then 'in_progress'
  else status
end;

alter table public.service_requests
drop constraint if exists service_requests_status_check;

alter table public.service_requests
add constraint service_requests_status_check
check (status in ('pending', 'in_progress', 'declined', 'completed'));

alter table public.service_requests
alter column status set default 'pending';

drop trigger if exists service_activities_set_updated_at on public.service_activities;
create trigger service_activities_set_updated_at
before update on public.service_activities
for each row execute function public.set_updated_at();

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

alter table public.service_activities enable row level security;
alter table public.site_content enable row level security;

drop policy if exists "Anyone can read active activities" on public.service_activities;
create policy "Anyone can read active activities"
on public.service_activities
for select
using (
  active = true
  and exists (
    select 1
    from public.services
    where services.id = service_activities.service_id
      and services.active = true
  )
  or public.is_admin()
);

drop policy if exists "Admins manage activities" on public.service_activities;
create policy "Admins manage activities"
on public.service_activities
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can read site content" on public.site_content;
create policy "Anyone can read site content"
on public.site_content
for select
using (true);

drop policy if exists "Admins manage site content" on public.site_content;
create policy "Admins manage site content"
on public.site_content
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Guests create service requests" on public.service_requests;
create policy "Guests create service requests"
on public.service_requests
for insert
with check (status = 'pending');

drop policy if exists "Staff read assigned requests" on public.service_requests;
create policy "Staff read assigned requests"
on public.service_requests
for select
using (
  public.is_admin()
  or assigned_staff_id = auth.uid()
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
  or assigned_staff_id = auth.uid()
  or exists (
    select 1
    from public.staff_service_assignments assignments
    where assignments.staff_id = auth.uid()
      and assignments.service_id = service_requests.service_id
  )
)
with check (
  public.is_admin()
  or assigned_staff_id = auth.uid()
  or exists (
    select 1
    from public.staff_service_assignments assignments
    where assignments.staff_id = auth.uid()
      and assignments.service_id = service_requests.service_id
  )
);

insert into public.site_content (key, value)
values
  (
    'mission',
    'We exist to serve our community by providing meaningful services that enrich lives, foster creativity, expand knowledge, and build lasting connections.'
  ),
  (
    'vision',
    'To create a thriving community where faith and service walk hand in hand, empowering people to reach their fullest potential.'
  )
on conflict (key) do nothing;

delete from public.services
where title in ('Community Help', 'Youth Service Ideas', 'Church Support')
  and not exists (
    select 1
    from public.service_requests
    where service_requests.service_id = services.id
  );
