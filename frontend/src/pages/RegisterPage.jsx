// ─────────────────────────────────────────────
// 註冊頁面
// ─────────────────────────────────────────────

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setAuth } from '../store/authSlice'
import { register } from '../services/api'

function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // dispatch：Redux 的發送器，所有狀態更新都要透過它
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // 統一處理所有欄位的輸入
  // e.target.name 對應 input 的 name 屬性，e.target.value 是輸入值
  // 展開運算子 ...prev 保留原本的值，再更新指定欄位
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await register(form)
      dispatch(setAuth({ user: data.user, token: data.token }))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || '註冊失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">建立帳號</h1>
        <p className="text-gray-500 text-sm mb-6">加入我們，開始探索世界各地的住宿</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              placeholder="你的名字"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              placeholder="你的 email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              placeholder="至少 6 個字元"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? '註冊中...' : '註冊'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          已有帳號？{' '}
          <Link to="/login" className="text-rose-500 font-medium hover:underline">
            立即登入
          </Link>
        </p>

      </div>
    </div>
  )
}

export default RegisterPage
