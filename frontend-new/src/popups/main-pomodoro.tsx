import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import PopupPomodoro from './PopupPomodoro'

createRoot(document.getElementById('root')!).render(
  <StrictMode><PopupPomodoro /></StrictMode>
)
