import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 코드 분할 최적화
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue 라이브러리 분리
          vue: ['vue', 'vue-router', 'pinia'],
          // 유틸리티 라이브러리 분리
          utils: ['axios'],
        },
      },
    },
    // 청크 크기 경고 임계값 설정
    chunkSizeWarningLimit: 1000,
    // 소스맵 생성 (개발 환경에서만)
    sourcemap: process.env.NODE_ENV === 'development',
  },
  // 개발 서버 최적화
  server: {
    // HMR 최적화
    hmr: {
      overlay: false,
    },
  },
  // 정적 자산 최적화
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.webp'],
  // CSS 최적화
  css: {
    devSourcemap: process.env.NODE_ENV === 'development',
  },
})
