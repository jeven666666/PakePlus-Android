import { create } from 'zustand'

type CreationMode = 'text-to-image' | 'image-to-image' | 'text-to-video' | 'chat' | 'batch' | 'tts' | 'image-editor'

interface TemplateData {
  prompt?: string
  negativePrompt?: string
  style?: string
  params?: Record<string, any>
}

interface AppState {
  currentMode: CreationMode
  leftPanelCollapsed: boolean
  rightPanelCollapsed: boolean
  appliedTemplate: TemplateData | null
  setCurrentMode: (mode: CreationMode) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  applyTemplate: (template: TemplateData | null) => void
}

const useAppStore = create<AppState>((set) => ({
  currentMode: 'text-to-image',
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  appliedTemplate: null,
  setCurrentMode: (mode) => set({ currentMode: mode }),
  toggleLeftPanel: () => set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),
  applyTemplate: (template) => set({ appliedTemplate: template }),
}))

export default useAppStore
