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
import rateLimit from 'express-rate-limit'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { upload, uploadToCloudinary } from '../utils/upload.js'
import { requireFields, isValidEmail } from '../utils/validate.js'

// 登入限流：同一 IP 15 分鐘內最多嘗試 10 次，防止暴力破解
// skip：測試環境略過，避免跑測試時被自己擋住
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: '嘗試次數過多，請 15 分鐘後再試' },
  standardHeaders: true,
  legacyHeaders: false,
})

const router = Router()  // 建立子路由，最後 export 給 index.js 掛載

// ── 註冊 ──────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    // 驗證必填欄位
    const fieldError = requireFields(req.body, 'name', 'email', 'password')
    if (fieldError) return res.status(400).json({ message: fieldError })
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Email 格式不正確' })
    if (password.length < 6) return res.status(400).json({ message: '密碼至少需要 6 個字元' })

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
// loginLimiter：同一 IP 15 分鐘內最多 10 次，超過回傳 429
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body

    const fieldError = requireFields(req.body, 'email', 'password')
    if (fieldError) return res.status(400).json({ message: fieldError })

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

// ── Google OAuth ───────────────────────────────
// 【OAuth 2.0 流程說明】
// 1. 使用者點「Google 登入」→ 前端導到 /api/auth/google
// 2. 後端組出 Google 授權 URL → 瀏覽器跳到 Google 頁面
// 3. 使用者同意 → Google 把 code 帶回 /api/auth/google/callback
// 4. 後端用 code 換 access_token → 用 token 取得使用者資料
// 5. 查 DB 有無此使用者：有則登入，無則建立新帳號
// 6. 產生 JWT → redirect 到前端（帶上 token）
router.get('/google', (req, res) => {
  // 組出 Google OAuth 授權 URL
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile', // 要求取得 email 和基本個人資料
    access_type: 'offline',
  })
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

router.get('/google/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  try {
    const { code } = req.query
    if (!code) return res.redirect(`${frontendUrl}/login?error=oauth_failed`)

    // Step 1：用 code 換 access_token
    // 這是 OAuth 2.0 的「授權碼交換」步驟，code 只能用一次
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) return res.redirect(`${frontendUrl}/login?error=oauth_failed`)

    // Step 2：用 access_token 取得 Google 使用者資料
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileRes.json()

    // Step 3：查 DB 或建立使用者
    // 優先查 Google ID，其次查 email（處理已有本地帳號的情況）
    let user = await prisma.user.findFirst({
      where: { OR: [
        { provider: 'google', providerId: profile.id },
        { email: profile.email },
      ]},
    })

    if (!user) {
      // 第一次用 Google 登入：建立新帳號（無密碼）
      user = await prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          avatar: profile.picture,
          provider: 'google',
          providerId: profile.id,
        },
      })
    } else if (user.provider === 'local') {
      // 已有本地帳號，自動綁定 Google（下次可用 Google 登入）
      user = await prisma.user.update({
        where: { id: user.id },
        data: { provider: 'google', providerId: profile.id },
      })
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    // redirect 到前端的 /auth/callback，帶上 JWT token
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`)
  } catch (err) {
    res.redirect(`${frontendUrl}/login?error=oauth_failed`)
  }
})

// ── LINE OAuth ─────────────────────────────────
// LINE Login 流程與 Google 相同（標準 OAuth 2.0）
// 差異：LINE profile API 不一定提供 email（需申請 email permission）
router.get('/line', (req, res) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_CHANNEL_ID,
    redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/line/callback`,
    state: 'staynest_oauth', // 防 CSRF 用，正式環境建議用隨機值
    scope: 'profile openid email',
  })
  res.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params}`)
})

router.get('/line/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  try {
    const { code } = req.query
    if (!code) return res.redirect(`${frontendUrl}/login?error=oauth_failed`)

    // Step 1：用 code 換 access_token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/line/callback`,
        client_id: process.env.LINE_CHANNEL_ID,
        client_secret: process.env.LINE_CHANNEL_SECRET,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) return res.redirect(`${frontendUrl}/login?error=oauth_failed`)

    // Step 2：取得 LINE 使用者資料（displayName, userId, pictureUrl）
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileRes.json()

    // LINE email 需要額外申請，不一定有，用 placeholder 補足
    // id_token 裡有 email（若 scope 包含 openid email 且使用者同意）
    let email = null
    if (tokenData.id_token) {
      try {
        // id_token 是 JWT，不驗簽只取 payload（學習用途）
        const payload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString())
        email = payload.email || null
      } catch { /* ignore */ }
    }
    // 若 LINE 沒給 email，建立一個佔位 email（不對外顯示）
    if (!email) email = `line_${profile.userId}@noreply.staynest`

    // Step 3：查 DB 或建立使用者
    let user = await prisma.user.findFirst({
      where: { OR: [
        { provider: 'line', providerId: profile.userId },
        { email },
      ]},
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: profile.displayName,
          email,
          avatar: profile.pictureUrl || null,
          provider: 'line',
          providerId: profile.userId,
        },
      })
    } else if (user.provider === 'local') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { provider: 'line', providerId: profile.userId },
      })
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`)
  } catch (err) {
    res.redirect(`${frontendUrl}/login?error=oauth_failed`)
  }
})

// ── Facebook OAuth ──────────────────────────────
// Facebook 使用 OAuth 2.0，流程與 Google 相同
// 差異：需在 Meta for Developers 申請 app 並取得 App ID / App Secret
router.get('/facebook', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
    scope: 'email,public_profile',
    response_type: 'code',
  })
  res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`)
})

router.get('/facebook/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  try {
    const { code } = req.query
    if (!code) return res.redirect(`${frontendUrl}/login?error=oauth_failed`)

    // Step 1：用 code 換 access_token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
        code,
      })
    )
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) return res.redirect(`${frontendUrl}/login?error=oauth_failed`)

    // Step 2：用 access_token 取得 Facebook 使用者資料（id, name, email, picture）
    const profileRes = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
    )
    const profile = await profileRes.json()

    // Facebook 不一定提供 email（使用者可拒絕授權），用 placeholder 補足
    const email = profile.email || `fb_${profile.id}@noreply.staynest`

    // Step 3：查 DB 或建立使用者
    let user = await prisma.user.findFirst({
      where: { OR: [
        { provider: 'facebook', providerId: profile.id },
        { email },
      ]},
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: profile.name,
          email,
          avatar: profile.picture?.data?.url || null,
          provider: 'facebook',
          providerId: profile.id,
        },
      })
    } else if (user.provider === 'local') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { provider: 'facebook', providerId: profile.id },
      })
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`)
  } catch (err) {
    res.redirect(`${frontendUrl}/login?error=oauth_failed`)
  }
})

export default router
