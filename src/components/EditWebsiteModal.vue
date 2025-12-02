<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { DesktopOutlined, SettingOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import type { Website } from '../types'
import CustomButtonModal from './CustomButtonModal.vue'

interface Props {
  open: boolean
  website: Website
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref()
const showCustomButtonModal = ref(false)
const formState = reactive({
  name: '',
  url: '',
  icon: '',
  windowMode: 'maximized' as 'normal' | 'maximized' | 'fullscreen',
  width: 1000,
  height: 700
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

// 监听 website 变化，更新表单
watch(() => props.website, (newVal) => {
  if (newVal) {
    formState.name = newVal.name
    formState.url = newVal.url
    formState.icon = newVal.icon || ''
    // 兼容旧数据：如果有 windowMode 就用，否则根据 fullscreen 决定
    if (newVal.windowMode) {
      formState.windowMode = newVal.windowMode
    } else {
      formState.windowMode = newVal.fullscreen ? 'fullscreen' : 'maximized'
    }
    formState.width = newVal.width || 1000
    formState.height = newVal.height || 700
  }
}, { immediate: true })

// 关闭弹窗
const handleClose = () => {
  emit('update:open', false)
}

// 删除网站
const handleDelete = () => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除网站 "${props.website.name}" 吗？`,
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    centered: true,
    maskClosable: true,
    onOk: async () => {
      try {
        await window.ipcRenderer.invoke('delete-website', props.website.id)
        message.success('删除成功')
        emit('success')
        handleClose()
      } catch (error) {
        message.error('删除失败')
        console.error(error)
      }
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    const updates = {
      name: formState.name,
      url: formState.url,
      icon: formState.icon,
      windowMode: formState.windowMode,
      width: formState.width,
      height: formState.height
    }

    await window.ipcRenderer.invoke('update-website', props.website.id, updates)
    message.success('更新成功')
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

// 添加到桌面
const addToDesktop = async () => {
  const hideLoading = message.loading('正在创建桌面快捷方式...', 0)
  try {
    const result = await window.ipcRenderer.invoke('add-to-desktop', {
      id: props.website.id,
      name: formState.name,
      url: formState.url,
      icon: formState.icon
    })
    hideLoading()
    if (result && result.success) {
      message.success('添加到桌面成功')
    } else {
      message.error('添加到桌面失败')
    }
  } catch (error) {
    hideLoading()
    message.error('添加到桌面失败')
    console.error(error)
  }
}

// 打开自定义按钮管理
const openCustomButtonModal = () => {
  showCustomButtonModal.value = true
}

// 自定义按钮修改成功回调
const handleCustomButtonSuccess = () => {
  showCustomButtonModal.value = false
  emit('success')
}
</script>

<template>
  <a-modal
    :open="open"
    title="编辑网站"
    :width="600"
    centered
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <template #footer>
      <a-button @click="addToDesktop">
        <template #icon>
          <DesktopOutlined />
        </template>
        添加到桌面
      </a-button>
      <a-button @click="openCustomButtonModal">
        <template #icon>
          <SettingOutlined />
        </template>
        自定义按钮
      </a-button>
      <a-button danger @click="handleDelete">
        <template #icon>
          <DeleteOutlined />
        </template>
        删除
      </a-button>
      <a-button @click="handleClose">取消</a-button>
      <a-button type="primary" @click="handleSubmit">确定</a-button>
    </template>
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

  <!-- 自定义按钮管理弹窗 -->
  <CustomButtonModal
    v-if="props.website"
    v-model:open="showCustomButtonModal"
    :website="props.website"
    @success="handleCustomButtonSuccess"
  />
</template>

<style scoped>
</style>




