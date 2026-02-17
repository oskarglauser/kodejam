import type { Meta, StoryObj } from '@storybook/react'
import { Chip } from '../chip'

const meta: Meta<typeof Chip> = {
  title: 'Components/Chip',
  component: Chip,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'success', 'outline'],
    },
  },
  args: {
    children: 'Chip',
  },
}

export default meta
type Story = StoryObj<typeof Chip>

export const Default: Story = {}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'wireframe-box' },
}

export const Success: Story = {
  args: { variant: 'success', children: 'localhost:3000' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: 'optional' },
}

export const ContextChips: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
        Context:
      </span>
      <div className="flex gap-1">
        <Chip>Header</Chip>
        <Chip>Sidebar</Chip>
        <Chip>Dashboard Card</Chip>
      </div>
    </div>
  ),
  name: 'Context Bar Example',
}

export const DevUrlBadge: Story = {
  render: () => (
    <Chip variant="success">localhost:3000</Chip>
  ),
  name: 'Dev URL Badge',
}
