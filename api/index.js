import crypto from 'node:crypto'

const json = (res, status, body) => {
  res.status(status).json(body)
}

const getCredentials = () => ({
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
})

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
})

async function supabaseRequest(path, options = {}) {
  const { url, key } = getSupabaseConfig()
  if (!url || !key) {
    return { status: 503, body: { error: 'Supabase is not configured on the server.' } }
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  return { status: response.status, body: text ? JSON.parse(text) : null }
}

async function getOrders(query) {
  const params = new URLSearchParams({ select: '*,order_items(*)', order: 'createdAt.desc' })
  const email = query.get('email')
  if (email) params.set('customer->>email', `eq.${email}`)
  
  let result = await supabaseRequest(`orders?${params.toString()}`)
  
  // Fallback if relationship 'order_items' is not found in schema cache
  if (result.status >= 400) {
    const fallbackParams = new URLSearchParams({ select: '*', order: 'createdAt.desc' })
    if (email) fallbackParams.set('customer->>email', `eq.${email}`)
    result = await supabaseRequest(`orders?${fallbackParams.toString()}`)
  }

  if (result.status === 200 && Array.isArray(result.body)) {
    const mapped = result.body.map(order => ({
      ...order,
      items: order.items || order.order_items || []
    }))
    return { status: 200, body: mapped }
  }

  return result
}

async function saveOrder(body) {
  const { orderId, customer, amount, currency = 'INR', items = [], paymentId, status = 'CONFIRMED' } = body
  if (orderId) {
    const existingResult = await supabaseRequest(`orders?orderId=eq.${encodeURIComponent(orderId)}&select=*`)
    if (existingResult.status < 400 && existingResult.body?.length) {
      return { status: 200, body: { success: true, order: existingResult.body[0], alreadyExists: true } }
    }
  }

  const orderResult = await supabaseRequest('orders?select=*', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      orderId: orderId || `BM-${Date.now()}`,
      customer: customer || {},
      amount: Number(amount),
      currency,
      paymentId,
      status,
    }),
  })

  if (orderResult.status >= 400) return orderResult
  const order = Array.isArray(orderResult.body) ? orderResult.body[0] : orderResult.body

  if (items.length) {
    const itemResult = await supabaseRequest('order_items', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(items.map((item) => ({
        orderId: order.id,
        title: item.title,
        size: item.sizeLabel || item.size || 'standard',
        quantity: Number(item.quantity),
        price: Number(item.price),
      }))),
    })
    if (itemResult.status >= 400) return itemResult
  }

  return { status: 201, body: { success: true, order } }
}

async function createRazorpayOrder(body) {
  const { amount, currency = 'INR' } = body
  const { keyId, keySecret } = getCredentials()

  if (!keyId || !keySecret) {
    return { status: 503, body: { error: 'Razorpay is not configured on the server.' } }
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return { status: 400, body: { error: 'Valid amount in paise is required' } }
  }

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: { company: 'Bun Maska Cafe' },
    }),
  })

  const result = await response.json()
  return { status: response.status, body: result }
}

async function verifyPayment(body) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, customer, items, amount } = body
  const { keySecret } = getCredentials()

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return { status: 400, body: { error: 'Missing required payment verification details' } }
  }

  if (!keySecret) {
    return { status: 503, body: { error: 'Razorpay is not configured on the server.' } }
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (razorpay_signature !== expectedSignature) {
    return { status: 400, body: { success: false, error: 'Invalid payment signature' } }
  }

  const savedOrder = await saveOrder({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    customer,
    items,
    amount,
    currency: 'INR',
    status: 'PAID',
  })

  if (savedOrder.status >= 400) {
    return { status: 500, body: { error: 'Payment verified but order could not be saved.' } }
  }

  return {
    status: 200,
    body: {
      success: true,
      message: 'Payment verified successfully',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    },
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(204).end()

  try {
    const requestUrl = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`)
    const route = requestUrl.pathname
    const result = route.endsWith('/db/orders') && req.method === 'GET'
      ? await getOrders(requestUrl.searchParams)
      : route.endsWith('/db/orders') && req.method === 'POST'
        ? await saveOrder(req.body || {})
        : route.endsWith('/payments/create-order') && req.method === 'POST'
      ? await createRazorpayOrder(req.body || {})
      : route.endsWith('/payments/verify') && req.method === 'POST'
          ? await verifyPayment(req.body || {})
        : { status: 404, body: { error: 'API route not found' } }

    return json(res, result.status, result.body)
  } catch (error) {
    console.error('API request failed:', error)
    return json(res, 500, { error: 'Payment service request failed' })
  }
}