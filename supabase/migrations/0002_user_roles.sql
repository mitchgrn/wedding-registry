create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.users
add column if not exists role text;

alter table public.users
alter column role set default 'user';

update public.users
set role = 'user'
where role is null;

alter table public.users
alter column role set not null;

alter table public.users
drop constraint if exists users_role_check;

alter table public.users
add constraint users_role_check
check (role in ('user', 'admin'));

create unique index if not exists users_email_idx on public.users (email) where email is not null;

drop trigger if exists users_set_timestamp on public.users;
create trigger users_set_timestamp
before update on public.users
for each row
execute function public.set_timestamp();

alter table public.users enable row level security;

drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

grant select on public.users to authenticated;
