import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../modal'
import { Button } from '../button'
import { Input } from '../input'
import { Label } from '../label'

const meta: Meta = {
  title: 'Components/Modal',
}

export default meta

export const Default: StoryObj = {
  render: function ModalDemo() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        {open && (
          <ModalOverlay onClose={() => setOpen(false)}>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Project Settings</ModalTitle>
                <ModalClose onClick={() => setOpen(false)} />
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="modal-name">Project Name</Label>
                    <Input id="modal-name" defaultValue="My Project" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="modal-path">Local Project Path</Label>
                    <Input id="modal-path" placeholder="/Users/you/projects/myapp" />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setOpen(false)}>
                  Save
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </>
    )
  },
}

export const ConfirmationDialog: StoryObj = {
  render: function ConfirmDemo() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>Delete Project</Button>
        {open && (
          <ModalOverlay onClose={() => setOpen(false)}>
            <ModalContent className="w-[360px]">
              <ModalHeader>
                <ModalTitle>Delete Project?</ModalTitle>
                <ModalClose onClick={() => setOpen(false)} />
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-muted-foreground m-0">
                  This action cannot be undone. The project and all its pages will be permanently removed.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setOpen(false)}>
                  Delete
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </>
    )
  },
}
