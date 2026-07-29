const Profile = ({ user, onBack }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getReportStatus = () => {
    return user.reportPurchased ? '✅ Придбаний' : '❌ Не придбаний'
  }

  const getHoroscopeStatus = () => {
    if (!user.horoscopePaidUntil) return '❌ Неактивна'
    
    const paidUntil = new Date(user.horoscopePaidUntil)
    const now = new Date()
    
    if (paidUntil < now) return '❌ Закінчилась'
    
    const daysLeft = Math.ceil((paidUntil - now) / (1000 * 60 * 60 * 24))
    return `✅ Активна (${daysLeft} днів)`
  }

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
              <span className="label">🔮 Нумерологічне ім'я:</span>
              <span className="value">{user.name}</span>
            </div>
            <div className="info-row">
              <span className="label">📊 Число долі:</span>
              <span className="value">{user.pathNumber}</span>
            </div>
            <div className="info-row">
              <span className="label">🎂 Дата народження:</span>
              <span className="value">{user.birthDate}</span>
            </div>
          </div>

          <div className="profile-section">
            <h3>Статус Підписок</h3>
            <div className="info-row">
              <span className="label">📊 Персональний розрахунок:</span>
              <span className="value">{getReportStatus()}</span>
            </div>
            <div className="info-row">
              <span className="label">📅 Щоденний гороскоп:</span>
              <span className="value">{getHoroscopeStatus()}</span>
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
