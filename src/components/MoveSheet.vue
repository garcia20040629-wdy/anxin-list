<script setup>
import { ref } from 'vue'

const props = defineProps({
  task: { type: Object, required: true },
})
const emit = defineEmits(['close', 'move'])

const busy = ref(false)

const options = [
  { key: 'inbox', label: '收件箱', hint: '默认存放处，回头再整理' },
  { key: 'today', label: '今天', hint: '今天就要做' },
  { key: 'later', label: '稍后', hint: '接下来几天' },
  { key: 'someday', label: '长期', hint: '不着急但不想忘' },
]

async function pick(status) {
  if (busy.value || status === props.task.status) return
  busy.value = true
  try {
    await emit('move', status)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="sheet-overlay" @click="emit('close')"></div>
  <div class="sheet">
    <div class="sheet-handle"></div>
    <h3 class="move-title">把「{{ task.title }}」移到</h3>
    <div class="move-grid">
      <button
        v-for="o in options"
        :key="o.key"
        class="move-option"
        :class="{ current: o.key === task.status }"
        :disabled="busy || o.key === task.status"
        @click="pick(o.key)"
      >
        <span class="move-label">{{ o.label }}</span>
        <span class="move-hint">{{ o.hint }}</span>
        <span v-if="o.key === task.status" class="move-current">当前所在</span>
      </button>
    </div>
    <button class="btn btn-plain move-cancel" @click="emit('close')">取消</button>
  </div>
</template>
