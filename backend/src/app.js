// ─────────────────────────────────────────────
// Express App 設定
// 把 app 的建立和 server 的啟動分開：
//   app.js   → 建立 app、掛載 middleware 和路由（測試可以直接 import）
//   index.js → 啟動 server（呼叫 app.listen）
//
// 為什麼要拆？
// supertest 直接拿 app 物件打 API，不需要真的啟動 server
// 如果 listen 寫在 app.js 裡，每次 import 就會佔用一個 port
// ─────────────────────────────────────────────

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger.js'

import authRoutes from './routes/auth.js'
import listingRoutes from './routes/listings.js'
import bookingRoutes from './routes/bookings.js'
import reviewRoutes from './routes/reviews.js'
import favoriteRoutes from './routes/favorites.js'
import adminRoutes from './routes/admin.js'

const app = express()

// Render 等雲端平台使用反向代理（Nginx），必須信任 X-Forwarded-For header
// 否則 req.ip 永遠是內部 proxy IP，rate limiter 會把所有使用者當同一個 IP
app.set('trust proxy', 1)

// CORS 只套在 /api 路由
// 正式環境：前後端同網域，瀏覽器 POST 仍會帶 Origin header，需要明確允許
// PRODUCTION_URL 環境變數可在 Render 設定，預設 fallback 到目前的 Render URL
const allowedOrigins = [
  'http://localhost:5173',
  process.env.PRODUCTION_URL || 'https://staynest-siy5.onrender.com',
]
app.use('/api', cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
}))
app.use(express.json())

// Swagger API 文件
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// 路由掛載
app.use('/api/auth', authRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/listings/:listingId/reviews', reviewRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

export default app
