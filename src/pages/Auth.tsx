import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { login, register, loading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await register(email, password, displayName);
    }
  };

  return (
    <div className="min-h-screen bg-agnes-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="authLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7C5CFF"/>
                  <stop offset="100%" stopColor="#00D4FF"/>
                </linearGradient>
              </defs>
              <path d="M25 80L42 20H58C68 20 75 27 75 38C75 48 70 55 62 58L78 82" stroke="url(#authLogoGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M72 18L76 26L84 22L77 29L83 34L74 32L66 36L71 28Z" fill="#00D4FF"/>
              <circle cx="86" cy="14" r="3" fill="#00D4FF"/>
            </svg>
            <span className="gradient-text text-2xl font-bold tracking-tight">Agnes AI</span>
            <span className="text-agnes-text-muted text-lg font-light">Studio</span>
          </div>
          <p className="text-agnes-text-muted text-sm">多模态 AI 创作控制台</p>
        </div>

        {/* Form Card */}
        <div className="glass-strong rounded-2xl p-8 border border-agnes-border">
          <h2 className="text-xl font-semibold text-agnes-text-primary mb-6">
            {isLogin ? '登录' : '注册'}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-300 ml-2">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-agnes-text-secondary mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-lg bg-agnes-bg border border-agnes-border text-agnes-text-primary placeholder:text-agnes-text-muted focus:outline-none focus:border-agnes-purple/50 transition-colors"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm text-agnes-text-secondary mb-1.5">显示名称</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Agnes 创作者"
                  className="w-full px-4 py-2.5 rounded-lg bg-agnes-bg border border-agnes-border text-agnes-text-primary placeholder:text-agnes-text-muted focus:outline-none focus:border-agnes-purple/50 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-agnes-text-secondary mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="至少6位"
                className="w-full px-4 py-2.5 rounded-lg bg-agnes-bg border border-agnes-border text-agnes-text-primary placeholder:text-agnes-text-muted focus:outline-none focus:border-agnes-purple/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg gradient-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-agnes-text-muted">
            {isLogin ? '还没有账号？' : '已有账号？'}
            <button
              onClick={() => { setIsLogin(!isLogin); clearError(); }}
              className="text-agnes-cyan hover:underline ml-1"
            >
              {isLogin ? '注册' : '登录'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-agnes-text-muted mt-6">
          登录即表示同意 Agnes AI 服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
