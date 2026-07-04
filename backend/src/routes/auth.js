// ─────────────────────────────────────────────
// 認證路由 (Authentication Routes)
// 負責：註冊、登入、取得當前使用者資訊
// ─────────────────────────────────────────────
// 路由對應：
//   POST /api/auth/register → 註冊
//   POST /api/auth/login    → 登入
//   GET  /api/auth/me       → 取得登入中的使用者（需帶 token）

import { Router } from 'express'
import bcrypt from 'bcryptjs'   // 用來將密碼雜湊（hash），不直接存明文密碼
import jwt from 'jsonwebtoken'  // 用來產生/驗證 JWT token
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { upload, uploadToCloudinary } from '../utils/upload.js'

const router = Router()  // 建立子路由，最後 export 給 index.js 掛載

// ── 註冊 ──────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    // req.body 是前端傳來的 JSON 資料
    const { name, email, password } = req.body

    // 檢查 email 是否已被註冊
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(400).json({ message: 'Email 已被使用' })

    // 用 bcrypt 將密碼雜湊（hash），數字 10 是運算強度
    // 雜湊後的密碼無法反推，即使資料庫外洩也安全
    const hashed = await bcrypt.hash(password, 10)

    // 在資料庫建立新使用者，select 指定只回傳安全的欄位（不含密碼）
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, avatar: true, isHost: true, role: true },
    })

    // 產生 JWT token，7 天後過期
    // 把 user.id 存入 token，之後驗證時可取出知道是誰
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    // 回傳 201（建立成功），附上使用者資料和 token
    res.status(201).json({ user, token })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 登入 ──────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 根據 email 查找使用者
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(400).json({ message: 'Email 或密碼錯誤' })

    // 比對輸入的密碼和資料庫的雜湊密碼
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).json({ message: 'Email 或密碼錯誤' })

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    // 解構取出密碼欄位，其餘用 safeUser 回傳（不把密碼傳給前端）
    const { password: _, ...safeUser } = user
    res.json({ user: safeUser, token })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 取得當前使用者 ─────────────────────────────
// authenticate 是 middleware，會先驗證 token，通過才執行後面的函式
router.get('/me', authenticate, async (req, res) => {
  try {
    // authenticate middleware 驗證後，會把解碼的資料存入 req.user
    // req.user.id 就是登入的使用者 ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, avatar: true, isHost: true, role: true },
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 更新個人資料 ───────────────────────────────
// PATCH：部分更新（只傳要改的欄位）
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { name, avatar, isHost } = req.body

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        // 只更新有傳的欄位（undefined 的欄位 Prisma 會忽略）
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(isHost !== undefined && { isHost }),
      },
      select: { id: true, name: true, email: true, avatar: true, isHost: true, role: true },
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 上傳頭像 ───────────────────────────────────
// upload.single('avatar')：multer middleware，解析 multipart/form-data，
//   把上傳的圖片存到記憶體（req.file.buffer），檔案欄位名稱要是 'avatar'
router.post('/me/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: '請選擇圖片' })

    // 將記憶體中的圖片 Buffer 上傳到 Cloudinary，存到 staynest/avatars 資料夾
    const result = await uploadToCloudinary(req.file.buffer, 'staynest/avatars')

    // 更新資料庫的 avatar 欄位
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: result.secure_url },
      select: { id: true, name: true, email: true, avatar: true, isHost: true, role: true },
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 修改密碼 ───────────────────────────────────
// 需要先輸入舊密碼確認身份，才能設定新密碼
router.patch('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '請填寫目前密碼和新密碼' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: '新密碼至少需要 6 個字元' })
    }

    // 取出含密碼欄位的完整使用者資料（平常 select 都排除密碼）
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    // 驗證目前密碼是否正確
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return res.status(400).json({ message: '目前密碼不正確' })

    // 雜湊新密碼後存入資料庫
    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    })

    res.json({ message: '密碼已更新' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
