-- Add last_claimed column to profiles table
alter table public.profiles 
add column if not exists last_claimed timestamp with time zone,
add column if not exists streak_days integer default 0;

-- Create streak_claims table to track all streak claims
create table if not exists public.streak_claims (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  claimed_at timestamp with time zone default now() not null,
  streak_days integer not null,
  waves_awarded integer not null,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.streak_claims enable row level security;

-- Create policies for streak_claims
create policy "Users can view their own streak claims"
  on public.streak_claims
  for select
  using (auth.uid() = user_id);

create policy "System can insert streak claims"
  on public.streak_claims
  for insert
  with check (true);

-- Create function to handle streak claims
create or replace function public.handle_streak_claim()
returns trigger as $$
begin
  -- Update last_claimed in profiles
  update public.profiles
  set last_claimed = new.claimed_at,
      streak_days = new.streak_days
  where id = new.user_id;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for streak claims
create trigger on_streak_claim
  after insert on public.streak_claims
  for each row
  execute function public.handle_streak_claim();

-- Create index for faster streak queries
create index if not exists idx_streak_claims_user_id on public.streak_claims(user_id);
create index if not exists idx_streak_claims_claimed_at on public.streak_claims(claimed_at);

-- Add comment to explain the streak system
comment on table public.streak_claims is 'Tracks daily streak claims and rewards for users';
comment on column public.streak_claims.streak_days is 'The streak count at the time of claim';
comment on column public.streak_claims.waves_awarded is 'Number of waves points awarded for this claim'; 