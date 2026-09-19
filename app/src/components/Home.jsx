import { useEffect, useState } from 'react'
import { API } from '../services/api'
import { calcLifePathLocal, lifePathLabel, PRODUCTS } from '../utils/numerology'

const WEEKDAYS = ['неділі', 'понеділка', 'вівторка', 'середи', 'четверга', 'п\'ятниці', 'суботи']
const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня']

const Home = ({ user, initialCalc, onOpenProduct, onOpenMyData, onOpenMyCalculations }) => {
  const [calc, setCalc] = useState(initialCalc || null)
  const [menuOpen, setMenuOpen] = useState(false)

  const lifePath = calcLifePathLocal(user.birthDate)
  const label = lifePathLabel(lifePath)

  useEffect(() => {
    if (calc || !user.birthDate) return
    fetch(API.generateCalculation, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.telegramId, segment: 'general', point: 'lifePath' }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setCalc(data))
      .catch(() => {})
  }, [calc, user])

  const today = new Date()
  const dateLabel = `${today.getDate()} ${MONTHS[today.getMonth()]}`
  const hour = today.getHours()
  const greet = hour < 12 ? 'Доброго ранку' : hour < 18 ? 'Доброго дня' : 'Доброго вечора'

  const horoscopeText = calc?.text
    ? calc.text.slice(0, 220) + (calc.text.length > 220 ? '…' : '')
    : 'Твій персональний код успіху вже готується. Це може зайняти кілька секунд.'

  return (
    <div className="screen home-screen">
      <div className="statusbar-spacer" />

      <div className="home-scroll">
        <div className="home-top">
          <div className="header-row">
            <div>
              <div className="greet">{greet}</div>
              <div className="name">{user.name || 'Друже'}</div>
              <div className="horo-label" onClick={onOpenMyCalculations}>Мої розрахунки</div>
            </div>
            <div className="header-right">
              <img className="header-logo" src="/logo-pink.png" alt="Numira" />
              <div className="date">{dateLabel}</div>
            </div>
          </div>

          <div className="id-card">
            <div className="num-badge">{lifePath ?? '?'}</div>
            <div className="id-text">
              <div className="id-label">Число долі</div>
              <div className="id-value">{lifePath ? `${lifePath} — ${label}` : 'Заповни дату народження'}</div>
              <div className="id-sub">Твоє призначення: служіння та вплив</div>
            </div>
          </div>

          <div className="horoscope-block">
            <div className="h-top">
              <div className="h-tag">Гороскоп на сьогодні</div>
              <div className="h-date">{dateLabel}</div>
            </div>
            <div className="h-title">Енергія дня</div>
            <div className="h-text">{horoscopeText}</div>
          </div>
        </div>

        <div className="scroll-label">Для тебе</div>
        <div className="scroller">
          <div className="card card-marathon">
            <div>
              <div className="card-tag">Друга воронка</div>
              <div className="card-title">Марафон успіху</div>
              <div className="card-desc">Скоро — програма для глибшої трансформації</div>
            </div>
            <div className="card-cta">Дізнатись →</div>
          </div>
          <div className="card card-numerolog">
            <div>
              <div className="card-tag">Консультація</div>
              <div className="card-title">Записатися на сеанс нумеролога</div>
              <div className="card-desc">Живе спілкування з фахівцем</div>
            </div>
            <div className="card-cta">Записатись →</div>
          </div>
        </div>

        <div className="article-block">
          <div className="article-tag">Чому це працює</div>
          <div className="article-title">Чому AI-розрахунок точніший за традиційний</div>
          <div className="article-desc">
            Класична нумерологія спирається на 2-3 базових числа. AI-модель одночасно
            аналізує десятки комбінацій — число долі, кармічні числа та їх взаємний вплив.
          </div>
          <div className="article-cta">Читати →</div>
        </div>
      </div>

      <div className="navbar">
        <div className="navitem active">
          <div className="navicon">🏠</div>
          <div className="navlabel">Головна</div>
        </div>
        <div className="navitem" onClick={onOpenMyData}>
          <div className="navicon">👤</div>
          <div className="navlabel">Мої дані</div>
        </div>
        <div className="dotsbtn" onClick={() => setMenuOpen(true)}>
          <span /><span /><span /><span /><span /><span /><span /><span /><span />
        </div>
        <div className="navitem" onClick={onOpenMyCalculations}>
          <div className="navicon">📊</div>
          <div className="navlabel">Розрахунки</div>
        </div>
      </div>

      <div className={`menu-overlay${menuOpen ? ' open' : ''}`}>
        <div className="menu-top">
          <div className="menu-title">Розрахувати</div>
          <div className="menu-close" onClick={() => setMenuOpen(false)}>✕</div>
        </div>
        <div className="menu-sub">Обери, що хочеш розшифрувати</div>
        <div className="menu-list">
          {PRODUCTS.map((p) => (
            <div key={p.id} className="menu-item" onClick={() => { setMenuOpen(false); onOpenProduct(p) }}>
              <div>
                <div className="menu-item-main">{p.title}</div>
                <div className="menu-item-sub">{p.desc}</div>
              </div>
              <div className="menu-item-right">
                <div className="price-row">
                  <span className="price-old">{p.priceOld} грн</span>
                  <span className="price-new">{p.priceNew} грн</span>
                </div>
                <div className="details-link">Дізнатися деталі →</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
