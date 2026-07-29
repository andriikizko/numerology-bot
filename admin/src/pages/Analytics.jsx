import { useEffect, useState } from 'react'
import { getAnalytics, getDailyStats } from '../services/adminService'
import '../styles/pages.css'

export default function Analytics() {
  const [stats, setStats] = useState(null)
  const [daily, setDaily] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const [analyticsData, dailyData] = await Promise.all([
        getAnalytics(),
        getDailyStats()
      ])
      setStats(analyticsData)
      setDaily(dailyData)
      setLoading(false)
    }
    loadStats()
  }, [])

  if (loading) {
    return <div className="page"><p>⏳ Завантаження аналітики...</p></div>
  }

  if (!stats) {
    return <div className="page"><p>❌ Помилка завантаження</p></div>
  }

  const arpu = stats.paid_users > 0 ? (stats.total_revenue / stats.paid_users).toFixed(2) : 0
  const cac = stats.paid_users > 0 ? (stats.total_revenue / stats.paid_users).toFixed(2) : 0
  const ltv = arpu * 3

  return (
    <div className="page">
      <h2>📈 Аналітика</h2>

      <div className="analytics-section">
        <h3>📊 Використання продукту</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-label">Користувачи розрахунку</div>
            <div className="analytics-value">{stats.paid_users}</div>
            <div className="analytics-percent">
              {stats.conversion_rate}% від всіх
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">Користувачи гороскопу</div>
            <div className="analytics-value">{stats.horoscope_users}</div>
            <div className="analytics-percent">
              {stats.horoscope_users > 0 
                ? ((stats.horoscope_users / stats.total_users) * 100).toFixed(1) 
                : 0}% від всіх
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">Успішних платежів</div>
            <div className="analytics-value">{stats.success_payments}</div>
            <div className="analytics-percent">
              {stats.success_payments + stats.failed_payments > 0
                ? (((stats.success_payments / (stats.success_payments + stats.failed_payments)) * 100).toFixed(1))
                : 0}% успіх
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">Невдалих платежів</div>
            <div className="analytics-value">{stats.failed_payments}</div>
            <div className="analytics-percent">
              Потребує уваги
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-section">
        <h3>💰 Фінансові метрики</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-label">Загальний дохід</div>
            <div className="analytics-value">{stats.total_revenue.toFixed(0)} ₴</div>
            <div className="analytics-percent">
              Дохідна база MRR
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">ARPU (середня вартість)</div>
            <div className="analytics-value">{arpu} ₴</div>
            <div className="analytics-percent">
              На одного платника
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">LTV (довгоживаність)</div>
            <div className="analytics-value">{ltv.toFixed(0)} ₴</div>
            <div className="analytics-percent">
              Очікувана вартість за 3 місяці
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">Дохід сьогодні</div>
            <div className="analytics-value">{daily?.daily_revenue.toFixed(0) || 0} ₴</div>
            <div className="analytics-percent">
              {daily?.new_payments || 0} нових платежів
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-section">
        <h3>👥 Користувачи</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-label">Всього користувачів</div>
            <div className="analytics-value">{stats.total_users}</div>
            <div className="analytics-percent">
              +{daily?.new_users || 0} сьогодні
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">Конверсія на покупку</div>
            <div className="analytics-value">{stats.conversion_rate}%</div>
            <div className="analytics-percent">
              {stats.paid_users} платників
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">Платники на гороскоп</div>
            <div className="analytics-value">
              {stats.horoscope_users > 0 ? ((stats.horoscope_users / stats.paid_users) * 100).toFixed(1) : 0}%
            </div>
            <div className="analytics-percent">
              Повторна продаж
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">CAC (Вартість залучення)</div>
            <div className="analytics-value">
              {stats.total_revenue > 0 
                ? (stats.total_revenue / (stats.paid_users || 1)).toFixed(0)
                : 0} ₴
            </div>
            <div className="analytics-percent">
              За одного клієнта
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-section">
        <h3>💡 Рекомендації</h3>
        <div className="recommendations">
          {stats.conversion_rate < 10 && (
            <div className="recommendation-item warning">
              ⚠️ Конверсія нижче 10%. Розглядай оптимізацію вартості або покращення messaging.
            </div>
          )}
          {stats.failed_payments > stats.success_payments * 0.2 && (
            <div className="recommendation-item warning">
              ⚠️ Високий рівень невдалих платежів. Перевір LiqPay налаштування.
            </div>
          )}
          {stats.total_revenue > 0 && (
            <div className="recommendation-item success">
              ✅ Платіжна система працює. Продовжуй залучати користувачів.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
