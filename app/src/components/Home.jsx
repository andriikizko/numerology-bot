import { useEffect, useState } from 'react'
import { API } from '../services/api'
import { calcLifePathLocal, lifePathLabel, PRODUCTS } from '../utils/numerology'
import { IconHome, IconPerson, IconChart, IconCard } from './icons'

const DEFAULT_CARDS = [
  {
    id: 'marathon', tag: 'Друга воронка', title: 'Марафон успіху',
    desc: 'Скоро — програма для глибшої трансформації', cta: 'Дізнатись',
    image: null, gradient: 'linear-gradient(135deg, #D64A7A 0%, #7a2a5a 55%, #3a1a40 100%)', overlayOpacity: 0,
  },
  {
    id: 'numerolog', tag: 'Консультація', title: 'Записатися на сеанс нумеролога',
    desc: 'Живе спілкування з фахівцем', cta: 'Записатись',
    image: null, gradient: 'linear-gradient(160deg, #4a3418 0%, #241c10 60%, #0d0d0d 100%)', overlayOpacity: 0,
  },
]

const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня']

const Home = ({ user, onOpenProduct, onOpenMyData, onOpenMyCalculations, onOpenSubscriptions }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cards, setCards] = useState(DEFAULT_CARDS)

  const lifePath = calcLifePathLocal(user.birthDate)
  const label = lifePathLabel(lifePath)

  useEffect(() => {
    fetch(API.getHomeCards)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.cards?.length) setCards(data.cards) })
      .catch(() => {})
  }, [])

  const today = new Date()
  const dateLabel = `${today.getDate()} ${MONTHS[today.getMonth()]}`

  const cardStyle = (card) => {
    if (card.image) {
      return {
        backgroundImage: card.overlayOpacity
          ? `linear-gradient(rgba(0,0,0,${card.overlayOpacity}), rgba(0,0,0,${card.overlayOpacity})), url(${card.image})`
          : `url(${card.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    return { background: card.gradient }
  }

  return (
    <div className="screen home-screen">
      <div className="statusbar-spacer" />

      <div className="home-scroll">
        <div className="home-top">
          <div className="header-row">
            <div>
              <div className="name">{user.name || 'Друже'}</div>
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
              <div className="h-tag">Щоденний гороскоп</div>
              <div className="h-date">Незабаром</div>
            </div>
            <div className="h-title">У розробці</div>
            <div className="h-text">
              Скоро тут з'явиться твій персональний нумерологічний гороскоп на кожен день.
            </div>
          </div>
        </div>

        <div className="scroll-label">Для тебе</div>
        <div className="scroller">
          {cards.map((card) => (
            <div key={card.id} className="card" style={cardStyle(card)}>
              <div>
                <div className="card-tag">{card.tag}</div>
                <div className="card-title">{card.title}</div>
                <div className="card-desc">{card.desc}</div>
              </div>
              <div className="card-cta">{card.cta} →</div>
            </div>
          ))}
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
          <div className="navicon"><IconHome /></div>
          <div className="navlabel">Головна</div>
        </div>
        <div className="navitem" onClick={onOpenMyData}>
          <div className="navicon"><IconPerson /></div>
          <div className="navlabel">Мої дані</div>
        </div>
        <div className="navitem" onClick={onOpenSubscriptions}>
          <div className="roundbtn"><IconCard /></div>
          <div className="navlabel">Підписка і оплати</div>
        </div>
        <div className="navitem" onClick={onOpenMyCalculations}>
          <div className="navicon"><IconChart /></div>
          <div className="navlabel">Мої розрахунки</div>
        </div>
        <div className="navitem" onClick={() => setMenuOpen(true)}>
          <div className="dotsbtn">
            <span /><span /><span /><span /><span /><span /><span /><span /><span />
          </div>
          <div className="navlabel">Замовити розрахунок</div>
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
                  <span className="price-badge">Акція</span>
                </div>
                <div className="price-new">{p.priceNew} грн</div>
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
