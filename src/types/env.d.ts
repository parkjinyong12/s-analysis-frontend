/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_DEBUG: string
  readonly VITE_BACKEND_PORT: string
  readonly VITE_FRONTEND_PORT: string
  readonly VITE_BUILD_SOURCEMAP: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 