import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    stylistic: false
  }
})
  .override('nuxt/typescript/rules', {
    rules: {
      // Temporary: Allow legacy `any` types (99 instances)
      // Fix incrementally in future PRs
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Temporary: Allow legacy unused vars (19 instances)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' }
      ],
      // Temporary: Allow legacy dynamic delete (11 instances)
      '@typescript-eslint/no-dynamic-delete': 'warn',
      // Temporary: Allow legacy unsafe function types
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      // Temporary: Allow legacy useless constructors
      '@typescript-eslint/no-useless-constructor': 'warn',
      // Temporary: Allow legacy useless escape characters
      'no-useless-escape': 'warn',
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'always',
            normal: 'always',
            component: 'always'
          },
          svg: 'always',
          math: 'always'
        }
      ]
    }
  })
  .override('nuxt/vue/rules', {
    rules: {
      'vue/no-deprecated-slot-attribute': 'off'
    }
  })
  .append({
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.nuxt/**',
      '**/ios/**',
      '**/android/**',
      '**/.output/**',
      '**/coverage/**'
    ]
  })
