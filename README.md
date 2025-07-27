# 주식 분석 시스템 프론트엔드 (Stock Analysis Frontend)

Vue.js 기반의 주식 분석 및 거래 데이터 관리 웹 애플리케이션입니다.

## 🚀 주요 기능

- **주식 데이터 관리**: 주식 정보 조회, 추가, 수정, 삭제
- **거래 데이터 분석**: 실시간 거래 데이터 시각화 및 분석
- **데이터 수집**: 자동화된 주식 데이터 수집 및 관리
- **사용자 인터페이스**: 직관적이고 반응형 웹 인터페이스
- **API 연동**: 백엔드 REST API와의 완벽한 연동

## 🏗️ 프로젝트 구조

```
s_analysis-frontend/
├── src/
│   ├── components/           # 공통 컴포넌트
│   │   ├── HelloWorld.vue
│   │   └── Sidebar.vue
│   ├── features/            # 기능별 컴포넌트
│   │   ├── home/           # 홈 대시보드
│   │   ├── stock/          # 주식 관리
│   │   ├── trading/        # 거래 데이터
│   │   ├── collector/      # 데이터 수집
│   │   ├── history/        # 히스토리
│   │   ├── settings/       # 설정
│   │   └── api-test/       # API 테스트
│   ├── config/             # 설정 파일
│   │   └── api.js          # API 설정
│   ├── router/             # 라우터 설정
│   ├── assets/             # 정적 자원
│   ├── App.vue             # 메인 앱 컴포넌트
│   └── main.js             # 앱 진입점
├── public/                 # 정적 파일
├── backend_config.py       # 백엔드 설정 참조
├── backend_app.py          # 백엔드 앱 참조
├── start_all.sh           # 전체 서버 시작 스크립트
├── stop_all.sh            # 전체 서버 중지 스크립트
└── package.json           # 프로젝트 의존성
```

## 🛠️ 기술 스택

- **Frontend**: Vue.js 3, Vue Router, Pinia
- **Build Tool**: Vite 5, TypeScript
- **UI Framework**: Headless UI, Heroicons
- **Styling**: SCSS, CSS Variables
- **Testing**: Vitest, Testing Library
- **Code Quality**: ESLint, Prettier, Husky
- **Charts**: Chart.js, Vue Chart.js
- **Development**: Hot Reload, Auto Import
- **API**: RESTful API 통신

## 📋 요구사항

- Node.js 18+
- npm 9+ 또는 yarn
- 백엔드 서버 (s_analysis-backend)

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 설정

```bash
# 환경 설정 파일 복사
cp env.example .env

# 필요시 .env 파일에서 API URL 수정
VUE_APP_API_BASE_URL=http://127.0.0.1:5001
```

### 3. 개발 서버 시작

```bash
# 프론트엔드만 시작
npm run dev

# 또는 전체 시스템 시작 (백엔드 포함)
./start_all.sh
```

### 4. 브라우저에서 확인

- 프론트엔드: http://localhost:8080
- 백엔드 API: http://localhost:5001

## 📜 사용 가능한 스크립트

```bash
# 개발 서버 시작 (핫 리로드)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트 및 수정
npm run lint

# 타입 체크
npm run type-check

# 테스트 실행
npm run test

# 테스트 UI
npm run test:ui

# 코드 포맷팅
npm run format
```

# 전체 시스템 시작 (백엔드 포함)
./start_all.sh

# 전체 시스템 중지
./stop_all.sh
```

## 🔧 설정

### API 설정

`src/config/api.js` 파일에서 API 관련 설정을 관리할 수 있습니다:

- 기본 URL 설정
- 타임아웃 설정
- 디버그 모드
- 엔드포인트 관리

### 환경 변수

`.env` 파일에서 환경별 설정을 관리할 수 있습니다:

- `VITE_API_BASE_URL`: 백엔드 API URL
- `VITE_API_TIMEOUT`: API 요청 타임아웃
- `VITE_APP_DEBUG`: 디버그 모드
- `VITE_APP_TITLE`: 애플리케이션 제목

## 📚 API 문서

백엔드 API 문서는 `backend_README.md` 파일을 참조하세요.

## 🤝 기여하기

1. 이슈를 생성하거나 기존 이슈를 확인하세요
2. 기능 브랜치를 생성하세요
3. 변경사항을 커밋하세요
4. Pull Request를 생성하세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
