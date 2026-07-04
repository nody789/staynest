import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminGetListings, adminDeleteListing } from '../../services/api'
import AdminLayout from './AdminLayout'

function AdminListingsPage() {
  const queryClient = useQueryClient()

  const { data: listings = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'listings'],
    queryFn: () => adminGetListings().then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteListing(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] }),
  })

  const handleDelete = (id, title) => {
    if (!confirm(`確定要強制下架「${title}」嗎？此操作無法還原。`)) return
    deleteMutation.mutate(id)
  }

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">房源管理</h2>

      {isLoading && <div className="text-gray-400 text-sm">載入中...</div>}
      {isError && <div className="text-red-500 text-sm">載入失敗</div>}

      {!isLoading && !isError && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">房源名稱</th>
                <th className="px-4 py-3 text-left">地點</th>
                <th className="px-4 py-3 text-left">房東</th>
                <th className="px-4 py-3 text-left">價格/晚</th>
                <th className="px-4 py-3 text-left">訂單數</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{l.title}</div>
                    <div className="text-xs text-gray-400">{l.category}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{l.location}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <div>{l.host.name}</div>
                    <div className="text-xs text-gray-400">{l.host.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">NT${l.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{l._count.bookings}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(l.id, l.title)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      強制下架
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminListingsPage
