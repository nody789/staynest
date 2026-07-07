# StayNest — 全端房源租賃平台

旅客可瀏覽房源、訂房、留評；房東可管理房源與訂單；後台可管理整個平台。
使用 React + Node.js 全端開發，部署於 Render。

![CI](https://github.com/nody789/airbnb-clone/actions/workflows/test.yml/badge.svg)

> **Live Demo：** [https://staynest-siy5.onrender.com](https://staynest-siy5.onrender.com)
> **API 文件（Swagger）：** [https://staynest-siy5.onrender.com/api-docs](https://staynest-siy5.onrender.com/api-docs)
> **⚠️ 免費方案：** 閒置 15 分鐘後休眠，第一次載入約需 30 秒喚醒
> **Demo 帳號：** 見下方說明

---

## 功能總覽

### 一般旅客
- 瀏覽 28 筆房源（7 種分類：海景、山景、市中心、農村、豪宅、獨特住宿、島嶼）
- 依地點、人數、分類篩選房源
- Leaflet 互動地圖顯示房源位置
- 訂房（選擇日期、自動計算總金額）
- 訂房日期衝突即時驗證
- 查看、取消我的訂單
- 收藏 / 取消收藏房源
- 評論與星等評分（**限完成入住後才可留評，每人只能留一則**）
- 個人資料設定、修改密碼

### 房東（Host）
- 個人設定頁一鍵開啟房東模式
- 新增、編輯、刪除房源（含 Cloudinary 圖片上傳）
- 查看訂單列表，確認或拒絕旅客預訂

### Admin 後台（/admin/login）
- 儀表板（使用者數、房源數、訂單數、評論數）
- 使用者管理（停用 / 啟用帳號）
- 房源管理（強制下架）
- 訂單管理（全平台）
- 評論管理（刪除不當評論）

---

## API 文件

本專案提供互動式 API 文件（Swagger UI），可直接在瀏覽器測試所有 API。

**線上版：** [https://staynest-siy5.onrender.com/api-docs](https://staynest-siy5.onrender.com/api-docs)
**本機版：** `http://localhost:5000/api-docs`（啟動後端後）

### 使用步驟

1. 打開上方連結
2. 展開 **認證 → POST /auth/login**，點 **Try it out**
3. 填入 Demo 帳號（見下方），按 **Execute**，從回應複製 `token`
4. 點右上角 **Authorize 🔓**，貼上 token
5. 即可測試所有需要登入的 API（顯示 🔒 的端點）

### 涵蓋端點

| 分類 | 功能 |
|------|------|
| 認證 | 註冊、登入、取得個人資料、修改密碼、上傳頭像 |
| 房源 | 列表（搜尋/篩選/分頁）、詳情、新增、編輯、刪除、圖片上傳 |
| 訂房 | 建立訂單、查看訂單、取消、房東確認/拒絕 |
| 評論 | 查詢、新增（限完成入住後）|
| 收藏 | 查詢、新增、移除 |

---

## 技術棧

### 前端

| 用途 | 技術 | 版本 |
|------|------|------|
| 框架 | React | 19 |
| 建置工具 | Vite | 5 |
| 樣式 | Tailwind CSS | 3 |
| 路由 | React Router DOM | 7 |
| 伺服器狀態 | @tanstack/react-query | 5 |
| 全域狀態 | Zustand | 5 |
| 地圖 | Leaflet + React Leaflet | — |
| HTTP | Axios（JWT interceptor） | — |
| 測試 | Vitest + @testing-library/react | — |

### 後端

| 用途 | 技術 | 版本 |
|------|------|------|
| 框架 | Node.js + Express | 5 |
| 語言 | JavaScript（ES Modules） | — |
| 資料庫 ORM | Prisma | 6 |
| 資料庫 | PostgreSQL（Neon） | — |
| 認證 | JWT（jsonwebtoken + bcryptjs） | — |
| 圖片儲存 | Cloudinary + multer | — |

### DevOps

| 用途 | 技術 |
|------|------|
| CI | GitHub Actions（push to main 自動跑前端測試）|
| 部署 | Render Web Service（後端同時 serve 前端） |

---

## Demo 帳號

| 角色 | Email | 密碼 | 可以做什麼 |
|------|-------|------|-----------|
| 旅客 | guest@demo.com | demo1234 | 訂房、收藏、留評（需先完成訂單）|
| 房東 | host@demo.com | demo1234 | 管理房源、確認旅客訂單 |
| 房東 | host2@demo.com | demo1234 | 同上 |
| Admin | admin@demo.com | demo1234 | 存取 /admin 後台 |

> Admin 後台入口：`{URL}/admin/login`（與前台登入分開）

---

## 系統架構

```
瀏覽器
  │
  ├── GET /              前端（React + Vite 靜態檔，後端一起 serve）
  │     └── 呼叫 /api/*  所有 API 請求
  │
  └── /api/*             Express 後端（Render Web Service）
        ├── /auth         登入 / 註冊 / 個人資料
        ├── /listings     房源 CRUD + 搜尋篩選
        ├── /bookings     訂房系統
        ├── /listings/:id/reviews  評論（巢狀路由）
        ├── /favorites    收藏
        └── /admin        後台管理（role: ADMIN 限定）
```

**部署策略：** 後端同時 serve 前端靜態檔案，Render 上只需一個 Web Service，無需額外費用。

---

## 技術亮點

### 1. 訂房日期衝突檢查（後端）

新訂單建立前，後端用 Prisma OR 查詢涵蓋所有重疊情況：

```js
// 兩個日期區間只要有任何重疊就視為衝突
const conflict = await prisma.booking.findFirst({
  where: {
    listingId,
    status: 'CONFIRMED',
    OR: [{ checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }],
  },
})
if (conflict) return res.status(409).json({ message: '此日期已被預訂' })
```

### 2. 評論資格雙重驗證

後端在 POST 評論前驗證兩個條件：

```js
// 驗證 1：防重複留評
const existingReview = await prisma.review.findFirst({
  where: { listingId, authorId: userId },
})
if (existingReview) return res.status(409).json({ message: '已留過評論' })

// 驗證 2：確認有完成入住紀錄
const completedBooking = await prisma.booking.findFirst({
  where: {
    listingId, guestId: userId, status: 'CONFIRMED',
    checkOut: { lt: new Date() },  // 退房日期已過
  },
})
if (!completedBooking) return res.status(403).json({ message: '只有完成入住才能留評' })
```

### 3. 雙層狀態管理

| 狀態類型 | 工具 | 理由 |
|---------|------|------|
| 伺服器資料（房源、訂單）| React Query | 自動 cache、loading、error，避免重複請求 |
| Client 端全域（登入者）| Zustand | 輕量、不需 Provider |

### 4. Admin 角色隔離

後端 `isAdmin` middleware 驗證 `role === 'ADMIN'`，所有 `/api/admin/*` 路由皆需通過。
前端 Admin 後台使用獨立 Layout 與路由守衛（`AdminRoute.jsx`），與前台完全分離。

---

## 資料庫 Schema

```
User
  id, name, email, password, avatar
  isHost（房東模式）, isActive（帳號狀態）, role（USER / ADMIN）
  → Listing[], Booking[], Review[], Favorite[]

Listing
  id, title, description, price, location, lat, lng
  images（String[]）, maxGuests, category
  → Booking[], Review[], Favorite[]

Booking
  id, checkIn, checkOut, totalPrice
  status（PENDING / CONFIRMED / CANCELLED）
  → User(guest), Listing

Review
  id, rating（1-5）, comment
  → User(author), Listing

Favorite
  → User, Listing（@@unique 防重複收藏）
```

---

## 本機開發

### 環境需求
- Node.js 20+
- PostgreSQL（或 [Neon](https://neon.tech) 免費帳號）
- [Cloudinary](https://cloudinary.com) 免費帳號（圖片上傳）

### 步驟

```bash
# 1. Clone
git clone https://github.com/nody789/airbnb-clone.git
cd airbnb-clone

# 2. 後端環境變數
cp backend/.env.example backend/.env
# 編輯 backend/.env（填入 Neon、JWT_SECRET、Cloudinary）

# 3. 後端安裝 & 建立資料表
cd backend
npm install
npx prisma migrate deploy
npx prisma generate

# 4. 匯入示範資料（28 筆房源 + 4 個帳號）
node src/seed.js

# 5. 啟動後端（port 5000）
npm run dev

# 6. 另開終端：啟動前端（port 5173）
cd ../frontend
npm install
npm run dev
```

---

## 測試

```bash
cd frontend
npm run test
```

GitHub Actions 在每次 push to main 時自動執行。

---

## 未來規劃

- [ ] Calendar 標示已佔用日期
- [ ] 房源列表分頁
- [ ] 使用者頭像 Cloudinary 上傳
- [ ] Email 通知（SendGrid）
