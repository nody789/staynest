// ─────────────────────────────────────────────
// 房源列表地圖（首頁用，顯示多個標記）
// ─────────────────────────────────────────────
// 和 detail/ListingMap.jsx 的差別：
//   ListingMap    → 只顯示一個房源的位置（詳情頁用）
//   ListingsMap   → 顯示所有當前列表的房源（首頁側邊地圖用）
//
// 功能：
//   - 每個房源用「價格標籤」當作 Marker（比預設圖釘更像 Airbnb）
//   - 點擊標記顯示房源縮圖、名稱、評分
//   - 自動調整縮放範圍以顯示所有標記（FitBounds）

import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// 修正 Leaflet 在 Vite 打包時找不到預設圖示的問題
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon   from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

// 自訂價格標籤 icon（比預設圖釘更直覺）
// L.divIcon：用 HTML 字串建立自訂 Marker
const priceIcon = (price) => L.divIcon({
  className: '',
  html: `<div style="background:white;border:1.5px solid #222;border-radius:20px;padding:3px 9px;font-weight:700;font-size:12px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.18);cursor:pointer">NT$${Number(price).toLocaleString()}</div>`,
  iconAnchor: [32, 14],  // 標籤錨點對準座標點
})

// 自動把地圖縮放範圍調整成能看到全部標記
// useMap()：react-leaflet 的 hook，只能在 MapContainer 子元件裡呼叫
function FitBounds({ listings }) {
  const map = useMap()

  useEffect(() => {
    if (!listings.length) return
    if (listings.length === 1) {
      // 只有一筆時直接置中
      map.setView([parseFloat(listings[0].lat), parseFloat(listings[0].lng)], 13)
      return
    }
    // 計算所有標記的邊界框，再 fitBounds 自動縮放
    const bounds = L.latLngBounds(
      listings.map((l) => [parseFloat(l.lat), parseFloat(l.lng)])
    )
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [listings, map])

  return null
}

function ListingsMap({ listings }) {
  // 初始中心：取第一筆房源，若無資料則用台灣中心
  const center = listings.length > 0
    ? [parseFloat(listings[0].lat), parseFloat(listings[0].lng)]
    : [23.8, 121]

  return (
    <MapContainer
      center={center}
      zoom={7}
      style={{ height: '100%', width: '100%' }}
      // 側邊地圖允許滾輪縮放（不像詳情頁嵌在頁面中間容易誤觸）
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* listings 改變時重新 fitBounds（切換篩選、換頁時自動調整） */}
      <FitBounds listings={listings} />

      {listings.map((listing) => {
        // 計算平均評分（資料已從後端帶回）
        const avgRating = listing.reviews?.length
          ? (listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length).toFixed(1)
          : null

        return (
          <Marker
            key={listing.id}
            position={[parseFloat(listing.lat), parseFloat(listing.lng)]}
            icon={priceIcon(listing.price)}
          >
            {/* Popup：點擊標籤後顯示的房源卡片 */}
            <Popup maxWidth={200} className="listing-popup">
              <Link to={`/listings/${listing.id}`} className="block w-48 no-underline text-inherit">
                {/* 縮圖 */}
                <img
                  src={listing.images?.[0] || 'https://via.placeholder.com/200x120?text=No+Image'}
                  alt={listing.title}
                  className="w-full h-28 object-cover rounded-lg mb-2"
                />
                {/* 房源標題 */}
                <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2 mb-0.5">
                  {listing.title}
                </p>
                <p className="text-xs text-gray-500 mb-1">{listing.location}</p>
                {/* 價格 + 評分 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    NT${Number(listing.price).toLocaleString()}
                    <span className="font-normal text-gray-500 text-xs"> / 晚</span>
                  </span>
                  {avgRating && (
                    <span className="flex items-center gap-0.5 text-xs text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {avgRating}
                    </span>
                  )}
                </div>
              </Link>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

export default ListingsMap
