<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { CloseOutlined } from '@ant-design/icons-vue'

interface Props {
  open: boolean
}

interface Emits {
  'update:open': [value: boolean]
  'settings-changed': [settings: Settings]
}

interface Settings {
  darkMode: 'manual' | 'system' | 'time'
  darkModeTimeStart: string
  darkModeTimeEnd: string
  isDarkMode: boolean
  homeWindowSize: 'normal' | 'maximized' | 'fullscreen'
  autoStart: boolean
  backgroundType: 'default' | 'solid' | 'image'
  backgroundColor: string
  backgroundImage: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

import dayjs from 'dayjs'

const settings = reactive<Settings>({
  darkMode: 'manual',
  darkModeTimeStart: '18:00',
  darkModeTimeEnd: '06:00',
  isDarkMode: false,
  homeWindowSize: 'maximized',
  autoStart: false,
  backgroundType: 'default',
  backgroundColor: '#f0f2f5',
  backgroundImage: ''
})

// 加载设置
const loadSettings = async () => {
  try {
    const savedSettings = await window.ipcRenderer.invoke('get-settings')
    if (savedSettings) {
      Object.assign(settings, savedSettings)
    }
    // 获取开机启动状态
    const autoStartStatus = await window.ipcRenderer.invoke('get-auto-start-status')
    settings.autoStart = autoStartStatus
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    // 根据模式设置isDarkMode
    if (settings.darkMode === 'time') {
      settings.isDarkMode = checkDarkMode()
    } else if (settings.darkMode === 'system') {
      settings.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    // 创建纯对象副本，避免传递响应式对象
    const settingsToSave: Settings = {
      darkMode: settings.darkMode,
      darkModeTimeStart: settings.darkModeTimeStart,
      darkModeTimeEnd: settings.darkModeTimeEnd,
      isDarkMode: settings.isDarkMode,
      homeWindowSize: settings.homeWindowSize,
      autoStart: settings.autoStart,
      backgroundType: settings.backgroundType,
      backgroundColor: settings.backgroundColor,
      backgroundImage: settings.backgroundImage
    }

    await window.ipcRenderer.invoke('save-settings', settingsToSave)
    message.success('设置已保存')
    emit('settings-changed', settingsToSave)
    handleClose()
  } catch (error) {
    message.error('保存设置失败')
    console.error(error)
  }
}

// 关闭弹窗
const handleClose = () => {
  emit('update:open', false)
}

// 检测当前是否应该使用黑暗模式
const checkDarkMode = () => {
  if (settings.darkMode === 'system') {
    // 系统主题检测将通过Electron主进程处理
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } else if (settings.darkMode === 'time') {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [startHour, startMin] = settings.darkModeTimeStart.split(':').map(Number)
    const [endHour, endMin] = settings.darkModeTimeEnd.split(':').map(Number)
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime
    } else {
      return currentTime >= startTime || currentTime <= endTime
    }
  }
  return settings.isDarkMode
}

// 应用黑暗模式
const applyDarkMode = () => {
  const isDark = checkDarkMode()
  if (isDark) {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
  }
}

// 选择背景图片
const selectBackgroundImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        settings.backgroundImage = result
      }
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

onMounted(() => {
  loadSettings()
  applyDarkMode()
})
</script>

<template>
  <a-modal
    :open="props.open"
    title="设置"
    :width="600"
    @cancel="handleClose"
    @ok="saveSettings"
  >
    <template #closeIcon>
      <CloseOutlined />
    </template>

    <div class="settings-content">
      <!-- 黑暗模式设置 -->
      <div class="setting-item">
        <h3>黑暗模式</h3>
        <a-radio-group v-model:value="settings.darkMode">
          <a-radio value="manual">手动</a-radio>
          <a-radio value="system">跟随系统</a-radio>
          <a-radio value="time">根据时间</a-radio>
        </a-radio-group>

        <!-- 手动模式开关 -->
        <div v-if="settings.darkMode === 'manual'" class="sub-setting">
          <a-switch v-model:checked="settings.isDarkMode" />
          <span class="switch-label">{{ settings.isDarkMode ? '黑暗模式' : '明亮模式' }}</span>
        </div>

        <!-- 时间模式设置 -->
        <div v-if="settings.darkMode === 'time'" class="sub-setting">
          <div class="time-range">
            <span>开始时间：</span>
            <a-time-picker
              :value="dayjs(settings.darkModeTimeStart, 'HH:mm')"
              format="HH:mm"
              @change="(time: any) => settings.darkModeTimeStart = time ? time.format('HH:mm') : '18:00'"
            />
            <span style="margin-left: 16px">结束时间：</span>
            <a-time-picker
              :value="dayjs(settings.darkModeTimeEnd, 'HH:mm')"
              format="HH:mm"
              @change="(time: any) => settings.darkModeTimeEnd = time ? time.format('HH:mm') : '06:00'"
            />
          </div>
        </div>
      </div>

      <!-- 首页启动大小设置 -->
      <div class="setting-item">
        <h3>首页启动大小</h3>
        <a-radio-group v-model:value="settings.homeWindowSize">
          <a-radio value="normal">正常</a-radio>
          <a-radio value="maximized">最大化</a-radio>
          <a-radio value="fullscreen">全屏</a-radio>
        </a-radio-group>
      </div>

      <!-- 开机启动设置 -->
      <div class="setting-item">
        <h3>开机启动</h3>
        <div class="sub-setting">
          <a-switch v-model:checked="settings.autoStart" />
          <span class="switch-label">{{ settings.autoStart ? '开机自动启动' : '不开机启动' }}</span>
        </div>
      </div>

      <!-- 背景设置 -->
      <div class="setting-item">
        <h3>背景设置</h3>
        <a-radio-group v-model:value="settings.backgroundType">
          <a-radio value="default">默认背景</a-radio>
          <a-radio value="solid">纯色背景</a-radio>
          <a-radio value="image">图片背景</a-radio>
        </a-radio-group>

        <!-- 纯色背景设置 -->
        <div v-if="settings.backgroundType === 'solid'" class="sub-setting">
          <span>背景颜色：</span>
          <a-input
            v-model:value="settings.backgroundColor"
            type="color"
            style="width: 80px; height: 32px; padding: 0; border: none;"
          />
        </div>

        <!-- 图片背景设置 -->
        <div v-if="settings.backgroundType === 'image'" class="sub-setting">
          <a-button @click="selectBackgroundImage">选择图片</a-button>
          <span v-if="settings.backgroundImage" style="margin-left: 12px; font-size: 12px; color: #666;">
            已选择图片
          </span>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.settings-content {
  padding: 16px 0;
}

.setting-item {
  margin-bottom: 24px;
}

.setting-item h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #262626;
}

.sub-setting {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch-label {
  font-size: 14px;
  color: #595959;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 黑暗模式样式 */
:deep(.dark) .setting-item h3 {
  color: #ffffff;
}

:deep(.dark) .switch-label {
  color: #d9d9d9;
}
</style>