# TODO.md — 待開發功能清單

> 已完成的功能請見 `docs/PROGRESS.md`
> 最後更新：2026-06-17

---

## 優先度高

### Admin 後台管理系統

目前只有房東/房客角色，缺少平台管理員。

**需要做的事：**

- [ ] 資料庫：`User` 新增 `role` 欄位（`USER` / `HOST` / `ADMIN`）
- [ ] 後端：新增 `isAdmin` middleware（檢查 role === ADMIN）
- [ ] 後端：新增 `/api/admin/*` 路由群組
  - [ ] GET /admin/users — 查看所有使用者
  - [ ] PATCH /admin/users/:id — 停用/啟用帳號
  - [ ] GET /admin/listings — 查看所有房源
  - [ ] DELETE /admin/listings/:id — 強制下架房源
  - [ ] GET /admin/bookings — 查看所有訂單
  - [ ] DELETE /admin/reviews/:id — 刪除不當評論
  - [ ] GET /admin/stats — 儀表板統計數據
- [ ] 前端：新增 `/admin/*` 後台（獨立 Layout，與前台完全分開）
  - [ ] 登入頁（僅 admin 帳號可進入）
  - [ ] 儀表板（使用者數、房源數、訂單數、評論數）
  - [ ] 使用者管理頁
  - [ ] 房源管理頁
  - [ ] 訂單管理頁
  - [ ] 評論管理頁
- [ ] Seed 資料新增一筆 admin 帳號

---

## 優先度中

### 功能補強

- [ ] 訂房日期衝突檢查（後端驗證：新訂單的日期不得與已確認訂單重疊）
- [ ] 評論限制：只有實際完成入住的旅客才能留評（目前任何登入使用者都能留評）
- [ ] 房源列表分頁（目前是一次回傳所有資料，房源多了會慢）
- [ ] 圖片上傳：確認前端新增房源時的 Cloudinary 上傳流程是否正常
- [ ] 使用者頭像上傳（目前只能填入 URL，尚未串接 Cloudinary 上傳）

### 使用者體驗

- [ ] 訂房前顯示已被佔用的日期（Calendar 上標示不可選日期）
- [ ] 房源詳情頁地圖：點擊地圖 Marker 可跳至該房源
- [ ] 搜尋結果顯示地圖（目前地圖與列表分開，可考慮左右並排）
- [ ] Email 通知（訂房確認、房東審核通知）— 需串接 SendGrid 或 Resend

---

## 優先度低（未來考慮）

- [ ] 多語言支援（中英文切換）
- [ ] 金流串接（線上刷卡付訂金）— 參考 `docs/PAYMENT.md` 規格
- [ ] 房源評分統計（目前評論有 rating 但首頁列表沒有顯示平均分）
- [ ] 站內訊息系統（房東/房客可互傳訊息）
- [ ] Google / Facebook 社群登入
- [ ] SEO 優化（目前為純 CSR，考慮 Next.js SSR）
