import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-[13px] transition-all duration-150 placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
