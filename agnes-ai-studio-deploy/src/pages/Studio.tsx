import { useEffect } from 'react'
import TopBar from '@/components/topbar/TopBar'
import ControlPanel from '@/components/control/ControlPanel'
import PreviewArea from '@/components/preview/PreviewArea'
import AssetPanel from '@/components/asset/AssetPanel'
import ChatMode from '@/components/chat/ChatMode'
import TTSMode from '@/components/tts/TTSMode'
import ImageEditor from '@/components/editor/ImageEditor'
import useAppStore from '@/store/useAppStore'
import useTaskStore from '@/store/useTaskStore'

export default function Studio() {
  const { currentMode, leftPanelCollapsed, rightPanelCollapsed, toggleLeftPanel, toggleRightPanel } = useAppStore()
  const { createTask, completeTask, tasks, currentTaskId } = useTaskStore()
  const isChat = currentMode === 'chat'
  const isTTS = currentMode === 'tts'
  const isEditor = currentMode === 'image-editor'

  useEffect(() => {
    // 添加示例任务用于测试
    if (tasks.length === 0) {
      const taskId = createTask({
        type: 'video',
        prompt: '测试视频 - 点击更多按钮查看菜单',
        negativePrompt: '',
        params: { model: 'test' }
      })
      setTimeout(() => {
        completeTask(taskId, [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60'
        ])
      }, 500)
    }
  }, [createTask, completeTask, tasks.length])

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
      <div className="flex-1 flex min-h-0">
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
