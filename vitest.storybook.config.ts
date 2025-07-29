/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import vue from '@vitejs/plugin-vue'

const root = process.cwd()
const storybookDir = path.join(root, '.storybook')

export default defineConfig({
  plugins: [vue(), storybookTest({ configDir: storybookDir })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    setupFiles: ['./.storybook/vitest.setup.ts'],
  },
})
