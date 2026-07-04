// ─────────────────────────────────────────────
// 地圖元件（Leaflet.js + OpenStreetMap）
// ─────────────────────────────────────────────
// Leaflet 是免費開源的地圖套件，搭配 OpenStreetMap 的地圖圖層
// 完全免費，不需要任何 API Key
//
// react-leaflet 是 Leaflet 的 React 封裝版
//   MapContainer  → 地圖容器
//   TileLayer     → 地圖圖層（OpenStreetMap 的圖塊）
//   Marker        → 位置標記
//   Popup         → 點擊標記後的彈出框

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Leaflet 預設 icon 在 webpack/vite 打包時會找不到圖片，這裡手動修正
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function ListingMap({ lat, lng, title }) {
  // lat/lng 可能是字串，確保轉成數字
  const position = [parseFloat(lat), parseFloat(lng)]

  return (
    // h-72：地圖高度 288px
    // z-0：確保地圖在其他元素下方（Leaflet 的 z-index 較高）
    <div className="h-72 rounded-2xl overflow-hidden z-0">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        // scrollWheelZoom 設為 false，避免頁面滾動時意外縮放地圖
        scrollWheelZoom={false}
      >
        {/* TileLayer：地圖底圖，這裡使用 OpenStreetMap 免費圖層 */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={position}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold mb-1">{title}</p>
              {/* 點擊後在新分頁開啟 Google Maps，方便旅客規劃路線 */}
              <a
                href={`https://www.google.com/maps?q=${position[0]},${position[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-xs"
              >
                在 Google Maps 開啟 →
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

export default ListingMap
