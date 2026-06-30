import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import NetworkIndicator from './components/layout/NetworkIndicator'
import Footer from './components/layout/Footer'
import './components/pages/App.css'
import './PageTransition.css'

// Lazy-loaded page components — each route is a separate chunk
const Home = lazy(() => import('./components/pages/Home'))
const GamePage = lazy(() => import('./components/pages/GamePage'))
const DailyCharacter = lazy(() => import('./components/pages/DailyCharacter'))

function Page({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Page><Home /></Page>} />
            <Route path="/jugar" element={<Page><GamePage /></Page>} />
            <Route path="/del-dia" element={<Page><DailyCharacter /></Page>} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <NetworkIndicator />
      <Footer />
    </BrowserRouter>
  )
}
