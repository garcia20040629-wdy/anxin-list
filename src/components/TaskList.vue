<script setup>
import TaskItem from './TaskItem.vue'

defineProps({
  tasks: { type: Array, required: true },
  todayStr: { type: String, required: true },
  emptyText: { type: String, default: '' },
})
defineEmits(['toggle', 'open'])
</script>

<template>
  <div v-if="tasks.length" class="task-list">
    <TaskItem
      v-for="t in tasks"
      :key="t.id"
      :task="t"
      :today-str="todayStr"
      @toggle="$emit('toggle', t)"
      @open="$emit('open', t)"
    />
  </div>
  <div v-else class="empty">{{ emptyText }}</div>
</template>
