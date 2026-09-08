import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import PaymentResult from '../components/PaymentResult'
import DemoPaymentModal from '../components/DemoPaymentModal'
import SEO from '../components/SEO'
import { useCart } from '../context/useCart'
import { createOrder } from '../services/api'

const formatPrice = (price) => `₹${price.toFixed(2)}`
const paymentMethods = [
  { id: 'razorpay', title: 'Pay online with Razorpay', detail: 'Cards, UPI, net banking and wallets' },
  { id: 'cod', title: 'Cash on delivery', detail: 'Pay when your order arrives' },
]

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'))
    document.body.appendChild(script)
  })
}

export default function CheckoutPage() {
  const { items, subtotal, delivery, tax, total, clearCart } = useCart()
  const { user } = useSelector((state) => state.auth)
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', zip: '', notes: '' })
  const [status, setStatus] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [demoPaymentOpen, setDemoPaymentOpen] = useState(false)

  // Live Location State
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const [detectedCoords, setDetectedCoords] = useState(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const handleLocationSelect = (loc) => {
    setForm((current) => ({
      ...current,
      address: loc.address || current.address,
      city: loc.city || current.city,
      zip: loc.zip || current.zip,
      notes: current.notes
        ? current.notes
        : loc.lat && loc.lng
          ? `Delivery Pin: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
          : current.notes,
    }))
  }

  // Create Order using API Service
  const completeOrder = async (message, orderId, payment = {}) => {
    const customer = { ...form, email: user?.email || form.email || '' }
    // Razorpay verification stores live payments itself. COD and demo payments
    // are saved here with explicit payment metadata for the admin desk.
    if (paymentMethod === 'cod' || payment.isDemo) {
      try {
        await createOrder({
          orderId: orderId || `BM-${Date.now()}`,
          customer,
          amount: total,
          currency: 'INR',
          items,
          paymentId: payment.paymentId,
          paymentMethod: paymentMethod === 'cod' ? 'COD' : 'RAZORPAY',
          paymentStatus: paymentMethod === 'cod' ? 'PENDING' : 'SUCCESS',
          status: paymentMethod === 'cod' ? 'CONFIRMED' : 'PAID',
        })
      } catch (e) {
        console.warn('createOrder API save warning:', e.message)
      }
    }

    setStatus({ type: 'success', message, orderId })
    clearCart()
  }

  const failPayment = (message) => setStatus({ type: 'failure', message })

  const startOnlinePayment = async () => {
    setProcessing(true)
    const customer = { ...form, email: user?.email || form.email || '' }
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100), currency: 'INR', items, customer }),
      })
      if (!response.ok) throw new Error('Backend payment endpoint is not running on Vercel.')

      const order = await response.json()

      // If backend returned a demo order (missing live Razorpay Secret Key in backend/.env), launch Demo Payment Sheet
      if (order.isDemo) {
        setDemoPaymentOpen(true)
        return
      }

      await loadRazorpay()
      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Bun Maska Cafe',
        description: 'Food order payment',
        order_id: order.id,
        prefill: { name: form.name, contact: form.phone },
        handler: async (paymentResponse) => {
          const verification = await fetch(`${API_BASE_URL}/api/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...paymentResponse, customer, items, amount: total }),
          })
          if (!verification.ok) {
            failPayment('Payment was received but order verification failed. Please contact support with your payment details.')
            return
          }
          completeOrder('Your online payment was verified and your order is being prepared.', paymentResponse.razorpay_order_id)
        },
        modal: { ondismiss: () => failPayment('Payment was cancelled. Your cart is still saved.') },
      })
      razorpay.on('payment.failed', (response) => failPayment(response.error?.description || 'Razorpay could not complete the payment.'))
      razorpay.open()
    } catch (error) {
      console.warn('Backend server not connected or missing Razorpay setup. Launching Demo Payment Modal for client demonstration:', error.message)
      setDemoPaymentOpen(true)
    } finally {
      setProcessing(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (paymentMethod === 'cod') {
      completeOrder('Your cash-on-delivery order has been confirmed. Please pay when it arrives.', `COD-${Date.now()}`)
      return
    }
    startOnlinePayment()
  }

  if (status) return <PaymentResult status={status.type} orderId={status.orderId} message={status.message} onRetry={() => setStatus(null)} />
  if (!items.length) return <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm shadow-slate-200"><h1 className="text-3xl font-black text-slate-900">Nothing to checkout</h1><p className="mt-3 text-slate-600">Add an item to your cart before continuing.</p><Link to="/product" className="mt-6 inline-block rounded-full bg-orange-500 px-6 py-3 font-bold text-white">Browse products</Link></div>

  return (
    <>
      <SEO title="Checkout | Bun Maska Café" noindex={true} />
      <form onSubmit={handleSubmit} className="grid gap-8 pb-10 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm shadow-slate-200 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Secure checkout</p>
          <h1 className="mt-3 text-3xl font-black text-slate-900">Complete your order</h1>
          <div className="mt-8 space-y-8">
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-600">Delivery details</p>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input required name="name" value={form.name} onChange={updateField} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400" placeholder="Full name" />
                  <input required name="phone" value={form.phone} onChange={updateField} type="tel" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400" placeholder="Phone number" />
                  <input required name="address" value={form.address} onChange={updateField} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400 md:col-span-2" placeholder="Street address" />
                  <input required name="city" value={form.city} onChange={updateField} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400" placeholder="City" />
                  <input required name="zip" value={form.zip} onChange={updateField} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400" placeholder="ZIP code" />
                </div>

                {/* Interactive Live Map & GPS Location Picker */}
              </div>
            </div>
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-600">Choose payment</p>
              <div className="space-y-3">
                {paymentMethods.map((method) => <label key={method.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${paymentMethod === method.id ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}><input type="radio" name="paymentMethod" value={method.id} checked={paymentMethod === method.id} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1" /><span><strong className="block text-slate-900">{method.title}</strong><small className="text-slate-600">{method.detail}</small></span></label>)}
              </div>
            </div>
            <textarea name="notes" value={form.notes} onChange={updateField} rows="4" placeholder="Any instructions for the kitchen or delivery?" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400" />
          </div>
        </section>
        <aside className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-xl shadow-slate-300 md:p-8"><h2 className="text-2xl font-black">Order summary</h2><div className="mt-6 space-y-4">{items.map((item) => <div key={item.key} className="flex items-center justify-between gap-4 text-sm text-slate-300"><span>{item.title} ({item.sizeLabel}) x{item.quantity}</span><span>{formatPrice(item.price * item.quantity)}</span></div>)}</div><div className="mt-6 space-y-3 border-t border-slate-700 pt-5 text-sm text-slate-300"><div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between"><span>Delivery</span><span>{formatPrice(delivery)}</span></div><div className="flex justify-between"><span>Tax</span><span>{formatPrice(tax)}</span></div></div><div className="mt-6 flex items-center justify-between border-y border-slate-700 py-4"><span className="text-lg font-bold">Total</span><span className="text-2xl font-black text-orange-300">{formatPrice(total)}</span></div><button disabled={processing} type="submit" className="mt-8 w-full rounded-full bg-orange-500 px-6 py-4 text-base font-bold text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60">{processing ? 'Connecting to Razorpay...' : paymentMethod === 'cod' ? 'Confirm cash order' : `Pay ${formatPrice(total)} securely`}</button><p className="mt-4 text-center text-xs text-slate-400">{paymentMethod === 'cod' ? 'Payment is collected at delivery.' : 'Online payments are handled securely by Razorpay.'}</p></aside>
      </form>
      {demoPaymentOpen ? <DemoPaymentModal amount={total} onClose={() => setDemoPaymentOpen(false)} onSuccess={(orderId) => { setDemoPaymentOpen(false); completeOrder('Your demo online payment was successful and your order is being prepared.', orderId, { isDemo: true, paymentId: orderId }) }} onFailure={(message) => { setDemoPaymentOpen(false); failPayment(message) }} /> : null}
    </>
  )
}
