import crypto from 'node:crypto'

const json = (res, status, body) => {
  res.status(status).json(body)
}

const getCredentials = () => ({
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
})

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

function verifyPayment(body) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    const route = req.url?.split('?')[0]
    const result = route?.endsWith('/payments/create-order')
      ? await createRazorpayOrder(req.body || {})
      : route?.endsWith('/payments/verify')
        ? verifyPayment(req.body || {})
        : { status: 404, body: { error: 'API route not found' } }

    return json(res, result.status, result.body)
  } catch (error) {
    console.error('API request failed:', error)
    return json(res, 500, { error: 'Payment service request failed' })
  }
}