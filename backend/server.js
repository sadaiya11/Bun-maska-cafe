import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Razorpay from 'razorpay'
import crypto from 'crypto'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Initialize Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bun Maska Cafe Payment API is running' })
})

/**
 * Route: POST /api/payments/create-order
 * Description: Create a new Razorpay order
 */
app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount in paise is required' })
    }

    const options = {
      amount: Math.round(amount), // Amount in paise (e.g. ₹100 = 10000 paise)
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        company: 'Bun Maska Cafe',
      },
    }

    const order = await razorpay.orders.create(options)
    res.json(order)
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    res.status(500).json({
      error: 'Failed to create Razorpay order',
      details: error.message,
    })
  }
})

/**
 * Route: POST /api/payments/verify
 * Description: Verify Razorpay HMAC SHA256 payment signature
 */
app.post('/api/payments/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification details' })
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex')

    if (razorpay_signature === expectedSign) {
      return res.json({
        success: true,
        message: 'Payment verified successfully',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      })
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      })
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    res.status(500).json({
      error: 'Payment verification error',
      details: error.message,
    })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Bun Maska Cafe Backend server running on port ${PORT}`)
})
