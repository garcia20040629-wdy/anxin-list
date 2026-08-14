<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  task: { type: Object, required: true },
  todayStr: { type: String, required: true },
})
const emit = defineEmits(['toggle', 'open', 'quickmove'])

const done = computed(() => props.task.status === 'done')

const badge = computed(() => {
  const d = props.task.due_date
  if (!d) return null
  if (done.value) return { cls: 'done-date', text: `截止 ${d}` }
  if (d < props.todayStr) {
    const days = Math.floor((new Date(props.todayStr + 'T00:00:00') - new Date(d + 'T00:00:00')) / 86400000)
    return { cls: 'overdue', text: days <= 0 ? '已过期' : `过期 ${days} 天` }
  }
  if (d === props.todayStr) return { cls: 'today', text: '今天截止' }
  return { cls: 'future', text: `截止 ${d}` }
})

// 滑动操作：左滑 = 完成/恢复，右滑 = 快速移动
const offset = ref(0)
const swiping = ref(false)
let startX = 0
let startY = 0
let active = false

function onTouchStart(e) {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  active = false
}

function onTouchMove(e) {
  const dx = e.touches[0].clientX - startX
  const dy = e.touches[0].clientY - startY
  if (!active) {
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      active = true
      swiping.value = true
    } else return
  }
  // 跟随手指，带一点阻尼，左右各限 110px
  const limited = Math.max(-110, Math.min(110, dx * 0.85))
  offset.value = limited
}

function onTouchEnd() {
  if (!active) {
    swiping.value = false
    return
  }
  const dx = offset.value
  if (dx <= -60) {
    emit('toggle', props.task)
  } else if (dx >= 60) {
    emit('quickmove', props.task)
  }
  offset.value = 0
  swiping.value = false
  active = false
}

function onClickRow() {
  if (swiping.value) return
  emit('open', props.task)
}
</script>

<template>
  <div class="task-item-wrap">
    <div class="swipe-bg swipe-bg-left" :class="{ show: offset < 0 }">
      {{ done ? '恢复' : '完成' }}
    </div>
    <div class="swipe-bg swipe-bg-right" :class="{ show: offset > 0 }">
      移动
    </div>
    <div
      class="task-item"
      :class="{ done, swiping }"
      :style="{ transform: `translateX(${offset}px)` }"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
      @click="onClickRow"
    >
      <button
        class="check-circle"
        :aria-label="done ? '标记为未完成' : '标记为完成'"
        @click.stop="emit('toggle', task)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <path class="check-path" d="M5 13l4 4L19 7" />
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
  </div>
</template>
