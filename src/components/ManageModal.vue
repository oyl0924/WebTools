<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, CloseOutlined, EditOutlined, DeleteOutlined, DesktopOutlined, SettingOutlined } from '@ant-design/icons-vue'
import type { Website } from '../types'
import AddWebsiteModal from './AddWebsiteModal.vue'
import EditWebsiteModal from './EditWebsiteModal.vue'
import CustomButtonModal from './CustomButtonModal.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': []
}>()

const websites = ref<Website[]>([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const showCustomButtonModal = ref(false)
const currentWebsite = ref<Website | null>(null)

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

// 切换窗口模式
const toggleWindowMode = async (website: Website) => {
  // 循环切换：normal -> maximized -> fullscreen -> normal
  let newMode: 'normal' | 'maximized' | 'fullscreen'
  const currentMode = website.windowMode || (website.fullscreen ? 'fullscreen' : 'maximized')
  
  if (currentMode === 'normal') {
    newMode = 'maximized'
  } else if (currentMode === 'maximized') {
    newMode = 'fullscreen'
  } else {
    newMode = 'normal'
  }
  
  try {
    await window.ipcRenderer.invoke('update-website', website.id, {
      windowMode: newMode
    })
    message.success('设置成功')
    await loadWebsites()
  } catch (error) {
    message.error('设置失败')
    console.error(error)
  }
}

// 打开编辑弹窗
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

// 添加到桌面
const addToDesktop = async (website: Website) => {
  try {
    await window.ipcRenderer.invoke('add-to-desktop', {
      id: website.id,
      name: website.name,
      url: website.url,
      icon: website.icon
    })
    message.success('添加到桌面成功')
  } catch (error) {
    message.error('添加到桌面失败')
    console.error(error)
  }
}

// 关闭弹窗
const handleClose = () => {
  emit('update:open', false)
}

// 打开添加弹窗
const openAddModal = () => {
  showAddModal.value = true
}

// 添加成功回调
const handleAddSuccess = async () => {
  showAddModal.value = false
  await loadWebsites()
  emit('success')
}

// 编辑成功回调
const handleEditSuccess = async () => {
  showEditModal.value = false
  await loadWebsites()
  emit('success')
}

// 自定义按钮成功回调
const handleCustomButtonSuccess = async () => {
  showCustomButtonModal.value = false
  await loadWebsites()
  emit('success')
}

onMounted(() => {
  if (props.open) {
    loadWebsites()
  }
})

// 监听 open 变化，重新加载数据
const handleOpenChange = (open: boolean) => {
  if (open) {
    loadWebsites()
  }
}

// 使用 watch 监听 props.open
import { watch } from 'vue'
watch(() => props.open, handleOpenChange)
</script>

<template>
  <a-modal
    :open="open"
    title="网站管理"
    :footer="null"
    :width="900"
    @cancel="handleClose"
  >
    <template #closeIcon>
      <CloseOutlined />
    </template>

    <div class="manage-content">
      <!-- 新增按钮 -->
      <div class="manage-header">
        <a-button type="primary" @click="openAddModal">
          <template #icon>
            <PlusOutlined />
          </template>
          新增
        </a-button>
      </div>

      <!-- 网站列表 -->
      <a-table
        :dataSource="websites"
        :columns="[
          { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
          { title: '图标', dataIndex: 'icon', key: 'icon', width: 80 },
          { title: '窗口大小', dataIndex: 'windowMode', key: 'windowMode', width: 120 },
          { title: '操作', key: 'action', width: 350 }
        ]"
        :pagination="false"
        :scroll="{ y: 400 }"
        rowKey="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'icon'">
            <img v-if="record.icon" :src="record.icon" class="website-icon-img" />
            <span v-else>-</span>
          </template>

          <template v-else-if="column.key === 'windowMode'">
            <a-button size="small" @click="toggleWindowMode(record)">
              {{ record.windowMode === 'normal' ? '正常' : record.windowMode === 'maximized' ? '最大化' : record.windowMode === 'fullscreen' ? '全屏' : (record.fullscreen ? '全屏' : '最大化') }}
            </a-button>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="openEditModal(record)">
                <template #icon>
                  <EditOutlined />
                </template>
                编辑
              </a-button>
              <a-button size="small" @click="deleteWebsite(record)" danger>
                <template #icon>
                  <DeleteOutlined />
                </template>
                删除
              </a-button>
              <a-button size="small" @click="addToDesktop(record)">
                <template #icon>
                  <DesktopOutlined />
                </template>
                添加到桌面
              </a-button>
              <a-button size="small" @click="openCustomButtonModal(record)">
                <template #icon>
                  <SettingOutlined />
                </template>
                自定义按钮
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
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
  </a-modal>
</template>

<style scoped>
.manage-content {
  padding: 16px 0;
}

.manage-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-start;
}

.website-icon-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 4px;
}
</style>
