// ─────────────────────────────────────────────
// 首頁 - 房源列表
// ─────────────────────────────────────────────
// 使用到的 React Query 概念：
//   useQuery → 發 GET 請求，自動管理 loading/error/data 狀態
//   queryKey → 快取的識別鍵，相同 key 不會重複請求
//
// 使用到的 React Router 概念：
//   useSearchParams → 讀寫 URL 的 query string（?location=台北&category=海邊）
//   這樣搜尋條件可以放在網址裡，方便分享或上一頁回來保留篩選狀態

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getListings } from '../services/api'
import ListingCard from '../components/ListingCard'
import SearchBar from '../components/SearchBar'
import CategoryFilter from '../components/CategoryFilter'
import ListingsMap from '../components/ListingsMap'

function HomePage() {
  // 地圖顯示開關（預設隱藏，點擊「顯示地圖」按鈕才展開）
  const [showMap, setShowMap] = useState(false)

  // useSearchParams：讀寫 URL query string
  //   searchParams.get('location') → 讀取 ?location= 的值
  //   setSearchParams({ ... })     → 更新 URL query string（不會跳轉頁面）
  const [searchParams, setSearchParams] = useSearchParams()

  // 從 URL 讀出篩選條件 + 當前頁碼
  const filters = {
    location: searchParams.get('location') || '',
    category: searchParams.get('category') || '',
    guests:   searchParams.get('guests')   || '',
  }
  // parseInt 確保是數字，預設第 1 頁
  const currentPage = parseInt(searchParams.get('page')) || 1

  // 更新某個篩選條件，同時保留其他條件，並重置到第 1 頁
  const updateFilter = (key, value) => {
    const next = {
      location: searchParams.get('location') || '',
      category: searchParams.get('category') || '',
      guests:   searchParams.get('guests')   || '',
    }
    next[key] = value
    Object.keys(next).forEach((k) => { if (!next[k]) delete next[k] })
    // 篩選條件改變時回到第 1 頁，避免頁碼超出範圍
    setSearchParams(next)
  }

  // 手機版搜尋列：一次更新全部條件
  const handleMobileSearch = (newFilters) => {
    const next = { ...newFilters }
    Object.keys(next).forEach((k) => { if (!next[k]) delete next[k] })
    setSearchParams(next)
  }

  // 切換頁碼：更新 URL 的 page 參數
  const goToPage = (page) => {
    const next = Object.fromEntries(searchParams.entries())
    next.page = String(page)
    setSearchParams(next)
    // 切換頁碼後捲回頂部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // useQuery：queryKey 包含 filters + page，條件或頁碼改變都會重新請求
  const { data, isLoading, isError } = useQuery({
    queryKey: ['listings', filters, currentPage],
    queryFn: () => getListings({ ...filters, page: currentPage }).then((res) => res.data),
  })

  // 後端回傳 { listings, total, page, totalPages }
  const listings    = data?.listings    ?? []
  const totalPages  = data?.totalPages  ?? 1
  const total       = data?.total       ?? 0

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">

      {/* 搜尋列（手機版，桌機版已在 Navbar 裡） */}
      <div className="md:hidden mb-6">
        <SearchBar filters={filters} onSearch={handleMobileSearch} />
      </div>

      {/* 類別篩選 */}
      <CategoryFilter
        selected={filters.category}
        onSelect={(cat) => updateFilter('category', cat)}
      />

      {/* 目前篩選條件顯示（有搜尋地點時才顯示，方便使用者知道目前在篩選） */}
      {(filters.location || filters.guests) && (
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
          <span>篩選條件：</span>
          {filters.location && (
            <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
              📍 {filters.location}
              {/* x 按鈕清除地點篩選 */}
              <button
                onClick={() => updateFilter('location', '')}
                className="text-gray-400 hover:text-gray-600 ml-1"
              >×</button>
            </span>
          )}
          {filters.guests && (
            <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
              👤 {filters.guests} 人
              <button
                onClick={() => updateFilter('guests', '')}
                className="text-gray-400 hover:text-gray-600 ml-1"
              >×</button>
            </span>
          )}
        </div>
      )}

      {/* 房源列表 */}
      {isLoading && (
        // 骨架屏：資料載入中時的佔位動畫
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-2xl h-64 mb-3" />
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-2" />
              <div className="bg-gray-200 h-4 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-gray-500">
          載入失敗，請重新整理頁面
        </div>
      )}

      {!isLoading && !isError && listings.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium text-gray-700 mb-2">找不到符合條件的房源</p>
          <p className="text-gray-500 text-sm">試試清除篩選條件，或搜尋其他地點</p>
          <button
            onClick={() => setSearchParams({})}
            className="mt-4 text-rose-500 text-sm underline hover:no-underline"
          >
            清除所有篩選
          </button>
        </div>
      )}

      {!isLoading && !isError && listings.length > 0 && (
        <>
          {/* 結果筆數 + 地圖切換按鈕（只在 md 以上顯示） */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              共 {total} 筆房源，第 {currentPage} / {totalPages} 頁
            </p>
            {/* 地圖切換按鈕：手機版隱藏（地圖太小沒意義） */}
            <button
              onClick={() => setShowMap((v) => !v)}
              className="hidden md:flex items-center gap-1.5 text-sm font-medium border border-gray-300 rounded-full px-4 py-2 hover:border-gray-500 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {showMap ? '隱藏地圖' : '顯示地圖'}
            </button>
          </div>

          {/* 左右並排佈局：列表（左）+ 地圖（右，sticky） */}
          <div className={`mt-3 flex gap-4 items-start`}>

            {/* 左側：房源列表
                有地圖時用 2 欄，沒地圖時用 4 欄 */}
            <div className={showMap ? 'flex-1 min-w-0' : 'w-full'}>
              <div className={`grid gap-4 ${
                showMap
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}>
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* 分頁控制（只有超過 1 頁才顯示） */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-10 mb-4">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    ← 上一頁
                  </button>

                  {/* 頁碼按鈕：顯示首頁、尾頁，以及當前頁 ±2 的範圍 */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => goToPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm transition ${
                            p === currentPage
                              ? 'bg-gray-900 text-white font-semibold'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    下一頁 →
                  </button>
                </div>
              )}
            </div>

            {/* 右側：地圖（sticky，隨頁面捲動保持在視窗內）
                hidden md:block：手機版隱藏，平板以上才顯示
                sticky top-20：距頂部 80px（Navbar 高度），貼著畫面側邊 */}
            {showMap && (
              <div className="hidden md:block w-[42%] shrink-0 sticky top-20 rounded-2xl overflow-hidden"
                   style={{ height: 'calc(100vh - 90px)' }}>
                <ListingsMap listings={listings} />
              </div>
            )}
          </div>
        </>
      )}

    </div>
  )
}

export default HomePage
