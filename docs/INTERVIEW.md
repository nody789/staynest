# 面試準備指南

這份文件涵蓋三個部分：
1. 協同定義 API 規範與資料結構
2. 前端如何處理跨域（CORS）問題
3. 面試官看這份專案可能問的問題與答法

---

## Part 1：協同定義 API 規範與資料結構

### 核心概念：先定義合約，再各自實作

> 面試問法：「你們前後端是怎麼協作的？」「如何確保前後端不會對不上？」

傳統錯誤做法：
```
後端寫完 API → 告訴前端 → 前端才開始串接 → 發現格式不對 → 來回溝通
```

正確做法（Contract-First）：
```
開會定義格式 → 寫成文件 → 後端 / 前端同時開發 → 最後串接
```

重點：**文件是真理，程式碼要配合文件，不是反過來。**

---

### 實際協作流程

#### Step 1：開會定義需求

開發一個功能前，前後端先討論：
- 這個 API 需要哪些欄位？
- 回傳格式長什麼樣子？
- 錯誤情境有哪些？

例如要做「使用者登入」：

```
前端需求：
  - 傳入 email + password
  - 登入成功要拿到 user 資訊和 token
  - 失敗要知道是「帳號不存在」還是「密碼錯誤」

後端確認：
  - token 放 httpOnly Cookie，不放 body
  - 為了安全，統一回傳「帳號或密碼錯誤」，不區分原因
```

#### Step 2：把共識寫成文件（API.md）

```markdown
POST /api/v1/auth/login

Request Body:
{
  "email": "user@example.com",
  "password": "123456"
}

成功 Response (200):
{
  "success": true,
  "data": {
    "user": {
      "id": "xxx",
      "email": "user@example.com",
      "name": "王小明"
    }
  }
}
// token 透過 Set-Cookie header 設定，不在 body

失敗 Response (401):
{
  "success": false,
  "code": "INVALID_CREDENTIALS",
  "message": "帳號或密碼錯誤"
}
```

#### Step 3：前端用 Mock 先開發

後端還沒寫好時，前端不需要等。用假資料模擬 API 回應：

**方法 A：直接在程式裡寫假資料（最簡單）**
```typescript
// 開發時先用這個
const mockUser = {
  id: "mock-001",
  email: "test@example.com",
  name: "測試用戶"
}
```

**方法 B：用 msw（Mock Service Worker）攔截真實請求**
```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: { user: { id: '001', name: '王小明' } }
    })
  })
]
```

好處：前端寫的 API 呼叫程式碼完全不需要改，Mock 移除後直接就能用。

#### Step 4：串接與驗證

後端完成後，前端把 Mock 移除，直接串真實 API。
如果格式有差異，**以文件為準**，改程式碼（不是改文件）。

---

### TypeScript 型別對齊

前後端共用型別是減少溝通成本的好方式。

```typescript
// types/api.ts（前後端可以共享這份）

// 統一的 API 回應包裝
interface ApiResponse<T> {
  success: true
  data: T
}

interface ApiError {
  success: false
  code: string
  message: string
  errors?: { field: string; message: string }[]
}

// 每個資源的型別
interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

// 分頁格式
interface PaginatedResponse<T> {
  success: true
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
```

---

### 面試答題範本

> 問：「你們如何協同定義 API 規範？」

```
我們採用合約優先的方式。

開發新功能前，前後端工程師先開會，
討論需要哪些 API、每個欄位的名稱和型別、錯誤情境。
確認後寫成 API.md 文件，這份文件是雙方的合約。

前端不需要等後端，可以用 msw 攔截 HTTP 請求，
用 Mock 資料先把 UI 和邏輯做完。
後端寫完後，前端只需要移除 Mock，不需要改其他程式碼。

如果後端要改 API 格式，必須先更新文件並通知前端，
不能直接改 API 讓前端爆掉。
```

---

## Part 2：前端如何處理跨域（CORS）問題

