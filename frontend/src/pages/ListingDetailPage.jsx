// ─────────────────────────────────────────────
// 房源詳情頁
// ─────────────────────────────────────────────
// 版面：
//   上方：圖片牆
//   下方左側：標題、房東資訊、說明、地圖、評論
//   下方右側（固定）：訂房 Widget

import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { getListing } from '../services/api'
import ImageGallery from '../components/detail/ImageGallery'
import BookingWidget from '../components/detail/BookingWidget'
import ListingMap from '../components/detail/ListingMap'
import ReviewSection from '../components/detail/ReviewSection'

function ListingDetailPage() {
  // useParams：從 URL 取出動態參數
  // 路由設定是 /listings/:id，所以這裡取得 id
  const { id } = useParams()

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],  // key 包含 id，不同房源有各自的快取
    queryFn: () => getListing(id).then((res) => res.data),
  })

  if (isLoading) return <DetailSkeleton />

  if (isError) return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center text-gray-500">
      載入失敗，請重新整理頁面
    </div>
  )

  // 計算平均評分
  const avgRating = listing.reviews?.length
    ? (listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length).toFixed(1)
    : null

  // 第一張圖作為 OG 分享圖片（讓 LINE/Facebook 預覽卡片顯示房源照片）
  const ogImage = listing.images?.[0] || ''
  const description = `${listing.location} · 最多 ${listing.maxGuests} 位旅客 · NT$${listing.price}/晚`

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Helmet：每個房源頁面有獨立的 title 和 OG 圖片
          og:image 讓使用者把連結貼到 LINE/Facebook 時顯示房源照片 */}
      <Helmet>
        <title>{listing.title} — StayNest</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${listing.title} — StayNest`} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* ── 標題區 ── */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">{listing.title}</h1>
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
        {avgRating && (
          <span className="flex items-center gap-1 font-medium text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {avgRating}
            <span className="text-gray-500 font-normal">（{listing.reviews.length} 則評論）</span>
          </span>
        )}
        <span>·</span>
        <span>{listing.location}</span>
      </div>

      {/* ── 圖片牆 ── */}
      <ImageGallery images={listing.images} title={listing.title} />

      {/* ── 主要內容：左右兩欄 ── */}
      {/* lg:grid-cols-3：大螢幕分3欄，左側佔2欄、右側佔1欄 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-10">

        {/* 左側：詳情資訊 */}
        <div className="lg:col-span-2 space-y-8">

          {/* 房東資訊 */}
          <div className="flex items-center justify-between pb-8 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                由 {listing.host.name} 提供的住宿
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                最多 {listing.maxGuests} 位旅客 · {listing.category}
              </p>
            </div>
            {/* 房東頭像 */}
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-xl shrink-0">
              {listing.host.avatar
                ? <img src={listing.host.avatar} className="w-14 h-14 rounded-full object-cover" alt={listing.host.name} />
                : listing.host.name[0].toUpperCase()
              }
            </div>
          </div>

          {/* 房源特色（3個亮點） */}
          <div className="space-y-6 pb-8 border-b border-gray-200">
            <FeatureItem
              icon="🏅"
              title="超讚房東"
              desc="根據評分、評論和可靠度，他們位居前 5%"
            />
            <FeatureItem
              icon="📍"
              title="絕佳地點"
              desc="近期住客給予地點 5 顆星評價"
            />
            <FeatureItem
              icon="🔑"
              title="輕鬆入住"
              desc="辦理入住手續非常順暢"
            />
          </div>

          {/* 房源說明 */}
          <div className="pb-8 border-b border-gray-200">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* 地圖 */}
          <div className="pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">房源位置</h2>
            <ListingMap lat={listing.lat} lng={listing.lng} title={listing.title} />
            <p className="text-gray-500 text-sm mt-3">{listing.location}</p>
          </div>

          {/* 評論區 */}
          <ReviewSection
            listingId={listing.id}
            reviews={listing.reviews}
            avgRating={avgRating}
          />
        </div>

        {/* 右側：訂房 Widget（lg 以上固定在側邊） */}
        <div className="lg:col-span-1">
          {/* sticky top-24：讓訂房框在滾動時固定在畫面右側 */}
          <div className="sticky top-24">
            <BookingWidget listing={listing} />
          </div>
        </div>

      </div>
    </div>
  )
}

// ── 小元件：房源特色項目 ────────────────────────
function FeatureItem({ icon, title, desc }) {
  return (
    <div className="flex gap-4">
      <span className="text-2xl shrink-0">{icon}</span>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  )
}

// ── 載入中骨架屏 ────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-6" />
      <div className="h-96 bg-gray-200 rounded-2xl mb-10" />
      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-2 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  )
}

export default ListingDetailPage
