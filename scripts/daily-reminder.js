// 每日微信提醒：查询今天要做的任务（含已过期），通过 Server酱 推送到微信
// 由 GitHub Actions 每天 UTC 0:00（北京 8:00）运行，同时保持 Supabase 项目活跃（防 7 天暂停）
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY
const sendKey = process.env.SERVERCHAN_SENDKEY

const missing = []
if (!url) missing.push('SUPABASE_URL')
if (!key) missing.push('SUPABASE_SERVICE_KEY')
if (!sendKey) missing.push('SERVERCHAN_SENDKEY')
if (missing.length) {
  console.error('缺少环境变量：' + missing.join('、'))
  process.exit(1)
}

const supabase = createClient(url, key)

function beijingDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function daysOverdue(due) {
  return Math.floor((new Date(`${beijingDate()}T00:00:00`) - new Date(`${due}T00:00:00`)) / 86400000)
}

async function main() {
  const today = beijingDate()

  // 今天要做：status='today' 或 截止日期已到（含过期），排除已完成
  const { data, error } = await supabase
    .from('tasks')
    .select('title, note, status, due_date')
    .neq('status', 'done')
    .or(`status.eq.today,and(due_date.not.is.null,due_date.lte.${today})`)
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error

  const { count: inboxCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'inbox')

  const weekday = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', weekday: 'long' }).format(new Date())
  const todayLabel = today.replace(/-/g, '/')
  const total = data.length

  let title
  const lines = [`**${todayLabel} ${weekday}**`]
  if (total === 0) {
    title = '早安，今天没有安排'
    lines.push('今天没有到期的任务。')
  } else {
    title = `早安，今天有 ${total} 件事`
    data.forEach((t, i) => {
      let line = `${i + 1}. ${t.title}`
      if (t.note) line += `（${t.note}）`
      if (t.due_date && t.due_date < today) line += ` ⚠️逾期${daysOverdue(t.due_date)}天`
      else if (t.due_date === today) line += ' ⏰今天截止'
      lines.push(line)
    })
  }
  if (inboxCount > 0) lines.push(`\n收件箱还有 ${inboxCount} 条待整理。`)
  lines.push('\n[打开安心清单]')

  const desp = lines.join('\n')
  const res = await fetch(`https://sctapi.ftqq.com/${sendKey}.send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ title, desp: desp.slice(0, 30000) }),
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error('Server酱返回错误：' + JSON.stringify(json))
  console.log('推送成功:', title)
}

main().catch((e) => {
  console.error('每日提醒失败:', e.message || e)
  process.exit(1)
})
