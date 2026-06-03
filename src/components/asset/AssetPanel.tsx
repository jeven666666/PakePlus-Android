import { useState } from 'react'
import { Heart, Download, RefreshCw, Upload, Clock, Image, Video, FileText, HardDrive, CheckSquare, Square, X, Plus, Pencil, Trash2, Crown, ChevronUp } from 'lucide-react'
import { mockAssets, mockTemplates } from '@/utils/mockData'
import { formatTime, cn } from '@/utils/helpers'
import Chip from '@/components/ui/Chip'
import Progress from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import useAppStore from '@/store/useAppStore'

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

interface TemplateItem {
  id: string
  name: string
  description: string
  type: 'prompt' | 'params' | 'style'
  content: { title: string; prompt: string }
  createdAt: number
}

function AssetCard({ asset, selected, onToggleSelect, batchMode }: { asset: typeof mockAssets[number]; selected?: boolean; onToggleSelect?: (id: string) => void; batchMode?: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={cn(
        "relative group rounded-card overflow-hidden bg-agnes-card hover:bg-agnes-card-hover transition-all duration-200 hover:scale-[1.03] cursor-pointer",
        batchMode && selected && "ring-2 ring-agnes-purple shadow-lg shadow-agnes-purple/30"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {batchMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(asset.id) }}
          className="absolute top-1.5 left-1.5 z-10 p-0.5 rounded-sm bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
        >
          {selected ? <CheckSquare className="w-3.5 h-3.5 text-agnes-purple" /> : <Square className="w-3.5 h-3.5 text-white" />}
        </button>
      )}
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
      {!batchMode && hovered && (
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
          <button
            onClick={() => {
              useAppStore.getState().setCurrentMode('text-to-video')
              showToast('success', '已切换到视频模式')
            }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Video className="w-3.5 h-3.5 text-white" />
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
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [customTemplates, setCustomTemplates] = useState<TemplateItem[]>(mockTemplates as unknown as TemplateItem[])
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [newTplName, setNewTplName] = useState('')
  const [newTplPrompt, setNewTplPrompt] = useState('')
  const [newTplType, setNewTplType] = useState<'prompt' | 'params' | 'style'>('prompt')
  const [showUpgradeCard, setShowUpgradeCard] = useState(false)

  const recentAssets = mockAssets.slice(0, 8)
  const favoriteAssets = mockAssets.filter((a) => a.favorited)
  const materialAssets = mockAssets.slice(6)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBatchAction = (action: string) => {
    const count = selectedIds.size
    switch (action) {
      case 'download':
        showToast('success', `开始下载 ${count} 个文件`)
        break
      case 'video':
        showToast('success', `已将 ${count} 个文件转为视频任务`)
        break
      case 'favorite':
        showToast('success', `已收藏 ${count} 个文件`)
        break
      case 'cancel':
        setSelectedIds(new Set())
        setBatchMode(false)
        break
    }
  }

  const handleAddTemplate = () => {
    if (!newTplName.trim()) { showToast('warning', '请输入模板名称'); return }
    if (customTemplates.length >= 100) { showToast('warning', '已达到模板上限（100个）'); return }
    const newTpl: TemplateItem = {
      id: `tpl_${Date.now()}`,
      name: newTplName,
      description: newTplPrompt.slice(0, 80),
      type: newTplType,
      content: { title: newTplName, prompt: newTplPrompt },
      createdAt: Date.now(),
    }
    setCustomTemplates((prev) => [...prev, newTpl])
    setNewTplName('')
    setNewTplPrompt('')
    setNewTplType('prompt')
    setShowAddTemplate(false)
    showToast('success', '模板已添加')
  }

  const handleDeleteTemplate = (id: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id))
    showToast('success', '模板已删除')
  }

  const handleEditTemplate = (tpl: TemplateItem) => {
    setEditingTemplateId(tpl.id)
    setNewTplName(tpl.name)
    setNewTplPrompt(tpl.content.prompt)
    setNewTplType(tpl.type)
  }

  const handleSaveEdit = () => {
    if (!editingTemplateId || !newTplName.trim()) return
    setCustomTemplates((prev) =>
      prev.map((t) =>
        t.id === editingTemplateId
          ? { ...t, name: newTplName, description: newTplPrompt.slice(0, 80), type: newTplType, content: { title: newTplName, prompt: newTplPrompt } }
          : t
      )
    )
    setEditingTemplateId(null)
    setNewTplName('')
    setNewTplPrompt('')
    setNewTplType('prompt')
    showToast('success', '模板已更新')
  }

  const handleCancelEdit = () => {
    setEditingTemplateId(null)
    setNewTplName('')
    setNewTplPrompt('')
    setNewTplType('prompt')
    setShowAddTemplate(false)
  }

  return (
    <div className="w-[280px] h-full bg-agnes-bg-secondary border-l border-agnes-border flex flex-col overflow-hidden">
      <div className="flex border-b border-agnes-border px-1 pt-1 relative">
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
        <button
          onClick={() => {
            setBatchMode(!batchMode)
            if (batchMode) setSelectedIds(new Set())
          }}
          className={cn(
            "absolute right-1 top-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-all duration-200",
            batchMode
              ? "bg-agnes-purple text-white"
              : "bg-agnes-card text-agnes-text-muted hover:text-agnes-purple border border-agnes-border"
          )}
        >
          {batchMode ? '取消批量' : '批量操作'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 relative">
        {activeTab === 'recent' && (
          <div className="grid grid-cols-2 gap-2">
            {recentAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} batchMode={batchMode} selected={selectedIds.has(asset.id)} onToggleSelect={toggleSelect} />
            ))}
          </div>
        )}

        {activeTab === 'favorites' && (
          favoriteAssets.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {favoriteAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} batchMode={batchMode} selected={selectedIds.has(asset.id)} onToggleSelect={toggleSelect} />
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
                <AssetCard key={asset.id} asset={asset} batchMode={batchMode} selected={selectedIds.has(asset.id)} onToggleSelect={toggleSelect} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => { setShowAddTemplate(!showAddTemplate); setEditingTemplateId(null) }}
              >
                <Plus className="w-3.5 h-3.5" />
                新增模板
              </Button>
              {customTemplates.length >= 99 && (
                <span className="text-[10px] text-agnes-warning">即将达到上限（100）</span>
              )}
            </div>

            {(showAddTemplate || editingTemplateId) && (
              <div className="p-3 rounded-card bg-agnes-card border border-agnes-border space-y-2">
                <input
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  placeholder="模板名称"
                  className="w-full bg-agnes-bg-secondary border border-agnes-border rounded-input px-3 py-1.5 text-xs text-agnes-text-primary placeholder:text-agnes-text-muted focus:outline-none focus:border-agnes-purple/50"
                />
                <textarea
                  value={newTplPrompt}
                  onChange={(e) => setNewTplPrompt(e.target.value)}
                  placeholder="提示词内容..."
                  rows={3}
                  className="w-full bg-agnes-bg-secondary border border-agnes-border rounded-input px-3 py-2 text-xs text-agnes-text-primary placeholder:text-agnes-text-muted resize-none focus:outline-none focus:border-agnes-purple/50"
                />
                <select
                  value={newTplType}
                  onChange={(e) => setNewTplType(e.target.value as 'prompt' | 'params' | 'style')}
                  className="w-full bg-agnes-bg-secondary border border-agnes-border rounded-input px-3 py-1.5 text-xs text-agnes-text-primary focus:outline-none focus:border-agnes-purple/50"
                >
                  <option value="prompt">提示词</option>
                  <option value="params">参数</option>
                  <option value="style">风格</option>
                </select>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" className="flex-1" onClick={editingTemplateId ? handleSaveEdit : handleAddTemplate}>
                    保存
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={handleCancelEdit}>
                    取消
                  </Button>
                </div>
              </div>
            )}

            {customTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="group p-3 rounded-card bg-agnes-card hover:bg-agnes-card-hover transition-all duration-200 cursor-pointer"
              >
                {editingTemplateId === tpl.id ? null : (
                  <>
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
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => showToast('success', `已应用模板「${tpl.name}」`)}
                      >
                        应用
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          useAppStore.getState().setCurrentMode('text-to-video')
                          showToast('success', '已切换到视频模式')
                        }}
                      >
                        <Video className="w-3.5 h-3.5" />
                        转视频
                      </Button>
                      <button
                        onClick={() => handleEditTemplate(tpl)}
                        className="p-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
                      >
                        <Pencil className="w-3 h-3 text-agnes-text-muted" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-1.5 rounded-md bg-white/[0.06] hover:bg-agnes-error/20 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-agnes-text-muted hover:text-agnes-error" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {batchMode && selectedIds.size > 0 && activeTab !== 'templates' && (
          <div className="absolute bottom-3 left-3 right-3 z-20 glass rounded-xl p-3 flex items-center justify-between shadow-lg animate-slide-up">
            <span className="text-xs font-medium text-agnes-text-primary">已选 {selectedIds.size} 项</span>
            <div className="flex gap-1.5">
              <Button variant="primary" size="sm" className="text-[11px]" onClick={() => handleBatchAction('download')}>
                <Download className="w-3 h-3 mr-1" />全部下载
              </Button>
              <Button variant="secondary" size="sm" className="text-[11px]" onClick={() => handleBatchAction('video')}>
                批量转视频
              </Button>
              <Button variant="ghost" size="sm" className="text-[11px]" onClick={() => handleBatchAction('favorite')}>
                收藏全部
              </Button>
              <Button variant="ghost" size="sm" className="text-[11px]" onClick={() => handleBatchAction('cancel')}>
                取消
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-agnes-border p-3 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-agnes-text-secondary">
            <HardDrive className="w-3.5 h-3.5" />
            <span>存储空间</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpgradeCard(!showUpgradeCard)}
              className="text-xs text-agnes-cyan hover:text-agnes-purple transition-colors flex items-center gap-0.5"
            >
              <Crown className="w-3 h-3" />升级会员
            </button>
            <button className="text-xs text-agnes-purple hover:text-agnes-cyan transition-colors">管理</button>
          </div>
        </div>
        <Progress value={0.6} max={3} size="md" />
        <p className="text-[11px] text-agnes-text-muted mt-1.5">0.6 GB / 3 GB</p>

        {showUpgradeCard && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 glass rounded-xl p-3 shadow-xl animate-fade-in z-30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-agnes-text-primary">会员方案</span>
              <button onClick={() => setShowUpgradeCard(false)}><X className="w-3.5 h-3.5 text-agnes-text-muted" /></button>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.03]">
                <span className="text-agnes-text-secondary">免费用户</span>
                <span className="font-medium text-agnes-text-primary">3 GB 存储</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-agnes-purple/10">
                <span className="text-agnes-purple">Pro 会员</span>
                <span className="font-medium text-agnes-purple">50 GB 存储</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.03]">
                <span className="text-agnes-text-secondary">企业版</span>
                <span className="font-medium text-agnes-text-primary">200 GB 存储</span>
              </div>
            </div>
            <Button variant="primary" size="sm" className="w-full mt-2.5 gap-1.5" onClick={() => showToast('info', '升级功能开发中')}>
              <Crown className="w-3.5 h-3.5" />立即升级
            </Button>
          </div>
        )}
        <div className="flex gap-3 mt-1.5">
          <button className="text-[10px] text-agnes-text-muted hover:text-agnes-purple transition-colors">清理缓存</button>
          <button className="text-[10px] text-agnes-text-muted hover:text-agnes-purple transition-colors">查看详情</button>
        </div>
      </div>
    </div>
  )
}
