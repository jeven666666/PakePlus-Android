import { useEffect } from 'react'
import TopBar from '@/components/topbar/TopBar'
import ControlPanel from '@/components/control/ControlPanel'
import PreviewArea from '@/components/preview/PreviewArea'
import AssetPanel from '@/components/asset/AssetPanel'
import ChatMode from '@/components/chat/ChatMode'
import TTSMode from '@/components/tts/TTSMode'
import ImageEditor from '@/components/editor/ImageEditor'
import useAppStore from '@/store/useAppStore'

export default function Studio() {
  const { currentMode, leftPanelCollapsed, rightPanelCollapsed, toggleLeftPanel, toggleRightPanel } = useAppStore()
  const isChat = currentMode === 'chat'
  const isTTS = currentMode === 'tts'
  const isEditor = currentMode === 'image-editor'

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      if (w < 1024 && !leftPanelCollapsed) toggleLeftPanel()
      if (w < 1280 && !rightPanelCollapsed) toggleRightPanel()
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [leftPanelCollapsed, rightPanelCollapsed, toggleLeftPanel, toggleRightPanel])

  return (
    <div className="h-screen flex flex-col bg-agnes-bg overflow-hidden">
      <TopBar />
      <div className="flex-1 flex min-h-0 pt-14">
        {isChat ? (
          <ChatMode />
        ) : isTTS ? (
          <TTSMode />
        ) : isEditor ? (
          <ImageEditor />
        ) : (
          <>
            <div
              className="shrink-0 transition-all duration-300 overflow-hidden"
              style={{ width: leftPanelCollapsed ? 0 : 320 }}
            >
              <ControlPanel />
            </div>
            <PreviewArea />
            <div
              className="shrink-0 transition-all duration-300 overflow-hidden"
              style={{ width: rightPanelCollapsed ? 0 : 280 }}
            >
              <AssetPanel />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
