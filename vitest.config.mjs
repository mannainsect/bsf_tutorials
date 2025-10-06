import { defineConfig } from 'vitest/config'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('ion-')
        }
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup/test-setup.ts'],
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.nuxt/**',
      'playwright-report/**',
      'tests/e2e/**',
      'tests/integration/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.config.*',
        '.nuxt/**',
        'dist/**'
      ]
    }
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '@': path.resolve(__dirname, 'app')
    }
  }
})
