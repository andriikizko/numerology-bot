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
    // Telegram Web App API (якщо відкрито в Telegram)
    const tg = window.Telegram?.WebApp
    let userId = null

    if (tg && tg.initDataUnsafe?.user) {
      tg.expand()
      tg.ready()
      userId = tg.initDataUnsafe.user.id
    } else {
      // Веб-режим: беремо ID з localStorage (для тестування поза Telegram)
      userId = localStorage.getItem('numerology_user_id')
    }

    if (userId) {
      loadUserData(userId)
    } else {
      setLoading(false)
    }

    // Оновлюємо дані користувача, коли повертаються на вкладку (наприклад, після оплати)
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
    // Зберігаємо ID локально, щоб не втратити доступ при перезаході (веб-режим)
    localStorage.setItem('numerology_user_id', String(userData.telegramId))
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
