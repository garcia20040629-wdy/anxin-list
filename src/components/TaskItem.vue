<script setup>
import { computed } from 'vue'

const props = defineProps({
  task: { type: Object, required: true },
  todayStr: { type: String, required: true },
})
defineEmits(['toggle', 'open'])

const done = computed(() => props.task.status === 'done')

const badge = computed(() => {
  const d = props.task.due_date
  if (!d) return null
  if (done.value) return { cls: 'done-date', text: `截止 ${d}` }
  if (d < props.todayStr) {
    const days = Math.floor((new Date(props.todayStr + 'T00:00:00') - new Date(d + 'T00:00:00')) / 86400000)
    return { cls: 'overdue', text: days <= 0 ? `已过期` : `过期 ${days} 天` }
  }
  if (d === props.todayStr) return { cls: 'today', text: '今天截止' }
  return { cls: 'future', text: `截止 ${d}` }
})
</script>

<template>
  <div class="task-item" :class="{ done }" @click="$emit('open', task)">
    <button
      class="check-circle"
      :aria-label="done ? '标记为未完成' : '标记为完成'"
      @click.stop="$emit('toggle', task)"
    >
      <svg v-if="done" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </button>
    <div class="task-main">
      <div class="task-title">{{ task.title }}</div>
      <div v-if="task.note" class="task-note">{{ task.note }}</div>
      <div v-if="badge" class="badges">
        <span class="badge" :class="badge.cls">{{ badge.text }}</span>
      </div>
    </div>
  </div>
</template>
