-- ============================================================================
-- PRAAMS — Login security: consecutive-failure lockout (UC-01)
--
-- Rule: after 5 consecutive failed password attempts for one email, that
-- account cannot be signed into for 30 minutes. Counters reset on success
-- and automatically once a lock has expired. Constants mirrored in
-- lib/constants.ts (LOCKOUT_MAX_ATTEMPTS / LOCKOUT_DURATION_MINUTES).
--
-- Applied via Dashboard → SQL Editor (paste-and-run), like migration 00001.
-- ============================================================================

create table if not exists public.login_throttle (
  email text primary key,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.login_throttle enable row level security;
-- Deliberately zero policies: rows are read/written only through the
-- security-definer functions below, called from trusted server-side code
-- with the service-role key (which bypasses RLS entirely).

create or replace function public.is_login_locked(p_email text)
returns timestamptz
language sql stable
security definer
set search_path = public
as $$
  select case when locked_until > now() then locked_until end
  from public.login_throttle
  where email = lower(p_email);
$$;

create or replace function public.register_failed_login(p_email text)
returns timestamptz
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_attempts integer := 0;
begin
  insert into public.login_throttle (email, failed_attempts, locked_until)
  values (lower(p_email), 1, null)
  on conflict (email) do update
    set failed_attempts =
          -- Counter restarts once any previous lock has expired (consecutive model)
          case
            when login_throttle.locked_until is not null
                 and login_throttle.locked_until <= now() then 1
            else login_throttle.failed_attempts + 1
          end,
        locked_until = null, -- recomputed below if threshold reached
        updated_at = now();

  select failed_attempts into v_attempts
  from public.login_throttle where email = lower(p_email);

  if v_attempts >= 5 then
    update public.login_throttle
    set locked_until = now() + interval '30 minutes'
    where email = lower(p_email);
  end if;

  return (select locked_until from public.login_throttle where email = lower(p_email));
end;
$$;

create or replace function public.reset_failed_logins(p_email text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  delete from public.login_throttle where email = lower(p_email);
$$;