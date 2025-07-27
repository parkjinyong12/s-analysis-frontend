import { RouteRecordRaw } from 'vue-router'
import HomeBoard from '../features/home/HomeBoard.vue'
import StockBoard from '../features/stock/StockBoard.vue'
import TradingBoard from '../features/trading/TradingBoard.vue'
import HistoryBoard from '../features/history/HistoryBoard.vue'
import DataCollector from '../features/collector/DataCollector.vue'
import ApiTest from '../features/api-test/ApiTest.vue'
import ApiSettings from '../features/settings/ApiSettings.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomeBoard,
    meta: {
      title: '대시보드',
      icon: '🏠'
    }
  },
  {
    path: '/stock',
    name: 'Stock',
    component: StockBoard,
    meta: {
      title: '주식 목록',
      icon: '📊'
    }
  },
  {
    path: '/trading',
    name: 'Trading',
    component: TradingBoard,
    meta: {
      title: '거래 현황',
      icon: '📈'
    }
  },
  {
    path: '/collector',
    name: 'Collector',
    component: DataCollector,
    meta: {
      title: '데이터 수집',
      icon: '🔄'
    }
  },
  {
    path: '/history',
    name: 'History',
    component: HistoryBoard,
    meta: {
      title: '거래 기록',
      icon: '📋'
    }
  },
  {
    path: '/api-test',
    name: 'ApiTest',
    component: ApiTest,
    meta: {
      title: 'API 상태',
      icon: '🧪'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: ApiSettings,
    meta: {
      title: '시스템 설정',
      icon: '⚙️'
    }
  }
]

export default routes 