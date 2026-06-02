export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待提交',
    submitted: '已提交',
    queued: '排队中',
    running: '生成中',
    success: '已完成',
    failed: '已失败',
    canceled: '已取消',
  }
  return map[status] ?? status
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: '#7C8498',
    submitted: '#4DA3FF',
    queued: '#F5C451',
    running: '#7C5CFF',
    success: '#3EE08F',
    failed: '#FF6B6B',
    canceled: '#7C8498',
  }
  return map[status] ?? '#7C8498'
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
