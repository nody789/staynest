// ─────────────────────────────────────────────
// 評論區元件
// ─────────────────────────────────────────────
// 功能：
//   1. 顯示平均評分和所有評論
//   2. 有完成入住紀錄的旅客才能留評
//   3. 每人只能留一則評論（防重複）
//
// 留評資格判斷流程：
//   未登入              → 顯示「請登入」
//   已留評              → 顯示「已留評」
//   登入但未完成入住    → 顯示「需完成入住」
//   登入且有完成入住    → 顯示表單

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { createReview, getBookings } from '../../services/api'

function ReviewSection({ listingId, reviews = [], avgRating }) {
  // 從 Redux store 取得目前登入的使用者（與整個 App 共用同一個 store）
  const user = useSelector(state => state.auth.user)
  const queryClient = useQueryClient()

  // 新增評論的表單狀態
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [hoverRating, setHoverRating] = useState(0)  // 滑鼠移上星星時的暫時評分

  // ── 取得使用者的所有訂單（只有登入才查詢）──────
  // enabled: !!user 的意思：只有 user 不是 null 時才發出請求
  // 用途：判斷這個使用者是否有完成入住紀錄
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => getBookings().then(res => res.data.bookings),
    enabled: !!user,
  })

  // ── 判斷留評資格 ─────────────────────────────
  // 已留評：reviews prop 裡有這個使用者的評論
  const hasAlreadyReviewed = reviews.some(r => r.author.id === user?.id)

  // 有完成入住：這個房源有一筆訂單符合以下所有條件：
  //   1. listingId 對應到目前房源
  //   2. status === 'CONFIRMED'（房東已確認）
  //   3. checkOut 已過（已退房）
  const hasCompletedStay = bookings.some(
    b => b.listingId === listingId &&
         b.status === 'CONFIRMED' &&
         new Date(b.checkOut) < new Date()
  )

  // 可以留評：已登入 + 有完成入住 + 尚未留評
  const canReview = !!user && hasCompletedStay && !hasAlreadyReviewed

  const { mutate: submitReview, isPending, error: submitError } = useMutation({
    mutationFn: (data) => createReview(listingId, data),
    onSuccess: () => {
      setComment('')
      setRating(5)
      // 讓這筆房源的快取失效，重新拉取包含新評論的資料
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    submitReview({ rating, comment })
  }

  return (
    <div>
      {/* ── 評分統計 ── */}
      <div className="flex items-center gap-3 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current text-gray-900" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-xl font-semibold text-gray-900">
          {avgRating ? `${avgRating} · ${reviews.length} 則評論` : '尚無評論'}
        </span>
      </div>

      {/* ── 評論列表 ── */}
      {/* grid-cols-2：兩欄顯示評論 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* ── 留評區塊：根據資格顯示不同內容 ── */}
      {!user ? (
        // 未登入
        <p className="text-sm text-gray-500 bg-gray-50 rounded-2xl p-6 text-center">
          請先<a href="/login" className="text-rose-500 font-medium hover:underline mx-1">登入</a>才能留下評論
        </p>
      ) : hasAlreadyReviewed ? (
        // 已留評過
        <div className="bg-green-50 rounded-2xl p-6 text-center">
          <p className="text-sm text-green-700 font-medium">您已經留下了評論，感謝您的回饋！</p>
        </div>
      ) : !hasCompletedStay ? (
        // 登入但沒有完成入住紀錄
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-600 font-medium mb-1">只有完成入住的旅客才能留下評論</p>
          <p className="text-xs text-gray-400">完成訂單並退房後即可留評</p>
        </div>
      ) : (
        // 可以留評：顯示表單
        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">留下您的評論</h3>

          {/* 後端拒絕時的錯誤訊息（作為最後防線） */}
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 mb-4">
              {submitError.response?.data?.message || '提交失敗，請稍後再試'}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* 星星評分選擇器 */}
            <div>
              <p className="text-sm text-gray-600 mb-2">評分</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}   // 滑鼠移入：暫時高亮
                    onMouseLeave={() => setHoverRating(0)}      // 滑鼠移出：恢復
                    className="focus:outline-none"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-7 w-7 transition ${
                        star <= (hoverRating || rating) ? 'text-rose-500 fill-rose-500' : 'text-gray-300 fill-gray-300'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* 評論文字 */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="分享您的住宿體驗..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none transition"
            />

            <button
              type="submit"
              disabled={isPending || !comment.trim()}
              className="bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 text-white font-medium px-6 py-2 rounded-xl text-sm transition"
            >
              {isPending ? '提交中...' : '提交評論'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

// ── 單筆評論卡片 ────────────────────────────────
function ReviewCard({ review }) {
  // 格式化日期：2024-01-15 → 2024年1月
  const date = new Date(review.createdAt).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-3">
      {/* 評論者資訊 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold shrink-0">
          {review.author.avatar
            ? <img src={review.author.avatar} className="w-10 h-10 rounded-full object-cover" alt={review.author.name} />
            : review.author.name[0].toUpperCase()
          }
        </div>
        <div>
          <p className="font-medium text-sm text-gray-900">{review.author.name}</p>
          <p className="text-xs text-gray-400">{date}</p>
        </div>
      </div>

      {/* 星星評分 */}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} xmlns="http://www.w3.org/2000/svg"
            className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-gray-900' : 'fill-gray-200'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* 評論內容 */}
      <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
    </div>
  )
}

export default ReviewSection
