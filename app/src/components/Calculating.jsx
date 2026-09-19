import { useEffect, useState, useRef } from 'react'
import { API } from '../services/api'

const Calculating = ({ user, onDone }) => {
  const [pct, setPct] = useState(0)
  const resultRef = useRef(null)

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      setPct(Math.min(100, Math.round((elapsed / 15) * 100)))
    }, 100)

    // Паралельно рахуємо безкоштовний пункт (число долі), щоб головна вже мала дані
    fetch(API.generateCalculation, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.telegramId, segment: 'general', point: 'lifePath' }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { resultRef.current = data })
      .catch(() => { resultRef.current = null })

    const finishTimer = setTimeout(() => {
      clearInterval(timer)
      onDone(resultRef.current)
    }, 15000)

    return () => { clearInterval(timer); clearTimeout(finishTimer) }
  }, [user, onDone])

  const circumference = 2 * Math.PI * 100
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="screen calc-screen">
      <div className="calc-content">
        <div className="ring-wrap">
          <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="110" cy="110" r="100" fill="none" stroke="#1c1c1c" strokeWidth="8" />
            <circle cx="110" cy="110" r="100" fill="none" stroke="#D64A7A" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
          </svg>
          <div className="pct">{pct}%</div>
        </div>
        <div className="calc-headline">Зачекай, поки відбудеться<br />магія підрахунку чисел</div>
        <div className="calc-caption">Це займає близько 15 секунд</div>
      </div>
    </div>
  )
}

export default Calculating
