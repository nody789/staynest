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

  const allBookings = [...guestBookings, ...hostIncomingBookings]

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
