import { useState, useEffect, useRef } from 'react'
import { API } from '../services/api'
import { jsPDF } from 'jspdf'

const SEGMENT_META = {
  general: {
    heroDesc: 'Повний нумерологічний портрет: число долі, персональний рік, кармічні уроки — база для всіх інших розрахунків.',
    points: [
      { key: 'lifePath', label: 'Число долі' },
      { key: 'birthdayNumber', label: 'Число дня народження' },
      { key: 'personalCycle', label: 'Персональний рік/місяць/день' },
      { key: 'challengesPinnacles', label: 'Виклики і піки' },
      { key: 'karmicDebt', label: 'Кармічні борги' },
    ],
  },
  love: {
    heroDesc: 'Сумісність за числами долі, персональні роки стосунків та кармічні уроки пари.',
    points: [
      { key: 'compatibility', label: 'Число сумісності партнерів' },
      { key: 'relationshipYears', label: 'Персональні роки стосунків' },
      { key: 'relationshipMatrix', label: 'Матриця — сектор стосунків' },
      { key: 'relationshipChallenges', label: 'Виклики у стосунках' },
      { key: 'relationshipKarmicDebt', label: 'Кармічні борги пари' },
    ],
  },
  money: {
    heroDesc: 'Грошовий потік, матриця багатства та фінансовий фокус персонального року.',
    points: [
      { key: 'moneyFlow', label: 'Число грошового потоку' },
      { key: 'wealthMatrix', label: 'Матриця багатства і кар\'єри' },
      { key: 'financialKarmicDebt', label: 'Кармічні борги щодо фінансів' },
      { key: 'financialYear', label: 'Персональний рік — фінансовий фокус' },
      { key: 'financialChallenges', label: 'Виклики у фінансовому контексті' },
    ],
  },
}

const SESSION_CAPTIONS = [
  'Аналізуємо число долі…',
  'Зіставляємо архетипи…',
  'Формуємо родовий код…',
  'Опрацьовуємо кармічні уроки…',
  'Синтезуємо фінальний висновок…',
]

