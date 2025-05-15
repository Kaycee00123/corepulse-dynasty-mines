-- Create user_balances table if it doesn't exist
create table if not exists public.user_balances (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tokens decimal default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint positive_balance check (tokens >= 0)
);

-- Enable RLS
alter table public.user_balances enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own balance" on public.user_balances;
drop policy if exists "System can update balances" on public.user_balances;
drop policy if exists "System can insert balances" on public.user_balances;

-- Create policies for user_balances
create policy "Users can view their own balance"
  on public.user_balances
  for select
  using (auth.uid() = user_id);

create policy "System can update balances"
  on public.user_balances
  for update
  using (true);

create policy "System can insert balances"
  on public.user_balances
  for insert
  with check (true);

-- Drop existing functions if they exist
drop function if exists public.increment(decimal, uuid);
drop function if exists public.begin_transaction();
drop function if exists public.commit_transaction();
drop function if exists public.rollback_transaction();
drop function if exists public.get_user_streak_stats(uuid);
drop function if exists public.can_claim_streak(uuid);

-- Create transaction functions
create or replace function public.begin_transaction()
returns void
language plpgsql
security definer
as $$
begin
  -- Start a new transaction
  perform pg_advisory_xact_lock(1);
end;
$$;

create or replace function public.commit_transaction()
returns void
language plpgsql
security definer
as $$
begin
  -- Commit is automatic in PostgreSQL functions
  return;
end;
$$;

create or replace function public.rollback_transaction()
returns void
language plpgsql
security definer
as $$
begin
  -- Force a rollback by raising an exception
  raise exception 'Transaction rollback requested';
end;
$$;

-- Create function to increment balance
create or replace function public.increment(
  x decimal,
  row_id uuid
)
returns decimal
language plpgsql
security definer
as $$
declare
  current_balance decimal;
begin
  -- Get current balance
  select tokens into current_balance
  from public.user_balances
  where user_id = row_id;

  -- If no balance exists, create one
  if current_balance is null then
    insert into public.user_balances (user_id, tokens)
    values (row_id, x);
    return x;
  end if;

  -- Update balance
  update public.user_balances
  set tokens = tokens + x,
      updated_at = now()
  where user_id = row_id;

  return current_balance + x;
end;
$$;

-- Create index for faster balance queries
create index if not exists idx_user_balances_user_id on public.user_balances(user_id);

-- Add comment to explain the balance system
comment on table public.user_balances is 'Tracks user token balances';
comment on column public.user_balances.tokens is 'Current token balance';
comment on column public.user_balances.updated_at is 'Last time the balance was updated';

-- Create function to get user streak stats
create or replace function public.get_user_streak_stats(
  p_user_id uuid
)
returns table (
  current_streak integer,
  longest_streak integer,
  total_claims integer,
  total_waves_earned decimal
)
language plpgsql
security definer
as $$
begin
  return query
  select
    p.streak_days as current_streak,
    coalesce(max(sc.streak_days), 0) as longest_streak,
    count(sc.id) as total_claims,
    coalesce(sum(sc.waves_awarded), 0) as total_waves_earned
  from public.profiles p
  left join public.streak_claims sc on sc.user_id = p.id
  where p.id = p_user_id
  group by p.id, p.streak_days;
end;
$$;

-- Create function to check if user can claim streak
create or replace function public.can_claim_streak(
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_last_claimed timestamp with time zone;
  v_current_time timestamp with time zone;
begin
  -- Get last claimed time
  select last_claimed into v_last_claimed
  from public.profiles
  where id = p_user_id;

  -- Get current UTC+1 time
  v_current_time := now() at time zone 'UTC+1';

  -- If never claimed, can claim
  if v_last_claimed is null then
    return true;
  end if;

  -- Convert last claimed to UTC+1
  v_last_claimed := v_last_claimed at time zone 'UTC+1';

  -- Check if last claim was on a different day
  return date_trunc('day', v_last_claimed) < date_trunc('day', v_current_time);
end;
$$; 