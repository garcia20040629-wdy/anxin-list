<script setup>
import { ref } from 'vue'

const emit = defineEmits(['add'])

const text = ref('')
const busy = ref(false)

async function submit() {
  const t = text.value.trim()
  if (!t || busy.value) return
  busy.value = true
  try {
    await emit('add', t)
    text.value = ''
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="capture-bar">
    <input
      v-model="text"
      type="text"
      placeholder="记下任何事，回车保存…"
      enterkeyhint="done"
      @keyup.enter="submit"
    />
    <button class="capture-btn" :disabled="busy || !text.trim()" @click="submit">记下</button>
  </div>
</template>
