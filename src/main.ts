import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import routes from './router'
import pinia from './stores'

// 스타일
import './assets/styles/main.scss'

// 라우터 설정
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 앱 생성
const app = createApp(App)

// 플러그인 등록
app.use(pinia)
app.use(router)
app.use(Toast, {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
})

// 앱 마운트
app.mount('#app') 