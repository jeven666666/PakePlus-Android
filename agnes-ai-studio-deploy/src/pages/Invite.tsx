import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Gift, Users, QrCode, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/utils/helpers'
import { showToast } from '@/components/ui/Toast'

const MOCK_INVITES = [
  { name: '张**', date: '2026-06-01', reward: 50, status: '已到账' },
  { name: '李**', date: '2026-05-28', reward: 50, status: '已到账' },
  { name: '王**', date: '2026-05-25', reward: 50, status: '已到账' },
  { name: '赵**', date: '2026-05-20', reward: 50, status: '待确认' },
]

export default function Invite() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const inviteCode = user?.inviteCode ?? 'AGNES01'
  const inviteLink = `https://agnes.ai/invite/${inviteCode.toLowerCase()}`
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    showToast('success', `${label}已复制`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full bg-agnes-bg overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-white/5 transition-colors" aria-label="返回">
            <ArrowLeft className="w-5 h-5 text-agnes-text-secondary" />
          </button>
          <h1 className="text-2xl font-semibold gradient-text">邀请好友</h1>
        </div>
        <p className="text-sm text-agnes-text-muted mb-8 ml-12">邀请好友注册，双方均可获得积分奖励</p>

        {/* Reward banner */}
        <div className="glass-strong rounded-card p-5 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-agnes-purple/20 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-agnes-purple" />
          </div>
          <div>
            <div className="text-base font-medium text-agnes-text-primary">每邀请1人获得 <span className="gradient-text font-bold">50 积分</span></div>
            <p className="text-xs text-agnes-text-muted mt-0.5">好友注册后双方各得 50 积分，邀请无上限</p>
          </div>
        </div>

        {/* Invite code & link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Invite code */}
          <div className="glass-strong rounded-card p-6">
            <h2 className="text-sm font-medium text-agnes-text-muted mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />邀请码
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-agnes-text-primary font-mono tracking-widest">{inviteCode}</span>
              <button
                onClick={() => handleCopy(inviteCode, '邀请码')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="复制邀请码"
              >
                {copied ? <CheckCircle className="w-5 h-5 text-agnes-success" /> : <Copy className="w-5 h-5 text-agnes-text-muted" />}
              </button>
            </div>
          </div>

          {/* QR code placeholder */}
          <div className="glass-strong rounded-card p-6 flex flex-col items-center justify-center">
            <div className="w-28 h-28 rounded-xl bg-agnes-bg-secondary border border-agnes-border flex flex-col items-center justify-center mb-3">
              <QrCode className="w-10 h-10 text-agnes-text-muted mb-1" />
              <span className="text-xs text-agnes-text-muted">扫码加入</span>
            </div>
            <p className="text-xs text-agnes-text-muted">扫描二维码即可注册</p>
          </div>
        </div>

        {/* Invite link */}
        <div className="glass-strong rounded-card p-6 mb-8">
          <h2 className="text-sm font-medium text-agnes-text-muted mb-3 flex items-center gap-2">
            <Copy className="w-4 h-4" />邀请链接
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-10 px-4 rounded-input bg-agnes-bg-secondary border border-agnes-border text-sm text-agnes-text-secondary flex items-center overflow-hidden">
              <span className="truncate">{inviteLink}</span>
            </div>
            <button
              onClick={() => handleCopy(inviteLink, '邀请链接')}
              className="h-10 px-5 rounded-btn gradient-primary text-white text-sm font-medium hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] active:scale-[0.98] transition-all duration-200 shrink-0"
            >
              复制链接
            </button>
          </div>
        </div>

        {/* Invite history */}
        <div className="glass-strong rounded-card overflow-hidden">
          <div className="p-5 border-b border-agnes-border">
            <h2 className="text-base font-medium text-agnes-text-primary flex items-center gap-2">
              <Users className="w-5 h-5 text-agnes-cyan" />邀请记录
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-agnes-border">
                  <th className="text-left px-5 py-3 text-agnes-text-muted font-medium">用户</th>
                  <th className="text-left px-5 py-3 text-agnes-text-muted font-medium">注册日期</th>
                  <th className="text-right px-5 py-3 text-agnes-text-muted font-medium">奖励积分</th>
                  <th className="text-center px-5 py-3 text-agnes-text-muted font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_INVITES.map((row, i) => (
                  <tr key={i} className={cn('border-b border-agnes-border/50', i % 2 === 0 ? 'bg-white/[0.02]' : '')}>
                    <td className="px-5 py-3 text-agnes-text-secondary">{row.name}</td>
                    <td className="px-5 py-3 text-agnes-text-muted">{row.date}</td>
                    <td className="px-5 py-3 text-right text-agnes-success font-medium">+{row.reward}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        row.status === '已到账' ? 'bg-agnes-success/10 text-agnes-success' : 'bg-agnes-warning/10 text-agnes-warning',
                      )}>
                        {row.status}
                      </span>
                    </td>
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
