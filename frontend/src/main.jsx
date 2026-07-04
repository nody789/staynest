// ─────────────────────────────────────────────
// 前端入口檔案
// React 從這裡把整個 App 渲染到 index.html 的 <div id="root"> 裡
// ─────────────────────────────────────────────

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'        // 提供路由功能
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'  // 提供 API 快取
import { Provider } from 'react-redux'                  // Redux：讓整個 App 可以存取 store
import store from './store'                             // Redux store（我們定義的全域狀態倉庫）
import './index.css'
import App from './App.jsx'

// QueryClient 是 React Query 的核心，負責管理所有 API 請求的快取
const queryClient = new QueryClient()

// 【Provider 是什麼？】
// React Redux 用 Context 把 store 傳給所有子元件
// 只要元件在 <Provider> 裡面，就可以用 useSelector 和 useDispatch 取用 store
//
// 對比 Zustand：Zustand 不需要 Provider，直接 import useAuthStore 就能用
// Redux 需要 Provider 是因為它用的是 React Context 機制
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Provider：把 Redux store 注入整個 App */}
    <Provider store={store}>
      {/* BrowserRouter：讓整個 App 可以使用 useNavigate、Link 等路由功能 */}
      <BrowserRouter>
        {/* QueryClientProvider：讓整個 App 可以使用 useQuery、useMutation */}
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
