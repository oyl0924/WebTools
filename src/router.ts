import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from './components/HomePage.vue'
import WebViewWindow from './components/WebViewWindow.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/webview',
    name: 'WebView',
    component: WebViewWindow
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
