import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

// 保護 /admin/* 路由：未登入 → /admin/login，非 ADMIN → /admin/login
function AdminRoute() {
  // useSelector：從 Redux store 讀取 user，只有 user 改變時此元件才重新渲染
  const user = useSelector(state => state.auth.user)

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}

export default AdminRoute
