import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export default function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-[480px] max-w-[90vw] bg-agnes-bg-secondary border-l border-agnes-border shadow-2xl transition-transform duration-300 ease-out overflow-y-auto',
          open ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 glass">
            <h2 className="text-lg font-semibold text-agnes-text-primary">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="关闭">
              <X className="w-5 h-5 text-agnes-text-muted" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </>
  )
}
