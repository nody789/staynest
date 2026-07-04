import { useQuery } from '@tanstack/react-query'
import { adminGetStats } from '../../services/api'
import AdminLayout from './AdminLayout'

const statCards = [
  { key: 'users',    label: '使用者數', color: 'bg-blue-100 text-blue-700' },
  { key: 'listings', label: '房源數',   color: 'bg-green-100 text-green-700' },
  { key: 'bookings', label: '訂單數',   color: 'bg-yellow-100 text-yellow-700' },
  { key: 'reviews',  label: '評論數',   color: 'bg-rose-100 text-rose-700' },
]

function AdminDashboard() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminGetStats().then((r) => r.data),
  })

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">儀表板</h2>

      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-28" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-red-500 text-sm">載入失敗，請重新整理</div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ key, label, color }) => (
            <div key={key} className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-2">{label}</p>
              <p className={`text-3xl font-bold ${color.split(' ')[1]}`}>{stats[key]}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminDashboard
