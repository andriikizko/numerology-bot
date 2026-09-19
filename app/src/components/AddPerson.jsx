import { useState } from 'react'
import { API } from '../services/api'

const AddPerson = ({ user, onSaved, onBack }) => {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [motherBirthDate, setMotherBirthDate] = useState('')
  const [fatherBirthDate, setFatherBirthDate] = useState('')
  const [partnerBirthDate, setPartnerBirthDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    if (!name.trim() || !birthDate) {
      setError("Заповніть ім'я та дату народження")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(API.addPerson, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.telegramId,
          name: name.trim(),
          birthDate,
          motherBirthDate: motherBirthDate || null,
          fatherBirthDate: fatherBirthDate || null,
          partnerBirthDate: partnerBirthDate || null,
        }),
      })
      if (response.ok) {
        onSaved()
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
          <div className="pd-hero-tag">Нова людина</div>
          <div className="pd-hero-title">Розрахувати іншій людині</div>
          <div className="pd-hero-desc">Додай дані — і зможеш замовляти для неї будь-який розрахунок.</div>
        </div>

        <div className="pd-section">
          {error && <div className="reg-error">{error}</div>}

          <div className="form-step">
            <label className="field-label">Ім'я</label>
            <input className="reg-field" type="text" placeholder="Наприклад: Марія"
              value={name} onChange={(e) => setName(e.target.value)} />

            <label className="field-label">Дата народження</label>
            <input className="reg-field" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />

            <label className="field-label">Дата народження мами (для повного розрахунку)</label>
            <input className="reg-field" type="date" value={motherBirthDate} onChange={(e) => setMotherBirthDate(e.target.value)} />

            <label className="field-label">Дата народження тата (для повного розрахунку)</label>
            <input className="reg-field" type="date" value={fatherBirthDate} onChange={(e) => setFatherBirthDate(e.target.value)} />

            <label className="field-label">Дата народження партнера (для "Кохання", необов'язково)</label>
            <input className="reg-field" type="date" value={partnerBirthDate} onChange={(e) => setPartnerBirthDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="pd-bottombar">
        <button className="pd-cta" onClick={handleSave} disabled={saving}>
          {saving ? '⏳ Збереження…' : 'Зберегти'}
        </button>
      </div>
    </div>
  )
}

export default AddPerson
