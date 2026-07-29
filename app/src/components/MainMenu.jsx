const MainMenu = ({ user, onNavigate }) => {
  const menuItems = [
    { id: 'today', icon: '📅', label: 'Сьогодні', description: 'Щоденний гороскоп' },
    { id: 'report', icon: '📊', label: 'Розрахунок', description: '249 грн' },
    { id: 'offers', icon: '✨', label: 'Пропозиції', description: 'Гороскоп' },
    { id: 'profile', icon: '👤', label: 'Профіль', description: 'Мої дані' }
  ]

  return (
    <div className="menu-container">
      <div className="header">
        <h1>🌟 Вітаємо, {user.name}!</h1>
        <p>Число долі: {user.pathNumber} ({user.numberName})</p>
      </div>

      <div className="menu-grid">
        {menuItems.map(item => (
          <button
            key={item.id}
            className="menu-button"
            onClick={() => onNavigate(item.id)}
          >
            <div className="menu-icon">{item.icon}</div>
            <div className="menu-label">{item.label}</div>
            <div className="menu-desc">{item.description}</div>
          </button>
        ))}
      </div>

      <div className="trial-info">
        {new Date(user.trialUntil) > new Date() && (
          <p>🎁 Пробний період активний до {new Date(user.trialUntil).toLocaleDateString('uk-UA')}</p>
        )}
      </div>
    </div>
  )
}

export default MainMenu
