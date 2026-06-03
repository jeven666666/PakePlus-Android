import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, HardDrive, Check, Crown } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/utils/helpers'
import { showToast } from '@/components/ui/Toast'
import api from '@/utils/api'

const STORAGE_PLANS = [
  {
    key: 'free' as const,
    name: '免费版',
    storage: '1 GB',
    icon: HardDrive,
    price: '¥0',
    period: '永久',
    color: 'text-agnes-text-secondary',
    borderColor: 'border-agnes-border',
    glow: '',
    features: ['1 GB 存储空间', '100 积分/月', '基础功能', '标清输出'],
    popular: false,
  },
  {
    key: 'basic' as const,
    name: '基础版',
    storage: '10 GB',
    icon: HardDrive,
    price: '¥19.9',
    period: '/月',
    color: 'text-agnes-cyan',
    borderColor: 'border-agnes-cyan/40',
    glow: '',
    features: ['10 GB 存储空间', '500 积分/月', '全部基础功能', '高清输出'],
    popular: false,
  },
  {
    key: 'standard' as const,
    name: '标准版',
    storage: '20 GB',
    icon: HardDrive,
    price: '¥29.9',
    period: '/月',
    color: 'text-agnes-purple',
    borderColor: 'border-agnes-purple/40',
    glow: 'shadow-[0_0_24px_rgba(124,92,255,0.2)]',
    features: ['20 GB 存储空间', '1000 积分/月', '全部功能', '高清输出', '优先队列'],
    popular: true,
  },
  {
    key: 'professional' as const,
    name: '专业版',
    storage: '50 GB',
    icon: HardDrive,
    price: '¥49.9',
    period: '/月',
    color: 'text-agnes-warning',
    borderColor: 'border-agnes-warning/40',
    glow: 'shadow-[0_0_24px_rgba(255,183,77,0.2)]',
    features: ['50 GB 存储空间', '2000 积分/月', '全部功能', '超高清输出', '优先队列', '专属客服'],
    popular: false,
  },
]

export default function StorageUpgrade() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handleSelect = async (key: string) => {
    if (key === 'free') return
    setSelectedPlan(key)
    
    try {
      const res = await api.upgradeStorage(key)
      if (res.data) {
        showToast('success', `${STORAGE_PLANS.find(p => p.key === key)?.name} 存储升级成功`)
        useAuthStore.getState().fetchMe()
      } else {
        showToast('error', res.error || '升级失败')
      }
    } catch (err: any) {
      showToast('error', `升级失败: ${err.message}`)
    } finally {
      setSelectedPlan(null)
    }
  }

  return (
    <div className="h-full bg-agnes-bg overflow-y-auto">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5 transition-colors" aria-label="返回">
            <ArrowLeft className="w-5 h-5 text-agnes-text-secondary" />
          </button>
          <h1 className="text-2xl font-semibold gradient-text">存储空间升级</h1>
        </div>
        <p className="text-sm text-agnes-text-muted mb-8 ml-12">扩展你的存储空间，释放更多创作可能</p>

        {/* Current storage */}
        <div className="glass-strong rounded-card p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-agnes-purple/20 flex items-center justify-center">
              <HardDrive className="w-7 h-7 text-agnes-purple" />
            </div>
            <div>
              <div className="text-sm text-agnes-text-muted">当前存储空间</div>
              <div className="text-2xl font-bold text-agnes-text-primary">
                {user?.storageLimit ? `${(user.storageLimit / (1024 * 1024 * 1024)).toFixed(0)} GB` : '1 GB'}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-sm text-agnes-text-muted">已使用</div>
              <div className="text-lg font-semibold text-agnes-text-secondary">
                {user?.storageUsed ? `${(user.storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB` : '0 GB'}
              </div>
            </div>
          </div>
        </div>

        {/* Storage plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {STORAGE_PLANS.map((plan) => {
            const Icon = plan.icon
            const isCurrent = user?.storageLimit === parseInt(plan.storage) * 1024 * 1024 * 1024
            
            return (
              <div
                key={plan.key}
                className={cn(
                  'glass-strong rounded-card p-6 flex flex-col relative transition-all duration-200',
                  plan.borderColor,
                  plan.glow,
                  isCurrent && 'ring-2 ring-agnes-success/50',
                )}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-agnes-success text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                      当前方案
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', 
                    plan.key === 'standard' ? 'bg-agnes-purple/20' : 
                    plan.key === 'professional' ? 'bg-agnes-warning/20' : 
                    'bg-white/5'
                  )}>
                    <Icon className={cn('w-5 h-5', plan.color)} />
                  </div>
                  <div>
                    <span className={cn('text-lg font-semibold', plan.color)}>{plan.name}</span>
                    <div className="text-2xl font-bold text-agnes-text-primary mt-1">{plan.storage}</div>
                  </div>
                </div>
                
                <div className="mb-5">
                  <span className="text-3xl font-bold text-agnes-text-primary">{plan.price}</span>
                  <span className="text-sm text-agnes-text-muted">{plan.period}</span>
                </div>
                
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-agnes-text-secondary">
                      <Check className={cn('w-4 h-4 shrink-0', plan.color)} />
                      {f}
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleSelect(plan.key)}
                  disabled={isCurrent || selectedPlan === plan.key}
                  className={cn(
                    'w-full h-10 rounded-btn text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2',
                    isCurrent
                      ? 'bg-agnes-success/20 text-agnes-success cursor-default'
                      : selectedPlan === plan.key
                      ? 'bg-agnes-purple/50 text-white cursor-wait'
                      : 'gradient-primary text-white hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] active:scale-[0.98]',
                  )}
                >
                  {selectedPlan === plan.key ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      处理中...
                    </>
                  ) : isCurrent ? (
                    '当前方案'
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      选择方案
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Features explanation */}
        <div className="glass-strong rounded-card p-6 mb-8">
          <h2 className="text-base font-medium text-agnes-text-primary mb-4">存储空间说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-agnes-text-secondary font-medium mb-2">存储内容</div>
              <p className="text-agnes-text-muted">包括生成的图片、视频、音频文件及素材库内容</p>
            </div>
            <div>
              <div className="text-agnes-text-secondary font-medium mb-2">计费方式</div>
              <p className="text-agnes-text-muted">按月订阅，次月自动续费，可随时取消</p>
            </div>
            <div>
              <div className="text-agnes-text-secondary font-medium mb-2">空间升级</div>
              <p className="text-agnes-text-muted">升级后立即生效，未使用空间不退款</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="glass-strong rounded-card p-6">
          <h2 className="text-base font-medium text-agnes-text-primary mb-4">常见问题</h2>
          <div className="space-y-4">
            <div>
              <div className="text-agnes-text-secondary font-medium mb-1">Q: 升级后存储空间立即可用吗？</div>
              <p className="text-agnes-text-muted text-sm">A: 是的，升级成功后存储空间立即可用，无需等待。</p>
            </div>
            <div>
              <div className="text-agnes-text-secondary font-medium mb-1">Q: 可以降级存储空间吗？</div>
              <p className="text-agnes-text-muted text-sm">A: 可以，在次月续费前可以降级到较低档位，当前周期内空间保持不变。</p>
            </div>
            <div>
              <div className="text-agnes-text-secondary font-medium mb-1">Q: 超出会怎样？</div>
              <p className="text-agnes-text-muted text-sm">A: 存储空间满后将无法生成新内容，需要升级或清理旧文件。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
