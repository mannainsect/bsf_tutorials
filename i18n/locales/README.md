# Internationalization (i18n) Guide

This project uses `@nuxtjs/i18n` for internationalization support.

## Supported Languages

- English (en-US) - Default
- Spanish (es-ES)
- French (fr-FR)
- German (de-DE)
- Portuguese (pt-BR)

## Translation File Structure

Each locale file follows this structure:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    // Common UI strings
  },
  "navigation": {
    // Navigation menu items
  },
  "auth": {
    // Authentication related strings
  },
  "home": {
    // Home page specific strings
  },
  // Other sections...
}
```

## Usage in Components

### Template
```vue
<template>
  <h1>{{ $t('home.title') }}</h1>
  <p>{{ $t('home.welcomeMessage', { appName: 'MyApp' }) }}</p>
</template>
```

### Script Setup
```vue
<script setup lang="ts">
const { t } = useI18n()

const errorMessage = computed(() => t('errors.generic'))
</script>
```

## Adding New Translations

1. Add the translation key to all locale files
2. Use the key in your component with `$t()` or `t()`
3. Test with different languages using the language switcher

## Language Switcher

The `LanguageSwitcher` component is available globally and can be placed in headers or navigation menus.

## URL Structure

By default, the default locale (English) has no prefix, while other languages use prefixes:
- `/` - English
- `/es/` - Spanish
- `/fr/` - French
- `/de/` - German
- `/pt/` - Portuguese

## Best Practices

1. Keep translation keys organized by feature/page
2. Use nested structures for better organization
3. Avoid hardcoding strings in components
4. Test all languages when adding new features
5. Use interpolation for dynamic values: `{{ $t('key', { param: value }) }}`