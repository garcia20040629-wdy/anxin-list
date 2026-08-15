<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from './lib/supabase'
import { useTasks } from './composables/useTasks'
import AuthView from './components/AuthView.vue'
import CaptureBar from './components/CaptureBar.vue'
import TabBar from './components/TabBar.vue'
import TaskList from './components/TaskList.vue'
import TaskSheet from './components/TaskSheet.vue'
import MoveSheet from './components/MoveSheet.vue'
import SettingsSheet from './components/SettingsSheet.vue'

const { tasks, loading, error, load, add, update, toggleDone, move, remove, search, todayStr, reset } = useTasks()

const base = import.meta.env.BASE_URL
const today = todayStr()

const session = ref(null)
const ready = ref(false)
const tab = ref('inbox')
const searching = ref(false)
const query = ref('')
const results = ref([])
const searchBusy = ref(false)
const sheetTask = ref(null)
const moveSheetTask = ref(null)
const showSettings = ref(false)
const toast = ref('')
let toastTimer = null
let searchTimer = null

const TABS = [
  { key: 'inbox', label: '收件箱' },
  { key: 'today', label: '今天' },
  { key: 'later', label: '稍后' },
  { key: 'someday', label: '长期' },
  { key: 'done', label: '已完成' },
]

const counts = computed(() => {
  const c = { inbox: 0, today: 0, later: 0, someday: 0, done: 0 }
  for (const t of tasks.value) {
    c[t.status]++
    if (t.status !== 'done' && t.due_date === today) c.today++
  }
  return c
})

const tabsWithCount = computed(() => TABS.map((t) => ({ ...t, count: counts.value[t.key] })))

const visible = computed(() => {
  if (tab.value === 'today') {
    return tasks.value.filter(
      (t) => t.status === 'today' || (t.status !== 'done' && t.due_date === today)
    )
  }
  return tasks.value.filter((t) => t.status === tab.value)
})

const emptyTexts = {
  inbox: '收件箱是空的。\n有新的事，随手记在上面框里，回头再整理。',
  today: '今天没有安排。\n从收件箱里挑几件放进「今天」吧。',
  later: '「稍后」放接下来几天要做的事。',
  someday: '「长期」放不着急但不想忘的事：\n计划、想法、想学的东西……记下来就安心。',
  done: '还没有完成的任务。\n完成一件，勾一下，心里就踏实一点。',
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 3000)
}

function openSheet(task) {
  sheetTask.value = { ...task }
}

async function onSave(patch) {
  try {
    await update(sheetTask.value.id, patch)
    sheetTask.value = null
  } catch (e) {
    showToast('保存失败：' + (e.message || e))
  }
}

async function onRemove() {
  try {
    await remove(sheetTask.value.id)
    sheetTask.value = null
  } catch (e) {
    showToast('删除失败：' + (e.message || e))
  }
}

async function onQuickMove(task) {
  moveSheetTask.value = { ...task }
}

async function onMove(status) {
  try {
    await move(moveSheetTask.value.id, status)
    moveSheetTask.value = null
  } catch (e) {
    showToast('移动失败：' + (e.message || e))
  }
}

async function onToggle(task) {
  try {
    await toggleDone(task)
  } catch (e) {
    showToast('操作失败：' + (e.message || e))
  }
}

async function onAdd(title) {
  try {
    await add(title)
  } catch (e) {
    showToast('保存失败：' + (e.message || e))
  }
}

function onQueryInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(doSearch, 300)
}

async function doSearch() {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    return
  }
  searchBusy.value = true
  try {
    results.value = await search(q)
  } catch (e) {
    showToast('搜索失败：' + (e.message || e))
  } finally {
    searchBusy.value = false
  }
}

function closeSearch() {
  searching.value = false
  query.value = ''
  results.value = []
}

async function signOut() {
  await supabase.auth.signOut()
  reset()
  tab.value = 'inbox'
  closeSearch()
}

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    session.value = data.session
    await load()
  }
  ready.value = true

  supabase.auth.onAuthStateChange((_event, s) => {
    session.value = s
    if (s) load()
    else reset()
  })
})
</script>

<template>
  <div v-if="!ready" class="loading">加载中…</div>

  <AuthView v-else-if="!session" @authed="load" />

  <div v-else class="app">
    <header class="app-header">
      <div class="app-title">
        <img class="logo" :src="base + 'icons/pwa-192.png'" alt="" />
        安心清单
      </div>
      <div class="header-actions">
        <button class="icon-btn" aria-label="设置" @click="showSettings = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        <button class="icon-btn" aria-label="搜索" @click="searching = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </button>
        <button class="icon-btn" aria-label="退出登录" @click="signOut">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </div>
    </header>

    <template v-if="searching">
      <div class="search-bar">
        <input
          v-model="query"
          type="search"
          placeholder="搜索所有任务（含已完成）…"
          autofocus
          @input="onQueryInput"
          @keyup.enter="doSearch"
          @keyup.esc="closeSearch"
        />
        <button class="icon-btn" aria-label="关闭搜索" @click="closeSearch">关闭</button>
      </div>
      <div v-if="searchBusy" class="loading">搜索中…</div>
      <template v-else>
        <div v-if="query.trim()" class="search-tip">找到 {{ results.length }} 条结果</div>
        <TaskList
          :tasks="results"
          :today-str="today"
          empty-text="没有找到相关任务。"
          @toggle="onToggle"
          @open="openSheet"
          @quickmove="onQuickMove"
        />
      </template>
    </template>

    <template v-else>
      <CaptureBar @add="onAdd" />
      <TabBar :tabs="tabsWithCount" :active="tab" @change="tab = $event" />

      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <TaskList
        v-else
        :tasks="visible"
        :today-str="today"
        :empty-text="emptyTexts[tab]"
        @toggle="onToggle"
        @open="openSheet"
        @quickmove="onQuickMove"
      />

      <p class="footer-hint">电脑手机自动同步 · 每天早上 8 点微信提醒</p>
    </template>

    <TaskSheet
      v-if="sheetTask"
      :task="sheetTask"
      @close="sheetTask = null"
      @save="onSave"
      @remove="onRemove"
    />

    <MoveSheet
      v-if="moveSheetTask"
      :task="moveSheetTask"
      @close="moveSheetTask = null"
      @move="onMove"
    />

    <SettingsSheet
      v-if="showSettings && session"
      :user-id="session.user.id"
      @close="showSettings = false"
    />

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>
