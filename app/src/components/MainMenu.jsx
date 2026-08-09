const PRODUCTS = [
  { key: 'general', title: 'Загальний Розрахунок', subtitle: 'Хто ви, куди йдете, ваш потенціал', price: 249, icon: '🔮' },
  { key: 'love', title: 'Кохання та Сумісність', subtitle: 'Ваша пара, роки стосунків, кармічні уроки', price: 349, icon: '💞' },
  { key: 'money', title: 'Гроші', subtitle: 'Як заробляти, де ваш фінансовий потенціал', price: 399, icon: '💰' },
]

const MainMenu = ({ user, onNavigate }) => {
  return (
    <div className="page-container">
      <div className="header">
        <h1>Привіт, {user.name} 👋</h1>
        <p>Оберіть свій нумерологічний розрахунок</p>
      </div>

      {PRODUCTS.map((product) => (
        <div key={product.key} className="product-card">
          <div style={{ fontSize: 28 }}>{product.icon}</div>
          <div className="product-title">{product.title}</div>
          <div className="product-subtitle">{product.subtitle}</div>
          <div className="product-price">{product.price} грн</div>
          <button
            onClick={() => onNavigate('product_' + product.key)}
            className="btn-primary product-cta"
          >
            Переглянути
          </button>
        </div>
      ))}

      <div className="bottom-nav">
        <button className="active" onClick={() => onNavigate('menu')}>🏠</button>
        <button onClick={() => onNavigate('profile')}>👤</button>
      </div>
    </div>
  )
}

export default MainMenu
