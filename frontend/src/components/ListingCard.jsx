// ─────────────────────────────────────────────
// 房源卡片元件
// ─────────────────────────────────────────────
// Props（屬性）：從父元件傳入的資料
//   listing：單筆房源資料物件

import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { addFavorite, removeFavorite } from '../services/api'

function ListingCard({ listing }) {
  const user = useSelector(state => state.auth.user)
  const [isFav, setIsFav] = useState(false)

  // 計算平均評分
  const avgRating = listing.reviews?.length
    ? (listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length).toFixed(1)
    : null

  const toggleFavorite = async (e) => {
    // 阻止點擊收藏時跳轉到詳情頁（因為卡片本身是 Link）
    e.preventDefault()
    if (!user) return
    try {
      if (isFav) {
        await removeFavorite(listing.id)
      } else {
        await addFavorite(listing.id)
      }
      setIsFav(!isFav)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    // Link 讓整個卡片可以點擊跳轉到詳情頁
    // group：讓子元素可以用 group-hover: 偵測父元素的 hover 狀態
    <Link to={`/listings/${listing.id}`} className="group cursor-pointer">

      {/* 圖片區塊 */}
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={listing.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={listing.title}
          // group-hover:scale-105：滑鼠移上去時圖片放大 5%
          // transition duration-300：放大動畫 0.3 秒
          className="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
        />

        {/* 收藏按鈕（右上角） */}
        {user && (
          <button
            onClick={toggleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/70 hover:bg-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFav ? 'text-rose-500 fill-rose-500' : 'text-gray-600'}`} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* 文字資訊區 */}
      <div className="mt-3">
        {/* 上排：地點 + 評分 */}
        <div className="flex justify-between items-start">
          <p className="font-semibold text-gray-900 truncate">{listing.location}</p>
          {avgRating && (
            <div className="flex items-center gap-1 text-sm text-gray-700 shrink-0 ml-2">
              {/* ★ 星星符號 */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {avgRating}
            </div>
          )}
        </div>

        {/* 房源標題 */}
        <p className="text-sm text-gray-500 truncate">{listing.title}</p>

        {/* 價格 */}
        <p className="text-sm mt-1">
          <span className="font-semibold text-gray-900">NT$ {listing.price.toLocaleString()}</span>
          <span className="text-gray-500"> / 晚</span>
        </p>
      </div>

    </Link>
  )
}

export default ListingCard
