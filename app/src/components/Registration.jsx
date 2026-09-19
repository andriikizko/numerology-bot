import { useState } from 'react'
import { API } from '../services/api'

const Registration = ({ onRegister }) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Введіть ім\'я')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const tg = window.Telegram?.WebApp
      let telegramId = tg?.initDataUnsafe?.user?.id

      if (!telegramId) {
        telegramId = localStorage.getItem('numerology_user_id')
        if (!telegramId) {
          telegramId = `web_${Date.now()}_${Math.floor(Math.random() * 100000)}`
        }
      }

      const userData = {
        telegramId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        createdAt: new Date().toISOString(),
        trialUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const response = await fetch(API.registerUser, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        localStorage.setItem('numerology_user_id', String(telegramId))
        onRegister(userData)
      } else {
        const errText = await response.text()
        console.error('Registration failed:', response.status, errText)
        setError('Помилка реєстрації. Спробуйте ще раз.')
      }
    } catch (err) {
      console.error(err)
      setError('Немає з\'єднання. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen registration-screen">
      <div className="reg-content">
        <div className="reg-mark">🔮</div>
        <div className="reg-headline">Давай<br />познайомимось</div>
        <div className="reg-subtitle">Це потрібно, щоб зберегти твій код успіху</div>

        <div className="field-label">Ім'я</div>
        <input className="reg-field" type="text" placeholder="Як тебе звати?"
          value={name} onChange={(e) => setName(e.target.value)} />

        <div className="field-label">Телефон</div>
        <input className="reg-field" type="tel" placeholder="+380 __ ___ __ __"
          value={phone} onChange={(e) => setPhone(e.target.value)} />

        <div className="field-label">Пошта</div>
        <input className="reg-field" type="email" placeholder="name@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        {error && <div className="reg-error">{error}</div>}

        <div className="spacer" />

        <button className="reg-cta" onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Зачекайте...' : 'Продовжити'}
        </button>
        <div className="reg-legal">
          Продовжуючи, ти погоджуєшся з <b>Умовами</b> та <b>Політикою конфіденційності</b>
        </div>
      </div>
    </div>
  )
}

export default Registration
