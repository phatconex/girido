-- Girido: bảng dữ liệu cho Supabase.
-- Cách dùng: mở Supabase → SQL Editor → dán cả file này → Run. Chạy lại nhiều lần cũng không sao.
--
-- Mỗi dòng thuộc về một người dùng (user_id). Row Level Security bảo đảm mỗi người chỉ đọc và ghi được dòng của mình.
-- id do app tự sinh (chữ), nên khóa chính là cặp (user_id, id).

create table if not exists public.projects (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id         text        not null,
  name       text        not null check (length(trim(name)) > 0),
  created_on date        not null default current_date,
  pos        integer     not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.works (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id         text        not null,
  project_id text        not null,
  name       text        not null check (length(trim(name)) > 0),
  sort       integer     not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, project_id) references public.projects (user_id, id) on delete cascade
);

create table if not exists public.todos (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id         text        not null,
  work_id    text,                    -- null: việc lẻ, không thuộc project nào
  text       text        not null check (length(trim(text)) > 0),
  date       date        not null,
  done       boolean     not null default false,
  done_at    timestamptz,
  pomos      integer     not null default 0 check (pomos >= 0),
  pos        integer     not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, work_id) references public.works (user_id, id) on delete cascade
);

-- Mỗi ngày một dòng: loại cây đã chọn, đã trồng chưa, mức cảm xúc 1 đến 5.
create table if not exists public.days (
  user_id uuid     not null default auth.uid() references auth.users (id) on delete cascade,
  date    date     not null,
  kind    text,
  planted boolean  not null default false,
  mood    smallint check (mood between 1 and 5),
  primary key (user_id, date)
);

-- Project đã tạo bảng từ bản trước thì chỉnh ở đây.
alter table public.todos add column if not exists pomos integer not null default 0 check (pomos >= 0);
alter table public.todos alter column work_id drop not null;

create index if not exists works_project_idx on public.works (user_id, project_id);
create index if not exists todos_work_idx    on public.todos (user_id, work_id);
create index if not exists todos_date_idx    on public.todos (user_id, date);

alter table public.projects enable row level security;
alter table public.works    enable row level security;
alter table public.todos    enable row level security;
alter table public.days     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['projects', 'works', 'todos', 'days'] loop
    execute format('drop policy if exists "%s: chi chu so huu" on public.%I', t, t);
    execute format(
      'create policy "%s: chi chu so huu" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t, t
    );
  end loop;
end $$;
