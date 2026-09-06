const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/** Create a new order in the database through the backend API. */
export async function createOrder(orderPayload) {
  const response = await fetch(`${API_BASE_URL}/api/db/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Unable to create order.')
  }

  return response.json()
}

/**
 * 2. Get User Orders from Supabase Database via API (with merged local order state)
 */
export async function getOrders(userEmail = '') {
  const query = userEmail ? `?email=${encodeURIComponent(userEmail)}` : ''
  const response = await fetch(`${API_BASE_URL}/api/db/orders${query}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Unable to fetch orders.')
  }

  return response.json()
}

/**
 * 3. Get Products from Supabase Database via API
 */
export async function getProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/db/products`)
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.warn('API getProducts error:', error.message)
    return []
  }
}

export default {
  createOrder,
  getOrders,
  getProducts,
}
