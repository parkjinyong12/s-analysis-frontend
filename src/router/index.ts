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
      title: '홈',
      icon: 'home'
    }
  },
  {
    path: '/stock',
    name: 'Stock',
    component: StockBoard,
    meta: {
      title: '주식 관리',
      icon: 'chart-bar'
    }
  },
  {
    path: '/trading',
    name: 'Trading',
    component: TradingBoard,
    meta: {
      title: '거래 데이터',
      icon: 'currency-dollar'
    }
  },
  {
    path: '/history',
    name: 'History',
    component: HistoryBoard,
    meta: {
      title: '히스토리',
      icon: 'clock'
    }
  },
  {
    path: '/collector',
    name: 'DataCollector',
    component: DataCollector,
    meta: {
      title: '데이터 수집',
      icon: 'cloud-download'
    }
  },
  {
    path: '/api-test',
    name: 'ApiTest',
    component: ApiTest,
    meta: {
      title: 'API 테스트',
      icon: 'code-bracket'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: ApiSettings,
    meta: {
      title: '설정',
      icon: 'cog'
    }
  }
]

export default routes 