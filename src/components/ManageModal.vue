<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, CloseOutlined, EditOutlined, DeleteOutlined, DesktopOutlined, SettingOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons-vue'
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
const selectedRowKeys = ref<string[]>([])
const selectedWebsites = ref<Website[]>([])

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
    // 立即触发成功回调，通知父组件更新
    emit('success')
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
        // 立即触发成功回调，通知父组件更新
        emit('success')
      } catch (error) {
        message.error('删除失败')
        console.error(error)
      }
    }
  })
}

// 批量删除网站
const batchDeleteWebsites = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的网站')
    return
  }

  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 个网站吗？`,
    okText: '确定',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        // 批量删除选中的网站
        for (const websiteId of selectedRowKeys.value) {
          await window.ipcRenderer.invoke('delete-website', websiteId)
        }
        message.success(`成功删除 ${selectedRowKeys.value.length} 个网站`)
        // 清空选择
        selectedRowKeys.value = []
        selectedWebsites.value = []
        await loadWebsites()
        // 立即触发成功回调，通知父组件更新
        emit('success')
      } catch (error) {
        message.error('批量删除失败')
        console.error(error)
      }
    }
  })
}

// 选择变化处理
const handleSelectionChange = (selectedKeys: string[], selectedRows: Website[]) => {
  selectedRowKeys.value = selectedKeys
  selectedWebsites.value = selectedRows
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

// 导出网站数据
const exportWebsites = () => {
  try {
    const dataStr = JSON.stringify(websites.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `websites_backup_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    message.success('导出成功')
  } catch (error) {
    message.error('导出失败')
    console.error(error)
  }
}

// 导入网站数据
const importWebsites = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedWebsites = JSON.parse(text) as Website[]

      if (!Array.isArray(importedWebsites)) {
        throw new Error('无效的数据格式')
      }

      // 验证数据格式
      for (const website of importedWebsites) {
        if (!website.name || !website.url) {
          throw new Error('数据格式错误：缺少必填字段')
        }
      }

      Modal.confirm({
        title: '确认导入',
        content: `确定要导入 ${importedWebsites.length} 个网站吗？这将不会影响现有的网站。`,
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          try {
            // 为每个导入的网站生成新ID并添加
            for (const website of importedWebsites) {
              const newWebsite = {
                ...website,
                id: undefined, // 让系统生成新ID
                customButtons: website.customButtons || []
              }
              await window.ipcRenderer.invoke('add-website', newWebsite)
            }
            message.success(`成功导入 ${importedWebsites.length} 个网站`)
            await loadWebsites()
            emit('success')
          } catch (error) {
            message.error('导入失败')
            console.error(error)
          }
        }
      })
    } catch (error) {
      message.error('文件格式错误，请选择有效的JSON文件')
      console.error(error)
    }
  }
  input.click()
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
        <a-button @click="importWebsites">
          <template #icon>
            <UploadOutlined />
          </template>
          导入
        </a-button>
        <a-button @click="exportWebsites">
          <template #icon>
            <DownloadOutlined />
          </template>
          导出
        </a-button>
        <a-button
          danger
          @click="batchDeleteWebsites"
          :disabled="selectedRowKeys.length === 0"
        >
          <template #icon>
            <DeleteOutlined />
          </template>
          批量删除 ({{ selectedRowKeys.length }})
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
        :rowSelection="{
          selectedRowKeys: selectedRowKeys,
          onChange: handleSelectionChange
        }"
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
  gap: 12px;
}

.website-icon-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 4px;
}
</style>
