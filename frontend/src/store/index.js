// ─────────────────────────────────────────────
// Redux Store 設定
// ─────────────────────────────────────────────
//
// 【Store 是什麼？】
// Store = 整個應用程式的「全域狀態倉庫」
// 所有需要跨元件共享的資料都放在這裡
//
// 【和 Zustand 的差異】
//   Zustand：每個 store 都是獨立的 hook（useAuthStore、useCartStore...）
//   Redux：只有「一個」store，裡面用 reducer 分區（auth、cart、ui...）
//
//   Zustand：不需要 Provider，直接 import 就用
//   Redux：需要用 <Provider store={store}> 包住整個 App（在 main.jsx）
//
// 【configureStore 做了什麼？】
//   1. 合併所有 reducer 成一個大的 rootReducer
//   2. 自動設定 Redux DevTools（瀏覽器擴充功能，可以追蹤每個 action）
//   3. 自動加入 thunk middleware（支援非同步 action）
// ─────────────────────────────────────────────

import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'

const store = configureStore({
  // reducer：把所有 slice 的 reducer 合併進來
  // 之後讀取 state 時：state.auth.user、state.auth.token
  //                              ↑
  //                     這個 key 就是這裡的 'auth'
  reducer: {
    auth: authReducer,
    // 未來可以繼續加其他 slice：
    // listings: listingsReducer,
    // ui: uiReducer,
  },
})

export default store
