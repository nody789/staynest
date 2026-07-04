// ─────────────────────────────────────────────
// 房東管理頁面
// ─────────────────────────────────────────────
// 功能：
//   1. 顯示我刊登的所有房源
//   2. 刪除房源（需確認）
//   3. 連結到新增/編輯頁面
//   4. 顯示每個房源的訂單數和平均評分

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getListings, deleteListing } from '../services/api'
import { useSelector } from 'react-redux'

function HostListingsPage() {
  const user = useSelector(state => state.auth.user)
  const queryClient = useQueryClient()
  // 控制刪除確認對話框的房源 ID（null 表示未開啟）
  const [deleteTarget, setDeleteTarget] = useState(null)

  // hostId 傳給後端直接過濾，避免抓全部房源再前端篩選
  // limit=100 是因為房東的房源數量通常不多，不需要分頁
  const { data, isLoading } = useQuery({
    queryKey: ['listings', { hostId: user?.id }],
    queryFn: () => getListings({ hostId: user?.id, limit: 100 }).then((res) => res.data),
    enabled: !!user?.id,
  })

  const myListings = data?.listings ?? []

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: (id) => deleteListing(id),
    onSuccess: () => {
      setDeleteTarget(null)
      // 讓房源列表快取失效，重新請求
      queryClient.invalidateQueries({ queryKey: ['listings'] })
    },
  })

  if (isLoading) return <HostSkeleton />

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      {/* 頁面標題 + 新增按鈕 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">我的房源</h1>
          <p className="text-gray-500 text-sm mt-1">管理您刊登的住宿</p>
        </div>
        <Link
          to="/host/listings/new"
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-medium px-5 py-2.5 rounded-xl transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          刊登新房源
        </Link>
      </div>

      {/* 若還不是房東，提示開啟房東模式 */}
      {!user?.isHost && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          提示：您的帳號尚未開啟房東模式，刊登後房源將可供旅客搜尋。
        </div>
      )}

      {myListings.length === 0 ? (
        // 空狀態
        <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="text-6xl mb-4">🏡</div>
          <p className="text-xl font-medium text-gray-900 mb-2">還沒有房源</p>
          <p className="text-gray-500 mb-6">開始刊登您的第一個住宿</p>
          <Link
            to="/host/listings/new"
            className="inline-block bg-rose-500 text-white font-medium px-6 py-3 rounded-xl hover:bg-rose-600 transition"
          >
            立即刊登
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myListings.map((listing) => (
            <HostListingCard
              key={listing.id}
              listing={listing}
              onDelete={() => setDeleteTarget(listing.id)}
            />
          ))}
        </div>
      )}

      {/* ── 刪除確認對話框 (Modal) ── */}
      {deleteTarget && (
        // fixed inset-0：覆蓋整個畫面的半透明遮罩
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">確認刪除</h3>
            <p className="text-gray-500 text-sm mb-6">
              刪除後無法復原，該房源的所有訂單和評論也將一併刪除。
            </p>
            <div className="flex gap-3">
              {/* 取消：關閉 modal */}
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition"
              >
                取消
              </button>
              {/* 確認刪除 */}
              <button
                onClick={() => remove(deleteTarget)}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2.5 rounded-xl transition"
              >
                {isDeleting ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── 單筆房源管理卡片 ────────────────────────────
function HostListingCard({ listing, onDelete }) {
  // 計算平均評分
  const avgRating = listing.reviews?.length
    ? (listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length).toFixed(1)
    : null

  return (
    <div className="flex flex-col sm:flex-row border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition">

      {/* 縮圖 */}
      <div className="sm:w-44 h-36 sm:h-auto shrink-0">
        <img
          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 資訊 */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link
              to={`/listings/${listing.id}`}
              className="font-semibold text-gray-900 hover:underline line-clamp-1"
            >
              {listing.title}
            </Link>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full shrink-0">
              {listing.category}
            </span>
          </div>
          <p className="text-sm text-gray-500">{listing.location}</p>
        </div>

        {/* 統計數字 */}
        <div className="flex items-center justify-between mt-3">
          {/* 左側：評分和評論數 */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              NT$ {listing.price.toLocaleString()} <span className="font-normal text-gray-500">/ 晚</span>
            </span>
            {avgRating ? (
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current text-gray-900" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {avgRating} ({listing.reviews.length})
              </span>
            ) : (
              <span className="text-gray-400">尚無評論</span>
            )}
          </div>

          {/* 右側：操作按鈕 */}
          <div className="flex items-center gap-2">
            <Link
              to={`/listings/${listing.id}`}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-lg hover:border-gray-500 transition"
            >
              預覽
            </Link>
            <Link
              to={`/host/listings/${listing.id}/edit`}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-lg hover:border-gray-500 transition"
            >
              編輯
            </Link>
            <button
              onClick={onDelete}
              className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 骨架屏 ──────────────────────────────────────
function HostSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-pulse">
      <div className="flex justify-between mb-8">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-200 rounded-xl w-32" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="flex border border-gray-200 rounded-2xl overflow-hidden mb-4">
          <div className="w-44 h-36 bg-gray-200 shrink-0" />
          <div className="flex-1 p-5 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default HostListingsPage
