import { useState } from 'react'
import { API } from '../services/api'

const PersonalReport = ({ user, onBack }) => {
  const [loading, setLoading] = useState(false)
  const [purchased, setPurchased] = useState(user.reportPurchased)
  const [report, setReport] = useState(null)

  const handlePurchase = async () => {
    setLoading(true)
    try {
      // Створити платіж LiqPay
      const response = await fetch(API.createPayment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.telegramId,
          type: 'report',
          amount: 24900
        })
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.paymentUrl
      }
    } catch (error) {
      console.error('Помилка платежу:', error)
      alert('Помилка при створенні платежу')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    setLoading(true)
    try {
      const response = await fetch(API.generateReport, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: user.pathNumber,
          name: user.name,
          birthDate: user.birthDate
        })
      })

      if (response.ok) {
        const data = await response.json()
        setReport(data.report)
      }
    } catch (error) {
      console.error('Помилка:', error)
    } finally {
      setLoading(false)
    }
  }

  if (purchased && !report) {
    return (
      <div className="page-container">
        <div className="header">
          <h1>📊 Персональний Розрахунок</h1>
          <p>Детальний аналіз вашого числа долі</p>
        </div>

        <div className="content">
          <div className="report-preview">
            <h2>✅ Ви вже маєте доступ до повного розрахунку</h2>
            <button onClick={generateReport} className="btn-primary">
              {loading ? '⏳ Завантаження...' : 'Переглянути звіт'}
            </button>
          </div>
        </div>

        <button onClick={onBack} className="btn-back">
          ⬅️ Назад
        </button>
      </div>
    )
  }

  if (report) {
    return (
      <div className="page-container">
        <div className="header">
          <h1>📊 Ваш Персональний Розрахунок</h1>
        </div>

        <div className="content">
          <div className="report-text">
            {report}
          </div>
        </div>

        <button onClick={onBack} className="btn-back">
          ⬅️ Назад
        </button>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="header">
        <h1>📊 Персональний Розрахунок</h1>
      </div>

      <div className="content">
        <div className="report-card">
          <div className="price">249 грн</div>
          
          <ul className="features">
            <li>✅ Детальний аналіз вашого числа долі</li>
            <li>✅ Рекомендації для всіх сфер життя</li>
            <li>✅ Практичні поради розвитку</li>
            <li>✅ 30 днів гороскопу в подарунок</li>
          </ul>

          <button 
            onClick={handlePurchase}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '⏳ Обробка...' : '💳 Оплатити'}
          </button>
        </div>
      </div>

      <button onClick={onBack} className="btn-back">
        ⬅️ Назад
      </button>
    </div>
  )
}

export default PersonalReport
