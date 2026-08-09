import { useState } from 'react'
import { API } from '../services/api'

const SLIDES = [
  { icon: '🔮', title: 'Ви більше, ніж думаєте', text: 'Відкрийте свій внутрішній потенціал через числа' },
  { icon: '✨', title: 'Зрозумійте себе глибше', text: 'Точна нумерологія на основі дати народження' },
  { icon: '🌙', title: 'Дізнайтесь свою долю', text: 'Число долі, кохання, гроші — все за 2 хвилини' },
]

// Реєстрація тепер збирає ТІЛЬКИ ім'я — жодних дат наперед.
// Дати запитуються пізніше, саме в момент запуску конкретного розрахунку (ProductPage).
const Registration = ({ onRegister }) => {
  const [step, setStep] = useState('welcome')
  const [slideIndex, setSlideIndex] = useState(0)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const nextSlide = () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex(slideIndex + 1)
    } else {
      setStep('name')
    }
  }

  const handleRegister = async () => {
    setLoading(true)
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
        name: name || 'Гість',
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

  // Останній крок — тільки ім'я, одразу після нього — головний екран
  return (
    <div className="onboarding-container">
      <div className="form-step">
        <h1 style={{ marginBottom: 8 }}>Як вас звати?</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
          Дати народження запитаємо пізніше — коли захочете зробити розрахунок
        </p>
        <input
          type="text"
          placeholder="Ваше ім'я"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={handleRegister} className="btn-primary" disabled={!name || loading}>
          {loading ? '⏳ Заходимо...' : 'Почати ✨'}
        </button>
      </div>
    </div>
  )
}

export default Registration
