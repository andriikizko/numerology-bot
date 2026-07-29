import { Link, useLocation } from 'react-router-dom'
import '../styles/layout.css'

export default function Layout({ children }) {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/users', icon: '👥', label: 'Користувачи' },
    { path: '/payments', icon: '💳', label: 'Платежи' },
    { path: '/support', icon: '💬', label: 'Підтримка' },
    { path: '/analytics', icon: '📈', label: 'Аналітика' }
  ]

  return (
    <div className="layout">
      <header className="header">
        <h1>🔮 Numerology Admin Panel</h1>
        <div className="user-info">
          Admin · v1.0.0
        </div>
      </header>

      <div className="container">
        <nav className="sidebar">
          <div className="nav-list">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  )
}
