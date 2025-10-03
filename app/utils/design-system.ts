/**
 * Design System Constants
 * Unified design tokens for consistent mobile-first UI
 */

export const designSystem = {
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '1rem',      // 16px
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '3rem',      // 48px
    xxl: '4rem',     // 64px
  },
  
  layout: {
    maxWidth: {
      xs: '320px',
      sm: '400px',
      md: '600px',
      lg: '800px',
      xl: '1200px',
    },
    padding: {
      page: '1rem',
      section: '1.5rem',
      card: '1rem',
    },
    radius: {
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
    },
  },
  
  typography: {
    sizes: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    weight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
}

// CSS Variables for easy access in components
export const cssVariables = `
  :root {
    --spacing-xs: ${designSystem.spacing.xs};
    --spacing-sm: ${designSystem.spacing.sm};
    --spacing-md: ${designSystem.spacing.md};
    --spacing-lg: ${designSystem.spacing.lg};
    --spacing-xl: ${designSystem.spacing.xl};
    --spacing-xxl: ${designSystem.spacing.xxl};
    
    --radius-sm: ${designSystem.layout.radius.sm};
    --radius-md: ${designSystem.layout.radius.md};
    --radius-lg: ${designSystem.layout.radius.lg};
    --radius-xl: ${designSystem.layout.radius.xl};
    
    --font-xs: ${designSystem.typography.sizes.xs};
    --font-sm: ${designSystem.typography.sizes.sm};
    --font-base: ${designSystem.typography.sizes.base};
    --font-lg: ${designSystem.typography.sizes.lg};
    --font-xl: ${designSystem.typography.sizes.xl};
    --font-2xl: ${designSystem.typography.sizes['2xl']};
    --font-3xl: ${designSystem.typography.sizes['3xl']};
    --font-4xl: ${designSystem.typography.sizes['4xl']};
    
    --shadow-sm: ${designSystem.shadows.sm};
    --shadow-md: ${designSystem.shadows.md};
    --shadow-lg: ${designSystem.shadows.lg};
    
    --transition-fast: ${designSystem.transitions.fast};
    --transition-normal: ${designSystem.transitions.normal};
    --transition-slow: ${designSystem.transitions.slow};
  }
`