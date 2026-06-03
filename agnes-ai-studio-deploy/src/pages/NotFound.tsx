import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-agnes-bg flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-[120px] font-bold leading-none gradient-text select-none">404</h1>
        <h2 className="text-2xl font-semibold text-agnes-text-primary mt-4 mb-2">页面未找到</h2>
        <p className="text-agnes-text-muted mb-8">你访问的页面不存在</p>
        <Link
          to="/"
          className="inline-flex px-6 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] active:scale-[0.98] transition-all duration-200"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
