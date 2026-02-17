/**
 * Kodejam Design Tokens
 *
 * Single source of truth for colors, typography, spacing, radii, and shadows.
 * CSS custom properties are defined in index.css; Tailwind consumes them via
 * tailwind.config.ts.  This module exports the resolved hex values for
 * documentation and any programmatic use outside of Tailwind classes.
 */

// ---------------------------------------------------------------------------
// Colors – resolved hex equivalents of the HSL CSS variables
// ---------------------------------------------------------------------------

export const colors = {
  primary: {
    DEFAULT: '#2563eb',
    foreground: '#f8fafc',
  },
  secondary: {
    DEFAULT: '#f1f5f9',
    foreground: '#1e293b',
  },
  destructive: {
    DEFAULT: '#ef4444',
    foreground: '#f8fafc',
  },
  success: {
    DEFAULT: '#16a34a',
    foreground: '#f0fdf4',
  },
  warning: {
    DEFAULT: '#eab308',
    foreground: '#422006',
  },
  muted: {
    DEFAULT: '#f1f5f9',
    foreground: '#64748b',
  },
  accent: {
    DEFAULT: '#f1f5f9',
    foreground: '#1e293b',
  },
  background: '#ffffff',
  foreground: '#1e293b',
  card: {
    DEFAULT: '#ffffff',
    foreground: '#1e293b',
  },
  border: '#e2e8f0',
  input: '#e2e8f0',
  ring: '#2563eb',
} as const

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fontFamily = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"SF Mono", "Fira Code", "Fira Mono", Menlo, Monaco, monospace',
} as const

export const fontSize = {
  xs: '0.625rem',   // 10px – badges, tags
  sm: '0.6875rem',  // 11px – hints, captions
  base: '0.8125rem', // 13px – body text, inputs
  md: '0.875rem',   // 14px – prominent body
  lg: '0.9375rem',  // 15px – section titles
  xl: '1rem',       // 16px – modal titles
  '2xl': '1.25rem', // 20px – page headings
} as const

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const lineHeight = {
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.6',
} as const

// ---------------------------------------------------------------------------
// Spacing – maps to the Tailwind default scale
// ---------------------------------------------------------------------------

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
} as const

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------

export const borderRadius = {
  sm: '4px',    // calc(0.5rem - 4px)
  md: '6px',    // calc(0.5rem - 2px)
  lg: '8px',    // 0.5rem (--radius)
  xl: '12px',   // modals, large containers
  full: '9999px',
} as const

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

export const shadow = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.08)',
  md: '0 4px 12px rgba(0, 0, 0, 0.1)',
  lg: '0 20px 60px rgba(0, 0, 0, 0.15)',
} as const
