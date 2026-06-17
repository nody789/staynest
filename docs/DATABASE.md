# DATABASE.md

## 資料庫類型

PostgreSQL（Neon），透過 **Prisma ORM** 管理。

## 連線設定

```env
DATABASE_URL=      # Pooled connection（給 Prisma Client 日常查詢）
DATABASE_URL_UNPOOLED=  # Direct connection（給 prisma migrate 用）
```

> Neon 提供兩種連線字串，migration 必須用 direct connection，否則 timeout。

## Schema 位置

`backend/prisma/schema.prisma`

## 資料模型

### User（使用者）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | String UUID PK | 主鍵 |
| name | String | 顯示名稱 |
| email | String unique | 信箱（唯一） |
| password | String | bcrypt 雜湊值（禁止回傳） |
| avatar | String? | 頭像圖片 URL |
| isHost | Boolean | 是否為房東（預設 false） |
| createdAt | DateTime | 建立時間 |

### Listing（房源）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | String UUID PK | 主鍵 |
| title | String | 房源標題 |
| description | String | 詳細描述 |
| price | Float | 每晚價格（TWD） |
| location | String | 地點文字描述 |
| lat | Float | 緯度（Leaflet 地圖用） |
| lng | Float | 經度（Leaflet 地圖用） |
| images | String[] | Cloudinary 圖片網址陣列 |
| maxGuests | Int | 最多入住人數 |
| category | String | 分類（如：海邊、山林、市區） |
| hostId | String FK | 關聯 User.id |
| createdAt | DateTime | 建立時間 |

### Booking（訂單）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | String UUID PK | 主鍵 |
| checkIn | DateTime | 入住日期 |
| checkOut | DateTime | 退房日期 |
| totalPrice | Float | 總價（前端計算後傳入） |
| status | BookingStatus | PENDING / CONFIRMED / CANCELLED |
| guestId | String FK | 關聯 User.id（房客） |
| listingId | String FK | 關聯 Listing.id |
| createdAt | DateTime | 建立時間 |

### Review（評論）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | String UUID PK | 主鍵 |
| rating | Int | 評分（1-5） |
| comment | String | 評論內容 |
| authorId | String FK | 關聯 User.id |
| listingId | String FK | 關聯 Listing.id |
| createdAt | DateTime | 建立時間 |

### Favorite（收藏）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | String UUID PK | 主鍵 |
| userId | String FK | 關聯 User.id |
| listingId | String FK | 關聯 Listing.id |
| createdAt | DateTime | 建立時間 |

> `@@unique([userId, listingId])` 防止重複收藏。

## 資料表關聯

```
User ←→ Listing（一個 User 可有多個 Listing）
User ←→ Booking（一個 User 可有多個 Booking）
User ←→ Review
User ←→ Favorite
Listing ←→ Booking
Listing ←→ Review
Listing ←→ Favorite
```

## Migration 策略

使用 Prisma Migrate 管理 schema 變更。

```bash
# 開發環境：修改 schema.prisma 後執行
npx prisma migrate dev --name 描述異動名稱

# 正式環境部署時（Render build command 執行）
npx prisma migrate deploy
```

> `migrate dev` 會自動建立 migration 檔案並套用。
> `migrate deploy` 只套用未執行的 migration，不建立新的。

## 敏感欄位

| 欄位 | 說明 |
|------|------|
| User.password | bcrypt 雜湊值，API 回應時必須排除 |

Prisma 查詢回傳使用者時，務必加上 `select` 排除 password 欄位：

```js
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true, avatar: true, isHost: true }
})
```
