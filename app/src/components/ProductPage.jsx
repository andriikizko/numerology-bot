import { useState } from 'react'
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

// Дати потрібні ЗАВЖДИ: своя + мами + тата. Для сегменту "love" — додатково дата партнера.
const ProductPage = ({ user, segment, onUserUpdate, onBack }) => {
  const meta = SEGMENT_META[segment]
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [purchased, setPurchased] = useState(user[`${segment}Purchased`] || false)
  const [paying, setPaying] = useState(false)
  const [started, setStarted] = useState(false)

  // Локальний стан форми збору дат — показується лише якщо в user їх ще немає
  const [birthDate, setBirthDate] = useState(user.birthDate || '')
  const [motherBirthDate, setMotherBirthDate] = useState(user.motherBirthDate || '')
  const [fatherBirthDate, setFatherBirthDate] = useState(user.fatherBirthDate || '')
  const [partnerBirthDate, setPartnerBirthDate] = useState(user.partnerBirthDate || '')
  const [savingDates, setSavingDates] = useState(false)

  const needsDates = !user.birthDate || !user.motherBirthDate || !user.fatherBirthDate
  const needsPartnerDate = segment === 'love' && !user.partnerBirthDate

  const freePoint = meta.points.find((p) => p.free)
  const lockedPoints = meta.points.filter((p) => !p.free)

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

  // Зберегти дати (своя+мама+тато, і партнер якщо love), потім одразу порахувати безкоштовний пункт
  const handleSaveDatesAndStart = async () => {
    if (!birthDate || !motherBirthDate || !fatherBirthDate) {
      setError('Заповніть усі 3 дати народження')
      return
    }
    if (segment === 'love' && !partnerBirthDate) {
      setError('Потрібна дата народження партнера')
      return
    }

    setSavingDates(true)
    setError(null)
    try {
      const updatedUser = {
        ...user,
        birthDate,
        motherBirthDate,
        fatherBirthDate,
        ...(segment === 'love' ? { partnerBirthDate } : {}),
      }
      const response = await fetch(API.registerUser, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      })
      if (response.ok) {
        onUserUpdate(updatedUser)
        setStarted(true)
        await fetchPoint(freePoint.key)
      } else {
        setError('Не вдалося зберегти дати. Спробуйте ще раз.')
      }
    } catch (err) {
      console.error(err)
      setError('Немає з\'єднання. Спробуйте ще раз.')
    } finally {
      setSavingDates(false)
    }
  }

  const handleStartWithSavedDates = async () => {
    setStarted(true)
    await fetchPoint(freePoint.key)
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

  return (
    <div className="page-container">
      <button onClick={onBack} className="btn-back">← Назад</button>

      <div className="header">
        <h1>{meta.title}</h1>
        <p>{meta.price} грн за повний розрахунок</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Форма збору дат — тільки якщо їх ще немає і розрахунок ще не запущено */}
      {!started && (needsDates || needsPartnerDate) && (
        <div className="form-step">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
            Для цього розрахунку потрібні дати народження:
          </p>
          {needsDates && (
            <>
              <label>Ваша дата народження</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              <label>Дата народження мами</label>
              <input type="date" value={motherBirthDate} onChange={(e) => setMotherBirthDate(e.target.value)} />
              <label>Дата народження тата</label>
              <input type="date" value={fatherBirthDate} onChange={(e) => setFatherBirthDate(e.target.value)} />
            </>
          )}
          {segment === 'love' && (
            <>
              <label>Дата народження партнера</label>
              <input type="date" value={partnerBirthDate} onChange={(e) => setPartnerBirthDate(e.target.value)} />
            </>
          )}
          <button onClick={handleSaveDatesAndStart} className="btn-primary" disabled={savingDates}>
            {savingDates ? '⏳ Рахуємо...' : 'Розрахувати →'}
          </button>
        </div>
      )}

      {/* Якщо дати вже є, але розрахунок ще не запускали цього разу — кнопка запуску */}
      {!started && !needsDates && !needsPartnerDate && (
        <button onClick={handleStartWithSavedDates} className="btn-primary" disabled={loading}>
          {loading ? '⏳ Рахуємо...' : 'Розрахувати →'}
        </button>
      )}

      {/* Безкоштовний пункт */}
      {started && freePoint && (
        <div className="calc-point">
          <div className="calc-point-title">{freePoint.label} 🆓</div>
          {loading === freePoint.key && <p className="calc-point-text">⏳ Рахуємо...</p>}
          {results[freePoint.key] && <p className="calc-point-text">{results[freePoint.key]}</p>}
        </div>
      )}

      {started && !purchased && (
        <div className="calc-point locked">
          <span className="lock-label">🔒 Ще {lockedPoints.length} пунктів — розгорнутий розрахунок</span>
          <button onClick={handleUnlock} disabled={paying} className="unlock-cta">
            {paying ? '⏳...' : `Відкрити за ${meta.price} грн`}
          </button>
        </div>
      )}

      {started && purchased && lockedPoints.map((point) => (
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
