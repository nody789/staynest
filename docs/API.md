# API.md

## Base URL

```
開發環境：http://localhost:5000/api
正式環境：https://（Render 部署後填入）/api
```

## 認證方式

使用 JWT Bearer Token：

```
Authorization: Bearer <token>
```

Token 在 login/register 時取得，存於前端（localStorage 或 Zustand store）。

## CORS 政策

後端與前端部署在同一個 Render Web Service，走同一個 domain，不需要跨域設定。
本地開發時後端開放 `http://localhost:5173`。

## 統一回應格式

成功：
```json
{ "token": "...", "user": {} }
```

失敗：
```json
{ "message": "錯誤描述" }
```

> 目前此專案回應格式較自由，未統一包 `success` 欄位。

## API 端點列表

權限標示：`公開` 不需 token、`登入` 需要 JWT

### 認證

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| POST | /auth/register | 註冊（name, email, password） | 公開 |
| POST | /auth/login | 登入，回傳 JWT token | 公開 |
| GET | /auth/me | 取得當前登入使用者 | 登入 |
| PATCH | /auth/password | 修改密碼 | 登入 |

### 房源（Listings）

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| GET | /listings | 取得房源列表（支援搜尋/篩選 query params） | 公開 |
| GET | /listings/:id | 取得單筆房源詳情 | 公開 |
| POST | /listings | 新增房源 | 登入（需 isHost） |
| PUT | /listings/:id | 修改房源 | 登入（房東本人） |
| DELETE | /listings/:id | 刪除房源 | 登入（房東本人） |

搜尋支援 query params：`?location=&category=&minPrice=&maxPrice=&guests=`

### 訂房（Bookings）

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| GET | /bookings | 取得我的訂單（房客角度） | 登入 |
| POST | /bookings | 建立訂單（checkIn, checkOut, listingId） | 登入 |
| PUT | /bookings/:id | 取消訂單（status: CANCELLED） | 登入（訂單本人） |
| GET | /bookings/host | 取得我的房源訂單（房東角度） | 登入 |
| PUT | /bookings/:id/host-action | 確認或拒絕訂單（CONFIRMED/CANCELLED） | 登入（房東） |

### 評論（Reviews）

巢狀路由掛載在 `/listings/:listingId/reviews`

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| GET | /listings/:listingId/reviews | 取得該房源所有評論 | 公開 |
| POST | /listings/:listingId/reviews | 新增評論（rating, comment） | 登入 |

### 收藏（Favorites）

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| GET | /favorites | 取得我的收藏列表 | 登入 |
| POST | /favorites/:listingId | 收藏房源 | 登入 |
| DELETE | /favorites/:listingId | 取消收藏 | 登入 |

### 其他

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| GET | /health | 健康檢查 | 公開 |

## 回應狀態碼

| Code | 說明 |
|------|------|
| 200 | 成功 |
| 201 | 建立成功 |
| 400 | 請求格式錯誤 / 業務邏輯錯誤 |
| 401 | 未認證（缺少或過期 token） |
| 403 | 無權限（非本人操作） |
| 404 | 資源不存在 |
| 500 | 伺服器錯誤 |
