// ─────────────────────────────────────────────
// Axios 設定 & API 函式
// ─────────────────────────────────────────────
// Axios 是用來發 HTTP 請求的套件，比原生 fetch 更方便
//
// 這裡做兩件事：
//   1. 建立 axios 實例，統一設定 baseURL 和 token
//   2. 匯出所有 API 呼叫函式，讓元件直接使用

import axios from 'axios'

// 建立 axios 實例，所有請求都會自動加上 /api 前綴
const api = axios.create({
  baseURL: '/api',  // 配合 vite.config.js 的 proxy，自動導向後端 localhost:5000
})

// 請求攔截器 (Request Interceptor)：每次發請求前自動執行
// 作用：從 localStorage 取出 token，自動加到 Header，不用每個請求都手動加
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── 認證相關 API ────────────────────────────────
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')

// ── 房源相關 API ────────────────────────────────
// params 是篩選條件物件，例如 { location: '台北', category: '海邊' }
export const getListings = (params) => api.get('/listings', { params })
export const getListing = (id) => api.get(`/listings/${id}`)
// 取得某房源已被預訂的日期範圍（只有 CONFIRMED 且尚未退房的）
export const getBookedDates = (id) => api.get(`/listings/${id}/booked-dates`)
export const createListing = (data) => api.post('/listings', data)
// 上傳單張房源圖片到 Cloudinary，回傳 { url }
export const uploadListingImage = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  return api.post('/listings/images', formData)
}
export const updateListing = (id, data) => api.put(`/listings/${id}`, data)
export const deleteListing = (id) => api.delete(`/listings/${id}`)

// ── 訂單相關 API ────────────────────────────────
export const getBookings = () => api.get('/bookings')
export const createBooking = (data) => api.post('/bookings', data)
export const updateBooking = (id, data) => api.put(`/bookings/${id}`, data)

// ── 評論相關 API ────────────────────────────────
export const getReviews = (listingId) => api.get(`/listings/${listingId}/reviews`)
export const createReview = (listingId, data) => api.post(`/listings/${listingId}/reviews`, data)

// ── 收藏相關 API ────────────────────────────────
export const getFavorites = () => api.get('/favorites')
export const addFavorite = (listingId) => api.post(`/favorites/${listingId}`)
export const removeFavorite = (listingId) => api.delete(`/favorites/${listingId}`)

// ── 個人資料 API ────────────────────────────────
// PATCH：只傳要更新的欄位（不需要送出全部資料）
export const updateProfile = (data) => api.patch('/auth/profile', data)
export const changePassword = (data) => api.patch('/auth/password', data)
// FormData 上傳頭像圖片（multipart/form-data，axios 會自動設定正確的 Content-Type）
export const uploadAvatar = (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return api.post('/auth/me/avatar', formData)
}

// ── 房東訂單 API ────────────────────────────────
export const getHostBookings = () => api.get('/bookings/host')
export const hostActionBooking = (id, status) => api.put(`/bookings/${id}/host-action`, { status })

// ── 管理員 API ──────────────────────────────────
export const adminGetStats = () => api.get('/admin/stats')
export const adminGetUsers = () => api.get('/admin/users')
export const adminToggleUser = (id, isActive) => api.patch(`/admin/users/${id}`, { isActive })
export const adminGetListings = () => api.get('/admin/listings')
export const adminDeleteListing = (id) => api.delete(`/admin/listings/${id}`)
export const adminGetBookings = () => api.get('/admin/bookings')
export const adminGetReviews = () => api.get('/admin/reviews')
export const adminDeleteReview = (id) => api.delete(`/admin/reviews/${id}`)

export default api
