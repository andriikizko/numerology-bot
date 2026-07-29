import { useState, useEffect } from 'react'
import { API } from '../services/api'

const Today = ({ user, onBack }) => {
  const [horoscope, setHoroscope] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateHoroscope()
  }, [])

  const generateHoroscope = async () => {
    setLoading(true)
    try {
      // Виклик Gemini API для генерації щоденного гороскопу
      const today = new Date().toLocaleDateString('uk-UA')
      
      const response = await fetch(API.generateHoroscope, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: user.pathNumber,
          name: user.name,
          date: today
        })
      })

      if (response.ok) {
        const data = await response.json()
        setHoroscope(data.horoscope)
      }
    } catch (error) {
      console.error('Помилка генерації:', error)
      setHoroscope('❌ Помилка завантаження гороскопу. Спробуйте пізніше.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="header">
        <h1>📅 Гороскоп на сьогодні</h1>
        <p>{user.numberName} (число {user.pathNumber})</p>
      </div>

      <div className="content">
        {loading ? (
          <div className="loading">⏳ Генерація гороскопу...</div>
        ) : (
          <div className="horoscope-text">
            {horoscope}
          </div>
        )}
      </div>

      <button onClick={onBack} className="btn-back">
        ⬅️ Назад
      </button>
    </div>
  )
}

export default Today
