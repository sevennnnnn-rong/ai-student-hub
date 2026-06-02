import type { SceneId, SceneConfig } from '../hooks/useScene'

export const scenes: SceneConfig[] = [
  {
    id: 'rainy-window' as SceneId,
    name: '雨天窗边',
    icon: '🌧',
    gradient: 'linear-gradient(180deg, #1a1a2e 0%, #2d3748 100%)',
    accentColor: '#6b8cb5',
    particles: { type: 'rain', count: 40 },
  },
  {
    id: 'forest-cabin' as SceneId,
    name: '森林书屋',
    icon: '🌲',
    gradient: 'linear-gradient(180deg, #0d1f0d 0%, #1a3a1a 100%)',
    accentColor: '#4ade80',
    particles: { type: 'leaves', count: 25 },
  },
  {
    id: 'beach-study' as SceneId,
    name: '海边自习',
    icon: '🏖',
    gradient: 'linear-gradient(180deg, #2d2a1a 0%, #4a3f2a 100%)',
    accentColor: '#fbbf24',
    particles: { type: 'waves', count: 15 },
  },
  {
    id: 'night-cafe' as SceneId,
    name: '深夜咖啡馆',
    icon: '☕',
    gradient: 'linear-gradient(180deg, #1a1410 0%, #2a2015 100%)',
    accentColor: '#f59e0b',
    particles: { type: 'lights', count: 8 },
  },
  {
    id: 'starry-night' as SceneId,
    name: '星河夜空',
    icon: '✨',
    gradient: 'linear-gradient(180deg, #0a0a14 0%, #1a0a2e 100%)',
    accentColor: '#a78bfa',
    particles: { type: 'stars', count: 60 },
  },
  {
    id: 'warm-fireplace' as SceneId,
    name: '壁炉温暖',
    icon: '🔥',
    gradient: 'linear-gradient(180deg, #1a0a05 0%, #2a1510 100%)',
    accentColor: '#f97316',
    particles: { type: 'embers', count: 20 },
  },
  {
    id: 'library' as SceneId,
    name: '图书馆',
    icon: '📚',
    gradient: 'linear-gradient(180deg, #1a1815 0%, #2a2520 100%)',
    accentColor: '#d4a574',
    particles: { type: 'dust', count: 30 },
  },
  {
    id: 'deep-ocean' as SceneId,
    name: '深海静谧',
    icon: '🫧',
    gradient: 'linear-gradient(180deg, #0a0a1a 0%, #0a1520 100%)',
    accentColor: '#22d3ee',
    particles: { type: 'bubbles', count: 25 },
  },
]

export type { SceneConfig, SceneId }
