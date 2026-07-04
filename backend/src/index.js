// ─────────────────────────────────────────────
// 後端入口檔案 (Entry Point)
// 所有請求都會先經過這裡，再分配到各個路由
// ─────────────────────────────────────────────

import 'dotenv/config'   // 讀取 .env 檔案，讓 process.env.XXX 可以使用
import express from 'express'
import cors from 'cors'  // 允許前端（不同 port）呼叫後端 API
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

// ES Modules 沒有 __dirname，用 import.meta.url 換算
const __dirname = dirname(fileURLToPath(import.meta.url))

// 引入各功能的路由檔案
import authRoutes from './routes/auth.js'
import listingRoutes from './routes/listings.js'
import bookingRoutes from './routes/bookings.js'
import reviewRoutes from './routes/reviews.js'
import favoriteRoutes from './routes/favorites.js'
import adminRoutes from './routes/admin.js'

const app = express()                          // 建立 Express 應用程式
const PORT = process.env.PORT || 5000          // 優先用 .env 的 PORT，否則預設 5000

// ── 全域中介軟體 (Middleware) ──
// CORS 只套在 /api 路由：靜態檔案和前端同網域，不需要 CORS
// 開發環境允許 Vite dev server (localhost:5173)，無 origin 表示 curl/Postman 也允許
const allowedOrigins = ['http://localhost:5173']
app.use('/api', cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
}))
app.use(express.json())   // 讓後端能讀取前端傳來的 JSON 資料 (req.body)

// ── 路由掛載 ──
// 當請求 URL 是 /api/auth/... 就交給 authRoutes 處理，以此類推
app.use('/api/auth', authRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/listings/:listingId/reviews', reviewRoutes)  // 巢狀路由：特定房源的評論
app.use('/api/favorites', favoriteRoutes)
app.use('/api/admin', adminRoutes)

// 健康檢查：用來確認伺服器是否正常運作
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// 正式環境：同時服務前端靜態檔案
// build 時前端會打包到 frontend/dist，後端統一處理所有路由（SPA refresh 不會 404）
const frontendDist = join(__dirname, '../../frontend/dist')
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  // Express 5 不支援 app.get('*')，改用 app.use() 攔截所有未匹配路由
  app.use((req, res) => {
    res.sendFile(join(frontendDist, 'index.html'))
  })
}

// 啟動伺服器，監聽指定 port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
