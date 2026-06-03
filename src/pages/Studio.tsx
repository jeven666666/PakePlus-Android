import TopBar from '@/components/topbar/TopBar'
import ControlPanel from '@/components/control/ControlPanel'
import PreviewArea from '@/components/preview/PreviewArea'
import AssetPanel from '@/components/asset/AssetPanel'
import ChatMode from '@/components/chat/ChatMode'
import TTSMode from '@/components/tts/TTSMode'
import useAppStore from '@/store/useAppStore'

export default function Studio() {
  const { currentMode, leftPanelCollapsed, rightPanelCollapsed } = useAppStore()
  const isChat = currentMode === 'chat'
  const isTTS = currentMode === 'tts'

  return (
    <div className="h-screen flex flex-col bg-agnes-bg">
      <TopBar />
      <div className="flex-1 flex overflow-hidden pt-14">
        {isChat ? (
          <ChatMode />
        ) : isTTS ? (
          <TTSMode />
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
