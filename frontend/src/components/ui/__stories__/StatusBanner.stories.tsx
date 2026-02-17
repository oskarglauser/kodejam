import type { Meta, StoryObj } from '@storybook/react'
import { StatusBanner } from '../status-banner'

const meta: Meta<typeof StatusBanner> = {
  title: 'Components/StatusBanner',
  component: StatusBanner,
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
  },
}

export default meta
type Story = StoryObj<typeof StatusBanner>

export const Info: Story = {
  args: {
    variant: 'info',
    children: (
      <>
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Building...
      </>
    ),
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Added 3 screenshots to canvas',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Capturing screenshots...',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'An error occurred during the build.',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-2 max-w-md">
      <StatusBanner variant="info">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Building...
      </StatusBanner>
      <StatusBanner variant="success">Build completed successfully</StatusBanner>
      <StatusBanner variant="warning">Capturing screenshots...</StatusBanner>
      <StatusBanner variant="error">An error occurred during the build.</StatusBanner>
    </div>
  ),
}
