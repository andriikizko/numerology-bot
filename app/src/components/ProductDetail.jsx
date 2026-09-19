import { useState } from 'react'
import { API } from '../services/api'

const SEGMENT_META = {
  general: {
    heroDesc: 'Повний нумерологічний портрет: число долі, персональний рік, кармічні уроки — база для всіх інших розрахунків.',
    points: [
      { key: 'lifePath', label: 'Число долі', free: true },
      { key: 'birthdayNumber', label: 'Число дня народження', free: false },
      { key: 'personalCycle', label: 'Персональний рік/місяць/день', free: false },
      { key: 'challengesPinnacles', label: 'Виклики і піки', free: false },
      { key: 'karmicDebt', label: 'Кармічні борги', free: false },
    ],
  },
  love: {
    heroDesc: 'Сумісність за числами долі, персональні роки стосунків та кармічні уроки пари.',
    points: [
      { key: 'compatibility', label: 'Число сумісності партнерів', free: true },
      { key: 'relationshipYears', label: 'Персональні роки стосунків', free: false },
      { key: 'relationshipMatrix', label: 'Матриця — сектор стосунків', free: false },
      { key: 'relationshipChallenges', label: 'Виклики у стосунках', free: false },
      { key: 'relationshipKarmicDebt', label: 'Кармічні борги пари', free: false },
    ],
  },
  money: {
    heroDesc: 'Грошовий потік, матриця багатства та фінансовий фокус персонального року.',
    points: [
      { key: 'moneyFlow', label: 'Число грошового потоку', free: true },
      { key: 'wealthMatrix', label: 'Матриця багатства і кар\'єри', free: false },
      { key: 'financialKarmicDebt', label: 'Кармічні борги щодо фінансів', free: false },
      { key: 'financialYear', label: 'Персональний рік — фінансовий фокус', free: false },
      { key: 'financialChallenges', label: 'Виклики у фінансовому контексті', free: false },
    ],
  },
}

