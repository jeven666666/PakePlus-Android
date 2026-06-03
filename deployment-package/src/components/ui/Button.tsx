import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agnes-purple/50 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'gradient-primary text-white hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] active:scale-[0.98]',
      secondary: 'glass text-agnes-text-primary hover:bg-white/10 active:bg-white/5',
      ghost: 'text-agnes-text-secondary hover:text-agnes-text-primary hover:bg-white/5 active:bg-white/3',
      danger: 'bg-agnes-error/20 text-agnes-error hover:bg-agnes-error/30 active:bg-agnes-error/20',
    }

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
