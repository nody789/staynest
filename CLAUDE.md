# CLAUDE.md

# 專案 AI 助理設定檔

## 開發者背景

目前為中階前端工程師。

主要技術：

* React
* Vue
* Tailwind CSS
* TypeScript

正在持續學習：

* Node.js
* Express
* RESTful API 設計
* 系統架構設計
* CI/CD

請在協助開發時：

* 提供可維護的程式碼
* 提供實務建議
* 必要時解釋原因
* 避免過度複雜的架構

---

# 程式碼規範

## JavaScript（本專案使用 JS，非 TypeScript）

規則：

* 前後端皆使用純 JavaScript（ES Modules）
* 不使用 TypeScript（學習型專案，降低複雜度）
* 後端：`import/export`，不用 `require`
* 命名：camelCase 變數/函式、PascalCase 元件

---

## React

規則：

* 使用 Functional Component
* 使用 Hooks
* Component 需可重用
* 避免過度拆分元件
* 資料請求一律用 React Query（`useQuery` / `useMutation`），不用 `useEffect` 直接呼叫 API

備註：

若有更好的結構，請說明為什麼要這樣調整。

---

## React 備註規範（學習模式）

這是學習型專案，React 程式碼請加入中文備註，幫助理解：

* **每個 Component 檔案頂部**：一行說明這個元件的職責是什麼
* **`useState`**：說明這個 state 存什麼資料、為什麼需要它
* **`useEffect`**（盡量避免，改用 React Query）：若使用，說明副作用的觸發時機與目的
* **`useCallback` / `useMemo`**：說明為什麼需要快取，避免什麼問題
* **`useQuery` / `useMutation`**：說明在打哪個 API、資料的用途
* **Zustand store**：每個 state 和 action 都說明用途
* **Props**：複雜的 props 說明從哪裡傳入、代表什麼意思
* **條件渲染**：說明判斷條件背後的商業邏輯

備註：

不要每一行都加，只在「不看備註就不容易理解」的地方加。
目的是讓自己下次回來看能快速理解，也讓協作者快速上手。

---

## React 核心概念說明（學習重點）

遇到以下概念時，請加入說明讓開發者理解原理：

### Re-render 觸發時機

React 元件在以下情況重新渲染：
1. **自己的 state 改變**（`setState` 被呼叫）
2. **父元件重新渲染**（即使傳入的 props 沒變，子元件也會跟著渲染）
3. **傳入的 props 改變**

遇到效能問題或無窮迴圈，請說明是哪種 re-render 觸發，以及如何用 `useMemo` / `useCallback` / `React.memo` 避免不必要的渲染。

### useEffect dependency array（最常見 bug 來源）

```js
useEffect(() => { ... })          // 每次渲染都跑 ← 通常是 bug
useEffect(() => { ... }, [])      // 只在第一次掛載跑（componentDidMount）
useEffect(() => { ... }, [id])    // id 改變時才跑
```

遇到 `useEffect` 時，請說明：
* 第二個參數的 array 裡放什麼、為什麼
* 這個 effect 何時觸發、做什麼事
* **本專案盡量不用 useEffect 抓資料，改用 `useQuery`**

### Key prop（list 渲染必知）

```jsx
// 錯誤：用 index 當 key，增刪時 React 無法正確追蹤，會有奇怪 bug
{items.map((item, index) => <Card key={index} />)}

// 正確：用資料的唯一 id
{items.map((item) => <Card key={item.id} />)}
```

每次產生 list 渲染時，請說明為什麼 key 要用 id 而不是 index。

---

## React Router DOM v7

本專案使用 `react-router-dom` v7 處理前端路由。

### 常用 API

```jsx
// 導頁（程式控制跳轉）
const navigate = useNavigate()
navigate('/listings')        // 跳到房源列表
navigate(-1)                 // 回上一頁

// 取得網址參數（例如 /listings/:id）
const { id } = useParams()

// 宣告式連結（不會刷新頁面，比 <a> 好）
<Link to="/listings">所有房源</Link>
```

每次使用路由 API 時，請說明：
* 這裡要導頁到哪裡、為什麼
* `useParams` 取到的參數代表什麼
* 為什麼用 `<Link>` 而不用 `<a>`（SPA 不刷新頁面）

---

## 表單處理（Controlled Component）

本專案表單使用 **Controlled Component** 模式（value 綁定 state）。

### 基本模式

