<template>
  <div class="data-collector">
    <!-- 헤더 -->
    <div class="collector-header">
      <h2>📊 데이터 수집</h2>
      <p class="description">네이버 금융에서 주식 거래 데이터를 수집합니다</p>
    </div>

    <!-- 수집 설정 -->
    <div class="collector-settings" v-if="!status.is_running">
      <div class="settings-row">
        <div class="setting-group">
          <label for="years">수집 기간:</label>
          <select id="years" v-model="settings.years" class="form-select">
            <option value="1">1년</option>
            <option value="2">2년</option>
            <option value="3">3년</option>
            <option value="5">5년</option>
          </select>
        </div>
        
        <div class="setting-group">
          <label for="maxPages">최대 페이지:</label>
          <select id="maxPages" v-model="settings.max_pages" class="form-select">
            <option value="5">5페이지</option>
            <option value="10">10페이지</option>
            <option value="15">15페이지</option>
            <option value="20">20페이지</option>
            <option value="30">30페이지</option>
            <option value="40">40페이지</option>
            <option value="50">50페이지 (최대)</option>
          </select>
        </div>
      </div>
      
      <!-- 관리 버튼들 -->
      <div class="management-buttons">
        <button @click="clearAllTradingData" class="btn btn-danger" :disabled="isLoading">
          🗑️ 전체 거래 데이터 초기화
        </button>
        <button @click="calculateAccumulatedData" class="btn btn-info" :disabled="isLoading">
          📊 누적 데이터 계산
        </button>
      </div>
      
      <div class="setting-info">
        <p>💡 <strong>{{ stockList.length }}개 종목</strong>의 최근 {{ settings.years }}년간 데이터를 수집합니다 (종목당 최대 {{ settings.max_pages }}페이지)</p>
        <p>⏱️ 예상 소요 시간: 약 {{ estimatedTime }}분</p>
        <p class="setting-note">📄 페이지 수가 많을수록 더 많은 과거 데이터를 수집할 수 있지만, 시간이 오래 걸립니다.</p>
        <p class="warning-note" v-if="settings.max_pages >= 40">
          ⚠️ <strong>{{ settings.max_pages }}페이지 수집 시 주의사항:</strong><br>
          • 수집 시간이 매우 오래 걸릴 수 있습니다 ({{ Math.ceil(estimatedTime) }}분 예상)<br>
          • 네트워크 연결 상태를 확인해주세요<br>
          • 수집 중 브라우저를 닫지 마세요
        </p>
      </div>
    </div>

    <!-- 진행률 표시 -->
    <div class="progress-section" v-if="status.is_running || status.current_phase !== 'idle'">
      <div class="progress-header">
        <h3>{{ getPhaseText(status.current_phase) }}</h3>
        <div class="progress-stats">
          <span class="stat success">성공: {{ status.success_count }}</span>
          <span class="stat failed">실패: {{ status.failed_count }}</span>
          <span class="stat total">전체: {{ status.total_stocks }}</span>
        </div>
      </div>

      <!-- 진행률 바 -->
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: status.progress + '%' }"
            :class="getProgressClass(status.current_phase)"
          ></div>
        </div>
        <span class="progress-text">{{ status.progress }}%</span>
        <div class="progress-indicator" v-if="status.is_running">
          <div class="spinner"></div>
          <span>실시간 업데이트 중...</span>
        </div>
      </div>

      <!-- 현재 처리 중인 주식 -->
      <div class="current-stock" v-if="status.current_stock">
        <p>🔄 현재 처리 중: <strong>{{ status.current_stock }}</strong></p>
      </div>

      <!-- 경과 시간 -->
      <div class="elapsed-time" v-if="status.elapsed_time">
        <p>⏱️ 경과 시간: {{ formatElapsedTime(status.elapsed_time) }}</p>
      </div>
    </div>

    <!-- 제어 버튼 -->
    <div class="control-buttons">
      <button 
        @click="startCollection" 
        :disabled="status.is_running || isLoading"
        class="btn btn-primary"
        v-if="!status.is_running"
      >
        <span v-if="isLoading">⏳ 시작 중...</span>
        <span v-else>🚀 수집 시작</span>
      </button>

      <button 
        @click="stopCollection" 
        :disabled="!status.is_running || status.current_phase === 'stopping'"
        class="btn btn-danger"
        v-if="status.is_running"
      >
        <span v-if="status.current_phase === 'stopping'">⏳ 중단 중...</span>
        <span v-else>⏹️ 수집 중단</span>
      </button>

      <button 
        @click="resetStatus" 
        :disabled="status.is_running"
        class="btn btn-secondary"
        v-if="status.current_phase === 'completed' || status.current_phase === 'error' || status.current_phase === 'cancelled'"
      >
        🔄 초기화
      </button>
    </div>

    <!-- 오류 메시지 -->
    <div class="error-message" v-if="status.error_message">
      <h4>❌ 오류 발생</h4>
      <p>{{ status.error_message }}</p>
    </div>

    <!-- 실패한 주식 목록 -->
    <div class="failed-stocks" v-if="status.failed_stocks && status.failed_stocks.length > 0">
      <h4>⚠️ 실패한 주식 ({{ status.failed_stocks.length }}개)</h4>
      <div class="failed-list">
        <div 
          v-for="(stock, index) in status.failed_stocks" 
          :key="index"
          class="failed-item"
        >
          {{ stock }}
        </div>
      </div>
    </div>

    <!-- 수집 가능한 주식 목록 -->
    <div class="stock-list-section" v-if="showStockList">
      <h4>📋 수집 대상 주식 목록</h4>
      <button @click="showStockList = false" class="btn btn-sm btn-outline">숨기기</button>
      <div class="stock-grid">
        <div 
          v-for="stock in stockList" 
          :key="stock.code"
          class="stock-item"
        >
          <span class="stock-code">{{ stock.code }}</span>
          <span class="stock-name">{{ stock.name }}</span>
        </div>
      </div>
    </div>

    <div class="show-stock-list" v-if="!showStockList">
      <button @click="showStockList = true" class="btn btn-sm btn-outline">
        📋 수집 대상 주식 목록 보기 ({{ stockList.length }}개)
      </button>
    </div>

    <!-- 완료 메시지 -->
    <div class="completion-message" v-if="status.current_phase === 'completed'">
      <h3>✅ 데이터 수집 완료!</h3>
      <div class="completion-stats">
        <p>📊 총 {{ status.total_stocks }}개 종목 중 {{ status.success_count }}개 성공</p>
        <p>⏱️ 총 소요 시간: {{ formatElapsedTime(status.elapsed_time) }}</p>
        <p v-if="status.failed_count > 0">⚠️ {{ status.failed_count }}개 종목 실패</p>
      </div>
    </div>
  </div>
