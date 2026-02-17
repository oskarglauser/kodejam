import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const statusBannerVariants = cva(
  'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
  {
    variants: {
      variant: {
        info: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning-foreground',
        error: 'bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

export interface StatusBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBannerVariants> {}

const StatusBanner = React.forwardRef<HTMLDivElement, StatusBannerProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={cn(statusBannerVariants({ variant, className }))}
      {...props}
    />
  ),
)
StatusBanner.displayName = 'StatusBanner'

export { StatusBanner, statusBannerVariants }
