<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  task: { type: Object, required: true },
})
const emit = defineEmits(['close', 'save', 'remove'])

const title = ref('')
const note = ref('')
const due = ref('')
const status = ref('inbox')
const busy = ref(false)

watch(
  () => props.task,
  (t) => {
    title.value = t.title
    note.value = t.note || ''
    due.value = t.due_date || ''
    status.value = t.status
  },
  { immediate: true }
)

const statusOptions = [
  { key: 'inbox', label: '收件箱' },
  { key: 'today', label: '今天' },
  { key: 'later', label: '稍后' },
  { key: 'someday', label: '长期' },
  { key: 'done', label: '已完成' },
]

async function save() {
  if (!title.value.trim() || busy.value) return
  busy.value = true
  try {
    await emit('save', {
      title: title.value.trim(),
      note: note.value.trim(),
      due_date: due.value || null,
      status: status.value,
    })
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (busy.value) return
  if (!window.confirm('确定删除这条任务吗？')) return
  busy.value = true
  try {
    await emit('remove')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="sheet-overlay" @click="emit('close')"></div>
  <div class="sheet">
    <div class="sheet-handle"></div>
    <h3>编辑任务</h3>
    <div class="field">
      <label>内容</label>
      <input v-model="title" type="text" placeholder="要做什么？" />
    </div>
    <div class="field">
      <label>备注（可选）</label>
      <textarea v-model="note" rows="2" placeholder="补充说明…"></textarea>
    </div>
    <div class="field">
      <label>截止日期（可选）</label>
      <input v-model="due" type="date" />
    </div>
    <div class="field">
      <label>放到哪里</label>
      <select v-model="status">
        <option v-for="o in statusOptions" :key="o.key" :value="o.key">{{ o.label }}</option>
      </select>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-danger" :disabled="busy" @click="remove">删除</button>
      <button class="btn btn-plain" :disabled="busy" @click="emit('close')">取消</button>
      <button class="btn btn-primary" :disabled="busy" @click="save">保存</button>
    </div>
  </div>
</template>
