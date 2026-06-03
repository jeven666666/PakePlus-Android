import { create } from 'zustand'

type CreationMode = 'text-to-image' | 'image-to-image' | 'text-to-video' | 'chat' | 'batch' | 'tts' | 'image-editor'

interface AppState {
  currentMode: CreationMode
  leftPanelCollapsed: boolean
  rightPanelCollapsed: boolean
  setCurrentMode: (mode: CreationMode) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
}

const useAppStore = create<AppState>((set) => ({
  currentMode: 'text-to-image',
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  setCurrentMode: (mode) => set({ currentMode: mode }),
  toggleLeftPanel: () => set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),
}))

export default useAppStore
