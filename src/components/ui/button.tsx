import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'positive' | 'negative' | 'accent' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-[var(--card)] text-[var(--card-foreground)] hover:bg-[#1a1a1a] border border-[var(--border)]': variant === 'default',
            'bg-[var(--positive)] text-black hover:bg-[#32e012]': variant === 'positive',
            'bg-[var(--negative)] text-white hover:bg-[#e02a2a]': variant === 'negative',
            'bg-[var(--accent)] text-black hover:bg-[#00cce5]': variant === 'accent',
            'border border-[var(--border)] bg-transparent hover:bg-[var(--card)]': variant === 'outline',
            'hover:bg-[var(--card)]': variant === 'ghost',
            'h-9 px-4 py-2': size === 'default',
            'h-8 rounded-md px-3 text-xs': size === 'sm',
            'h-10 rounded-md px-8': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
