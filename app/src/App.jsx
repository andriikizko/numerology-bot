import { useState, useEffect } from 'react'
import MainMenu from './components/MainMenu'
import Today from './components/Today'
import PersonalReport from './components/PersonalReport'
import Offers from './components/Offers'
import Profile from './components/Profile'
import Registration from './components/Registration'
import { API } from './services/api'

const App = () => {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('registration')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Telegram Web App API
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.expand()
      tg.ready()
      
      const userData = tg.initDataUnsafe?.user
      if (userData) {
        loadUserData(userData.id)
      } else {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const loadUserData = async (telegramId) => {
    try {
      const response = await fetch(`${API.getUser}?id=${telegramId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data)
        setCurrentPage('menu')
      }
    } catch (error) {
      console.error('Помилка завантаження:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegistration = (userData) => {
    setUser(userData)
    setCurrentPage('menu')
  }

  if (loading) {
    return <div className="loading">⏳ Завантаження...</div>
  }

  if (!user) {
    return <Registration onRegister={handleRegistration} />
  }

  return (
    <div className="app-container">
      {currentPage === 'menu' && <MainMenu user={user} onNavigate={setCurrentPage} />}
      {currentPage === 'today' && <Today user={user} onBack={() => setCurrentPage('menu')} />}
      {currentPage === 'report' && <PersonalReport user={user} onBack={() => setCurrentPage('menu')} />}
      {currentPage === 'offers' && <Offers user={user} onBack={() => setCurrentPage('menu')} />}
      {currentPage === 'profile' && <Profile user={user} onBack={() => setCurrentPage('menu')} />}
    </div>
  )
}

export default App
