// ─────────────────────────────────────────────
// 評論路由 (Reviews Routes)
// 負責：查詢某房源的評論、新增評論
// ─────────────────────────────────────────────
// 這個路由是「巢狀路由」，掛載在 /api/listings/:listingId/reviews 下
// 例如：GET /api/listings/abc123/reviews
//
// mergeParams: true 讓這個子路由能取得上層路由的 :listingId 參數

import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireFields } from '../utils/validate.js'

const router = Router({ mergeParams: true })  // 繼承上層路由的 URL 參數

// ── 取得某房源的所有評論 ─────────────────────────
router.get('/', async (req, res) => {
  try {
    // req.params.listingId 來自上層路由 /api/listings/:listingId/reviews
    const reviews = await prisma.review.findMany({
      where: { listingId: req.params.listingId },
      include: {
        // 帶出評論者的基本資訊，前端顯示頭像和名字
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 新增評論 ─────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body
    const listingId = req.params.listingId
    const userId = req.user.id

    // 驗證必填欄位與合法值
    const fieldError = requireFields(req.body, 'rating', 'comment')
    if (fieldError) return res.status(400).json({ message: fieldError })
    const ratingNum = parseInt(rating)
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'rating 必須是 1–5 的整數' })
    }

    // 【驗證 1】防止重複留評：同一個人對同一個房源只能留一次
    // findFirst 找到第一筆符合的資料，沒有則回傳 null
    const existingReview = await prisma.review.findFirst({
      where: { listingId, authorId: userId },
    })
    if (existingReview) {
      return res.status(409).json({ message: '您已經為這個房源留下評論了' })
      // 409 Conflict：請求與目前資料狀態衝突（已存在）
    }

    // 【驗證 2】只有完成入住才能留評
    // 條件：status 為 CONFIRMED（房東已確認）且 checkOut 日期已過
    const completedBooking = await prisma.booking.findFirst({
      where: {
        listingId,
        guestId: userId,
        status: 'CONFIRMED',
        checkOut: { lt: new Date() },  // lt = less than，checkOut 早於現在 = 已退房
      },
    })
    if (!completedBooking) {
      return res.status(403).json({ message: '只有完成入住的旅客才能留下評論' })
      // 403 Forbidden：已認證但沒有權限執行此操作
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        authorId: userId,
        listingId,
      },
      // 回傳時帶上作者資訊，前端可以直接顯示，不需要重新 fetch
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    })
    res.status(201).json(review)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
