import { useState } from 'react'
import { Heart, Download, RefreshCw, Upload, Clock, Image, Video, FileText, HardDrive } from 'lucide-react'
import { mockAssets, mockTemplates } from '@/utils/mockData'
import { formatTime, cn } from '@/utils/helpers'
import Chip from '@/components/ui/Chip'
import Progress from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'

type TabKey = 'recent' | 'favorites' | 'materials' | 'templates'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'recent', label: '最近' },
  { key: 'favorites', label: '收藏' },
  { key: 'materials', label: '素材' },
  { key: 'templates', label: '模板' },
]

const templateTypeMap: Record<string, string> = {
  prompt: '提示词',
  params: '参数',
  style: '风格',
}

const templateChipVariant: Record<string, 'purple' | 'cyan' | 'default'> = {
  prompt: 'purple',
  params: 'cyan',
  style: 'default',
}

function AssetCard({ asset }: { asset: typeof mockAssets[number] }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative group rounded-card overflow-hidden bg-agnes-card hover:bg-agnes-card-hover transition-all duration-200 hover:scale-[1.03] cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={asset.thumbnailUrl}
          alt={asset.id}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-black/60 text-white backdrop-blur-sm">
        {asset.type === 'image' ? '图' : '视频'}
      </span>
      {hovered && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 animate-fade-in">
          <button
            onClick={() => showToast('success', asset.favorited ? '已取消收藏' : '已收藏')}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Heart className={cn('w-3.5 h-3.5', asset.favorited ? 'fill-agnes-error text-agnes-error' : 'text-white')} />
          </button>
          <button
            onClick={() => showToast('info', '开始下载')}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={() => showToast('info', '已复用至创作区')}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}
      <div className="px-2 py-1.5 flex items-center gap-1 text-agnes-text-muted">
        <Clock className="w-3 h-3" />
        <span className="text-[11px]">{formatTime(asset.createdAt)}</span>
      </div>
    </div>
  )
}

function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-agnes-text-muted">
      <Heart className="w-10 h-10 mb-3 opacity-30" />
      <p className="text-sm font-medium text-agnes-text-secondary">暂无收藏</p>
      <p className="text-xs mt-1">生成作品后可收藏</p>
    </div>
  )
}

export default function AssetPanel() {
  const [activeTab, setActiveTab] = useState<TabKey>('recent')

  const recentAssets = mockAssets.slice(0, 8)
  const favoriteAssets = mockAssets.filter((a) => a.favorited)
  const materialAssets = mockAssets.slice(6)

  return (
    <div className="w-[280px] h-full bg-agnes-bg-secondary border-l border-agnes-border flex flex-col overflow-hidden">
      <div className="flex border-b border-agnes-border px-1 pt-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 py-2.5 text-xs font-medium transition-all duration-200 relative',
              activeTab === tab.key
                ? 'text-agnes-purple'
                : 'text-agnes-text-muted hover:text-agnes-text-secondary'
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full gradient-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'recent' && (
          <div className="grid grid-cols-2 gap-2">
            {recentAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}

        {activeTab === 'favorites' && (
          favoriteAssets.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {favoriteAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          ) : (
            <EmptyFavorites />
          )
        )}

        {activeTab === 'materials' && (
          <div>
            <Button variant="secondary" size="sm" className="w-full mb-3 gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              上传素材
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {materialAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="flex flex-col gap-2">
            {mockTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="group p-3 rounded-card bg-agnes-card hover:bg-agnes-card-hover transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-agnes-purple shrink-0" />
                      <span className="text-sm font-medium text-agnes-text-primary truncate">{tpl.name}</span>
                    </div>
                    <p className="text-xs text-agnes-text-muted line-clamp-2 leading-relaxed">{tpl.description}</p>
                  </div>
                  <Chip variant={templateChipVariant[tpl.type]} className="shrink-0">
                    {templateTypeMap[tpl.type]}
                  </Chip>
                </div>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => showToast('success', `已应用模板「${tpl.name}」`)}
                  >
                    应用
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-agnes-border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-agnes-text-secondary">
            <HardDrive className="w-3.5 h-3.5" />
            <span>存储空间</span>
          </div>
          <button className="text-xs text-agnes-purple hover:text-agnes-cyan transition-colors">管理</button>
        </div>
        <Progress value={2.4} max={10} size="md" />
        <p className="text-[11px] text-agnes-text-muted mt-1.5">2.4 GB / 10 GB</p>
      </div>
    </div>
  )
}
