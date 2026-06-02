import { cn } from '@/utils/helpers'

interface ProgressProps {
  value: number
  max?: number
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export default function Progress({ value, max = 100, showLabel = false, size = 'sm', className }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full bg-agnes-border overflow-hidden', size === 'sm' ? 'h-1' : 'h-2')}>
        <div
          className="h-full rounded-full gradient-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-agnes-text-muted min-w-[3ch]">{Math.round(percentage)}%</span>
      )}
    </div>
  )
}