```jsx
// 每個輸入框的值都由 React state 控制
const [email, setEmail] = useState('')

<input
  value={email}                        // state 控制顯示的值
  onChange={(e) => setEmail(e.target.value)}  // 輸入時更新 state
/>
```

### 備註規範

* `useState` 說明這個欄位存什麼、對應哪個表單欄位
* `onSubmit` 說明送出後呼叫哪個 API、用 `useMutation`
* 驗證邏輯說明驗證規則與錯誤訊息的顯示方式

---

## 全域狀態管理

本專案使用 **Zustand** 管理全域狀態（例如：登入使用者資訊、UI 狀態）。

### useState / useEffect / useQuery / Zustand 的關聯與選擇

這四個工具各管不同類型的狀態，不是競爭關係：

| 工具 | 管什麼 | 使用時機 |
|------|--------|----------|
| `useState` | 元件內部的本地狀態 | 只有這個元件自己需要的資料（輸入框值、toggle 開關） |
| `useEffect` | 元件掛載/更新後的副作用 | 監聽事件、計時器、DOM 操作（不要用來抓 API） |
| `useQuery` | 來自伺服器的資料 | 所有 API 請求，自動處理 loading / error / cache |
| `Zustand` | 多元件共享的全域狀態 | 登入使用者、跨頁需要保留的資料 |

**判斷流程：**
```
這個資料從 API 來的？
  → YES → useQuery
  → NO  → 只有這個元件需要？
             → YES → useState
             → NO（多個元件/頁面都要用）→ Zustand
```

**本專案實際例子：**
- 搜尋框輸入值 → `useState`（只有搜尋列需要）
- 房源列表 → `useQuery`（從 API 抓，自動 cache）
- 已登入的使用者 → `Zustand`（所有頁面都需要知道「我是誰」）
- Modal 開關 → `useState`（只有這個元件需要）

### Zustand 備註規範

Zustand store 程式碼請加入中文備註：

* **store 頂部**：說明這個 store 負責管理哪些全域狀態
* **每個 state 欄位**：說明存什麼資料、初始值為何
* **每個 action（函式）**：說明觸發時機、做什麼事、會影響哪些 state
* **從元件使用 store 時**：說明「為什麼這個資料要放全域而不是 useState」

### Zustand vs Redux 比較

| | Zustand | Redux |
|---|---|---|
| 程式碼量 | 少，直接定義 state + action | 多，需要 action / reducer / store 分開寫 |
| 學習曲線 | 低，語法直覺 | 高，概念較多 |
| 適合規模 | 小～中型專案 | 大型專案、多人團隊 |
| 樣板程式碼 | 幾乎沒有 | 很多（boilerplate） |
| DevTools | 支援 | Redux DevTools 功能更完整 |

### 本專案選 Zustand 的原因

這是中小型學習專案，Zustand 語法更簡潔，可以專注在功能邏輯而不是框架規則。

### 何時才考慮 Redux？

* 超大型應用，多個團隊同時開發
* 公司已有 Redux 技術棧
* 需要嚴格的 time-travel debugging（逐步回放狀態變化）

### 學習建議

先掌握 Zustand → 之後可以把同一個專案改寫成 Redux 對比，效果最好。

---

## Tailwind CSS

規則：

* 優先使用 Tailwind
* 避免大量 inline style
* 優先考慮 RWD
* 主色用 `rose-500`（#FF385C），hover 用 `rose-600`

備註：

若有更好的排版方式，請提供建議。

---

# Node.js / Express

目前為學習階段。

請在產生 Node.js 程式碼時：

* 加入適當註解
* 說明目錄結構
* 說明每個檔案用途
* 說明 API 流程

備註：

不要只給程式碼。

請額外說明：

1. 為什麼這樣寫
2. 流程如何運作
3. 未來如何擴充

---

# API 規範

## 本專案實際使用的回應格式

本專案**未使用** `{ success, data }` 包裝格式，各端點直接回傳資料：

登入 / 註冊成功：
```json
{ "user": { "id": "...", "name": "..." }, "token": "..." }
```

列表類（房源、訂單）：
```json
[ { "id": "...", ... }, ... ]
```

單筆建立成功：
```json
{ "id": "...", "title": "...", ... }
```

失敗：
```json
{ "message": "人類可讀的錯誤描述" }
```

> 若未來需要加上統一格式，請先更新 `docs/API.md` 再修改程式碼。

---

# 認證機制

