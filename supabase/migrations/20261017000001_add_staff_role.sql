-- Staff see only their own profile. Managers can read the directory, and
-- administrators can also manage accounts through protected Edge Functions.
begin;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'manager', 'staff'));
alter table public.profiles alter column role set default 'staff';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.can_view_directory()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'manager')
  );
$$;

revoke all on function public.can_view_directory() from public;
grant execute on function public.can_view_directory() to authenticated;

drop policy if exists "Users can read own profile or admins can read all" on public.profiles;
drop policy if exists "Users can read own profile or directory viewers can read all" on public.profiles;
create policy "Users can read own profile or directory viewers can read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.can_view_directory()));

drop function if exists public.is_admin();

commit;
