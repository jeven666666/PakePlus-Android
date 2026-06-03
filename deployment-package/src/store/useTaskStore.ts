import { create } from 'zustand'

type TaskType = 'image' | 'video' | 'chat'
type TaskStatus = 'pending' | 'submitted' | 'queued' | 'running' | 'success' | 'failed' | 'canceled'

interface Task {
  id: string
  type: TaskType
  prompt: string
  negativePrompt: string
  params: Record<string, unknown>
  status: TaskStatus
  progress: number
  resultUrls: string[]
  createdAt: number
  updatedAt: number
  error?: string
}

interface TaskState {
  tasks: Task[]
  currentTaskId: string | null
  createTask: (task: Omit<Task, 'id' | 'status' | 'progress' | 'resultUrls' | 'createdAt' | 'updatedAt'>) => string
  updateTaskStatus: (id: string, status: TaskStatus, progress?: number) => void
  updateTaskProgress: (id: string, progress: number) => void
  completeTask: (id: string, resultUrls: string[]) => void
  failTask: (id: string, error: string) => void
  cancelTask: (id: string) => void
  setCurrentTask: (id: string | null) => void
  removeTask: (id: string) => void
  clearCompleted: () => void
}

let taskCounter = 0

const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  currentTaskId: null,

  createTask: (taskData) => {
    const id = `task_${Date.now()}_${++taskCounter}`
    const now = Date.now()
    const task: Task = {
      ...taskData,
      id,
      status: 'submitted',
      progress: 0,
      resultUrls: [],
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      tasks: [task, ...state.tasks],
      currentTaskId: id,
    }))
    return id
  },

  updateTaskStatus: (id, status, progress) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status, progress: progress ?? t.progress, updatedAt: Date.now() } : t
      ),
    })),

  updateTaskProgress: (id, progress) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, progress, updatedAt: Date.now() } : t
      ),
    })),

  completeTask: (id, resultUrls) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: 'success', progress: 100, resultUrls, updatedAt: Date.now() } : t
      ),
    })),

  failTask: (id, error) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: 'failed', error, updatedAt: Date.now() } : t
      ),
    })),

  cancelTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: 'canceled', updatedAt: Date.now() } : t
      ),
    })),

  setCurrentTask: (id) => set({ currentTaskId: id }),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      currentTaskId: state.currentTaskId === id ? null : state.currentTaskId,
    })),

  clearCompleted: () =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.status !== 'success' && t.status !== 'failed' && t.status !== 'canceled'),
    })),
}))

export default useTaskStore
export type { Task, TaskType, TaskStatus }