### 什麼是跨域（CORS）？

**Same-Origin Policy（同源政策）**：瀏覽器規定，網頁只能對「同源」發出 AJAX 請求。

「同源」= Protocol（協議）+ Domain（域名）+ Port（埠號）三者完全相同

```
前端：http://localhost:3000
後端：http://localhost:8000   ← Port 不同 → 跨域！

前端：https://myapp.com
後端：https://api.myapp.com  ← 子域名不同 → 跨域！
```

瀏覽器碰到跨域請求，會先送一個 `OPTIONS` 預檢請求問後端：
「我可以從這個 origin 存取你嗎？」
後端沒回應正確的 Header → 瀏覽器直接擋掉，顯示 CORS error。

> **重要觀念：CORS 是瀏覽器行為，Postman / curl 沒有這個限制。**

---

### 解法一：開發環境用 Proxy（最常用）

讓前端 Dev Server 幫你轉發請求，瀏覽器看到的是「同源」，就不會有跨域問題。

**Vite 設定：**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // 你的後端
        changeOrigin: true,
      }
    }
  }
})
```

前端打 `/api/users` → Vite 幫你轉發到 `http://localhost:8000/api/users`
瀏覽器以為在打同一台伺服器，沒有跨域問題。

**Next.js 設定：**
```typescript
// next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      }
    ]
  }
}
```

---

### 解法二：後端設定 CORS Header（正式環境必做）

後端明確告訴瀏覽器「我允許這個 origin 來存取」。

```typescript
// Express + cors 套件
import cors from 'cors'

app.use(cors({
  origin: 'https://myapp.com',       // 只允許這個來源
  credentials: true,                  // 允許攜帶 Cookie
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}))
```

**禁止這樣寫：**
```typescript
// 危險！任何來源都可以存取你的 API
app.use(cors({ origin: '*' }))

// 有 credentials 時，origin 不能是 *
app.use(cors({ origin: '*', credentials: true }))  // 這個直接報錯
```

---

### 解法三：正式環境用 Nginx 反向代理

最乾淨的做法：前後端在同一個 domain 下，根本不存在跨域。

```nginx
server {
  listen 80;
  server_name myapp.com;

  # 前端
  location / {
    proxy_pass http://localhost:3000;
  }

  # 後端 API（同一個 domain，不同路徑）
  location /api {
    proxy_pass http://localhost:8000;
  }
}
```

前端打 `https://myapp.com/api/users` → Nginx 內部轉發到後端
對瀏覽器來說完全同源，沒有任何 CORS 問題。

---

### 常見錯誤與解法

| 錯誤狀況 | 原因 | 解法 |
|----------|------|------|
| CORS error 但 Postman 可以 | 瀏覽器擋的，不是後端問題 | 後端加 cors 設定 |
| Cookie 打不過去 | 沒設 `credentials: true` | 前端加 `withCredentials: true`，後端加 `credentials: true` |
| `origin: '*'` 加了還是報錯 | 有帶 Cookie 時不能用 `*` | 改成指定 origin |
| 預檢（OPTIONS）失敗 | 後端沒處理 OPTIONS 請求 | cors middleware 要在所有 route 前面 |

---

### axios 的跨域 Cookie 設定

```typescript
// 建立 axios instance 時加上
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,  // 必須加，才能攜帶 httpOnly Cookie
})
```

---

### 面試答題範本

> 問：「前端如何處理跨域問題？」

```
跨域是因為瀏覽器的同源政策，前端請求的 origin 和後端不同就會被擋。

開發環境我用 Vite 的 proxy 設定，讓 dev server 幫我轉發請求，
瀏覽器看到的是同源，就不會有 CORS 問題。

正式環境有兩種做法：
一是後端用 cors 套件，明確設定允許的 origin，
origin 不能寫 *，因為有 Cookie 需求時瀏覽器會拒絕。

二是用 Nginx 做反向代理，讓前後端在同一個 domain 下，
這樣根本不存在跨域問題，是最乾淨的方式。

Cookie 要能跨 port 傳送，前端的 axios 要設定 withCredentials: true，
後端 cors 也要設定 credentials: true，缺一不可。
```

