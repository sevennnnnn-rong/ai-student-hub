import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import PopupNotes from './PopupNotes'

createRoot(document.getElementById('root')!).render(
  <StrictMode><PopupNotes /></StrictMode>
)
