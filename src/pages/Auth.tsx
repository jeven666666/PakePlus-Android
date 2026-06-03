import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';

// Particle component with rotation and fade effect
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: Array<{
      x: number; y: number; size: number; speedX: number; speedY: number;
      opacity: number; fadeDir: number; angle: number; rotSpeed: number;
      color: string;
    }> = [];

    const colors = ['#7C5CFF', '#00D4FF', '#9333EA', '#06B6D4', '#8B5CF6', '#22D3EE'];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const count = 80;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.6 + 0.1,
        fadeDir: Math.random() > 0.5 ? 1 : -1,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const lineOpacity = (1 - dist / 150) * 0.15 * Math.min(particles[i].opacity, particles[j].opacity);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124, 92, 255, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        // Update position with orbital rotation around center
        p.angle += p.rotSpeed;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const orbitX = p.x - cx;
        const orbitY = p.y - cy;
        const cos = Math.cos(p.rotSpeed);
        const sin = Math.sin(p.rotSpeed);
        p.x = cx + orbitX * cos - orbitY * sin + p.speedX;
        p.y = cy + orbitX * sin + orbitY * cos + p.speedY;

        // Fade in/out
        p.opacity += p.fadeDir * 0.003;
        if (p.opacity > 0.7) { p.opacity = 0.7; p.fadeDir = -1; }
        if (p.opacity < 0.05) { p.opacity = 0.05; p.fadeDir = 1; }

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Draw glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, p.color + Math.round(p.opacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, p.color + '00');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

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
    <div className="min-h-screen bg-agnes-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Particle background */}
      <ParticleBackground />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-agnes-purple/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-agnes-cyan/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md relative z-10">
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
