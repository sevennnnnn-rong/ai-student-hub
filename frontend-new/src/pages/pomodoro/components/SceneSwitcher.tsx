import { memo } from 'react'
import { cn } from '../../../lib/utils'
import type { SceneConfig, SceneId } from '../hooks/useScene'

interface SceneSwitcherProps {
  scenes: SceneConfig[]
  currentSceneId: SceneId
  onSwitch: (id: SceneId) => void
  mode?: 'desktop' | 'mobile'
}

function SceneSwitcherInner({ scenes, currentSceneId, onSwitch, mode = 'desktop' }: SceneSwitcherProps) {
  if (mode === 'mobile') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
        <div className="glass rounded-t-2xl px-3 py-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {scenes.map((scene) => {
              const isActive = scene.id === currentSceneId
              return (
                <button
                  key={scene.id}
                  onClick={() => onSwitch(scene.id)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all duration-200 min-w-[52px]',
                    isActive
                      ? 'glass-active text-white'
                      : 'text-white/30 hover:text-white/60'
                  )}
                >
                  <span className="text-lg">{scene.icon}</span>
                  <span className="font-medium text-[10px]">{scene.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 glass rounded-2xl overflow-x-auto no-scrollbar">
      {scenes.map((scene) => {
        const isActive = scene.id === currentSceneId
        return (
          <button
            key={scene.id}
            onClick={() => onSwitch(scene.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm whitespace-nowrap transition-all duration-200',
              isActive
                ? 'glass-active text-white'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            )}
          >
            <span className="text-base">{scene.icon}</span>
            <span className="font-medium">{scene.name}</span>
          </button>
        )
      })}
    </div>
  )
}

export const SceneSwitcher = memo(SceneSwitcherInner)
