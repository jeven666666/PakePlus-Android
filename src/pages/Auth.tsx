import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/api';

// Spiral galaxy particle animation with sci-fi tech feel
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Brand colors
    const colors = {
      purple: { r: 124, g: 92, b: 255 },   // #7C5CFF
      cyan: { r: 0, g: 212, b: 255 },       // #00D4FF
      deepPurple: { r: 147, g: 51, b: 234 }, // #9333EA
      teal: { r: 6, g: 182, b: 212 },        // #06B6D4
    };

    // Spiral configuration
    const ARM_COUNT = 4;
    const PARTICLES_PER_ARM = 60;
    const ROTATION_SPEED = (2 * Math.PI) / (30 * 60); // 1 full rotation per 30s at 60fps
    const TRAIL_LENGTH = 5;

    interface Particle {
      armIndex: number;
      indexInArm: number;
      baseAngle: number;
      radius: number;
      size: number;
      opacityPhase: number;
      opacitySpeed: number;
      trail: Array<{ x: number; y: number }>;
    }

    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles along spiral arms
    for (let arm = 0; arm < ARM_COUNT; arm++) {
      const armOffset = (arm / ARM_COUNT) * Math.PI * 2;
      for (let i = 0; i < PARTICLES_PER_ARM; i++) {
        const t = i / PARTICLES_PER_ARM; // 0..1 normalized position along arm
        const radius = 30 + t * Math.min(canvas.width, canvas.height) * 0.42;
        const spiralAngle = t * Math.PI * 2.5; // spiral tightness
        particles.push({
          armIndex: arm,
          indexInArm: i,
          baseAngle: spiralAngle + armOffset,
          radius,
          size: 1 + (1 - t) * 3 + Math.random() * 1, // inner particles larger (1-4px)
          opacityPhase: Math.random() * Math.PI * 2,
          opacitySpeed: 0.005 + Math.random() * 0.01,
          trail: [],
        });
      }
    }

    // Get particle color based on distance from center (inner=cyan, outer=purple)
    const getColor = (t: number, alpha: number): string => {
      // t: 0 = center, 1 = outer
      const inner = colors.cyan;
      const outer = colors.purple;
      const mid = colors.teal;
      let r: number, g: number, b: number;
      if (t < 0.5) {
        const s = t * 2;
        r = inner.r + (mid.r - inner.r) * s;
        g = inner.g + (mid.g - inner.g) * s;
        b = inner.b + (mid.b - inner.b) * s;
      } else {
        const s = (t - 0.5) * 2;
        r = mid.r + (outer.r - mid.r) * s;
        g = mid.g + (outer.g - mid.g) * s;
        b = mid.b + (outer.b - mid.b) * s;
      }
      return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
    };

    // Draw hexagonal grid pattern
    const drawHexGrid = () => {
      const hexSize = 40;
      const dx = hexSize * 1.5;
      const dy = hexSize * Math.sqrt(3);
      ctx.strokeStyle = 'rgba(124, 92, 255, 0.03)';
      ctx.lineWidth = 0.5;

      for (let row = -1; row < canvas.height / dy + 1; row++) {
        for (let col = -1; col < canvas.width / dx + 1; col++) {
          const cx = col * dx;
          const cy = row * dy + (col % 2 === 0 ? 0 : dy / 2);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const hx = cx + hexSize * Math.cos(angle);
            const hy = cy + hexSize * Math.sin(angle);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    };

    // Draw center glow
    const drawCenterGlow = (cx: number, cy: number) => {
      const maxR = Math.min(canvas.width, canvas.height) * 0.18;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.25)');
      gradient.addColorStop(0.2, 'rgba(6, 182, 212, 0.12)');
      gradient.addColorStop(0.5, 'rgba(124, 92, 255, 0.05)');
      gradient.addColorStop(1, 'rgba(124, 92, 255, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Bright core point
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGrad.addColorStop(0.3, 'rgba(0, 212, 255, 0.6)');
      coreGrad.addColorStop(1, 'rgba(0, 212, 255, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();
    };

    // Get current position of a particle
    const getParticlePos = (p: Particle, cx: number, cy: number) => {
      const angle = p.baseAngle + time * ROTATION_SPEED;
      const x = cx + p.radius * Math.cos(angle);
      const y = cy + p.radius * Math.sin(angle);
      return { x, y };
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw hex grid background
      drawHexGrid();

      // Draw center glow
      drawCenterGlow(cx, cy);

      // Update and draw particles
      const positions: Array<{ x: number; y: number; t: number; opacity: number; armIndex: number }> = [];

      for (const p of particles) {
        const pos = getParticlePos(p, cx, cy);
        const t = p.indexInArm / PARTICLES_PER_ARM; // 0=inner, 1=outer

        // Opacity oscillation
        const fadeBase = 0.15 + (1 - t) * 0.55; // inner brighter
        const fadeOsc = Math.sin(time * p.opacitySpeed + p.opacityPhase) * 0.2;
        const opacity = Math.max(0.05, Math.min(1, fadeBase + fadeOsc));

        // Update trail
        p.trail.push({ x: pos.x, y: pos.y });
        if (p.trail.length > TRAIL_LENGTH) p.trail.shift();

        // Draw trail
        for (let i = 0; i < p.trail.length - 1; i++) {
          const trailOpacity = (i / p.trail.length) * opacity * 0.4;
          ctx.beginPath();
          ctx.arc(p.trail[i].x, p.trail[i].y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = getColor(t, trailOpacity);
          ctx.fill();
        }

        // Draw particle glow
        const glowRadius = p.size * 3;
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowRadius);
        gradient.addColorStop(0, getColor(t, opacity * 0.5));
        gradient.addColorStop(1, getColor(t, 0));
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw particle core
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = getColor(t, opacity);
        ctx.fill();

        positions.push({ x: pos.x, y: pos.y, t, opacity, armIndex: p.armIndex });
      }

      // Draw connection lines between nearby particles on the same arm
      for (let arm = 0; arm < ARM_COUNT; arm++) {
        const armParticles = positions.filter(p => p.armIndex === arm);
        for (let i = 0; i < armParticles.length; i++) {
          for (let j = i + 1; j < armParticles.length; j++) {
            const dx = armParticles[i].x - armParticles[j].x;
            const dy = armParticles[i].y - armParticles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 60) {
              const lineOpacity = (1 - dist / 60) * 0.12 * Math.min(armParticles[i].opacity, armParticles[j].opacity);
              ctx.beginPath();
              ctx.strokeStyle = getColor(armParticles[i].t, lineOpacity);
              ctx.lineWidth = 0.5;
              ctx.moveTo(armParticles[i].x, armParticles[i].y);
              ctx.lineTo(armParticles[j].x, armParticles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      time++;
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
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
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
              {isLogin && (
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setForgotMessage(''); setForgotEmail(''); }}
                  className="text-xs text-agnes-cyan hover:underline mt-1.5 float-right"
                >
                  忘记密码?
                </button>
              )}
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

        {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="glass-strong rounded-2xl p-6 w-[360px] border border-agnes-border shadow-xl animate-fade-in">
              <h3 className="text-lg font-semibold text-agnes-text-primary mb-4">重置密码</h3>
              {forgotMessage ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    {forgotMessage}
                  </div>
                  <button
                    onClick={() => setShowForgot(false)}
                    className="w-full py-2 rounded-lg gradient-primary text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    返回登录
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-agnes-text-secondary">输入注册邮箱，我们将发送重置验证码</p>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-agnes-bg border border-agnes-border text-agnes-text-primary placeholder:text-agnes-text-muted focus:outline-none focus:border-agnes-purple/50 transition-colors"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowForgot(false)}
                      className="flex-1 py-2 rounded-lg border border-agnes-border text-agnes-text-secondary hover:bg-white/5 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={async () => {
                        if (!forgotEmail.trim()) return;
                        setForgotLoading(true);
                        try {
                          const res = await api.forgotPassword(forgotEmail);
                          if (res.error) {
                            setForgotMessage(res.error);
                          } else {
                            setForgotMessage('重置验证码已发送至您的邮箱，请查收');
                          }
                        } catch {
                          setForgotMessage('发送失败，请稍后重试');
                        } finally {
                          setForgotLoading(false);
                        }
                      }}
                      disabled={forgotLoading}
                      className="flex-1 py-2 rounded-lg gradient-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {forgotLoading ? '发送中...' : '发送验证码'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-agnes-text-muted mt-6">
          登录即表示同意 Agnes AI 服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
