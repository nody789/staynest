// ─────────────────────────────────────────────
// 我的訂單頁面
// ─────────────────────────────────────────────
// 功能：
//   1. 顯示所有訂單（依狀態分類）
//   2. 可以取消 PENDING 狀態的訂單
//   3. 不同狀態顯示不同顏色標籤

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getBookings, updateBooking } from '../services/api'

// 訂單狀態的中文對照和樣式
// 這種把設定集中放在頂部的方式，讓元件內容更乾淨
const STATUS_CONFIG = {
  PENDING: {
    label: '待確認',
    // Tailwind 顏色：bg-yellow-100 淺黃底、text-yellow-700 深黃字
    className: 'bg-yellow-100 text-yellow-700',
  },
  CONFIRMED: {
    label: '已確認',
    className: 'bg-green-100 text-green-700',
  },
  CANCELLED: {
    label: '已取消',
    className: 'bg-gray-100 text-gray-500',
  },
}

function BookingsPage() {
  const queryClient = useQueryClient()

  // 取得我的訂單列表
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => getBookings().then((res) => res.data.bookings ?? []),
  })

  // 取消訂單的 mutation
  // variables 是呼叫 mutate() 時傳入的參數
  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationFn: (bookingId) => updateBooking(bookingId, { status: 'CANCELLED' }),
    onSuccess: () => {
      // 讓訂單快取失效，觸發重新請求，畫面自動更新
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })

  if (isLoading) return <BookingsSkeleton />

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">我的訂單</h1>

      {bookings.length === 0 ? (
        // 空狀態：沒有訂單時顯示
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🧳</div>
          <p className="text-xl font-medium text-gray-900 mb-2">尚無訂單</p>
          <p className="text-gray-500 mb-6">還沒有預訂過任何住宿</p>
          <a
            href="/"
            className="inline-block bg-rose-500 text-white font-medium px-6 py-3 rounded-xl hover:bg-rose-600 transition"
          >
            探索住宿
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={() => cancel(booking.id)}
              isCancelling={isCancelling}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── 單筆訂單卡片 ────────────────────────────────
function BookingCard({ booking, onCancel, isCancelling }) {
  const { listing } = booking
  const status = STATUS_CONFIG[booking.status]

  // 格式化日期顯示：2024-01-15 → 1月15日
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })

  // 計算住幾晚
  const nights = Math.ceil(
    (new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)
  )

  return (
    // sm:flex-row：手機垂直排列，大螢幕水平排列
    <div className="flex flex-col sm:flex-row border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition">

      {/* 房源圖片 */}
      <div className="sm:w-48 h-40 sm:h-auto shrink-0">
        <img
          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 訂單資訊 */}
      {/* flex-1：佔滿剩餘空間 */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          {/* 標題 + 狀態標籤 */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <a
              href={`/listings/${listing.id}`}
              className="font-semibold text-gray-900 hover:underline line-clamp-1"
            >
              {listing.title}
            </a>
            {/* 狀態標籤：px-2.5 py-0.5 是小 badge 的常用 padding */}
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${status.className}`}>
              {status.label}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-3">{listing.location}</p>

          {/* 日期資訊 */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {formatDate(booking.checkIn)} － {formatDate(booking.checkOut)}
              <span className="text-gray-400 ml-2">({nights} 晚)</span>
            </span>
          </div>
        </div>

        {/* 底部：價格 + 取消按鈕 */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">總金額</p>
            <p className="font-semibold text-gray-900">
              NT$ {booking.totalPrice.toLocaleString()}
            </p>
          </div>

          {/* 只有 PENDING 狀態才顯示取消按鈕 */}
          {booking.status === 'PENDING' && (
            <button
              onClick={onCancel}
              disabled={isCancelling}
              className="text-sm font-medium text-gray-600 border border-gray-300 hover:border-gray-500 px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              取消訂單
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 載入中骨架屏 ────────────────────────────────
function BookingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
      <div className="h-8 bg-gray-200 rounded w-32 mb-8 animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
          <div className="w-48 h-40 bg-gray-200 shrink-0" />
          <div className="flex-1 p-5 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default BookingsPage
