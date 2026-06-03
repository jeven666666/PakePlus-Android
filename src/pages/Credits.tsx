import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Coins, ShoppingCart, Ticket, Flame, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/utils/api'
import { cn } from '@/utils/helpers'
import { showToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'

const PACKAGES = [
  { credits: 100, price: '¥9.9', label: '', color: '' },
  { credits: 500, price: '¥39.9', label: '热门', color: 'bg-agnes-purple' },
  { credits: 2000, price: '¥149.9', label: '最划算', color: 'bg-agnes-cyan' },
  { credits: 5000, price: '¥349.9', label: '', color: '' },
]

const MOCK_HISTORY = [
  { date: '2026-06-03', type: '图像生成', amount: -10, description: '生成 1 张图像 (高清)' },
  { date: '2026-06-02', type: '视频生成', amount: -50, description: '生成 1 个视频 (5s)' },
  { date: '2026-06-01', type: '积分充值', amount: 500, description: '购买 500 积分套餐' },
  { date: '2026-05-30', type: '对话', amount: -5, description: 'AI 对话消耗' },
  { date: '2026-05-28', type: 'TTS 合成', amount: -8, description: '语音合成 1000 字' },
  { date: '2026-05-25', type: '邀请奖励', amount: 50, description: '邀请用户注册奖励' },
  { date: '2026-05-22', type: '图像生成', amount: -10, description: '生成 1 张图像 (标清)' },
  { date: '2026-05-20', type: '兑换码', amount: 200, description: '兑换码 WELCOME200' },
]

export default function Credits() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const credits = user?.credits ?? 0
  const [redeemInput, setRedeemInput] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null)
  const [history, setHistory] = useState(MOCK_HISTORY)

  useEffect(() => {
    api.getCreditsHistory().then((res) => {
      if (res.data) setHistory(res.data)
    }).catch(() => {})
  }, [])

  const handleRedeem = async () => {
    const code = redeemInput.trim()
    if (!code) {
      showToast('error', '请输入兑换码')
      return
    }
    setRedeeming(true)
    const res = await api.redeemCode(code)
    setRedeeming(false)
    if (res.data) {
      showToast('success', '兑换成功')
      setRedeemInput('')
    } else {
      showToast('error', res.error || '兑换失败')
    }
  }

  const handlePurchase = async (credits: number) => {
    setSelectedPkg(credits)
    const res = await api.purchaseCredits(String(credits))
    if (res.data) {
      showToast('success', `${credits} 积分购买成功`)
      useAuthStore.getState().fetchMe()
    } else {
      showToast('error', res.error || '购买失败')
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
          <h1 className="text-2xl font-semibold gradient-text">积分中心</h1>
        </div>
        <p className="text-sm text-agnes-text-muted mb-8 ml-12">管理你的积分余额与消费记录</p>

        {/* Balance */}
        <div className="glass-strong rounded-card p-6 mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins className="w-6 h-6 text-agnes-warning" />
            <span className="text-sm text-agnes-text-muted">当前积分</span>
          </div>
          <div className="text-5xl font-bold gradient-text mb-1">{credits.toLocaleString()}</div>
          <p className="text-xs text-agnes-text-muted">积分可用于图像生成、视频生成、AI 对话等功能</p>
        </div>

        {/* Purchase packages */}
        <div className="mb-8">
          <h2 className="text-base font-medium text-agnes-text-primary mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-agnes-purple" />积分充值
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.credits}
                onClick={() => handlePurchase(pkg.credits)}
                className={cn(
                  'glass-strong rounded-card p-4 text-center transition-all duration-200 hover:border-agnes-purple/40',
                  selectedPkg === pkg.credits && 'ring-1 ring-agnes-purple/30',
                )}
              >
                {pkg.label && (
                  <span className={cn('inline-block text-[10px] font-medium text-white px-2 py-0.5 rounded-full mb-2', pkg.color)}>
                    {pkg.label === '热门' && <Flame className="w-3 h-3 inline mr-0.5" />}
                    {pkg.label === '最划算' && <Sparkles className="w-3 h-3 inline mr-0.5" />}
                    {pkg.label}
                  </span>
                )}
                {!pkg.label && <div className="h-5 mb-2" />}
                <div className="text-2xl font-bold text-agnes-text-primary">{pkg.credits}</div>
                <div className="text-xs text-agnes-text-muted mb-2">积分</div>
                <div className="text-sm font-semibold text-agnes-purple">{pkg.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Redeem code */}
        <div className="glass-strong rounded-card p-6 mb-8">
          <h2 className="text-base font-medium text-agnes-text-primary mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-agnes-cyan" />兑换码
          </h2>
          <div className="flex items-center gap-3">
            <input
              value={redeemInput}
              onChange={(e) => setRedeemInput(e.target.value)}
              placeholder="输入兑换码"
              className="flex-1 h-10 px-4 text-sm rounded-input bg-agnes-bg-secondary border border-agnes-border text-agnes-text-primary placeholder:text-agnes-text-muted focus:outline-none focus:border-agnes-purple/50 transition-colors"
            />
            <Button onClick={handleRedeem} loading={redeeming}>兑换</Button>
          </div>
        </div>

        {/* Consumption history */}
        <div className="glass-strong rounded-card overflow-hidden">
          <div className="p-5 border-b border-agnes-border">
            <h2 className="text-base font-medium text-agnes-text-primary flex items-center gap-2">
              <Coins className="w-5 h-5 text-agnes-warning" />积分记录
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-agnes-border">
                  <th className="text-left px-5 py-3 text-agnes-text-muted font-medium">日期</th>
                  <th className="text-left px-5 py-3 text-agnes-text-muted font-medium">类型</th>
                  <th className="text-right px-5 py-3 text-agnes-text-muted font-medium">数量</th>
                  <th className="text-left px-5 py-3 text-agnes-text-muted font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={i} className={cn('border-b border-agnes-border/50', i % 2 === 0 ? 'bg-white/[0.02]' : '')}>
                    <td className="px-5 py-3 text-agnes-text-muted">{row.date}</td>
                    <td className="px-5 py-3 text-agnes-text-secondary">{row.type}</td>
                    <td className={cn('px-5 py-3 text-right font-medium', row.amount > 0 ? 'text-agnes-success' : 'text-agnes-error')}>
                      {row.amount > 0 ? '+' : ''}{row.amount}
                    </td>
                    <td className="px-5 py-3 text-agnes-text-muted">{row.description}</td>
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
