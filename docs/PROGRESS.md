# PROGRESS.md — StayNest 專案進度

> 每次開新對話請先閱讀此文件，確認目前狀態後再繼續開發。
> 最後更新：2026-06-29

---

## 專案基本資訊

| 項目 | 值 |
|------|-----|
| GitHub | https://github.com/nody789/airbnb-clone |
| 後端 URL（Render） | https://staynest-siy5.onrender.com |
| 資料庫 | Neon PostgreSQL |
| 圖片儲存 | Cloudinary |
| Demo 帳號 | 請見 README.md 的 Demo Accounts 區段 |

---

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | React 19 + Vite 5 + Tailwind CSS 3 |
| 狀態 | Zustand + React Query |
| 地圖 | Leaflet + React Leaflet |
| 後端 | Node.js + Express 5（ES Modules） |
| ORM | Prisma 6 |
| 資料庫 | PostgreSQL（Neon） |
| 圖片 | Cloudinary |
| 認證 | JWT |
| 測試 | Vitest + @testing-library/react |
| CI | GitHub Actions |
| 部署 | Render Web Service |

---

## 已完成功能

### 後端 ✅

- [x] Express 伺服器（ES Modules）
- [x] Prisma + PostgreSQL（User, Listing, Booking, Review, Favorite）
- [x] JWT 認證（register, login, me, change password）
- [x] 房源 CRUD（含搜尋篩選）
- [x] 訂房系統（PENDING → CONFIRMED/CANCELLED）
- [x] 訂房日期衝突檢查
- [x] 房東訂單管理（host-action）
- [x] 評論（巢狀路由）
- [x] 收藏
- [x] 圖片上傳（Cloudinary + multer）
- [x] Seed 資料（7 個分類各 4 筆共 28 筆房源、3 使用者 + 1 admin、多筆評論）
- [x] Admin 後台 API（stats / users / listings / bookings / reviews）

### 前端 ✅

- [x] 首頁（房源列表、搜尋、篩選、地圖）
- [x] 房源詳情頁（圖片、地圖、評論、訂房）
- [x] 使用者認證（登入/註冊 Modal）
- [x] 收藏功能
- [x] 訂房管理（我的訂單）
- [x] 房東功能（新增/修改/刪除房源、訂單管理）
- [x] 個人設定（修改密碼）
- [x] 前端測試（Vitest）
- [x] GitHub Actions CI
- [x] Admin 後台（獨立 Layout：儀表板、使用者、房源、訂單、評論管理）

---

## 待完成項目

### 部署

- [ ] 建立 Render Web Service
  - Root Directory：`backend`
  - Build Command：`cd ../frontend && npm install --include=dev && npm run build && cd ../backend && npm install && npx prisma generate && npx prisma migrate deploy`
  - Start Command：`node src/index.js`
- [x] 在後端 `src/index.js` 加上靜態檔案服務（讓後端同時 serve 前台）
- [ ] 設定 Render 環境變數（DATABASE_URL、DATABASE_URL_UNPOOLED、JWT_SECRET、Cloudinary）
- [ ] 在 Neon 建立正式環境資料庫（或沿用現有）
- [ ] 填入部署後的後端 URL 到此文件

### 功能優化（可選）

- [x] 圖片上傳：新增/編輯房源支援 Cloudinary 上傳（同時保留貼網址選項）
- [x] 訂房日期衝突檢查（後端驗證已完成，bookings.js 有 OR 重疊判斷）
- [x] 評論：限制只有實際訂過房的使用者才能留評
- [x] 分頁（後端 skip/take，前端 URL 頁碼，HostListingsPage 用 hostId 過濾）
- [x] 使用者頭像 Cloudinary 上傳（點擊頭像直接選檔案）
- [x] 首頁搜尋結果左右地圖並排（價格標籤 Marker，sticky 側邊）
- [x] 詳情頁地圖 Marker 加「在 Google Maps 開啟」連結

---

## 目錄結構

```
airbnb-clone/
├── backend/
│   ├── prisma/schema.prisma    資料庫 schema
│   ├── src/
│   │   ├── routes/             auth, listings, bookings, reviews, favorites
│   │   ├── middleware/auth.js  JWT 驗證
│   │   ├── utils/prisma.js     Prisma Client 單例
│   │   ├── seed.js             測試種子資料
│   │   └── index.js            Express 入口
│   └── .env.example
├── frontend/
│   ├── public/_redirects       SPA routing 修正
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/           API 呼叫
│       ├── stores/             Zustand
│       └── test/
└── docs/
```

---

## 環境變數（backend/.env）

```env
DATABASE_URL=           # Neon pooled connection
DATABASE_URL_UNPOOLED=  # Neon direct connection（prisma migrate 用）
JWT_SECRET=
PORT=5000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
