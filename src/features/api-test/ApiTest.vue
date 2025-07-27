<template>
  <div class="api-test">
    <!-- 헤더 -->
    <header class="test-header">
      <h2>🔧 API 테스트 대시보드</h2>
      <p class="test-description">서버의 모든 REST API 엔드포인트를 테스트하고 실시간 상태를 모니터링합니다.</p>
    </header>

    <!-- 컨트롤 패널 -->
    <section class="control-panel">
      <div class="control-buttons">
        <button @click="runAllTests" :disabled="isLoading" class="btn btn-primary btn-large">
          <span class="btn-icon">🚀</span>
          <span class="btn-text">전체 API 테스트 실행</span>
        </button>
        <button @click="checkHealth" :disabled="isLoading" class="btn btn-info btn-large">
          <span class="btn-icon">💚</span>
          <span class="btn-text">서버 상태 확인</span>
        </button>
        <button @click="testDatabase" :disabled="isLoading" class="btn btn-secondary btn-large">
          <span class="btn-icon">🗄️</span>
          <span class="btn-text">데이터베이스 테스트</span>
        </button>
        <button @click="initializeDatabase" :disabled="isLoading" class="btn btn-outline btn-large">
          <span class="btn-icon">⚙️</span>
          <span class="btn-text">DB 초기화</span>
        </button>
      </div>
      
      <div class="test-mode-controls">
        <button @click="startTestMode" :disabled="isLoading || testModeStatus.is_test_mode" class="btn btn-warning">
          <span class="btn-icon">🛡️</span>
          <span class="btn-text">테스트 모드 시작</span>
        </button>
        <button @click="endTestMode" :disabled="isLoading || !testModeStatus.is_test_mode" class="btn btn-danger">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">테스트 모드 종료</span>
        </button>
        <button @click="checkTestModeStatus" :disabled="isLoading" class="btn btn-outline">
          <span class="btn-icon">📊</span>
          <span class="btn-text">테스트 모드 상태</span>
        </button>
      </div>
    </section>

    <!-- 에러 메시지 -->
    <div v-if="errorMessage" class="error-message">
      <span class="error-icon">⚠️</span>
      {{ errorMessage }}
    </div>

    <!-- 테스트 모드 상태 -->
    <section v-if="testModeStatus.is_test_mode" class="test-mode-status">
      <h3>🛡️ 테스트 모드 활성화</h3>
      <div class="backup-info">
        <div class="backup-item">
          <span class="backup-label">주식:</span>
          <span class="backup-value">{{ testModeStatus.backup_summary?.stocks_count || 0 }}개</span>
        </div>
        <div class="backup-item">
          <span class="backup-label">거래 데이터:</span>
          <span class="backup-value">{{ testModeStatus.backup_summary?.trading_data_count || 0 }}개</span>
        </div>
        <div class="backup-item">
          <span class="backup-label">샘플:</span>
          <span class="backup-value">{{ testModeStatus.backup_summary?.samples_count || 0 }}개</span>
        </div>
        <div class="backup-item">
          <span class="backup-label">사용자:</span>
          <span class="backup-value">{{ testModeStatus.backup_summary?.users_count || 0 }}개</span>
        </div>
      </div>
    </section>

    <!-- 서버 상태 -->
    <section v-if="serverHealth" class="status-section">
      <h3>💚 서버 상태</h3>
      <div class="status-info">
        <div class="status-badge" :class="serverHealth.status">
          {{ serverHealth.status === 'healthy' ? '정상' : '오류' }}
        </div>
        <div class="status-details">
          <p><strong>메시지:</strong> {{ serverHealth.message }}</p>
          <p><strong>서버:</strong> {{ serverHealth.server }}</p>
          <p><strong>확인 시간:</strong> {{ formatDate(serverHealth.timestamp) }}</p>
        </div>
      </div>
    </section>

    <!-- 데이터베이스 상태 -->
    <section v-if="databaseStatus" class="status-section">
      <h3>🗄️ 데이터베이스 상태</h3>
      <div class="db-info">
        <div class="status-badge" :class="databaseStatus.database_status">
          {{ getDbStatusText(databaseStatus.database_status) }}
        </div>
        <div v-if="databaseStatus.tables" class="tables-info">
          <h4>테이블 정보</h4>
          <div class="table-list">
            <div 
              v-for="(table, name) in databaseStatus.tables" 
              :key="name"
              class="table-item"
            >
              <span class="table-name">{{ name }}</span>
              <span class="table-status" :class="table.status">
                {{ table.status === 'accessible' ? '정상' : '오류' }}
              </span>
              <span class="table-count">{{ table.record_count }}개 레코드</span>
              <span v-if="table.error" class="table-error">{{ table.error }}</span>
            </div>
          </div>
        </div>
        <div v-if="databaseStatus.error" class="db-error">
          <strong>오류:</strong> {{ databaseStatus.error }}
        </div>
      </div>
    </section>

    <!-- 테스트 결과 요약 -->
    <section v-if="testSummary" class="test-summary">
      <h3>📊 테스트 결과 요약</h3>
      <div class="summary-stats">
        <div class="stat-item clickable" @click="setFilter('all')" :class="{ active: currentFilter === 'all' }">
          <span class="stat-label">전체 테스트:</span>
          <span class="stat-value">{{ testSummary.total_tests }}개</span>
          <span class="filter-hint">클릭하여 전체 보기</span>
        </div>
        <div class="stat-item clickable" @click="setFilter('success')" :class="{ active: currentFilter === 'success' }">
          <span class="stat-label">성공:</span>
          <span class="stat-value success">{{ testSummary.successful_tests }}개</span>
          <span class="filter-hint">클릭하여 성공한 테스트만 보기</span>
        </div>
        <div class="stat-item clickable" @click="setFilter('failed')" :class="{ active: currentFilter === 'failed' }">
          <span class="stat-label">실패:</span>
          <span class="stat-value failed">{{ testSummary.failed_tests }}개</span>
          <span class="filter-hint">클릭하여 실패한 테스트만 보기</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">성공률:</span>
          <span class="stat-value" :class="getSuccessRateClass(testSummary.success_rate)">
            {{ testSummary.success_rate }}%
          </span>
        </div>
        <div v-if="testSummary.test_mode" class="stat-item">
          <span class="stat-label">테스트 모드:</span>
          <span class="stat-value warning">활성화</span>
        </div>
      </div>
      <div class="summary-details">
        <h4>🔍 테스트 수행 방식</h4>
        <div class="test-process">
          <div class="process-step">
            <span class="step-number">1</span>
            <span class="step-text">API 엔드포인트에 HTTP 요청 전송</span>
          </div>
          <div class="process-step">
            <span class="step-number">2</span>
            <span class="step-text">응답 상태 코드가 예상값(200)과 일치하는지 확인</span>
          </div>
          <div class="process-step">
            <span class="step-number">3</span>
            <span class="step-text">응답 시간이 5초 이내인지 검증</span>
          </div>
          <div class="process-step">
            <span class="step-number">4</span>
            <span class="step-text">응답 데이터가 올바른 JSON 형식인지 확인</span>
          </div>
        </div>
        <h4>📋 성공/실패 판정 기준</h4>
        <div class="criteria">
          <p><strong>✅ 성공:</strong> 모든 4단계 검증을 통과한 경우</p>
          <p><strong>❌ 실패:</strong> 1단계라도 실패한 경우 (연결 오류, 타임아웃, 잘못된 상태 코드, 데이터 형식 오류)</p>
        </div>
      </div>
    </section>

    <!-- 개별 API 테스트 -->
    <section class="individual-tests">
      <h3>🔍 개별 API 테스트</h3>
      <p class="section-description">각 API 엔드포인트를 개별적으로 테스트하고 응답 결과를 확인할 수 있습니다.</p>
      
      <div class="endpoints-grid">
        <div 
          v-for="(endpoint, index) in testEndpoints" 
          :key="index"
          class="endpoint-card"
        >
          <div class="endpoint-header">
            <div class="endpoint-info">
              <h4 class="endpoint-name">{{ endpoint.name }}</h4>
              <span class="endpoint-method">{{ endpoint.method }}</span>
            </div>
            <button 
              @click="runIndividualTest(endpoint, index)"
              :disabled="isLoading"
              class="btn btn-sm"
              :class="getIndividualTestButtonClass(endpoint, index)"
            >
              {{ getIndividualTestButtonText(endpoint, index) }}
            </button>
          </div>
          
          <p class="endpoint-description">{{ endpoint.description }}</p>
          
          <!-- 파라미터 입력 폼 -->
          <div v-if="endpoint.hasParams" class="params-form">
            <h5>파라미터 입력:</h5>
            <div class="param-inputs">
              <div v-for="(param, key) in endpoint.params" :key="key" class="param-input">
                <label :for="`param-${index}-${key}`">{{ key }}:</label>
                <input 
                  :id="`param-${index}-${key}`"
                  v-model="endpoint.params[key]"
                  type="text"
                  :placeholder="param"
                  class="param-field"
                />
              </div>
            </div>
          </div>
          
          <!-- 개별 테스트 결과 -->
          <div v-if="individualTestResults[index]" class="individual-result">
            <div class="result-status" :class="individualTestResults[index].success ? 'success' : 'failed'">
              <span class="status-icon">
                {{ individualTestResults[index].success ? '✅' : '❌' }}
              </span>
              <span>{{ individualTestResults[index].success ? '성공' : '실패' }}</span>
            </div>
            
            <div class="result-details">
              <div class="result-item">
                <strong>상태 코드:</strong> {{ individualTestResults[index].status_code }}
              </div>
              <div class="result-item">
                <strong>응답 시간:</strong> {{ individualTestResults[index].response_time }}초
              </div>
              <div v-if="individualTestResults[index].error" class="result-item error">
                <strong>오류:</strong> {{ individualTestResults[index].error }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 테스트 결과 목록 -->
    <section v-if="testResults && testResults.length > 0" class="test-results">
      <h3>📋 상세 테스트 결과</h3>
      <div class="results-list">
        <div 
          v-for="(result, index) in filteredResults" 
          :key="index"
          class="result-card"
          :class="result.success ? 'success' : 'failed'"
        >
          <div class="result-header">
            <div class="result-info">
              <h4 class="result-name">{{ result.name }}</h4>
              <span class="result-method">{{ result.method }}</span>
              <span class="result-url">{{ result.url }}</span>
            </div>
            <div class="result-status-badge" :class="result.success ? 'success' : 'failed'">
              {{ result.success ? '✅ 성공' : '❌ 실패' }}
            </div>
          </div>
          
          <div class="result-details">
            <div class="result-item">
              <strong>상태 코드:</strong> {{ result.status_code }}
            </div>
            <div class="result-item">
              <strong>응답 시간:</strong> {{ result.response_time }}초
            </div>
            <div class="result-item">
              <strong>테스트 시간:</strong> {{ formatDate(result.timestamp) }}
            </div>
            <div v-if="result.error" class="result-item error">
              <strong>오류:</strong> {{ result.error }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>API 테스트를 실행 중입니다...</p>
    </div>
  </div>
</template>

<script>
import { api, API_ENDPOINTS } from '@/config/api';

export default {
  name: 'ApiTest',
  
  data() {
    return {
      // 테스트 상태
      isLoading: false,
      errorMessage: '',
      
      // 테스트 결과
      testResults: [],
      testSummary: null,
      serverHealth: null,
      databaseStatus: null,
      individualTestResults: {},
      
      // 테스트 항목 목록
      testEndpoints: [
        { name: 'Sample 목록 조회', path: 'samples/', method: 'GET', description: '샘플 데이터 목록을 조회합니다', hasParams: false },
        { name: 'Sample 검색', path: 'samples/search', method: 'GET', description: '샘플 데이터를 검색합니다', hasParams: true, params: { name: 'Test' } },
        { name: 'Stock 목록 조회', path: 'stocks/', method: 'GET', description: '주식 목록을 조회합니다', hasParams: false },
        { name: 'Stock 검색', path: 'stocks/search', method: 'GET', description: '주식명으로 검색합니다', hasParams: true, params: { name: '삼성' } },
        { name: 'Stock 코드별 조회', path: 'stocks/code/005930', method: 'GET', description: '주식 코드로 상세 정보를 조회합니다', hasParams: false },
        { name: 'Trading 목록 조회', path: 'trading/', method: 'GET', description: '거래 데이터 목록을 조회합니다', hasParams: false },
        { name: 'Trading 검색', path: 'trading/search', method: 'GET', description: '거래 데이터를 검색합니다', hasParams: true, params: { query: '삼천당제약' } },
        { name: 'Trading 날짜 범위 조회', path: 'trading/date-range', method: 'GET', description: '특정 기간의 거래 데이터를 조회합니다 (2024년)', hasParams: true, params: { start_date: '2024-01-01', end_date: '2024-12-31' } },
        { name: 'Trading 주식별 조회', path: 'trading/stock/005930', method: 'GET', description: '특정 주식의 거래 데이터를 조회합니다 (005930)', hasParams: false },
        { name: 'Collector 상태 조회', path: 'collector/status', method: 'GET', description: '데이터 수집기 상태를 확인합니다', hasParams: false },
        { name: 'Collector 사용 가능한 주식 목록', path: 'collector/stocks', method: 'GET', description: '수집 가능한 주식 목록을 조회합니다', hasParams: false },
        { name: 'User 목록 조회', path: 'users/', method: 'GET', description: '사용자 목록을 조회합니다', hasParams: false },
        { name: 'Health Check', path: 'api-test/health', method: 'GET', description: '서버 상태를 확인합니다', hasParams: false },
        { name: 'Database 테스트', path: 'api-test/database', method: 'GET', description: '데이터베이스 연결을 테스트합니다', hasParams: false },
        { name: '테스트 모드 상태', path: 'api-test/test-mode/status', method: 'GET', description: '테스트 모드 상태를 확인합니다', hasParams: false },
        { name: 'History 통계', path: 'history/stats', method: 'GET', description: '히스토리 통계를 조회합니다', hasParams: false },
        { name: 'History 최근 활동', path: 'history/latest', method: 'GET', description: '최근 활동 내역을 조회합니다', hasParams: false },
        { name: 'History 활동 요약', path: 'history/summary', method: 'GET', description: '활동 요약을 조회합니다', hasParams: false },
        { name: 'History 데이터 히스토리', path: 'history/data', method: 'GET', description: '데이터 변경 히스토리를 조회합니다', hasParams: false },
        { name: 'History 시스템 로그', path: 'history/system', method: 'GET', description: '시스템 로그를 조회합니다', hasParams: false }
      ],
      
      // 테스트 모드 상태
      testModeStatus: {
        is_test_mode: false,
        test_start_time: null,
        backup_summary: {}
      },
      
      // 필터링 상태
      currentFilter: 'all',
    };
  },
  
  async mounted() {
    await this.checkTestModeStatus();
  },
  
  computed: {
    /**
     * 현재 필터에 따른 테스트 결과 필터링
     */
    filteredResults() {
      if (!this.testResults || this.testResults.length === 0) {
        return [];
      }
      
      let filtered;
      switch (this.currentFilter) {
        case 'success':
          filtered = this.testResults.filter(result => result.success);
          break;
        case 'failed':
          filtered = this.testResults.filter(result => !result.success);
          break;
        default:
          filtered = this.testResults;
      }
      
      return filtered;
    }
  },
  
  methods: {
    /**
     * 전체 API 테스트 실행
     */
    async runAllTests() {
      try {
        this.isLoading = true;
        this.clearError();
        
        // 개별 테스트 결과 초기화
        this.individualTestResults = {};
        
        // 각 엔드포인트를 순차적으로 테스트
        for (let i = 0; i < this.testEndpoints.length; i++) {
          const endpoint = this.testEndpoints[i];
          
          // 진행 상황 표시
          this.showMessage(`${i + 1}/${this.testEndpoints.length} 테스트 중: ${endpoint.name}`, 'info');
          
          // 개별 테스트 실행
          await this.runIndividualTest(endpoint, i);
          
          // 잠시 대기 (서버 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 전체 결과 요약 생성
        const totalTests = this.testEndpoints.length;
        const successfulTests = Object.values(this.individualTestResults).filter(result => result.success).length;
        const failedTests = totalTests - successfulTests;
        const successRate = totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0;
        
        this.testSummary = {
          total_tests: totalTests,
          successful_tests: successfulTests,
          failed_tests: failedTests,
          success_rate: successRate,
          test_mode: false
        };
        
        // 전체 테스트 결과를 배열로 변환
        this.testResults = this.testEndpoints.map((endpoint, index) => {
          const result = this.individualTestResults[index];
          if (!result) return null;
          
          return {
            name: endpoint.name,
            method: endpoint.method,
            url: this.buildTestUrl(endpoint),
            success: result.success,
            status_code: result.status_code,
            response_time: result.response_time,
            response_data: result.response_data,
            error: result.error,
            timestamp: result.timestamp
          };
        }).filter(result => result !== null);
        
        this.showMessage(`전체 테스트 완료: ${successfulTests}/${totalTests} 성공 (${successRate}%)`, 'success');
        
      } catch (error) {
        console.error('전체 테스트 실패:', error);
        this.showError('전체 API 테스트에 실패했습니다.');
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * 테스트 URL 구성
     */
    buildTestUrl(endpoint) {
      let url = endpoint.path;
      if (endpoint.hasParams && endpoint.params) {
        const params = new URLSearchParams();
        Object.entries(endpoint.params).forEach(([key, value]) => {
          if (value) params.append(key, value); // encodeURIComponent 제거
        });
        const queryString = params.toString();
        if (queryString) {
          url += (url.endsWith('/') ? '' : '/') + '?' + queryString;
        }
      }
      return url;
    },
    
    /**
     * 서버 상태 확인
     */
    async checkHealth() {
      try {
        this.isLoading = true;
        this.clearError();
        
        const response = await api.get(API_ENDPOINTS.API_TEST.HEALTH);
        this.serverHealth = response.data;
        
        this.showMessage('서버 상태를 확인했습니다.', 'success');
        
      } catch (error) {
        console.error('서버 상태 확인 실패:', error);
        this.serverHealth = {
          status: 'error',
          message: '서버 연결 실패',
          timestamp: new Date().toISOString()
        };
        this.showError('서버 상태 확인에 실패했습니다.');
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * 데이터베이스 연결 테스트
     */
    async testDatabase() {
      try {
        this.isLoading = true;
        this.clearError();
        
        const response = await api.get(API_ENDPOINTS.API_TEST.DATABASE);
        this.databaseStatus = response.data;
        
        this.showMessage('데이터베이스 상태를 확인했습니다.', 'success');
        
      } catch (error) {
        console.error('데이터베이스 테스트 실패:', error);
        this.databaseStatus = {
          database_status: 'error',
          error: '데이터베이스 연결 실패',
          timestamp: new Date().toISOString()
        };
        this.showError('데이터베이스 테스트에 실패했습니다.');
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * 데이터베이스 초기화
     */
    async initializeDatabase() {
      const confirmMessage = '데이터베이스 테이블을 생성하시겠습니까?\n\n⚠️ 안전 알림:\n- 기존 테이블이 없는 경우에만 새로 생성됩니다\n- 기존 데이터는 삭제되지 않습니다\n- 테이블 구조만 생성하는 안전한 작업입니다';
      
      if (!confirm(confirmMessage)) {
        return;
      }
      
      try {
        this.isLoading = true;
        this.clearError();
        
        const response = await api.post(API_ENDPOINTS.API_TEST.DATABASE_INIT);
        
        if (response.data.status === 'success') {
          this.showMessage(`테이블이 생성되었습니다. (${response.data.total_tables}개 테이블) - 기존 데이터는 보존됨`, 'success');
          
          setTimeout(() => {
            if (!this.isLoading) {
              this.testDatabase();
            }
          }, 1000);
        } else {
          this.showError(response.data.message || '테이블 생성에 실패했습니다.');
        }
        
      } catch (error) {
        console.error('데이터베이스 초기화 실패:', error);
        this.showError('데이터베이스 초기화에 실패했습니다.');
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * 테스트 모드 시작
     */
    async startTestMode() {
      try {
        this.isLoading = true;
        this.clearError();
        
        const response = await api.post(API_ENDPOINTS.API_TEST.TEST_MODE_START);
        
        if (response.data.status === 'success') {
          this.showMessage('테스트 모드가 시작되었습니다. 데이터가 백업되었습니다.', 'success');
          await this.checkTestModeStatus();
        } else {
          this.showError(response.data.message || '테스트 모드 시작에 실패했습니다.');
        }
        
      } catch (error) {
        console.error('테스트 모드 시작 실패:', error);
        this.showError('테스트 모드 시작에 실패했습니다.');
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * 테스트 모드 종료
     */
    async endTestMode() {
      try {
        this.isLoading = true;
        this.clearError();
        
        const response = await api.post(API_ENDPOINTS.API_TEST.TEST_MODE_END);
        
        if (response.data.status === 'success') {
          this.showMessage('테스트 모드가 종료되었습니다. 데이터가 복원되었습니다.', 'success');
          await this.checkTestModeStatus();
        } else {
          this.showError(response.data.message || '테스트 모드 종료에 실패했습니다.');
        }
        
      } catch (error) {
        console.error('테스트 모드 종료 실패:', error);
        this.showError('테스트 모드 종료에 실패했습니다.');
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * 테스트 모드 상태 확인
     */
    async checkTestModeStatus() {
      try {
        const response = await api.get(API_ENDPOINTS.API_TEST.TEST_MODE_STATUS);
        this.testModeStatus = response.data;
      } catch (error) {
        console.error('테스트 모드 상태 확인 실패:', error);
      }
    },
    
    /**
     * 필터 설정
     */
    setFilter(filter) {
      this.currentFilter = filter;
    },
    
    /**
     * HTTP 상태 코드에 따른 CSS 클래스 반환
     */
    getStatusClass(statusCode) {
      if (!statusCode) return 'unknown';
      if (statusCode >= 200 && statusCode < 300) return 'success';
      if (statusCode >= 400 && statusCode < 500) return 'client-error';
      if (statusCode >= 500) return 'server-error';
      return 'info';
    },
    
    /**
     * 성공률에 따른 CSS 클래스 반환
     */
    getSuccessRateClass(rate) {
      if (rate >= 90) return 'success';
      if (rate >= 70) return 'warning';
      return 'failed';
    },
    
    /**
     * 날짜 포맷팅
     */
    formatDate(dateString) {
      if (!dateString) return '-';
      
      try {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (error) {
        console.warn('날짜 포맷팅 실패:', error);
        return dateString;
      }
    },
    
    /**
     * 에러 메시지 표시
     */
    showError(message) {
      this.errorMessage = message;
      setTimeout(() => {
        this.clearError();
      }, 5000);
    },
    
    /**
     * 에러 메시지 제거
     */
    clearError() {
      this.errorMessage = '';
    },
    
    /**
     * 성공 메시지 표시
     */
    showMessage(message, type = 'info') {
      this.$emit('show-message', { message, type });
    },
    
    /**
     * 데이터베이스 상태 텍스트 반환
     */
    getDbStatusText(status) {
      switch (status) {
        case 'connected': return '연결됨';
        case 'connected_with_errors': return '연결됨 (일부 오류)';
        case 'error': return '오류';
        default: return status;
      }
    },
    
    /**
     * 응답 데이터 요약 생성
     */
    getResponseDataSummary(data) {
      if (!data) return '데이터 없음';
      
      if (Array.isArray(data)) {
        return `${data.length}개 항목`;
      }
      
      if (typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length === 0) return '빈 객체';
        if (keys.length <= 3) return `${keys.join(', ')}`;
        return `${keys.length}개 필드`;
      }
      
      if (typeof data === 'string') {
        return data.length > 50 ? `${data.substring(0, 50)}...` : data;
      }
      
      return typeof data;
    },
    
    /**
     * 응답 타입 반환
     */
    getResponseType(data) {
      if (Array.isArray(data)) {
        return `배열 (${data.length}개 항목)`;
      }
      if (typeof data === 'object' && data !== null) {
        return `객체 (${Object.keys(data).length}개 필드)`;
      }
      if (typeof data === 'string') {
        return `문자열 (${data.length}자)`;
      }
      if (typeof data === 'number') {
        return '숫자';
      }
      if (typeof data === 'boolean') {
        return '불린';
      }
      return typeof data;
    },
    
    /**
     * 응답 데이터 크기 반환
     */
    getResponseSize(data) {
      const jsonString = JSON.stringify(data);
      const bytes = new Blob([jsonString]).size;
      if (bytes < 1024) {
        return `${bytes}바이트`;
      } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)}KB`;
      } else {
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
      }
    },
    
    /**
     * 응답 객체의 주요 키 반환
     */
    getResponseKeys(data) {
      if (typeof data !== 'object' || Array.isArray(data) || data === null) {
        return '';
      }
      
      const keys = Object.keys(data);
      if (keys.length === 0) return '빈 객체';
      if (keys.length <= 5) return keys.join(', ');
      return `${keys.slice(0, 5).join(', ')} 외 ${keys.length - 5}개`;
    },
    
    /**
     * 개별 테스트 실행
     */
    async runIndividualTest(endpoint, index) {
      try {
        this.isLoading = true;
        this.clearError();
        
        // 개별 테스트 결과 초기화
        this.individualTestResults[index] = {
          loading: true,
          success: false,
          response_time: 0,
          status_code: null,
          response_data: null,
          error: null,
          timestamp: new Date().toISOString()
        };
        
        const startTime = Date.now();
        
        // URL과 파라미터 구성
        let url = endpoint.path;
        if (endpoint.hasParams && endpoint.params) {
          const params = new URLSearchParams();
          let hasValidParams = false;
          
          Object.entries(endpoint.params).forEach(([key, value]) => {
            if (value && value.trim()) {
              params.append(key, value.trim());
              hasValidParams = true;
            }
          });
          
          if (hasValidParams) {
            const queryString = params.toString();
            if (queryString) {
              url += (url.endsWith('/') ? '' : '/') + '?' + queryString;
            }
          } else {
            // 파라미터가 비어있으면 오류 처리
            throw new Error('필수 파라미터가 입력되지 않았습니다. 파라미터를 입력해주세요.');
          }
        }

        // Trading 검색만 실제 API로 직접 요청
        let response;
        if (endpoint.name === 'Trading 검색') {
          response = await api.get('/trading/search' + url.split('trading/search')[1]);
        } else {
          // 기존 방식(테스트 프록시)
          response = await api.get(`/api-test/endpoint/${url}`);
        }
        
        const endTime = Date.now();
        const responseTime = (endTime - startTime) / 1000;
        
        // 결과 저장
        this.individualTestResults[index] = {
          loading: false,
          success: response.data.success !== undefined ? response.data.success : true,
          response_time: responseTime,
          status_code: response.data.status_code || response.status,
          response_data: response.data.response_data || response.data,
          error: response.data.error,
          timestamp: new Date().toISOString()
        };
        
        if (this.individualTestResults[index].success) {
          this.showMessage(`${endpoint.name} 테스트가 성공했습니다.`, 'success');
        } else {
          this.showError(`${endpoint.name} 테스트가 실패했습니다: ${this.individualTestResults[index].error}`);
        }
        
      } catch (error) {
        console.error('개별 테스트 실패:', error);
        
        this.individualTestResults[index] = {
          loading: false,
          success: false,
          response_time: 0,
          status_code: null,
          response_data: null,
          error: error.message || '테스트 실행 중 오류가 발생했습니다.',
          timestamp: new Date().toISOString()
        };
        
        this.showError(`${endpoint.name} 테스트 실행에 실패했습니다.`);
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * 개별 테스트 버튼 클래스 반환
     */
    getIndividualTestButtonClass(endpoint, index) {
      const result = this.individualTestResults[index];
      
      if (result?.loading) {
        return 'btn-loading';
      }
      
      if (result?.success) {
        return 'btn-success';
      }
      
      if (result && !result.success) {
        return 'btn-danger';
      }
      
      return 'btn-primary';
    },
    
    /**
     * 개별 테스트 버튼 텍스트 반환
     */
    getIndividualTestButtonText(endpoint, index) {
      const result = this.individualTestResults[index];
      
      if (result?.loading) {
        return '🔄 테스트 중...';
      }
      
      if (result?.success) {
        return '✅ 성공';
      }
      
      if (result && !result.success) {
        return '❌ 실패';
      }
      
      return '🚀 테스트 실행';
    }
  }
};
</script>

<style scoped>
.api-test {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 헤더 스타일 */
.test-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.test-header h2 {
  margin: 0 0 12px 0;
  font-size: 28px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.test-description {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
  line-height: 1.5;
}

/* 컨트롤 패널 */
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.control-buttons, .test-mode-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

/* 버튼 스타일 */
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  min-width: 140px;
  justify-content: center;
}

.btn-large {
  padding: 16px 24px;
  font-size: 16px;
  min-width: 180px;
}

.btn-icon {
  font-size: 18px;
}

.btn-text {
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
}

.btn-info {
  background: linear-gradient(135deg, #00bcd4 0%, #0097a7 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 188, 212, 0.3);
}

.btn-info:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 188, 212, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
}

.btn-warning {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
}

.btn-warning:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
}

.btn-outline {
  background: transparent;
  color: #1976d2;
  border: 2px solid #1976d2;
}

.btn-outline:hover:not(:disabled) {
  background: #1976d2;
  color: white;
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* 에러 메시지 */
.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border: 1px solid #f44336;
  border-radius: 12px;
  color: #c62828;
  font-weight: 600;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.1);
}

.error-icon {
  font-size: 20px;
}

/* 테스트 모드 상태 */
.test-mode-status {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border: 1px solid #ff9800;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.1);
}

.test-mode-status h3 {
  margin: 0 0 16px 0;
  color: #e65100;
  font-size: 18px;
  font-weight: 600;
}

.backup-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.backup-label {
  font-weight: 600;
  color: #666;
}

.backup-value {
  font-weight: 700;
  color: #e65100;
  font-size: 18px;
}

/* 상태 섹션 */
.status-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.status-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.status-info, .db-info {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  min-width: 80px;
  text-align: center;
}

.status-badge.healthy, .status-badge.connected, .status-badge.accessible {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.status-badge.error {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
}

.status-details p {
  margin: 8px 0;
  color: #666;
}

.status-details strong {
  color: #333;
}

/* 테이블 정보 */
.tables-info h4 {
  margin: 20px 0 12px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.table-list {
  display: grid;
  gap: 12px;
}

.table-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.table-name {
  font-weight: 600;
  color: #333;
  min-width: 120px;
}

.table-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}

.table-status.accessible {
  background: #e8f5e8;
  color: #2e7d32;
}

.table-status.error {
  background: #ffebee;
  color: #c62828;
}

.table-count {
  color: #666;
  font-size: 14px;
}

.table-error {
  color: #c62828;
  font-size: 12px;
  font-weight: 600;
}

.db-error {
  color: #c62828;
  font-weight: 600;
  margin-top: 12px;
}

/* 테스트 결과 요약 */
.test-summary {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.test-summary h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid #dee2e6;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-item.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  border-color: #1976d2;
}

.stat-item.active {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-color: #1976d2;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.stat-value.success {
  color: #2e7d32;
}

.stat-value.failed {
  color: #c62828;
}

.stat-value.warning {
  color: #f57c00;
}

.filter-hint {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 요약 상세 정보 */
.summary-details h4 {
  margin: 24px 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.test-process {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.process-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #1976d2;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.step-text {
  color: #333;
  font-size: 14px;
}

.criteria p {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
}

.criteria strong {
  color: #333;
}

/* 개별 테스트 */
.individual-tests {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.individual-tests h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.section-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 24px;
  line-height: 1.5;
}

.endpoints-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.endpoint-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.endpoint-card:hover {
  border-color: #1976d2;
  background: #f0f8ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.1);
}

.endpoint-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.endpoint-info {
  flex: 1;
}

.endpoint-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
  margin: 0 0 8px 0;
}

.endpoint-method {
  padding: 4px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.endpoint-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 16px;
}

/* 파라미터 폼 */
.params-form {
  margin: 16px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.params-form h5 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.param-inputs {
  display: grid;
  gap: 12px;
}

.param-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-input label {
  font-size: 12px;
  font-weight: 600;
  color: #555;
}

.param-field {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: all 0.2s ease;
}

.param-field:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

/* 개별 결과 */
.individual-result {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.result-status {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
}

.result-status.success {
  color: #2e7d32;
}

.result-status.failed {
  color: #c62828;
}

.status-icon {
  margin-right: 8px;
  font-size: 16px;
}

.result-details {
  margin-bottom: 8px;
}

.result-item {
  margin: 6px 0;
  font-size: 13px;
  color: #555;
}

.result-item.error {
  color: #c62828;
  font-weight: 600;
}

/* 작은 버튼 */
.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: auto;
}

.btn-loading {
  background: #ffc107;
  color: #333;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

/* 테스트 결과 목록 */
.test-results {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.test-results h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.results-list {
  display: grid;
  gap: 16px;
}

.result-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.result-card.success {
  border-color: #4caf50;
  background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%);
}

.result-card.failed {
  border-color: #f44336;
  background: linear-gradient(135deg, #fff8f8 0%, #ffebee 100%);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.result-info {
  flex: 1;
}

.result-name {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #333;
  font-size: 18px;
}

.result-method {
  padding: 4px 10px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  display: inline-block;
  margin-right: 10px;
}

.result-url {
  font-size: 14px;
  color: #666;
  margin-left: 10px;
  word-break: break-all;
}

.result-status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  min-width: 100px;
  text-align: center;
}

.result-status-badge.success {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.result-status-badge.failed {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
}

.result-details {
  margin-top: 12px;
}

.result-item {
  margin: 6px 0;
  font-size: 14px;
  color: #555;
}

.result-item.error {
  color: #c62828;
  font-weight: 600;
}

/* 로딩 오버레이 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  color: white;
  font-size: 18px;
  margin: 0;
  font-weight: 600;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .api-test {
    padding: 16px;
  }
  
  .control-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-buttons, .test-mode-controls {
    justify-content: center;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .endpoints-grid {
    grid-template-columns: 1fr;
  }
  
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .status-info, .db-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .backup-info {
    grid-template-columns: 1fr;
  }
  
  .btn-large {
    min-width: 160px;
    padding: 14px 20px;
  }
}
</style> 