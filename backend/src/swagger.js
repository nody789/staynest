// ─────────────────────────────────────────────
// Swagger / OpenAPI 3.0 規格定義
// 描述 StayNest 所有 API 端點、請求格式、回應格式
// 掛載後可在 /api-docs 瀏覽互動式文件
// ─────────────────────────────────────────────

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'StayNest API',
    version: '1.0.0',
    description: `StayNest 全端房源租賃平台 API 文件

## 認證方式
需要登入的 API，請先呼叫 \`POST /auth/login\` 取得 token，
再點右上角 **Authorize 🔓** 按鈕，在 Value 欄位填入 token 值後按 Authorize。

## 測試示範流程
1. \`POST /auth/register\` 或 \`POST /auth/login\` 取得 token
2. 點 Authorize，貼上 token
3. 即可測試需要登入的 API
`,
  },
  servers: [
    { url: 'http://localhost:5000/api', description: '本地開發' },
  ],

  // ── 共用元件定義 ─────────────────────────────────────────
  components: {
    // 認證方式：HTTP Bearer Token（JWT）
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '登入後取得的 JWT token（7 天有效）',
      },
    },

    // 常用資料結構（可在 paths 用 $ref 引用，避免重複定義）
    schemas: {
      // 錯誤回應格式（幾乎所有失敗都回這個）
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: '錯誤描述' },
        },
      },

      // 使用者（select 過的安全欄位，不含 password）
      User: {
        type: 'object',
        properties: {
          id:     { type: 'string', example: 'clxyz123abc' },
          name:   { type: 'string', example: '王小明' },
          email:  { type: 'string', format: 'email', example: 'user@example.com' },
          avatar: { type: 'string', nullable: true, example: 'https://res.cloudinary.com/...' },
          isHost: { type: 'boolean', example: false },
          role:   { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
        },
      },

      // 房源
      Listing: {
        type: 'object',
        properties: {
          id:          { type: 'string' },
          title:       { type: 'string', example: '台北市精緻套房' },
          description: { type: 'string', example: '近捷運，交通便利，全新裝潢' },
          price:       { type: 'number', example: 2500, description: '每晚價格（TWD）' },
          location:    { type: 'string', example: '台北市大安區' },
          lat:         { type: 'number', example: 25.033 },
          lng:         { type: 'number', example: 121.565 },
          images:      { type: 'array', items: { type: 'string' }, example: ['https://res.cloudinary.com/...'] },
          maxGuests:   { type: 'integer', example: 4 },
          category:    { type: 'string', example: '公寓' },
          hostId:      { type: 'string' },
          createdAt:   { type: 'string', format: 'date-time' },
        },
      },

      // 訂單
      Booking: {
        type: 'object',
        properties: {
          id:         { type: 'string' },
          listingId:  { type: 'string' },
          guestId:    { type: 'string' },
          checkIn:    { type: 'string', format: 'date-time', example: '2025-08-10T00:00:00.000Z' },
          checkOut:   { type: 'string', format: 'date-time', example: '2025-08-15T00:00:00.000Z' },
          totalPrice: { type: 'number', example: 12500 },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
            example: 'PENDING',
            description: 'PENDING=待確認, CONFIRMED=已確認, CANCELLED=已取消',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // 評論
      Review: {
        type: 'object',
        properties: {
          id:        { type: 'string' },
          rating:    { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          comment:   { type: 'string', example: '非常棒的住宿體驗，房東超熱情！' },
          authorId:  { type: 'string' },
          listingId: { type: 'string' },
          author: {
            type: 'object',
            properties: {
              id:     { type: 'string' },
              name:   { type: 'string', example: '李小花' },
              avatar: { type: 'string', nullable: true },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },

  // ── API 路徑定義 ─────────────────────────────────────────
  paths: {

    // ── 系統 ──────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['系統'],
        summary: '健康檢查',
        description: '確認伺服器是否正常運作，可用於監控或 CI/CD 確認部署成功',
        responses: {
          200: {
            description: '伺服器正常',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', example: 'ok' } },
                },
              },
            },
          },
        },
      },
    },

    // ── 認證 ──────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['認證'],
        summary: '註冊新帳號',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name:     { type: 'string', example: '王小明' },
                  email:    { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: '註冊成功，回傳使用者資料與 JWT token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user:  { $ref: '#/components/schemas/User' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Email 已被使用',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['認證'],
        summary: '登入',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '登入成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user:  { $ref: '#/components/schemas/User' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Email 或密碼錯誤',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/auth/me': {
      get: {
        tags: ['認證'],
        summary: '取得當前登入使用者資料',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: '成功',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          401: {
            description: '未登入或 token 無效',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/auth/profile': {
      patch: {
        tags: ['認證'],
        summary: '更新個人資料（名稱、頭像、是否為房東）',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name:   { type: 'string', example: '新名字' },
                  avatar: { type: 'string', example: 'https://res.cloudinary.com/...' },
                  isHost: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '更新成功',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          401: {
            description: '未登入',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/auth/password': {
      patch: {
        tags: ['認證'],
        summary: '修改密碼',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'oldpassword' },
                  newPassword:     { type: 'string', minLength: 6, example: 'newpassword123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '密碼已更新',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string', example: '密碼已更新' } },
                },
              },
            },
          },
          400: {
            description: '目前密碼不正確，或新密碼長度不足',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          401: {
            description: '未登入',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/auth/me/avatar': {
      post: {
        tags: ['認證'],
        summary: '上傳頭像圖片到 Cloudinary',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: {
                  avatar: { type: 'string', format: 'binary', description: '圖片檔案' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '上傳成功，回傳更新後的使用者資料（含新頭像 URL）',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          400: {
            description: '未選擇圖片',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    // ── 房源 ──────────────────────────────────────────────
    '/listings': {
      get: {
        tags: ['房源'],
        summary: '取得房源列表（支援搜尋篩選與分頁）',
        parameters: [
          { name: 'location',  in: 'query', description: '地點關鍵字（模糊搜尋）', schema: { type: 'string' }, example: '台北' },
          { name: 'category',  in: 'query', description: '類型', schema: { type: 'string' }, example: '公寓' },
          { name: 'minPrice',  in: 'query', description: '最低每晚價格', schema: { type: 'number' }, example: 1000 },
          { name: 'maxPrice',  in: 'query', description: '最高每晚價格', schema: { type: 'number' }, example: 5000 },
          { name: 'guests',    in: 'query', description: '最少可容納人數', schema: { type: 'integer' }, example: 2 },
          { name: 'hostId',    in: 'query', description: '指定房東 ID（房東管理頁用）', schema: { type: 'string' } },
          { name: 'page',      in: 'query', description: '頁碼（預設 1）', schema: { type: 'integer', default: 1 } },
          { name: 'limit',     in: 'query', description: '每頁筆數（預設 12，最多 100）', schema: { type: 'integer', default: 12 } },
        ],
        responses: {
          200: {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    listings:   { type: 'array', items: { $ref: '#/components/schemas/Listing' } },
                    total:      { type: 'integer', example: 50, description: '符合條件的總筆數' },
                    page:       { type: 'integer', example: 1 },
                    totalPages: { type: 'integer', example: 5 },
                  },
                },
              },
            },
          },
        },
      },

      post: {
        tags: ['房源'],
        summary: '新增房源（需登入且 isHost = true）',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'price', 'location', 'maxGuests', 'category'],
                properties: {
                  title:       { type: 'string', example: '台北市精緻套房' },
                  description: { type: 'string', example: '近捷運，交通便利，全新裝潢' },
                  price:       { type: 'number', example: 2500 },
                  location:    { type: 'string', example: '台北市大安區' },
                  lat:         { type: 'number', example: 25.033 },
                  lng:         { type: 'number', example: 121.565 },
                  images:      { type: 'array', items: { type: 'string' }, example: ['https://res.cloudinary.com/...'] },
                  maxGuests:   { type: 'integer', example: 4 },
                  category:    { type: 'string', example: '公寓' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: '新增成功',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Listing' } } },
          },
          401: {
            description: '未登入',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/listings/images': {
      post: {
        tags: ['房源'],
        summary: '上傳房源圖片到 Cloudinary',
        description: '回傳圖片 URL，前端儲存後放入 images 陣列，再呼叫 POST /listings 新增房源',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '上傳成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { url: { type: 'string', example: 'https://res.cloudinary.com/...' } },
                },
              },
            },
          },
          400: {
            description: '未選擇圖片',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/listings/{id}': {
      get: {
        tags: ['房源'],
        summary: '取得單一房源詳情（含評論）',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: '房源 ID' }],
        responses: {
          200: {
            description: '成功',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Listing' } } },
          },
          404: {
            description: '找不到房源',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },

      put: {
        tags: ['房源'],
        summary: '編輯房源（限房東本人）',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title:       { type: 'string' },
                  description: { type: 'string' },
                  price:       { type: 'number' },
                  location:    { type: 'string' },
                  lat:         { type: 'number' },
                  lng:         { type: 'number' },
                  images:      { type: 'array', items: { type: 'string' } },
                  maxGuests:   { type: 'integer' },
                  category:    { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '更新成功',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Listing' } } },
          },
          403: {
            description: '無權限修改此房源',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: '找不到房源',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },

      delete: {
        tags: ['房源'],
        summary: '刪除房源（限房東本人）',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: '刪除成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string', example: '刪除成功' } },
                },
              },
            },
          },
          403: {
            description: '無權限刪除此房源',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: '找不到房源',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/listings/{id}/booked-dates': {
      get: {
        tags: ['房源'],
        summary: '取得某房源的已預訂日期區間',
        description: '前端用來在日期選擇器上標示「不可選」的已預訂期間，只回傳未來的 CONFIRMED 訂單',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: '房源 ID' }],
        responses: {
          200: {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      checkIn:  { type: 'string', format: 'date-time' },
                      checkOut: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── 評論（巢狀路由）────────────────────────────────────
    '/listings/{listingId}/reviews': {
      get: {
        tags: ['評論'],
        summary: '取得某房源的所有評論',
        parameters: [{ name: 'listingId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: '成功',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Review' } },
              },
            },
          },
        },
      },

      post: {
        tags: ['評論'],
        summary: '新增評論',
        description: '**限制：** 只有完成入住（CONFIRMED 且 checkOut 已過）的旅客才能留評，每人每個房源限留一次',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'listingId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rating', 'comment'],
                properties: {
                  rating:  { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                  comment: { type: 'string', example: '非常棒的住宿體驗！' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: '新增成功',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Review' } } },
          },
          403: {
            description: '未完成入住的旅客無法留評',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          409: {
            description: '已留過評論（一人一評）',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    // ── 訂房 ──────────────────────────────────────────────
    '/bookings': {
      get: {
        tags: ['訂房'],
        summary: '取得我的訂單（旅客視角，支援分頁）',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: '每頁筆數（最多 50）' },
        ],
        responses: {
          200: {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    bookings:   { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                    total:      { type: 'integer', example: 5 },
                    page:       { type: 'integer', example: 1 },
                    totalPages: { type: 'integer', example: 1 },
                  },
                },
              },
            },
          },
          401: {
            description: '未登入',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },

      post: {
        tags: ['訂房'],
        summary: '建立新訂單',
        description: '後端會自動檢查日期衝突，若該時段已有其他 CONFIRMED/PENDING 訂單會回傳 400',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['listingId', 'checkIn', 'checkOut', 'totalPrice'],
                properties: {
                  listingId:  { type: 'string', example: 'clxyz123abc' },
                  checkIn:    { type: 'string', format: 'date-time', example: '2025-08-10T00:00:00.000Z' },
                  checkOut:   { type: 'string', format: 'date-time', example: '2025-08-15T00:00:00.000Z' },
                  totalPrice: { type: 'number', example: 12500, description: '前端計算好的總價（天數 × 每晚價格）' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: '訂單建立成功，狀態預設為 PENDING',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } },
          },
          400: {
            description: '該日期已被預訂，日期衝突',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          401: {
            description: '未登入',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/bookings/host': {
      get: {
        tags: ['訂房'],
        summary: '取得我的房源收到的訂單（房東視角，支援分頁）',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: {
            description: '成功，含旅客基本資料',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    bookings:   { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                    total:      { type: 'integer', example: 3 },
                    page:       { type: 'integer', example: 1 },
                    totalPages: { type: 'integer', example: 1 },
                  },
                },
              },
            },
          },
          401: {
            description: '未登入',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/bookings/{id}': {
      put: {
        tags: ['訂房'],
        summary: '旅客取消訂單',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: '訂單 ID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['CANCELLED'], example: 'CANCELLED' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '更新成功',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } },
          },
          403: {
            description: '非本人訂單，無權限',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: '找不到訂單',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/bookings/{id}/host-action': {
      put: {
        tags: ['訂房'],
        summary: '房東確認或拒絕訂單',
        description: '房東可將訂單設為 CONFIRMED（確認）或 CANCELLED（拒絕）',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['CONFIRMED', 'CANCELLED'], example: 'CONFIRMED' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '更新成功',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } },
          },
          400: {
            description: '無效的狀態值',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          403: {
            description: '非此房源的房東，無權限',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: '找不到訂單',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    // ── 收藏 ──────────────────────────────────────────────
    '/favorites': {
      get: {
        tags: ['收藏'],
        summary: '取得我的收藏列表',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: '成功，回傳收藏的房源列表',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Listing' } },
              },
            },
          },
          401: {
            description: '未登入',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/favorites/{listingId}': {
      post: {
        tags: ['收藏'],
        summary: '收藏房源',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'listingId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          201: { description: '收藏成功' },
          401: {
            description: '未登入',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },

      delete: {
        tags: ['收藏'],
        summary: '取消收藏',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'listingId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: '已移除',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string', example: '已移除收藏' } },
                },
              },
            },
          },
          401: {
            description: '未登入',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
  },
}

export default swaggerSpec
