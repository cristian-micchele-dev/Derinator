import { useLocation, useNavigate } from 'react-router-dom'
import './Footer.css'

const NAV_ITEMS = [
  { path: '/', label: 'Inicio' },
  { path: '/jugar', label: 'Jugar' },
  { path: '/del-dia', label: 'Del Día' },
] as const

export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <footer className="footer">
      <nav className="footer-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            className={`footer-link ${location.pathname === item.path ? 'footer-link--active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="footer-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </footer>
  )
}
