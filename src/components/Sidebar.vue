<template>
  <div class="sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
    <div class="sidebar-header">
      <router-link to="/" class="logo-link">
        <h3>📊 Stock Analysis</h3>
      </router-link>
      <button @click="appStore.toggleSidebar" class="toggle-btn">
        <span v-if="appStore.sidebarCollapsed">→</span>
        <span v-else>←</span>
      </button>
    </div>
    
    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li v-for="route in routes" :key="route.path" class="nav-item">
          <router-link 
            :to="route.path" 
            class="nav-link" 
            :class="{ active: $route.path === route.path }"
          >
            <span class="nav-icon">{{ route.meta?.icon || '📄' }}</span>
            <span v-if="!appStore.sidebarCollapsed" class="nav-text">{{ route.meta?.title || route.name }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import routes from '../router'

const route = useRoute()
const appStore = useAppStore()
</script>

<style scoped>
.sidebar {
  width: 180px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: #fff;
  height: 100vh;
  padding-top: 20px;
  position: fixed;
  left: 0;
  top: 0;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 0 20px 20px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-link {
  text-decoration: none;
  color: inherit;
  display: block;
  transition: all 0.3s ease;
  flex: 1;
}

.logo-link:hover {
  transform: scale(1.05);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.toggle-btn {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.toggle-btn:hover {
  background: rgba(255,255,255,0.1);
}

.sidebar-nav {
  padding: 0 10px;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 4px;
  border-radius: 8px;
  overflow: hidden;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: rgba(255,255,255,0.9);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 8px;
  position: relative;
}

.nav-link:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.nav-link.active {
  background: rgba(255,255,255,0.95);
  color: var(--primary-color);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.nav-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #fff;
  border-radius: 0 2px 2px 0;
}

.nav-icon {
  font-size: 18px;
  margin-right: 12px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.nav-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 호버 시 아이콘 애니메이션 */
.nav-link:hover .nav-icon {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}

/* 활성 상태에서 아이콘 강조 */
.nav-link.active .nav-icon {
  transform: scale(1.05);
}

/* 접힌 상태에서 텍스트 숨김 */
.sidebar.collapsed .nav-text {
  display: none;
}

.sidebar.collapsed .sidebar-header h3 {
  font-size: 12px;
}

.sidebar.collapsed .nav-icon {
  margin-right: 0;
  font-size: 20px;
}

.sidebar.collapsed .nav-link {
  justify-content: center;
  padding: 16px 8px;
}

/* 스크롤바 스타일링 */
.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.1);
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.5);
}

/* 반응형 */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  
  .sidebar-header h3 {
    font-size: 12px;
  }
  
  .nav-text {
    display: none;
  }
  
  .nav-icon {
    margin-right: 0;
    font-size: 20px;
  }
  
  .nav-link {
    justify-content: center;
    padding: 16px 8px;
  }
}
</style> 