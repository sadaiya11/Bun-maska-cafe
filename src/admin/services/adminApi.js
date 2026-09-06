const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const LOCAL_STORAGE_KEY = 'bun_maska_user_orders'

function getLocalOrders() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
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
      return [...apiOrders, ...uniqueLocal]
    }
  } catch (err) {
    console.warn('Admin API fetch fallback to local storage:', err.message)
  }

  return localOrders
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
