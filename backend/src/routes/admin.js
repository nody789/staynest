// 管理員路由 — 所有路由都需要 isAdmin middleware
// 掛載在 /api/admin/*

import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { isAdmin } from '../middleware/admin.js'

const router = Router()

// ── GET /api/admin/stats — 儀表板統計 ──────────
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const [users, listings, bookings, reviews] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.booking.count(),
      prisma.review.count(),
    ])
    res.json({ users, listings, bookings, reviews })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── GET /api/admin/users — 所有使用者 ──────────
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, avatar: true,
        isHost: true, role: true, isActive: true, createdAt: true,
        _count: { select: { listings: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── PATCH /api/admin/users/:id — 停用/啟用帳號 ─
// body: { isActive: boolean }
router.patch('/users/:id', isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      select: { id: true, name: true, email: true, isActive: true },
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── GET /api/admin/listings — 所有房源 ─────────
router.get('/listings', isAdmin, async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        host: { select: { id: true, name: true, email: true } },
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(listings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── DELETE /api/admin/listings/:id — 強制下架 ──
router.delete('/listings/:id', isAdmin, async (req, res) => {
  try {
    await prisma.listing.delete({ where: { id: req.params.id } })
    res.json({ message: '房源已刪除' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── GET /api/admin/bookings — 所有訂單 ─────────
router.get('/bookings', isAdmin, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        guest: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, location: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── GET /api/admin/reviews — 所有評論 ──────────
router.get('/reviews', isAdmin, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        author: { select: { id: true, name: true } },
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── DELETE /api/admin/reviews/:id — 刪除評論 ───
router.delete('/reviews/:id', isAdmin, async (req, res) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } })
    res.json({ message: '評論已刪除' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
