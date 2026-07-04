# Redux 學習指南（對比 Zustand）

本文件說明這個專案是如何從 Zustand 改寫成 Redux Toolkit 的，
以及兩者在概念和語法上的差異。

---

## 為什麼這個專案改用 Redux？

**實際上這個規模不需要 Redux。**
改寫的目的是讓你透過熟悉的程式碼學習 Redux 的運作方式。
學完後你就能判斷未來的專案要用哪個。

---

## Redux 的三個核心概念

```
State    → 實際儲存的資料（user、token）
Action   → 「發生了什麼事」的描述 { type: 'auth/setAuth', payload: {...} }
Reducer  → 收到 Action 後，決定怎麼更新 State 的函式
```

### 資料流（單向，不可逆）

```
使用者操作
    ↓
dispatch(action)         ← 元件呼叫
    ↓
Reducer 計算新 State     ← Redux 內部處理
    ↓
State 更新
    ↓
UI 重新渲染              ← React 處理
```

---

## 檔案結構對比

```
【Zustand 結構】
src/
  stores/
    authStore.js          ← 一個檔案搞定所有事

【Redux 結構】
src/
  store/
    index.js              ← 設定 Store（組合所有 Slice）
    authSlice.js          ← auth 功能的 State + Action + Reducer
```

---

## 語法對比

### 1. 定義狀態

```js
// ── Zustand ──────────────────────────────────
import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    set({ user, token })
  },
  logout: () => set({ user: null, token: null }),
}))


// ── Redux Toolkit ─────────────────────────────
import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null },
  reducers: {
    setAuth: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
    },
    logout: (state) => {
      state.user = null
      state.token = null
    },
  },
})

export const { setAuth, logout } = authSlice.actions
export default authSlice.reducer
```

---

### 2. 設定 Provider（Redux 需要，Zustand 不需要）

```jsx
// ── Zustand ──────────────────────────────────
// 不需要任何 Provider，直接用
<App />


// ── Redux ─────────────────────────────────────
// 需要用 <Provider> 包住整個 App
import { Provider } from 'react-redux'
import store from './store'

<Provider store={store}>
  <App />
</Provider>
```

---

### 3. 在元件裡讀取狀態

```jsx
// ── Zustand ──────────────────────────────────
const { user, token } = useAuthStore()
//    ↑ 直接解構，語法簡潔


// ── Redux ─────────────────────────────────────
import { useSelector } from 'react-redux'

const user = useSelector(state => state.auth.user)
const token = useSelector(state => state.auth.token)
//    ↑ 需要用 selector 函式指定要哪一塊 state
//      state.auth → store/index.js 裡的 reducer: { auth: authReducer }
//      state.auth.user → authSlice 的 initialState.user
```

---

### 4. 在元件裡更新狀態

```jsx
// ── Zustand ──────────────────────────────────
const { setAuth, logout } = useAuthStore()

setAuth(user, token)   // 直接呼叫函式
logout()


// ── Redux ─────────────────────────────────────
import { useDispatch } from 'react-redux'
import { setAuth, logout } from '../store/authSlice'

const dispatch = useDispatch()

dispatch(setAuth({ user, token }))  // 透過 dispatch 發送 action
dispatch(logout())
//    ↑ setAuth({ user, token }) 會產生：
//      { type: 'auth/setAuth', payload: { user, token } }
//      然後 Redux 把這個 action 送給 reducer 處理
```

---

## 本專案的改寫對照表

| 元件 | Zustand 寫法 | Redux 寫法 |
|------|-------------|------------|
| `LoginPage.jsx` | `const { setAuth } = useAuthStore()` | `const dispatch = useDispatch()` |
| | `setAuth(user, token)` | `dispatch(setAuth({ user, token }))` |
| `Navbar.jsx` | `const { user, logout } = useAuthStore()` | `const user = useSelector(state => state.auth.user)` |
| | `logout()` | `dispatch(logout())` |
| `PrivateRoute.jsx` | `const { token } = useAuthStore()` | `const token = useSelector(state => state.auth.token)` |
| `ProfilePage.jsx` | `const { user, setUser } = useAuthStore()` | `const user = useSelector(...)` + `dispatch` |

---

## Redux DevTools（最大優勢）

安裝瀏覽器擴充：**Redux DevTools**（Chrome / Firefox）

安裝後打開開發者工具，可以看到：
- 每個 dispatch 的 action 記錄
- 每個 action 前後的 state 變化
- **Time-travel**：可以回到任何一個歷史 state

這是 Redux 比 Zustand 明顯強的地方，對大型應用的 debug 非常有用。

---

## 什麼時候選 Zustand，什麼時候選 Redux？

| 情況 | 選擇 |
|------|------|
| 個人專案、小團隊 | Zustand |
| 快速開發，不想寫太多 code | Zustand |
| 大型應用、多個團隊 | Redux Toolkit |
| 需要嚴格追蹤所有狀態變化 | Redux Toolkit |
| 公司既有技術棧是 Redux | Redux Toolkit |
| 這個學習專案 😄 | 兩個都試試！ |

---

## 相關檔案

| 檔案 | 說明 |
|------|------|
| `src/store/index.js` | Redux Store 設定，說明了 configureStore 的用途 |
| `src/store/authSlice.js` | Auth Slice，有詳細的 State / Action / Reducer 說明 |
| `src/stores/authStore.js` | 原始 Zustand 版本，保留做對比 |
| `src/main.jsx` | 加入了 `<Provider>` 和說明 |
