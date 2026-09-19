import { useState, useEffect } from 'react'
import { API } from '../services/api'

const MyData = ({ user, onUserUpdate, onBack, onAddPerson, peopleVersion }) => {
  const [motherBirthDate, setMotherBirthDate] = useState(user.motherBirthDate || '')
  const [fatherBirthDate, setFatherBirthDate] = useState(user.fatherBirthDate || '')
  const [partnerBirthDate, setPartnerBirthDate] = useState(user.partnerBirthDate || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [people, setPeople] = useState([])

  useEffect(() => {
    fetch(`${API.getPeople}?userId=${user.telegramId}`)
      .then((r) => (r.ok ? r.json() : { people: [] }))
      .then((data) => setPeople(data.people || []))
      .catch(() => {})
  }, [user.telegramId, peopleVersion])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const updatedUser = { ...user, motherBirthDate, fatherBirthDate, partnerBirthDate }
      const response = await fetch(API.registerUser, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      })
      if (response.ok) {
        onUserUpdate(updatedUser)
        setSaved(true)
      } else {
        setError('Не вдалося зберегти. Спробуйте ще раз.')
      }
    } catch (err) {
      console.error(err)
      setError('Немає з\'єднання. Спробуйте ще раз.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen product-detail-screen">
      <div className="pd-topbar"><div className="pd-back" onClick={onBack}>←</div></div>
      <div className="pd-scroll">
        <div className="pd-hero">
          <div className="pd-hero-tag">Профіль</div>
          <div className="pd-hero-title">Мої дані</div>
        </div>

        <div className="pd-section">
          <div className="mydata-row"><div className="mydata-label">Ім'я</div><div className="mydata-value">{user.name}</div></div>
          <div className="mydata-row"><div className="mydata-label">Телефон</div><div className="mydata-value">{user.phone || '—'}</div></div>
          <div className="mydata-row"><div className="mydata-label">Пошта</div><div className="mydata-value">{user.email || '—'}</div></div>
          <div className="mydata-row"><div className="mydata-label">Дата народження</div><div className="mydata-value">{user.birthDate || '—'}</div></div>
        </div>

        <div className="pd-section">
          <div className="pd-section-title">Дати батьків (для повного розрахунку)</div>
          {error && <div className="reg-error">{error}</div>}
          <div className="form-step">
            <label className="field-label">Дата народження мами</label>
            <input className="reg-field" type="date" value={motherBirthDate} onChange={(e) => { setMotherBirthDate(e.target.value); setSaved(false) }} />
            <label className="field-label">Дата народження тата</label>
            <input className="reg-field" type="date" value={fatherBirthDate} onChange={(e) => { setFatherBirthDate(e.target.value); setSaved(false) }} />
            <label className="field-label">Дата народження партнера (для "Кохання")</label>
            <input className="reg-field" type="date" value={partnerBirthDate} onChange={(e) => { setPartnerBirthDate(e.target.value); setSaved(false) }} />
            <button className="pd-secondary-cta" onClick={handleSave} disabled={saving}>
              {saving ? '⏳ Збереження…' : saved ? '✓ Збережено' : 'Зберегти зміни'}
            </button>
          </div>
        </div>

        <div className="pd-section">
          <div className="pd-section-title">Інші люди</div>
          {people.length === 0 && <p className="pd-hint">Ще нікого не додано.</p>}
          {people.map((p) => (
            <div key={p.personId} className="menu-item">
              <div>
                <div className="menu-item-main">{p.name}</div>
                <div className="menu-item-sub">{p.birthDate}</div>
              </div>
            </div>
          ))}
          <button className="pd-secondary-cta" onClick={onAddPerson}>+ Додати людину</button>
        </div>
      </div>
    </div>
  )
}

export default MyData
