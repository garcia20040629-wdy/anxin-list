import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const tasks = ref([])
const loading = ref(false)
const error = ref('')

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useTasks() {
  async function load() {
    loading.value = true
    error.value = ''
    try {
      const { data, error: e } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      if (e) throw e
      tasks.value = data
    } catch (err) {
      error.value = '加载失败：' + (err.message || err)
    } finally {
      loading.value = false
    }
  }

  async function add(title) {
    const { data, error: e } = await supabase
      .from('tasks')
      .insert({ title: title.trim(), status: 'inbox' })
      .select()
      .single()
    if (e) throw e
    tasks.value.unshift(data)
    return data
  }

  async function update(id, patch) {
    const { data, error: e } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (e) throw e
    const i = tasks.value.findIndex((t) => t.id === id)
    if (i >= 0) tasks.value[i] = data
  }

  async function toggleDone(task) {
    if (task.status === 'done') {
      await update(task.id, { status: 'inbox', completed_at: null })
    } else {
      await update(task.id, { status: 'done', completed_at: new Date().toISOString() })
    }
  }

  async function move(id, status) {
    const patch =
      status === 'done'
        ? { status, completed_at: new Date().toISOString() }
        : { status, completed_at: null }
    await update(id, patch)
  }

  async function remove(id) {
    const { error: e } = await supabase.from('tasks').delete().eq('id', id)
    if (e) throw e
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  function escapeLike(s) {
    return s.replace(/[\\%_]/g, (m) => '\\' + m)
  }

  async function search(q) {
    const pat = `%${escapeLike(q)}%`
    const { data, error: e } = await supabase
      .from('tasks')
      .select('*')
      .or(`title.ilike.${pat},note.ilike.${pat}`)
      .order('created_at', { ascending: false })
    if (e) throw e
    return data
  }

  function reset() {
    tasks.value = []
    error.value = ''
  }

  return { tasks, loading, error, load, add, update, toggleDone, move, remove, search, todayStr, reset }
}
