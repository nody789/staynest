// ─────────────────────────────────────────────
// 【保留參考用，已不再使用】
// 這是 Zustand 版本的認證狀態管理，
// 目前專案已改用 Redux Toolkit（src/store/authSlice.js）。
// 保留此檔案供 Zustand vs Redux 語法對比學習用。
// 詳細對比說明見 docs/REDUX_GUIDE.md
// ─────────────────────────────────────────────
// Zustand 是輕量的全域狀態管理工具
// 概念類似 useState，但可以在任何元件取用，不需要 props 傳遞
//
// 使用方式（已改用 Redux，這只是參考）：
//   const { user, setUser, logout } = useAuthStore()

import { create } from 'zustand'

const useAuthStore = create((set) => ({
  // ── 狀態 (State) ──
  // 從 localStorage 取出上次登入的資料（重新整理後不會登出）
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,

  // ── 動作 (Actions) ──

  // 登入後呼叫：把使用者資料和 token 存到狀態 & localStorage
  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    set({ user, token })
  },

  // 登出：清除狀態和 localStorage
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  // 更新使用者資料（例如修改頭像後同步）
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
}))

export default useAuthStore
