import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminGetReviews, adminDeleteReview } from '../../services/api'
import AdminLayout from './AdminLayout'

function AdminReviewsPage() {
  const queryClient = useQueryClient()

  const { data: reviews = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: () => adminGetReviews().then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteReview(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  })

  const handleDelete = (id) => {
    if (!confirm('確定要刪除這則評論嗎？')) return
    deleteMutation.mutate(id)
  }

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">評論管理</h2>

      {isLoading && <div className="text-gray-400 text-sm">載入中...</div>}
      {isError && <div className="text-red-500 text-sm">載入失敗</div>}

      {!isLoading && !isError && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">評論者</th>
                <th className="px-4 py-3 text-left">房源</th>
                <th className="px-4 py-3 text-left">評分</th>
                <th className="px-4 py-3 text-left">內容</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-gray-700">{r.author.name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.listing.title}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.comment}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      刪除
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

export default AdminReviewsPage
