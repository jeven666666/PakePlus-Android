import { cn } from '@/utils/helpers'

interface ChipProps {
  children: React.ReactNode
  variant?: 'default' | 'purple' | 'cyan' | 'success' | 'warning' | 'error'
  active?: boolean
  onClick?: () => void
  className?: string
}

const colorMap = {
  default: 'bg-white/5 text-agnes-text-secondary border-agnes-border',
  purple: 'bg-agnes-purple/15 text-agnes-purple border-agnes-purple/30',
  cyan: 'bg-agnes-cyan/15 text-agnes-cyan border-agnes-cyan/30',
  success: 'bg-agnes-success/15 text-agnes-success border-agnes-success/30',
  warning: 'bg-agnes-warning/15 text-agnes-warning border-agnes-warning/30',
  error: 'bg-agnes-error/15 text-agnes-error border-agnes-error/30',
}

const activeColorMap = {
  default: 'bg-white/15 text-agnes-text-primary border-white/20',
  purple: 'bg-agnes-purple/25 text-agnes-purple border-agnes-purple/50',
  cyan: 'bg-agnes-cyan/25 text-agnes-cyan border-agnes-cyan/50',
  success: 'bg-agnes-success/25 text-agnes-success border-agnes-success/50',
  warning: 'bg-agnes-warning/25 text-agnes-warning border-agnes-warning/50',
  error: 'bg-agnes-error/25 text-agnes-error border-agnes-error/50',
}

export default function Chip({ children, variant = 'default', active, onClick, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border transition-all duration-200',
        active ? activeColorMap[variant] : colorMap[variant],
        onClick && 'cursor-pointer hover:scale-105',
        className
      )}
    >
      {children}
    </button>
  )
}
