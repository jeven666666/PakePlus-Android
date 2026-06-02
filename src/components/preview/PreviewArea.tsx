import { useState, useEffect, useCallback } from 'react'
import useTaskStore from '@/store/useTaskStore'
import useAppStore from '@/store/useAppStore'
import {
  Sparkles,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Columns2,
  RefreshCw,
  Pencil,
  Copy,
  Heart,
  Download,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
} from 'lucide-react'
import Chip from '@/components/ui/Chip'
import Progress from '@/components/ui/Progress'
import { getStatusLabel, getStatusColor, formatDuration } from '@/utils/helpers'
import { showToast } from '@/components/ui/Toast'
import { mockAssets } from '@/utils/mockData'

const toolbarActions = [
  { icon: ZoomIn, label: '放大' },
  { icon: Columns2, label: '对比' },
  { icon: RefreshCw, label: '重生成' },
  { icon: Pencil, label: '编辑' },
  { icon: Copy, label: '变体' },
  { icon: Heart, label: '收藏' },
  { icon: Download, label: '下载' },
  { icon: MoreHorizontal, label: '更多' },
]

const mockThumbnails = mockAssets.slice(0, 4)

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0 animate-shimmer"
          style={{
            background:
              'radial-gradient(ellipse at 50% 40%, rgba(124,92,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(0,212,255,0.1) 0%, transparent 50%)',
          }}
        />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full flex items-center justify-center gradient-primary opacity-80 glow-purple">
          <Sparkles className="w-16 h-16 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-agnes-text-primary">开始你的创作</h2>
        <p className="text-sm text-agnes-text-muted">输入提示词，调整参数，点击生成</p>
      </div>
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

  const chipVariant =
    task.status === 'success' ? 'success' :
    task.status === 'failed' ? 'error' :
    task.status === 'running' ? 'purple' :
    task.status === 'queued' ? 'warning' : 'default'

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-agnes-border bg-agnes-bg-secondary/60">
      <span className="text-xs font-mono text-agnes-text-muted">{task.id}</span>
      <Chip variant={chipVariant}>{getStatusLabel(task.status)}</Chip>
      <span className="text-xs text-agnes-text-muted">{formatDuration(elapsed)}</span>
      {(task.status === 'running' || task.status === 'queued') && (
        <div className="flex-1 max-w-[200px]">
          <Progress value={task.progress} showLabel size="sm" />
        </div>
      )}
    </div>
  )
}

function ImagePreview({ url, zoom, onZoomIn, onZoomOut }: { url: string; zoom: number; onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden relative group">
      <img
        src={url}
        alt="生成结果"
        className="max-w-full max-h-full object-contain transition-transform duration-300"
        style={{ transform: `scale(${zoom})` }}
      />
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={onZoomIn}
          className="w-8 h-8 rounded-lg bg-agnes-card/80 glass flex items-center justify-center hover:bg-agnes-card-hover transition-colors duration-200"
          aria-label="放大"
        >
          <ZoomIn className="w-4 h-4 text-agnes-text-secondary" />
        </button>
        <button
          onClick={onZoomOut}
          className="w-8 h-8 rounded-lg bg-agnes-card/80 glass flex items-center justify-center hover:bg-agnes-card-hover transition-colors duration-200"
          aria-label="缩小"
        >
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
    <div className="flex-1 flex items-center justify-center overflow-hidden relative group">
      <div
        className="relative w-full max-w-[90%] aspect-video rounded-card overflow-hidden bg-agnes-card"
        style={{ transform: `scale(${zoom})` }}
      >
        <img
          src={url}
          alt="视频预览"
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => setPlaying(!playing)}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors duration-200 hover:bg-black/30"
          aria-label={playing ? '暂停' : '播放'}
        >
          {playing ? (
            <Pause className="w-14 h-14 text-white/90 drop-shadow-lg" />
          ) : (
            <Play className="w-14 h-14 text-white/90 drop-shadow-lg" />
          )}
        </button>
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
          <button onClick={() => setMuted(!muted)} className="shrink-0" aria-label={muted ? '取消静音' : '静音'}>
            {muted ? (
              <VolumeX className="w-4 h-4 text-white/80" />
            ) : (
              <Volume2 className="w-4 h-4 text-white/80" />
            )}
          </button>
          <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-white/60">0:00</span>
        </div>
      </div>
    </div>
  )
}

function ShimmerPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-lg aspect-square rounded-card animate-shimmer" />
    </div>
  )
}

