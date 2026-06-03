import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Download, RefreshCw, Upload, Clock, Image, Video, FileText, HardDrive, CheckSquare, Square, X, Plus, Pencil, Trash2, Crown, ChevronUp } from 'lucide-react'
import { api } from '@/utils/api'
import { useAuthStore } from '@/store/useAuthStore'
import useTaskStore from '@/store/useTaskStore'
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

interface AssetItem {
  id: string
  userId: string
  type: string
  fileUrl: string
  thumbnailUrl: string
  taskId: string
  prompt: string
  params: Record<string, unknown>
  favorited: boolean
  fileSize: number
  createdAt: number
}

interface TemplateItem {
  id: string
  userId: string
  name: string
  description: string
  type: 'prompt' | 'params' | 'style'
  content: { title: string; prompt: string }
  createdAt: number
}

function AssetCard({ asset, selected, onToggleSelect, batchMode, onFavorite, onDownload, onReuse, onVideo }: {
  asset: AssetItem
  selected?: boolean
  onToggleSelect?: (id: string) => void
  batchMode?: boolean
  onFavorite: (asset: AssetItem) => void
  onDownload: (asset: AssetItem) => void
  onReuse: (asset: AssetItem) => void
  onVideo: (asset: AssetItem) => void
}) {
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
            onClick={() => onFavorite(asset)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Heart className={cn('w-3.5 h-3.5', asset.favorited ? 'fill-agnes-error text-agnes-error' : 'text-white')} />
          </button>
          <button
            onClick={() => onDownload(asset)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={() => onReuse(asset)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={() => onVideo(asset)}
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
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const createTask = useTaskStore((s) => s.createTask)

  const [activeTab, setActiveTab] = useState<TabKey>('recent')
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<TemplateItem[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [newTplName, setNewTplName] = useState('')
  const [newTplPrompt, setNewTplPrompt] = useState('')
  const [newTplType, setNewTplType] = useState<'prompt' | 'params' | 'style'>('prompt')
  const [showUpgradeCard, setShowUpgradeCard] = useState(false)
  const [showManagePanel, setShowManagePanel] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [storageUsed, setStorageUsed] = useState(0)
  const [storageLimit, setStorageLimit] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load assets on mount
  const loadAssets = useCallback(async () => {
    setAssetsLoading(true)
    try {
      const res = await api.getAssets()
      if (res.data) {
        setAssets(res.data)
      } else {
        showToast('error', res.error || '加载资产失败')
      }
    } catch {
      showToast('error', '加载资产失败')
    } finally {
      setAssetsLoading(false)
    }
  }, [])

  // Load templates on mount
  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    try {
      const res = await api.getTemplates()
      if (res.data) {
        setCustomTemplates(res.data)
      } else {
        showToast('error', res.error || '加载模板失败')
      }
    } catch {
      showToast('error', '加载模板失败')
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  // Load storage info
  const loadStorage = useCallback(async () => {
    try {
      const res = await api.getStorage()
      if (res.data) {
        setStorageUsed(res.data.used ?? 0)
        setStorageLimit(res.data.limit ?? 1)
      }
    } catch {
      // silently fail for storage
    }
  }, [])

  useEffect(() => {
    loadAssets()
    loadTemplates()
    loadStorage()
  }, [loadAssets, loadTemplates, loadStorage])

  // Derive filtered lists from loaded assets
  const recentAssets = assets.slice(0, 8)
  const favoriteAssets = assets.filter((a) => a.favorited)
  const materialAssets = assets.slice(6)

  // Use auth store user data for storage if available
  const displayStorageUsed = user?.storageUsed ?? storageUsed
  const displayStorageLimit = user?.storageLimit ?? storageLimit

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // AssetCard action handlers
  const handleFavorite = async (asset: AssetItem) => {
    try {
      const res = await api.toggleFavorite(asset.id)
      if (res.data) {
        setAssets((prev) =>
          prev.map((a) => a.id === asset.id ? { ...a, favorited: !a.favorited } : a)
        )
        showToast('success', asset.favorited ? '已取消收藏' : '已收藏')
      } else {
        showToast('error', res.error || '操作失败')
      }
    } catch {
      showToast('error', '收藏操作失败')
    }
  }

  const handleDownload = (asset: AssetItem) => {
    if (asset.fileUrl) {
      window.open(asset.fileUrl, '_blank')
      showToast('info', '开始下载')
    } else {
      showToast('error', '文件地址不可用')
    }
  }

  const handleReuse = (asset: AssetItem) => {
    const prompt = asset.prompt || ''
    if (prompt) {
      createTask({
        type: asset.type === 'video' ? 'video' : 'image',
        prompt,
        negativePrompt: '',
        params: asset.params || {},
      })
      showToast('success', '已复用至创作区')
    } else {
      showToast('warning', '该资产无提示词信息')
    }
  }

  const handleVideo = async (asset: AssetItem) => {
    try {
      const res = await api.generateVideo({
        prompt: asset.prompt || '',
        params: asset.params,
      })
      if (res.data) {
        createTask({
          type: 'video',
          prompt: asset.prompt || '',
          negativePrompt: '',
          params: asset.params || {},
        })
        useAppStore.getState().setCurrentMode('text-to-video')
        showToast('success', '视频生成任务已创建')
      } else {
        showToast('error', res.error || '视频生成失败')
      }
    } catch {
      showToast('error', '视频生成请求失败')
    }
  }

  const handleBatchAction = async (action: string) => {
    const count = selectedIds.size
    if (count === 0) return

    switch (action) {
      case 'download': {
        const selectedAssets = assets.filter((a) => selectedIds.has(a.id))
        selectedAssets.forEach((a) => {
          if (a.fileUrl) window.open(a.fileUrl, '_blank')
        })
        showToast('success', `开始下载 ${count} 个文件`)
        break
      }
      case 'video': {
        const selectedAssets = assets.filter((a) => selectedIds.has(a.id))
        let successCount = 0
        for (const a of selectedAssets) {
          try {
            const res = await api.generateVideo({ prompt: a.prompt || '', params: a.params })
            if (res.data) successCount++
          } catch { /* skip failed */ }
        }
        showToast('success', `已将 ${successCount} 个文件转为视频任务`)
        break
      }
      case 'favorite': {
        const selectedAssets = assets.filter((a) => selectedIds.has(a.id))
        let favCount = 0
        for (const a of selectedAssets) {
          try {
            const res = await api.toggleFavorite(a.id)
            if (res.data) {
              favCount++
              setAssets((prev) =>
                prev.map((item) => item.id === a.id ? { ...item, favorited: !item.favorited } : item)
              )
            }
          } catch { /* skip failed */ }
        }
        showToast('success', `已收藏 ${favCount} 个文件`)
        break
      }
      case 'cancel':
        setSelectedIds(new Set())
        setBatchMode(false)
        break
    }
  }

  const handleAddTemplate = async () => {
    if (!newTplName.trim()) { showToast('warning', '请输入模板名称'); return }
    if (customTemplates.length >= 100) { showToast('warning', '已达到模板上限（100个）'); return }
    try {
      const res = await api.createTemplate({
        name: newTplName,
        description: newTplPrompt.slice(0, 80),
        type: newTplType,
        content: { title: newTplName, prompt: newTplPrompt },
      })
      if (res.data) {
        setCustomTemplates((prev) => [...prev, res.data])
        setNewTplName('')
        setNewTplPrompt('')
        setNewTplType('prompt')
        setShowAddTemplate(false)
        showToast('success', '模板已添加')
      } else {
        showToast('error', res.error || '添加模板失败')
      }
    } catch {
      showToast('error', '添加模板请求失败')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await api.deleteTemplate(id)
      if (res.data || !res.error) {
        setCustomTemplates((prev) => prev.filter((t) => t.id !== id))
        showToast('success', '模板已删除')
      } else {
        showToast('error', res.error || '删除模板失败')
      }
    } catch {
      showToast('error', '删除模板请求失败')
    }
  }

  const handleEditTemplate = (tpl: TemplateItem) => {
    setEditingTemplateId(tpl.id)
    setNewTplName(tpl.name)
    setNewTplPrompt(tpl.content.prompt)
    setNewTplType(tpl.type)
  }

  const handleSaveEdit = async () => {
    if (!editingTemplateId || !newTplName.trim()) return
    try {
      const res = await api.updateTemplate(editingTemplateId, {
        name: newTplName,
        description: newTplPrompt.slice(0, 80),
        type: newTplType,
        content: { title: newTplName, prompt: newTplPrompt },
      })
      if (res.data || !res.error) {
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
      } else {
        showToast('error', res.error || '更新模板失败')
      }
    } catch {
      showToast('error', '更新模板请求失败')
    }
  }

  const handleCancelEdit = () => {
    setEditingTemplateId(null)
    setNewTplName('')
    setNewTplPrompt('')
    setNewTplType('prompt')
    setShowAddTemplate(false)
  }

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      try {
        const res = await api.uploadFile(file)
        if (res.data || !res.error) {
          showToast('success', `已上传: ${file.name}`)
        } else {
          showToast('error', res.error || `上传失败: ${file.name}`)
        }
      } catch {
        showToast('error', `上传失败: ${file.name}`)
      }
    }
    // Reload assets after upload
    loadAssets()
    loadStorage()
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClearData = async () => {
    setShowClearConfirm(false)
    try {
      const allIds = assets.map((a) => a.id)
      if (allIds.length === 0) {
        showToast('info', '没有数据需要清空')
        return
      }
      const res = await api.batchDeleteAssets(allIds)
      if (res.data || !res.error) {
        setAssets([])
        setSelectedIds(new Set())
        showToast('success', '缓存数据已清空')
        loadStorage()
      } else {
        showToast('error', res.error || '清空数据失败')
      }
    } catch {
      showToast('error', '清空数据请求失败')
    }
  }

  const storageRatio = displayStorageLimit > 0 ? displayStorageUsed / displayStorageLimit : 0
  const storageUsedGB = (displayStorageUsed / (1024 * 1024 * 1024)).toFixed(1)
  const storageLimitGB = (displayStorageLimit / (1024 * 1024 * 1024)).toFixed(0)

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
        {assetsLoading && assets.length === 0 && (
          <div className="flex items-center justify-center py-12 text-agnes-text-muted text-xs">加载中...</div>
        )}

        {activeTab === 'recent' && (
          <div className="grid grid-cols-2 gap-2">
            {recentAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} batchMode={batchMode} selected={selectedIds.has(asset.id)} onToggleSelect={toggleSelect} onFavorite={handleFavorite} onDownload={handleDownload} onReuse={handleReuse} onVideo={handleVideo} />
            ))}
          </div>
        )}

        {activeTab === 'favorites' && (
          favoriteAssets.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {favoriteAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} batchMode={batchMode} selected={selectedIds.has(asset.id)} onToggleSelect={toggleSelect} onFavorite={handleFavorite} onDownload={handleDownload} onReuse={handleReuse} onVideo={handleVideo} />
              ))}
            </div>
          ) : (
            <EmptyFavorites />
          )
        )}

        {activeTab === 'materials' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/*,video/*"
              onChange={handleUploadFile}
            />
            <Button variant="secondary" size="sm" className="w-full mb-3 gap-1.5" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-3.5 h-3.5" />
              上传素材
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {materialAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} batchMode={batchMode} selected={selectedIds.has(asset.id)} onToggleSelect={toggleSelect} onFavorite={handleFavorite} onDownload={handleDownload} onReuse={handleReuse} onVideo={handleVideo} />
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

            {templatesLoading && customTemplates.length === 0 && (
              <div className="text-xs text-agnes-text-muted text-center py-6">加载中...</div>
            )}

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
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2 flex-wrap">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const templateData: Record<string, any> = {}
                          if (tpl.type === 'prompt') {
                            templateData.prompt = (tpl.content as any)?.prompt || ''
                            templateData.negativePrompt = (tpl.content as any)?.negativePrompt || ''
                          } else if (tpl.type === 'params') {
                            templateData.params = tpl.content
                          } else if (tpl.type === 'style') {
                            templateData.style = (tpl.content as any)?.style || ''
                            templateData.params = { creativity: (tpl.content as any)?.creativity, detail: (tpl.content as any)?.detail }
                          }
                          useAppStore.getState().applyTemplate(templateData)
                          showToast('success', `已应用模板「${tpl.name}」`)
                        }}
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
            <span className="text-xs font-medium text-agnes-text-primary shrink-0">已选 {selectedIds.size} 项</span>
            <div className="flex gap-1.5 flex-wrap justify-end">
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
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/membership')}
              className="text-xs text-agnes-cyan hover:text-agnes-purple transition-colors flex items-center gap-0.5"
            >
              <Crown className="w-3 h-3" />升级会员
            </button>
            <button onClick={() => setShowManagePanel(!showManagePanel)} className="text-xs text-agnes-purple hover:text-agnes-cyan transition-colors">管理</button>
          </div>
        </div>
        <Progress value={storageRatio} max={1} size="md" />
        <p className="text-[11px] text-agnes-text-muted mt-1.5">{storageUsedGB} GB / {storageLimitGB} GB</p>

        {showUpgradeCard && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 glass rounded-xl p-3 shadow-xl animate-fade-in z-30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-agnes-text-primary">会员方案</span>
              <button onClick={() => setShowUpgradeCard(false)}><X className="w-3.5 h-3.5 text-agnes-text-muted" /></button>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.03]">
                <span className="text-agnes-text-secondary">免费用户</span>
                <span className="font-medium text-agnes-text-primary">1 GB 存储</span>
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
            <Button variant="primary" size="sm" className="w-full mt-2.5 gap-1.5" onClick={() => navigate('/membership')}>
              <Crown className="w-3.5 h-3.5" />立即升级
            </Button>
          </div>
        )}
        {showManagePanel && (
          <div className="mt-3 p-3 rounded-card bg-agnes-card border border-agnes-border space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-agnes-text-secondary">存储使用详情</span>
                <span className="text-agnes-text-muted">{storageUsedGB} GB / {storageLimitGB} GB</span>
              </div>
              <Progress value={storageRatio} max={1} size="sm" />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1 text-[11px]" onClick={() => showToast('info', '数据迁移功能即将上线，敬请期待')}>
                迁移数据
              </Button>
              <Button variant="secondary" size="sm" className="flex-1 text-[11px]" onClick={() => setShowClearConfirm(true)}>
                清空数据
              </Button>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-agnes-text-secondary">升级空间</p>
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={() => navigate('/membership')} className="py-1.5 px-2 rounded-lg bg-white/[0.04] hover:bg-agnes-purple/10 border border-agnes-border text-[10px] text-agnes-text-primary transition-colors">
                  10 GB
                  <span className="block text-agnes-text-muted">¥19.9/月</span>
                </button>
                <button onClick={() => navigate('/membership')} className="py-1.5 px-2 rounded-lg bg-white/[0.04] hover:bg-agnes-purple/10 border border-agnes-border text-[10px] text-agnes-text-primary transition-colors">
                  20 GB
                  <span className="block text-agnes-text-muted">¥29.9/月</span>
                </button>
                <button onClick={() => navigate('/membership')} className="py-1.5 px-2 rounded-lg bg-white/[0.04] hover:bg-agnes-purple/10 border border-agnes-border text-[10px] text-agnes-text-primary transition-colors">
                  50 GB
                  <span className="block text-agnes-text-muted">¥49.9/月</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-agnes-card border border-agnes-border rounded-xl p-5 w-[320px] shadow-xl animate-fade-in">
              <p className="text-sm text-agnes-text-primary mb-5">确定要清空所有本地缓存数据吗？此操作不可恢复</p>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" size="sm" onClick={() => setShowClearConfirm(false)}>取消</Button>
                <Button variant="danger" size="sm" onClick={handleClearData}>确认</Button>
              </div>
            </div>
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
