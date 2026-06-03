import { create } from 'zustand'

type ModelType = 'chat' | 'image' | 'video' | 'multimodal' | 'tts'

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
    name: 'Agnes 1.5 Flash',
    alias: 'agnes-1.5-flash',
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
    isDefault: true,
    remark: 'Agnes 1.5 Flash 快速对话模型',
  },
  {
    id: 'model_2',
    name: 'Agnes 2.0 Flash',
    alias: 'agnes-2.0-flash',
    provider: 'Agnes AI',
    apiBaseUrl: 'https://api.agnes.ai/v2',
    apiKey: '',
    modelType: 'multimodal',
    contextLength: 65536,
    maxOutputLength: 16384,
    capabilities: ['text', 'image', 'video', 'tool-calling'],
    temperature: 0.7,
    topP: 0.9,
    enabled: true,
    isDefault: false,
    remark: 'Agnes 2.0 Flash 多模态模型',
  },
  {
    id: 'model_3',
    name: 'Agnes Image 2.0 Flash',
    alias: 'agnes-image-2.0-flash',
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
    remark: 'Agnes Image 2.0 Flash 图像生成模型',
  },
  {
    id: 'model_4',
    name: 'Agnes Image 2.1 Flash',
    alias: 'agnes-image-2.1-flash',
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
    remark: 'Agnes Image 2.1 Flash 高质量图像生成模型',
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
