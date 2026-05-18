-- Starter Supabase schema for the restaurant scheduler.
-- Run this later in Supabase SQL Editor when ready to persist app data.

create table if not exists employees (
  id bigint generated always as identity primary key,
  name text not null,
  email text unique,
  role text not null,
  is_manager boolean default false,
  created_at timestamptz default now()
);

create table if not exists schedules (
  id bigint generated always as identity primary key,
  week_start date not null,
  status text not null default 'draft', -- draft or published
  template_name text,
  created_at timestamptz default now(),
  published_at timestamptz
);

create table if not exists shifts (
  id bigint generated always as identity primary key,
  schedule_id bigint references schedules(id) on delete cascade,
  employee_id bigint references employees(id),
  role text not null,
  shift_date date not null,
  start_time time not null,
  end_time time,
  tag text, -- patio, on_call, special_event, inside, float, etc.
  location text,
  is_open boolean default false,
  created_at timestamptz default now()
);

create table if not exists availability (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  available_4pm boolean default false,
  available_5pm boolean default false,
  note text
);

create table if not exists shift_requests (
  id bigint generated always as identity primary key,
  shift_id bigint references shifts(id) on delete cascade,
  requester_id bigint references employees(id),
  target_employee_id bigint references employees(id),
  request_type text not null, -- give_up, swap, claim
  status text not null default 'pending', -- pending, approved, denied
  created_at timestamptz default now(),
  resolved_at timestamptz
);
