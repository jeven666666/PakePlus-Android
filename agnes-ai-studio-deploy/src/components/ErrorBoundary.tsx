import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

function NavigateHomeButton() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/')}
      className="px-5 py-2.5 rounded-lg text-sm font-medium text-agnes-text-secondary hover:text-agnes-text-primary hover:bg-white/5 transition-colors"
    >
      返回首页
    </button>
  )
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-agnes-bg flex items-center justify-center p-4">
          <div className="glass-strong rounded-2xl p-8 border border-agnes-border max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-semibold text-agnes-text-primary mb-4">页面出错了</h1>
            {this.state.error && (
              <div className="mb-6 p-3 rounded-lg bg-agnes-bg border border-agnes-border text-left">
                <code className="text-sm text-red-400 break-words">{this.state.error.message}</code>
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] active:scale-[0.98] transition-all duration-200"
              >
                重新加载
              </button>
              <NavigateHomeButton />
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
