import type { Meta, StoryObj } from '@storybook/react'
import { Label } from '../label'
import { Input } from '../input'

const meta: Meta<typeof Label> = {
  title: 'Components/Label',
  component: Label,
  args: {
    children: 'Field Label',
  },
}

export default meta
type Story = StoryObj<typeof Label>

export const Default: Story = {}

export const WithOptionalTag: Story = {
  render: () => (
    <Label>
      Dev Server URL
      <span className="font-normal text-muted-foreground ml-1">(optional)</span>
    </Label>
  ),
}

export const FormField: Story = {
  render: () => (
    <div className="flex flex-col gap-1 max-w-xs">
      <Label htmlFor="demo-input">Project Name</Label>
      <Input id="demo-input" placeholder="My Project" />
      <p className="text-[11px] text-muted-foreground m-0">The display name for your project.</p>
    </div>
  ),
}
