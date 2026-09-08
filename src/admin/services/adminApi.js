const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const LOCAL_STORAGE_KEY = 'bun_maska_user_orders'

function normalizeOrder(order) {
  let customer = order.customer || {}
  if (typeof customer === 'string') {
    try { customer = JSON.parse(customer) } catch { customer = {} }
  }
  const items = Array.isArray(order.items) ? order.items : Array.isArray(order.order_items) ? order.order_items : []
  const amount = Number(order.amount ?? order.totalAmount ?? order.total ?? 0)
  const isOnlinePayment = Boolean(order.paymentId || order.razorpayPaymentId || order.status === 'PAID')

  return {
    ...order,
    customer,
    items,
    // The database stores delivery details inside `customer`, while older local
    // orders used top-level fields. Provide one consistent shape to the desk.
    customerName: order.customerName || order.customer_name || customer.name || 'Guest Customer',
    phone: order.phone || customer.phone || '',
    address: order.address || customer.address || '',
    city: order.city || customer.city || '',
    totalAmount: amount,
    total: amount,
    paymentMethod: order.paymentMethod || order.payment_method || (isOnlinePayment ? 'RAZORPAY' : 'COD'),
    paymentStatus: order.paymentStatus || order.payment_status || (isOnlinePayment ? 'SUCCESS' : 'PENDING'),
  }
}

function getLocalOrders() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Fetch all customer orders from Supabase Database API (merged with local orders)
 */
export async function fetchAdminOrders() {
  const localOrders = getLocalOrders()

  try {
    const response = await fetch(`${API_BASE_URL}/api/db/orders`)
    if (response.ok) {
      const apiOrders = await response.json()
      const apiOrderIds = new Set((apiOrders || []).map((o) => o.orderId || o.id))
      const uniqueLocal = localOrders.filter((o) => !apiOrderIds.has(o.orderId || o.id))
      return [...apiOrders, ...uniqueLocal].map(normalizeOrder)
    }
  } catch (err) {
    console.warn('Admin API fetch fallback to local storage:', err.message)
  }

  return localOrders.map(normalizeOrder)
}

/**
 * Update order status (CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
 */
export async function updateOrderStatus(orderId, newStatus) {
  try {
    const localOrders = getLocalOrders()
    const updated = localOrders.map((o) => {
      if ((o.orderId || o.id) === orderId) {
        return { ...o, status: newStatus }
      }
      return o
    })
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.warn('Local order status update error:', e)
  }

  return true
}

export default {
  fetchAdminOrders,
  updateOrderStatus,
}
