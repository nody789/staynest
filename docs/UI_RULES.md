# UI_RULES.md

## 設計系統

純 Tailwind CSS，無額外 UI Library。

## 色彩規範

Airbnb 品牌色為主：

```
主色（玫瑰紅）：#FF385C  → text-rose-500 / bg-rose-500
hover 狀態：#E31C5F      → hover:bg-rose-600
背景：白色 / gray-50
文字主色：gray-900
文字次色：gray-500
邊框：gray-200
```

## 字體規範

```
大標題：text-2xl font-bold
小標題：text-lg font-semibold
內文：text-sm text-gray-700
輔助文字：text-xs text-gray-500
```

## RWD 斷點

| 名稱 | 寬度 | 說明 |
|------|------|------|
| sm | 640px | 手機橫向 |
| md | 768px | 平板 |
| lg | 1024px | 筆電 |
| xl | 1280px | 桌機 |

## 三種必要 UI 狀態

每個有資料請求的頁面或元件，必須處理以下三種狀態：

### 載入中（Loading）

```jsx
// 使用 Skeleton 佔位，避免顯示空白
<div className="animate-pulse bg-gray-200 rounded h-48 w-full" />
```

### 空狀態（Empty）

```jsx
<div className="text-center text-gray-400 py-12">
  <p>沒有符合條件的房源</p>
</div>
```

### 錯誤狀態（Error）

```jsx
<div className="text-center text-red-500 py-12">
  <p>載入失敗，請稍後再試</p>
  <button onClick={refetch} className="mt-4 text-sm underline">重試</button>
</div>
```

## 元件規範

### 按鈕

```jsx
// 主要（玫瑰紅）
<button className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg">

// 次要（外框）
<button className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg">
```

### 房源卡片

- 圖片比例：aspect-square 或 aspect-[4/3]
- hover 時圖片輕微放大：`group-hover:scale-105 transition`
- 價格顯示：粗體 + `/晚`

## 備註

- 地圖元件使用 Leaflet，需注意 SSR 限制（此專案為純 CSR，無問題）
- 圖片使用 Cloudinary URL，記得加 `object-cover` 防止變形
