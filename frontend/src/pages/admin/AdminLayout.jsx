import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../store/authSlice'

const navItems = [
  { to: '/admin/dashboard', label: '儀表板' },
  { to: '/admin/users',     label: '使用者管理' },
  { to: '/admin/listings',  label: '房源管理' },
  { to: '/admin/bookings',  label: '訂單管理' },
  { to: '/admin/reviews',   label: '評論管理' },
]

function AdminLayout({ children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 左側選單 */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-gray-700">
          <span className="text-lg font-bold text-rose-400">Admin</span>
          <span className="text-gray-400 text-sm ml-1">管理後台</span>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block px-6 py-3 text-sm transition ${
                  isActive
                    ? 'bg-rose-600 text-white font-medium'
                    : 'text-gray-300 hover:bg-gray-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-gray-400 hover:text-white transition"
          >
            登出
          </button>
        </div>
      </aside>

      {/* 右側內容 */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}

export default AdminLayout
