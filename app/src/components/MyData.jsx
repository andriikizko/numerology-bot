import { useState, useEffect } from 'react'
import { API } from '../services/api'

const FIELDS = [
  { key: 'name', label: "Ім'я", type: 'text', required: true },
  { key: 'phone', label: 'Телефон', type: 'tel' },
  { key: 'email', label: 'Пошта', type: 'email' },
  { key: 'birthDate', label: 'Дата народження', type: 'date' },
  { key: 'motherBirthDate', label: 'Дата народження мами', type: 'date' },
  { key: 'fatherBirthDate', label: 'Дата народження тата', type: 'date' },
  { key: 'partnerBirthDate', label: 'Дата народження партнера', type: 'date' },
]

const Row = ({ field, value, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  const startEdit = () => { setDraft(value || ''); setEditing(true) }

  const save = async () => {
    setSaving(true)
    await onSave(field.key, draft)
    setSaving(false)
    setEditing(false)
  }

  const confirmDelete = async () => {
    setSaving(true)
    await onDelete(field.key)
    setSaving(false)
    setConfirmingDelete(false)
  }

  if (confirmingDelete) {
    return (
      <div className="mydata-row mydata-row-confirm">
        <div className="mydata-confirm-text">Точно видалити "{field.label}"?</div>
        <div className="mydata-confirm-actions">
          <button className="mydata-btn-danger" onClick={confirmDelete} disabled={saving}>Так, видалити</button>
          <button className="mydata-btn-ghost" onClick={() => setConfirmingDelete(false)}>Скасувати</button>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="mydata-row mydata-row-edit">
        <div className="mydata-label">{field.label}</div>
        <input
          className="reg-field mydata-edit-field"
          type={field.type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="mydata-confirm-actions">
          <button className="mydata-btn-save" onClick={save} disabled={saving}>{saving ? '⏳' : 'Зберегти'}</button>
          <button className="mydata-btn-ghost" onClick={() => setEditing(false)}>Скасувати</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mydata-row">
      <div>
        <div className="mydata-label">{field.label}</div>
        <div className="mydata-value">{value || '—'}</div>
      </div>
      <div className="mydata-row-actions">
        <span className="mydata-icon-btn" onClick={startEdit}>✏️</span>
        {!field.required && value && (
          <span className="mydata-icon-btn" onClick={() => setConfirmingDelete(true)}>🗑️</span>
        )}
      </div>
    </div>
  )
}

const MyData = ({ user, onUserUpdate, onBack, onAddPerson, onLoggedOut, peopleVersion }) => {
  const [people, setPeople] = useState([])
  const [error, setError] = useState(null)
  const [confirmingAccountDelete, setConfirmingAccountDelete] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    fetch(`${API.getPeople}?userId=${user.telegramId}`)
      .then((r) => (r.ok ? r.json() : { people: [] }))
      .then((data) => setPeople(data.people || []))
      .catch(() => {})
  }, [user.telegramId, peopleVersion])

  const saveField = async (key, value) => {
    setError(null)
    try {
      const updatedUser = { ...user, [key]: value }
      const response = await fetch(API.registerUser, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      })
      if (response.ok) {
        onUserUpdate(updatedUser)
      } else {
        setError('Не вдалося зберегти. Спробуйте ще раз.')
      }
    } catch (err) {
      console.error(err)
      setError('Немає з\'єднання. Спробуйте ще раз.')
    }
  }

  const deleteField = async (key) => saveField(key, null)

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    setError(null)
    try {
      const response = await fetch(API.deleteAccount, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.telegramId }),
      })
      if (response.ok) {
        localStorage.removeItem('numerology_user_id')
        onLoggedOut()
      } else {
        setError('Не вдалося видалити акаунт. Спробуйте ще раз.')
        setDeletingAccount(false)
      }
    } catch (err) {
      console.error(err)
      setError('Немає з\'єднання. Спробуйте ще раз.')
      setDeletingAccount(false)
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
          {error && <div className="reg-error">{error}</div>}
          {FIELDS.map((field) => (
            <Row key={field.key} field={field} value={user[field.key]} onSave={saveField} onDelete={deleteField} />
          ))}
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

        <div className="pd-section">
          {!confirmingAccountDelete ? (
            <button className="mydata-delete-account" onClick={() => setConfirmingAccountDelete(true)}>
              Видалити акаунт
            </button>
          ) : (
            <div className="mydata-row-confirm">
              <div className="mydata-confirm-text">
                Це видалить усі твої дані назавжди, включно з розрахунками. Скасувати не можна.
              </div>
              <div className="mydata-confirm-actions">
                <button className="mydata-btn-danger" onClick={handleDeleteAccount} disabled={deletingAccount}>
                  {deletingAccount ? '⏳ Видалення…' : 'Так, видалити назавжди'}
                </button>
                <button className="mydata-btn-ghost" onClick={() => setConfirmingAccountDelete(false)}>Скасувати</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyData
