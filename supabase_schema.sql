-- ===================================================
-- VELVETTE SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ihjpksrxjqgpulbwybci/sql
-- ===================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Products Table
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null default 'General',
  price numeric not null default 0,
  cost_price numeric not null default 0,
  image text,
  stock integer default 50,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Customers Table
create table if not exists public.customers (
  id text primary key,
  customer_id text unique not null,
  name text not null,
  phone text unique not null,
  email text,
  total_visits integer default 1,
  total_spent numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  last_visit timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Invoices Table
create table if not exists public.invoices (
  id text primary key,
  invoice_number text unique not null,
  day_id text not null, -- format: YYYY-MM-DD
  customer jsonb not null,
  items jsonb not null,
  subtotal numeric not null default 0,
  discount_percent numeric default 0,
  discount_amount numeric default 0,
  total numeric not null default 0,
  mode text default 'normal', -- 'normal' or 'challenger'
  payment_method text default 'Google Pay (UPI)',
  upi_id text default 'anshajshaji3-2@okicici',
  email_sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Daily Closings Table (Sales End of Day Summary)
create table if not exists public.daily_closings (
  day_id text primary key, -- YYYY-MM-DD
  closed_at timestamp with time zone default timezone('utc'::text, now()),
  closed_by text default 'admin',
  total_revenue numeric default 0,
  total_cogs numeric default 0,
  gross_profit numeric default 0,
  misc_expenses numeric default 0,
  misc_notes text,
  net_profit numeric default 0,
  total_invoices integer default 0,
  most_selling_product jsonb,
  most_profitable_product jsonb,
  status text default 'closed'
);

-- 6. Purchase Bills Table (Vendor/Supplier receipts)
create table if not exists public.purchase_bills (
  id text primary key,
  vendor text not null,
  bill_number text,
  date text not null,
  amount numeric not null default 0,
  items_description text,
  receipt_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Turn off RLS for open POS usage or enable public access
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.daily_closings enable row level security;
alter table public.purchase_bills enable row level security;

create policy "Allow all operations for anon" on public.products for all using (true) with check (true);
create policy "Allow all operations for anon" on public.customers for all using (true) with check (true);
create policy "Allow all operations for anon" on public.invoices for all using (true) with check (true);
create policy "Allow all operations for anon" on public.daily_closings for all using (true) with check (true);
create policy "Allow all operations for anon" on public.purchase_bills for all using (true) with check (true);
