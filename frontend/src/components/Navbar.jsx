// ─────────────────────────────────────────────
// 導覽列元件 (Navbar)
// ─────────────────────────────────────────────
// 登入後右側顯示下拉選單（仿 Airbnb 的漢堡+頭像按鈕）
// 點擊按鈕外的區域會關閉選單（用 useEffect 監聽全域點擊）
// 桌機版搜尋列可直接輸入地點和人數，按搜尋跳轉到首頁

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'  // Redux：讀取 state 和發送 action
import { logout } from '../store/authSlice'             // Redux：引入 logout action creator

// 【Redux 使用說明 — 對比 Zustand】
//
//  Zustand 寫法：
//    const { user, logout } = useAuthStore()
//
//  Redux 寫法：
//    const user = useSelector(state => state.auth.user)   ← 讀取 state
//    const dispatch = useDispatch()                        ← 取得發送器
//    dispatch(logout())                                    ← 發送 action
//
//  useSelector 是什麼？
//    → 從 Redux store 讀取資料的 hook
//    → 參數是一個函式（selector），告訴 Redux「我要哪一塊 state」
//    → state.auth 對應 store/index.js 裡的 reducer: { auth: authReducer }
function Navbar() {
  // useSelector：讀取 Redux store 的 state
  // state.auth.user → store → reducer: { auth } → authSlice 的 user
  const user = useSelector(state => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)    // 下拉選單開關
  const menuRef = useRef(null)                        // 指向選單 DOM，偵測點擊範圍

  // 桌機搜尋列的本地狀態（按搜尋後才更新 URL）
  const [searchLocation, setSearchLocation] = useState('')
  const [searchGuests, setSearchGuests] = useState('')

  // 點擊選單外部時自動關閉
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    dispatch(logout())  // dispatch action → reducer 清除 state 和 localStorage
    setMenuOpen(false)
    navigate('/')
  }

  // 桌機搜尋：把條件轉成 URL query string，跳轉到首頁
  // 例如：/?location=台北&guests=2
  const handleDesktopSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchLocation.trim()) params.set('location', searchLocation.trim())
    if (searchGuests) params.set('guests', searchGuests)
    // 跳轉到首頁並帶上搜尋參數
    navigate(`/?${params.toString()}`)
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="text-rose-500 font-bold text-2xl tracking-tight shrink-0">
          StayNest
        </Link>

        {/* 搜尋列（桌機版）── 實際可輸入的表單 */}
        <form
          onSubmit={handleDesktopSearch}
          className="hidden md:flex items-center border border-gray-300 rounded-full shadow-sm hover:shadow-md transition overflow-hidden flex-1 max-w-md"
        >
          {/* 地點輸入 */}
          <input
            type="text"
            placeholder="搜尋地點"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="flex-1 px-4 py-2 text-sm text-gray-700 focus:outline-none bg-transparent min-w-0"
          />

          {/* 分隔線 */}
          <div className="h-5 w-px bg-gray-300 shrink-0" />

          {/* 人數輸入 */}
          <input
            type="number"
            placeholder="旅客人數"
            min="1"
            max="20"
            value={searchGuests}
            onChange={(e) => setSearchGuests(e.target.value)}
            className="w-24 px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
          />

          {/* 搜尋按鈕（放大鏡） */}
          <button
            type="submit"
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-full p-2 m-1 transition shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>

        {/* 右側選單 */}
        {user ? (
          // ── 已登入：漢堡 + 頭像按鈕 ──
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 border border-gray-300 rounded-full pl-3 pr-1 py-1 hover:shadow-md transition"
            >
              {/* 漢堡 icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* 頭像小圓圈 */}
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-sm overflow-hidden">
                {user.avatar
                  ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                  : user.name[0].toUpperCase()
                }
              </div>
            </button>

            {/* 下拉選單 */}
            {menuOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-2xl shadow-lg py-2 z-50">

                {/* 使用者名稱（只顯示，不可點擊） */}
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>

                <MenuItem to="/profile" onClick={() => setMenuOpen(false)}>個人設定</MenuItem>
                <MenuItem to="/bookings" onClick={() => setMenuOpen(false)}>我的訂單</MenuItem>
                <MenuItem to="/favorites" onClick={() => setMenuOpen(false)}>收藏清單</MenuItem>

                {/* 房東功能（只有 isHost 才顯示） */}
                {user.isHost && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <MenuItem to="/host/listings" onClick={() => setMenuOpen(false)}>管理房源</MenuItem>
                    <MenuItem to="/host/bookings" onClick={() => setMenuOpen(false)}>訂單管理</MenuItem>
                    <MenuItem to="/host/listings/new" onClick={() => setMenuOpen(false)}>刊登新房源</MenuItem>
                  </>
                )}

                {/* 成為房東提示 */}
                {!user.isHost && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <MenuItem to="/profile" onClick={() => setMenuOpen(false)}>
                      <span className="text-rose-500">成為房東</span>
                    </MenuItem>
                  </>
                )}

                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  登出
                </button>
              </div>
            )}
          </div>
        ) : (
          // ── 未登入：登入/註冊按鈕 ──
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/login" className="text-sm font-medium text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-full transition">
              登入
            </Link>
            <Link to="/register" className="text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-full transition">
              註冊
            </Link>
          </div>
        )}

      </div>
    </header>
  )
}

// ── 選單項目元件（避免重複寫相同樣式） ──────────
function MenuItem({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
    >
      {children}
    </Link>
  )
}

export default Navbar
