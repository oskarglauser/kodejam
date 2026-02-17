import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '../input'
import { Textarea } from '../textarea'
import { Label } from '../label'

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  args: {
    placeholder: 'Enter text...',
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {}

export const WithValue: Story = {
  args: { defaultValue: 'Hello world' },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Disabled input' },
}

export const WithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 320 }}>
      <Label htmlFor="name">Project Name</Label>
      <Input id="name" placeholder="My Project" />
    </div>
  ),
}

export const ErrorState: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 320 }}>
      <Label htmlFor="path">Local Project Path</Label>
      <Input id="path" className="border-destructive focus-visible:ring-destructive" defaultValue="not-absolute" />
      <p className="text-[11px] text-destructive m-0">Must be an absolute path starting with /</p>
    </div>
  ),
}

export const TextareaDefault: StoryObj<typeof Textarea> = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Textarea placeholder="Ask the AI..." rows={3} />
    </div>
  ),
  name: 'Textarea',
}

export const TextareaDisabled: StoryObj<typeof Textarea> = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Textarea placeholder="Ask the AI..." rows={3} disabled />
    </div>
  ),
  name: 'Textarea (Disabled)',
}
