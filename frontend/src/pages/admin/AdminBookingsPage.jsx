import { useQuery } from '@tanstack/react-query'
import { adminGetBookings } from '../../services/api'
import AdminLayout from './AdminLayout'

const statusLabel = {
  PENDING:   { text: '待確認', cls: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { text: '已確認', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { text: '已取消', cls: 'bg-gray-100 text-gray-500' },
}

function AdminBookingsPage() {
  const { data: bookings = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: () => adminGetBookings().then((r) => r.data),
  })

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">訂單管理</h2>

      {isLoading && <div className="text-gray-400 text-sm">載入中...</div>}
      {isError && <div className="text-red-500 text-sm">載入失敗</div>}

      {!isLoading && !isError && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">房源</th>
                <th className="px-4 py-3 text-left">旅客</th>
                <th className="px-4 py-3 text-left">入住</th>
                <th className="px-4 py-3 text-left">退房</th>
                <th className="px-4 py-3 text-left">總價</th>
                <th className="px-4 py-3 text-left">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => {
                const { text, cls } = statusLabel[b.status] || {}
                return (
                  <tr key={b.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{b.listing.title}</div>
                      <div className="text-xs text-gray-400">{b.listing.location}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div>{b.guest.name}</div>
                      <div className="text-xs text-gray-400">{b.guest.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(b.checkIn).toLocaleDateString('zh-TW')}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(b.checkOut).toLocaleDateString('zh-TW')}</td>
                    <td className="px-4 py-3 text-gray-700">NT${b.totalPrice.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${cls}`}>{text}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminBookingsPage
