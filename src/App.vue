<template>
  <div id="app" class="app-layout" :data-theme="appStore.theme">
    <Sidebar />
    <main class="main-content">
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
    
    <!-- 알림 토스트 -->
    <div v-for="notification in appStore.notifications" 
         :key="notification.id" 
         :class="['notification-toast', notification.type]">
      <span>{{ notification.message }}</span>
      <button @click="appStore.removeNotification(notification.id)" class="close-btn">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import { useAppStore } from './stores/app'

const appStore = useAppStore()

onMounted(() => {
  appStore.init()
})
</script>

<style>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-secondary);
}

.main-content {
  flex: 1;
  margin-left: 180px;
  padding: 40px 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  transition: margin-left 0.3s ease;
}

/* 반응형 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 60px;
  }
}

.content-wrapper {
  min-width: 700px;
  min-height: 600px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  padding: 32px 24px 24px 24px;
  width: 100%;
  max-width: 900px;
}

/* 알림 토스트 스타일 */
.notification-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: var(--border-radius);
  color: white;
  font-weight: 500;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 300px;
  box-shadow: var(--shadow-lg);
  animation: slideIn 0.3s ease-out;
}

.notification-toast.success {
  background: var(--success-color);
}

.notification-toast.error {
  background: var(--error-color);
}

.notification-toast.warning {
  background: var(--warning-color);
}

.notification-toast.info {
  background: var(--info-color);
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
