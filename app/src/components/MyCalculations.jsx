import { useState, useEffect } from 'react'
import { API } from '../services/api'
import { PRODUCTS } from '../utils/numerology'

const MyCalculations = ({ user, onOpenProduct, onBack }) => {
  const [calculations, setCalculations] = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'self' | personId

  useEffect(() => {
    Promise.all([
      fetch(`${API.getCalculations}?userId=${user.telegramId}`).then((r) => (r.ok ? r.json() : { calculations: [] })),
      fetch(`${API.getPeople}?userId=${user.telegramId}`).then((r) => (r.ok ? r.json() : { people: [] })),
    ])
      .then(([calcData, peopleData]) => {
        setCalculations(calcData.calculations || [])
        setPeople(peopleData.people || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user.telegramId])

  const personName = (personId) => {
    if (!personId) return user.name || 'Себе'
    return people.find((p) => p.personId === personId)?.name || 'Інша людина'
  }

  const filtered = calculations.filter((c) => {
    if (filter === 'all') return true
    if (filter === 'self') return !c.personId
    return c.personId === filter
  })

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="screen product-detail-screen">
      <div className="pd-topbar"><div className="pd-back" onClick={onBack}>←</div></div>
      <div className="pd-scroll">
        <div className="pd-hero">
          <div className="pd-hero-tag">Архів</div>
          <div className="pd-hero-title">Мої розрахунки</div>
          <div className="pd-hero-desc">Тут зберігаються всі завершені сесії</div>
        </div>

        {people.length > 0 && (
          <div className="target-select">
            <div className={`target-pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Усі</div>
            <div className={`target-pill${filter === 'self' ? ' active' : ''}`} onClick={() => setFilter('self')}>Мої</div>
            {people.map((p) => (
              <div key={p.personId} className={`target-pill${filter === p.personId ? ' active' : ''}`} onClick={() => setFilter(p.personId)}>
                {p.name}
              </div>
            ))}
          </div>
        )}

        <div className="pd-section">
          {loading && <p className="pd-hint">⏳ Завантаження…</p>}
          {!loading && filtered.length === 0 && <p className="pd-hint">Поки що немає завершених розрахунків.</p>}
          {filtered.map((c) => {
            const product = PRODUCTS.find((p) => p.segment === c.segment)
            if (!product) return null
            return (
              <div
                key={c.sessionId}
                className="menu-item"
                onClick={() => onOpenProduct(product, c.personId || null)}
              >
                <div>
                  <div className="menu-item-main">{product.title}</div>
                  <div className="menu-item-sub">{personName(c.personId)} · {formatDate(c.completedAt)}</div>
                </div>
                <div className="details-link">Відкрити →</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MyCalculations
