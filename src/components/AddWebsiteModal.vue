<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import type { Website } from '../types'

interface Props {
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref()
const formState = reactive({
  name: '',
  url: '',
  icon: '',
  windowMode: 'maximized' as 'normal' | 'maximized' | 'fullscreen'
})

const rules = {
  name: [
    { required: true, message: '请输入网站名称', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入网站地址', trigger: 'blur' },
    { type: 'url', message: '请输入有效的网址', trigger: 'blur' }
  ]
}

// 关闭弹窗
const handleClose = () => {
  emit('update:open', false)
  resetForm()
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  formState.name = ''
  formState.url = ''
  formState.icon = ''
  formState.windowMode = 'maximized'
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    const website: Omit<Website, 'id'> = {
      name: formState.name,
      url: formState.url,
      icon: formState.icon,
      windowMode: formState.windowMode,
      customButtons: []
    }

    await window.ipcRenderer.invoke('add-website', website)
    message.success('添加成功')
    emit('success')
    handleClose()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 自动获取网站图标
const autoGetIcon = () => {
  if (formState.url) {
    try {
      const url = new URL(formState.url)
      formState.icon = `${url.origin}/favicon.ico`
    } catch (error) {
      message.warning('请输入有效的网址')
    }
  }
}
</script>

<template>
  <a-modal
    :open="props.open"
    title="添加网站"
    :width="600"
    centered
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="rules"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 18 }"
    >
      <a-form-item label="网站名称" name="name">
        <a-input v-model:value="formState.name" placeholder="请输入网站名称" />
      </a-form-item>

      <a-form-item label="网站地址" name="url">
        <a-input 
          v-model:value="formState.url" 
          placeholder="请输入网站地址，如：https://www.google.com"
          @blur="autoGetIcon"
        />
      </a-form-item>

      <a-form-item label="图标地址" name="icon">
        <a-input 
          v-model:value="formState.icon" 
          placeholder="可选，留空则自动获取"
        >
          <template #addonAfter>
            <a-button 
              type="link" 
              size="small" 
              @click="autoGetIcon"
            >
              自动获取
            </a-button>
          </template>
        </a-input>
      </a-form-item>

      <a-form-item 
        label="图标预览" 
        v-if="formState.icon"
        :wrapper-col="{ offset: 5, span: 18 }"
      >
        <img 
          :src="formState.icon" 
          alt="图标预览" 
          style="width: 48px; height: 48px; object-fit: contain;"
          @error="() => message.warning('图标加载失败')"
        />
      </a-form-item>

      <a-form-item label="窗口大小" name="windowMode">
        <a-radio-group v-model:value="formState.windowMode">
          <a-radio value="normal">正常</a-radio>
          <a-radio value="maximized">最大化</a-radio>
          <a-radio value="fullscreen">全屏</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped>
</style>
