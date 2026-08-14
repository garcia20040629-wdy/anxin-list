<script setup>
import TaskItem from './TaskItem.vue'

defineProps({
  tasks: { type: Array, required: true },
  todayStr: { type: String, required: true },
  emptyText: { type: String, default: '' },
})
defineEmits(['toggle', 'open', 'quickmove'])
</script>

<template>
  <TransitionGroup v-if="tasks.length" name="task" tag="div" class="task-list">
    <TaskItem
      v-for="t in tasks"
      :key="t.id"
      :task="t"
      :today-str="todayStr"
      @toggle="$emit('toggle', t)"
      @open="$emit('open', t)"
      @quickmove="$emit('quickmove', t)"
    />
  </TransitionGroup>
  <div v-else class="empty">
    <svg class="empty-illust" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="46" stroke="currentColor" stroke-width="3" opacity="0.25" />
      <circle cx="60" cy="60" r="34" stroke="currentColor" stroke-width="3" stroke-dasharray="5 8" opacity="0.4" stroke-linecap="round" />
      <path d="M45 62l11 11 20-26" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.55" />
    </svg>
    <p>{{ emptyText }}</p>
  </div>
</template>
