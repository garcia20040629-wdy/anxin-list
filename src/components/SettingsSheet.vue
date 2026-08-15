<script setup>
import { ref, watch } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps({
  userId: { type: String, required: true },
})
const emit = defineEmits(['close'])

const key = ref('')
const busy = ref(false)
const saved = ref(false)
const errMsg = ref('')
const loaded = ref(false)

watch(
  () => props.userId,
  async (uid) => {
    if (!uid) return
    const { data } = await supabase
      .from('user_config')
      .select('serverchan_key')
      .eq('user_id', uid)
      .maybeSingle()
    if (data?.serverchan_key) key.value = data.serverchan_key
    loaded.value = true
  },
  { immediate: true }
)

async function save() {
  if (busy.value) return
  const k = key.value.trim()
  if (!k) {
    errMsg.value = '请先粘贴 SendKey'
    return
  }
  busy.value = true
  errMsg.value = ''
  saved.value = false
  const { error } = await supabase
    .from('user_config')
    .upsert({ user_id: props.userId, serverchan_key: k })
  if (error) {
    errMsg.value = '保存失败：' + (error.message || error)
  } else {
    saved.value = true
    setTimeout(() => (saved.value = false), 2500)
  }
  busy.value = false
}
</script>

<template>
  <div class="sheet-overlay" @click="emit('close')"></div>
  <div class="sheet">
    <div class="sheet-handle"></div>
    <h3>设置</h3>

    <div class="settings-section">
      <h4>微信每日提醒</h4>
      <p class="settings-desc">
        每天早上 8 点，把「今天」的任务和逾期事项推到你的微信。绑定你自己的
        Server酱 SendKey 后生效：
      </p>
      <ol class="settings-steps">
        <li>微信扫码打开 sct.ftqq.com（Server酱）</li>
        <li>复制首页的 SendKey（SCT 开头）</li>
        <li>粘贴到下面，点保存</li>
      </ol>
      <input v-model="key" type="text" placeholder="SCT 开头的 SendKey" />
      <button class="btn btn-primary settings-save" :disabled="busy" @click="save">
        {{ busy ? '保存中…' : '保存' }}
      </button>
      <p v-if="saved" class="settings-ok">已保存，明早 8 点开始推送</p>
      <p v-if="errMsg" class="auth-error">{{ errMsg }}</p>
    </div>

    <div class="settings-section">
      <h4>关于</h4>
      <p class="settings-desc">安心清单 · 电脑手机自动同步 · 数据仅自己可见</p>
    </div>

    <button class="btn btn-plain move-cancel" @click="emit('close')">关闭</button>
  </div>
</template>
