export interface PWAIcon {
  src: string
  sizes: string
  type: string
  purpose?: 'any' | 'maskable' | 'monochrome'
}

export interface PWAManifest {
  name: string
  short_name: string
  description: string
  theme_color: string
  background_color: string
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  orientation: 'any' | 'natural' | 'landscape' | 'portrait'
  scope: string
  start_url: string
  lang: string
  dir: 'ltr' | 'rtl' | 'auto'
  categories: string[]
  icons: PWAIcon[]
}
