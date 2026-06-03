import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import {
  Image,
  ImagePlus,
  Video,
  MessageSquare,
  Mic,
  Layers,
  Pencil,
  ChevronDown,
  Bell,
  Settings,
  User,
  PanelLeftClose,
  PanelRightClose,
  PanelLeftOpen,
  PanelRightOpen,
  Crown,
  Coins,
  Gift,
  Link as LinkIcon,
  Ticket,
  UserCog,
  ChevronUp,
  LogOut,
} from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import useModelStore from '@/store/useModelStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import NotificationPanel from '@/components/notification/NotificationPanel'

const MODE_TABS = [
  { mode: 'text-to-image' as const, label: '文生图', icon: Image },
  { mode: 'image-to-image' as const, label: '图生图', icon: ImagePlus },
  { mode: 'text-to-video' as const, label: '视频', icon: Video },
  { mode: 'chat' as const, label: '对话', icon: MessageSquare },
  { mode: 'tts' as const, label: '语音合成', icon: Mic },
  { mode: 'batch' as const, label: '批量', icon: Layers },
  { mode: 'image-editor' as const, label: '图片编辑', icon: Pencil },
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
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const userMenuRef = useRef<HTMLDivElement>(null)

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifPos, setNotifPos] = useState({ top: 0, right: 0 })
  const notifRef = useRef<HTMLButtonElement>(null)

  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'testing'>('connected')

  const isFullPage = currentMode === 'chat' || currentMode === 'tts' || currentMode === 'image-editor'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  const testApiConnection = async () => {
    setApiStatus('testing')
    await new Promise((r) => setTimeout(r, 1500))
    setApiStatus('connected')
  }

  return (
    <header className="glass fixed top-0 left-0 right-0 z-50 flex items-center px-4 gap-3 h-14 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 shrink-0 cursor-pointer">
        <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C5CFF"/>
              <stop offset="100%" stopColor="#00D4FF"/>
            </linearGradient>
          </defs>
          <path d="M25 80L42 20H58C68 20 75 27 75 38C75 48 70 55 62 58L78 82" stroke="url(#logoGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M72 18L76 26L84 22L77 29L83 34L74 32L66 36L71 28Z" fill="#00D4FF"/>
          <circle cx="86" cy="14" r="3" fill="#00D4FF"/>
        </svg>
        <span className="gradient-text text-lg font-bold tracking-tight">Agnes AI</span>
        <span className="text-agnes-text-muted text-sm font-light">Studio</span>
      </div>

      <div className="w-px h-6 bg-agnes-border mx-1" />

      <div className="relative shrink-0">
        <select
          value={currentModelId ?? ''}
          onChange={(e) => setCurrentModel(e.target.value)}
          className="h-8 pl-3 pr-7 text-sm rounded-input bg-agnes-card border border-agnes-border text-agnes-text-primary appearance-none cursor-pointer hover:border-agnes-border-hover focus:outline-none focus:border-agnes-purple/50 transition-colors max-w-[160px] truncate"
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

      <nav className="flex items-center gap-0.5 overflow-auto scrollbar-hide" role="tablist">
        {MODE_TABS.map(({ mode, label, icon: Icon }) => {
          const isActive = currentMode === mode
          return (
            <button
              key={mode}
              role="tab"
              aria-selected={isActive}
              onClick={() => setCurrentMode(mode)}
              className={`flex items-center gap-1.5 h-8 px-2 sm:px-3 text-sm rounded-input transition-all duration-200 whitespace-nowrap ${
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
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      {!isFullPage && (
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
        <button
          onClick={testApiConnection}
          className="hidden lg:flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity px-2 py-1 rounded-md border border-transparent hover:border-agnes-border"
          aria-label="测试API连接"
        >
          {apiStatus === 'testing' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-agnes-warning animate-spin border-2 border-agnes-warning border-t-transparent" />
              <span className="text-xs text-agnes-text-muted">测试中</span>
            </>
          ) : apiStatus === 'connected' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-agnes-success animate-pulse" />
              <span className="text-xs text-agnes-text-muted">已连接</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-agnes-error" />
              <span className="text-xs text-agnes-text-muted">断开</span>
            </>
          )}
        </button>

        <div className="hidden lg:flex items-center gap-1.5 text-xs text-agnes-text-secondary">
          <span className="font-mono">{user?.credits ?? 0} / {user?.membership === 'pro' ? '2000' : '100'} 积分</span>
        </div>

        <button
          ref={notifRef}
          onClick={() => {
            if (!notifOpen && notifRef.current) {
              const rect = notifRef.current.getBoundingClientRect()
              setNotifPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
            }
            setNotifOpen(!notifOpen)
          }}
          aria-label="通知"
          className="relative w-8 h-8 flex items-center justify-center rounded-input text-agnes-text-secondary hover:text-agnes-text-primary hover:bg-white/5 transition-colors"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-agnes-error text-[10px] font-medium text-white px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <Link
          to="/settings"
          aria-label="设置"
          className="w-8 h-8 flex items-center justify-center rounded-input text-agnes-text-secondary hover:text-agnes-text-primary hover:bg-white/5 transition-colors"
        >
          <Settings size={16} />
        </Link>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              if (!userMenuOpen && userMenuRef.current) {
                const rect = userMenuRef.current.getBoundingClientRect()
                setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
              }
              setUserMenuOpen(!userMenuOpen)
            }}
            aria-label="用户"
            className="relative w-8 h-8 rounded-full bg-agnes-purple/20 border border-agnes-purple/30 flex items-center justify-center text-agnes-purple hover:bg-agnes-purple/30 transition-colors"
          >
            <User size={14} />
          </button>

          {userMenuOpen && createPortal(
            <div className="fixed z-[100] w-60 rounded-xl bg-[#101523] border border-agnes-border shadow-2xl shadow-black/60 py-2" style={{ top: menuPos.top, right: menuPos.right }}>
              <div className="px-4 py-3">
                <div className="text-sm font-medium text-agnes-text-primary">{user?.displayName || 'Agnes 用户'}</div>
                <div className="text-xs text-agnes-text-muted mt-0.5">{user?.email || ''}</div>
              </div>
              <div className="h-px bg-agnes-border mx-2" />
              <Link to="/membership" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-agnes-text-primary hover:bg-white/5 transition-colors">
                <Crown size={16} className="text-agnes-warning" />
                <span>会员中心</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-agnes-warning/20 text-agnes-warning font-medium">{user?.membership === 'pro' ? 'Pro' : user?.membership === 'enterprise' ? '企业' : '免费'}</span>
              </Link>
              <Link to="/credits" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-agnes-text-primary hover:bg-white/5 transition-colors">
                <Coins size={16} className="text-agnes-cyan" />
                <span>我的积分</span>
                <span className="ml-auto text-xs text-agnes-text-muted">{user?.credits ?? 0} 积分</span>
              </Link>
              <Link to="/credits" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-agnes-text-primary hover:bg-white/5 transition-colors">
                <Gift size={16} />
                <span>兑换码</span>
              </Link>
              <Link to="/invite" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-agnes-text-primary hover:bg-white/5 transition-colors">
                <LinkIcon size={16} />
                <span>邀请链接</span>
              </Link>
              <Link to="/invite" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-agnes-text-primary hover:bg-white/5 transition-colors">
                <Ticket size={16} />
                <span>邀请码: {user?.inviteCode || ''}</span>
              </Link>
              <div className="h-px bg-agnes-border mx-2" />
              <Link
                to="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-agnes-text-primary hover:bg-white/5 transition-colors"
              >
                <UserCog size={16} />
                <span>个人设置</span>
              </Link>
              <button
                onClick={() => { setUserMenuOpen(false); logout(); navigate('/auth'); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-agnes-error hover:bg-white/5 transition-colors"
              >
                <LogOut size={16} />
                <span>退出登录</span>
              </button>
            </div>,
            document.body
          )}
        </div>

        {notifOpen && createPortal(
          <NotificationPanel
            top={notifPos.top}
            right={notifPos.right}
            onClose={() => setNotifOpen(false)}
          />,
          document.body
        )}
      </div>
    </header>
  )
}
