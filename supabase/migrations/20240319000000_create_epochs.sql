-- Create epochs table
create table if not exists public.epochs (
  id uuid default uuid_generate_v4() primary key,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.epochs enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Enable read access for all users" on public.epochs;
drop policy if exists "Enable insert for authenticated users only" on public.epochs;
drop policy if exists "Enable update for authenticated users only" on public.epochs;

-- Create policies
create policy "Enable read access for all users" on public.epochs
  for select using (true);

create policy "Enable insert for authenticated users only" on public.epochs
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on public.epochs
  for update using (auth.role() = 'authenticated');

-- Insert initial epoch if none exists
insert into public.epochs (start_time, end_time, is_active)
select 
  now(),
  now() + interval '30 days',
  true
where not exists (
  select 1 from public.epochs where is_active = true
); 