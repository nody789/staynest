# 面試故事準備

這份文件是針對這個 StayNest 專案的面試問答準備。
每個故事都用「情境 → 問題 → 解法 → 學到什麼」的結構，可以直接套用。

---

## 「這個專案最難的部分是什麼？」

可以選以下任一個回答，視面試官背景調整：

---

### 故事 A：訂房日期衝突檢查（推薦，技術深度最高）

**情境：**
訂房功能需要確保兩筆訂單的日期不會重疊，
避免同一個房間在同一天被兩個人預訂。

**問題：**
一開始我只判斷 checkIn 是否相同，但很快發現不夠。
兩個日期區間重疊其實有四種情況：
完全重疊、A 包含 B、B 包含 A、部分交叉。
如果每種都分開判斷，條件很多且容易漏掉。

**解法：**
研究後發現一個數學上更簡潔的結論：
「兩個區間有任何重疊，等價於 A.start < B.end 且 A.end > B.start」
用 Prisma 的 OR 查詢一行就能涵蓋全部情況：

```js
OR: [{ checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }]
```

**學到什麼：**
有時候找到正確的數學條件，程式碼反而比「列舉所有情況」更簡單也更可靠。
這讓我養成在寫複雜判斷前先想「有沒有更本質的條件」的習慣。

---

### 故事 B：Express 5 升版的 Breaking Change（展示解決 bug 的能力）

**情境：**
部署時後端要同時 serve 前端的靜態檔案，
讓 Render 上只需要一個 Web Service，降低成本。

**問題：**
照 Express 4 的教學寫 `app.get('*', ...)` 捕捉所有路由，
結果一直出現 `TypeError: Missing parameter name` 錯誤，
但我的路由寫法和教學完全一樣。

**解法：**
查了很久才發現 Express 5 有 breaking change：
不再支援萬用字元 `*` 路由，要改成：

```js
// Express 4
app.get('*', (req, res) => res.sendFile(...))

// Express 5
app.use((req, res) => res.sendFile(...))
```

**學到什麼：**
框架升版不只是數字變大，API 可能有 breaking change。
現在升版前我一定會先看 release notes 或 migration guide。

---

### 故事 C：雙層狀態管理的設計決策（展示架構思考）

**情境：**
專案一開始所有狀態都放在 Zustand，包含 API 回來的資料（房源列表、訂單）。

**問題：**
每次打 API 都要自己管理 loading、error 狀態，
還要手動處理 cache（避免每次進頁面都重新請求）。
程式碼越來越多，每個頁面都在重複同樣的模式。

**解法：**
引入 React Query 負責「伺服器狀態」（API 資料），
Zustand 只存「客戶端全域狀態」（登入者資訊）。

```
React Query → 房源列表、訂單、評論（自動 cache、loading、error）
Zustand     → 登入使用者（不需要 cache，重整從 localStorage 讀）
```

**學到什麼：**
狀態管理不是只選一個工具，而是依照狀態的性質選擇對的工具。
「伺服器資料」和「客戶端狀態」是兩種完全不同的東西，應該分開管理。

---

### 故事 D：評論資格驗證（展示業務邏輯思考）

**情境：**
評論功能做完後，發現任何登入的使用者都能留評，
包括沒有訂過房的人，這不符合 Airbnb 的真實邏輯。

**問題：**
需要驗證兩件事：
1. 使用者真的有完成入住（不能是取消的訂單）
2. 同一個使用者對同一個房源只能留一次

**解法：**
驗證放在後端（最重要）：

```js
// 檢查有沒有完成入住：CONFIRMED 且 checkOut 已過
const completedBooking = await prisma.booking.findFirst({
  where: {
    listingId, guestId: userId,
    status: 'CONFIRMED',
    checkOut: { lt: new Date() },
  },
})

// 檢查是否已留過評論
const existingReview = await prisma.review.findFirst({
  where: { listingId, authorId: userId },
})
```

前端用 React Query 抓使用者訂單，依結果顯示不同的 UI（表單 / 提示文字）。

**學到什麼：**
安全驗證一定要放後端。前端只是 UX 優化（隱藏按鈕），
有人直接打 API 一樣能繞過前端判斷。

---

## 「你為什麼選這個技術棧？」

### React + Vite

> React 是前端主流選擇，生態系最豐富。
> Vite 比 Create React App 快非常多，開發體驗好很多，現在已經是新專案的標準。

### React Query vs useEffect 抓資料

> 以前習慣用 useEffect + fetch，但每次都要自己管 loading、error、快取，重複代碼很多。
> React Query 讓這些全部自動處理，元件可以專注在 UI 邏輯，不用管資料抓取的細節。

### Prisma ORM

> 不用寫 SQL，Schema 即文件，遷移歷史有記錄。
> 對我這個學後端的人來說，型別提示讓我知道每個操作的結果是什麼，不容易出錯。

### JWT + localStorage（vs Session + Cookie）

> 前後端分離架構下，JWT 是無狀態驗證，伺服器不需要儲存 session，比較適合獨立部署的後端。
> （補充）localStorage 有 XSS 風險，正式產品應該改用 httpOnly Cookie，
> 但這是學習專案，先把流程跑通再考慮安全性加強。

---

## 「你最想改進這個專案的什麼地方？」

（展示你知道自己的不足，比說「沒有什麼要改進的」好）

> 「目前 routes 把業務邏輯都寫在裡面，規模變大後會越來越難維護。
> 下一步想把邏輯抽到 service layer，讓 route 只負責接收請求和回傳，
> 這也是業界常見的 Controller-Service-Repository 架構。」

> 「測試只有前端元件測試，後端 API 沒有測試。
> 想加 supertest 做後端的整合測試，確保 API 行為符合預期。」

---

## 常見追問與回答

### Q：你做這個專案花了多久？

> 大約 X 週，每天下班後 2-3 小時。
> 不是照教學做，是自己設計資料庫 Schema 和 API 規格，再一步一步實作。

### Q：這是你一個人做的嗎？

> 是的，前後端都是我一個人。
> 好處是可以完整理解前後端怎麼配合，知道 API 設計的好壞會直接影響前端的寫法。

### Q：你遇到最大的挑戰是什麼？（關於後端）

> 對我來說後端是新的領域。
> 最花時間的是理解「中間件 (middleware)」的概念：
> 請求進來 → auth middleware 驗 token → route handler 處理邏輯 → 回傳結果。
> 理解這個流程後，後來寫 admin middleware、上傳 middleware 就很快了。

---

## 如果被問到不會的問題

**標準回答：**
> 「這個我目前還沒有深入研究，但我的理解是...（說你知道的部分）。
> 你能告訴我正確的做法嗎？我想學習。」

不要裝懂，面試官通常知道你不知道，看的是你面對不會的問題的態度。
