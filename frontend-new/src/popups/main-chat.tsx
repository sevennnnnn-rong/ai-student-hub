import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import PopupChat from './PopupChat'

createRoot(document.getElementById('root')!).render(
  <StrictMode><PopupChat /></StrictMode>
)
