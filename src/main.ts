import { createApp } from 'vue'
import './style.css'
import './styles/dark-theme.css'
import App from './App.vue'
import router from './router'
import Antd, { message, notification } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

// 配置消息和通知的偏移量，避开自定义标题栏（32px）
message.config({
  top: '80px', // 默认32px + 一些额外间距
  duration: 3,
})

notification.config({
  top: '80px', // 默认24px + 32px标题栏高度 + 一些额外间距
  duration: 4.5,
})

const app = createApp(App)
app.use(router)
app.use(Antd)
app.mount('#app').$nextTick(() => {
  // Use contextBridge
  window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log(message)
  })
})
