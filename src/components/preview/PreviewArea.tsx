import { useState, useEffect, useCallback, useRef } from 'react'
import useTaskStore from '@/store/useTaskStore'
import useAppStore from '@/store/useAppStore'
import {
  Sparkles, Play, Pause, ZoomIn, ZoomOut, Columns2, RefreshCw, Pencil, Copy, Heart,
  Download, MoreHorizontal, ChevronDown, ChevronUp, Volume2, VolumeX, ImagePlus, Video,
  Layers, Camera, Grid3X3, CheckSquare, Trash2, Mic,
  Scissors, Split, Film, Gauge, RotateCcw, Type as WandIcon, Music, Volume2 as VolIcon,
  Palette, Crop, Maximize2, Minimize2, RotateCw, Droplet, Clapperboard, Users, Layers as LayersIcon,
} from 'lucide-react'
import Chip from '@/components/ui/Chip'
import Progress from '@/components/ui/Progress'
import { getStatusLabel, getStatusColor, formatDuration } from '@/utils/helpers'
import { showToast } from '@/components/ui/Toast'
import { mockAssets } from '@/utils/mockData'

const modeLabels: Record<string, string> = {
  'text-to-image': '文生图', 'image-to-image': '图生图', 'text-to-video': '文生视频', batch: '批量',
}

const imageToolbar = [
  { icon: CheckSquare, label: '多选' }, { icon: ZoomIn, label: '放大' }, { icon: ZoomOut, label: '缩小' },
  { icon: Columns2, label: '对比' }, { icon: RefreshCw, label: '重生成' }, { icon: Pencil, label: '编辑' },
  { icon: Video, label: '转视频' }, { icon: Copy, label: '变体' }, { icon: Heart, label: '收藏' },
  { icon: Download, label: '下载' }, { icon: MoreHorizontal, label: '更多' },
]

const videoToolbar = [
  { icon: Play, label: '播放' }, { icon: Camera, label: '截图' }, { icon: Columns2, label: '对比' },
  { icon: RefreshCw, label: '重生成' }, { icon: Heart, label: '收藏' }, { icon: Download, label: '下载' },
  { icon: MoreHorizontal, label: '更多' },
]

const batchToolbar = [
  { icon: Grid3X3, label: '网格视图' }, { icon: CheckSquare, label: '全选' },
  { icon: Download, label: '全部下载' }, { icon: Trash2, label: '删除选中' },
]

const videoEditMenu = [
  { group: '剪辑类', items: [{ icon: Scissors, label: '裁剪' }, { icon: Split, label: '分割' }, { icon: Film, label: '拼接' }] },
  { group: '速度类', items: [{ icon: Gauge, label: '调速' }, { icon: RotateCcw, label: '倒放' }] },
  { group: '效果类', items: [{ icon: Sparkles, label: '转场' }, { icon: WandIcon, label: '字幕添加' }, { icon: Music, label: '音频替换' }, { icon: VolIcon, label: '音量调节' }, { icon: Droplet, label: '背景音乐插入' }] },
  { group: '画面类', items: [{ icon: Palette, label: '滤镜套用' }, { icon: LayersIcon, label: '画面调色' }, { icon: Maximize2, label: '画幅修改' }, { icon: Crop, label: '画面裁剪缩放' }, { icon: RotateCw, label: '画面旋转' }] },
  { group: '水印类', items: [{ icon: Droplet, label: '水印添加移除' }] },
  { group: '素材类', items: [{ icon: Trash2, label: '素材删除' }] },
  { group: '其他', items: [{ icon: Clapperboard, label: '片头片尾制作' }, { icon: Camera, label: '定格画面' }, { icon: Mic, label: '声音提取' }, { icon: Users, label: '人声分离' }] },
]

const mockThumbnails = mockAssets.slice(0, 4)

const emptyConfigs: Record<string, { icon: typeof Sparkles; title: string; desc: string }> = {
  'text-to-image': { icon: Sparkles, title: '开始你的创作', desc: '输入提示词，调整参数，点击生成' },
  'image-to-image': { icon: ImagePlus, title: '上传参考图开始创作', desc: '上传一张图片，AI 将基于参考图生成新作品' },
  'text-to-video': { icon: Video, title: '创作你的视频', desc: '描述画面，控制镜头，生成视频' },
  batch: { icon: Layers, title: '批量生成', desc: '输入多个提示词，一键批量生成' },
  tts: { icon: Mic, title: '语音合成', desc: '输入文本，选择音色，生成语音' },
}

