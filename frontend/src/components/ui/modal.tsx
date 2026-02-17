import * as React from 'react'
import { useEffect, useCallback, useId } from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Context for linking title to dialog via aria-labelledby
// ---------------------------------------------------------------------------

const ModalContext = React.createContext<{ titleId: string }>({ titleId: '' })

// ---------------------------------------------------------------------------
// Overlay (backdrop)
// ---------------------------------------------------------------------------

interface ModalOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
}

const ModalOverlay = React.forwardRef<HTMLDivElement, ModalOverlayProps>(
  ({ className, onClose, children, ...props }, ref) => {
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose?.()
      },
      [onClose],
    )

    useEffect(() => {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-[2000] flex items-center justify-center bg-black/40',
          className,
        )}
        onClick={onClose}
        {...props}
      >
        {children}
      </div>
    )
  },
)
ModalOverlay.displayName = 'ModalOverlay'

// ---------------------------------------------------------------------------
// Modal content box
// ---------------------------------------------------------------------------

const ModalContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, onClick, ...props }, ref) => {
    const titleId = useId()

    return (
      <ModalContext.Provider value={{ titleId }}>
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            'bg-background rounded-xl shadow-lg w-[440px] max-w-[90vw] max-h-[80vh] flex flex-col overflow-hidden',
            className,
          )}
          onClick={(e) => {
            e.stopPropagation()
            onClick?.(e)
          }}
          {...props}
        >
          {children}
        </div>
      </ModalContext.Provider>
    )
  },
)
ModalContent.displayName = 'ModalContent'

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

const ModalHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between px-5 py-4 border-b border-border shrink-0',
        className,
      )}
      {...props}
    />
  ),
)
ModalHeader.displayName = 'ModalHeader'

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

const ModalTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const { titleId } = React.useContext(ModalContext)
    return (
      <h2
        ref={ref}
        id={titleId}
        className={cn('text-[15px] font-semibold text-foreground m-0', className)}
        {...props}
      />
    )
  },
)
ModalTitle.displayName = 'ModalTitle'

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

interface ModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const ModalClose = React.forwardRef<HTMLButtonElement, ModalCloseProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'bg-transparent border-none text-muted-foreground text-xl leading-none px-1 cursor-pointer hover:text-foreground',
        className,
      )}
      aria-label="Close"
      {...props}
    >
      &times;
    </button>
  ),
)
ModalClose.displayName = 'ModalClose'

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

const ModalBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex-1 overflow-y-auto p-5', className)}
      {...props}
    />
  ),
)
ModalBody.displayName = 'ModalBody'

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

const ModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0',
        className,
      )}
      {...props}
    />
  ),
)
ModalFooter.displayName = 'ModalFooter'

export {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
}
