import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminGetUsers, adminToggleUser } from '../../services/api'
import AdminLayout from './AdminLayout'

function AdminUsersPage() {
  const queryClient = useQueryClient()

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminGetUsers().then((r) => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminToggleUser(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">使用者管理</h2>

      {isLoading && <div className="text-gray-400 text-sm">載入中...</div>}
      {isError && <div className="text-red-500 text-sm">載入失敗</div>}

      {!isLoading && !isError && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">名稱 / Email</th>
                <th className="px-4 py-3 text-left">身分</th>
                <th className="px-4 py-3 text-left">房源</th>
                <th className="px-4 py-3 text-left">訂單</th>
                <th className="px-4 py-3 text-left">狀態</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className={u.isActive ? '' : 'opacity-50'}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'ADMIN' ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-xs">管理員</span>
                    ) : u.isHost ? (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">房東</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">旅客</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u._count.listings}</td>
                  <td className="px-4 py-3 text-gray-500">{u._count.bookings}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                      {u.isActive ? '啟用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => toggleMutation.mutate({ id: u.id, isActive: !u.isActive })}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        {u.isActive ? '停用' : '啟用'}
                      </button>
                    )}
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

export default AdminUsersPage
