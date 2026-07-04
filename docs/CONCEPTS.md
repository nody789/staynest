# 技術概念筆記

> 面試前必看。每個概念都要能用自己的話說出來，不能只背答案。

---

## 1. Promise.all — 並行 vs 序列

**什麼時候用？**
兩個非同步操作互不依賴時，同時發出比排隊等更快。

```js
// ❌ 序列：150ms（100 + 50）
const listings = await prisma.listing.findMany(...)
const total    = await prisma.listing.count(...)

// ✅ 並行：100ms（max(100, 50)）
const [listings, total] = await Promise.all([
  prisma.listing.findMany(...),
  prisma.listing.count(...),
])
```

**記住：** 兩件事沒有依賴關係，就同時做，不要排隊等。

**什麼時候不能用 Promise.all？**
第二個操作需要第一個的結果時，只能序列：
```js
const user    = await prisma.user.findUnique(...)   // 先取得 user
const listing = await prisma.listing.findFirst({    // 再用 user.id 查
  where: { hostId: user.id }
})
```

---

## 2. Express 路由順序 — 精確的放上面

Express 從上到下依序比對，**第一個符合就執行，後面不看**。

```js
// ❌ 錯誤：/:id 會把 'booked-dates' 當成 id
router.get('/:id', ...)
router.get('/:id/booked-dates', ...)  // 永遠輪不到

// ✅ 正確：精確的放前面
router.get('/:id/booked-dates', ...)  // 先比對
router.get('/:id', ...)               // 再比對
```

**規則：** 越精確的路由越放上面，越通用的越放下面。

---

## 3. 前後端雙層驗證 — 為什麼都要驗？

```
使用者
  │
  ├── 前端驗證（UI 提示，可被繞過）
  │     → 隱藏按鈕、顯示提示文字
  │     → 作用：讓使用者知道為什麼不能做（UX）
  │
  └── 後端驗證（真正的防線，無法繞過）
        → API 回傳 403 / 409
        → 作用：防止直接打 API 的惡意請求
```

**前端驗證是給使用者看的，後端驗證才是真正的防線。**

有人可以不透過你的網頁，直接用工具打 API：
```bash
curl -X POST https://yoursite.com/api/listings/xxx/reviews \
  -H "Authorization: Bearer token..."
```
這樣前端的所有判斷全部失效，只有後端能擋。

---

## 4. React 狀態工具選擇

```
這個資料從 API 來的？
  → YES → useQuery（React Query）
  → NO  → 只有這個元件需要？
             → YES → useState
             → NO（多個頁面都要用）→ Zustand
```

| 工具 | 管什麼 | 本專案例子 |
|------|--------|-----------|
| `useState` | 元件本地狀態 | 搜尋框輸入值、Modal 開關 |
| `useQuery` | 伺服器資料 | 房源列表、訂單、評論 |
| `Zustand` | 全域客戶端狀態 | 登入使用者資訊 |

**為什麼不把所有東西都放 Zustand？**
伺服器資料有 cache、loading、error、重試等需求，React Query 都幫你處理了。
用 Zustand 存 API 資料等於自己重新發明這些功能。

---

## 5. useEffect 的 dependency array

```js
useEffect(() => { ... })        // ❌ 每次渲染都跑，通常是 bug
useEffect(() => { ... }, [])    // 只在第一次掛載時跑
useEffect(() => { ... }, [id])  // id 改變時才跑
```

**本專案盡量不用 useEffect 抓資料，改用 `useQuery`。**

useEffect 最常見的合理用途：
- 監聽 DOM 事件（點擊外部關閉選單）
- 計時器
- 第三方套件初始化

---

## 6. JWT 存在 localStorage vs httpOnly Cookie

| | localStorage | httpOnly Cookie |
|--|-------------|----------------|
| XSS 攻擊 | ❌ 有風險（JS 可讀取） | ✅ 安全（JS 無法讀取） |
| CSRF 攻擊 | ✅ 不受影響 | ❌ 需要額外防護 |
| 實作難度 | 簡單 | 較複雜 |
| 適合 | 學習專案 | 正式產品 |

