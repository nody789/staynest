// ─────────────────────────────────────────────
// 假資料腳本（Seed Script）
// 執行：npm run seed（在 backend/ 目錄下）
// 注意：每次執行會先清除現有資料再重新建立
// ─────────────────────────────────────────────

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 開始填入示範資料...\n')

  await prisma.review.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.user.deleteMany()
  console.log('🗑️  已清除舊資料')

  const hashedPassword = await bcrypt.hash('demo1234', 10)

  const host = await prisma.user.create({
    data: {
      name: '陳大明',
      email: 'host@demo.com',
      password: hashedPassword,
      isHost: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
    },
  })

  const host2 = await prisma.user.create({
    data: {
      name: '王建宏',
      email: 'host2@demo.com',
      password: hashedPassword,
      isHost: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
    },
  })

  const guest = await prisma.user.create({
    data: {
      name: '林小美',
      email: 'guest@demo.com',
      password: hashedPassword,
      isHost: false,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c38b?w=150&auto=format&fit=crop',
    },
  })

  console.log('👤 已建立帳號：')
  console.log('   host@demo.com / demo1234（房東）')
  console.log('   host2@demo.com / demo1234（房東 2）')
  console.log('   guest@demo.com / demo1234（旅客）')

  const listingsData = [
    // ── 城市（4筆）──────────────────────────────
    {
      title: '信義區現代設計公寓',
      description: '位於台北最繁華的信義商圈，步行即可抵達101大樓和各大百貨。公寓採現代北歐風格設計，配備全套廚房設備、高速網路和智慧家電。適合商務出差或城市觀光的旅客。',
      price: 3800, location: '台北市信義區', lat: 25.0338, lng: 121.5645,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
      ],
      maxGuests: 3, category: '城市', hostId: host.id,
    },
    {
      title: '台南古都百年老宅',
      description: '改建自清代古厝的文創民宿，保留百年紅磚和木雕工藝，融入現代舒適設施。位於台南中西區文化古蹟密集區，步行即可拜訪赤嵌樓、祀典武廟等歷史景點。早餐供應道地台南碗粿和虱目魚粥。',
      price: 2600, location: '台南市中西區', lat: 22.9936, lng: 120.1877,
      images: [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop',
      ],
      maxGuests: 3, category: '城市', hostId: host.id,
    },
    {
      title: '大安區文青咖啡公寓',
      description: '藏在台北大安區巷弄裡的迷人公寓，樓下就是精品咖啡館和獨立書店。步行5分鐘到捷運大安站，周邊有台灣大學、師大夜市。室內保留老屋木質地板，搭配現代家具，充滿文藝氣息。',
      price: 2900, location: '台北市大安區', lat: 25.0269, lng: 121.5336,
      images: [
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop',
      ],
      maxGuests: 2, category: '城市', hostId: host2.id,
    },
    {
      title: '高雄左營捷運景觀套房',
      description: '鄰近高雄左營高鐵站的現代套房，15分鐘車程即達西子灣和駁二藝術特區。房間視野開闊可俯瞰左營蓮池潭，備有獨立廚房和洗衣機。是探索高雄的絕佳住宿基地。',
      price: 2400, location: '高雄市左營區', lat: 22.6858, lng: 120.3053,
      images: [
        'https://images.unsplash.com/photo-1486304873000-235643847519?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&auto=format&fit=crop',
      ],
      maxGuests: 3, category: '城市', hostId: host2.id,
    },

    // ── 海邊（4筆）──────────────────────────────
    {
      title: '墾丁南灣海景獨棟別墅',
      description: '俯瞰南灣湛藍海景的私人別墅，距離沙灘步行只需3分鐘。備有寬敞的戶外露台和泳池，是家庭旅遊或朋友聚會的首選。清晨可欣賞日出，夜晚享受星空。',
      price: 5500, location: '屏東縣恆春鎮', lat: 21.9389, lng: 120.8422,
      images: [
        'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop',
      ],
      maxGuests: 8, category: '海邊', hostId: host.id,
    },
    {
      title: '花蓮七星潭海岸套房',
      description: '緊鄰七星潭月牙形礫石海灘，從房間推窗即見太平洋壯闊海景。清晨可沿著海岸線慢跑，欣賞太陽從中央山脈升起的絕美景色。周邊有太魯閣國家公園。',
      price: 3900, location: '花蓮縣新城鄉', lat: 24.0073, lng: 121.6137,
      images: [
        'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&auto=format&fit=crop',
      ],
      maxGuests: 2, category: '海邊', hostId: host.id,
    },
    {
      title: '台東成功鎮漁港海景民宿',
      description: '位於台東成功鎮的靜謐海景民宿，窗外就是成功漁港和太平洋。每天清晨可在港邊看漁船出海，傍晚欣賞壯麗落日。附近有三仙台、石雨傘等奇特地景，是台東秘境旅遊的最佳基地。',
      price: 2800, location: '台東縣成功鎮', lat: 23.1024, lng: 121.3729,
      images: [
        'https://images.unsplash.com/photo-1439130490301-25e322d88054?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1505459668311-8dfac7952bf0?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&auto=format&fit=crop',
      ],
      maxGuests: 4, category: '海邊', hostId: host2.id,
    },
    {
      title: '宜蘭南方澳漁村海灣小屋',
      description: '坐落在宜蘭南方澳漁港旁的溫馨小屋，三面環山一面向海，地形天然屏蔽風浪。可在漁市場選購新鮮海產，步行到附近餐廳請老闆代為料理。早起看魚市拍賣是難得的生活體驗。',
      price: 2200, location: '宜蘭縣蘇澳鎮', lat: 24.5917, lng: 121.8625,
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571003123771-bd6a099b3dae?w=800&auto=format&fit=crop',
      ],
      maxGuests: 4, category: '海邊', hostId: host2.id,
    },

    // ── 山區（4筆）──────────────────────────────
    {
      title: '阿里山雲霧山林木屋',
      description: '隱身阿里山森林中的溫馨木屋，海拔約1500公尺，終年雲霧繚繞。清晨步行即可抵達觀日出平台，晚上躺在床上就能聽見蟲鳴鳥叫。備有火爐和厚棉被。',
      price: 2800, location: '嘉義縣阿里山鄉', lat: 23.5137, lng: 120.8037,
      images: [
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=800&auto=format&fit=crop',
      ],
      maxGuests: 4, category: '山區', hostId: host.id,
    },
    {
      title: '九份山城雨霧茶樓',
      description: '仿《神隱少女》場景的九份山城民宿，夜晚點燈後如夢似幻。坐在木造陽台上，一邊品茗一邊俯瞰基隆港和山城燈火，是最具台灣特色的旅宿體驗。',
      price: 3500, location: '新北市瑞芳區', lat: 25.1095, lng: 121.8448,
      images: [
        'https://images.unsplash.com/photo-1538932936090-6cec5a03a571?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519181245277-cffeb31da948?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1526285759904-71d1170ed2e8?w=800&auto=format&fit=crop',
      ],
      maxGuests: 2, category: '山區', hostId: host.id,
    },
    {
      title: '武陵農場蘋果山莊',
      description: '位於海拔1750公尺的武陵農場內，春天賞櫻、夏天避暑、秋天採蘋果、冬天賞雪，四季各有風情。清晨在農場散步，和梅花鹿、台灣獼猴不期而遇。是離台北最近的高山農場體驗。',
      price: 3200, location: '台中市和平區', lat: 24.3647, lng: 121.2906,
      images: [
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop',
      ],
      maxGuests: 5, category: '山區', hostId: host2.id,
    },
    {
      title: '太平山雲海景觀民宿',
      description: '海拔2000公尺的太平山頂，每日清晨雲海翻騰如夢境。民宿提供望遠鏡供觀星，以及太平山特有的霧淞景觀。鄰近翠峰湖，晚秋可欣賞全台灣最大的高山湖泊落葉景色。',
      price: 3600, location: '宜蘭縣大同鄉', lat: 24.4788, lng: 121.4582,
      images: [
        'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&auto=format&fit=crop',
      ],
      maxGuests: 3, category: '山區', hostId: host2.id,
    },

    // ── 溫泉（4筆）──────────────────────────────
    {
      title: '北投百年溫泉旅館',
      description: '座落在北投溪畔的傳統溫泉旅館，擁有百年歷史建築。提供私人湯屋和戶外露天溫泉池，泉質為全台罕見的北投石放射能泉。享用完溫泉後可漫步參觀北投溫泉博物館。',
      price: 4500, location: '台北市北投區', lat: 25.1281, lng: 121.5053,
      images: [
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop',
      ],
      maxGuests: 2, category: '溫泉', hostId: host.id,
    },
    {
      title: '礁溪溫泉景觀飯店',
      description: '宜蘭礁溪平地溫泉最具代表性的住宿，房內附設湯池，24小時皆可浸泡。泉質為碳酸氫鈉泉，滑順如絲，有「美人湯」之稱。距宜蘭市區僅15分鐘，可輕鬆前往羅東夜市。',
      price: 3800, location: '宜蘭縣礁溪鄉', lat: 24.8213, lng: 121.7754,
      images: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1561051460-c3e4b3cac972?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1580977276076-ae4b8c219b8e?w=800&auto=format&fit=crop',
      ],
      maxGuests: 2, category: '溫泉', hostId: host.id,
    },
    {
      title: '谷關溫泉山景民宿',
      description: '台中谷關溫泉峽谷間的精緻民宿，被中央山脈環抱，溪流潺潺聲入睡。碳酸鈣泉質溫和適合全家大小，附設戶外泡腳池。附近有八仙山森林遊樂區，適合健行賞鳥。',
      price: 3200, location: '台中市和平區', lat: 24.1817, lng: 120.9847,
      images: [
        'https://images.unsplash.com/photo-1588867702719-969c8ac446f0?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop',
      ],
      maxGuests: 4, category: '溫泉', hostId: host2.id,
    },
    {
      title: '烏來原住民風格溫泉屋',
      description: '融合泰雅族文化元素的溫泉民宿，木造建築搭配原住民圖騰裝飾。溫泉水來自南勢溪，泉質為碳酸氫鈉泉。可安排原住民風味餐、泰雅織布體驗，感受台灣原住民文化之美。',
      price: 4200, location: '新北市烏來區', lat: 24.8638, lng: 121.5484,
      images: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&auto=format&fit=crop',
      ],
      maxGuests: 3, category: '溫泉', hostId: host2.id,
    },

    // ── 島嶼（4筆）──────────────────────────────
    {
      title: '澎湖小離島珊瑚礁民宿',
      description: '坐落在澎湖群島中一座寧靜小島上，四周被清澈的珊瑚礁海洋環繞。可從這裡出發浮潛、乘船探索周邊無人島，體驗最純粹的島嶼生活。',
      price: 3200, location: '澎湖縣馬公市', lat: 23.5700, lng: 119.5793,
      images: [
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop',
      ],
      maxGuests: 4, category: '島嶼', hostId: host.id,
    },
    {
      title: '綠島潛水民宿',
      description: '全台最著名的潛水勝地，民宿老闆本身是持照潛水教練。房間距離潛水點步行僅3分鐘，可安排夜潛看睡眠的魚群。綠島海水透明度高達30公尺，珊瑚礁和熱帶魚種類豐富。',
      price: 2800, location: '台東縣綠島鄉', lat: 22.6618, lng: 121.4935,
      images: [
        'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560275619-4cc5fa59d3ae?w=800&auto=format&fit=crop',
      ],
      maxGuests: 3, category: '島嶼', hostId: host.id,
    },
    {
      title: '蘭嶼達悟族文化民宿',
      description: '由達悟族人經營的特色民宿，體驗台灣最後的原始島嶼文化。可參加拼板舟文化解說、品嚐飛魚干等傳統食物。蘭嶼幾乎沒有任何人工開發，夜晚只有銀河和螢火蟲。',
      price: 3500, location: '台東縣蘭嶼鄉', lat: 22.0333, lng: 121.5500,
      images: [
        'https://images.unsplash.com/photo-1516789776168-a1f6d8e3a7dd?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1535262412227-85541e910204?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1586375300773-8384e3e4916f?w=800&auto=format&fit=crop',
      ],
      maxGuests: 4, category: '島嶼', hostId: host2.id,
    },
    {
      title: '小琉球海龜共游民宿',
      description: '屏東小琉球是全台最容易與野生海龜相遇的地方。民宿提供浮潛裝備，每天早上帶你去海龜出沒的海域，近距離觀察台灣最大的海龜族群。島上沒有紅綠燈，騎電動車逛島是最悠閒的方式。',
      price: 2500, location: '屏東縣琉球鄉', lat: 22.3436, lng: 120.3725,
      images: [
        'https://images.unsplash.com/photo-1517627043994-b991abb62fc8?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1490077476659-095159692ab5?w=800&auto=format&fit=crop',
      ],
      maxGuests: 4, category: '島嶼', hostId: host2.id,
    },

    // ── 露營（4筆）──────────────────────────────
    {
      title: '合歡山高山星空露營地',
      description: '海拔3000公尺的合歡山星空露營，遠離城市光害，銀河觸手可及。提供豪華露營裝備（Glamping），無需自備帳篷，附贈早餐和熱飲。冬季有機會體驗台灣難得一見的雪景。',
      price: 2200, location: '南投縣仁愛鄉', lat: 24.1452, lng: 121.2782,
      images: [
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1478827387698-1527781a4887?w=800&auto=format&fit=crop',
      ],
      maxGuests: 2, category: '露營', hostId: host.id,
    },
    {
      title: '福壽山農場豪華露營',
      description: '台中梨山福壽山農場海拔2000公尺的高級帳篷露營，備有木質地板、真正的床和電熱毯。白天可採蘋果、梨子和水蜜桃，晚上坐在帳篷外賞月。農場新鮮果汁和果醬是最棒的早餐。',
      price: 3000, location: '台中市和平區', lat: 24.2633, lng: 121.2342,
      images: [
        'https://images.unsplash.com/photo-1563299796-17596ed6b017?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?w=800&auto=format&fit=crop',
      ],
      maxGuests: 4, category: '露營', hostId: host.id,
    },
    {
      title: '太魯閣溪谷生態露營',
      description: '太魯閣國家公園核心區域的特許露營地，天祥溪流聲入眠。有解說員帶領夜間生態觀察，可見到台灣黑熊爪痕和各種珍稀鳥類。清晨在立霧溪畔煮咖啡，享受世界級峽谷美景。',
      price: 2600, location: '花蓮縣秀林鄉', lat: 24.1576, lng: 121.5106,
      images: [
        'https://images.unsplash.com/photo-1525811902-f2342640856e?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=800&auto=format&fit=crop',
      ],
      maxGuests: 3, category: '露營', hostId: host2.id,
    },
    {
      title: '墾丁南端沙灘露營地',
      description: '墾丁國家公園最南端的私人沙灘露營地，帳篷直接搭在白沙灘上，夜晚聽著太平洋的浪聲入睡。提供衝浪板和浮潛裝備租借。夏季夜晚可看到螢火蟲和甲殼類爬上沙灘產卵的自然奇觀。',
      price: 1800, location: '屏東縣恆春鎮', lat: 21.8969, lng: 120.8614,
      images: [
        'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800&auto=format&fit=crop',
      ],
      maxGuests: 5, category: '露營', hostId: host2.id,
    },

    // ── 鄉村（4筆）──────────────────────────────
    {
      title: '苗栗客家田園農莊',
      description: '坐落在苗栗三義丘陵地帶的客家農莊，四周是梯田和竹林。可體驗採摘有機蔬菜、製作客家傳統麻糬，並享用農莊自己種植的食材烹調的早餐。適合親子旅遊。',
      price: 1900, location: '苗栗縣三義鄉', lat: 24.3869, lng: 120.7574,
      images: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&auto=format&fit=crop',
      ],
      maxGuests: 6, category: '鄉村', hostId: host.id,
    },
    {
      title: '池上伯朗大道稻田民宿',
      description: '台東池上著名的伯朗大道旁的稻田景觀民宿，被金黃稻浪環繞。每天早晨騎腳踏車穿越稻田，感受台灣農村的寧靜之美。秋季稻穗飽滿時節是最美的季節，常有攝影師在此取景。',
      price: 2300, location: '台東縣池上鄉', lat: 23.1093, lng: 121.2157,
      images: [
        'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1499916078039-922301b0eb9b?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1468218457742-ee7f8ec4b8f9?w=800&auto=format&fit=crop',
      ],
      maxGuests: 4, category: '鄉村', hostId: host.id,
    },
    {
      title: '埔里蝴蝶谷有機農場',
      description: '南投埔里的有機香草農場，農場內種植薰衣草、玫瑰和各種香草植物。可體驗製作精油皂、香草茶和花束。每年春天農場附近有大批紫斑蝶過境，蝴蝶數量多達萬隻，景象壯觀。',
      price: 2100, location: '南投縣埔里鎮', lat: 23.9627, lng: 120.9751,
      images: [
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop',
      ],
      maxGuests: 5, category: '鄉村', hostId: host2.id,
    },
    {
      title: '鹿港彰化古厝庭院民宿',
      description: '改建自百年合院古厝的特色民宿，保留傳統閩南建築的燕尾屋脊和院落格局。距離鹿港老街步行5分鐘，可品嚐鳳眼糕、蚵仔煎等傳統小吃。週末有廟會和傳統技藝表演，文化體驗豐富。',
      price: 1800, location: '彰化縣鹿港鎮', lat: 24.0573, lng: 120.4342,
      images: [
        'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop',
      ],
      maxGuests: 4, category: '鄉村', hostId: host2.id,
    },
  ]

  const listings = []
  for (const data of listingsData) {
    const listing = await prisma.listing.create({ data })
    listings.push(listing)
  }
  console.log(`🏠 已建立 ${listings.length} 筆房源（7 個分類，每類 4 筆）`)

  // ── 評論 ──────────────────────────────────────
  const reviewComments = [
    { rating: 5, comment: '非常棒的體驗！環境乾淨，房東親切，強烈推薦！' },
    { rating: 4, comment: '整體很滿意，地點方便，設備齊全。下次還會再來。' },
    { rating: 5, comment: '超出預期的住宿！景色美不勝收，早餐也很豐盛。' },
    { rating: 4, comment: '性價比高，適合家庭旅遊。唯一小缺點是停車稍不便。' },
    { rating: 5, comment: '夢幻般的住宿體驗，已經開始計劃下次再來了！' },
    { rating: 3, comment: '環境不錯，但設備有些老舊，希望能翻新一下。' },
    { rating: 5, comment: '房東超熱心，提供了很多在地旅遊建議，玩得很盡興！' },
    { rating: 4, comment: '安靜舒適，是放鬆身心的好地方，很快就訂了下次。' },
  ]

  let reviewCount = 0
  for (let i = 0; i < listings.length; i++) {
    const numReviews = (i % 3) + 1
    for (let j = 0; j < numReviews; j++) {
      const comment = reviewComments[(i + j) % reviewComments.length]
      await prisma.review.create({
        data: { ...comment, authorId: guest.id, listingId: listings[i].id },
      })
      reviewCount++
    }
  }
  console.log(`⭐ 已建立 ${reviewCount} 筆評論`)

  // ── 訂單 ──────────────────────────────────────
  const today = new Date()
  const futureDate = (days) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

  await prisma.booking.createMany({
    data: [
      { guestId: guest.id, listingId: listings[0].id, checkIn: futureDate(7), checkOut: futureDate(10), totalPrice: listings[0].price * 3, status: 'CONFIRMED' },
      { guestId: guest.id, listingId: listings[4].id, checkIn: futureDate(20), checkOut: futureDate(23), totalPrice: listings[4].price * 3, status: 'PENDING' },
      { guestId: guest.id, listingId: listings[8].id, checkIn: futureDate(35), checkOut: futureDate(37), totalPrice: listings[8].price * 2, status: 'PENDING' },
    ],
  })
  console.log('📅 已建立 3 筆訂單')

  console.log('\n✅ 示範資料建立完成！')
  console.log('────────────────────────────────────')
  console.log('  host@demo.com  / demo1234（房東）')
  console.log('  host2@demo.com / demo1234（房東 2）')
  console.log('  guest@demo.com / demo1234（旅客）')
  console.log('────────────────────────────────────')
}

main()
  .catch((e) => { console.error('❌ 建立失敗：', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
