// ─────────────────────────────────────────────
// 個人設定頁面
// ─────────────────────────────────────────────
// 功能：
//   1. 修改名稱和頭像網址
//   2. 開啟/關閉房東模式（isHost）
//      → 開啟後 Navbar 才會出現「管理房源」

import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSelector, useDispatch } from 'react-redux'
import { setUser } from '../store/authSlice'
import { updateProfile, changePassword, uploadAvatar } from '../services/api'

function ProfilePage() {
  // useSelector：讀取 state，useDispatch：取得發送器
  const user = useSelector(state => state.auth.user)
  const dispatch = useDispatch()

  // 用 user 資料初始化表單
  const [form, setForm] = useState({ name: user?.name || '' })
  const [saved, setSaved] = useState(false)  // 顯示「已儲存」提示

  // 頭像上傳：fileInputRef 指向隱藏的 <input type="file">，點擊頭像時觸發它
  const fileInputRef = useRef(null)

  // 上傳頭像到 Cloudinary
  const { mutate: saveAvatar, isPending: isUploadingAvatar } = useMutation({
    mutationFn: (file) => uploadAvatar(file),
    onSuccess: ({ data }) => {
      dispatch(setUser(data))  // 更新 Redux store（同時存 localStorage）
    },
  })

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) saveAvatar(file)
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  // 更新基本資料
  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (data) => updateProfile(data),
    onSuccess: ({ data }) => {
      dispatch(setUser(data))   // dispatch action → 更新 Redux store 和 localStorage
      setSaved(true)
    },
  })

  // 修改密碼表單狀態
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  const handlePwChange = (e) => {
    setPwForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setPwError('')
    setPwSaved(false)
  }

  const { mutate: savePassword, isPending: isSavingPw } = useMutation({
    mutationFn: (data) => changePassword(data),
    onSuccess: () => {
      setPwSaved(true)
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (err) => {
      setPwError(err.response?.data?.message || '修改失敗，請稍後再試')
    },
  })

  const handlePwSubmit = (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('新密碼與確認密碼不一致')
      return
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('新密碼至少需要 6 個字元')
      return
    }
    savePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
  }

  // 切換房東模式（獨立的 toggle，即時生效）
  const { mutate: toggleHost, isPending: isToggling } = useMutation({
    mutationFn: (isHost) => updateProfile({ isHost }),
    onSuccess: ({ data }) => {
      dispatch(setUser(data))
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    save({ name: form.name })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">個人設定</h1>

      <div className="space-y-8">

        {/* ── 頭像預覽 + 上傳 ── */}
        <div className="flex items-center gap-6 pb-8 border-b border-gray-200">
          {/* 點擊頭像觸發隱藏的 file input，上傳後直接更新 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="relative w-20 h-20 rounded-full overflow-hidden bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-3xl shrink-0 group"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="頭像" className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
            {/* hover 時顯示相機 icon，提示可以點擊更換 */}
            <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-full">
              {isUploadingAvatar ? (
                <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </span>
          </button>

          {/* 隱藏的 file input，只接受圖片 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <div>
            <p className="font-semibold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-1">點擊頭像更換照片</p>
            {user?.isHost && (
              <span className="inline-block mt-1 text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                房東
              </span>
            )}
          </div>
        </div>

        {/* ── 基本資料表單 ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">基本資料</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">名稱</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition"
            >
              {isSaving ? '儲存中...' : '儲存變更'}
            </button>
            {/* 儲存成功提示，2 秒後靠 CSS 淡出（靠 saved state 控制顯示） */}
            {saved && (
              <p className="text-green-600 text-sm font-medium">✓ 已儲存</p>
            )}
          </div>
        </form>

        {/* ── 修改密碼 ── */}
        <form onSubmit={handlePwSubmit} className="space-y-5 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold text-gray-900">修改密碼</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">目前密碼</label>
            <input
              type="password"
              name="currentPassword"
              value={pwForm.currentPassword}
              onChange={handlePwChange}
              placeholder="輸入目前的密碼"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">新密碼</label>
            <input
              type="password"
              name="newPassword"
              value={pwForm.newPassword}
              onChange={handlePwChange}
              placeholder="至少 6 個字元"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">確認新密碼</label>
            <input
              type="password"
              name="confirmPassword"
              value={pwForm.confirmPassword}
              onChange={handlePwChange}
              placeholder="再輸入一次新密碼"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
            />
          </div>

          {/* 錯誤訊息 */}
          {pwError && (
            <p className="text-sm text-red-500">{pwError}</p>
          )}

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isSavingPw}
              className="bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition"
            >
              {isSavingPw ? '更新中...' : '更新密碼'}
            </button>
            {pwSaved && (
              <p className="text-green-600 text-sm font-medium">✓ 密碼已更新</p>
            )}
          </div>
        </form>

        {/* ── 房東模式 ── */}
        <div className="border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">房東模式</h2>
              <p className="text-sm text-gray-500 mt-1">
                {user?.isHost
                  ? '已開啟。您可以刊登房源並管理訂單。'
                  : '開啟後即可刊登房源，讓旅客預訂您的住宿。'}
              </p>
            </div>

            {/* Toggle Switch */}
            {/* 點擊時呼叫 toggleHost，傳入相反的 isHost 值 */}
            <button
              onClick={() => toggleHost(!user?.isHost)}
              disabled={isToggling}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                user?.isHost ? 'bg-rose-500' : 'bg-gray-300'
              }`}
            >
              {/* 滑動的白色圓點 */}
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                  user?.isHost ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 開啟房東模式後顯示的提示 */}
          {user?.isHost && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a
                href="/host/listings"
                className="text-sm text-rose-500 font-medium hover:underline"
              >
                前往管理房源 →
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default ProfilePage
