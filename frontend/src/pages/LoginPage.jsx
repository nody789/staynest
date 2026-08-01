// ─────────────────────────────────────────────
// 登入頁面
// ─────────────────────────────────────────────
// 使用到的 React 概念：
//   useState   → 管理表單輸入值和 loading 狀態
//   useNavigate → 登入成功後跳轉頁面
//
// 使用到的 Tailwind：
//   max-w-md   → max-width: 448px（限制寬度，讓表單不要太寬）
//   mx-auto    → margin-left: auto; margin-right: auto（水平置中）
//   space-y-4  → 子元素之間 margin-top: 16px

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'       // Redux：取得 dispatch 函式
import { Helmet } from 'react-helmet-async'
import { setAuth } from '../store/authSlice'    // Redux：引入 action creator
import { login } from '../services/api'

// 【Redux 使用說明 — 對比 Zustand】
//
//  Zustand 寫法：
//    const { setAuth } = useAuthStore()
//    setAuth(user, token)   ← 直接呼叫
//
//  Redux 寫法：
//    const dispatch = useDispatch()
//    dispatch(setAuth({ user, token }))   ← 透過 dispatch 發送 action
//
//  為什麼 Redux 要多一個 dispatch？
//  因為 Redux 強制所有狀態更新都要經過 dispatch → reducer 的流程
//  這讓每個操作都被記錄下來，可以用 Redux DevTools 追蹤完整歷史
function LoginPage() {
  // useState：管理表單的值，每次輸入都會更新
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')       // 顯示錯誤訊息
  const [loading, setLoading] = useState(false) // 按鈕 loading 狀態

  // dispatch：Redux 的「發送器」，所有狀態更新都要透過它
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()  // 阻止表單預設的「重新整理頁面」行為
    setLoading(true)
    setError('')

    try {
      // 呼叫登入 API，回傳 { user, token }
      const { data } = await login({ email, password })
      // dispatch(action)：發送 action 給 Redux store
      // setAuth({ user, token }) 產生 action：{ type: 'auth/setAuth', payload: { user, token } }
      // reducer 收到後更新 state.auth.user 和 state.auth.token
      dispatch(setAuth({ user: data.user, token: data.token }))
      navigate('/')                   // 跳轉到首頁
    } catch (err) {
      // err.response.data.message 是後端回傳的錯誤訊息
      setError(err.response?.data?.message || '登入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Helmet>
        <title>登入 — StayNest</title>
        <meta name="description" content="登入 StayNest，開始瀏覽並預訂全台優質住宿。" />
      </Helmet>

      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        {/* 標題 */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">歡迎回來</h1>
        <p className="text-gray-500 text-sm mb-6">請登入您的帳號</p>

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* 表單 */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電子郵件
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}  // 每次輸入更新 state
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              placeholder="你的 email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}  // 發請求時禁用按鈕，防止重複提交
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        {/* 分隔線 */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">或使用以下方式登入</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* ── Social Login 按鈕 ─────────────────────
            OAuth 登入不走表單 POST，而是把瀏覽器「直接導到後端 URL」
            後端再 redirect 到 Google/LINE，完成後帶 token 回到 /auth/callback
            所以用 <a href> 而不是 axios，因為需要整頁跳轉（不是 AJAX）*/}
        <div className="space-y-3">
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-lg py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            {/* Google 圖示（SVG） */}
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            使用 Google 登入
          </a>

          <a
            href="/api/auth/line"
            className="flex items-center justify-center gap-3 w-full bg-[#06C755] hover:bg-[#05b34d] text-white rounded-lg py-3 text-sm font-medium transition"
          >
            {/* LINE 圖示（SVG） */}
            <svg width="18" height="18" viewBox="0 0 50 50" fill="white">
              <path d="M25 2C12.318 2 2 10.837 2 21.68c0 6.634 3.911 12.49 9.868 16.053-.434 1.62-1.573 5.876-1.802 6.79-.281 1.119.41 1.105.861.804.354-.234 5.62-3.817 7.894-5.36A28.4 28.4 0 0025 40.36C37.682 40.36 48 31.522 48 21.68 48 10.837 37.682 2 25 2z"/>
            </svg>
            使用 LINE 登入
          </a>

          <a
            href="/api/auth/facebook"
            className="flex items-center justify-center gap-3 w-full bg-[#1877F2] hover:bg-[#1565d8] text-white rounded-lg py-3 text-sm font-medium transition"
          >
            {/* Facebook 圖示（SVG） */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            使用 Facebook 登入
          </a>
        </div>

        {/* 跳轉到註冊頁 */}
        <p className="text-center text-sm text-gray-500 mt-6">
          還沒有帳號？{' '}
          <Link to="/register" className="text-rose-500 font-medium hover:underline">
            立即註冊
          </Link>
        </p>

      </div>
    </div>
  )
}

export default LoginPage
