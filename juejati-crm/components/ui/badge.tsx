import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface-2 text-fg-muted',
        brand:   'bg-brand/12 text-brand',
        blue:    'bg-info/12 text-info',
        green:   'bg-success/15 text-success',
        yellow:  'bg-warning/18 text-warning',
        red:     'bg-danger/12 text-danger',
        purple:  'bg-[oklch(0.55_0.18_310)]/12 text-[oklch(0.55_0.18_310)]',
        orange:  'bg-brand/12 text-brand',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
