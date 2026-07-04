import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ListingDetailPage from './pages/ListingDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import BookingsPage from './pages/BookingsPage'
import FavoritesPage from './pages/FavoritesPage'
import HostListingsPage from './pages/HostListingsPage'
import NewListingPage from './pages/NewListingPage'
import EditListingPage from './pages/EditListingPage'
import HostBookingsPage from './pages/HostBookingsPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminListingsPage from './pages/admin/AdminListingsPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminReviewsPage from './pages/admin/AdminReviewsPage'

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        {/* ── 管理後台（獨立 Layout，不含前台 Navbar）── */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users"     element={<AdminUsersPage />} />
          <Route path="/admin/listings"  element={<AdminListingsPage />} />
          <Route path="/admin/bookings"  element={<AdminBookingsPage />} />
          <Route path="/admin/reviews"   element={<AdminReviewsPage />} />
        </Route>

        {/* ── 前台（含 Navbar）── */}
        <Route path="/*" element={
          <>
            <Navbar />
            <main className="pt-20">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/listings/:id" element={<ListingDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route element={<PrivateRoute />}>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/bookings" element={<BookingsPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/host/listings" element={<HostListingsPage />} />
                  <Route path="/host/listings/new" element={<NewListingPage />} />
                  <Route path="/host/listings/:id/edit" element={<EditListingPage />} />
                  <Route path="/host/bookings" element={<HostBookingsPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
          </>
        } />
      </Routes>
    </div>
  )
}

export default App
