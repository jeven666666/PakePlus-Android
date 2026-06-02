import { create } from 'zustand'

type ModelType = 'chat' | 'image' | 'video' | 'multimodal'

interface ModelConfig {
  id: string
  name: string
  alias: string
  provider: string
  apiBaseUrl: string
  apiKey: string
  modelType: ModelType
  contextLength: number
  maxOutputLength: number
  capabilities: string[]
  temperature: number
  topP: number
  enabled: boolean
  isDefault: boolean
  remark: string
}

interface ModelState {
  models: ModelConfig[]
  currentModelId: string | null
  addModel: (model: Omit<ModelConfig, 'id'>) => void
  updateModel: (id: string, updates: Partial<ModelConfig>) => void
  deleteModel: (id: string) => void
  setCurrentModel: (id: string) => void
  setDefaultModel: (id: string) => void
  testConnectivity: (id: string) => Promise<boolean>
}

const defaultModels: ModelConfig[] = [
  {
    id: 'model_1',
    name: 'Agnes Video v2.0',
    alias: 'agnes-video-v2',
    provider: 'Agnes AI',
    apiBaseUrl: 'https://api.agnes.ai/v2',
    apiKey: '',
    modelType: 'video',
    contextLength: 8192,
    maxOutputLength: 4096,
    capabilities: ['video', 'image'],
    temperature: 0.7,
    topP: 0.9,
    enabled: true,
    isDefault: true,
    remark: 'Agnes 官方视频生成模型 v2.0',
  },
  {
    id: 'model_2',
    name: 'Agnes Image Pro',
    alias: 'agnes-image-pro',
    provider: 'Agnes AI',
    apiBaseUrl: 'https://api.agnes.ai/v2',
    apiKey: '',
    modelType: 'image',
    contextLength: 4096,
    maxOutputLength: 2048,
    capabilities: ['image'],
    temperature: 0.8,
    topP: 0.95,
    enabled: true,
    isDefault: false,
    remark: 'Agnes 高质量图像生成模型',
  },
  {
    id: 'model_3',
    name: 'Agnes Chat',
    alias: 'agnes-chat',
    provider: 'Agnes AI',
    apiBaseUrl: 'https://api.agnes.ai/v2',
    apiKey: '',
    modelType: 'chat',
    contextLength: 32768,
    maxOutputLength: 8192,
    capabilities: ['text', 'tool-calling'],
    temperature: 0.7,
    topP: 0.9,
    enabled: true,
    isDefault: false,
    remark: 'Agnes 对话模型',
  },
  {
    id: 'model_4',
    name: 'Agnes Multimodal',
    alias: 'agnes-multimodal',
    provider: 'Agnes AI',
    apiBaseUrl: 'https://api.agnes.ai/v2',
    apiKey: '',
    modelType: 'multimodal',
    contextLength: 16384,
    maxOutputLength: 4096,
    capabilities: ['text', 'image', 'video'],
    temperature: 0.7,
    topP: 0.9,
    enabled: true,
    isDefault: false,
    remark: 'Agnes 多模态模型',
  },
]

let modelCounter = defaultModels.length

const useModelStore = create<ModelState>((set, get) => ({
  models: defaultModels,
  currentModelId: 'model_1',

  addModel: (modelData) => {
    const id = `model_${Date.now()}_${++modelCounter}`
    set((state) => ({
      models: [...state.models, { ...modelData, id }],
    }))
  },

  updateModel: (id, updates) =>
    set((state) => ({
      models: state.models.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  deleteModel: (id) =>
    set((state) => ({
      models: state.models.filter((m) => m.id !== id),
      currentModelId: state.currentModelId === id ? (state.models.find((m) => m.isDefault)?.id ?? null) : state.currentModelId,
    })),

  setCurrentModel: (id) => set({ currentModelId: id }),

  setDefaultModel: (id) =>
    set((state) => ({
      models: state.models.map((m) => ({ ...m, isDefault: m.id === id })),
    })),

  testConnectivity: async (id) => {
    await new Promise((r) => setTimeout(r, 1500))
    const model = get().models.find((m) => m.id === id)
    return !!model?.enabled
  },
}))

export default useModelStore
export type { ModelConfig, ModelType }
