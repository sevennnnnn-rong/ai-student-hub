import { useState, useRef, useEffect } from 'react'
import { X, Loader2, QrCode, Smartphone } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/Toast'
import {
  checkLoginStatus, getQrKey, createQrCode, checkQrStatus,
  loginWithPhone,
  type LoginProfile,
} from '../lib/netease-api'

type LoginMode = 'qr' | 'phone'

interface LoginModalProps {
  onSuccess: (profile: LoginProfile) => void
  onClose: () => void
}

export default function LoginModal({ onSuccess, onClose }: LoginModalProps) {
  const { toast } = useToast()
  const [mode, setMode] = useState<LoginMode>('qr')
  const [qrImg, setQrImg] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrExpired, setQrExpired] = useState(false)
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)

  useEffect(() => {
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current)
    }
  }, [])

  useEffect(() => {
    if (mode === 'qr') {
      startQrLogin()
    }
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current)
    }
  }, [mode])

  async function startQrLogin() {
    setQrLoading(true)
    setQrExpired(false)
    setQrImg('')
    if (qrPollRef.current) clearInterval(qrPollRef.current)

    try {
      const keyData = await getQrKey()
      const key = keyData.unikey

      const qrData = await createQrCode(key)
      setQrImg(qrData.qrimg)
      setQrLoading(false)

      qrPollRef.current = setInterval(async () => {
        try {
          const status = await checkQrStatus(key)
          console.log('[QR Poll]', status)
          if (status.code === 803) {
            if (qrPollRef.current) clearInterval(qrPollRef.current)
            await new Promise(r => setTimeout(r, 500))

            let loginStatus = { isLogin: false, profile: undefined as any }
            for (let attempt = 0; attempt < 3; attempt++) {
              loginStatus = await checkLoginStatus()
              console.log(`[QR Poll] loginStatus attempt ${attempt + 1}:`, loginStatus)
              if (loginStatus.isLogin && loginStatus.profile) break
              await new Promise(r => setTimeout(r, 500))
            }

            if (loginStatus.isLogin && loginStatus.profile) {
              toast('登录成功', 'success')
              onSuccess(loginStatus.profile)
            } else {
              console.error('[QR Poll] loginStatus check failed after retries:', loginStatus)
              toast('登录状态验证失败，请重试', 'error')
            }
          } else if (status.code === 800) {
            setQrExpired(true)
            if (qrPollRef.current) clearInterval(qrPollRef.current)
          }
        } catch (err) {
          console.error('[QR Poll] error:', err)
        }
      }, 2000)
    } catch (err) {
      setQrLoading(false)
      toast('获取二维码失败', 'error')
    }
  }

  async function handlePhoneLogin() {
    if (!phone.trim()) {
      toast('请输入手机号', 'error')
      return
    }
    setPhoneLoading(true)
    try {
      const result = await loginWithPhone(phone, password || undefined)
      if (result.isLogin && result.profile) {
        toast('登录成功', 'success')
        onSuccess(result.profile)
      } else {
        toast(result.message || '登录失败', 'error')
      }
    } catch (err) {
      toast('登录失败，请稍后重试', 'error')
    } finally {
      setPhoneLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[360px] max-w-[90vw] bg-bg-panel rounded-2xl border border-border shadow-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-text-primary">登录网易云音乐</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 p-1 bg-bg-tertiary rounded-xl mb-4">
          <button
            onClick={() => setMode('qr')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm transition-all',
              mode === 'qr'
                ? 'bg-accent-blue text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <QrCode size={14} />
            扫码登录
          </button>
          <button
            onClick={() => setMode('phone')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm transition-all',
              mode === 'phone'
                ? 'bg-accent-blue text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <Smartphone size={14} />
            手机号登录
          </button>
        </div>

        {/* QR Mode */}
        {mode === 'qr' && (
          <div className="flex flex-col items-center py-4">
            {qrLoading ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <Loader2 size={32} className="text-accent-blue animate-spin" />
              </div>
            ) : qrExpired ? (
              <div className="w-[200px] h-[200px] flex flex-col items-center justify-center gap-3">
                <QrCode size={48} className="text-text-muted" />
                <p className="text-sm text-text-muted">二维码已过期</p>
                <button onClick={startQrLogin} className="btn btn-primary btn-sm">
                  刷新二维码
                </button>
              </div>
            ) : qrImg ? (
              <div className="relative">
                <img
                  src={qrImg}
                  alt="QR Code"
                  className="w-[200px] h-[200px] rounded-xl"
                />
              </div>
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <QrCode size={48} className="text-text-muted" />
              </div>
            )}
            <p className="text-xs text-text-muted mt-3 text-center">
              打开网易云音乐APP扫码登录
            </p>
          </div>
        )}

        {/* Phone Mode */}
        {mode === 'phone' && (
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-text-muted mb-1 block">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="input-glass w-full py-2 px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">密码（可选，验证码登录留空）</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="input-glass w-full py-2 px-3 text-sm"
              />
            </div>
            <button
              onClick={handlePhoneLogin}
              disabled={phoneLoading || !phone.trim()}
              className="btn btn-primary w-full py-2.5 text-sm"
            >
              {phoneLoading ? (
                <Loader2 size={16} className="animate-spin mx-auto" />
              ) : (
                '登录'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
