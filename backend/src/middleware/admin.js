import { authenticate } from './auth.js'
import prisma from '../utils/prisma.js'

// 先驗證 JWT，再確認 role === ADMIN
// 使用方式：router.get('/users', isAdmin, handler)
export const isAdmin = [
  authenticate,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true },
      })
      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: '需要管理員權限' })
      }
      next()
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  },
]
