import { create } from 'zustand'

export type NotificationType = 'task_complete' | 'credits' | 'system' | 'invite'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: number
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

const now = Date.now()
const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

const initialNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'task_complete',
    title: '图像生成完成',
    message: '您的图像生成任务已完成，请查看结果。',
    read: false,
    createdAt: now - 5 * MINUTE,
  },
  {
    id: 'n2',
    type: 'credits',
    title: '积分到账 +100',
    message: '您获得了 100 积分奖励。',
    read: false,
    createdAt: now - 1 * HOUR,
  },
  {
    id: 'n3',
    type: 'system',
    title: '系统更新 v1.2',
    message: 'Agnes AI Studio 已更新至 v1.2 版本。',
    read: true,
    createdAt: now - 1 * DAY,
  },
  {
    id: 'n4',
    type: 'invite',
    title: '邀请用户注册成功',
    message: '您邀请的用户已成功注册，获得奖励积分。',
    read: true,
    createdAt: now - 2 * DAY,
  },
]

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: initialNotifications,
  unreadCount: initialNotifications.filter((n) => !n.read).length,

  addNotification: (notification) => {
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const newNotification: Notification = { ...notification, id, read: false }
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }))
  },

  markAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      if (!notification || notification.read) return state
      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: state.unreadCount - 1,
      }
    })
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 })
  },
}))
