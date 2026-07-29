import { useEffect, useState } from 'react'
import { getAllUsers } from '../services/adminService'
import '../styles/pages.css'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function loadUsers() {
      const data = await getAllUsers()
      setUsers(data)
      setLoading(false)
    }
    loadUsers()
  }, [])

  const filtered = users.filter(user => {
    const matchSearch = 
      user.num_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.tg_id?.toString().includes(search)
    
    if (filter === 'paid') return matchSearch && user.report_purchased
    if (filter === 'horoscope') return matchSearch && user.horoscope_subscribed
    return matchSearch
  })

  if (loading) {
    return <div className="page"><p>⏳ Завантаження користувачів...</p></div>
  }

  return (
    <div className="page">
      <h2>👥 Користувачи ({filtered.length})</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="🔍 Пошук по імені або ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Всі користувачи</option>
          <option value="paid">Купили розрахунок</option>
          <option value="horoscope">З гороскопом</option>
        </select>
      </div>

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ім'я</th>
              <th>Число</th>
              <th>Дата народження</th>
              <th>Розрахунок</th>
              <th>Гороскоп</th>
              <th>Реєстрація</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} className="user-row">
                <td className="id-cell">{user.tg_id}</td>
                <td className="name-cell">{user.num_name}</td>
                <td className="number-cell">
                  <span className="number-badge">{user.path_number}</span>
                </td>
                <td>{user.birth_date}</td>
                <td className="status-cell">
                  {user.report_purchased ? (
                    <span className="badge success">✅ Так</span>
                  ) : (
                    <span className="badge neutral">-</span>
                  )}
                </td>
                <td className="status-cell">
                  {user.horoscope_subscribed ? (
                    <span className="badge success">✅ Так</span>
                  ) : (
                    <span className="badge neutral">-</span>
                  )}
                </td>
                <td className="date-cell">
                  {user.created_at?.toDate?.().toLocaleDateString('uk-UA')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
