// ─────────────────────────────────────────────
// Cloudinary + multer 上傳工具
// ─────────────────────────────────────────────
// 流程：前端送 multipart/form-data → multer 攔截存到記憶體 → 上傳到 Cloudinary → 回傳圖片 URL
//
// 為什麼用 memoryStorage 而不是 diskStorage？
//   → 部署到 Render 這類雲端環境時沒有永久磁碟，存本機磁碟會丟失
//   → 直接存記憶體（Buffer）再送 Cloudinary 比較穩

import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// multer：只接受圖片，最大 5MB，存在記憶體
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('只接受圖片檔案'), false)
  },
})

// 將記憶體中的 Buffer 上傳到 Cloudinary
// 回傳 Promise<result>，result.secure_url 就是圖片的 HTTPS 網址
export const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ width: 800, quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => (error ? reject(error) : resolve(result))
    )
    stream.end(buffer)
  })
