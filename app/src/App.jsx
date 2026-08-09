import { useState, useEffect } from 'react'
import MainMenu from './components/MainMenu'
import ProductPage from './components/ProductPage'
import Profile from './components/Profile'
import Registration from './components/Registration'
import { API } from './services/api'

const App = () => {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('registration')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    let userId = null

    if (tg && tg.initDataUnsafe?.user) {
      tg.expand()
      tg.ready()
      userId = tg.initDataUnsafe.user.id
    } else {
      userId = localStorage.getItem('numerology_user_id')
    }

    if (userId) {
      loadUserData(userId)
    } else {
      setLoading(false)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userId) {
        loadUserData(userId)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const loadUserData = async (userId) => {
    try {
      const response = await fetch(`${API.getUser}?id=${userId}`)
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
    localStorage.setItem('numerology_user_id', String(userData.telegramId))
    setUser(userData)
    setCurrentPage('menu')
  }

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser)
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
      {currentPage === 'product_general' && (
        <ProductPage user={user} segment="general" onUserUpdate={handleUserUpdate} onBack={() => setCurrentPage('menu')} />
      )}
      {currentPage === 'product_love' && (
        <ProductPage user={user} segment="love" onUserUpdate={handleUserUpdate} onBack={() => setCurrentPage('menu')} />
      )}
      {currentPage === 'product_money' && (
        <ProductPage user={user} segment="money" onUserUpdate={handleUserUpdate} onBack={() => setCurrentPage('menu')} />
      )}
      {currentPage === 'profile' && <Profile user={user} onBack={() => setCurrentPage('menu')} />}
    </div>
  )
}

export default App
