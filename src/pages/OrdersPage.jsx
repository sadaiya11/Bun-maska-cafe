export default function OrdersPage() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h1 className="text-3xl font-bold text-white">Orders</h1>
      <div className="mt-6 space-y-4">
        {[
          { id: '#1048', customer: 'Alicia', total: '₹420.00', status: 'Preparing' },
          { id: '#1049', customer: 'Marcus', total: '₹185.00', status: 'Ready' },
          { id: '#1050', customer: 'Sonia', total: '₹267.50', status: 'Delivered' },
        ].map((order) => (
          <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3">
            <div>
              <p className="font-semibold text-white">{order.id}</p>
              <p className="text-sm text-slate-400">{order.customer}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sky-300">{order.total}</p>
              <p className="text-sm text-slate-400">{order.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
