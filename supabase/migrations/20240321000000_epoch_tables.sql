-- Create epoch_rewards table
create table if not exists public.epoch_rewards (
  id uuid default uuid_generate_v4() primary key,
  epoch_id uuid references public.epochs(id) not null,
  total_distributed decimal not null default 0,
  participant_count integer not null default 0,
  distribution_data jsonb not null default '{}',
  created_at timestamp with time zone default now()
);

-- Create notifications table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  type text not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- Create epoch_analytics table
create table if not exists public.epoch_analytics (
  id uuid default uuid_generate_v4() primary key,
  epoch_id uuid references public.epochs(id) not null,
  total_mining_activity decimal not null default 0,
  user_participation integer not null default 0,
  reward_distribution jsonb not null default '{}',
  performance_metrics jsonb not null default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add epoch_id to mining_sessions table
alter table public.mining_sessions
add column if not exists epoch_id uuid references public.epochs(id);

-- Enable RLS
alter table public.epoch_rewards enable row level security;
alter table public.notifications enable row level security;
alter table public.epoch_analytics enable row level security;

-- Create policies for epoch_rewards
create policy "Enable read access for all users" on public.epoch_rewards
  for select using (true);

create policy "Enable insert for authenticated users only" on public.epoch_rewards
  for insert with check (auth.role() = 'authenticated');

-- Create policies for notifications
create policy "Enable read access for own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Enable insert for authenticated users only" on public.notifications
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Create policies for epoch_analytics
create policy "Enable read access for all users" on public.epoch_analytics
  for select using (true);

create policy "Enable insert for authenticated users only" on public.epoch_analytics
  for insert with check (auth.role() = 'authenticated');

-- Create function to update epoch_analytics updated_at
create or replace function update_epoch_analytics_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for epoch_analytics
create trigger update_epoch_analytics_updated_at
  before update on public.epoch_analytics
  for each row
  execute function update_epoch_analytics_updated_at(); 