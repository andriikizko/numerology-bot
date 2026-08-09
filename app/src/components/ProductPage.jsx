import { useState, useEffect } from 'react'
import { API } from '../services/api'

const SEGMENT_META = {
  general: {
    title: 'Загальний Розрахунок',
    price: 249,
    points: [
      { key: 'lifePath', label: 'Число долі', free: true },
      { key: 'birthdayNumber', label: 'Число дня народження', free: false },
      { key: 'personalCycle', label: 'Персональний рік/місяць/день', free: false },
      { key: 'challengesPinnacles', label: 'Виклики і піки', free: false },
      { key: 'karmicDebt', label: 'Кармічні борги', free: false },
    ],
  },
  love: {
    title: 'Кохання та Сумісність',
    price: 349,
    points: [
      { key: 'compatibility', label: 'Число сумісності партнерів', free: true },
      { key: 'relationshipYears', label: 'Персональні роки стосунків', free: false },
      { key: 'relationshipMatrix', label: 'Матриця — сектор стосунків', free: false },
      { key: 'relationshipChallenges', label: 'Виклики у стосунках', free: false },
      { key: 'relationshipKarmicDebt', label: 'Кармічні борги пари', free: false },
    ],
  },
  money: {
    title: 'Гроші',
    price: 399,
    points: [
      { key: 'moneyFlow', label: 'Число грошового потоку', free: true },
      { key: 'wealthMatrix', label: 'Матриця багатства і кар\'єри', free: false },
      { key: 'financialKarmicDebt', label: 'Кармічні борги щодо фінансів', free: false },
      { key: 'financialYear', label: 'Персональний рік — фінансовий фокус', free: false },
      { key: 'financialChallenges', label: 'Виклики у фінансовому контексті', free: false },
    ],
  },
}

const ProductPage = ({ user, segment, onBack }) => {
  const meta = SEGMENT_META[segment]
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(null) // key пункту, що зараз рахується
  const [error, setError] = useState(null)
  const [purchased, setPurchased] = useState(user[`${segment}Purchased`] || false)
  const [paying, setPaying] = useState(false)

  const freePoint = meta.points.find((p) => p.free)

  useEffect(() => {
    // Автоматично рахуємо безкоштовний пункт при відкритті сторінки
    if (freePoint) fetchPoint(freePoint.key)
    // eslint-disable-next-line
  }, [])

  const fetchPoint = async (pointKey) => {
    setLoading(pointKey)
    setError(null)
    try {
      const response = await fetch(API.generateCalculation, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.telegramId, segment, point: pointKey })
      })
      const data = await response.json()

      if (response.status === 402) {
        setPurchased(false)
        return
      }
      if (!response.ok) {
        setError(data.error || 'Помилка розрахунку')
        return
      }
      setResults((prev) => ({ ...prev, [pointKey]: data.text }))
    } catch (err) {
      console.error(err)
      setError('Немає з\'єднання. Спробуйте ще раз.')
    } finally {
      setLoading(null)
    }
  }

  const handleUnlock = async () => {
    setPaying(true)
    try {
      const response = await fetch(API.createPayment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.telegramId, type: segment, amount: meta.price * 100 })
      })
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.paymentUrl
      }
    } catch (err) {
      console.error(err)
      setError('Помилка при створенні платежу')
    } finally {
      setPaying(false)
    }
  }

  const lockedPoints = meta.points.filter((p) => !p.free)

  return (
    <div className="page-container">
      <button onClick={onBack} className="btn-back">← Назад</button>

      <div className="header">
        <h1>{meta.title}</h1>
        <p>{meta.price} грн за повний розрахунок</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Безкоштовний пункт */}
      {freePoint && (
        <div className="calc-point">
          <div className="calc-point-title">{freePoint.label} 🆓</div>
          {loading === freePoint.key && <p className="calc-point-text">⏳ Рахуємо...</p>}
          {results[freePoint.key] && <p className="calc-point-text">{results[freePoint.key]}</p>}
        </div>
      )}

      {/* Платні пункти */}
      {!purchased && (
        <div className="calc-point locked">
          <span className="lock-label">🔒 Ще {lockedPoints.length} пунктів — розгорнутий розрахунок</span>
          <button onClick={handleUnlock} disabled={paying} className="unlock-cta">
            {paying ? '⏳...' : `Відкрити за ${meta.price} грн`}
          </button>
        </div>
      )}

      {purchased && lockedPoints.map((point) => (
        <div key={point.key} className="calc-point">
          <div className="calc-point-title">{point.label}</div>
          {results[point.key] ? (
            <p className="calc-point-text">{results[point.key]}</p>
          ) : (
            <button onClick={() => fetchPoint(point.key)} disabled={loading === point.key} className="btn-secondary">
              {loading === point.key ? '⏳ Рахуємо...' : 'Показати'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default ProductPage
