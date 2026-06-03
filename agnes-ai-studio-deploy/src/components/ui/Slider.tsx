import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/helpers'

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ label, value, onChange, min = 0, max = 100, step = 1, unit = '', className, ...props }, ref) => {
    const percentage = ((value - min) / (max - min)) * 100

    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <label className="text-xs text-agnes-text-secondary">{label}</label>
          <span className="text-xs font-mono text-agnes-cyan">{value}{unit}</span>
        </div>
        <div className="relative">
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-agnes-border"
            style={{
              background: `linear-gradient(to right, #7C5CFF 0%, #00D4FF ${percentage}%, rgba(255,255,255,0.08) ${percentage}%)`,
            }}
            {...props}
          />
        </div>
      </div>
    )
  }
)

Slider.displayName = 'Slider'
export default Slider
