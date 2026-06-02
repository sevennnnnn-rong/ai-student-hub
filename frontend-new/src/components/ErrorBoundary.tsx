import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="h-full flex items-center justify-center animate-fade-in">
          <div className="text-center glass rounded-2xl p-8 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-accent-danger/15 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-accent-danger" />
            </div>
            <h2 className="text-lg font-bold mb-2">页面出现错误</h2>
            <p className="text-text-muted text-sm mb-6">
              {this.state.error?.message || '发生了未知错误'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.href = '/'
                }}
                className="btn btn-ghost rounded-xl inline-flex items-center gap-2"
              >
                <Home size={14} />
                返回首页
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="btn btn-primary rounded-xl inline-flex items-center gap-2"
              >
                <RefreshCw size={14} />
                重新加载
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
