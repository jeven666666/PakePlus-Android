import { useEffect, useRef } from 'react'
import { CheckCircle, Coins, Info, UserPlus } from 'lucide-react'
import { useNotificationStore, type NotificationType } from '@/store/useNotificationStore'

const TYPE_ICON: Record<NotificationType, typeof CheckCircle> = {
  task_complete: CheckCircle,
  credits: Coins,
  system: Info,
  invite: UserPlus,
}

const TYPE_ICON_COLOR: Record<NotificationType, string> = {
  task_complete: 'text-agnes-success',
  credits: 'text-agnes-warning',
  system: 'text-agnes-cyan',
  invite: 'text-agnes-purple',
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const months = Math.floor(days / 30)
  return `${months}个月前`
}

interface NotificationPanelProps {
  top: number
  right: number
  onClose: () => void
}

export default function NotificationPanel({ top, right, onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={panelRef}
      className="fixed z-[100] w-80 rounded-xl glass-strong border border-agnes-border shadow-2xl shadow-black/60 flex flex-col"
      style={{ top, right }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-agnes-border">
        <span className="text-sm font-medium text-agnes-text-primary">
          通知{unreadCount > 0 && <span className="ml-1.5 text-xs text-agnes-text-muted">({unreadCount})</span>}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-agnes-purple hover:text-agnes-purple/80 transition-colors"
          >
            全部已读
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-agnes-text-muted">
            <Info size={28} className="mb-2 opacity-40" />
            <span className="text-sm">暂无通知</span>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = TYPE_ICON[notification.type]
            const iconColor = TYPE_ICON_COLOR[notification.type]
            return (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id)
                }}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-white/[0.02]' : ''
                }`}
              >
                <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-agnes-text-primary truncate">
                      {notification.title}
                    </span>
                    {!notification.read && (
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-agnes-purple" />
                    )}
                  </div>
                  <span className="text-xs text-agnes-text-muted mt-0.5 block">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-agnes-border px-4 py-2.5">
          <button className="text-xs text-agnes-purple hover:text-agnes-purple/80 transition-colors w-full text-center">
            查看全部
          </button>
        </div>
      )}
    </div>
  )
}
