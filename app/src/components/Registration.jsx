import { useState } from 'react'
import { API } from '../services/api'

const Registration = ({ onRegister }) => {
  const [step, setStep] = useState('name')
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [loading, setLoading] = useState(false)

  const calculatePathNumber = (date) => {
    const [day, month, year] = date.split('.').map(Number)
    const sum = day + month + year
    let number = sum
    while (number > 9 && ![11, 22, 33].includes(number)) {
      number = String(number).split('').reduce((a, b) => a + parseInt(b), 0)
    }
    return number
  }

  const getNumberName = (number) => {
    const names = {
      1: 'Лідер',
      2: 'Миротворець',
      3: 'Творець',
      4: 'Будівник',
      5: 'Шукач',
      6: 'Опікун',
      7: 'Філософ',
      8: 'Повелитель',
      9: 'Просвітлений'
    }
    return names[number] || 'Невідомо'
  }

  const handleRegister = async () => {
    if (!name || !birthDate) {
      alert('Заповніть усі поля')
      return
    }

    setLoading(true)
    try {
      const pathNumber = calculatePathNumber(birthDate)
      const numberName = getNumberName(pathNumber)
      
      const tg = window.Telegram?.WebApp
      let telegramId = tg?.initDataUnsafe?.user?.id

      if (!telegramId) {
        // Веб-режим: генеруємо стабільний ID один раз і зберігаємо
        telegramId = localStorage.getItem('numerology_user_id')
        if (!telegramId) {
          telegramId = `web_${Date.now()}_${Math.floor(Math.random() * 100000)}`
        }
      }

      const userData = {
        telegramId,
        name,
        birthDate,
        pathNumber,
        numberName,
        createdAt: new Date().toISOString(),
        trialUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        horoscopePaidUntil: null,
        reportPurchased: false
      }

      // Зберегти в Firebase
      const response = await fetch(API.registerUser, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        onRegister(userData)
      } else {
        const errText = await response.text()
        console.error('Registration failed:', response.status, errText)
        alert('Помилка реєстрації. Спробуйте ще раз.')
      }
    } catch (error) {
      console.error('Помилка реєстрації:', error)
      alert('Помилка реєстрації. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="registration-container">
      <div className="registration-card">
        <h1>🔮 Нумерологія</h1>
        <p>Привіт! Давайте виявимо вашу числову долю</p>

        {step === 'name' && (
          <div className="form-step">
            <label>Ваше нумерологічне ім'я (або введіть своє):</label>
            <input
              type="text"
              placeholder="Наприклад: Філософ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && setStep('date')}
            />
            <button onClick={() => setStep('date')} disabled={!name}>
              Далі →
            </button>
          </div>
        )}

        {step === 'date' && (
          <div className="form-step">
            <label>Дата народження (ДД.ММ.РРРР):</label>
            <input
              type="text"
              placeholder="15.03.1990"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              maxLength="10"
            />
            <div className="button-group">
              <button onClick={() => setStep('name')} className="btn-secondary">
                ← Назад
              </button>
              <button 
                onClick={handleRegister}
                disabled={!birthDate || loading}
                className="btn-primary"
              >
                {loading ? '⏳ Реєстрація...' : 'Розпочати ✨'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Registration
