import { useState } from 'react'
import { API } from '../services/api'

const QUESTIONS = [
  { key: 'gender', sub: 'Для точності вібраційного розрахунку', title: 'Яка твоя стать?', options: ['Чоловіча', 'Жіноча'] },
  { key: 'maritalStatus', sub: 'Впливає на розрахунок сумісності', title: 'Який твій сімейний стан?', options: ['Одинокий(а)', 'У стосунках', 'У шлюбі', 'Розлучений(а)'] },
  { key: 'concern', sub: 'Щоб зосередити розрахунок на головному', title: 'Що турбує тебе найбільше зараз?', options: ['Гроші', 'Кохання', 'Кар\'єра', 'Самореалізація'] },
  { key: 'employment', sub: 'Число долі проявляється по-різному в кожній сфері', title: 'Яка твоя сфера зайнятості?', options: ['Найманий працівник', 'Власний бізнес', 'Фріланс', 'Студент', 'У пошуку роботи'] },
  { key: 'financialGoal', sub: 'Для розшифровки грошового коду', title: 'Яка твоя фінансова ціль?', options: ['Стабільність', 'Збільшити дохід', 'Новий бізнес', 'Інвестиції'] },
]

// крок 0 = інтро, 1..5 = питання, 6 = дата народження
const TOTAL_STEPS = QUESTIONS.length + 2

const Survey = ({ user, onFinish }) => {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [dob, setDob] = useState({ d: '', m: '', y: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const progress = Math.round((step / (TOTAL_STEPS - 1)) * 100)

  const selectOption = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setStep((s) => s + 1)
  }

  const skip = () => setStep((s) => s + 1)

  const finish = async () => {
    const { d, m, y } = dob
    if (!d || !m || !y || y.length !== 4) {
      setError('Введіть повну дату народження')
      return
    }
    const birthDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`

    setSaving(true)
    setError(null)
    try {
      const updatedUser = { ...user, ...answers, birthDate }
      const response = await fetch(API.registerUser, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      })
      if (response.ok) {
        onFinish(updatedUser)
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

  // Інтро
  if (step === 0) {
    return (
      <div className="screen survey-screen">
        <div className="survey-qcontent survey-qcontent-center">
          <div className="survey-qsub">Ще трохи</div>
          <div className="survey-qtitle" style={{ marginBottom: 14 }}>
            Дай відповіді<br />на кілька запитань
          </div>
          <div className="survey-qdesc">Це уточнить твій розрахунок і зробить код успіху точнішим</div>
        </div>
        <div className="survey-bottom">
          <button className="survey-cta" onClick={() => setStep(1)}>Почати опитування</button>
        </div>
      </div>
    )
  }

  // Питання
  if (step >= 1 && step <= QUESTIONS.length) {
    const q = QUESTIONS[step - 1]
    return (
      <div className="screen survey-screen">
        <div className="survey-topbar">
          <div className="survey-back" onClick={() => setStep((s) => Math.max(0, s - 1))}>←</div>
          <div className="survey-progress"><div className="survey-progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="survey-qcontent">
          <div className="survey-qsub">{q.sub}</div>
          <div className="survey-qtitle">{q.title}</div>
          <div className="survey-opts">
            {q.options.map((opt) => (
              <div key={opt} className="survey-opt" onClick={() => selectOption(q.key, opt)}>{opt}</div>
            ))}
          </div>
        </div>
        <div className="survey-bottom">
          <div className="survey-skip" onClick={skip}>Пропустити</div>
        </div>
      </div>
    )
  }

  // Дата народження (обов'язково)
  return (
    <div className="screen survey-screen">
      <div className="survey-topbar">
        <div className="survey-back" onClick={() => setStep((s) => s - 1)}>←</div>
        <div className="survey-progress"><div className="survey-progress-fill" style={{ width: '100%' }} /></div>
      </div>
      <div className="survey-qcontent">
        <div className="survey-qsub">Головне питання</div>
        <div className="survey-qtitle">Яка твоя дата народження?</div>
        <div className="survey-qdesc">Це основа твого коду успіху — тому це поле обов'язкове</div>
        <div className="dob-row">
          <input className="dob-field" placeholder="ДД" maxLength={2} value={dob.d}
            onChange={(e) => setDob({ ...dob, d: e.target.value.replace(/\D/g, '') })} />
          <input className="dob-field" placeholder="ММ" maxLength={2} value={dob.m}
            onChange={(e) => setDob({ ...dob, m: e.target.value.replace(/\D/g, '') })} />
          <input className="dob-field dob-year" placeholder="РРРР" maxLength={4} value={dob.y}
            onChange={(e) => setDob({ ...dob, y: e.target.value.replace(/\D/g, '') })} />
        </div>
        {error && <div className="reg-error">{error}</div>}
      </div>
      <div className="survey-bottom">
        <button className="survey-cta" onClick={finish} disabled={saving}>
          {saving ? '⏳ Зачекайте...' : 'Почати персональну сесію'}
        </button>
      </div>
    </div>
  )
}

export default Survey
