import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <AlertTriangle size={32} className="text-accent-orange mb-3" />
          <h3 className="text-sm font-medium text-text-primary mb-1">
            {this.props.fallbackTitle || '组件出错了'}
          </h3>
          <p className="text-xs text-text-muted mb-4 max-w-[240px]">
            {this.state.error?.message || '发生未知错误'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/10 text-accent-blue text-xs hover:bg-accent-blue/20 transition-colors"
          >
            <RefreshCw size={12} />
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
