import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'

const formatPrice = (price) => `$${price.toFixed(2)}`

export default function CheckoutPage() {
  const { items, subtotal, delivery, tax, total, clearCart } = useCart()
  const [placedOrder, setPlacedOrder] = useState(false)
  const [payment, setPayment] = useState('Credit Card')

  const handleSubmit = (event) => {
    event.preventDefault()
    setPlacedOrder(true)
    clearCart()
  }

  if (placedOrder) return <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm shadow-slate-200"><h1 className="text-3xl font-black text-slate-900">Order placed</h1><p className="mt-3 text-slate-600">Thanks for ordering. We are preparing your meal now.</p><Link to="/product" className="mt-6 inline-block rounded-full bg-orange-500 px-6 py-3 font-bold text-white">Order more</Link></div>
  if (!items.length) return <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm shadow-slate-200"><h1 className="text-3xl font-black text-slate-900">Nothing to checkout</h1><p className="mt-3 text-slate-600">Add an item to your cart before continuing.</p><Link to="/product" className="mt-6 inline-block rounded-full bg-orange-500 px-6 py-3 font-bold text-white">Browse products</Link></div>

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 pb-10 xl:grid-cols-[1.3fr_0.7fr]">
      <section className="rounded-[2rem] bg-white p-6 shadow-sm shadow-slate-200 md:p-8"><h1 className="text-3xl font-black text-slate-900">Checkout</h1><div className="mt-8 space-y-8"><div><p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-600">Delivery details</p><div className="grid gap-4 md:grid-cols-2"><input required className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400" placeholder="Full name" /><input required type="tel" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400" placeholder="Phone number" /><input required className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400" placeholder="Street address" /><input required className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400" placeholder="City" /><input required className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400" placeholder="ZIP code" /></div></div><div><p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-600">Payment</p><div className="space-y-3">{['Credit Card', 'Cash on delivery', 'UPI'].map((method) => <label key={method} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700"><input type="radio" name="payment" value={method} checked={payment === method} onChange={(event) => setPayment(event.target.value)} /><span>{method}</span></label>)}</div></div><textarea rows="4" placeholder="Any instructions for the kitchen or delivery?" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400" /></div></section>
      <aside className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-xl shadow-slate-300 md:p-8"><h2 className="text-2xl font-black">Summary</h2><div className="mt-6 space-y-4">{items.map((item) => <div key={item.key} className="flex items-center justify-between text-sm text-slate-300"><span>{item.title} ({item.sizeLabel}) x{item.quantity}</span><span>{formatPrice(item.price * item.quantity)}</span></div>)}</div><div className="mt-6 space-y-3 border-t border-slate-700 pt-5 text-sm text-slate-300"><div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between"><span>Delivery</span><span>{formatPrice(delivery)}</span></div><div className="flex justify-between"><span>Tax</span><span>{formatPrice(tax)}</span></div></div><div className="mt-6 flex items-center justify-between border-y border-slate-700 py-4"><span className="text-lg font-bold">Total</span><span className="text-2xl font-black text-orange-300">{formatPrice(total)}</span></div><button type="submit" className="mt-8 w-full rounded-full bg-orange-500 px-6 py-4 text-base font-bold text-white transition hover:bg-orange-600">Place order</button></aside>
    </form>
  )
}
