<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import type { Website, CustomButton } from '../types'
import { OPEN_MODE_OPTIONS } from '../types'

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

const showButtonForm = ref(false)
const editingButton = ref<CustomButton | null>(null)
const formRef = ref()
const formState = reactive({
  name: '',
  url: '',
  openMode: 'newWindow' as 'newWindow' | 'newTab' | 'currentPage'
})

const rules = {
  name: [
    { required: true, message: '请输入按钮名称', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入网址', trigger: 'blur' },
    { type: 'url', message: '请输入有效的网址', trigger: 'blur' }
  ],
  openMode: [
    { required: true, message: '请选择打开方式', trigger: 'change' }
  ]
}

// 关闭主弹窗
const handleClose = () => {
  emit('update:open', false)
}

// 添加新按钮
const handleAddButton = () => {
  editingButton.value = null
  formState.name = ''
  formState.url = ''
  formState.openMode = 'newWindow'
  showButtonForm.value = true
}

// 编辑按钮
const handleEditButton = (button: CustomButton) => {
  editingButton.value = button
  formState.name = button.name
  formState.url = button.url
  formState.openMode = button.openMode
  showButtonForm.value = true
}

// 删除按钮
const handleDeleteButton = (button: CustomButton) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除按钮 "${button.name}" 吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await window.ipcRenderer.invoke('delete-custom-button', props.website.id, button.id)
        message.success('删除成功')

        // 通知主进程该网站的自定义按钮已更新，用于同步到已打开的子窗口
        if (window.ipcRenderer) {
          window.ipcRenderer.send('custom-buttons-updated', props.website.id)
        }

        emit('success')
      } catch (error) {
        message.error('删除失败')
        console.error(error)
      }
    }
  })
}

// 提交按钮表单
const handleSubmitButton = async () => {
  try {
    await formRef.value?.validate()
    
    const buttonData = {
      name: formState.name,
      url: formState.url,
      openMode: formState.openMode
    }

    if (editingButton.value) {
      // 更新按钮
      await window.ipcRenderer.invoke(
        'update-custom-button',
        props.website.id,
        editingButton.value.id,
        buttonData
      )
      message.success('更新成功')
    } else {
      // 添加按钮
      await window.ipcRenderer.invoke('add-custom-button', props.website.id, buttonData)
      message.success('添加成功')
    }

    // 通知主进程该网站的自定义按钮已更新，用于同步到已打开的子窗口
    if (window.ipcRenderer) {
      window.ipcRenderer.send('custom-buttons-updated', props.website.id)
    }

    showButtonForm.value = false
    emit('success')
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 关闭按钮表单
const handleCancelButtonForm = () => {
  showButtonForm.value = false
  formRef.value?.resetFields()
}
</script>

<template>
  <a-modal
    :open="open"
    :title="`管理自定义按钮 - ${website.name}`"
    :width="700"
    @cancel="handleClose"
    :footer="null"
  >
    <div class="button-manager">
      <!-- 按钮列表 -->
      <div class="button-list">
        <a-button 
          type="dashed" 
          block 
          @click="handleAddButton"
          style="margin-bottom: 16px"
        >
          <PlusOutlined /> 添加按钮
        </a-button>

        <a-list
          v-if="website.customButtons && website.customButtons.length > 0"
          :data-source="website.customButtons"
          :grid="{ gutter: 16, column: 2 }"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-card>
                <template #title>
                  {{ item.name }}
                </template>
                <template #extra>
                  <a-space>
                    <a-button 
                      type="link" 
                      size="small"
                      @click="handleEditButton(item)"
                    >
                      <EditOutlined />
                    </a-button>
                    <a-button 
                      type="link" 
                      danger 
                      size="small"
                      @click="handleDeleteButton(item)"
                    >
                      <DeleteOutlined />
                    </a-button>
                  </a-space>
                </template>
                <p class="button-url">{{ item.url }}</p>
                <a-tag>
                  {{ OPEN_MODE_OPTIONS.find(o => o.value === item.openMode)?.label }}
                </a-tag>
              </a-card>
            </a-list-item>
          </template>
        </a-list>

        <a-empty 
          v-else 
          description="暂无自定义按钮"
          style="margin-top: 40px"
        />
      </div>

      <!-- 按钮表单弹窗 -->
      <a-modal
        :open="showButtonForm"
        :title="editingButton ? '编辑按钮' : '添加按钮'"
        :width="500"
        @cancel="handleCancelButtonForm"
        @ok="handleSubmitButton"
      >
        <a-form
          ref="formRef"
          :model="formState"
          :rules="rules"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 18 }"
        >
          <a-form-item label="按钮名称" name="name">
            <a-input v-model:value="formState.name" placeholder="请输入按钮名称" />
          </a-form-item>

          <a-form-item label="网址" name="url">
            <a-input 
              v-model:value="formState.url" 
              placeholder="请输入网址"
            />
          </a-form-item>

          <a-form-item label="打开方式" name="openMode">
            <a-select v-model:value="formState.openMode">
              <a-select-option
                v-for="option in OPEN_MODE_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </a-modal>
</template>

<style scoped>
.button-manager {
  max-height: 500px;
  overflow-y: auto;
}

.button-url {
  color: #666;
  font-size: 12px;
  word-break: break-all;
  margin-bottom: 8px;
}
</style>
