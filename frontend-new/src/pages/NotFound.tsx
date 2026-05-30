import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="h-full flex flex-col items-center justify-center animate-fade-in">
      <div className="text-8xl font-bold gradient-text mb-4">404</div>
      <p className="text-text-secondary mb-8">页面不存在</p>
      <button
        onClick={() => navigate('/')}
        className="btn-primary flex items-center gap-2"
      >
        <Home size={16} />
        返回首页
      </button>
    </div>
  )
}
