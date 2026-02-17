import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from '../textarea'
import { Label } from '../label'

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  args: {
    placeholder: 'Ask the AI...',
    rows: 3,
  },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {}

export const Disabled: Story = {
  args: { disabled: true },
}

export const WithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 400 }}>
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder='Ask the AI... (try "show me the homepage")' rows={3} />
    </div>
  ),
}