function EmptyState({ mode }: { mode: string }) {
  const config = emptyConfigs[mode] ?? emptyConfigs['text-to-image']
  const Icon = config.icon
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 animate-shimmer" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(124,92,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(0,212,255,0.1) 0%, transparent 50%)' }} />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full flex items-center justify-center gradient-primary opacity-80 glow-purple">
          <Icon className="w-16 h-16 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-agnes-text-primary">{config.title}</h2>
        <p className="text-sm text-agnes-text-muted">{config.desc}</p>
      </div>
    </div>
  )
}

function ModeBadge({ mode }: { mode: string }) {
  return (
    <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md text-[11px] font-medium bg-agnes-purple/20 text-agnes-purple border border-agnes-purple/30">
      {modeLabels[mode] ?? mode}
    </div>
  )
}

function TaskStatusBar({ task }: { task: ReturnType<typeof useTaskStore.getState>['tasks'][0] }) {
  const [elapsed, setElapsed] = useState(Date.now() - task.createdAt)
  useEffect(() => {
    if (task.status === 'success' || task.status === 'failed' || task.status === 'canceled') return
    const timer = setInterval(() => setElapsed(Date.now() - task.createdAt), 1000)
    return () => clearInterval(timer)
  }, [task.createdAt, task.status])
  const chipVariant = task.status === 'success' ? 'success' : task.status === 'failed' ? 'error' : task.status === 'running' ? 'purple' : task.status === 'queued' ? 'warning' : 'default'
  return (
    <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-agnes-border bg-agnes-bg-secondary/60 h-auto">
      <Chip variant={chipVariant}>{getStatusLabel(task.status)}</Chip>
      <span className="text-xs text-agnes-text-muted">{formatDuration(elapsed)}</span>
      {(task.status === 'running' || task.status === 'queued') && (
        <div className="flex-1 max-w-[200px]"><Progress value={task.progress} showLabel size="sm" /></div>
      )}
    </div>
  )
}

function ImagePreview({ url, zoom, onZoomIn, onZoomOut }: { url: string; zoom: number; onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden relative group">
      <img src={url} alt="生成结果" className="max-w-full max-h-full object-contain transition-transform duration-300" style={{ transform: `scale(${zoom})` }} />
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button onClick={onZoomIn} className="w-8 h-8 rounded-lg bg-agnes-card/80 glass flex items-center justify-center hover:bg-agnes-card-hover transition-colors duration-200" aria-label="放大">
          <ZoomIn className="w-4 h-4 text-agnes-text-secondary" />
        </button>
        <button onClick={onZoomOut} className="w-8 h-8 rounded-lg bg-agnes-card/80 glass flex items-center justify-center hover:bg-agnes-card-hover transition-colors duration-200" aria-label="缩小">
          <ZoomOut className="w-4 h-4 text-agnes-text-secondary" />
        </button>
      </div>
    </div>
  )
}

function VideoPreview({ url, zoom }: { url: string; zoom: number }) {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden relative group">
      <div className="relative w-full max-w-[90%] aspect-video rounded-card overflow-hidden bg-agnes-card" style={{ transform: `scale(${zoom})` }}>
        <img src={url} alt="视频预览" className="max-w-full max-h-full w-full h-full object-cover" />
        <button onClick={() => setPlaying(!playing)} className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors duration-200 hover:bg-black/30" aria-label={playing ? '暂停' : '播放'}>
          {playing ? <Pause className="w-14 h-14 text-white/90 drop-shadow-lg" /> : <Play className="w-14 h-14 text-white/90 drop-shadow-lg" />}
        </button>
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
          <button onClick={() => setMuted(!muted)} className="shrink-0" aria-label={muted ? '取消静音' : '静音'}>
            {muted ? <VolumeX className="w-4 h-4 text-white/80" /> : <Volume2 className="w-4 h-4 text-white/80" />}
          </button>
          <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full gradient-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] font-mono text-white/60">0:00</span>
        </div>
      </div>
    </div>
  )
}

function ShimmerPlaceholder() {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center p-8">
      <div className="w-full max-w-lg aspect-square rounded-card animate-shimmer" />
    </div>
  )
}

