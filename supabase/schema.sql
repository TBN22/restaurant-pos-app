create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'staff');
create type public.item_status as enum ('available', 'unavailable');
create type public.sale_status as enum ('completed', 'void');
create type public.payment_method as enum ('cash', 'card', 'bank_transfer', 'wallet');
create type public.inventory_log_type as enum ('stock_added', 'sale_reduction', 'manual_correction', 'waste');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.app_role not null default 'staff',
  status text not null default 'active' check (status in ('active', 'disabled')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id),
  name text not null,
  selling_price numeric(12, 2) not null check (selling_price >= 0),
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0),
  current_stock integer not null default 0 check (current_stock >= 0),
  minimum_stock integer not null default 0 check (minimum_stock >= 0),
  status public.item_status not null default 'available',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, name)
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  cashier_id uuid not null references public.users(id),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  tax numeric(12, 2) not null default 0 check (tax >= 0),
  grand_total numeric(12, 2) not null check (grand_total >= 0),
  payment_method public.payment_method not null,
  status public.sale_status not null default 'completed',
  notes text,
  created_at timestamptz not null default now()
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id),
  change_type public.inventory_log_type not null,
  quantity_changed integer not null,
  reason text not null,
  user_id uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  table_name text,
  record_id uuid,
  user_id uuid references public.users(id),
  detail text not null default '',
  ip_address inet,
  created_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);

create index users_role_status_idx on public.users (role, status);
create index menu_items_category_status_idx on public.menu_items (category_id, status);
create index menu_items_low_stock_idx on public.menu_items (current_stock, minimum_stock);
create index sales_cashier_created_idx on public.sales (cashier_id, created_at desc);
create index sales_status_created_idx on public.sales (status, created_at desc);
create index sale_items_sale_idx on public.sale_items (sale_id);
create index sale_items_menu_item_idx on public.sale_items (menu_item_id);
create index inventory_logs_item_created_idx on public.inventory_logs (menu_item_id, created_at desc);
create index audit_logs_user_created_idx on public.audit_logs (user_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and role in ('admin', 'staff')
      and status = 'active'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'staff')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.users enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.settings enable row level security;

create policy users_select_own_or_admin on public.users
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy users_admin_all on public.users
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy categories_read_active_users on public.menu_categories
  for select to authenticated
  using ((select public.is_staff_or_admin()));

create policy categories_admin_write on public.menu_categories
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy menu_items_read_active_users on public.menu_items
  for select to authenticated
  using ((select public.is_staff_or_admin()));

create policy menu_items_admin_write on public.menu_items
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy sales_admin_read_all on public.sales
  for select to authenticated
  using ((select public.is_admin()));

create policy sales_staff_read_own on public.sales
  for select to authenticated
  using (cashier_id = (select auth.uid()));

create policy sales_staff_insert on public.sales
  for insert to authenticated
  with check (cashier_id = (select auth.uid()) and (select public.is_staff_or_admin()));

create policy sales_admin_update on public.sales
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy sale_items_admin_read_all on public.sale_items
  for select to authenticated
  using ((select public.is_admin()));

create policy sale_items_staff_read_own_sale on public.sale_items
  for select to authenticated
  using (
    exists (
      select 1 from public.sales
      where sales.id = sale_items.sale_id
        and sales.cashier_id = (select auth.uid())
    )
  );

create policy sale_items_staff_insert on public.sale_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.sales
      where sales.id = sale_items.sale_id
        and sales.cashier_id = (select auth.uid())
    )
  );

create policy inventory_logs_admin_read_all on public.inventory_logs
  for select to authenticated
  using ((select public.is_admin()));

create policy inventory_logs_staff_insert_sale_reduction on public.inventory_logs
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and change_type = 'sale_reduction'
    and (select public.is_staff_or_admin())
  );

create policy inventory_logs_admin_write on public.inventory_logs
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated
  using ((select public.is_admin()));

create policy audit_logs_active_insert on public.audit_logs
  for insert to authenticated
  with check ((select public.is_staff_or_admin()));

create policy settings_admin_all on public.settings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
