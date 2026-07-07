// ─────────────────────────────────────────────
// 房源路由 (Listings Routes)
// 負責：查詢列表、查詢詳情、新增、編輯、刪除房源
// ─────────────────────────────────────────────
// 路由對應：
//   GET    /api/listings         → 取得房源列表（支援篩選）
//   GET    /api/listings/:id     → 取得單一房源詳情
//   POST   /api/listings         → 新增房源（需登入）
//   PUT    /api/listings/:id     → 編輯房源（需登入，只能改自己的）
//   DELETE /api/listings/:id     → 刪除房源（需登入，只能刪自己的）

import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { upload, uploadToCloudinary } from '../utils/upload.js'
import { requireFields, isPositiveNumber } from '../utils/validate.js'

const router = Router()

// ── 上傳房源圖片到 Cloudinary ────────────────────
// 放在所有 /:id 路由之前，避免 'images' 被當成 id 解析
router.post('/images', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: '請選擇圖片' })
    const result = await uploadToCloudinary(req.file.buffer, 'staynest/listings')
    res.json({ url: result.secure_url })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 取得房源列表（支援搜尋篩選 + 分頁）──────────
// GET /api/listings?location=台北&page=1&limit=12&hostId=xxx
router.get('/', async (req, res) => {
  try {
    const { location, category, minPrice, maxPrice, guests, hostId, page, limit } = req.query

    // 分頁計算
    // page 預設第 1 頁，limit 預設每頁 12 筆
    // skip = 跳過幾筆，例如第 2 頁 skip=12 就從第 13 筆開始
    const pageNum  = Math.max(1, parseInt(page)  || 1)
    const limitNum = Math.min(100, parseInt(limit) || 12)  // 最多 100 筆，防止過大請求
    const skip     = (pageNum - 1) * limitNum

    const where = {
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(category && { category }),
      ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
      ...(guests   && { maxGuests: { gte: parseInt(guests) } }),
      ...(hostId   && { hostId }),  // 房東管理頁用，只查自己的房源
    }

    // Promise.all：同時執行兩個 DB 查詢，比序列執行快
    // 一個查資料、一個查總筆數（用來計算總頁數）
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          host:    { select: { id: true, name: true, avatar: true } },
          reviews: { select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.listing.count({ where }),
    ])

    res.json({
      listings,
      total,
      page:       pageNum,
      totalPages: Math.ceil(total / limitNum),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 取得單一房源詳情 ────────────────────────────
// ── 取得某房源的已預訂日期 ───────────────────────
// 前端用來在日期選擇器上標示「不可選」的期間
// 只回傳未來的 CONFIRMED 訂單（過去的不需要顯示）
// 注意：這個路由必須放在 /:id 之前，否則 'booked-dates' 會被當成 id 解析
router.get('/:id/booked-dates', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        listingId: req.params.id,
        status: 'CONFIRMED',
        // gte = greater than or equal：只取退房日在今天之後的訂單
        checkOut: { gte: new Date() },
      },
      select: {
        checkIn: true,
        checkOut: true,
      },
      orderBy: { checkIn: 'asc' },
    })
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 取得單一房源詳情 ─────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    // req.params.id 是 URL 路徑上的參數，例如 /api/listings/abc123
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        host: { select: { id: true, name: true, avatar: true } },
        // 詳情頁要顯示完整評論，包含評論者資料
        reviews: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
        },
      },
    })
    if (!listing) return res.status(404).json({ message: '找不到房源' })
    res.json(listing)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 新增房源 ────────────────────────────────────
// authenticate 確保只有登入的使用者才能新增
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, price, location, lat, lng, images, maxGuests, category } = req.body

    // 驗證必填欄位與合法值
    const fieldError = requireFields(req.body, 'title', 'description', 'price', 'location', 'maxGuests', 'category')
    if (fieldError) return res.status(400).json({ message: fieldError })
    if (!isPositiveNumber(price)) return res.status(400).json({ message: 'price 必須大於 0' })
    if (parseInt(maxGuests) < 1) return res.status(400).json({ message: 'maxGuests 至少為 1' })

    const listing = await prisma.listing.create({
      data: {
        title, description, price, location, lat, lng, images, maxGuests, category,
        hostId: req.user.id,  // 從 token 取得當前使用者 ID，自動設為房東
      },
    })
    res.status(201).json(listing)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 編輯房源 ────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } })
    if (!listing) return res.status(404).json({ message: '找不到房源' })

    // 確認這筆房源是當前登入使用者的，防止別人修改你的房源
    if (listing.hostId !== req.user.id) return res.status(403).json({ message: '無權限修改此房源' })

    const { title, description, price, location, lat, lng, images, maxGuests, category } = req.body

    // 有傳的欄位才驗證（PUT 允許部分更新）
    if (price !== undefined && !isPositiveNumber(price)) return res.status(400).json({ message: 'price 必須大於 0' })
    if (maxGuests !== undefined && parseInt(maxGuests) < 1) return res.status(400).json({ message: 'maxGuests 至少為 1' })
    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: { title, description, price, location, lat, lng, images, maxGuests, category },
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 刪除房源 ────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } })
    if (!listing) return res.status(404).json({ message: '找不到房源' })

    if (listing.hostId !== req.user.id) return res.status(403).json({ message: '無權限刪除此房源' })

    await prisma.listing.delete({ where: { id: req.params.id } })
    res.json({ message: '刪除成功' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
