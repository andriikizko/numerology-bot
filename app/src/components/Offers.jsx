import { useState } from 'react'
import { API } from '../services/api'

const Offers = ({ user, onBack }) => {
  const [loading, setLoading] = useState(false)

  const getHoroscopePrice = () => {
    return user.reportPurchased ? 30 : 50
  }

  const getTrialDaysLeft = () => {
    const trialEnd = new Date(user.trialUntil)
    const now = new Date()
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))
    return Math.max(0, daysLeft)
  }

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const price = getHoroscopePrice()
      const response = await fetch(API.createPayment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.telegramId,
          type: 'horoscope',
          amount: price * 100
        })
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.paymentUrl
      }
    } catch (error) {
      console.error('Помилка:', error)
      alert('Помилка при створенні платежу')
    } finally {
      setLoading(false)
    }
  }

  const trialDays = getTrialDaysLeft()
  const price = getHoroscopePrice()
  const isTrialActive = trialDays > 0

  return (
    <div className="page-container">
      <div className="header">
        <h1>✨ Спеціальні Пропозиції</h1>
      </div>

      <div className="content">
        <div className="offer-card">
          <div className="offer-title">📅 Щоденний Гороскоп</div>
          
          <div className="offer-details">
            <p>📧 Отримуйте персональний гороскоп о 08:00</p>
            <p>🔄 Автоматичне поновлення щомісяця</p>
            <p>🎁 Перші 7 днів безкоштовно</p>
          </div>

          <div className="status-box">
            {isTrialActive ? (
              <>
                <div className="status-badge trial">🎁 Пробний період</div>
                <p>Активний: {trialDays} днів</p>
              </>
            ) : (
              <>
                <div className="status-badge inactive">Період закінчився</div>
                <p>Активуйте підписку</p>
              </>
            )}
          </div>

          <div className="price-box">
            <div className="price">{price} грн/місяць</div>
            <p className="price-note">
              {user.reportPurchased 
                ? '💚 Ціна для постійних користувачів' 
                : 'Нова ціна'}
            </p>
          </div>

          <button 
            onClick={handleSubscribe}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '⏳ Обробка...' : '📅 Активувати'}
          </button>
        </div>
      </div>

      <button onClick={onBack} className="btn-back">
        ⬅️ Назад
      </button>
    </div>
  )
}

export default Offers
