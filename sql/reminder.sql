-- 微信每日提醒（数据库内定时，不依赖 GitHub）
-- 使用方法：Supabase Dashboard → SQL Editor → 按文件末尾说明分两段执行

-- ========== 第 1 段：建表和函数（先全部执行这一段） ==========

-- 1) 私有配置表（存 Server酱 key，放在 private schema，用户端无权读取）
create schema if not exists private;

create table if not exists private.config (
  key text primary key,
  value text not null
);

-- 2) 表单编码辅助函数（Server酱接口要求表单编码）
create or replace function private.urlencode(t text) returns text
language sql immutable as
$$ select replace(replace(replace(replace(replace(t, '%', '%25'), '&', '%26'), '=', '%3D'), '#', '%23'), chr(10), '%0A') $$;

-- 3) 每日提醒函数：查询今天该做的任务（含已过期），推送到 Server酱
create or replace function public.daily_reminder()
returns void
language plpgsql
security definer
as $$
declare
  today date := (now() at time zone 'Asia/Shanghai')::date;
  t record;
  lines text[] := array[]::text[];
  n int := 0;
  inbox_n int;
  title text;
  desp text;
  sendkey text;
begin
  select value into sendkey from private.config where key = 'serverchan_sendkey';
  if sendkey is null or sendkey = '' then
    raise exception 'serverchan_sendkey 未配置';
  end if;

  for t in
    select tasks.title, tasks.note, tasks.due_date
    from public.tasks
    where tasks.status <> 'done'
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

  select count(*) into inbox_n from public.tasks where status = 'inbox';

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
    url := 'https://sctapi.ftqq.com/' || sendkey || '.send',
    params := jsonb_build_object('title', title, 'desp', desp)
  );
end;
$$;

-- ========== 第 2 段：配置 key 和定时（先把 SCTxxx 换成你的 SendKey 再执行） ==========

-- 启用扩展
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 存 Server酱 SendKey（把 SCTxxxxxxxxxxxx 替换成你自己的，在 sct.ftqq.com 首页能看到）
insert into private.config(key, value) values ('serverchan_sendkey', 'SCTxxxxxxxxxxxx')
on conflict (key) do update set value = excluded.value;

-- 每天 UTC 0:00 = 北京时间 8:00 执行
-- 如果之前建过想重置：select cron.unschedule('daily-reminder'); 再执行下一行
select cron.schedule('daily-reminder', '0 0 * * *', $$select public.daily_reminder()$$);

-- ========== 立即测试（可选但推荐） ==========

-- 马上发一条测试推送：
select public.daily_reminder();

-- 等 3~5 秒后，查看发送结果（status_code 是 200 且 body 里有 "code":0 就是成功）：
select status_code, error_msg, left(body, 300) as body
from net._http_response order by id desc limit 2;
