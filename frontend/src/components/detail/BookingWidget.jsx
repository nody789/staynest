// ─────────────────────────────────────────────
// 訂房 Widget（右側固定欄）
// ─────────────────────────────────────────────
// 功能：
//   1. 用 DayPicker 視覺日曆選擇入住/退房日期
//   2. 已佔用日期標灰無法選取
//   3. 自動計算總價
//   4. 送出訂房請求

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { DayPicker } from 'react-day-picker'
import { createBooking, getBookedDates } from '../../services/api'

// 將 Date 物件格式化成 "yyyy-MM-dd" 字串（API 送出用）
function toDateString(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function BookingWidget({ listing }) {
  // range：DayPicker range 模式的選取結果，格式為 { from: Date | undefined, to: Date | undefined }
  const [range, setRange] = useState(undefined)
  const [message, setMessage] = useState('')

  // 從 range 推導出 API 送出用的日期字串
  const checkIn  = toDateString(range?.from)
  const checkOut = toDateString(range?.to)

  // 從 Redux store 取得登入使用者
  const user = useSelector(state => state.auth.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // ── 取得已預訂的日期範圍 ─────────────────────
  // 用途：傳給 DayPicker 的 disabled prop，讓已佔用日期無法點選（視覺標灰）
  const { data: bookedPeriods = [] } = useQuery({
    queryKey: ['booked-dates', listing.id],
    queryFn: () => getBookedDates(listing.id).then(res => res.data),
    staleTime: 1000 * 60 * 5,
  })

  // ── 把已預訂期間轉成 DayPicker 的 disabled 格式 ──
  // DayPicker disabled 接受陣列，每個元素可以是：
  //   { before: Date }        → 這個日期之前都 disabled
  //   { from: Date, to: Date } → 這個範圍內都 disabled
  const disabledDays = [
    { before: new Date() }, // 過去日期無法選
    ...bookedPeriods.map(p => ({
      from: new Date(p.checkIn),
      to:   new Date(p.checkOut),
    })),
  ]

  // 計算天數
  const nights = range?.from && range?.to
    ? Math.ceil((range.to - range.from) / (1000 * 60 * 60 * 24))
    : 0

  const serviceFee = nights > 0 ? Math.round(listing.price * nights * 0.15) : 0
  const totalPrice = nights > 0 ? listing.price * nights + serviceFee : 0

  // 衝突檢查（後端也會再驗一次，這裡提前告知）
  const hasDateConflict = (start, end) => {
    return bookedPeriods.some(period => {
      const bookedStart = new Date(period.checkIn)
      const bookedEnd   = new Date(period.checkOut)
      return new Date(start) < bookedEnd && new Date(end) > bookedStart
    })
  }

  const { mutate: book, isPending } = useMutation({
    mutationFn: (data) => createBooking(data),
    onSuccess: () => {
      setMessage('訂房成功！')
      setRange(undefined)
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (err) => {
      setMessage(err.response?.data?.message || '訂房失敗，請稍後再試')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage('')

    if (!user) {
      navigate('/login')
      return
    }
    if (nights <= 0) {
      setMessage('請選擇入住和退房日期')
      return
    }
    if (hasDateConflict(checkIn, checkOut)) {
      setMessage('此期間已有其他旅客預訂，請重新選擇日期')
      return
    }

    book({ listingId: listing.id, checkIn, checkOut, totalPrice })
  }

  return (
    <div className="border border-gray-300 rounded-2xl p-6 shadow-lg">

      {/* 價格 */}
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-2xl font-semibold text-gray-900">
          NT$ {listing.price.toLocaleString()}
        </span>
        <span className="text-gray-500">/ 晚</span>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── 日曆選擇器 ─────────────────────────
            DayPicker mode="range"：拖曳或點兩下選取入住→退房範圍
            disabled：已佔用日期和過去日期會標灰、無法點選
            selected：目前選取的範圍（高亮顯示）
            onSelect：使用者改變選取時觸發 */}
        <div className="mb-4 flex justify-center">
          <div
            className="rounded-xl overflow-hidden border border-gray-200"
            style={{
              // 覆蓋 DayPicker 的主色，改成專案的 rose-500
              '--rdp-accent-color': '#f43f5e',
              '--rdp-accent-background-color': '#ffe4e6',
            }}
          >
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              disabled={disabledDays}
              numberOfMonths={1}
            />
          </div>
        </div>

        {/* 已選日期顯示 */}
        {(range?.from || range?.to) && (
          <div className="flex gap-2 mb-4">
            <div className="flex-1 border border-gray-300 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-700 mb-1">入住</p>
              <p className="text-sm text-gray-900">
                {range?.from ? range.from.toLocaleDateString('zh-TW') : '—'}
              </p>
            </div>
            <div className="flex-1 border border-gray-300 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-700 mb-1">退房</p>
              <p className="text-sm text-gray-900">
                {range?.to ? range.to.toLocaleDateString('zh-TW') : '請選擇'}
              </p>
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

      {/* 訊息 */}
      {message && (
        <p className={`text-sm text-center mt-3 ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}

      {/* 費用明細 */}
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
          <div className="flex justify-between font-semibold text-gray-900 pt-3 border-t border-gray-200">
            <span>總計</span>
            <span>NT$ {totalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}

      <p className="text-xs text-center text-gray-400 mt-4">尚未收費，確認後才計費</p>
    </div>
  )
}

export default BookingWidget
