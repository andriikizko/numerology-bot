import { useState } from 'react'
import { API } from '../services/api'

// Кнопки "Отримати безкоштовно" і "Купити" — обидві звертаються до однієї й тієї
// самої Cloud Function generateCalculation, різниця лише в тому, який "point"
// (пункт розрахунку) передається. Перевірку доступу (безкоштовно/платно) робить
// сам бекенд.

const FREE_POINTS = {
  general: 'lifePath',
  love: 'compatibility',
  money: 'moneyFlow',
}

const ALL_POINTS = {
  general: ['lifePath', 'birthdayNumber', 'personalCycle', 'karmicDebt'],
  love: ['compatibility', 'relationshipYears', 'relationshipMatrix', 'relationshipChallenges', 'relationshipKarmicDebt'],
  money: ['moneyFlow', 'wealthMatrix', 'financialKarmicDebt', 'financialYear', 'financialChallenges'],
}

const CalculationButtons = ({ user, segment }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState({})
  const [needsPayment, setNeedsPayment] = useState(false)

  const fetchCalculation = async (point) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(API.generateCalculation, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.telegramId, segment, point })
      })

      const data = await response.json()

      if (response.status === 402) {
        setNeedsPayment(true)
        return null
      }
      if (!response.ok) {
        setError(data.error || 'Сталася помилка. Спробуйте ще раз.')
        return null
      }

      setResults((prev) => ({ ...prev, [point]: data }))
      return data
    } catch (err) {
      console.error('Помилка розрахунку:', err)
      setError('Немає з\'єднання. Перевірте інтернет і спробуйте ще раз.')
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleFreeClick = () => {
    fetchCalculation(FREE_POINTS[segment])
  }

  const handleBuyClick = async () => {
    for (const point of ALL_POINTS[segment]) {
      if (results[point]) continue
      const data = await fetchCalculation(point)
      if (!data) break // зупиняємось на помилці чи потребі оплати
    }
  }

  return (
    <div className="calculation-buttons">
      <button onClick={handleFreeClick} disabled={loading} className="btn-secondary">
        {loading ? '⏳ Рахуємо...' : 'Отримати безкоштовно'}
      </button>

      <button onClick={handleBuyClick} disabled={loading} className="btn-primary">
        {loading ? '⏳ Рахуємо...' : 'Купити повний розрахунок'}
      </button>

      {needsPayment && (
        <div className="payment-required">
          Для повного розрахунку потрібна оплата.
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {Object.entries(results).map(([point, data]) => (
        <div key={point} className="result-block">
          <p>{data.text}</p>
        </div>
      ))}
    </div>
  )
}

export default CalculationButtons
