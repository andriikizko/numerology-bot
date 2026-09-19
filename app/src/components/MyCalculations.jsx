import { PRODUCTS } from '../utils/numerology'

const MyCalculations = ({ onOpenProduct, onBack }) => {
  const wired = PRODUCTS.filter((p) => p.segment)

  return (
    <div className="screen product-detail-screen">
      <div className="pd-topbar">
        <div className="pd-back" onClick={onBack}>←</div>
      </div>
      <div className="pd-scroll">
        <div className="pd-hero">
          <div className="pd-hero-tag">Архів</div>
          <div className="pd-hero-title">Мої розрахунки</div>
          <div className="pd-hero-desc">Тут зберігаються всі твої відкриті сесії</div>
        </div>
        <div className="pd-section">
          {wired.map((p) => (
            <div key={p.id} className="menu-item" onClick={() => onOpenProduct(p)}>
              <div>
                <div className="menu-item-main">{p.title}</div>
                <div className="menu-item-sub">{p.desc}</div>
              </div>
              <div className="details-link">Відкрити →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MyCalculations