---

## Part 3：面試官看這個專案可能問的問題

### 技術選擇類

**Q：為什麼用 Next.js 而不是純 React？**
```
Next.js 提供 Server-Side Rendering，對 SEO 友好，
尤其是電商、內容類網站需要讓搜尋引擎索引頁面內容。
App Router 的 Server Component 可以在 Server 端直接讀取資料庫，
減少前後端的 round trip，效能更好。
純 React（Vite）適合不需要 SEO 的 Dashboard、管理後台類應用。
```

**Q：為什麼選 Prisma 而不是直接寫 SQL？**
```
Prisma 提供型別安全的 ORM，寫 query 時 TypeScript 會自動補全欄位名稱，
避免欄位拼錯或型別不對這類低級錯誤。
Schema 集中在 schema.prisma，資料庫結構一目了然。
Migration 機制可以追蹤資料庫變更歷史，團隊協作時不會對不上。
```

**Q：為什麼用 Zod 做驗證？**
```
Zod 的好處是驗證和型別推導合一。
定義一個 Zod schema，可以同時得到 Runtime 驗證和 TypeScript 型別，
不需要寫兩份。
例如登入的 body 驗證，schema.parse() 失敗會拋出結構化錯誤，
可以直接轉換成 API 的 errors 陣列回傳給前端。
```

---

### 安全性類

**Q：為什麼 token 要放 httpOnly Cookie 而不是 localStorage？**
```
localStorage 可以被 JavaScript 存取，
如果網站有 XSS 漏洞（例如顯示用戶輸入的內容時沒有 escape），
攻擊者可以注入惡意 script 把 token 偷走。

httpOnly Cookie 只有瀏覽器能讀，JavaScript 完全存取不到，
就算有 XSS 攻擊也偷不走 Cookie。

httpOnly Cookie 的風險是 CSRF，
所以要搭配 SameSite=Strict 或 CSRF token 來防護。
```

**Q：為什麼 API 要加 Rate Limiting？**
```
防止暴力破解攻擊。
例如登入 API 如果沒有限制，攻擊者可以用程式每秒嘗試幾千個密碼組合。
加了 Rate Limiting，例如同一個 IP 每分鐘只能打 10 次登入 API，
超過就回 429，大幅增加暴力破解的成本。
```

**Q：什麼是 helmet？為什麼要用？**
```
helmet 是 Express 的 middleware，
自動設定多個安全相關的 HTTP Response Header。

例如：
- Content-Security-Policy：限制網頁能載入哪些資源，防止 XSS
- X-Frame-Options：防止你的網頁被放進 iframe，防止 Clickjacking
- X-Content-Type-Options：防止瀏覽器猜測 content type

這些 header 不加也不會馬上出事，但會是資安稽核的扣分點。
```

---

### API 設計類

**Q：為什麼 API URL 要加版本號（/v1/）？**
```
當 API 需要做 Breaking Change（例如欄位改名、格式大改）時，
可以推出 /v2/，讓舊版 /v1/ 繼續維持一段時間。
如果沒有版本號，一改就會讓所有使用舊版的客戶端（包括 APP）爆掉。
```

**Q：錯誤回應為什麼要有 code 和 message 兩個欄位？**
```
message 是給人看的，文字可以是中文、可以改寫法，
前端直接顯示給用戶。

code 是給程式看的，固定英文大寫，
前端用來判斷要做什麼動作。

例如 code 是 UNAUTHORIZED，前端就知道要跳轉到登入頁。
如果只有 message，前端就要用字串比對，很脆弱。
```

