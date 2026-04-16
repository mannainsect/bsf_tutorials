import { defineConfig } from 'vitest/config'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'

/**
 * Replace Nuxt-specific import.meta flags with standard
 * Vite env equivalents so app code works under Vitest.
 * Only transforms app source (skips node_modules/tests).
 */
function nuxtMetaFlags() {
  return {
    name: 'nuxt-meta-flags',
    enforce: 'pre',
    transform(code, id) {
      if (
        id.includes('node_modules') ||
        id.includes('/tests/')
      ) return
      if (
        !code.includes('import.meta.dev') &&
        !code.includes('import.meta.client')
      ) return
      return code
        .replaceAll(
          'import.meta.dev',
          'import.meta.env?.DEV'
        )
        .replaceAll(
          'import.meta.client',
          '(!import.meta.env?.SSR)'
        )
    }
  }
}

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('ion-')
        }
      }
    }),
    nuxtMetaFlags()
  ],
  define: { 'import.meta.dev': true },
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
      ],
      thresholds: {
        lines: 25,
        branches: 78,
        functions: 72,
        statements: 25
      }
    }
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '@': path.resolve(__dirname, 'app')
    }
  }
})
