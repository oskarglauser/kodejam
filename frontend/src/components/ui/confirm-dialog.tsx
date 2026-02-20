import { createPortal } from 'react-dom'
import { ModalOverlay, ModalContent, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter } from './modal'
import { Button } from './button'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'destructive' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return createPortal(
    <ModalOverlay onClose={onCancel}>
      <ModalContent className="w-[380px]">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalClose onClick={onCancel} />
        </ModalHeader>
        <ModalBody>
          <p className="text-[13px] text-foreground/80 leading-relaxed m-0">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            size="sm"
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>,
    document.body,
  )
}
