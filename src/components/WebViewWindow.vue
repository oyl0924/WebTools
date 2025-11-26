<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentUrl = ref('')
const webviewRef = ref<any>(null)

onMounted(() => {
  // 从路由参数获取 URL
  const urlParam = route.query.url as string
  if (urlParam) {
    currentUrl.value = decodeURIComponent(urlParam)
  }
})

// 加载 URL
const loadUrl = (url: string) => {
  if (webviewRef.value) {
    webviewRef.value.loadURL(url)
  }
}
</script>

<template>
  <div class="webview-window">
    <div class="webview-container">
      <webview
        ref="webviewRef"
        :src="currentUrl"
        style="width: 100%; height: 100%;"
        allowpopups
      />
    </div>
  </div>
</template>

<style scoped>
.webview-window {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.webview-container {
  width: 100%;
  height: 100%;
}
</style>
