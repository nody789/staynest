// ─────────────────────────────────────────────
// 新增房源頁面
// ─────────────────────────────────────────────
// 功能：
//   1. 填寫房源所有資訊
//   2. 圖片網址輸入（可新增多張）
//   3. 地圖點擊取得 lat/lng 座標
//   4. 送出後跳轉到房東管理頁

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createListing, uploadListingImage } from '../services/api'
import CoordinatePicker from '../components/host/CoordinatePicker'

// 房源類別選項（和 CategoryFilter 一致）
const CATEGORIES = ['海邊', '山區', '城市', '鄉村', '溫泉', '島嶼', '露營']

// 表單初始值
const INITIAL_FORM = {
  title: '',
  description: '',
  price: '',
  location: '',
  lat: '',
  lng: '',
  maxGuests: '',
  category: '城市',
  images: [''],  // 圖片網址陣列，初始一個空欄位
}

function NewListingPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})  // 各欄位的驗證錯誤訊息
  const [uploadingIndex, setUploadingIndex] = useState(null)  // 哪個圖片欄位正在上傳
  const fileInputRefs = useRef([])  // 每個圖片欄位對應一個隱藏的 file input
  const navigate = useNavigate()

  // 統一更新表單欄位
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // 使用者開始輸入就清除該欄位的錯誤
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  // 更新某張圖片的網址
  const handleImageChange = (index, value) => {
    const newImages = [...form.images]
    newImages[index] = value
    setForm((prev) => ({ ...prev, images: newImages }))
  }

  // 新增一個圖片輸入欄位
  const addImage = () => {
    if (form.images.length >= 5) return  // 最多 5 張
    setForm((prev) => ({ ...prev, images: [...prev.images, ''] }))
  }

  // 移除某張圖片欄位
  const removeImage = (index) => {
    if (form.images.length <= 1) return  // 至少保留一個
    const newImages = form.images.filter((_, i) => i !== index)
    setForm((prev) => ({ ...prev, images: newImages }))
  }

  // 選擇圖片檔案後上傳到 Cloudinary，把回傳的 URL 填入對應欄位
  const handleFileUpload = async (index, file) => {
    if (!file) return
    setUploadingIndex(index)
    try {
      const { data } = await uploadListingImage(file)
      handleImageChange(index, data.url)
      if (errors.images) setErrors((prev) => ({ ...prev, images: '' }))
    } catch {
      alert('圖片上傳失敗，請再試一次')
    } finally {
      setUploadingIndex(null)
    }
  }

  // 從地圖點擊取得座標，更新 lat/lng
  const handleMapClick = ({ lat, lng }) => {
    setForm((prev) => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }))
  }

  // 表單驗證
  const validate = () => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = '請輸入標題'
    if (!form.description.trim()) newErrors.description = '請輸入說明'
    if (!form.price || Number(form.price) <= 0) newErrors.price = '請輸入有效價格'
    if (!form.location.trim()) newErrors.location = '請輸入地址'
    if (!form.lat || !form.lng) newErrors.lat = '請在地圖上點選位置'
    if (!form.maxGuests || Number(form.maxGuests) <= 0) newErrors.maxGuests = '請輸入人數'
    if (form.images.every((img) => !img.trim())) newErrors.images = '請至少輸入一張圖片網址'
    return newErrors
  }

  const { mutate: submit, isPending, error: submitError } = useMutation({
    mutationFn: (data) => createListing(data),
    onSuccess: () => navigate('/host/listings'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // 捲動到第一個錯誤欄位
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // 整理資料：數字欄位轉型、過濾空的圖片網址
    submit({
      ...form,
      price: parseFloat(form.price),
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      maxGuests: parseInt(form.maxGuests),
      images: form.images.filter((img) => img.trim()),
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">刊登您的房源</h1>
      <p className="text-gray-500 text-sm mb-8">填寫以下資訊，讓旅客找到您的住宿</p>

      {/* API 錯誤訊息 */}
      {submitError && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
          {submitError.response?.data?.message || '送出失敗，請稍後再試'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── 基本資訊 ── */}
        <Section title="基本資訊">
          <Field label="房源標題" error={errors.title}>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="例：台北市中心精品套房，近捷運站"
              className={inputClass(errors.title)}
            />
          </Field>

          <Field label="詳細說明" error={errors.description}>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="描述您的房源特色、周邊環境、交通方式..."
              className={`${inputClass(errors.description)} resize-none`}
            />
          </Field>

          {/* 兩欄排版 */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="每晚價格（NT$）" error={errors.price}>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="1"
                placeholder="1500"
                className={inputClass(errors.price)}
              />
            </Field>

            <Field label="最多人數" error={errors.maxGuests}>
              <input
                type="number"
                name="maxGuests"
                value={form.maxGuests}
                onChange={handleChange}
                min="1"
                max="20"
                placeholder="4"
                className={inputClass(errors.maxGuests)}
              />
            </Field>
          </div>

          <Field label="房源類別">
            {/* select：下拉選單 */}
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={inputClass()}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </Field>
        </Section>

        {/* ── 地點 ── */}
        <Section title="地點">
          <Field label="詳細地址" error={errors.location}>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="例：台北市信義區松高路12號"
              className={inputClass(errors.location)}
            />
          </Field>

          <Field label="在地圖上標示位置" error={errors.lat}>
            <p className="text-xs text-gray-500 mb-2">點擊地圖任意位置以設定座標</p>
            <CoordinatePicker
              lat={form.lat}
              lng={form.lng}
              onMapClick={handleMapClick}
            />
            {/* 顯示目前選取的座標 */}
            {form.lat && form.lng && (
              <p className="text-xs text-gray-400 mt-2">
                已選取：{form.lat}, {form.lng}
              </p>
            )}
          </Field>
        </Section>

        {/* ── 圖片 ── */}
        <Section title="房源圖片">
          <p className="text-sm text-gray-500 -mt-2 mb-4">
            貼上圖片網址（最多 5 張）。可以使用 Unsplash、Imgur 等免費圖片托管服務。
          </p>

          {errors.images && (
            <p className="text-red-500 text-xs mb-3">{errors.images}</p>
          )}

          <div className="space-y-3">
            {form.images.map((img, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    {/* 網址輸入框 */}
                    <input
                      value={img}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder={`圖片 ${index + 1} 的網址（https://...）`}
                      className={`flex-1 ${inputClass()}`}
                    />
                    {/* 上傳按鈕：點擊觸發對應的隱藏 file input */}
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[index]?.click()}
                      disabled={uploadingIndex === index}
                      className="shrink-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:border-gray-500 disabled:opacity-50 transition"
                    >
                      {uploadingIndex === index ? '上傳中...' : '上傳圖片'}
                    </button>
                    {/* 隱藏的 file input */}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => (fileInputRefs.current[index] = el)}
                      onChange={(e) => handleFileUpload(index, e.target.files?.[0])}
                    />
                  </div>
                  {/* 圖片預覽 */}
                  {img && (
                    <img
                      src={img}
                      alt="預覽"
                      className="h-24 w-full object-cover rounded-lg"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}
                </div>
                {/* 移除按鈕 */}
                {form.images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="mt-3 text-gray-400 hover:text-red-500 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 新增圖片按鈕 */}
          {form.images.length < 5 && (
            <button
              type="button"
              onClick={addImage}
              className="mt-3 flex items-center gap-2 text-sm text-rose-500 font-medium hover:text-rose-600 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增圖片
            </button>
          )}
        </Section>

        {/* ── 送出按鈕 ── */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/host/listings')}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 rounded-xl transition"
          >
            {isPending ? '刊登中...' : '刊登房源'}
          </button>
        </div>

      </form>
    </div>
  )
}

// ── 輔助元件：區塊標題 ─────────────────────────
function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">{title}</h2>
      {children}
    </div>
  )
}

// ── 輔助元件：表單欄位（含 label 和錯誤訊息） ──
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

// ── 輔助函式：input 樣式（有錯誤時邊框變紅） ──
const inputClass = (error) =>
  `w-full border ${error ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition`

export default NewListingPage
