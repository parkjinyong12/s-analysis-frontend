/**
 * API 설정 파일
 * 모든 API 호출에 대한 중앙화된 설정을 제공합니다.
 */
import axios from 'axios';

// API 기본 설정 (반응형)
import { reactive } from 'vue';

const API_CONFIG = reactive({
  // 개발 환경에서의 백엔드 서버 URL
  BASE_URL: localStorage.getItem('api_base_url') || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001',
  
  // 요청 타임아웃 (밀리초)
  TIMEOUT: parseInt(localStorage.getItem('api_timeout')) || import.meta.env.VITE_API_TIMEOUT || 10000,
  
  // 기본 헤더
  HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // 디버그 모드
  DEBUG: localStorage.getItem('api_debug') === 'true' || false
});

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS
});

// axios 인스턴스 업데이트 함수
function updateAxiosConfig() {
  apiClient.defaults.baseURL = API_CONFIG.BASE_URL;
  apiClient.defaults.timeout = API_CONFIG.TIMEOUT;
}

// 요청 인터셉터 (필요시 토큰 추가 등)
apiClient.interceptors.request.use(
  (config) => {
    // 요청 전 처리 (예: 로딩 상태 설정)
    if (API_CONFIG.DEBUG) {
      console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => {
    // 응답 성공 처리
    if (API_CONFIG.DEBUG) {
      console.log(`API 응답: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // 응답 에러 처리
    if (API_CONFIG.DEBUG) {
      console.error('API 응답 오류:', error.response?.status, error.response?.data);
    }
    
    // 공통 에러 처리
    if (error.response?.status === 404) {
      if (API_CONFIG.DEBUG) {
        console.warn('API 엔드포인트를 찾을 수 없습니다:', error.config?.url);
      }
    } else if (error.response?.status >= 500) {
      console.error('서버 내부 오류가 발생했습니다.');
    }
    
    return Promise.reject(error);
  }
);

// API 엔드포인트 상수 (백엔드 실제 구조에 맞춤)
export const API_ENDPOINTS = {
  // Sample API
  SAMPLES: '/api/v1/samples',
  
  // Stock API
  STOCKS: '/api/v1/stocks',
  STOCKS_BULK_CREATE: '/api/v1/stocks/bulk-create',
  STOCKS_COLLECT_LIST: '/api/v1/stocks/collect-list',
  STOCKS_AUTO_ADD: '/api/v1/stocks/auto-add',
  STOCKS_UPLOAD_EXCEL: '/api/v1/stocks/upload-excel',
  
  // Trading API
  TRADING: {
    LIST: '/api/v1/trading',
    SEARCH: '/api/v1/trading/search',
    DATE_RANGE: '/api/v1/trading/date-range',
    BY_STOCK_CODE: '/api/v1/trading/stock',
    CREATE: '/api/v1/trading',
    UPDATE: '/api/v1/trading',
    DELETE: '/api/v1/trading'
  },
  
  // Collector API
  COLLECTOR: {
    STATUS: '/api/v1/collector/status',
    START: '/api/v1/collector/start',
    STOP: '/api/v1/collector/stop',
    RESET: '/api/v1/collector/reset',
    STOCKS: '/api/v1/collector/stocks',
    CLEAR_ALL_TRADING: '/api/v1/collector/clear-all-trading-data',
    CLEAR_TRADING_BY_STOCK: '/api/v1/collector/clear-trading-data',
    CLEAR_TRADING_BULK: '/api/v1/collector/clear-trading-data-bulk',
    CALCULATE_ACCUMULATED: '/api/v1/collector/calculate-accumulated'
  },
  
  // API Test
  API_TEST: {
    HEALTH: '/api/v1/test/health',
    ENDPOINTS: '/api/v1/test/endpoints',
    DATABASE: '/api/v1/test/database',
    DATABASE_INIT: '/api/v1/test/database/init',
    TEST_MODE_START: '/api/v1/test/test-mode/start',
    TEST_MODE_END: '/api/v1/test/test-mode/end',
    TEST_MODE_STATUS: '/api/v1/test/test-mode/status'
  },
  
  // History
  HISTORY: {
    DATA: '/api/v1/history/data',
    SYSTEM: '/api/v1/history/system',
    LATEST: '/api/v1/history/latest',
    SUMMARY: '/api/v1/history/summary',
    STATS: '/api/v1/history/stats',
    CLEAR: '/api/v1/history/clear'
  },
  
  // Health Check
  HEALTH: '/health'
};

// 설정 관리 함수들
export const apiSettings = {
  // 설정 조회
  getConfig: () => ({ ...API_CONFIG }),
  
  // 기본 URL 변경
  setBaseURL: (url) => {
    API_CONFIG.BASE_URL = url;
    localStorage.setItem('api_base_url', url);
    updateAxiosConfig();
  },
  
  // 타임아웃 변경
  setTimeout: (timeout) => {
    API_CONFIG.TIMEOUT = timeout;
    localStorage.setItem('api_timeout', timeout.toString());
    updateAxiosConfig();
  },
  
  // 디버그 모드 토글
  setDebug: (debug) => {
    API_CONFIG.DEBUG = debug;
    localStorage.setItem('api_debug', debug.toString());
  },
  
  // 설정 초기화
  resetToDefaults: () => {
    const defaultURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001';
    const defaultTimeout = import.meta.env.VITE_API_TIMEOUT || 10000;
    const defaultDebug = false;
    
    API_CONFIG.BASE_URL = defaultURL;
    API_CONFIG.TIMEOUT = defaultTimeout;
    API_CONFIG.DEBUG = defaultDebug;
    
    localStorage.setItem('api_base_url', defaultURL);
    localStorage.setItem('api_timeout', defaultTimeout.toString());
    localStorage.setItem('api_debug', defaultDebug.toString());
    
    updateAxiosConfig();
  },
  
  // 연결 테스트
  testConnection: async () => {
    try {
      const response = await apiClient.get('/health', { timeout: 5000 });
      return {
        success: true,
        status: response.status,
        data: response.data,
        responseTime: response.headers['x-response-time'] || 'N/A'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 'N/A'
      };
    }
  }
};

// 편의 함수들
export const api = {
  // GET 요청
  get: (url, config = {}) => apiClient.get(url, config),
  
  // POST 요청
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  
  // PUT 요청
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  
  // DELETE 요청
  delete: (url, config = {}) => apiClient.delete(url, config),
  
  // 기본 URL 반환
  getBaseURL: () => API_CONFIG.BASE_URL
};

// 기본 내보내기
export default apiClient;

// 설정 내보내기
export { API_CONFIG }; 