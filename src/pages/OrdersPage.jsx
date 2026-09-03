import { Link } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader'

export default function OrdersPage() {
  const orders = [
    { id: '#BM-1048', date: '2026-09-03', items: '2x Bun Maska, 1x Irani Chai', total: '₹420.00', status: 'Preparing', statusBg: 'bg-amber-100 text-amber-800' },
    { id: '#BM-1049', date: '2026-09-01', items: '1x Cheese Omelette, 1x Cold Coffee', total: '₹185.00', status: 'Delivered', statusBg: 'bg-emerald-100 text-emerald-800' },
    { id: '#BM-1050', date: '2026-08-28', items: '1x Mutton Keema Bun', total: '₹267.50', status: 'Delivered', statusBg: 'bg-emerald-100 text-emerald-800' },
  ]

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-white p-6 shadow-sm shadow-slate-200 md:p-8">
        <SectionHeader
          eyebrow="My Account"
          title="Your Orders"
          subtitle="Track current orders and view your previous food orders from Bun Maska Café."
        />

        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-orange-300 md:flex-row md:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-900">{order.id}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${order.statusBg}`}>{order.status}</span>
                </div>
                <p className="text-sm font-medium text-slate-600">{order.items}</p>
                <p className="text-xs text-slate-400">Ordered on {order.date}</p>
              </div>

              <div className="flex items-center justify-between gap-6 border-t border-slate-200 pt-3 md:border-t-0 md:pt-0">
                <span className="text-xl font-black text-orange-600">{order.total}</span>
                <Link to="/product" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-orange-400 hover:bg-orange-50">
                  Reorder
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
