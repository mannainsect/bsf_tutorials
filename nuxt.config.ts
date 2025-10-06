// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'BSF App - Production-Ready Mobile Template',
      meta: [
        { name: 'color-scheme', content: 'light' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Production-ready Nuxt 4 + Vue 3 + TypeScript + Ionic + Capacitor mobile template for building cross-platform applications'
        },
        { name: 'theme-color', content: '#3880ff' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'BSF App' },
        { property: 'og:type', content: 'website' },
        {
          property: 'og:title',
          content: 'BSF App - Production-Ready Mobile Template'
        },
        {
          property: 'og:description',
          content:
            'Production-ready Nuxt 4 + Vue 3 + TypeScript + Ionic + Capacitor mobile template'
        },
        { property: 'og:site_name', content: 'BSF App' },
        { name: 'twitter:card', content: 'summary_large_image' },
        {
          name: 'twitter:title',
          content: 'BSF App - Production-Ready Mobile Template'
        },
        {
          name: 'twitter:description',
          content:
            'Production-ready mobile template with Nuxt 4, Vue 3, TypeScript, Ionic & Capacitor'
        }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icon-192x192.png' },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png'
        },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  router: {
    options: {
      scrollBehavior(to, from, savedPosition) {
        return savedPosition || { top: 0 }
      }
    }
  },
  modules: [
    '@nuxtjs/ionic',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n'
  ],
  ionic: {
    integrations: {
      icons: true,
      meta: true,
      router: true
    },
    css: {
      core: true,
      basic: true,
      utilities: false
    }
  },
  css: [
    './app/assets/css/ionic.css',
    './app/assets/css/design-system.css',
    './app/assets/css/layout.css'
  ],
  ssr: false,
  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      cookieDomain: null,
      cookieSecure: false,
      cookieCrossOrigin: false,
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'en'
    },
    locales: [
      {
        code: 'en',
        language: 'en-US',
        name: 'English',
        file: 'en-US.json'
      },
      {
        code: 'es',
        language: 'es-ES',
        name: 'Español',
        file: 'es-ES.json'
      },
      {
        code: 'fr',
        language: 'fr-FR',
        name: 'Français',
        file: 'fr-FR.json'
      },
      {
        code: 'de',
        language: 'de-DE',
        name: 'Deutsch',
        file: 'de-DE.json'
      },
      {
        code: 'pt',
        language: 'pt-BR',
        name: 'Português',
        file: 'pt-BR.json'
      }
    ],
    langDir: 'locales',
    lazy: true,
    bundle: {
      optimizeTranslationDirective: false
    },
    vueI18n: '../i18n.config.ts'
  },
  devServer: {
    port: 3000
  },
  vite: {
    server: {
      hmr: {
        port: 24678
      }
    }
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag.startsWith('swiper-')
    }
  },
  nitro: {
    preset: 'static',
    output: {
      publicDir: 'dist'
    },
    prerender: {
      routes: ['/'],
      crawlLinks: true
    }
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
      domainAlias: process.env.NUXT_PUBLIC_DOMAIN_ALIAS || 'bsfapp',
      apiEndpoints: {
        // Authentication (New /auth endpoints)
        authRegister: '/auth/register',
        authRegisterVerify: '/auth/register/verify',
        authLogin: '/auth/login',
        authLoginToken: '/auth/login/token',
        authResetPassword: '/auth/reset-password',
        authResetPasswordConfirm: '/auth/reset-password/confirm',
        authSendToken: '/auth/send-token',

        // Legacy endpoints (still available)
        login: '/login',
        loginToken: '/login/token',

        // User Management
        users: '/users',
        usersResetPassword: '/users/reset_password',

        // Profile Management
        profilesMe: '/profiles/me',
        profilesSwitchCompany: '/profiles/switch-company',

        // Company Management
        companies: '/companies',

        // Space Management
        spaces: '/spaces',

        // Device Management
        devices: '/devices',
        devicesClimate: '/devices/climate',
        devicesData: '/devices/data',
        supportedSensors: '/supported_sensors',
        supportedControllers: '/supported_controllers',
        globalConfigs: '/global_configs',

        // Metrics Management
        metrics: '/metrics',
        metricsUser: '/metrics/user',
        metricsUpdate: '/metrics/update',
        metricsExcel: '/metrics/excel',
        // Products (Learning Content)
        productsContent: '/products/content',
        productsPlaylists: '/products/playlists',
        productsTools: '/products/tools',
        productsPurchase: '/products/purchase',

        // Helper Endpoints
        helpersCalculateMetricsEggs: '/helpers/calculate_metrics_nro_eggs',
        helpersCalculateMetrics5DOL: '/helpers/calculate_metrics_nro_5dol',
        helpersCalculateMetricsPupa: '/helpers/calculate_metrics_nro_pupa',
        helpersCalculateMetricsRearing: '/helpers/calculate_metrics_rearing',
        helpersCalculate5DOL: '/helpers/calculate_5dol',
        helpersCalculateRearingResults: '/helpers/calculate_rearing_results',

        // Logs Management
        logsCompany: '/logs/company',
        logsProcess: '/logs/process',
        logsDevice: '/logs/device',
        logsContent: '/logs/content',
        logsCredits: '/logs/credits',

        // AI & Chat
        aiChat: '/ai/chat',
        aiAgent: '/ai/agent'
      },
      // Feature Flags
      featureFlags: {
        enableUSDConversion: process.env.ENABLE_USD_CONVERSION !== 'false'
      },
      // External API Configuration
      exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY || ''
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifestFilename: 'manifest.webmanifest',
    manifest: {
      name: 'BSF App',
      short_name: 'BSF',
      description:
        'Production-ready Nuxt 4 + Vue 3 + TypeScript + Ionic + Capacitor mobile template',
      theme_color: '#3880ff',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      lang: 'en',
      dir: 'ltr',
      categories: ['productivity', 'business'],
      icons: [
        {
          src: '/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable any'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,webp,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: true,
      navigateFallbackAllowlist: [/^\/$/]
    }
  }
})
