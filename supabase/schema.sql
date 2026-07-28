-- ============================================
-- 个人账本应用 - Supabase Schema
-- ============================================

-- 用户档案表 (从 auth.users 自动创建)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now()
);

-- 分类表
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists categories_type_idx on public.categories(type);

-- 交易记录表
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.user_profiles(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  date date not null,
  type text not null check (type in ('income', 'expense')),
  category_id uuid not null references public.categories(id) on delete restrict,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_date_idx on public.transactions(date desc);
create index if not exists transactions_type_idx on public.transactions(type);
create index if not exists transactions_category_id_idx on public.transactions(category_id);

-- 启用 RLS
alter table public.user_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- ============================================
-- RLS 策略
-- ============================================

-- user_profiles: 用户只能查看和修改自己的资料
create policy "user_profiles_select_own"
on public.user_profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "user_profiles_update_own"
on public.user_profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "user_profiles_insert_own"
on public.user_profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

-- categories: 用户只能管理自己的分类
create policy "categories_select_own"
on public.categories
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "categories_insert_own"
on public.categories
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "categories_update_own"
on public.categories
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "categories_delete_own"
on public.categories
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- transactions: 用户只能管理自己的交易记录
create policy "transactions_select_own"
on public.transactions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "transactions_insert_own"
on public.transactions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "transactions_update_own"
on public.transactions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "transactions_delete_own"
on public.transactions
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ============================================
-- 授权
-- ============================================

grant select, insert, update on public.user_profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;

-- ============================================
-- 触发器：新用户注册时自动创建档案和默认分类
-- ============================================

-- 函数：创建用户档案
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 从 auth.users.raw_user_meta_data 获取用户名，如果没有则使用 email 前缀
  insert into public.user_profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

-- 触发器：auth.users INSERT 后创建档案
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 函数：插入默认分类
create or replace function public.insert_default_categories()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 支出分类
  insert into public.categories (user_id, name, type, is_default) values
    (new.id, '餐饮', 'expense', true),
    (new.id, '交通', 'expense', true),
    (new.id, '购物', 'expense', true),
    (new.id, '娱乐', 'expense', true);

  -- 收入分类
  insert into public.categories (user_id, name, type, is_default) values
    (new.id, '工资', 'income', true),
    (new.id, '奖金', 'income', true),
    (new.id, '理财', 'income', true);

  return new;
end;
$$;

-- 触发器：user_profiles INSERT 后创建默认分类
drop trigger if exists on_user_profile_created on public.user_profiles;
create trigger on_user_profile_created
  after insert on public.user_profiles
  for each row execute procedure public.insert_default_categories();

-- 函数：更新 updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 触发器：transactions UPDATE 时更新 updated_at
drop trigger if exists on_transaction_updated on public.transactions;
create trigger on_transaction_updated
  before update on public.transactions
  for each row execute procedure public.update_updated_at();
