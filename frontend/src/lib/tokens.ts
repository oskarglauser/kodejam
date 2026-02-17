/**
 * Kodejam Design Tokens
 *
 * Single source of truth for colors, typography, spacing, radii, and shadows.
 * CSS custom properties are defined in index.css; Tailwind consumes them via
 * tailwind.config.ts.  This module exports the computed hex values of the HSL
 * CSS variables for documentation and programmatic use outside of Tailwind.
 */

// ---------------------------------------------------------------------------
// Colors – computed hex equivalents of the HSL CSS variables in index.css
// ---------------------------------------------------------------------------

export const colors = {
  primary: {
    DEFAULT: '#2463eb',   // hsl(221, 83%, 53%)
    foreground: '#f8fafc', // hsl(210, 40%, 98%)
  },
  secondary: {
    DEFAULT: '#f1f5f9',   // hsl(210, 40%, 96%)
    foreground: '#0f1729', // hsl(222, 47%, 11%)
  },
  destructive: {
    DEFAULT: '#ef4343',   // hsl(0, 84%, 60%)
    foreground: '#f8fafc', // hsl(210, 40%, 98%)
  },
  success: {
    DEFAULT: '#16a249',   // hsl(142, 76%, 36%)
    foreground: '#f2fdf5', // hsl(138, 76%, 97%)
  },
  warning: {
    DEFAULT: '#f59f0a',   // hsl(38, 92%, 50%)
    foreground: '#451a03', // hsl(21, 92%, 14%)
  },
  muted: {
    DEFAULT: '#f1f5f9',   // hsl(210, 40%, 96%)
    foreground: '#65758b', // hsl(215, 16%, 47%)
  },
  accent: {
    DEFAULT: '#f1f5f9',   // hsl(210, 40%, 96%)
    foreground: '#0f1729', // hsl(222, 47%, 11%)
  },
  background: '#ffffff',   // hsl(0, 0%, 100%)
  foreground: '#0f1729',   // hsl(222, 47%, 11%)
  card: {
    DEFAULT: '#ffffff',
    foreground: '#0f1729',
  },
  border: '#e1e7ef',       // hsl(214, 32%, 91%)
  input: '#e1e7ef',        // hsl(214, 32%, 91%)
  ring: '#2463eb',         // hsl(221, 83%, 53%)
} as const

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fontFamily = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"SF Mono", "Fira Code", "Fira Mono", Menlo, Monaco, monospace',
} as const

export const fontSize = {
  xs: '0.75rem',     // 12px – Tailwind text-xs, badges, labels
  sm: '0.8125rem',   // 13px – body text, inputs
  base: '0.875rem',  // 14px – prominent body
  lg: '0.9375rem',   // 15px – section titles
  xl: '1rem',        // 16px – modal titles
  '2xl': '1.25rem',  // 20px – page headings
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