function ActionToolbar({ favorited, onToggleFavorite, onAction }: {
  favorited: boolean
  onToggleFavorite: () => void
  onAction: (label: string) => void
}) {
  return (
    <div className="flex items-center justify-center gap-1 px-4 py-2 border-t border-agnes-border">
      {toolbarActions.map((action) => {
        const isFavorite = action.icon === Heart
        const Icon = action.icon
        return (
          <button
            key={action.label}
            onClick={() => isFavorite ? onToggleFavorite() : onAction(action.label)}
            className="relative group/btn w-9 h-9 rounded-btn flex items-center justify-center text-agnes-text-muted hover:text-agnes-text-primary hover:bg-white/5 transition-all duration-200"
            aria-label={action.label}
          >
            {isFavorite && favorited ? (
              <Heart className="w-[18px] h-[18px] text-agnes-error fill-agnes-error" />
            ) : (
              <Icon className="w-[18px] h-[18px]" />
            )}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] whitespace-nowrap bg-agnes-card text-agnes-text-secondary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none border border-agnes-border">
              {action.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function VersionThumbnails({ activeIndex, onSelect }: { activeIndex: number; onSelect: (i: number) => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto border-t border-agnes-border">
      {mockThumbnails.map((thumb, i) => (
        <button
          key={thumb.id}
          onClick={() => onSelect(i)}
          className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
            i === activeIndex
              ? 'border-agnes-purple glow-purple'
              : 'border-transparent hover:border-agnes-border-hover'
          }`}
          aria-label={`版本 ${i + 1}`}
        >
          <img src={thumb.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  )
}

function TaskLog({ task }: { task: ReturnType<typeof useTaskStore.getState>['tasks'][0] }) {
  const [open, setOpen] = useState(false)
  const params = task.params as Record<string, unknown>

  const entries = [
    { label: '模型', value: (params.model as string) ?? 'SDXL 1.0' },
    { label: '提示词', value: task.prompt.length > 40 ? task.prompt.slice(0, 40) + '…' : task.prompt },
    { label: 'Seed', value: String(params.seed ?? 42) },
    { label: 'Steps', value: String(params.steps ?? 30) },
    { label: 'CFG', value: String(params.cfgScale ?? 7.5) },
    { label: '尺寸', value: (params.aspectRatio as string) ?? '16:9' },
  ]

  return (
    <div className="border-t border-agnes-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-2 text-xs text-agnes-text-muted hover:text-agnes-text-secondary transition-colors duration-200"
        aria-expanded={open}
      >
        <span>任务参数</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
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
  const { currentTaskId, tasks } = useTaskStore()
  const currentTask = tasks.find((t) => t.id === currentTaskId) ?? null
  const [zoom, setZoom] = useState(1)
  const [activeThumb, setActiveThumb] = useState(0)
  const [favorited, setFavorited] = useState(false)

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 3)), [])
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.5)), [])
  const handleToggleFavorite = useCallback(() => {
    setFavorited((f) => !f)
    showToast(favorited ? 'info' : 'success', favorited ? '已取消收藏' : '已收藏')
  }, [favorited])
  const handleAction = useCallback((label: string) => {
    showToast('info', `${label}功能开发中`)
  }, [])

  useEffect(() => {
    setZoom(1)
    setActiveThumb(0)
    setFavorited(false)
  }, [currentTaskId])

  if (!currentTask) {
    return (
      <div className="flex-1 flex flex-col bg-agnes-bg min-h-0">
        <EmptyState />
      </div>
    )
  }

  const hasResult = currentTask.resultUrls.length > 0
  const previewUrl = hasResult
    ? currentTask.resultUrls[activeThumb] ?? currentTask.resultUrls[0]
    : mockAssets[activeThumb % mockAssets.length]?.url ?? ''
  const isVideo = currentTask.type === 'video'

  return (
    <div className="flex-1 flex flex-col bg-agnes-bg min-h-0">
      <TaskStatusBar task={currentTask} />

      {currentTask.status === 'running' || currentTask.status === 'queued' ? (
        <ShimmerPlaceholder />
      ) : isVideo ? (
        <VideoPreview url={previewUrl} zoom={zoom} />
      ) : (
        <ImagePreview url={previewUrl} zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      )}

      <ActionToolbar favorited={favorited} onToggleFavorite={handleToggleFavorite} onAction={handleAction} />
      <VersionThumbnails activeIndex={activeThumb} onSelect={setActiveThumb} />
      <TaskLog task={currentTask} />
    </div>
  )
}