function ActionToolbar({ actions, favorited, onToggleFavorite, onAction, selectMode, onSelectModeToggle }: {
  actions: { icon: typeof Sparkles; label: string }[]; favorited: boolean; onToggleFavorite: () => void;
  onAction: (label: string) => void; selectMode: boolean; onSelectModeToggle: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div className="shrink-0 flex items-center justify-center gap-1 px-4 py-2 border-t border-agnes-border relative overflow-x-auto flex-nowrap scrollbar-hide">
      {actions.map((action) => {
        const isFavorite = action.icon === Heart
        const isSelect = action.label === '多选'
        const isMore = action.label === '更多'
        const Icon = action.icon
        if (isMore && menuOpen) {
          return (
            <div key={action.label} ref={menuRef} className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50">
              <div className="bg-agnes-card border border-agnes-border rounded-xl shadow-2xl p-4 max-w-[520px] w-[90vw] max-h-[400px] overflow-y-auto">
                {videoEditMenu.map((g) => (
                  <div key={g.group} className="mb-3 last:mb-0">
                    <div className="text-[11px] font-medium text-agnes-text-muted uppercase tracking-wider mb-1.5">{g.group}</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {g.items.map((item) => {
                        const ItemIcon = item.icon
                        return (
                          <button key={item.label} onClick={() => {
                            const editTaskId = useTaskStore.getState().createTask({ type: 'video', prompt: `视频编辑: ${item.label}`, negativePrompt: '', params: { editType: item.label } })
                            useTaskStore.getState().setCurrentTask(editTaskId)
                            showToast('success', `已提交「${item.label}」任务`)
                            setMenuOpen(false)
                          }}
                            className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg hover:bg-agnes-bg-secondary transition-colors duration-150">
                            <ItemIcon className="w-4 h-4 text-agnes-text-secondary" />
                            <span className="text-[10px] text-agnes-text-muted whitespace-nowrap">{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }
        return (
          <button key={action.label}
            onClick={() => {
              if (isSelect) onSelectModeToggle()
              else if (isMore) setMenuOpen((o) => !o)
              else if (isFavorite) onToggleFavorite()
              else onAction(action.label)
            }}
            className={`relative group/btn w-9 h-9 rounded-btn flex items-center justify-center text-agnes-text-muted hover:text-agnes-text-primary hover:bg-white/5 transition-all duration-200 ${isSelect && selectMode ? 'bg-agnes-purple/15 text-agnes-purple' : ''}`}
            aria-label={action.label}>
            {isSelect && selectMode ? <CheckSquare className="w-[18px] h-[18px]" /> : isFavorite && favorited ? <Heart className="w-[18px] h-[18px] text-agnes-error fill-agnes-error" /> : <Icon className="w-[18px] h-[18px]" />}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] whitespace-nowrap bg-agnes-card text-agnes-text-secondary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none border border-agnes-border">{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function VersionThumbnails({ activeIndex, onSelect, selectMode, selectedItems, onToggleSelect }: {
  activeIndex: number; onSelect: (i: number) => void; selectMode: boolean; selectedItems: Set<number>; onToggleSelect: (i: number) => void
}) {
  return (
    <div className="shrink-0 min-h-0 max-h-[120px] flex items-center gap-2 px-4 py-2 overflow-x-auto border-t border-agnes-border">
      {mockThumbnails.map((thumb, i) => (
        <button key={thumb.id} onClick={() => selectMode ? onToggleSelect(i) : onSelect(i)}
          className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 relative ${i === activeIndex ? 'border-agnes-purple glow-purple' : selectedItems.has(i) ? 'border-agnes-purple bg-agnes-purple/10' : 'border-transparent hover:border-agnes-border-hover'}`}
          aria-label={`版本 ${i + 1}`}>
          <img src={thumb.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          {selectMode && (
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded border ${selectedItems.has(i) ? 'bg-agnes-purple border-agnes-purple' : 'border-white/70 bg-black/20'} flex items-center justify-center`}>
              {selectedItems.has(i) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

function BatchActionBar({ count, onBatchDownload, onBatchVideo, onCancel }: { count: number; onBatchDownload: () => void; onBatchVideo: () => void; onCancel: () => void }) {
  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-agnes-purple/10 border-b border-agnes-purple/20">
      <span className="text-xs font-medium text-agnes-purple">已选择 {count} 项</span>
      <div className="flex items-center gap-2">
        <button onClick={onBatchDownload} className="px-3 py-1 text-xs rounded-md bg-agnes-purple/20 text-agnes-purple hover:bg-agnes-purple/30 transition-colors">批量下载</button>
        <button onClick={onBatchVideo} className="px-3 py-1 text-xs rounded-md bg-agnes-purple/20 text-agnes-purple hover:bg-agnes-purple/30 transition-colors">批量转视频</button>
        <button onClick={onCancel} className="px-3 py-1 text-xs rounded-md text-agnes-text-muted hover:text-agnes-text-secondary transition-colors">取消选择</button>
      </div>
    </div>
  )
}

function TaskLog({ task }: { task: ReturnType<typeof useTaskStore.getState>['tasks'][0] }) {
  const [open, setOpen] = useState(false)
  const params = task.params as Record<string, unknown>
  const entries = [
    { label: '模型', value: (params.model as string) ?? 'SDXL 1.0' },
    { label: '提示词', value: task.prompt.length > 40 ? task.prompt.slice(0, 40) + '…' : task.prompt },
    { label: 'Seed', value: String(params.seed ?? 42) }, { label: 'Steps', value: String(params.steps ?? 30) },
    { label: 'CFG', value: String(params.cfgScale ?? 7.5) }, { label: '尺寸', value: (params.aspectRatio as string) ?? '16:9' },
  ]
  return (
    <div className="shrink-0 border-t border-agnes-border">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full px-4 py-2 text-xs text-agnes-text-muted hover:text-agnes-text-secondary transition-colors duration-200" aria-expanded={open}>
        <span>任务参数</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
          {entries.map((e) => (
            <div key={e.label} className="flex items-center gap-2 text-xs">
              <span className="text-agnes-text-muted shrink-0">{e.label}</span>
              <span className="text-agnes-text-secondary truncate font-mono">{e.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PreviewArea() {
  const currentMode = useAppStore((s) => s.currentMode)
  const setCurrentMode = useAppStore((s) => s.setCurrentMode)
  const { currentTaskId, tasks, createTask, completeTask, failTask } = useTaskStore()
  const currentTask = tasks.find((t) => t.id === currentTaskId) ?? null
  const [zoom, setZoom] = useState(1)
  const [activeThumb, setActiveThumb] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 3)), [])
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.5)), [])
  const handleToggleFavorite = useCallback(async () => {
    if (!currentTask) return
    const api = (await import('@/utils/api')).default
    const res = await api.toggleFavorite(currentTask.id)
    if (res.error) {
      showToast('error', '收藏操作失败')
    } else {
      setFavorited((f) => !f)
      showToast(favorited ? 'info' : 'success', favorited ? '已取消收藏' : '已收藏')
    }
  }, [currentTask, favorited])
  const handleAction = useCallback(async (label: string) => {
    const api = (await import('@/utils/api')).default
    const getPreviewUrl = () => {
      if (!currentTask) return ''
      const hasResult = currentTask.resultUrls.length > 0
      return hasResult ? currentTask.resultUrls[activeThumb] ?? currentTask.resultUrls[0] : ''
    }

    switch (label) {
      case '下载': {
        const url = getPreviewUrl()
        if (!url) { showToast('error', '无可下载资源'); break }
        const link = document.createElement('a')
        link.href = url
        link.download = ''
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showToast('success', '开始下载')
        break
      }
      case '收藏': {
        if (!currentTask) break
        const res = await api.toggleFavorite(currentTask.id)
        if (res.error) {
          showToast('error', '收藏操作失败')
        } else {
          setFavorited((f) => !f)
          showToast(favorited ? 'info' : 'success', favorited ? '已取消收藏' : '已收藏')
        }
        break
      }
      case '重生成': {
        if (!currentTask) break
        const res = await api.generateImage({ prompt: currentTask.prompt, negativePrompt: currentTask.negativePrompt, params: currentTask.params })
        if (res.error) {
          showToast('error', '重新生成失败')
        } else {
          showToast('success', '已提交重新生成任务')
          const taskId = createTask({ type: 'image', prompt: currentTask.prompt, negativePrompt: currentTask.negativePrompt, params: currentTask.params })
          const serverTaskId = res.data?.id || res.data?.taskId
          if (serverTaskId) {
            const poll = async () => {
              const taskRes = await api.getTask(serverTaskId)
              if (taskRes.data?.status === 'success') {
                completeTask(taskId, taskRes.data.resultUrls || [])
              } else if (taskRes.data?.status === 'failed') {
                failTask(taskId, taskRes.data?.error || '生成失败')
              } else {
                setTimeout(poll, 2000)
              }
            }
            setTimeout(poll, 2000)
          }
        }
        break
      }
      case '编辑': {
        setCurrentMode('image-editor')
        break
      }
      case '转视频': {
        if (!currentTask) break
        const res = await api.generateVideo({ prompt: currentTask.prompt })
        if (res.error) {
          showToast('error', '转视频请求失败')
        } else {
          showToast('success', '已提交转视频任务')
          const taskId = createTask({ type: 'video', prompt: currentTask.prompt, negativePrompt: currentTask.negativePrompt, params: currentTask.params })
          const serverTaskId = res.data?.id || res.data?.taskId
          if (serverTaskId) {
            const poll = async () => {
              const taskRes = await api.getTask(serverTaskId)
              if (taskRes.data?.status === 'success') {
                completeTask(taskId, taskRes.data.resultUrls || [])
              } else if (taskRes.data?.status === 'failed') {
                failTask(taskId, taskRes.data?.error || '生成失败')
              } else {
                setTimeout(poll, 2000)
              }
            }
            setTimeout(poll, 2000)
          }
        }
        break
      }
      default:
        showToast('info', `${label}功能开发中`)
    }
  }, [currentTask, activeThumb, favorited, setCurrentMode, createTask, completeTask, failTask])

  const toggleSelectMode = useCallback(() => {
    setSelectMode((s) => !s)
    setSelectedItems(new Set())
  }, [])
  const toggleSelectItem = useCallback((i: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }, [])
  const cancelSelect = useCallback(() => { setSelectMode(false); setSelectedItems(new Set()) }, [])
  const handleBatchDownload = useCallback(() => {
    if (!currentTask) return
    const urls = currentTask.resultUrls.length > 0
      ? Array.from(selectedItems).map((i) => currentTask.resultUrls[i]).filter(Boolean)
      : []
    if (urls.length === 0) { showToast('error', '无可下载资源'); return }
    urls.forEach((url) => {
      const link = document.createElement('a')
      link.href = url
      link.download = ''
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
    showToast('success', `批量下载 ${urls.length} 项`)
  }, [currentTask, selectedItems])
  const handleBatchVideo = useCallback(async () => {
    if (!currentTask) return
    const api = (await import('@/utils/api')).default
    const indices = Array.from(selectedItems)
    let successCount = 0
    for (const _i of indices) {
      const res = await api.generateVideo({ prompt: currentTask.prompt })
      if (!res.error) successCount++
    }
    showToast(successCount > 0 ? 'success' : 'error', successCount > 0 ? `已提交 ${successCount} 个转视频任务` : '转视频请求失败')
  }, [currentTask, selectedItems])

  useEffect(() => { setZoom(1); setActiveThumb(0); setFavorited(false); setSelectMode(false); setSelectedItems(new Set()) }, [currentTaskId])

  if (currentMode === 'chat' || currentMode === 'tts' || currentMode === 'image-editor') return null

  const toolbar = currentMode === 'batch' ? batchToolbar : currentMode === 'text-to-video' ? videoToolbar : imageToolbar

  if (!currentTask) {
    return (
      <div className="flex-1 flex flex-col bg-agnes-bg min-h-0 relative">
        <ModeBadge mode={currentMode} />
        <EmptyState mode={currentMode} />
      </div>
    )
  }

  const hasResult = currentTask.resultUrls.length > 0
  const previewUrl = hasResult ? currentTask.resultUrls[activeThumb] ?? currentTask.resultUrls[0] : mockAssets[activeThumb % mockAssets.length]?.url ?? ''
  const isVideo = currentTask.type === 'video'

  return (
    <div className="flex-1 flex flex-col bg-agnes-bg min-h-0 relative overflow-hidden">
      <TaskStatusBar task={currentTask} />
      {selectMode && selectedItems.size > 0 && (
        <BatchActionBar count={selectedItems.size} onBatchDownload={handleBatchDownload} onBatchVideo={handleBatchVideo} onCancel={cancelSelect} />
      )}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <ModeBadge mode={currentMode} />
        {currentTask.status === 'running' || currentTask.status === 'queued' ? (
          <ShimmerPlaceholder />
        ) : isVideo ? (
          <VideoPreview url={previewUrl} zoom={zoom} />
        ) : (
          <ImagePreview url={previewUrl} zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
        )}
      </div>
      <ActionToolbar actions={toolbar} favorited={favorited} onToggleFavorite={handleToggleFavorite} onAction={handleAction} selectMode={selectMode} onSelectModeToggle={toggleSelectMode} />
      <VersionThumbnails activeIndex={activeThumb} onSelect={setActiveThumb} selectMode={selectMode} selectedItems={selectedItems} onToggleSelect={toggleSelectItem} />
      <TaskLog task={currentTask} />
    </div>
  )
}
