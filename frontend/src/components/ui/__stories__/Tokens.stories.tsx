import type { Meta, StoryObj } from '@storybook/react'
import { colors, fontSize, fontWeight, fontFamily, spacing, borderRadius, shadow } from '@/lib/tokens'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          background: value,
          border: '1px solid #e2e8f0',
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{value}</div>
      </div>
    </div>
  )
}

function ColorGroup({ title, items }: { title: string; items: { name: string; value: string }[] }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1e293b' }}>{title}</h3>
      {items.map((item) => (
        <ColorSwatch key={item.name} {...item} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Meta – all token pages live under "Design Tokens"
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Design Tokens',
}
export default meta

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const Colors: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 600, fontFamily: fontFamily.sans }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Colors</h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
        Semantic color tokens used throughout Kodejam. Defined as CSS custom properties (HSL) in
        index.css and consumed via Tailwind utilities.
      </p>

      <ColorGroup
        title="Brand / Action"
        items={[
          { name: 'primary', value: colors.primary.DEFAULT },
          { name: 'primary-foreground', value: colors.primary.foreground },
        ]}
      />
      <ColorGroup
        title="Destructive"
        items={[
          { name: 'destructive', value: colors.destructive.DEFAULT },
          { name: 'destructive-foreground', value: colors.destructive.foreground },
        ]}
      />
      <ColorGroup
        title="Success"
        items={[
          { name: 'success', value: colors.success.DEFAULT },
          { name: 'success-foreground', value: colors.success.foreground },
        ]}
      />
      <ColorGroup
        title="Warning"
        items={[
          { name: 'warning', value: colors.warning.DEFAULT },
          { name: 'warning-foreground', value: colors.warning.foreground },
        ]}
      />
      <ColorGroup
        title="Neutral"
        items={[
          { name: 'background', value: colors.background },
          { name: 'foreground', value: colors.foreground },
          { name: 'muted', value: colors.muted.DEFAULT },
          { name: 'muted-foreground', value: colors.muted.foreground },
          { name: 'border', value: colors.border },
        ]}
      />
      <ColorGroup
        title="Secondary / Accent"
        items={[
          { name: 'secondary', value: colors.secondary.DEFAULT },
          { name: 'accent', value: colors.accent.DEFAULT },
        ]}
      />
    </div>
  ),
}

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const Typography: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 600, fontFamily: fontFamily.sans }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Typography</h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
        Font families, sizes, and weights used in the design system.
      </p>

      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Font Families</h3>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: fontFamily.sans, fontSize: 14, marginBottom: 4 }}>
          <strong>Sans:</strong> {fontFamily.sans.split(',')[0]}
        </p>
        <p style={{ fontFamily: fontFamily.mono, fontSize: 14 }}>
          <strong>Mono:</strong> {fontFamily.mono.split(',')[0]}
        </p>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Font Sizes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {(Object.entries(fontSize) as [string, string][]).map(([name, size]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <code style={{ fontSize: 11, color: '#64748b', width: 40, fontFamily: fontFamily.mono }}>
              {name}
            </code>
            <span style={{ fontSize: size, color: '#1e293b' }}>
              The quick brown fox ({size})
            </span>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Font Weights</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(Object.entries(fontWeight) as [string, string][]).map(([name, weight]) => (
          <span key={name} style={{ fontSize: 14, fontWeight: Number(weight) }}>
            {name} ({weight})
          </span>
        ))}
      </div>
    </div>
  ),
}

// ---------------------------------------------------------------------------
// Spacing, Radius & Shadows
// ---------------------------------------------------------------------------

export const SpacingRadiusShadows: StoryObj = {
  name: 'Spacing, Radius & Shadows',
  render: () => (
    <div style={{ maxWidth: 600, fontFamily: fontFamily.sans }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Spacing, Radius & Shadows</h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
        Layout primitives used for consistent spacing, rounding, and elevation.
      </p>

      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Spacing Scale</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
        {(Object.entries(spacing) as [string, string][]).map(([name, value]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <code style={{ fontSize: 11, color: '#64748b', width: 28, textAlign: 'right', fontFamily: fontFamily.mono }}>
              {name}
            </code>
            <div
              style={{
                height: 16,
                width: value,
                background: '#2563eb',
                borderRadius: 2,
                minWidth: 2,
              }}
            />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{value}</span>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Border Radius</h3>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {(Object.entries(borderRadius) as [string, string][]).map(([name, value]) => (
          <div key={name} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: '#e2e8f0',
                borderRadius: value,
                border: '2px solid #94a3b8',
              }}
            />
            <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{value}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Shadows</h3>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {(Object.entries(shadow) as [string, string][]).map(([name, value]) => (
          <div key={name} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 80,
                height: 56,
                background: '#ffffff',
                borderRadius: 8,
                boxShadow: value,
              }}
            />
            <div style={{ fontSize: 11, marginTop: 6, fontWeight: 500 }}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  ),
}
