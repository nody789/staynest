# PROJECT.md

## 專案名稱

Airbnb Clone

## 專案描述

仿 Airbnb 的房源租賃平台，提供使用者瀏覽、搜尋、預訂房源，房東可新增/管理自己的房源。

## 專案目標

| 角色 | 功能 |
|------|------|
| 一般使用者 | 瀏覽房源、搜尋/篩選、收藏、訂房、撰寫評論 |
| 房東（Host） | 新增/修改/刪除房源、查看訂單、確認/拒絕預訂 |

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | React 19 + Vite 5 + Tailwind CSS 3 |
| 狀態管理 | Zustand（全域）+ React Query（伺服器狀態） |
| 地圖 | Leaflet + React Leaflet |
| 後端 | Node.js + Express 5（ES Modules） |
| 資料庫 ORM | Prisma 6 |
| 資料庫 | PostgreSQL（Neon） |
| 圖片儲存 | Cloudinary（multer 上傳） |
| 認證 | JWT（jsonwebtoken + bcryptjs） |
| 測試 | Vitest + @testing-library/react |
| CI/CD | GitHub Actions（push to main 自動跑前端測試） |
| 部署 | Render（後端 Web Service） |

## 目錄結構

```
airbnb-clone/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       資料庫 schema 定義
│   │   └── migrations/         migration 歷史
│   ├── src/
│   │   ├── controllers/        業務邏輯
│   │   ├── middleware/
│   │   │   └── auth.js         JWT 驗證 middleware
│   │   ├── routes/
│   │   │   ├── auth.js         登入/註冊
│   │   │   ├── listings.js     房源 CRUD
│   │   │   ├── bookings.js     訂房
│   │   │   ├── reviews.js      評論
│   │   │   └── favorites.js    收藏
│   │   ├── utils/
│   │   │   └── prisma.js       Prisma Client 單例
│   │   ├── seed.js             測試資料種子
│   │   └── index.js            Express 入口
│   ├── .env                    實際環境變數（不 commit）
│   └── .env.example            環境變數範本
├── frontend/
│   ├── public/
│   │   └── _redirects          SPA routing 修正（Render 用）
│   └── src/
│       ├── components/         可重用元件
│       ├── pages/              頁面元件
│       ├── hooks/              自訂 Hook
│       ├── services/           API 呼叫函式
│       ├── stores/             Zustand store
│       ├── utils/              工具函式
│       └── test/               測試檔案
└── docs/
    ├── PROJECT.md              本文件
    ├── API.md                  API 端點規格
    ├── DATABASE.md             資料庫設計
    ├── UI_RULES.md             UI 設計規範
    └── PROGRESS.md             開發進度追蹤
```

## 環境變數

`.env.example` 已 commit，新成員設置步驟：
1. 複製 `backend/.env.example` 為 `backend/.env`
2. 填入 Neon DATABASE_URL、JWT_SECRET、Cloudinary 設定
3. 執行 `npm install && npx prisma generate`

## CORS 政策

| 環境 | 允許 Origin |
|------|------|
| 開發 | `http://localhost:5173` |
| 正式 | 同網域（後端同時服務前端靜態檔案） |

## 注意事項

- 後端使用 ES Modules（`import/export`），不用 `require`
- Prisma 需要 `npx prisma generate` 才能使用，deploy 時 build command 要包含這行
- `DATABASE_URL` 給 Prisma Client（pooled），`DATABASE_URL_UNPOOLED` 給 migrate（direct）
- 圖片存 Cloudinary，不存本機
- 測試帳號請見 README.md 的 Demo Accounts 區段
