// 新增示範訂單腳本（不清除現有資料）
// 執行：node src/add-demo-bookings.js（在 backend/ 目錄下）

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

const pastDate  = (days) => new Date(Date.now() - days * 86400000)
const futureDate = (days) => new Date(Date.now() + days * 86400000)

async function main() {
  // 查詢既有帳號
  const guest  = await prisma.user.findUnique({ where: { email: 'guest@demo.com' } })
  const guest2 = await prisma.user.findUnique({ where: { email: 'guest2@demo.com' } })
  const guest3 = await prisma.user.findUnique({ where: { email: 'guest3@demo.com' } })
  const host   = await prisma.user.findUnique({ where: { email: 'host@demo.com' } })
  const host2  = await prisma.user.findUnique({ where: { email: 'host2@demo.com' } })

  if (!guest || !host) {
    console.error('❌ 找不到 guest@demo.com 或 host@demo.com，請先執行 npm run seed')
    process.exit(1)
  }

  // 取得 host 和 host2 的房源（各取前 3 筆）
  const hostListings  = await prisma.listing.findMany({ where: { hostId: host.id },  take: 3 })
  const host2Listings = await prisma.listing.findMany({ where: { hostId: host2.id }, take: 3 })

  if (hostListings.length === 0) {
    console.error('❌ 找不到房源，請先執行 npm run seed')
    process.exit(1)
  }

  // ── 房客角度：guest@demo.com 的訂單 ──────────────────
  // 選 host2 的房源（host 自己的房源 guest 可能已有訂單）
  const targetListings = host2Listings.length >= 3 ? host2Listings : hostListings

  const guestBookings = [
    {
      guestId: guest.id,
      listingId: targetListings[0].id,
      checkIn:  pastDate(60),
      checkOut: pastDate(57),
      totalPrice: targetListings[0].price * 3,
      status: 'CONFIRMED',   // 已完成入住
    },
    {
      guestId: guest.id,
      listingId: targetListings[1 % targetListings.length].id,
      checkIn:  pastDate(15),
      checkOut: pastDate(13),
      totalPrice: targetListings[1 % targetListings.length].price * 2,
      status: 'CONFIRMED',   // 剛入住完
    },
    {
      guestId: guest.id,
      listingId: targetListings[2 % targetListings.length].id,
      checkIn:  futureDate(10),
      checkOut: futureDate(13),
      totalPrice: targetListings[2 % targetListings.length].price * 3,
      status: 'CONFIRMED',   // 已確認的未來訂單
    },
    {
      guestId: guest.id,
      listingId: hostListings[0].id,
      checkIn:  futureDate(25),
      checkOut: futureDate(27),
      totalPrice: hostListings[0].price * 2,
      status: 'PENDING',    // 等待房東確認
    },
    {
      guestId: guest.id,
      listingId: hostListings[1 % hostListings.length].id,
      checkIn:  pastDate(90),
      checkOut: pastDate(88),
      totalPrice: hostListings[1 % hostListings.length].price * 2,
      status: 'CANCELLED',  // 已取消的歷史訂單
    },
  ]

  // ── 房東角度：host@demo.com 房源收到的訂單 ───────────
  // 由 guest2 / guest3 向 host 的房源下訂
  const hostIncomingBookings = guest2 && guest3 ? [
    {
      guestId: guest2.id,
      listingId: hostListings[0].id,
      checkIn:  futureDate(5),
      checkOut: futureDate(8),
      totalPrice: hostListings[0].price * 3,
      status: 'PENDING',    // 待房東確認
    },
    {
      guestId: guest3.id,
      listingId: hostListings[0].id,
      checkIn:  futureDate(15),
      checkOut: futureDate(18),
      totalPrice: hostListings[0].price * 3,
      status: 'PENDING',    // 待房東確認
    },
    {
      guestId: guest2.id,
      listingId: hostListings[1 % hostListings.length].id,
      checkIn:  pastDate(30),
      checkOut: pastDate(27),
      totalPrice: hostListings[1 % hostListings.length].price * 3,
      status: 'CONFIRMED',  // 已確認的歷史訂單
    },
    {
      guestId: guest3.id,
      listingId: hostListings[1 % hostListings.length].id,
      checkIn:  pastDate(10),
      checkOut: pastDate(8),
      totalPrice: hostListings[1 % hostListings.length].price * 2,
      status: 'CONFIRMED',
    },
    {
      guestId: guest2.id,
      listingId: hostListings[2 % hostListings.length].id,
      checkIn:  futureDate(40),
      checkOut: futureDate(43),
      totalPrice: hostListings[2 % hostListings.length].price * 3,
      status: 'CANCELLED',  // 旅客取消的訂單
    },
  ] : []

  // ── 9 月 / 10 月固定日期訂單（示範日期衝突驗證）─────────
  // 針對熱門房源，塞滿大量訂單讓日曆看起來幾乎被訂滿
  const d = (str) => new Date(str)   // 固定日期快捷

  const popular = [
    { id: 'be96aa3c-50d3-4d0f-8d5e-d89b2441ac6a', price: 3800 }, // 信義區現代設計公寓
    { id: 'e1ee9504-0eb7-41da-884a-38419b8f6a77', price: 3500 }, // 九份山城雨霧茶樓
    { id: '682aeb07-7b18-4ff8-942a-17e386186e86', price: 5500 }, // 墾丁南灣海景獨棟別墅
    { id: 'a86c3e9c-7ca2-4d89-b524-90ea8af3ee48', price: 3900 }, // 花蓮七星潭海岸套房
    { id: '1ca112a2-a5ff-498e-a301-2820ec0248be', price: 4500 }, // 北投百年溫泉旅館
  ]

  const guests = [
    guest?.id,
    guest2?.id,
    guest3?.id,
    (await prisma.user.findUnique({ where: { email: 'guest4@demo.com' } }))?.id,
    (await prisma.user.findUnique({ where: { email: 'guest5@demo.com' } }))?.id,
  ].filter(Boolean)

  // 每筆：[listingIndex, guestIndex, checkIn, checkOut, status]
  const fixedBookings = [
    // ── 信義區現代設計公寓 ──
    [0, 0, '2026-09-01', '2026-09-04', 'CONFIRMED'],
    [0, 1, '2026-09-06', '2026-09-09', 'CONFIRMED'],
    [0, 2, '2026-09-12', '2026-09-16', 'CONFIRMED'],
    [0, 3, '2026-09-19', '2026-09-22', 'PENDING'],
    [0, 4, '2026-09-25', '2026-09-28', 'CONFIRMED'],
    [0, 0, '2026-10-02', '2026-10-06', 'CONFIRMED'],
    [0, 1, '2026-10-09', '2026-10-13', 'CONFIRMED'],
    [0, 2, '2026-10-16', '2026-10-20', 'PENDING'],
    [0, 3, '2026-10-23', '2026-10-27', 'CONFIRMED'],

    // ── 九份山城雨霧茶樓 ──
    [1, 1, '2026-09-03', '2026-09-06', 'CONFIRMED'],
    [1, 2, '2026-09-08', '2026-09-12', 'CONFIRMED'],
    [1, 3, '2026-09-15', '2026-09-18', 'PENDING'],
    [1, 4, '2026-09-21', '2026-09-25', 'CONFIRMED'],
    [1, 0, '2026-10-01', '2026-10-05', 'CONFIRMED'],
    [1, 1, '2026-10-08', '2026-10-11', 'CONFIRMED'],
    [1, 2, '2026-10-14', '2026-10-18', 'PENDING'],
    [1, 3, '2026-10-21', '2026-10-25', 'CONFIRMED'],

    // ── 墾丁南灣海景獨棟別墅 ──
    [2, 2, '2026-09-04', '2026-09-08', 'CONFIRMED'],
    [2, 3, '2026-09-11', '2026-09-15', 'CONFIRMED'],
    [2, 4, '2026-09-18', '2026-09-22', 'CONFIRMED'],
    [2, 0, '2026-09-26', '2026-09-30', 'PENDING'],
    [2, 1, '2026-10-03', '2026-10-07', 'CONFIRMED'],
    [2, 2, '2026-10-10', '2026-10-14', 'CONFIRMED'],
    [2, 3, '2026-10-18', '2026-10-22', 'CONFIRMED'],
    [2, 4, '2026-10-25', '2026-10-29', 'PENDING'],

    // ── 花蓮七星潭海岸套房 ──
    [3, 3, '2026-09-02', '2026-09-05', 'CONFIRMED'],
    [3, 4, '2026-09-07', '2026-09-10', 'CONFIRMED'],
    [3, 0, '2026-09-13', '2026-09-17', 'CONFIRMED'],
    [3, 1, '2026-09-20', '2026-09-24', 'PENDING'],
    [3, 2, '2026-10-02', '2026-10-06', 'CONFIRMED'],
    [3, 3, '2026-10-09', '2026-10-13', 'CONFIRMED'],
    [3, 4, '2026-10-17', '2026-10-21', 'CONFIRMED'],
    [3, 0, '2026-10-24', '2026-10-28', 'PENDING'],

    // ── 北投百年溫泉旅館 ──
    [4, 4, '2026-09-05', '2026-09-09', 'CONFIRMED'],
    [4, 0, '2026-09-12', '2026-09-16', 'CONFIRMED'],
    [4, 1, '2026-09-19', '2026-09-23', 'CONFIRMED'],
    [4, 2, '2026-09-26', '2026-09-29', 'PENDING'],
    [4, 3, '2026-10-04', '2026-10-08', 'CONFIRMED'],
    [4, 4, '2026-10-11', '2026-10-15', 'CONFIRMED'],
    [4, 0, '2026-10-19', '2026-10-23', 'CONFIRMED'],
    [4, 1, '2026-10-26', '2026-10-30', 'PENDING'],
  ].map(([li, gi, checkIn, checkOut, status]) => ({
    guestId: guests[gi % guests.length],
    listingId: popular[li].id,
    checkIn: d(checkIn),
    checkOut: d(checkOut),
    totalPrice: popular[li].price * (new Date(checkOut) - new Date(checkIn)) / 86400000,
    status,
  }))

  const allBookings = [...guestBookings, ...hostIncomingBookings, ...fixedBookings]

  let count = 0
  for (const data of allBookings) {
    // 檢查日期是否與現有訂單衝突，衝突就跳過
    const conflict = await prisma.booking.findFirst({
      where: {
        listingId: data.listingId,
        status: { not: 'CANCELLED' },
        checkIn:  { lte: data.checkOut },
        checkOut: { gte: data.checkIn },
      },
    })
    if (conflict) {
      console.log(`⚠️  跳過（日期衝突）：listingId ${data.listingId}`)
      continue
    }
    await prisma.booking.create({ data })
    count++
  }

  console.log(`✅ 成功新增 ${count} 筆示範訂單`)
  console.log('   房客訂單（guest@demo.com）：含已確認、待確認、已取消各狀態')
  console.log('   房東收到的訂單（host@demo.com）：含待確認、已確認、已取消各狀態')
}

main()
  .catch((e) => { console.error('❌ 失敗：', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
