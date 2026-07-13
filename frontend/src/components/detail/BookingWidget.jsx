// ─────────────────────────────────────────────
// 訂房 Widget（右側固定欄）
// ─────────────────────────────────────────────
// 功能：
//   1. 選擇入住/退房日期
//   2. 自動計算總價
//   3. 送出訂房請求
//   4. 未登入時提示前往登入

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { createBooking, getBookedDates } from '../../services/api'

function BookingWidget({ listing }) {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [message, setMessage] = useState('')   // 成功或錯誤訊息

  // 從 Redux store 取得登入使用者（與 LoginPage / Navbar 共用同一個 store）
  const user = useSelector(state => state.auth.user)

  // ── 取得這個房源已被預訂的日期範圍 ─────────────
  // 用途：顯示給使用者看哪些日期不可選，以及在送出前做前端驗證
  // staleTime：5 分鐘內不重新請求（訂房不會太頻繁變動）
  const { data: bookedPeriods = [] } = useQuery({
    queryKey: ['booked-dates', listing.id],
    queryFn: () => getBookedDates(listing.id).then(res => res.data),
    staleTime: 1000 * 60 * 5,
  })
  const navigate = useNavigate()
  const queryClient = useQueryClient()  // 用來讓某個快取失效（觸發重新請求）

  // 計算天數：兩個日期相減，轉成天數
  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    : 0

  // 服務費（模擬 Airbnb 的服務費，約 15%）
  const serviceFee = nights > 0 ? Math.round(listing.price * nights * 0.15) : 0
  const totalPrice = nights > 0 ? listing.price * nights + serviceFee : 0

  // useMutation：處理 POST/PUT/DELETE 等會改變資料的請求
  //   mutate(data)   → 觸發請求
  //   isPending      → 請求中
  //   onSuccess      → 成功後執行
  //   onError        → 失敗後執行
  const { mutate: book, isPending } = useMutation({
    mutationFn: (data) => createBooking(data),
    onSuccess: () => {
      setMessage('訂房成功！')
      setCheckIn('')
      setCheckOut('')
      // 讓訂單列表快取失效，下次進訂單頁時會重新請求最新資料
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (err) => {
      setMessage(err.response?.data?.message || '訂房失敗，請稍後再試')
    },
  })

  // ── 檢查選擇的日期是否與已預訂期間衝突 ──────────
  // 兩個日期區間重疊的條件：A.start < B.end 且 A.end > B.start
  const hasDateConflict = (start, end) => {
    return bookedPeriods.some(period => {
      const bookedStart = new Date(period.checkIn)
      const bookedEnd = new Date(period.checkOut)
      return new Date(start) < bookedEnd && new Date(end) > bookedStart
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage('')

    // 未登入時跳轉到登入頁
    if (!user) {
      navigate('/login')
      return
    }

    if (nights <= 0) {
      setMessage('退房日期必須晚於入住日期')
      return
    }

    // 前端先驗證日期衝突（後端也會再驗一次，這裡只是提前告知使用者）
    if (hasDateConflict(checkIn, checkOut)) {
      setMessage('此期間已有其他旅客預訂，請重新選擇日期')
      return
    }

    book({
      listingId: listing.id,
      checkIn,
      checkOut,
      totalPrice,
    })
  }

  // 今天的日期（input[type=date] 的 min 值，不能選過去的日期）
  const today = new Date().toISOString().split('T')[0]

  // 格式化日期顯示用：2024-01-15 → 1/15
  const formatDate = (iso) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  return (
    <div className="border border-gray-300 rounded-2xl p-6 shadow-lg">

      {/* 價格 */}
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-2xl font-semibold text-gray-900">
          NT$ {listing.price.toLocaleString()}
        </span>
        <span className="text-gray-500">/ 晚</span>
      </div>

      <form onSubmit={handleSubmit}>

        {/* 日期選擇 */}
        <div className="border border-gray-300 rounded-xl overflow-hidden mb-4">
          <div className="grid grid-cols-2 divide-x divide-gray-300">
            <div className="p-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">入住</label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => {
                  setCheckIn(e.target.value)
                  // 如果退房日期早於新的入住日期，清除退房日期
                  if (checkOut && e.target.value >= checkOut) setCheckOut('')
                }}
                className="w-full text-sm text-gray-900 focus:outline-none"
              />
            </div>
            <div className="p-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">退房</label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}  // 退房至少要在入住日之後
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full text-sm text-gray-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 已佔用日期提示（有預訂紀錄才顯示） */}
        {bookedPeriods.length > 0 && (
          <div className="mb-4 text-xs text-gray-500">
            <p className="font-medium mb-1">已預訂期間（不可選）：</p>
            <div className="flex flex-wrap gap-1">
              {bookedPeriods.map((p, i) => (
                <span key={i} className="bg-gray-100 rounded px-2 py-0.5">
                  {formatDate(p.checkIn)} – {formatDate(p.checkOut)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 訂房按鈕 */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 rounded-xl transition text-sm"
        >
          {isPending ? '處理中...' : user ? '預訂' : '登入後預訂'}
        </button>
      </form>

      {/* 訊息（成功或錯誤） */}
      {message && (
        <p className={`text-sm text-center mt-3 ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}

      {/* 費用明細（選好日期才顯示） */}
      {nights > 0 && (
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>NT$ {listing.price.toLocaleString()} × {nights} 晚</span>
            <span>NT$ {(listing.price * nights).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>服務費</span>
            <span>NT$ {serviceFee.toLocaleString()}</span>
          </div>
          {/* border-t：上方加分隔線 */}
          <div className="flex justify-between font-semibold text-gray-900 pt-3 border-t border-gray-200">
            <span>總計</span>
            <span>NT$ {totalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* 提示文字 */}
      <p className="text-xs text-center text-gray-400 mt-4">尚未收費，確認後才計費</p>

    </div>
  )
}

export default BookingWidget
