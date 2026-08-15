-- 微信每日提醒（数据库内定时，多用户各自推送）
-- 使用方法：Supabase Dashboard → SQL Editor → 按文件末尾说明执行

-- ========== 第 1 段：用户配置表和每日提醒函数（先执行） ==========

-- 1) 每个用户存自己的 Server酱 SendKey（RLS：只能读写自己的行）
create table if not exists public.user_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  serverchan_key text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_config enable row level security;

drop policy if exists "own config" on public.user_config;
create policy "own config" on public.user_config
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists user_config_set_updated_at on public.user_config;
create trigger user_config_set_updated_at
  before update on public.user_config
  for each row execute function public.set_updated_at();

-- 2) 每日提醒函数：给每个配置了 SendKey 的用户分别推送各自的任务
create or replace function public.daily_reminder()
returns void
language plpgsql
security definer
as $$
declare
  today date := (now() at time zone 'Asia/Shanghai')::date;
  u record;
  t record;
  lines text[];
  n int;
  inbox_n int;
  title text;
  desp text;
  uid uuid;
begin
  for u in
    select user_id, serverchan_key from public.user_config
    where serverchan_key is not null and serverchan_key <> ''
  loop
    uid := u.user_id;
    lines := array[]::text[];
    n := 0;

    for t in
      select tasks.title, tasks.note, tasks.due_date
      from public.tasks
      where tasks.user_id = uid
        and tasks.status <> 'done'
        and (tasks.status = 'today' or (tasks.due_date is not null and tasks.due_date <= today))
      order by tasks.due_date asc nulls last
      limit 30
    loop
      n := n + 1;
      lines := array_append(lines, n::text || '. ' || t.title
        || case when t.note <> '' then '（' || t.note || '）' else '' end
        || case when t.due_date is not null and t.due_date < today
                then ' ⚠️逾期' || (today - t.due_date) || '天'
                when t.due_date = today then ' ⏰今天截止'
                else '' end);
    end loop;

    select count(*) into inbox_n from public.tasks where user_id = uid and status = 'inbox';

    if n = 0 then
      title := '早安，今天没有安排';
      lines := array_append(lines, '今天没有到期的任务。');
    else
      title := '早安，今天有 ' || n || ' 件事';
    end if;
    if inbox_n > 0 then
      lines := array_append(lines, '');
      lines := array_append(lines, '收件箱还有 ' || inbox_n || ' 条待整理。');
    end if;

    desp := array_to_string(lines, E'\n');

    perform net.http_get(
      url := 'https://sctapi.ftqq.com/' || u.serverchan_key || '.send',
      params := jsonb_build_object('title', title, 'desp', desp)
    );
  end loop;
end;
$$;

-- ========== 第 2 段：扩展和定时（执行一次即可） ==========

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 每天 UTC 0:00 = 北京时间 8:00
-- 若已存在想重置：select cron.unschedule('daily-reminder'); 再执行下一行
select cron.schedule('daily-reminder', '0 0 * * *', $$select public.daily_reminder()$$);

-- ========== 立即测试（可选） ==========
-- select public.daily_reminder();
-- 等 3~5 秒查结果：select status_code, error_msg, left(content, 300) from net._http_response order by id desc limit 5;
