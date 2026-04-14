import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  const [page, setPage] = useState('landing') // 'landing' | 'dashboard'

  if (page === 'dashboard') {
    return <DashboardPage onBack={() => setPage('landing')} />
  }
  return <LandingPage onStart={() => setPage('dashboard')} />
}