const ProductDetail = ({ user, product, onUserUpdate, onBack }) => {
  const segment = product.segment
  const meta = segment ? SEGMENT_META[segment] : null

  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [purchased, setPurchased] = useState(user[`${segment}Purchased`] || false)
  const [paying, setPaying] = useState(false)
  const [started, setStarted] = useState(false)

  const [motherBirthDate, setMotherBirthDate] = useState(user.motherBirthDate || '')
  const [fatherBirthDate, setFatherBirthDate] = useState(user.fatherBirthDate || '')
  const [partnerBirthDate, setPartnerBirthDate] = useState(user.partnerBirthDate || '')
  const [savingDates, setSavingDates] = useState(false)

  const needsFamilyDates = segment && (!user.motherBirthDate || !user.fatherBirthDate)
  const needsPartnerDate = segment === 'love' && !user.partnerBirthDate

  const freePoint = meta?.points.find((p) => p.free)
  const lockedPoints = meta?.points.filter((p) => !p.free) || []

  const fetchPoint = async (pointKey) => {
    setLoading(pointKey)
    setError(null)
    try {
      const response = await fetch(API.generateCalculation, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.telegramId, segment, point: pointKey }),
      })
      const data = await response.json()
      if (response.status === 402) { setPurchased(false); return }
      if (!response.ok) { setError(data.error || 'Помилка розрахунку'); return }
      setResults((prev) => ({ ...prev, [pointKey]: data.text }))
    } catch (err) {
      console.error(err)
      setError('Немає з\'єднання. Спробуйте ще раз.')
    } finally {
      setLoading(null)
    }
  }

  const handleSaveDatesAndStart = async () => {
    if (!user.birthDate) { setError('Спочатку заповни свою дату народження в опитуванні'); return }
    if (!motherBirthDate || !fatherBirthDate) { setError('Заповніть дати народження мами і тата'); return }
    if (segment === 'love' && !partnerBirthDate) { setError('Потрібна дата народження партнера'); return }

    setSavingDates(true)
    setError(null)
    try {
      const updatedUser = { ...user, motherBirthDate, fatherBirthDate, ...(segment === 'love' ? { partnerBirthDate } : {}) }
      const response = await fetch(API.registerUser, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
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
        body: JSON.stringify({ userId: user.telegramId, type: segment, amount: product.priceNew * 100 }),
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
    <div className="screen product-detail-screen">
      <div className="pd-topbar">
        <div className="pd-back" onClick={onBack}>←</div>
      </div>

      <div className="pd-scroll">
        <div className="pd-hero">
          <div className="pd-hero-tag">{product.title}</div>
          <div className="pd-hero-title">{segment ? meta.heroDesc.split('.')[0] : 'Скоро буде доступно'}</div>
          <div className="pd-hero-desc">{segment ? meta.heroDesc : `${product.desc}. Ми готуємо цей розрахунок — слідкуй за оновленнями.`}</div>
        </div>

        {!segment && (
          <div className="pd-section">
            <div className="pd-section-title">Що буде в цьому розрахунку</div>
            <div className="pd-point"><div className="pd-dot" /><div className="pd-point-text">{product.desc}</div></div>
            <div className="pd-point"><div className="pd-dot" /><div className="pd-point-text">Детальний AI-розбір за твоєю датою народження</div></div>
            <div className="pd-point"><div className="pd-dot" /><div className="pd-point-text">Готовий висновок з практичними порадами</div></div>
          </div>
        )}

        {segment && (
          <div className="pd-section">
            {error && <div className="reg-error">{error}</div>}

            {!started && (needsFamilyDates || needsPartnerDate) && (
              <div className="form-step">
                <p className="pd-hint">Для цього розрахунку потрібні дати народження:</p>
                {needsFamilyDates && (
                  <>
                    <label className="field-label">Дата народження мами</label>
                    <input className="reg-field" type="date" value={motherBirthDate} onChange={(e) => setMotherBirthDate(e.target.value)} />
                    <label className="field-label">Дата народження тата</label>
                    <input className="reg-field" type="date" value={fatherBirthDate} onChange={(e) => setFatherBirthDate(e.target.value)} />
                  </>
                )}
                {segment === 'love' && (
                  <>
                    <label className="field-label">Дата народження партнера</label>
                    <input className="reg-field" type="date" value={partnerBirthDate} onChange={(e) => setPartnerBirthDate(e.target.value)} />
                  </>
                )}
                <button className="pd-secondary-cta" onClick={handleSaveDatesAndStart} disabled={savingDates}>
                  {savingDates ? '⏳ Рахуємо...' : 'Розрахувати →'}
                </button>
              </div>
            )}

            {!started && !needsFamilyDates && !needsPartnerDate && (
              <button className="pd-secondary-cta" onClick={handleStartWithSavedDates} disabled={loading}>
                {loading ? '⏳ Рахуємо...' : 'Розрахувати →'}
              </button>
            )}

            {started && freePoint && (
              <div className="calc-point">
                <div className="calc-point-title">{freePoint.label} 🆓</div>
                {loading === freePoint.key && <p className="calc-point-text">⏳ Рахуємо...</p>}
                {results[freePoint.key] && <p className="calc-point-text">{results[freePoint.key]}</p>}
              </div>
            )}

            {started && !purchased && (
              <div className="calc-point locked">
                <span className="lock-label">🔒 Ще {lockedPoints.length} пунктів у повному розрахунку</span>
              </div>
            )}

            {started && purchased && lockedPoints.map((point) => (
              <div key={point.key} className="calc-point">
                <div className="calc-point-title">{point.label}</div>
                {results[point.key] ? (
                  <p className="calc-point-text">{results[point.key]}</p>
                ) : (
                  <button className="pd-secondary-cta" onClick={() => fetchPoint(point.key)} disabled={loading === point.key}>
                    {loading === point.key ? '⏳ Рахуємо...' : 'Показати'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pd-bottombar">
        <div className="pd-price-line">
          <span className="price-old">{product.priceOld} грн</span>
          <span className="pd-price-new">{product.priceNew} грн</span>
          <span className="price-badge">Акція</span>
        </div>
        {segment ? (
          !purchased ? (
            <button className="pd-cta" onClick={handleUnlock} disabled={paying}>
              {paying ? '⏳...' : 'Оплатити та почати сеанс'}
            </button>
          ) : (
            <button className="pd-cta" disabled>Уже придбано ✓</button>
          )
        ) : (
          <button className="pd-cta" disabled>Незабаром</button>
        )}
      </div>
    </div>
  )
}

export default ProductDetail
