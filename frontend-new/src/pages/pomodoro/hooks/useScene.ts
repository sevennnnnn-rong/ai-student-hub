import { useState, useEffect, useCallback } from 'react'

const SCENE_STORAGE_KEY = 'pomodoro_scene'

export type SceneId =
  | 'rainy-window'
  | 'forest-cabin'
  | 'beach-study'
  | 'night-cafe'
  | 'starry-night'
  | 'warm-fireplace'
  | 'library'
  | 'deep-ocean'

export interface SceneConfig {
  id: SceneId
  name: string
  icon: string
  gradient: string
  accentColor: string
  particles: {
    type: string
    count: number
  }
}

export function useScene(scenes: SceneConfig[]) {
  const [currentSceneId, setCurrentSceneId] = useState<SceneId>(() => {
    try {
      const saved = localStorage.getItem(SCENE_STORAGE_KEY)
      if (saved && scenes.some((s) => s.id === saved)) return saved as SceneId
    } catch { /* ignore */ }
    return scenes[0]?.id ?? 'rainy-window'
  })

  const currentScene = scenes.find((s) => s.id === currentSceneId) ?? scenes[0]

  useEffect(() => {
    try {
      localStorage.setItem(SCENE_STORAGE_KEY, currentSceneId)
    } catch { /* ignore */ }
  }, [currentSceneId])

  const switchScene = useCallback((id: SceneId) => {
    setCurrentSceneId(id)
  }, [])

  const nextScene = useCallback(() => {
    const idx = scenes.findIndex((s) => s.id === currentSceneId)
    const next = (idx + 1) % scenes.length
    setCurrentSceneId(scenes[next].id)
  }, [scenes, currentSceneId])

  const prevScene = useCallback(() => {
    const idx = scenes.findIndex((s) => s.id === currentSceneId)
    const prev = (idx - 1 + scenes.length) % scenes.length
    setCurrentSceneId(scenes[prev].id)
  }, [scenes, currentSceneId])

  return {
    currentSceneId,
    currentScene,
    switchScene,
    nextScene,
    prevScene,
  }
}
