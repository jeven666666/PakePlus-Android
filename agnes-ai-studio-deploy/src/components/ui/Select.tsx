import { type SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, ...props }, ref) => {
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && <label className="text-xs text-agnes-text-secondary">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            className="w-full h-9 px-3 pr-8 text-sm rounded-input bg-agnes-card border border-agnes-border text-agnes-text-primary appearance-none cursor-pointer hover:border-agnes-border-hover focus:outline-none focus:border-agnes-purple/50 transition-colors"
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-agnes-card">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-agnes-text-muted pointer-events-none" />
        </div>
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
