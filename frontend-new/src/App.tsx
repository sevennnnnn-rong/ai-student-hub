import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ParticleBackground from './components/ParticleBackground'
import CommandPalette from './components/CommandPalette'
import ShortcutsModal from './components/ShortcutsModal'
import FloatingActionButton from './components/FloatingActionButton'
import QuickNote from './components/QuickNote'
import LoadingBar from './components/LoadingBar'
import Onboarding from './components/Onboarding'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './hooks/useTheme'
import { FocusModeProvider } from './hooks/useFocusMode'
import { FullPageLoading } from './components/ui/LoadingStates'

const Home = lazy(() => import('./pages/Home'))
const Chat = lazy(() => import('./pages/Chat'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Pomodoro = lazy(() => import('./pages/Pomodoro'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Notes = lazy(() => import('./pages/Notes'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <FocusModeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <LoadingBar />
          <ParticleBackground />
          <CommandPalette />
          <ShortcutsModal />
          <FloatingActionButton />
          <QuickNote />
          <Onboarding />
          <div className="noise-overlay" />
          <Suspense fallback={<FullPageLoading />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/pomodoro" element={<Pomodoro />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </ToastProvider>
      </FocusModeProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
