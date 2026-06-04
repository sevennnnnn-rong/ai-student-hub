import { useState, useEffect, useRef } from 'react'
import PopupShell from './PopupShell'

const WORK_MIN = 25
const BREAK_MIN = 5
const RADIUS = 62
const STROKE = 6
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Scene {
  name: string
  icon: string
  gradient: string
}

const scenes: Scene[] = [
  { name: '默认', icon: '🌌', gradient: 'linear-gradient(135deg, #0f1117 0%, #1a1a2e 50%, #16213e 100%)' },
  { name: '海滩', icon: '🏖️', gradient: 'linear-gradient(135deg, #2c1810 0%, #5d3a1a 30%, #c9a227 70%, #e8d5a3 100%)' },
  { name: '星夜', icon: '🌙', gradient: 'linear-gradient(135deg, #0c0c2c 0%, #1a1a4c 40%, #3d2c8c 70%, #6a3d9a 100%)' },
  { name: '篝火', icon: '🔥', gradient: 'linear-gradient(135deg, #1a0a00 0%, #3d1a00 30%, #8b3a00 60%, #d46a00 100%)' },
]

export default function PopupPomodoro() {
  const [seconds, setSeconds] = useState(WORK_MIN * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [sessionCount, setSessionCount] = useState(1)
  const [sceneIndex, setSceneIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setIsRunning(false)
            if (!isBreak) {
              console.log(`🍅 第 ${sessionCount} 个番茄完成！休息一下吧~`)
              setSessionCount(c => c + 1)
              setIsBreak(true)
              return BREAK_MIN * 60
            } else {
              console.log(`☕ 休息结束，开始第 ${sessionCount} 个番茄！`)
              setIsBreak(false)
              return WORK_MIN * 60
            }
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, isBreak, sessionCount])

  const min = String(Math.floor(seconds / 60)).padStart(2, '0')
  const sec = String(seconds % 60).padStart(2, '0')
  const total = isBreak ? BREAK_MIN * 60 : WORK_MIN * 60
  const progress = ((total - seconds) / total) * 100
  const dashOffset = CIRCUMFERENCE * (1 - progress / 100)

  const handleReset = () => {
    setIsRunning(false)
    setIsBreak(false)
    setSeconds(WORK_MIN * 60)
  }

  const currentScene = scenes[sceneIndex]

  return (
    <PopupShell title="番茄钟" icon="🍅" accentColor="#C20C0C">
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: currentScene.gradient,
        padding: '20px 24px 16px',
        transition: 'background 0.6s ease',
        userSelect: 'none',
        justifyContent: 'space-between',
      }}>
        {/* Top spacer */}
        <div />

        {/* Status Text */}
        <div style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: 1,
        }}>
          {isBreak ? '☕ 休息时间' : '🎯 专注中'} · 第 {sessionCount} 个番茄
        </div>

        {/* Progress Ring */}
        <div style={{
          position: 'relative',
          width: 180,
          height: 180,
          margin: '16px 0',
        }}>
          <svg
            viewBox="0 0 140 140"
            style={{
              width: '100%', height: '100%',
              transform: 'rotate(-90deg)',
              filter: 'drop-shadow(0 0 12px rgba(194,12,12,0.3))',
            }}
          >
            {/* Background Ring */}
            <circle
              cx="70" cy="70" r={RADIUS}
              fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE}
            />
            {/* Progress Ring */}
            <circle
              cx="70" cy="70" r={RADIUS}
              fill="none" stroke="#C20C0C" strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease', filter: 'drop-shadow(0 0 6px rgba(194,12,12,0.5))' }}
            />
            {/* Glow */}
            {progress > 0 && (
              <circle
                cx="70" cy="70" r={RADIUS}
                fill="none" stroke="rgba(194,12,12,0.8)"
                strokeWidth={STROKE + 4} strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease', filter: 'blur(4px)', opacity: 0.6 }}
              />
            )}
          </svg>
          {/* Center Time */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', textAlign: 'center',
          }}>
            <div style={{
              fontSize: 38, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums', letterSpacing: 2,
              color: '#ffffff', textShadow: '0 0 20px rgba(194,12,12,0.4)',
            }}>
              {min}:{sec}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              {isBreak ? '即将开始' : '专注模式'}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setIsRunning(r => !r)}
            style={{
              padding: '10px 36px', borderRadius: 24, border: 'none',
              background: 'linear-gradient(135deg, #C20C0C 0%, #e63946 100%)',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(194,12,12,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              transition: 'all 0.2s ease', letterSpacing: 1,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(194,12,12,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(194,12,12,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          >
            {isRunning ? '⏸ 暂停' : '▶ 开始'}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '10px 24px', borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
            }}
          >
            ↺ 重置
          </button>
        </div>

        {/* Bottom: Scene Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', gap: 8, padding: '8px 14px', borderRadius: 20,
            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)',
          }}>
            {scenes.map((scene, index) => (
              <button
                key={scene.name}
                onClick={() => setSceneIndex(index)}
                title={scene.name}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: index === sceneIndex
                    ? '2px solid rgba(194,12,12,0.8)'
                    : '2px solid rgba(255,255,255,0.1)',
                  background: index === sceneIndex
                    ? 'rgba(194,12,12,0.2)'
                    : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  transform: index === sceneIndex ? 'scale(1.1)' : 'scale(1)',
                }}
                onMouseEnter={e => {
                  if (index !== sceneIndex) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={e => {
                  if (index !== sceneIndex) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {scene.icon}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            {currentScene.name}
          </div>
        </div>
      </div>
    </PopupShell>
  )
}
