// ─────────────────────────────────────────────
// OAuth 登入回調頁面
// ─────────────────────────────────────────────
// 職責：
//   Google/LINE OAuth 完成後，後端 redirect 到此頁面並帶上 ?token=xxx
//   這個頁面讀取 token → 存到 localStorage → 取得使用者資料 → 更新 Redux → 跳回首頁
//
// 為什麼需要這個頁面？
//   OAuth 是後端 redirect 流程，後端無法直接更新前端的 localStorage / Redux
//   所以後端把 token 放在 URL 參數，前端這裡接收並完成登入流程

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setAuth } from '../store/authSlice'
import { getMe } from '../services/api'

function OAuthCallbackPage() {
  // useSearchParams：讀取 URL 的 query string（?token=xxx&error=xxx）
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('處理中...')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // useEffect：元件掛載時執行一次，處理 token
  // 這裡用 useEffect 是因為這是一個「副作用」（更新 localStorage、呼叫 API）
  // 不用 useQuery 是因為這只需要在頁面載入時執行一次，且需要拿 token 做後續操作
  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error || !token) {
      setStatus('登入失敗，請重試')
      setTimeout(() => navigate('/login'), 2000)
      return
    }

    // 1. 先把 token 存到 localStorage，讓 api.js 的 interceptor 自動帶上 Authorization header
    localStorage.setItem('token', token)

    // 2. 用 token 向後端取得完整使用者資料
    getMe()
      .then(({ data: user }) => {
        // 3. dispatch 到 Redux store（同時存入 localStorage）
        dispatch(setAuth({ user, token }))
        navigate('/')
      })
      .catch(() => {
        localStorage.removeItem('token')
        setStatus('登入失敗，請重試')
        setTimeout(() => navigate('/login'), 2000)
      })
  }, []) // [] 代表只在元件第一次掛載時執行

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}

export default OAuthCallbackPage
