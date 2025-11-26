<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { AppstoreAddOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { Website } from '../types'
import AddWebsiteModal from './AddWebsiteModal.vue'
import ManageModal from './ManageModal.vue'

const searchText = ref('')
const websites = ref<Website[]>([])
const showAddModal = ref(false)
const showManageModal = ref(false)

// 过滤后的网站列表
const filteredWebsites = computed(() => {
  if (!searchText.value) return websites.value
  return websites.value.filter(site => 
    site.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
    site.url.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 加载网站数据
const loadWebsites = async () => {
  try {
    const data = await window.ipcRenderer.invoke('get-websites')
    websites.value = data
  } catch (error) {
    message.error('加载网站失败')
    console.error(error)
  }
}

// 打开添加网站弹窗
const openAddModal = () => {
  showAddModal.value = true
}

// 打开管理弹窗
const openManageModal = () => {
  showManageModal.value = true
}

// 点击网站卡片
const handleWebsiteClick = async (website: Website) => {
  if (website.id === 'add') {
    openAddModal()
  } else {
    // 创建新窗口打开网站，传递网站名称和窗口模式
    try {
      // 兼容旧数据：如果没有 windowMode，根据 fullscreen 决定
      const windowMode = website.windowMode || (website.fullscreen ? 'fullscreen' : 'maximized')
      await window.ipcRenderer.invoke('create-window', website.url, windowMode, website.name)
    } catch (error) {
      message.error('打开网站失败')
      console.error(error)
    }
  }
}

// 点击自定义按钮
const handleCustomButtonClick = async (button: any, event: Event) => {
  event.stopPropagation()
  
  try {
    if (button.openMode === 'newWindow') {
      await window.ipcRenderer.invoke('create-window', button.url)
    } else if (button.openMode === 'newTab') {
      // 在同一个窗口打开新标签页（创建新窗口）
      await window.ipcRenderer.invoke('create-window', button.url)
    } else if (button.openMode === 'currentPage') {
      // 本页打开（将当前窗口导航到目标 URL）
      window.location.href = button.url
    }
  } catch (error) {
    message.error('打开链接失败')
    console.error(error)
  }
}

// 添加成功回调
const handleAddSuccess = async () => {
  showAddModal.value = false
  await loadWebsites()
}

// 管理成功回调
const handleManageSuccess = async () => {
  await loadWebsites()
}

onMounted(() => {
  loadWebsites()
})
</script>

<template>
  <div class="home-page">
    <!-- 管理按钮 -->
    <div class="manage-button-wrapper">
      <a-button type="primary" size="large" @click="openManageModal">
        <template #icon>
          <SettingOutlined />
        </template>
        管理
      </a-button>
    </div>

    <!-- 搜索框 -->
    <div class="search-bar">
      <a-input-search
        v-model:value="searchText"
        placeholder="搜索网站..."
        size="large"
        style="max-width: 600px"
      />
    </div>

    <!-- 网站图标网格 -->
    <div class="website-grid">
      <!-- 网站卡片 -->
      <div
        v-for="website in filteredWebsites"
        :key="website.id"
        class="website-card"
        @click="handleWebsiteClick(website)"
      >
        <div class="website-icon">
          <img v-if="website.icon" :src="website.icon" alt="" />
          <AppstoreAddOutlined v-else :style="{ fontSize: '48px' }" />
        </div>
        <div class="website-name">{{ website.name }}</div>
        
        <!-- 自定义按钮 -->
        <div class="custom-buttons" v-if="website.customButtons && website.customButtons.length > 0">
          <a-button
            v-for="button in website.customButtons"
            :key="button.id"
            size="small"
            @click="handleCustomButtonClick(button, $event)"
          >
            {{ button.name }}
          </a-button>
        </div>
      </div>

      <!-- 添加网站卡片 -->
      <div 
        class="website-card add-card"
        @click="openAddModal"
      >
        <div class="website-icon">
          <AppstoreAddOutlined :style="{ fontSize: '48px' }" />
        </div>
        <div class="website-name">添加</div>
      </div>
    </div>

    <!-- 添加网站弹窗 -->
    <AddWebsiteModal
      v-model:open="showAddModal"
      @success="handleAddSuccess"
    />

    <!-- 管理弹窗 -->
    <ManageModal
      v-model:open="showManageModal"
      @success="handleManageSuccess"
    />
  </div>
</template>

<style scoped>
.home-page {
  padding: 40px;
  min-height: 100vh;
  background: #f0f2f5;
  position: relative;
}

.manage-button-wrapper {
  position: absolute;
  top: 20px;
  right: 40px;
  z-index: 10;
}

.search-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.website-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.website-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.website-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.add-card {
  border: 2px dashed #d9d9d9;
  background: #fafafa;
}

.add-card:hover {
  border-color: #1890ff;
  background: #e6f7ff;
}

.website-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1890ff;
}

.website-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.website-name {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  word-break: break-word;
}

.custom-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}
</style>
