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
  const response = await fetch(`${API_BASE_URL}/api/db/products`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Unable to fetch products.')
  }
  return response.json()
}

/** Save a menu item so changes are shared with the customer storefront. */
export async function saveProduct(product) {
  const response = await fetch(`${API_BASE_URL}/api/db/products/${encodeURIComponent(product.slug)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Unable to save product.')
  }

  return response.json()
}

export default {
  createOrder,
  getOrders,
  getProducts,
  saveProduct,
}