**Q：分頁怎麼設計的？**
```
用 Offset-based pagination，query string 帶 page 和 pageSize，
回應的 meta 包含 total 和 totalPages，讓前端可以渲染分頁元件。

這種方式直覺、實作簡單，適合大多數情境。
缺點是資料量非常大、且排序欄位頻繁更新時，
可能有「跳頁」問題（查第二頁時第一頁插入了新資料）。
如果是 Feed 類的無限捲動，會改用 Cursor-based pagination 解決這個問題。
```

---

### 資料庫類

**Q：主鍵為什麼用 CUID/UUID 而不是自增 INT？**
```
自增 INT 的問題：
1. 安全性：ID 是 1、2、3，攻擊者可以猜測去試其他用戶的資料
2. 分散式：多台資料庫同時寫入時，自增 ID 會衝突

CUID/UUID 的好處：
ID 是隨機字串，無法猜測，更安全。
分散式環境也不會衝突。

缺點是字串比整數大、索引效能略差，
但對大多數 Web 應用影響可以忽略。
```

**Q：什麼是軟刪除？為什麼用軟刪除？**
```
軟刪除：不真正刪除資料，只是把 deleted_at 欄位設為當前時間。
查詢時加上 WHERE deleted_at IS NULL 就能過濾掉「已刪除」的資料。

使用情境：
1. 法規要求：某些資料（金融、醫療）有保存義務，不能真的刪
2. 防止誤刪：可以「還原」誤刪的資料
3. 稽核紀錄：知道什麼時候誰刪了什麼

不是所有資料都需要軟刪除，
Session log、暫存資料等不重要的資料，硬刪更乾淨。
```

**Q：什麼情況需要建索引？**
```
索引可以加速查詢，但會佔空間並拖慢寫入速度。

以下情況建索引：
1. 常用在 WHERE 的欄位（例如 email 查詢）
2. 常用在 JOIN ON 的欄位（外鍵）
3. 常用在 ORDER BY 的欄位

不需要建索引：
1. 資料量小的表（全表掃描反而更快）
2. 很少查詢但頻繁寫入的欄位
```

---

### 架構類

**Q：Controllers / Services 的分層有什麼好處？**
```
Controllers 只負責 HTTP 層的事：
接收 Request、解析參數、呼叫 Service、回傳 Response。

Services 只負責商業邏輯：
不知道 HTTP 是什麼，不碰 req/res。

好處：
1. Services 可以被不同地方呼叫（HTTP route、定時任務、CLI）
2. Services 容易獨立測試，不需要模擬 HTTP request
3. 職責清楚，改 API 格式只改 Controller，改商業邏輯只改 Service
```

**Q：這個專案如何擴充？如果流量變大怎麼辦？**
```
短期：
- 加 Cache（Redis），把常查詢的資料暫存，減少資料庫壓力
- 加資料庫索引，針對慢查詢優化

中期：
- 資料庫讀寫分離（Primary 負責寫，Replica 負責讀）
- 靜態資源移到 CDN

長期：
- 如果特定功能成為瓶頸，可以拆成獨立的 Microservice
- 但過早拆分會增加複雜度，Monolith 先做好再說
```

---

## 快速複習：面試前必讀重點

### 一定要能說清楚的

- [ ] 你選這個技術棧的原因（不只是「我會」，要說解決什麼問題）
- [ ] JWT 放 httpOnly Cookie 的原因，以及 XSS / CSRF 的差異
- [ ] CORS 是什麼、你怎麼解的
- [ ] API 回應格式的設計決策（`code` vs `message`、分頁 `meta`）
- [ ] Controller / Service 分層的好處

### 加分項目

- [ ] 能說出 Offset-based vs Cursor-based pagination 的差異與適用場景
- [ ] 知道 Rate Limiting 是防什麼攻擊
- [ ] 能解釋 N+1 Query 問題，以及 Prisma 如何用 `include` 避免
- [ ] 知道什麼情況建索引、什麼情況不需要