**本專案用 localStorage**（學習目的可接受）。
正式產品應改用 httpOnly Cookie。

面試被問到時說：
> 「我知道 localStorage 有 XSS 風險，這是學習專案所以先這樣做。正式產品我會改用 httpOnly Cookie。」

---

## 7. 日期區間重疊公式

判斷兩個日期區間是否有任何重疊：

```
A: |-------|
B:     |-------|
→ 重疊

A: |---|
B:       |---|
→ 不重疊
```

**公式：`A.start < B.end && A.end > B.start`**

這一條件涵蓋所有 4 種重疊情況，不需要分開判斷。

```js
// Prisma 查詢：找出衝突的訂單
const conflict = await prisma.booking.findFirst({
  where: {
    listingId,
    status: 'CONFIRMED',
    OR: [{ checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }],
  },
})
```

---

## 8. Express 5 Breaking Change

Express 4 → Express 5，萬用字元路由語法改變：

```js
// Express 4（舊）
app.get('*', (req, res) => res.sendFile(...))

// Express 5（新）— * 不再支援
app.use((req, res) => res.sendFile(...))
```

**學到什麼：** 升版前必看 release notes。框架升版不只是數字變大，API 可能有 breaking change。

---

## 9. Prisma 分頁

```js
const pageNum  = parseInt(page) || 1
const limitNum = parseInt(limit) || 12
const skip     = (pageNum - 1) * limitNum  // 第2頁 skip=12，從第13筆開始

const [listings, total] = await Promise.all([
  prisma.listing.findMany({ skip, take: limitNum }),
  prisma.listing.count({ where }),
])
```

**skip** = 跳過幾筆  
**take** = 取幾筆  
**totalPages** = `Math.ceil(total / limitNum)`

---

## 10. multer + Cloudinary 上傳流程

```
前端 FormData
     ↓
multer middleware（攔截 multipart/form-data，存到記憶體 Buffer）
     ↓
uploadToCloudinary(buffer, folder)（用 upload_stream 上傳）
     ↓
Cloudinary 回傳 secure_url（HTTPS 圖片網址）
     ↓
存進資料庫
```

**為什麼用 memoryStorage 而不是 diskStorage？**
雲端部署環境（Render）沒有永久磁碟，檔案寫入本機會丟失，必須直接上傳到 Cloudinary。

---

## 11. React re-render 觸發時機

元件在以下三種情況重新渲染：
1. **自己的 state 改變**（`setState` 被呼叫）
2. **父元件重新渲染**（即使 props 沒變，子元件也會跟著渲染）
3. **傳入的 props 改變**

**避免不必要渲染的工具：**
- `React.memo`：包住子元件，props 沒變就不重新渲染
- `useCallback`：快取函式，避免每次渲染都產生新的函式參考
- `useMemo`：快取計算結果，避免每次渲染都重新計算

---

## 12. key prop 為什麼要用 id 不用 index

```jsx
// ❌ 用 index：增刪項目時 React 無法正確追蹤，會有奇怪 bug
{items.map((item, index) => <Card key={index} />)}

// ✅ 用 id：每個項目有唯一識別，增刪時 React 能正確比對
{items.map((item) => <Card key={item.id} />)}
```

**為什麼 index 有問題？**
刪除第一個項目後，原本 `key=1` 的變成 `key=0`，React 以為是同一個元件被修改了，而不是第一個元件被刪除了，導致狀態錯亂。

---

## 面試被問到不懂的問題

**標準回答：**
> 「這個我目前還沒有深入研究，但我的理解是...（說你知道的部分）。你能告訴我正確的做法嗎？我想學習。」

不要裝懂。面試官通常知道你不知道，看的是你面對不懂問題的態度。
