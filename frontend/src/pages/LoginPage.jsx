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
