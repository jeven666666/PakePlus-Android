import { Link } from 'react-router-dom'
import {
  Image,
  ImagePlus,
  Video,
  MessageSquare,
  Mic,
  Layers,
  ChevronDown,
  Bell,
  Settings,
  User,
  Zap,
  PanelLeftClose,
  PanelRightClose,
  PanelLeftOpen,
  PanelRightOpen,
} from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import useModelStore from '@/store/useModelStore'

const MODE_TABS = [
  { mode: 'text-to-image' as const, label: '文生图', icon: Image },
  { mode: 'image-to-image' as const, label: '图生图', icon: ImagePlus },
  { mode: 'text-to-video' as const, label: '视频', icon: Video },
  { mode: 'chat' as const, label: '对话', icon: MessageSquare },
  { mode: 'tts' as const, label: '语音合成', icon: Mic },
  { mode: 'batch' as const, label: '批量', icon: Layers },
]

export default function TopBar() {
  const currentMode = useAppStore((s) => s.currentMode)
  const setCurrentMode = useAppStore((s) => s.setCurrentMode)
  const leftCollapsed = useAppStore((s) => s.leftPanelCollapsed)
  const rightCollapsed = useAppStore((s) => s.rightPanelCollapsed)
  const toggleLeft = useAppStore((s) => s.toggleLeftPanel)
  const toggleRight = useAppStore((s) => s.toggleRightPanel)
  const models = useModelStore((s) => s.models)
  const currentModelId = useModelStore((s) => s.currentModelId)
  const setCurrentModel = useModelStore((s) => s.setCurrentModel)
  const isChat = currentMode === 'chat'

  return (
    <header className="glass fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-3">
      <div className="flex items-center gap-2 shrink-0">
        <Zap size={20} className="text-agnes-cyan" />
        <span className="gradient-text text-lg font-bold tracking-tight">Agnes AI</span>
        <span className="text-agnes-text-muted text-sm font-light">Studio</span>
      </div>

      <div className="w-px h-6 bg-agnes-border mx-1" />

      <div className="relative shrink-0">
        <select
          value={currentModelId ?? ''}
          onChange={(e) => setCurrentModel(e.target.value)}
          className="h-8 pl-3 pr-7 text-sm rounded-input bg-agnes-card border border-agnes-border text-agnes-text-primary appearance-none cursor-pointer hover:border-agnes-border-hover focus:outline-none focus:border-agnes-purple/50 transition-colors"
          aria-label="选择模型"
        >
          {models.filter((m) => m.enabled).map((m) => (
            <option key={m.id} value={m.id} className="bg-agnes-card">
              {m.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-agnes-text-muted pointer-events-none" />
      </div>

      <div className="w-px h-6 bg-agnes-border mx-1" />

      <nav className="flex items-center gap-0.5" role="tablist">
        {MODE_TABS.map(({ mode, label, icon: Icon }) => {
          const isActive = currentMode === mode
          return (
            <button
              key={mode}
              role="tab"
              aria-selected={isActive}
              onClick={() => setCurrentMode(mode)}
              className={`flex items-center gap-1.5 h-8 px-3 text-sm rounded-input transition-all duration-200 ${
                isActive
                  ? mode === 'chat'
                    ? 'bg-agnes-cyan/20 text-agnes-cyan border border-agnes-cyan/40'
                    : mode === 'tts'
                      ? 'bg-agnes-warning/20 text-agnes-warning border border-agnes-warning/40'
                      : 'bg-agnes-purple/20 text-agnes-text-primary border border-agnes-purple/40'
                  : 'text-agnes-text-secondary hover:text-agnes-text-primary hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      {!isChat && (
        <div className="flex items-center gap-1">
          <button
            onClick={toggleLeft}
            aria-label={leftCollapsed ? '展开左侧面板' : '收起左侧面板'}
            className="w-7 h-7 flex items-center justify-center rounded-input text-agnes-text-muted hover:text-agnes-text-primary hover:bg-white/5 transition-colors"
          >
            {leftCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
          <button
            onClick={toggleRight}
            aria-label={rightCollapsed ? '展开右侧面板' : '收起右侧面板'}
            className="w-7 h-7 flex items-center justify-center rounded-input text-agnes-text-muted hover:text-agnes-text-primary hover:bg-white/5 transition-colors"
          >
            {rightCollapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
          </button>
        </div>
      )}

      <div className="w-px h-6 bg-agnes-border mx-1" />

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-agnes-success animate-pulse" />
          <span className="text-xs text-agnes-text-muted">在线</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-agnes-text-secondary">
          <Zap size={12} className="text-agnes-cyan" />
          <span>1,280 / 5,000</span>
        </div>

        <button
          aria-label="通知"
          className="relative w-8 h-8 flex items-center justify-center rounded-input text-agnes-text-secondary hover:text-agnes-text-primary hover:bg-white/5 transition-colors"
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-agnes-error" />
        </button>

        <Link
          to="/settings"
          aria-label="设置"
          className="w-8 h-8 flex items-center justify-center rounded-input text-agnes-text-secondary hover:text-agnes-text-primary hover:bg-white/5 transition-colors"
        >
          <Settings size={16} />
        </Link>

        <button
          aria-label="用户"
          className="w-8 h-8 rounded-full bg-agnes-purple/20 border border-agnes-purple/30 flex items-center justify-center text-agnes-purple hover:bg-agnes-purple/30 transition-colors"
        >
          <User size={14} />
        </button>
      </div>
    </header>
  )
}