* 使用 JWT Bearer Token（存於前端 `localStorage`）
* 每次請求由 axios interceptor 自動帶上 `Authorization: Bearer <token>`
* Token 過期時間：7 天
* 需要登入的路由：加上 `authenticate` middleware

> 注意：本專案 token 存於 localStorage（非 httpOnly Cookie），
> 這對學習型專案可接受，正式產品建議改用 httpOnly Cookie 以防 XSS。

---

# 安全性規則

開發時必須遵守，不需等到 Code Review 才檢查。

* 密碼、API Key、Secret 一律寫在環境變數，禁止寫在程式碼裡
* 資料庫操作禁止字串拼接 SQL，一律使用 Prisma ORM
* API 端點必須驗證身份（JWT），公開端點需明確標註
* 回應資料禁止包含密碼欄位（`password`）
* PUT/PATCH 更新資料時，必須明確列出允許更新的欄位，禁止直接 `data: req.body`
* CORS 必須明確指定允許的 origin，禁止 `cors()` 無參數呼叫

---

# 慣用套件

本專案實際使用的套件如下，新功能請優先沿用。

| 用途 | 套件 |
|------|------|
| 資料庫 ORM | Prisma 6 |
| 密碼雜湊 | bcryptjs |
| JWT 處理 | jsonwebtoken |
| 前端 HTTP 請求 | axios（封裝在 `services/api.js`） |
| 伺服器狀態快取 | @tanstack/react-query |
| 全域狀態 | Zustand |
| 地圖 | Leaflet + React Leaflet |
| 圖片儲存 | Cloudinary（multer 上傳） |
| 測試 | Vitest + @testing-library/react |
| CORS | cors（需設定 origin） |

> 目前未使用：Zod（驗證）、helmet（安全 header）、express-rate-limit。
> 若新增後端路由，建議加上基本輸入驗證。

---

# Git 規則

## Branch 命名

```
feat/功能名稱       新功能
fix/問題名稱        Bug 修復
chore/雜項名稱      套件更新、設定調整
refactor/名稱       重構，不影響功能
```

## Commit 格式

```
feat: 新增使用者登入功能
fix: 修復購物車數量計算錯誤
chore: 更新 Prisma 至 6.x
refactor: 拆分 listings 路由邏輯
```

---

# Code Review

每次 Review 時請檢查：

* Bug
* 安全性（CORS、欄位白名單、敏感欄位洩漏）
* React / Express Best Practice
* 效能
* 可維護性

輸出格式：

1. 問題
2. 原因
3. 建議修正方式

---

# 新功能開發流程

請遵守以下順序：

1. 分析需求
2. 設計資料結構（確認是否需要更新 `docs/DATABASE.md`）
3. 設計 API（先更新 `docs/API.md`）
4. 設計 UI（確認 `docs/UI_RULES.md`）
5. 實作後端路由
6. 實作前端頁面
7. 撰寫測試（至少關鍵邏輯）

不要直接開始寫程式。

---

# 教學模式

當需求涉及以下技術時：

* Node.js
* Express
* Prisma / 資料庫
* 系統架構
* CI/CD
* 部署（Render / Neon / Cloudinary）

請額外提供：

【學習重點】

【實務做法】

【常見錯誤】

【未來進階方向】

協助開發者持續成長。

---

# 開始開發前

**每次開新對話，請先執行以下步驟：**

1. 閱讀 `docs/PROGRESS.md` — 確認目前開發進度與待完成項目
2. 閱讀 `docs/PROJECT.md` — 了解專案目標、技術棧、目錄結構
3. 閱讀 `docs/API.md` — 了解 API 規格與端點
4. 閱讀 `docs/DATABASE.md` — 了解資料結構與關聯
5. 閱讀 `docs/UI_RULES.md` — 了解 UI 設計規範
6. 摘要你理解的內容，確認後再開始開發

---

# 備註

專案特殊規則與進度請見：

* `docs/PROGRESS.md` — 開發進度（每次對話前必讀）
* `docs/PROJECT.md` — 專案說明與目錄結構
* `docs/API.md` — API 端點規格
* `docs/DATABASE.md` — 資料庫設計
* `docs/UI_RULES.md` — UI 設計規範
* `docs/CHANGELOG.md` — 版本變更紀錄
* `docs/TODO.md` — 待開發功能清單
* `docs/INTERVIEW.md` — 面試準備指南（技術問答）
