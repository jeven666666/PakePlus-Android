import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Crown, Check, Zap, Building2, Star } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/utils/api'
import { cn } from '@/utils/helpers'
import { showToast } from '@/components/ui/Toast'

const PLANS = [
  {
    key: 'free' as const,
    name: 'Free',
    icon: Zap,
    price: '¥0',
    period: '/月',
    color: 'text-agnes-text-secondary',
    borderColor: 'border-agnes-border',
    glow: '',
    features: ['100积分/月', '1GB存储', '基础模型', '标清输出'],
    popular: false,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    icon: Crown,
    price: '¥49.9',
    period: '/月',
    color: 'text-agnes-purple',
    borderColor: 'border-agnes-purple/40',
    glow: 'shadow-[0_0_24px_rgba(124,92,255,0.2)]',
    features: ['2000积分/月', '50GB存储', '全部模型', '高清输出', '优先队列'],
    popular: true,
  },
  {
    key: 'enterprise' as const,
    name: 'Enterprise',
    icon: Building2,
    price: '¥199',
    period: '/月',
    color: 'text-agnes-cyan',
    borderColor: 'border-agnes-cyan/40',
    glow: 'shadow-[0_0_24px_rgba(0,212,255,0.2)]',
    features: ['无限积分', '200GB存储', '全部模型+API', '超高清输出', '专属客服'],
    popular: false,
  },
]

const COMPARISON = [
  { feature: '每月积分', free: '100', pro: '2,000', enterprise: '无限' },
  { feature: '存储空间', free: '1GB', pro: '50GB', enterprise: '200GB' },
  { feature: '模型访问', free: '基础模型', pro: '全部模型', enterprise: '全部模型+API' },
  { feature: '输出质量', free: '标清', pro: '高清', enterprise: '超高清' },
  { feature: '任务队列', free: '普通', pro: '优先', enterprise: '最高优先' },
  { feature: 'API 调用', free: '—', pro: '—', enterprise: '✓' },
  { feature: '专属客服', free: '—', pro: '—', enterprise: '✓' },
  { feature: '自定义模型', free: '—', pro: '—', enterprise: '✓' },
]

const tierLabel: Record<string, string> = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' }
const tierColor: Record<string, string> = { free: 'text-agnes-text-secondary', pro: 'text-agnes-purple', enterprise: 'text-agnes-cyan' }

export default function Membership() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const currentTier = user?.membership ?? 'free'

  const handleSelect = async (key: string) => {
    if (key === currentTier) return
    const res = await api.upgradeMembership(key as 'pro' | 'enterprise')
    if (res.data) {
      showToast('success', `${key === 'pro' ? 'Pro' : 'Enterprise'} 方案升级成功`)
      useAuthStore.getState().fetchMe()
    } else {
      showToast('error', res.error || '升级失败')
    }
  }

  return (
    <div className="h-full bg-agnes-bg overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-white/5 transition-colors" aria-label="返回">
            <ArrowLeft className="w-5 h-5 text-agnes-text-secondary" />
          </button>
          <h1 className="text-2xl font-semibold gradient-text">会员中心</h1>
        </div>
        <p className="text-sm text-agnes-text-muted mb-8 ml-12">选择适合你的方案，解锁更多创作能力</p>

        {/* Current tier */}
        <div className="glass-strong rounded-card p-5 mb-8 flex items-center gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', currentTier === 'pro' ? 'bg-agnes-purple/20' : currentTier === 'enterprise' ? 'bg-agnes-cyan/20' : 'bg-white/5')}>
            <Crown className={cn('w-6 h-6', tierColor[currentTier])} />
          </div>
          <div>
            <div className="text-sm text-agnes-text-muted">当前方案</div>
            <div className={cn('text-lg font-semibold', tierColor[currentTier])}>{tierLabel[currentTier]}</div>
          </div>
          {user && (
            <div className="ml-auto text-right">
              <div className="text-sm text-agnes-text-muted">剩余积分</div>
              <div className="text-lg font-semibold text-agnes-text-primary">{user.credits.toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const isCurrent = plan.key === currentTier
            return (
              <div
                key={plan.key}
                className={cn(
                  'glass-strong rounded-card p-6 flex flex-col relative transition-all duration-200',
                  plan.borderColor,
                  plan.glow,
                  isCurrent && 'ring-1 ring-agnes-purple/30',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="gradient-primary text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />推荐
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', plan.key === 'pro' ? 'bg-agnes-purple/20' : plan.key === 'enterprise' ? 'bg-agnes-cyan/20' : 'bg-white/5')}>
                    <Icon className={cn('w-5 h-5', plan.color)} />
                  </div>
                  <span className={cn('text-lg font-semibold', plan.color)}>{plan.name}</span>
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
                  disabled={isCurrent}
                  className={cn(
                    'w-full h-10 rounded-btn text-sm font-medium transition-all duration-200',
                    isCurrent
                      ? 'bg-white/5 text-agnes-text-muted cursor-default'
                      : 'gradient-primary text-white hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] active:scale-[0.98]',
                  )}
                >
                  {isCurrent ? '当前方案' : '选择'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Comparison table */}
        <div className="glass-strong rounded-card overflow-hidden">
          <div className="p-5 border-b border-agnes-border">
            <h2 className="text-base font-medium text-agnes-text-primary">功能对比</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-agnes-border">
                  <th className="text-left px-5 py-3 text-agnes-text-muted font-medium">功能</th>
                  <th className="text-center px-5 py-3 text-agnes-text-muted font-medium">Free</th>
                  <th className="text-center px-5 py-3 text-agnes-purple font-medium">Pro</th>
                  <th className="text-center px-5 py-3 text-agnes-cyan font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={cn(i % 2 === 0 ? 'bg-white/[0.02]' : '')}>
                    <td className="px-5 py-3 text-agnes-text-secondary">{row.feature}</td>
                    <td className="px-5 py-3 text-center text-agnes-text-muted">{row.free}</td>
                    <td className="px-5 py-3 text-center text-agnes-text-primary">{row.pro}</td>
                    <td className="px-5 py-3 text-center text-agnes-text-primary">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
