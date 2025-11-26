<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { PlusOutlined, AppstoreAddOutlined } from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import type { Website } from '../types'
import AddWebsiteModal from './AddWebsiteModal.vue'
import EditWebsiteModal from './EditWebsiteModal.vue'
import CustomButtonModal from './CustomButtonModal.vue'

const searchText = ref('')
const websites = ref<Website[]>([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const showCustomButtonModal = ref(false)
const currentWebsite = ref<Website | null>(null)
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })

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

// 打开编辑网站弹窗
const openEditModal = (website: Website) => {
  currentWebsite.value = website
  showEditModal.value = true
}

// 打开自定义按钮弹窗
const openCustomButtonModal = (website: Website) => {
  currentWebsite.value = website
  showCustomButtonModal.value = true
}

// 删除网站
const deleteWebsite = async (website: Website) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除 "${website.name}" 吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await window.ipcRenderer.invoke('delete-website', website.id)
        message.success('删除成功')
        await loadWebsites()
      } catch (error) {
        message.error('删除失败')
        console.error(error)
      }
    }
  })
}

// 点击网站卡片
const handleWebsiteClick = async (website: Website) => {
  if (website.id === 'add') {
    openAddModal()
  } else {
    // 创建新窗口打开网站
    try {
      await window.ipcRenderer.invoke('create-window', website.url, website.fullscreen || false)
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

// 右键菜单
const handleContextMenu = (e: MouseEvent, website: Website) => {
  e.preventDefault()
  e.stopPropagation()
  currentWebsite.value = website
  contextMenuPosition.value = { x: e.clientX, y: e.clientY }
  contextMenuVisible.value = true
}

// 添加到桌面
const addToDesktop = async (website: Website) => {
  try {
    await window.ipcRenderer.invoke('add-to-desktop', website)
    message.success('添加到桌面成功')
  } catch (error) {
    message.error('添加到桌面失败')
    console.error(error)
  }
}

// 关闭右键菜单
const closeContextMenu = (e?: Event) => {
  // 如果点击的是菜单项，延迟关闭以确保菜单项的点击事件能正常触发
  setTimeout(() => {
    contextMenuVisible.value = false
    currentWebsite.value = null
  }, 100)
}

// 添加成功回调
const handleAddSuccess = async () => {
  showAddModal.value = false
  await loadWebsites()
}

// 编辑成功回调
const handleEditSuccess = async () => {
  showEditModal.value = false
  await loadWebsites()
}

// 自定义按钮成功回调
const handleCustomButtonSuccess = async () => {
  showCustomButtonModal.value = false
  await loadWebsites()
}

onMounted(() => {
  loadWebsites()
  document.addEventListener('click', closeContextMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeContextMenu)
})
</script>

<template>
  <div class="home-page">
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
        @contextmenu="handleContextMenu($event, website)"
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

    <!-- 右键菜单 -->
    <div
      v-show="contextMenuVisible && currentWebsite"
      class="context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      @mousedown.stop
    >
      <a-menu>
        <a-menu-item key="edit" @click="openEditModal(currentWebsite!); closeContextMenu()">
          编辑
        </a-menu-item>
        <a-menu-item key="custom" @click="openCustomButtonModal(currentWebsite!); closeContextMenu()">
          自定义按钮
        </a-menu-item>
        <a-menu-item key="desktop" @click="addToDesktop(currentWebsite!); closeContextMenu()">
          添加到桌面
        </a-menu-item>
        <a-menu-divider />
        <a-menu-item key="delete" danger @click="deleteWebsite(currentWebsite!); closeContextMenu()">
          删除
        </a-menu-item>
      </a-menu>
    </div>

    <!-- 添加网站弹窗 -->
    <AddWebsiteModal
      v-model:open="showAddModal"
      @success="handleAddSuccess"
    />

    <!-- 编辑网站弹窗 -->
    <EditWebsiteModal
      v-if="currentWebsite"
      v-model:open="showEditModal"
      :website="currentWebsite"
      @success="handleEditSuccess"
    />

    <!-- 自定义按钮弹窗 -->
    <CustomButtonModal
      v-if="currentWebsite"
      v-model:open="showCustomButtonModal"
      :website="currentWebsite"
      @success="handleCustomButtonSuccess"
    />
  </div>
</template>

<style scoped>
.home-page {
  padding: 40px;
  min-height: 100vh;
  background: #f0f2f5;
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

.context-menu {
  position: fixed;
  z-index: 1000;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
