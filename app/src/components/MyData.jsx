const MyData = ({ user, onBack }) => {
  const rows = [
    { label: 'Ім\'я', value: user.name },
    { label: 'Телефон', value: user.phone || '—' },
    { label: 'Пошта', value: user.email || '—' },
    { label: 'Дата народження', value: user.birthDate || '—' },
    { label: 'Дата народження мами', value: user.motherBirthDate || '—' },
    { label: 'Дата народження тата', value: user.fatherBirthDate || '—' },
  ]

  return (
    <div className="screen product-detail-screen">
      <div className="pd-topbar">
        <div className="pd-back" onClick={onBack}>←</div>
      </div>
      <div className="pd-scroll">
        <div className="pd-hero">
          <div className="pd-hero-tag">Профіль</div>
          <div className="pd-hero-title">Мої дані</div>
        </div>
        <div className="pd-section">
          {rows.map((r) => (
            <div key={r.label} className="mydata-row">
              <div className="mydata-label">{r.label}</div>
              <div className="mydata-value">{r.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MyData
