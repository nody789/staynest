// ─────────────────────────────────────────────
// Redux 認證 Slice（auth）
// ─────────────────────────────────────────────
//
// 【Redux 核心概念說明】
//
//  Slice（切片）= 一個功能模組的狀態 + 操作方法的集合
//  類比 Zustand：
//    Zustand  → create((set) => ({ state, action }))
//    Redux    → createSlice({ name, initialState, reducers })
//
//  三個重要角色：
//  ┌─────────────┬────────────────────────────────────────────────┐
//  │ State       │ 實際存的資料（user, token）                     │
//  │ Action      │ 「發生了什麼事」的描述，例如 { type: 'setAuth' } │
//  │ Reducer     │ 收到 Action 後，怎麼更新 State 的函式           │
//  └─────────────┴────────────────────────────────────────────────┘
//
//  資料流（單向）：
//  UI 互動 → dispatch(action) → reducer 計算新 state → UI 重新渲染
//
//  對比 Zustand：
//  UI 互動 → 直接呼叫 store 的 action 函式 → state 更新 → UI 重新渲染
// ─────────────────────────────────────────────

import { createSlice } from '@reduxjs/toolkit'

// ── 初始狀態 ──────────────────────────────────
// 從 localStorage 讀取上次登入的資料，讓重新整理後不會登出
// 這和 Zustand 版本完全一樣
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
}

// ── 建立 Slice ────────────────────────────────
// createSlice 會自動幫你產生：
//   1. action creator（例如 authSlice.actions.setAuth）
//   2. reducer function（authSlice.reducer）
const authSlice = createSlice({
  // name：這個 slice 的命名空間，action type 會變成 'auth/setAuth'
  name: 'auth',

  // initialState：state 的初始值
  initialState,

  // reducers：定義可以執行的操作
  // 每個函式就是一個 reducer：接收 (state, action) → 更新 state
  //
  // 注意：Redux Toolkit 內部使用 Immer，
  //       所以可以直接寫 state.user = ... 看起來像是「直接修改」
  //       實際上 Immer 會幫你產生新的 immutable state（不可變資料）
  reducers: {
    // 登入後呼叫：儲存使用者資料和 token
    // action.payload = { user, token }（從元件傳入的資料）
    setAuth: (state, action) => {
      const { user, token } = action.payload
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
      // 直接賦值（Immer 讓這個操作是安全的）
      state.user = user
      state.token = token
    },

    // 登出：清除所有認證資料
    logout: (state) => {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      state.user = null
      state.token = null
    },

    // 更新使用者資料（例如修改頭像後同步）
    // action.payload = 新的 user 物件
    setUser: (state, action) => {
      localStorage.setItem('user', JSON.stringify(action.payload))
      state.user = action.payload
    },
  },
})

// ── 匯出 Action Creators ──────────────────────
// createSlice 自動產生這些函式，呼叫時會建立 action 物件
// 例如：setAuth({ user, token }) → { type: 'auth/setAuth', payload: { user, token } }
//
// 在元件裡這樣使用：
//   dispatch(setAuth({ user, token }))
//   dispatch(logout())
export const { setAuth, logout, setUser } = authSlice.actions

// ── 匯出 Reducer ──────────────────────────────
// 這個 reducer 會被加入到 Redux store（在 store/index.js 引用）
export default authSlice.reducer
