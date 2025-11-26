// 网站数据类型
export interface Website {
  id: string
  name: string
  url: string
  icon?: string
  fullscreen?: boolean
  customButtons: CustomButton[]
}

// 自定义按钮类型
export interface CustomButton {
  id: string
  name: string
  url: string
  openMode: 'newWindow' | 'newTab' | 'currentPage'
}

// 打开方式选项
export const OPEN_MODE_OPTIONS = [
  { label: '新窗口', value: 'newWindow' },
  { label: '新标签页', value: 'newTab' },
  { label: '本页打开', value: 'currentPage' }
]

// IPC 通道名称
export const IPC_CHANNELS = {
  // 网站管理
  GET_WEBSITES: 'get-websites',
  ADD_WEBSITE: 'add-website',
  UPDATE_WEBSITE: 'update-website',
  DELETE_WEBSITE: 'delete-website',
  
  // 自定义按钮
  ADD_CUSTOM_BUTTON: 'add-custom-button',
  UPDATE_CUSTOM_BUTTON: 'update-custom-button',
  DELETE_CUSTOM_BUTTON: 'delete-custom-button',
  
  // 窗口操作
  CREATE_WINDOW: 'create-window',
  NAVIGATE_TO_URL: 'navigate-to-url'
}
