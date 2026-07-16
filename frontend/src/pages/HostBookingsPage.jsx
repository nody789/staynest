// ─────────────────────────────────────────────
// 房東訂單管理頁面
// ─────────────────────────────────────────────
// 功能：
//   1. 顯示我的所有房源收到的訂單
//   2. 可以確認（CONFIRMED）或拒絕（CANCELLED）PENDING 的訂單
//   3. 顯示旅客資訊

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getHostBookings, hostActionBooking } from '../services/api'

const STATUS_CONFIG = {
  PENDING:   { label: '待確認', className: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: '已確認', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
}

function HostBookingsPage() {
  const queryClient = useQueryClient()

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['host-bookings'],
    queryFn: () => getHostBookings().then((res) => res.data.bookings ?? []),
  })

  const { mutate: action, isPending } = useMutation({
    mutationFn: ({ id, status }) => hostActionBooking(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['host-bookings'] }),
  })

  if (isLoading) return <HostBookingsSkeleton />

  // 依狀態分組：先顯示待確認，再顯示其他
  const pending   = bookings.filter((b) => b.status === 'PENDING')
  const others    = bookings.filter((b) => b.status !== 'PENDING')

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">訂單管理</h1>
      <p className="text-gray-500 text-sm mb-8">管理旅客對您房源的預訂請求</p>

      {bookings.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-xl font-medium text-gray-900 mb-2">尚無訂單</p>
          <p className="text-gray-500">旅客預訂您的房源後，訂單會顯示在這裡</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* 待確認的訂單（最優先處理） */}
          {pending.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                待確認（{pending.length}）
              </h2>
              <div className="space-y-3">
                {pending.map((booking) => (
                  <HostBookingCard
                    key={booking.id}
                    booking={booking}
                    onConfirm={() => action({ id: booking.id, status: 'CONFIRMED' })}
                    onReject={() => action({ id: booking.id, status: 'CANCELLED' })}
                    isPending={isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 其他訂單 */}
          {others.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3">歷史紀錄</h2>
              <div className="space-y-3">
                {others.map((booking) => (
                  <HostBookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}

// ── 房東訂單卡片 ─────────────────────────────────
function HostBookingCard({ booking, onConfirm, onReject, isPending }) {
  const { listing, guest } = booking
  const status = STATUS_CONFIG[booking.status]

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })

  const nights = Math.ceil(
    (new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">

        {/* 房源縮圖 */}
        <img
          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200'}
          alt={listing.title}
          className="w-full sm:w-28 h-20 object-cover rounded-xl shrink-0"
        />

        {/* 主要資訊 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-semibold text-gray-900 truncate">{listing.title}</p>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${status.className}`}>
              {status.label}
            </span>
          </div>

          {/* 旅客資訊 */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 text-xs font-bold shrink-0">
              {guest.avatar
                ? <img src={guest.avatar} className="w-6 h-6 rounded-full object-cover" alt={guest.name} />
                : guest.name[0].toUpperCase()
              }
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{guest.name}</span>
              <span className="text-gray-400 ml-1">· {guest.email}</span>
            </p>
          </div>

          {/* 日期和金額 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <span>
              {formatDate(booking.checkIn)} － {formatDate(booking.checkOut)}
              <span className="text-gray-400 ml-1">({nights} 晚)</span>
            </span>
            <span className="font-semibold text-gray-900">
              NT$ {booking.totalPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 操作按鈕（只有 PENDING 才顯示） */}
      {booking.status === 'PENDING' && onConfirm && (
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={onReject}
            disabled={isPending}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
          >
            拒絕
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50 transition"
          >
            確認訂單
          </button>
        </div>
      )}
    </div>
  )
}

function HostBookingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-40 mb-8" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-gray-200 rounded-2xl p-5">
          <div className="flex gap-4">
            <div className="w-28 h-20 bg-gray-200 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default HostBookingsPage
