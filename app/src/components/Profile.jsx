const Profile = ({ user, onBack }) => {
  return (
    <div className="page-container">
      <div className="header">
        <h1>👤 Ваш Профіль</h1>
      </div>

      <div className="content">
        <div className="profile-card">
          <div className="profile-section">
            <h3>Персональна інформація</h3>
            <div className="info-row">
              <span className="label">Ім'я:</span>
              <span className="value">{user.name}</span>
            </div>
            <div className="info-row">
              <span className="label">🔮 Число долі:</span>
              <span className="value">{user.pathNumber}</span>
            </div>
            <div className="info-row">
              <span className="label">🎂 Дата народження:</span>
              <span className="value">{user.birthDate}</span>
            </div>
          </div>

          <div className="profile-section">
            <h3>Придбані розрахунки</h3>
            <div className="info-row">
              <span className="label">🔮 Загальний Розрахунок:</span>
              <span className="value">{user.generalPurchased ? '✅ Придбано' : '❌ Не придбано'}</span>
            </div>
            <div className="info-row">
              <span className="label">💞 Кохання та Сумісність:</span>
              <span className="value">{user.lovePurchased ? '✅ Придбано' : '❌ Не придбано'}</span>
            </div>
            <div className="info-row">
              <span className="label">💰 Гроші:</span>
              <span className="value">{user.moneyPurchased ? '✅ Придбано' : '❌ Не придбано'}</span>
            </div>
          </div>

          <div className="profile-section">
            <h3>Важлива інформація</h3>
            <div className="info-box">
              <p>💬 Для питань і підтримки:</p>
              <p><a href="https://t.me/numerology_support">Написати підтримці</a></p>
            </div>
          </div>
        </div>
      </div>

      <button onClick={onBack} className="btn-back">
        ⬅️ Назад
      </button>
    </div>
  )
}

export default Profile
