import { useState } from 'react'
import { API } from '../services/api'

const SLIDES = [
  { icon: '🔮', title: 'Ви більше, ніж думаєте', text: 'Відкрийте свій внутрішній потенціал через числа' },
  { icon: '✨', title: 'Зрозумійте себе глибше', text: 'Точна нумерологія на основі дати народження' },
  { icon: '🌙', title: 'Дізнайтесь свою долю', text: 'Число долі, кохання, гроші — все за 2 хвилини' },
]

const Registration = ({ onRegister }) => {
  const [step, setStep] = useState('welcome')
  const [slideIndex, setSlideIndex] = useState(0)
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [motherBirthDate, setMotherBirthDate] = useState('')
  const [fatherBirthDate, setFatherBirthDate] = useState('')
  const [loading, setLoading] = useState(false)

  const nextSlide = () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex(slideIndex + 1)
    } else {
      setStep('name')
    }
  }

  const calculateLifePath = (date) => {
    const digits = date.replace(/-/g, '').split('').map(Number)
    let sum = digits.reduce((a, b) => a + b, 0)
    while (sum > 9 && ![11, 22, 33].includes(sum)) {
      sum = String(sum).split('').reduce((a, b) => a + parseInt(b, 10), 0)
    }
    return sum
  }

  const handleRegister = async () => {
    if (!birthDate || !motherBirthDate || !fatherBirthDate) {
      alert('Заповніть усі 3 дати народження')
      return
    }

    setLoading(true)
    try {
      const pathNumber = calculateLifePath(birthDate)

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
        name: name || 'Гість',
        birthDate,
        motherBirthDate,
        fatherBirthDate,
        pathNumber,
        createdAt: new Date().toISOString(),
        trialUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const response = await fetch(API.registerUser, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        onRegister(userData)
      } else {
        alert('Помилка реєстрації. Спробуйте ще раз.')
      }
    } catch (error) {
      console.error('Помилка реєстрації:', error)
      alert('Помилка реєстрації. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'welcome') {
    const slide = SLIDES[slideIndex]
    return (
      <div className="onboarding-container">
        <div className="onboarding-slide">
          <div className="onboarding-icon">{slide.icon}</div>
          <h1>{slide.title}</h1>
          <p>{slide.text}</p>
        </div>
        <div>
          <div className="slide-dots">
            {SLIDES.map((_, i) => (
              <div key={i} className={`slide-dot ${i === slideIndex ? 'active' : ''}`} />
            ))}
          </div>
          <button onClick={nextSlide} className="btn-primary" style={{ width: '100%' }}>
            Продовжити →
          </button>
        </div>
      </div>
    )
  }

  if (step === 'name') {
    return (
      <div className="onboarding-container">
        <div className="form-step">
          <h1 style={{ marginBottom: 8 }}>Як вас звати?</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Це важлива інформація</p>
          <input
            type="text"
            placeholder="Ваше ім'я"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={() => setStep('userDate')} className="btn-primary" disabled={!name}>
            Далі →
          </button>
        </div>
      </div>
    )
  }

  if (step === 'userDate') {
    return (
      <div className="onboarding-container">
        <div className="form-step">
          <h1 style={{ marginBottom: 8 }}>Ваша дата народження</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Потрібна для точного нумерологічного розрахунку
          </p>
          <label>Дата народження</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          <div className="button-group">
            <button onClick={() => setStep('name')} className="btn-secondary">← Назад</button>
            <button onClick={() => setStep('motherDate')} className="btn-primary" disabled={!birthDate}>
              Далі →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'motherDate') {
    return (
      <div className="onboarding-container">
        <div className="form-step">
          <h1 style={{ marginBottom: 8 }}>Дата народження мами</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Потрібна для розрахунку родового коду — глибшого рівня вашого профілю
          </p>
          <label>Дата народження мами</label>
          <input
            type="date"
            value={motherBirthDate}
            onChange={(e) => setMotherBirthDate(e.target.value)}
          />
          <div className="button-group">
            <button onClick={() => setStep('userDate')} className="btn-secondary">← Назад</button>
            <button onClick={() => setStep('fatherDate')} className="btn-primary" disabled={!motherBirthDate}>
              Далі →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'fatherDate') {
    return (
      <div className="onboarding-container">
        <div className="form-step">
          <h1 style={{ marginBottom: 8 }}>Дата народження тата</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Останній крок — і ваш профіль готовий
          </p>
          <label>Дата народження тата</label>
          <input
            type="date"
            value={fatherBirthDate}
            onChange={(e) => setFatherBirthDate(e.target.value)}
          />
          <div className="button-group">
            <button onClick={() => setStep('motherDate')} className="btn-secondary">← Назад</button>
            <button onClick={handleRegister} className="btn-primary" disabled={!fatherBirthDate || loading}>
              {loading ? '⏳ Рахуємо...' : 'Почати ✨'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default Registration