</template>

<script>
import { api, API_ENDPOINTS } from '@/config/api'

export default {
  name: 'DataCollector',
  data() {
    return {
      settings: {
        years: 3,
        max_pages: 10
      },
      status: {
        is_running: false,
        current_stock: '',
        progress: 0,
        total_stocks: 0,
        success_count: 0,
        failed_count: 0,
        start_time: null,
        end_time: null,
        current_phase: 'idle',
        error_message: '',
        failed_stocks: [],
        elapsed_time: null
      },
      stockList: [],
      isLoading: false,
      showStockList: false,
      statusInterval: null
    }
  },
  computed: {
    estimatedTime() {
      // 주식당 페이지당 약 2초 + 네트워크 지연 고려
      const timePerStock = this.settings.max_pages * 2
      return Math.ceil((this.stockList.length * timePerStock) / 60)
    }
  },
  mounted() {
    this.loadStockList()
    this.loadStatus()
    this.startStatusPolling()
  },
  beforeUnmount() {
    this.stopStatusPolling()
  },
  methods: {
    async loadStockList() {
      try {
        const response = await api.get(API_ENDPOINTS.COLLECTOR.STOCKS)
        this.stockList = response.data.stocks || []
      } catch (error) {
        console.error('주식 목록 로딩 실패:', error)
        this.$emit('show-message', '주식 목록을 불러오는데 실패했습니다.', 'error')
      }
    },

    async loadStatus() {
      try {
        const response = await api.get(API_ENDPOINTS.COLLECTOR.STATUS)
        const newStatus = response.data
        
        // 상태가 변경되었는지 확인
        const hasChanged = JSON.stringify(this.status) !== JSON.stringify(newStatus)
        
        if (hasChanged) {
          const oldStatus = { ...this.status }
          this.status = { ...this.status, ...newStatus }
          console.log('상태 업데이트:', {
            old: oldStatus,
            new: newStatus,
            timestamp: new Date().toISOString()
          })
        }
        
        // 수집이 완료되면 폴링 간격을 다시 조정
        if (!newStatus.is_running && this.status.is_running) {
          console.log('수집 완료 - 폴링 간격 조정')
          this.stopStatusPolling()
          this.startStatusPolling()
        }
        
      } catch (error) {
        console.error('상태 로딩 실패:', error)
      }
    },

    startStatusPolling() {
      // 데이터 수집이 실행 중일 때는 300ms마다, 그 외에는 30초마다 상태 업데이트
      this.statusInterval = setInterval(() => {
        if (this.status.is_running) {
          this.loadStatus()
        } else {
          // 서버 상태 모니터링을 위해 30초마다 health 체크
          this.checkServerHealth()
        }
      }, this.status.is_running ? 300 : 30000)
    },

    async checkServerHealth() {
      try {
        await api.get(API_ENDPOINTS.API_TEST.HEALTH)
      } catch (error) {
        console.warn('서버 상태 확인 실패:', error)
      }
    },

    stopStatusPolling() {
      if (this.statusInterval) {
        clearInterval(this.statusInterval)
        this.statusInterval = null
      }
    },

    async startCollection() {
      this.isLoading = true
      try {
        const response = await api.post(API_ENDPOINTS.COLLECTOR.START, {
          years: parseInt(this.settings.years),
          max_pages: parseInt(this.settings.max_pages)
        }, {
          timeout: 300000 // 5분 타임아웃
        })
        
        this.$emit('show-message', response.data.message, 'success')
        
        // 즉시 상태 업데이트
        await this.loadStatus()
        
        // 수집이 시작되면 폴링 간격을 더 빠르게 조정
        this.stopStatusPolling()
        this.startStatusPolling()
        
        // 추가로 1초 후 한 번 더 상태 확인
        setTimeout(() => {
          if (this.status.is_running) {
            this.loadStatus()
          }
        }, 1000)
        
      } catch (error) {
        console.error('수집 시작 실패:', error)
        const message = error.response?.data?.error || '데이터 수집을 시작하는데 실패했습니다.'
        this.$emit('show-message', message, 'error')
      } finally {
        this.isLoading = false
      }
    },

    async stopCollection() {
      try {
        const response = await api.post(API_ENDPOINTS.COLLECTOR.STOP)
        this.$emit('show-message', response.data.message, 'warning')
        
      } catch (error) {
        console.error('수집 중단 실패:', error)
        const message = error.response?.data?.error || '데이터 수집을 중단하는데 실패했습니다.'
        this.$emit('show-message', message, 'error')
      }
    },

    // 전체 거래 데이터 초기화
    async clearAllTradingData() {
      if (!confirm('⚠️ 정말로 모든 거래 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
        return
      }
      
      if (!confirm('⚠️ 다시 한 번 확인합니다.\n\n모든 주식의 거래 데이터가 완전히 삭제됩니다.\n계속하시겠습니까?')) {
        return
      }

      this.isLoading = true
      try {
        const response = await api.delete(API_ENDPOINTS.COLLECTOR.CLEAR_ALL_TRADING)
        const message = `✅ ${response.data.message}\n삭제된 데이터: ${response.data.deleted_count}건`
        this.$emit('show-message', message, 'success')
      } catch (error) {
        console.error('전체 거래 데이터 초기화 실패:', error)
        const message = error.response?.data?.error || '전체 거래 데이터 초기화에 실패했습니다.'
        this.$emit('show-message', `❌ 초기화 실패: ${message}`, 'error')
      } finally {
        this.isLoading = false
      }
    },

    // 누적 데이터 계산
    async calculateAccumulatedData() {
      if (!confirm('모든 주식의 누적 매수량 데이터를 계산하시겠습니까?')) {
        return
      }

      this.isLoading = true
      try {
        const response = await api.post(API_ENDPOINTS.COLLECTOR.CALCULATE_ACCUMULATED, {}, {
          timeout: 300000 // 5분 타임아웃
        })
        this.$emit('show-message', `✅ ${response.data.message}`, 'success')
      } catch (error) {
        console.error('누적 데이터 계산 실패:', error)
        const message = error.response?.data?.error || '누적 데이터 계산에 실패했습니다.'
        this.$emit('show-message', `❌ 계산 실패: ${message}`, 'error')
      } finally {
        this.isLoading = false
      }
    },

    async resetStatus() {
      try {
        const response = await api.post(API_ENDPOINTS.COLLECTOR.RESET)
        this.$emit('show-message', response.data.message, 'info')
        this.loadStatus()
        
      } catch (error) {
        console.error('상태 초기화 실패:', error)
        const message = error.response?.data?.error || '상태를 초기화하는데 실패했습니다.'
        this.$emit('show-message', message, 'error')
      }
    },

    getPhaseText(phase) {
      const phaseTexts = {
        'idle': '대기 중',
        'initializing': '초기화 중',
        'collecting': '데이터 수집 중',
        'completed': '수집 완료',
        'error': '오류 발생',
        'cancelled': '수집 중단됨',
        'stopping': '중단 중'
      }
      return phaseTexts[phase] || phase
    },

    getProgressClass(phase) {
      const classes = {
        'initializing': 'progress-initializing',
        'collecting': 'progress-collecting',
        'completed': 'progress-completed',
        'error': 'progress-error',
        'cancelled': 'progress-cancelled'
      }
      return classes[phase] || ''
    },

    formatElapsedTime(timeStr) {
      if (!timeStr) return '0초'
      
      // "0:05:23.123456" 형식을 파싱
      const parts = timeStr.split(':')
      if (parts.length === 3) {
        const hours = parseInt(parts[0])
        const minutes = parseInt(parts[1])
        const seconds = Math.floor(parseFloat(parts[2]))
        
        if (hours > 0) {
          return `${hours}시간 ${minutes}분 ${seconds}초`
        } else if (minutes > 0) {
          return `${minutes}분 ${seconds}초`
        } else {
          return `${seconds}초`
        }
      }
      
      return timeStr
    }
  }
}
</script>

<style scoped>
.data-collector {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.collector-header {
  text-align: center;
  margin-bottom: 30px;
}

.collector-header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.description {
  color: #7f8c8d;
  font-size: 14px;
}

.collector-settings {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.settings-row {
  display: flex;
  gap: 30px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.setting-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 200px;
}

.setting-group label {
  font-weight: 600;
  min-width: 80px;
}

.form-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.setting-info {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.setting-info p {
  margin: 5px 0;
  font-size: 14px;
}

.setting-note {
  color: #6c757d;
  font-style: italic;
}

.warning-note {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 12px;
  margin-top: 10px;
  color: #856404;
  font-size: 13px;
  line-height: 1.4;
}

.progress-section {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.progress-header h3 {
  margin: 0;
  color: #2c3e50;
}

.progress-stats {
  display: flex;
  gap: 15px;
}

.stat {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.stat.success {
  background: #e8f5e8;
  color: #2e7d32;
}

.stat.failed {
  background: #ffebee;
  color: #c62828;
}

.stat.total {
  background: #e3f2fd;
  color: #1976d2;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 10px;
}

.progress-initializing {
  background: linear-gradient(90deg, #ffc107, #ff9800);
}

.progress-collecting {
  background: linear-gradient(90deg, #2196f3, #03a9f4);
}

.progress-completed {
  background: linear-gradient(90deg, #4caf50, #8bc34a);
}

.progress-error {
  background: linear-gradient(90deg, #f44336, #e57373);
}

.progress-cancelled {
  background: linear-gradient(90deg, #9e9e9e, #bdbdbd);
}

.progress-text {
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

.current-stock {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.current-stock p {
  margin: 0;
  font-size: 14px;
}

.elapsed-time p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.control-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-outline {
  background: transparent;
  border: 1px solid #007bff;
  color: #007bff;
}

.btn-outline:hover {
  background: #007bff;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.error-message {
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.error-message h4 {
  margin: 0 0 10px 0;
  color: #c62828;
}

.failed-stocks {
  background: #fff3e0;
  border: 1px solid #ff9800;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.failed-stocks h4 {
  margin: 0 0 15px 0;
  color: #ef6c00;
}

.failed-list {
  max-height: 200px;
  overflow-y: auto;
}

.failed-item {
  background: #fff;
  padding: 8px 12px;
  margin-bottom: 5px;
  border-radius: 4px;
  font-size: 13px;
  border-left: 3px solid #ff9800;
}

.stock-list-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.stock-list-section h4 {
  margin: 0 0 15px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 15px;
}

.stock-item {
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-code {
  font-family: monospace;
  font-weight: 600;
  color: #1976d2;
}

.stock-name {
  font-size: 13px;
  color: #666;
}

.show-stock-list {
  text-align: center;
  margin-bottom: 20px;
}

.completion-message {
  background: #e8f5e8;
  border: 1px solid #4caf50;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

/* 관리 버튼 스타일 */
.management-buttons {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-info {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

.btn-info:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 실시간 업데이트 인디케이터 */
.progress-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 12px;
  color: #666;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 진행률 바 애니메이션 */
.progress-fill {
  transition: width 0.3s ease-in-out;
}

/* 상태 변경 시 부드러운 전환 */
.progress-section {
  transition: all 0.3s ease-in-out;
}

.completion-message h3 {
  margin: 0 0 15px 0;
  color: #2e7d32;
}

.completion-stats p {
  margin: 5px 0;
  font-size: 14px;
}
</style> 