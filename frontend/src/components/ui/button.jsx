import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva('inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive)] disabled:pointer-events-none disabled:opacity-50', {
  variants: {
    variant: { default: 'ui-button-default', outline: 'ui-button-outline', ghost: 'ui-button-ghost' },
    size: { default: 'h-10 px-4 py-2', icon: 'h-9 w-9' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

export function Button({ className, variant, size, asChild = false, ...props }) {
  const Component = asChild ? Slot : 'button'
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />
}