import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader'
import SEO from '../components/SEO'
import { getOrders } from '../services/api'

const formatPrice = (price) => `₹${Number(price || 0).toFixed(2)}`

export default function OrdersPage() {
  const { user } = useSelector((state) => state.auth)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true)
      setError(null)

      try {
        const data = await getOrders(user?.email || '')
        setOrders(data)
      } catch (err) {
        console.warn('Using fallback orders due to network/server:', err.message)
        setError(err.message)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  return (
    <div className="space-y-8">
      <SEO title="My Orders | Bun Maska Café" noindex={true} />
      <section className="rounded-[2rem] bg-white p-6 shadow-sm shadow-slate-200 md:p-8">
        <SectionHeader
          eyebrow="My Account"
          title="Your Orders"
          subtitle="Track current orders and view your previous food orders from Bun Maska Café API & Database."
        />

        {loading ? (
          <div className="py-12 text-center text-slate-500 font-semibold">
            Loading your orders from database...
          </div>
        ) : !orders.length ? (
          <div className="py-12 text-center">
            {error ? <p className="mb-3 text-sm font-semibold text-rose-600">{error}</p> : null}
            <p className="text-xl font-bold text-slate-800">No orders found</p>
            <p className="mt-2 text-sm text-slate-500">Order something fresh from our menu!</p>
            <Link to="/product" className="mt-5 inline-block rounded-full bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => {
              const displayId = order.orderId || order.id || 'BM-Order'
              const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }) : 'Date unavailable'

              const itemsSummary = Array.isArray(order.items)
                ? order.items.map((i) => `${i.quantity}x ${i.title}`).join(', ')
                : 'Food order'

              const isPaid = order.status === 'PAID' || order.status === 'CONFIRMED' || order.status === 'Delivered'
              const statusBg = isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'

              return (
                <div
                  key={order.id || displayId}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-orange-300 md:flex-row md:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900">#{displayId}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBg}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700">{itemsSummary}</p>
                    <p className="text-xs text-slate-400">Ordered on {formattedDate}</p>
                  </div>

                  <div className="flex items-center justify-between gap-6 border-t border-slate-200 pt-3 md:border-t-0 md:pt-0">
                    <span className="text-xl font-black text-orange-600">
                      {formatPrice(order.amount)}
                    </span>
                    <Link
                      to="/product"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-orange-400 hover:bg-orange-50"
                    >
                      Reorder
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
