import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        ghost: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        outline: 'border border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        active: 'text-primary bg-primary/10',
      },
      size: {
        sm: 'h-7 w-7',
        default: 'h-8 w-8',
        lg: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'default',
    },
  },
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(iconButtonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
)
IconButton.displayName = 'IconButton'

export { IconButton, iconButtonVariants }