const ProductDetail = ({ user, product, initialTarget, peopleVersion, onUserUpdate, onBack, onAddPerson }) => {
  const segment = product.segment
  const meta = segment ? SEGMENT_META[segment] : null

  const [people, setPeople] = useState([])
  const [target, setTarget] = useState(initialTarget || 'self')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [status, setStatus] = useState(null) // { purchased, sessionId, session }
  const [results, setResults] = useState(null)
  const [captionIndex, setCaptionIndex] = useState(0)

  const [motherBirthDate, setMotherBirthDate] = useState(user.motherBirthDate || '')
  const [fatherBirthDate, setFatherBirthDate] = useState(user.fatherBirthDate || '')
  const [partnerBirthDate, setPartnerBirthDate] = useState(user.partnerBirthDate || '')
  const [savingDates, setSavingDates] = useState(false)

  const [paying, setPaying] = useState(false)
  const [starting, setStarting] = useState(false)

  const pollRef = useRef(null)

  const currentPerson = target === 'self' ? null : people.find((p) => p.personId === target)
  const targetName = target === 'self' ? (user.name || 'Себе') : (currentPerson?.name || '')

  // Дані про людину, для якої рахуємо
  const activeDates = target === 'self'
    ? { birthDate: user.birthDate, motherBirthDate: user.motherBirthDate, fatherBirthDate: user.fatherBirthDate, partnerBirthDate: user.partnerBirthDate }
    : currentPerson
      ? { birthDate: currentPerson.birthDate, motherBirthDate: currentPerson.motherBirthDate, fatherBirthDate: currentPerson.fatherBirthDate, partnerBirthDate: currentPerson.partnerBirthDate }
      : null

  const needsFamilyDates = segment && activeDates && (!activeDates.motherBirthDate || !activeDates.fatherBirthDate)
  const needsPartnerDate = segment === 'love' && activeDates && !activeDates.partnerBirthDate

  // Завантажити список людей
  useEffect(() => {
    if (!segment) return
    fetch(`${API.getPeople}?userId=${user.telegramId}`)
      .then((r) => (r.ok ? r.json() : { people: [] }))
      .then((data) => setPeople(data.people || []))
      .catch(() => setPeople([]))
  }, [user.telegramId, segment, peopleVersion])

  // Завантажити статус (оплата + сесія) для обраної цілі
  const loadStatus = async () => {
    if (!segment) return
    setLoading(true)
    setError(null)
    try {
      const personParam = target !== 'self' ? `&personId=${target}` : ''
      const res = await fetch(`${API.getProductStatus}?userId=${user.telegramId}&segment=${segment}${personParam}`)
      const data = await res.json()
      setStatus(data)
      if (data.session?.status === 'ready') {
        loadResults()
      }
    } catch (err) {
      console.error(err)
      setError('Немає з\'єднання. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setResults(null)
    loadStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, segment])

  // Полінг статусу сесії, поки вона в процесі
  useEffect(() => {
    if (status?.session?.status === 'processing') {
      pollRef.current = setInterval(async () => {
        try {
          const personParam = target !== 'self' ? `&personId=${target}` : ''
          const res = await fetch(`${API.getProductStatus}?userId=${user.telegramId}&segment=${segment}${personParam}`)
          const data = await res.json()
          setStatus(data)
          if (data.session?.status === 'ready') {
            clearInterval(pollRef.current)
            loadResults()
          }
        } catch (err) {
          console.error(err)
        }
      }, 5000)
      return () => clearInterval(pollRef.current)
    }
  }, [status?.session?.status, target, segment, user.telegramId])

  // Ротація підписів під час очікування
  useEffect(() => {
    if (status?.session?.status !== 'processing') return
    const t = setInterval(() => setCaptionIndex((i) => (i + 1) % SESSION_CAPTIONS.length), 15000)
    return () => clearInterval(t)
  }, [status?.session?.status])

  const loadResults = async () => {
    try {
      const personParam = target !== 'self' ? `&personId=${target}` : ''
      const res = await fetch(`${API.getSessionResults}?userId=${user.telegramId}&segment=${segment}${personParam}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveDates = async () => {
    if (target === 'self') {
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
        } else {
          setError('Не вдалося зберегти дати. Спробуйте ще раз.')
        }
      } catch (err) {
        console.error(err)
        setError('Немає з\'єднання. Спробуйте ще раз.')
      } finally {
        setSavingDates(false)
      }
    } else {
      if (segment === 'love' && !partnerBirthDate) { setError('Потрібна дата народження партнера'); return }
      setSavingDates(true)
      setError(null)
      try {
        const response = await fetch(API.updatePerson, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.telegramId, personId: target, partnerBirthDate }),
        })
        if (response.ok) {
          setPeople((prev) => prev.map((p) => (p.personId === target ? { ...p, partnerBirthDate } : p)))
        } else {
          setError('Не вдалося зберегти дату. Спробуйте ще раз.')
        }
      } catch (err) {
        console.error(err)
        setError('Немає з\'єднання. Спробуйте ще раз.')
      } finally {
        setSavingDates(false)
      }
    }
  }

  const handlePay = async () => {
    setPaying(true)
    setError(null)
    try {
      const response = await fetch(API.createPayment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.telegramId, type: segment, amount: product.priceNew * 100 }),
      })
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.paymentUrl
      } else {
        setError('Помилка при створенні платежу')
      }
    } catch (err) {
      console.error(err)
      setError('Помилка при створенні платежу')
    } finally {
      setPaying(false)
    }
  }

  const handleStartSession = async () => {
    setStarting(true)
    setError(null)
    try {
      const response = await fetch(API.startSession, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.telegramId, segment, personId: target !== 'self' ? target : undefined }),
      })
      const data = await response.json()
      if (response.ok) {
        setStatus((prev) => ({ ...prev, session: { status: data.status, progress: 0 } }))
      } else {
        setError(data.error || 'Не вдалося розпочати сеанс')
      }
    } catch (err) {
      console.error(err)
      setError('Немає з\'єднання. Спробуйте ще раз.')
    } finally {
      setStarting(false)
    }
  }

  const handleDownloadPdf = () => {
    if (!results) return
    const doc = new jsPDF()
    const marginX = 15
    let y = 20
    const lineHeight = 6
    const pageHeight = doc.internal.pageSize.getHeight()

    doc.setFontSize(16)
    doc.text(`Numira — ${product.title}`, marginX, y)
    y += 10
    doc.setFontSize(10)
    doc.text(`Для: ${targetName}`, marginX, y)
    y += 10

    results.forEach((r) => {
      const pointMeta = meta.points.find((p) => p.key === r.point)
      doc.setFontSize(13)
      if (y > pageHeight - 20) { doc.addPage(); y = 20 }
      doc.text(pointMeta ? pointMeta.label : r.point, marginX, y)
      y += lineHeight + 2

      doc.setFontSize(10)
      const lines = doc.splitTextToSize(r.text || '', 180)
      lines.forEach((line) => {
        if (y > pageHeight - 15) { doc.addPage(); y = 20 }
        doc.text(line, marginX, y)
        y += lineHeight
      })
      y += 6
    })

    doc.save(`numira-${segment}-${target}.pdf`)
  }

  // ---------- Непідключений продукт ----------
  if (!segment) {
    return (
      <div className="screen product-detail-screen">
        <div className="pd-topbar"><div className="pd-back" onClick={onBack}>←</div></div>
        <div className="pd-scroll">
          <div className="pd-hero">
            <div className="pd-hero-tag">{product.title}</div>
            <div className="pd-hero-title">Скоро буде доступно</div>
            <div className="pd-hero-desc">{product.desc}. Ми готуємо цей розрахунок — слідкуй за оновленнями.</div>
          </div>
        </div>
        <div className="pd-bottombar">
          <button className="pd-cta" disabled>Незабаром</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen product-detail-screen">
      <div className="pd-topbar"><div className="pd-back" onClick={onBack}>←</div></div>

      <div className="pd-scroll">
        <div className="pd-hero">
          <div className="pd-hero-tag">{product.title}</div>
          <div className="pd-hero-title">{meta.heroDesc.split('.')[0]}</div>
          <div className="pd-hero-desc">{meta.heroDesc}</div>
        </div>

        {people.length > 0 && (
          <div className="target-select">
            <div
              className={`target-pill${target === 'self' ? ' active' : ''}`}
              onClick={() => setTarget('self')}
            >
              Собі
            </div>
            {people.map((p) => (
              <div
                key={p.personId}
                className={`target-pill${target === p.personId ? ' active' : ''}`}
                onClick={() => setTarget(p.personId)}
              >
                {p.name}
              </div>
            ))}
            <div className="target-pill target-pill-add" onClick={onAddPerson}>+ Додати</div>
          </div>
        )}
        {people.length === 0 && (
          <div className="target-select">
            <div className="target-pill active">Собі</div>
            <div className="target-pill target-pill-add" onClick={onAddPerson}>+ Розрахувати іншій людині</div>
          </div>
        )}

        <div className="pd-section">
          {error && <div className="reg-error">{error}</div>}

          {loading && <p className="pd-hint">⏳ Завантаження…</p>}

          {!loading && status?.session?.status === 'ready' && results && (
            <>
              {results.map((r) => {
                const pointMeta = meta.points.find((p) => p.key === r.point)
                return (
                  <div key={r.point} className="calc-point">
                    <div className="calc-point-title">{pointMeta ? pointMeta.label : r.point}</div>
                    <p className="calc-point-text">{r.text}</p>
                  </div>
                )
              })}
              <button className="pd-secondary-cta" onClick={handleDownloadPdf}>
                📄 Завантажити PDF
              </button>
            </>
          )}

          {!loading && status?.session?.status === 'processing' && (
            <div className="session-progress">
              <div className="session-progress-bar">
                <div className="session-progress-fill" style={{ width: `${status.session.progress || 0}%` }} />
              </div>
              <div className="session-caption">{SESSION_CAPTIONS[captionIndex]}</div>
              <div className="session-note">
                Розрахунок готується — це займає близько 7 хвилин. Можеш закрити застосунок,
                ми надішлемо лист на пошту, коли все буде готово.
              </div>
            </div>
          )}

          {!loading && !status?.purchased && needsFamilyDates && target === 'self' && (
            <div className="form-step">
              <p className="pd-hint">Для розрахунку потрібні дати народження:</p>
              <label className="field-label">Дата народження мами</label>
              <input className="reg-field" type="date" value={motherBirthDate} onChange={(e) => setMotherBirthDate(e.target.value)} />
              <label className="field-label">Дата народження тата</label>
              <input className="reg-field" type="date" value={fatherBirthDate} onChange={(e) => setFatherBirthDate(e.target.value)} />
              {segment === 'love' && (
                <>
                  <label className="field-label">Дата народження партнера</label>
                  <input className="reg-field" type="date" value={partnerBirthDate} onChange={(e) => setPartnerBirthDate(e.target.value)} />
                </>
              )}
              <button className="pd-secondary-cta" onClick={handleSaveDates} disabled={savingDates}>
                {savingDates ? '⏳ Збереження…' : 'Зберегти дати'}
              </button>
            </div>
          )}

          {!loading && !status?.purchased && needsPartnerDate && !needsFamilyDates && (
            <div className="form-step">
              <p className="pd-hint">Для сегменту "Кохання" потрібна дата народження партнера:</p>
              <label className="field-label">Дата народження партнера</label>
              <input className="reg-field" type="date" value={partnerBirthDate} onChange={(e) => setPartnerBirthDate(e.target.value)} />
              <button className="pd-secondary-cta" onClick={handleSaveDates} disabled={savingDates}>
                {savingDates ? '⏳ Збереження…' : 'Зберегти дату'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pd-bottombar">
        {!status?.purchased && !loading && (
          <>
            <div className="pd-price-line">
              <span className="price-old">{product.priceOld} грн</span>
              <span className="pd-price-new">{product.priceNew} грн</span>
              <span className="price-badge">Акція</span>
            </div>
            <button
              className="pd-cta"
              onClick={handlePay}
              disabled={paying || needsFamilyDates || (needsPartnerDate && !needsFamilyDates)}
            >
              {paying ? '⏳…' : 'Оплатити та почати сеанс'}
            </button>
          </>
        )}

        {status?.purchased && status?.session?.status === 'ready' && (
          <button className="pd-cta" disabled>Сеанс завершено ✓</button>
        )}

        {status?.purchased && status?.session?.status === 'processing' && (
          <button className="pd-cta" disabled>Сеанс триває…</button>
        )}

        {status?.purchased && (!status?.session || status.session.status === 'error') && (
          <button className="pd-cta" onClick={handleStartSession} disabled={starting}>
            {starting ? '⏳ Запуск…' : '✨ Почати сеанс'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductDetail
