import type { ComponentProps } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'kurio-button inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#d28a4c] text-[#140d0a] hover:bg-[#e9a763]',
        outline: 'kurio-button-outline border border-[#69432c] text-[#f5f1eb] hover:bg-[#38220f]',
      },
      size: { default: 'h-11 px-5', sm: 'h-9 px-3' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

// Componente adaptado do padrão shadcn/ui (Radix Slot + CVA).
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : 'button'
  return <Component className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
