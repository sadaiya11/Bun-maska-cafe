import { Navigate, Route, Routes } from 'react-router-dom'
import TopNavigation from './TopNavigation'
import LoginPage from '../pages/LoginPage'
import InfoPage from '../pages/InfoPage'
import DashboardPage from '../pages/DashboardPage'
import ProductDetailPage from '../pages/ProductDetailPage'
import ProductListPage from '../pages/ProductListPage'
import CartPage from '../pages/CartPage'
import CheckoutPage from '../pages/CheckoutPage'
import { useCart } from '../context/useCart'

const publicNav = [
  { label: 'Home', path: '/dashboard' },
  { label: 'Product', path: '/product' },
  { label: 'Cart', path: '/cart' },
  { label: 'Checkout', path: '/checkout' },
  { label: 'Offers', path: '/offers' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'Login', path: '/login' },
]

export default function PublicLayout({ onLogin }) {
  const { itemCount } = useCart()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <TopNavigation items={publicNav} brand="Bun Maska Café" cartCount={itemCount} />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/product" element={<ProductListPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/offers" element={<InfoPage title="Special Offers" description="Enjoy the best combo deals, family packs, and chef specials prepared fresh for you." />} />
          <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
          <Route
            path="/about"
            element={
              <InfoPage
                title="About Us"
                description="Fresh breads, premium coffee, and a warm neighborhood vibe."
              />
            }
          />
          <Route
            path="/contact"
            element={
              <InfoPage
                title="Contact"
                description="Call us at +1 (555) 123-4567 or visit us in downtown."
              />
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}
