import { useEffect, useState } from 'react'
import { getAnalytics, getDailyStats } from '../services/adminService'
import '../styles/pages.css'

export default function Dashboard() {
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
    return <div className="page"><p>⏳ Завантаження...</p></div>
  }

  if (!stats) {
    return <div className="page"><p>❌ Помилка завантаження</p></div>
  }

  return (
    <div className="page">
      <h2>📊 Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Всього користувачів</div>
          <div className="stat-value">{stats.total_users}</div>
          <div className="stat-change">+{daily?.new_users || 0} сьогодні</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Куплено розрахунків</div>
          <div className="stat-value">{stats.paid_users}</div>
          <div className="stat-change">{stats.conversion_rate}% конверсія</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Активних гороскопів</div>
          <div className="stat-value">{stats.horoscope_users}</div>
          <div className="stat-change">+{daily?.new_payments || 0} сьогодні</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Дохід (MRR)</div>
          <div className="stat-value">{stats.total_revenue.toFixed(0)} ₴</div>
          <div className="stat-change">+{daily?.daily_revenue.toFixed(0)} ₴ сьогодні</div>
        </div>
      </div>

      <div className="stats-section">
        <h3>💳 Статус платежів</h3>
        <div className="payment-stats">
          <div>
            <div className="success">✅ Успішних: {stats.success_payments}</div>
            <div className="failed">❌ Невдалих: {stats.failed_payments}</div>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3>📈 Ключові метрики</h3>
        <div className="metrics">
          <div className="metric">
            <div className="metric-label">Конверсія</div>
            <div className="metric-bar">
              <div 
                className="metric-fill"
                style={{ width: `${Math.min(stats.conversion_rate * 10, 100)}%` }}
              ></div>
            </div>
            <div className="metric-value">{stats.conversion_rate}%</div>
          </div>

          <div className="metric">
            <div className="metric-label">Користувачи гороскопу</div>
            <div className="metric-bar">
              <div 
                className="metric-fill"
                style={{ width: `${Math.min((stats.horoscope_users / stats.total_users) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="metric-value">{((stats.horoscope_users / stats.total_users) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
