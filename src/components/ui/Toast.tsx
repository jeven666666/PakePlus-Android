import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface ToastItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: 'border-agnes-success/30 bg-agnes-success/10',
  error: 'border-agnes-error/30 bg-agnes-error/10',
  warning: 'border-agnes-warning/30 bg-agnes-warning/10',
  info: 'border-agnes-info/30 bg-agnes-info/10',
}

const textColorMap = {
  success: 'text-agnes-success',
  error: 'text-agnes-error',
  warning: 'text-agnes-warning',
  info: 'text-agnes-info',
}

function ToastMessage({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const Icon = iconMap[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-card border glass animate-slide-up', colorMap[toast.type])}>
      <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', textColorMap[toast.type])} />
      <p className="flex-1 text-sm text-agnes-text-primary">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="p-0.5 rounded hover:bg-white/10 shrink-0" aria-label="关闭通知">
        <X className="w-4 h-4 text-agnes-text-muted" />
      </button>
    </div>
  )
}

let toastId = 0
const listeners: Set<(toasts: ToastItem[]) => void> = new Set()
let toastList: ToastItem[] = []

function emitChange() {
  listeners.forEach((l) => l([...toastList]))
}

export function showToast(type: ToastItem['type'], message: string) {
  const id = `toast_${++toastId}`
  toastList = [...toastList, { id, type, message }]
  emitChange()
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    listeners.add(setToasts)
    return () => { listeners.delete(setToasts) }
  }, [])

  const handleDismiss = (id: string) => {
    toastList = toastList.filter((t) => t.id !== id)
    emitChange()
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80" aria-live="polite">
      {toasts.map((t) => (
        <ToastMessage key={t.id} toast={t} onDismiss={handleDismiss} />
      ))}
    </div>
  )
}
