// ─────────────────────────────────────────────
// 編輯房源頁面
// ─────────────────────────────────────────────
// 和 NewListingPage 結構相同，差別在於：
//   1. 先用 useQuery 拉取現有資料，填入表單
//   2. 送出時呼叫 updateListing（PUT）而非 createListing（POST）

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getListing, updateListing, uploadListingImage } from '../services/api'
import CoordinatePicker from '../components/host/CoordinatePicker'

const CATEGORIES = ['海邊', '山區', '城市', '鄉村', '溫泉', '島嶼', '露營']

function EditListingPage() {
  const { id } = useParams()  // 從 URL 取得要編輯的房源 ID
  const navigate = useNavigate()
  const [form, setForm] = useState(null)  // null 代表還在等資料
  const [errors, setErrors] = useState({})
  const [uploadingIndex, setUploadingIndex] = useState(null)
  const fileInputRefs = useRef([])

  // 取得現有房源資料
  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListing(id).then((res) => res.data),
  })

  // 資料載入後，用現有資料初始化表單
  // useEffect：在特定值變化後執行副作用
  // 依賴陣列 [listing]：只有 listing 變化時才執行
  useEffect(() => {
    if (listing) {
      setForm({
        title: listing.title,
        description: listing.description,
        price: String(listing.price),
        location: listing.location,
        lat: String(listing.lat),
        lng: String(listing.lng),
        maxGuests: String(listing.maxGuests),
        category: listing.category,
        images: listing.images.length > 0 ? listing.images : [''],
      })
    }
  }, [listing])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleImageChange = (index, value) => {
    const newImages = [...form.images]
    newImages[index] = value
    setForm((prev) => ({ ...prev, images: newImages }))
  }

  const addImage = () => {
    if (form.images.length >= 5) return
    setForm((prev) => ({ ...prev, images: [...prev.images, ''] }))
  }

  const removeImage = (index) => {
    if (form.images.length <= 1) return
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleFileUpload = async (index, file) => {
    if (!file) return
    setUploadingIndex(index)
    try {
      const { data } = await uploadListingImage(file)
      const newImages = [...form.images]
      newImages[index] = data.url
      setForm((prev) => ({ ...prev, images: newImages }))
    } catch {
      alert('圖片上傳失敗，請再試一次')
    } finally {
      setUploadingIndex(null)
    }
  }

  const handleMapClick = ({ lat, lng }) => {
    setForm((prev) => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = '請輸入標題'
    if (!form.description.trim()) e.description = '請輸入說明'
    if (!form.price || Number(form.price) <= 0) e.price = '請輸入有效價格'
    if (!form.location.trim()) e.location = '請輸入地址'
    if (!form.lat || !form.lng) e.lat = '請在地圖上點選位置'
    if (!form.maxGuests || Number(form.maxGuests) <= 0) e.maxGuests = '請輸入人數'
    if (form.images.every((img) => !img.trim())) e.images = '請至少輸入一張圖片網址'
    return e
  }

  const { mutate: save, isPending, error: saveError } = useMutation({
    mutationFn: (data) => updateListing(id, data),
    onSuccess: () => navigate('/host/listings'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    save({
      ...form,
      price: parseFloat(form.price),
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      maxGuests: parseInt(form.maxGuests),
      images: form.images.filter((img) => img.trim()),
    })
  }

  if (isLoading || !form) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-gray-200 rounded-lg" />)}
      </div>
    )
  }

  // ── 表單和 NewListingPage 完全相同，只有標題和按鈕文字不同 ──
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">編輯房源</h1>
      <p className="text-gray-500 text-sm mb-8">修改您的房源資訊</p>

      {saveError && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
          {saveError.response?.data?.message || '儲存失敗，請稍後再試'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

        <Section title="基本資訊">
          <Field label="房源標題" error={errors.title}>
            <input name="title" value={form.title} onChange={handleChange} className={inputClass(errors.title)} />
          </Field>
          <Field label="詳細說明" error={errors.description}>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={`${inputClass(errors.description)} resize-none`} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="每晚價格（NT$）" error={errors.price}>
              <input type="number" name="price" value={form.price} onChange={handleChange} min="1" className={inputClass(errors.price)} />
            </Field>
            <Field label="最多人數" error={errors.maxGuests}>
              <input type="number" name="maxGuests" value={form.maxGuests} onChange={handleChange} min="1" max="20" className={inputClass(errors.maxGuests)} />
            </Field>
          </div>
          <Field label="房源類別">
            <select name="category" value={form.category} onChange={handleChange} className={inputClass()}>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="地點">
          <Field label="詳細地址" error={errors.location}>
            <input name="location" value={form.location} onChange={handleChange} className={inputClass(errors.location)} />
          </Field>
          <Field label="地圖位置" error={errors.lat}>
            <p className="text-xs text-gray-500 mb-2">點擊地圖重新選取位置</p>
            <CoordinatePicker lat={form.lat} lng={form.lng} onMapClick={handleMapClick} />
            {form.lat && form.lng && (
              <p className="text-xs text-gray-400 mt-2">已選取：{form.lat}, {form.lng}</p>
            )}
          </Field>
        </Section>

        <Section title="房源圖片">
          {errors.images && <p className="text-red-500 text-xs mb-3">{errors.images}</p>}
          <div className="space-y-3">
            {form.images.map((img, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={img}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder={`圖片 ${index + 1} 的網址`}
                      className={`flex-1 ${inputClass()}`}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[index]?.click()}
                      disabled={uploadingIndex === index}
                      className="shrink-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:border-gray-500 disabled:opacity-50 transition"
                    >
                      {uploadingIndex === index ? '上傳中...' : '上傳圖片'}
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => (fileInputRefs.current[index] = el)}
                      onChange={(e) => handleFileUpload(index, e.target.files?.[0])}
                    />
                  </div>
                  {img && (
                    <img src={img} alt="預覽" className="h-24 w-full object-cover rounded-lg"
                      onError={(e) => { e.target.style.display = 'none' }} />
                  )}
                </div>
                {form.images.length > 1 && (
                  <button type="button" onClick={() => removeImage(index)} className="mt-3 text-gray-400 hover:text-red-500 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {form.images.length < 5 && (
            <button type="button" onClick={addImage} className="mt-3 flex items-center gap-2 text-sm text-rose-500 font-medium hover:text-rose-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增圖片
            </button>
          )}
        </Section>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => navigate('/host/listings')}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition">
            取消
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 rounded-xl transition">
            {isPending ? '儲存中...' : '儲存變更'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

const inputClass = (error) =>
  `w-full border ${error ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition`

export default EditListingPage
