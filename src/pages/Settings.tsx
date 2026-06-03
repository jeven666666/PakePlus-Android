import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Star, Edit2, Trash2, TestTube, Shield, User, Palette, Globe, Check, X, Camera, Coins, Crown, Copy, Gift, Link as LinkIcon, Ticket, Save, Eye, EyeOff } from 'lucide-react'
import useModelStore from '@/store/useModelStore'
import type { ModelConfig } from '@/store/useModelStore'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Slider from '@/components/ui/Slider'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import Drawer from '@/components/ui/Drawer'
import { showToast } from '@/components/ui/Toast'
import { cn } from '@/utils/helpers'

const TABS = ['模型配置', 'API 管理', '账户信息', '偏好设置'] as const
type TabKey = typeof TABS[number]
const MODEL_TYPE_OPTIONS = [{ value: 'chat', label: '对话' }, { value: 'image', label: '图像' }, { value: 'video', label: '视频' }, { value: 'multimodal', label: '多模态' }]
const CAPABILITY_OPTIONS = [{ key: 'text', label: '文本' }, { key: 'image', label: '图片' }, { key: 'video', label: '视频' }, { key: 'tool-calling', label: '工具调用' }, { key: 'long-context', label: '长上下文' }]
const TYPE_CHIP_VARIANT: Record<string, 'purple' | 'cyan' | 'warning' | 'success'> = { chat: 'purple', image: 'cyan', video: 'warning', multimodal: 'success' }
const emptyModel: Omit<ModelConfig, 'id'> = { name: '', alias: '', provider: '', apiBaseUrl: '', apiKey: '', modelType: 'chat', contextLength: 8192, maxOutputLength: 4096, capabilities: ['text'], temperature: 0.7, topP: 0.9, enabled: true, isDefault: false, remark: '' }
const inputCls = "w-full h-10 px-3 text-sm rounded-input bg-agnes-bg-secondary border border-agnes-border text-agnes-text-primary placeholder:text-agnes-text-muted focus:outline-none focus:border-agnes-purple/50 transition-colors"
const drawerInputCls = "w-full h-9 px-3 text-sm rounded-input bg-agnes-bg-secondary border border-agnes-border text-agnes-text-primary focus:outline-none focus:border-agnes-purple/50"

