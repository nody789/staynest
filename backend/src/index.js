// ─────────────────────────────────────────────
// Server 入口：啟動 Express Server
// app 的設定已移到 app.js，這裡只負責 listen
// ─────────────────────────────────────────────

import app from './app.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import express from 'express'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 5000

// 正式環境：同時服務前端靜態檔案
const frontendDist = join(__dirname, '../../frontend/dist')
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  app.use((req, res) => {
    res.sendFile(join(frontendDist, 'index.html'))
  })
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
