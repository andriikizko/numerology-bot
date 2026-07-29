import { useEffect, useState } from 'react'
import { getAllPayments } from '../services/adminService'
import '../styles/pages.css'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function loadPayments() {
      const data = await getAllPayments()
      setPayments(data)
      setLoading(false)
    }
    loadPayments()
  }, [])

  const filtered = payments.filter(p => {
    if (filter === 'success') return p.status === 'success'
    if (filter === 'failure') return p.status === 'failure'
    return true
  })

  const totalRevenue = filtered
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  if (loading) {
    return <div className="page"><p>⏳ Завантаження платежів...</p></div>
  }

  return (
    <div className="page">
      <h2>💳 Платежи ({filtered.length})</h2>

      <div className="payment-summary">
        <div className="summary-card">
          <div className="summary-label">Всього платежів</div>
          <div className="summary-value">{filtered.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Успішних</div>
          <div className="summary-value success-text">
            {filtered.filter(p => p.status === 'success').length}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Невдалих</div>
          <div className="summary-value error-text">
            {filtered.filter(p => p.status === 'failure').length}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Дохід</div>
          <div className="summary-value">{totalRevenue.toFixed(0)} ₴</div>
        </div>
      </div>

      <div className="filters">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Всі платежи</option>
          <option value="success">✅ Успішні</option>
          <option value="failure">❌ Невдалі</option>
        </select>
      </div>

      <div className="table-container">
        <table className="payments-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Користувач</th>
              <th>Тип</th>
              <th>Сума</th>
              <th>Статус</th>
              <th>LiqPay ID</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(payment => (
              <tr key={payment.id} className="payment-row">
                <td className="id-cell">{payment.id.slice(0, 8)}...</td>
                <td className="user-cell">
                  <div className="user-info">
                    <div className="user-name">{payment.user_name}</div>
                    <div className="user-id">{payment.tg_id}</div>
                  </div>
                </td>
                <td className="type-cell">
                  {payment.type === 'report' ? '📊 Розрахунок' : '📅 Гороскоп'}
                </td>
                <td className="amount-cell">{payment.amount} ₴</td>
                <td className="status-cell">
                  {payment.status === 'success' ? (
                    <span className="badge success">✅ Успішний</span>
                  ) : (
                    <span className="badge error">❌ Невдалий</span>
                  )}
                </td>
                <td className="liqpay-cell">{payment.liqpay_id || '-'}</td>
                <td className="date-cell">
                  {payment.created_at?.toDate?.().toLocaleDateString('uk-UA')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