export default function Settings() {
  const { models, addModel, updateModel, deleteModel, setDefaultModel, testConnectivity } = useModelStore()
  const [activeTab, setActiveTab] = useState<TabKey>('模型配置')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null)
  const [formData, setFormData] = useState<Omit<ModelConfig, 'id'>>(emptyModel)
  const [deleteTarget, setDeleteTarget] = useState<ModelConfig | null>(null)
  const [testing, setTesting] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [apiAuthorized, setApiAuthorized] = useState(false)
  const [ttsBaseUrl, setTtsBaseUrl] = useState('https://api.xiaomimimo.com/v1')
  const [ttsApiKey, setTtsApiKey] = useState('')
  const [ttsShowKey, setTtsShowKey] = useState(false)
  const [ttsConnected, setTtsConnected] = useState(false)
  const [ttsTesting, setTtsTesting] = useState(false)
  const [displayName, setDisplayName] = useState('Agnes 用户')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('Agnes 用户')
  const [signature, setSignature] = useState('')
  const [avatarHover, setAvatarHover] = useState(false)
  const [redeemCode, setRedeemCode] = useState('')

  const openAdd = () => { setEditingModel(null); setFormData(emptyModel); setDrawerOpen(true) }
  const openEdit = (m: ModelConfig) => { setEditingModel(m); const rest = { ...m }; delete (rest as Partial<ModelConfig>).id; setFormData(rest as Omit<ModelConfig, 'id'>); setDrawerOpen(true) }
  const handleSave = () => { if (editingModel) { updateModel(editingModel.id, formData); showToast('success', '模型已更新') } else { addModel(formData); showToast('success', '模型已添加') }; setDrawerOpen(false) }
  const handleDelete = () => { if (deleteTarget) { deleteModel(deleteTarget.id); showToast('success', '模型已删除'); setDeleteTarget(null) } }
  const handleTest = async (id: string) => { setTesting(true); try { const ok = await testConnectivity(id); showToast(ok ? 'success' : 'error', ok ? '连通性测试通过' : '连通性测试失败') } catch { showToast('error', '连通性测试异常') }; setTesting(false) }
  const handleDrawerTest = async () => { if (editingModel) await handleTest(editingModel.id) }
  const toggleCapability = (key: string) => setFormData((p) => ({ ...p, capabilities: p.capabilities.includes(key) ? p.capabilities.filter((c) => c !== key) : [...p.capabilities, key] }))
  const setField = <K extends keyof Omit<ModelConfig, 'id'>>(key: K, value: ModelConfig[K]) => setFormData((p) => ({ ...p, [key]: value }))
  const handleTtsTest = async () => { setTtsTesting(true); await new Promise((r) => setTimeout(r, 1500)); const ok = !!ttsApiKey; setTtsConnected(ok); setTtsTesting(false); showToast(ok ? 'success' : 'error', ok ? 'TTS 连接成功' : 'TTS 连接失败') }
  const handleSaveName = () => { setDisplayName(nameInput); setEditingName(false); showToast('success', '昵称已保存') }
  const handleCopy = (text: string, label: string) => { navigator.clipboard.writeText(text); showToast('success', `${label}已复制`) }
  const handleRedeem = () => { if (!redeemCode.trim()) { showToast('error', '请输入兑换码'); return }; showToast('success', '兑换成功'); setRedeemCode('') }

  return (
    <div className="h-full bg-agnes-bg overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-2">
          <Link to="/" className="p-2 rounded-lg hover:bg-white/5 transition-colors" aria-label="返回"><ArrowLeft className="w-5 h-5 text-agnes-text-secondary" /></Link>
          <h1 className="text-2xl font-semibold gradient-text">设置</h1>
        </div>
        <p className="text-sm text-agnes-text-muted mb-8 ml-12">管理模型配置、API 密钥和账户偏好</p>

        <div className="flex gap-1 p-1 mb-8 rounded-xl bg-agnes-bg-secondary border border-agnes-border">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn('flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200', activeTab === tab ? 'gradient-primary text-white shadow-[0_0_12px_rgba(124,92,255,0.3)]' : 'text-agnes-text-secondary hover:text-agnes-text-primary hover:bg-white/5')}>{tab}</button>
          ))}
        </div>

        {activeTab === '模型配置' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-agnes-text-muted">{models.length} 个模型</span>
              <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" />新增模型</Button>
            </div>
            <div className="space-y-3">
              {models.map((m) => (
                <div key={m.id} className="flex items-center gap-4 p-4 rounded-card bg-agnes-card border border-agnes-border hover:bg-agnes-card-hover hover:border-agnes-border-hover transition-all duration-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-agnes-text-primary truncate">{m.name}</span>
                      <Chip variant={TYPE_CHIP_VARIANT[m.modelType] ?? 'default'}>{m.modelType}</Chip>
                      {m.isDefault && <Star className="w-3.5 h-3.5 text-agnes-warning fill-agnes-warning" />}
                    </div>
                    <span className="text-xs text-agnes-text-muted">{m.provider} · {m.apiBaseUrl}</span>
                  </div>
                  <button onClick={() => !m.isDefault && setDefaultModel(m.id)} className={cn('relative w-10 h-5 rounded-full transition-colors duration-200', m.enabled ? 'bg-agnes-purple' : 'bg-agnes-border')} aria-label={m.enabled ? '禁用模型' : '启用模型'}>
                    <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200', m.enabled ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleTest(m.id)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" aria-label="连通性测试"><TestTube className="w-4 h-4 text-agnes-cyan" /></button>
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" aria-label="编辑"><Edit2 className="w-4 h-4 text-agnes-text-muted" /></button>
                    <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" aria-label="删除"><Trash2 className="w-4 h-4 text-agnes-error" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'API 管理' && (
          <div className="animate-fade-in space-y-6">
            <div className="p-6 rounded-card bg-agnes-card border border-agnes-border">
              <div className="flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-agnes-purple" /><h3 className="text-base font-medium text-agnes-text-primary">API 密钥</h3></div>
              <div className="space-y-3">
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="输入 API Key" className={inputCls} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', apiAuthorized ? 'bg-agnes-success' : 'bg-agnes-text-muted')} />
                    <span className="text-xs text-agnes-text-secondary">{apiAuthorized ? '已授权' : '未授权'}</span>
                  </div>
                  <Button size="sm" onClick={() => { setApiAuthorized(!!apiKey); showToast(apiKey ? 'success' : 'error', apiKey ? 'API Key 验证成功' : '请输入 API Key') }}><TestTube className="w-4 h-4" />验证</Button>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-card bg-agnes-card border border-agnes-border">
              <div className="flex items-center gap-2 mb-4"><Globe className="w-5 h-5 text-agnes-cyan" /><h3 className="text-base font-medium text-agnes-text-primary">TTS API 配置</h3></div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-agnes-text-secondary">TTS API Base URL</label>
                  <input value={ttsBaseUrl} onChange={(e) => setTtsBaseUrl(e.target.value)} placeholder="https://api.xiaomimimo.com/v1" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-agnes-text-secondary">TTS API Key</label>
                  <div className="relative">
                    <input type={ttsShowKey ? 'text' : 'password'} value={ttsApiKey} onChange={(e) => setTtsApiKey(e.target.value)} placeholder="输入 TTS API Key" className={cn(inputCls, 'pr-10')} />
                    <button onClick={() => setTtsShowKey(!ttsShowKey)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors">
                      {ttsShowKey ? <EyeOff className="w-4 h-4 text-agnes-text-muted" /> : <Eye className="w-4 h-4 text-agnes-text-muted" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', ttsConnected ? 'bg-agnes-success' : 'bg-agnes-error')} />
                    <span className="text-xs text-agnes-text-secondary">{ttsConnected ? '已连接' : '未连接'}</span>
                  </div>
                  <Button size="sm" onClick={handleTtsTest} loading={ttsTesting}><TestTube className="w-4 h-4" />检测连接</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === '账户信息' && (
          <div className="animate-fade-in space-y-6">
            <div className="p-6 rounded-card bg-agnes-card border border-agnes-border">
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-24 h-24 rounded-full p-[3px] bg-gradient-to-br from-agnes-purple via-agnes-cyan to-agnes-purple cursor-pointer" onMouseEnter={() => setAvatarHover(true)} onMouseLeave={() => setAvatarHover(false)} onClick={() => showToast('success', '头像上传功能开发中')}>
                  <div className="w-full h-full rounded-full bg-agnes-card flex items-center justify-center overflow-hidden"><User className="w-10 h-10 text-agnes-text-muted" /></div>
                  {avatarHover && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><Camera className="w-6 h-6 text-white" /></div>}
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-agnes-text-secondary">显示名称</label>
                  <div className="flex items-center gap-2">
                    {editingName ? (
                      <><input value={nameInput} onChange={(e) => setNameInput(e.target.value)} className={cn(drawerInputCls, 'flex-1')} /><button onClick={handleSaveName} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><Save className="w-4 h-4 text-agnes-success" /></button><button onClick={() => setEditingName(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><X className="w-4 h-4 text-agnes-text-muted" /></button></>
                    ) : (
                      <><span className="flex-1 text-sm text-agnes-text-primary">{displayName}</span><button onClick={() => { setNameInput(displayName); setEditingName(true) }} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><Edit2 className="w-4 h-4 text-agnes-text-muted" /></button></>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5"><label className="text-xs text-agnes-text-secondary">邮箱</label><span className="text-sm text-agnes-text-muted">user@agnes.ai</span></div>
                <div className="space-y-1.5">
                  <label className="text-xs text-agnes-text-secondary">个人签名</label>
                  <div className="relative">
                    <textarea value={signature} onChange={(e) => setSignature(e.target.value.slice(0, 200))} rows={3} placeholder="写点什么介绍一下自己吧..." className="w-full px-3 py-2 text-sm rounded-input bg-agnes-bg-secondary border border-agnes-border text-agnes-text-primary placeholder:text-agnes-text-muted focus:outline-none focus:border-agnes-purple/50 resize-none" />
                    <span className="absolute bottom-2 right-3 text-xs text-agnes-text-muted">{signature.length}/200</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-card bg-agnes-card border border-agnes-border">
              <div className="flex items-center gap-2 mb-4"><Crown className="w-5 h-5 text-agnes-warning" /><h3 className="text-base font-medium text-agnes-text-primary">会员信息</h3></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-agnes-bg-secondary"><span className="text-sm text-agnes-text-secondary">会员等级</span><div className="flex items-center gap-1.5"><Crown className="w-4 h-4 text-agnes-warning" /><span className="text-sm font-medium text-agnes-warning">Pro</span></div></div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-agnes-bg-secondary"><span className="text-sm text-agnes-text-secondary">存储空间</span><span className="text-sm font-medium text-agnes-text-primary">50 GB / 50 GB</span></div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-agnes-bg-secondary">
                  <span className="text-sm text-agnes-text-secondary">积分</span>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5"><Coins className="w-4 h-4 text-agnes-warning" /><span className="text-sm font-medium text-agnes-text-primary">2,580 积分</span></div>
                    <p className="text-[10px] text-agnes-text-muted mt-0.5">会员每次消耗 2000 积分 · 非会员 100 积分</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-agnes-bg-secondary"><span className="text-sm text-agnes-text-secondary">到期时间</span><span className="text-sm text-agnes-text-primary">2027-12-31</span></div>
              </div>
            </div>
            <div className="p-6 rounded-card bg-agnes-card border border-agnes-border">
              <div className="flex items-center gap-2 mb-4"><Gift className="w-5 h-5 text-agnes-purple" /><h3 className="text-base font-medium text-agnes-text-primary">邀请与兑换</h3></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-agnes-bg-secondary">
                  <div className="flex items-center gap-2"><LinkIcon className="w-4 h-4 text-agnes-text-muted" /><span className="text-sm text-agnes-text-secondary">邀请链接</span></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-agnes-text-muted truncate max-w-[180px]">https://agnes.ai/invite/u8x2k</span><button onClick={() => handleCopy('https://agnes.ai/invite/u8x2k', '邀请链接')} className="p-1 rounded hover:bg-white/10 transition-colors"><Copy className="w-3.5 h-3.5 text-agnes-text-muted" /></button></div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-agnes-bg-secondary">
                  <div className="flex items-center gap-2"><Ticket className="w-4 h-4 text-agnes-text-muted" /><span className="text-sm text-agnes-text-secondary">邀请码</span></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-agnes-text-muted font-mono">U8X2K9</span><button onClick={() => handleCopy('U8X2K9', '邀请码')} className="p-1 rounded hover:bg-white/10 transition-colors"><Copy className="w-3.5 h-3.5 text-agnes-text-muted" /></button></div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-agnes-bg-secondary">
                  <Gift className="w-4 h-4 text-agnes-text-muted shrink-0" /><span className="text-sm text-agnes-text-secondary shrink-0">兑换码</span>
                  <input value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} placeholder="输入兑换码" className="flex-1 h-8 px-2 text-sm rounded bg-agnes-bg border border-agnes-border text-agnes-text-primary placeholder:text-agnes-text-muted focus:outline-none focus:border-agnes-purple/50" />
                  <Button size="sm" onClick={handleRedeem}>兑换</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === '偏好设置' && (
          <div className="animate-fade-in space-y-6">
            <div className="p-6 rounded-card bg-agnes-card border border-agnes-border">
              <div className="flex items-center gap-2 mb-4"><Palette className="w-5 h-5 text-agnes-cyan" /><h3 className="text-base font-medium text-agnes-text-primary">默认参数</h3></div>
              <div className="space-y-4">
                <Slider label="默认温度" value={0.7} onChange={() => {}} min={0} max={2} step={0.1} />
                <Slider label="默认 Top-p" value={0.9} onChange={() => {}} min={0} max={1} step={0.05} />
              </div>
            </div>
            <div className="p-6 rounded-card bg-agnes-card border border-agnes-border">
              <div className="flex items-center gap-2 mb-4"><Globe className="w-5 h-5 text-agnes-purple" /><h3 className="text-base font-medium text-agnes-text-primary">界面偏好</h3></div>
              <div className="space-y-4">
                <Select label="语言" options={[{ value: 'zh-CN', label: '简体中文' }, { value: 'en', label: 'English' }]} defaultValue="zh-CN" />
                <Select label="主题" options={[{ value: 'dark', label: '深色' }, { value: 'light', label: '浅色' }, { value: 'system', label: '跟随系统' }]} defaultValue="dark" />
              </div>
            </div>
          </div>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingModel ? '编辑模型' : '新增模型'}>
        <div className="space-y-4">
          <div className="space-y-1.5"><label className="text-xs text-agnes-text-secondary">模型名称</label><input value={formData.name} onChange={(e) => setField('name', e.target.value)} className={drawerInputCls} /></div>
          <div className="space-y-1.5"><label className="text-xs text-agnes-text-secondary">别名</label><input value={formData.alias} onChange={(e) => setField('alias', e.target.value)} className={drawerInputCls} /></div>
          <div className="space-y-1.5"><label className="text-xs text-agnes-text-secondary">提供商</label><input value={formData.provider} onChange={(e) => setField('provider', e.target.value)} className={drawerInputCls} /></div>
          <div className="space-y-1.5"><label className="text-xs text-agnes-text-secondary">API Base URL</label><input value={formData.apiBaseUrl} onChange={(e) => setField('apiBaseUrl', e.target.value)} className={drawerInputCls} /></div>
          <div className="space-y-1.5"><label className="text-xs text-agnes-text-secondary">API Key</label><input type="password" value={formData.apiKey} onChange={(e) => setField('apiKey', e.target.value)} className={drawerInputCls} /></div>
          <Select label="模型类型" options={MODEL_TYPE_OPTIONS} value={formData.modelType} onChange={(e) => setField('modelType', e.target.value as ModelConfig['modelType'])} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-xs text-agnes-text-secondary">上下文长度</label><input type="number" value={formData.contextLength} onChange={(e) => setField('contextLength', Number(e.target.value))} className={drawerInputCls} /></div>
            <div className="space-y-1.5"><label className="text-xs text-agnes-text-secondary">最大输出长度</label><input type="number" value={formData.maxOutputLength} onChange={(e) => setField('maxOutputLength', Number(e.target.value))} className={drawerInputCls} /></div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-agnes-text-secondary">能力标签</label>
            <div className="flex flex-wrap gap-2">
              {CAPABILITY_OPTIONS.map((cap) => (<Chip key={cap.key} variant={formData.capabilities.includes(cap.key) ? 'cyan' : 'default'} active={formData.capabilities.includes(cap.key)} onClick={() => toggleCapability(cap.key)}>{formData.capabilities.includes(cap.key) && <Check className="w-3 h-3 mr-1" />}{cap.label}</Chip>))}
            </div>
          </div>
          <Slider label="温度" value={formData.temperature} onChange={(v) => setField('temperature', v)} min={0} max={2} step={0.1} />
          <Slider label="Top-p" value={formData.topP} onChange={(v) => setField('topP', v)} min={0} max={1} step={0.05} />
          <div className="flex items-center justify-between"><span className="text-sm text-agnes-text-secondary">是否启用</span><button onClick={() => setField('enabled', !formData.enabled)} className={cn('relative w-10 h-5 rounded-full transition-colors', formData.enabled ? 'bg-agnes-purple' : 'bg-agnes-border')}><span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform', formData.enabled ? 'translate-x-5' : 'translate-x-0.5')} /></button></div>
          <div className="flex items-center justify-between"><span className="text-sm text-agnes-text-secondary">是否默认</span><button onClick={() => setField('isDefault', !formData.isDefault)} className={cn('relative w-10 h-5 rounded-full transition-colors', formData.isDefault ? 'bg-agnes-purple' : 'bg-agnes-border')}><span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform', formData.isDefault ? 'translate-x-5' : 'translate-x-0.5')} /></button></div>
          <div className="space-y-1.5"><label className="text-xs text-agnes-text-secondary">备注</label><textarea value={formData.remark} onChange={(e) => setField('remark', e.target.value)} rows={2} className="w-full px-3 py-2 text-sm rounded-input bg-agnes-bg-secondary border border-agnes-border text-agnes-text-primary focus:outline-none focus:border-agnes-purple/50 resize-none" /></div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)} className="flex-1 min-w-[80px]">取消</Button>
            {editingModel && <Button variant="ghost" onClick={handleDrawerTest} loading={testing} className="flex-1 min-w-[100px]"><TestTube className="w-4 h-4" />连通性测试</Button>}
            <Button onClick={handleSave} className="flex-1 min-w-[80px]">保存</Button>
          </div>
        </div>
      </Drawer>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="确认删除">
        <p className="text-sm text-agnes-text-secondary mb-6">确定要删除模型「{deleteTarget?.name}」吗？此操作不可撤销。</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>取消</Button>
          <Button variant="danger" onClick={handleDelete}>删除</Button>
        </div>
      </Modal>
    </div>
  )
}
