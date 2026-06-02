import { useCallback, useEffect, useState } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useToast } from '../../components/Toast'
import { usePomodoro } from './hooks/usePomodoro'
import { useScene } from './hooks/useScene'
import { scenes } from './scenes'
import { ImmersiveTimer } from './components/ImmersiveTimer'
import { SceneSwitcher } from './components/SceneSwitcher'
import ToolBar from './components/ToolBar'

// Lazy-load scene components for code splitting
import { lazy, Suspense } from 'react'
const RainyWindow = lazy(() => import('./scenes/RainyWindow').then(m => ({ default: m.RainyWindow })))
const ForestCabin = lazy(() => import('./scenes/ForestCabin').then(m => ({ default: m.ForestCabin })))
const BeachStudy = lazy(() => import('./scenes/BeachStudy').then(m => ({ default: m.BeachStudy })))
const NightCafe = lazy(() => import('./scenes/NightCafe').then(m => ({ default: m.NightCafe })))
const StarryNight = lazy(() => import('./scenes/StarryNight').then(m => ({ default: m.StarryNight })))
const WarmFireplace = lazy(() => import('./scenes/WarmFireplace').then(m => ({ default: m.WarmFireplace })))
const Library = lazy(() => import('./scenes/Library').then(m => ({ default: m.Library })))
const DeepOcean = lazy(() => import('./scenes/DeepOcean').then(m => ({ default: m.DeepOcean })))

const SCENE_COMPONENTS: Record<string, React.LazyExoticComponent<React.FC>> = {
  'rainy-window': RainyWindow,
  'forest-cabin': ForestCabin,
  'beach-study': BeachStudy,
  'night-cafe': NightCafe,
  'starry-night': StarryNight,
  'warm-fireplace': WarmFireplace,
  'library': Library,
  'deep-ocean': DeepOcean,
}

export default function PomodoroImmersive() {
  const { toast } = useToast()
  usePageTitle('沉浸自习')

  const onNotify = useCallback(
    (msg: string, type: 'success' | 'info') => toast(msg, type),
    [toast]
  )

  const pomodoro = usePomodoro(onNotify)
  const { currentSceneId, currentScene, switchScene } = useScene(scenes)

  const [sceneVisible, setSceneVisible] = useState(true)

  // Transition scene background on change
  useEffect(() => {
    setSceneVisible(false)
    const timer = setTimeout(() => setSceneVisible(true), 50)
    return () => clearTimeout(timer)
  }, [currentSceneId])

  const SceneComponent = SCENE_COMPONENTS[currentSceneId]

  return (
    <div className="immersive-pomodoro">
      {/* Full-screen scene background */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: sceneVisible ? 1 : 0 }}
      >
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{ background: currentScene.gradient }}
        />
        {/* Scene particles */}
        <Suspense fallback={null}>
          {SceneComponent && <SceneComponent />}
        </Suspense>
      </div>

      {/* Scene switcher - top on desktop */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 hidden md:block">
        <SceneSwitcher
          scenes={scenes}
          currentSceneId={currentSceneId}
          onSwitch={switchScene}
          mode="desktop"
        />
      </div>

      {/* Centered timer */}
      <div className="relative z-10 flex items-center justify-center h-full pb-20 md:pb-0">
        <ImmersiveTimer
          minutes={pomodoro.minutes}
          secs={pomodoro.secs}
          progress={pomodoro.progress}
          isRunning={pomodoro.isRunning}
          isBreak={pomodoro.isBreak}
          isLongBreak={pomodoro.isLongBreak}
          cycleDots={pomodoro.cycleDots}
          accentColor={currentScene.accentColor}
          onToggle={pomodoro.toggle}
          onReset={pomodoro.reset}
        />
      </div>

      {/* Scene switcher - bottom on mobile */}
      <div className="md:hidden z-20">
        <SceneSwitcher
          scenes={scenes}
          currentSceneId={currentSceneId}
          onSwitch={switchScene}
          mode="mobile"
        />
      </div>

      {/* Floating tool bar */}
      <ToolBar
        sessions={pomodoro.sessions}
        dailyGoal={pomodoro.dailyGoal}
        onConfigChange={(config) => {
          pomodoro.setWorkMin(config.workMinutes)
          pomodoro.setBreakMin(config.breakMinutes)
          pomodoro.setLongBreakMin(config.longBreakMinutes)
          pomodoro.setDailyGoal(config.dailyGoal)
        }}
      />
    </div>
  )
}
