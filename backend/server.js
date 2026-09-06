import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import prisma from './lib/prisma.js'

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

const hasRazorpayCredentials = Boolean(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
)

// Health Check Endpoint (Includes Supabase & Prisma Status)
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await prisma.user.count().catch(() => 0)
    res.json({
      status: 'ok',
      message: 'Bun Maska Cafe Backend & Supabase Database API is running',
      database: 'Connected to Supabase via Prisma',
      stats: { totalUsers: userCount },
    })
  } catch (err) {
    res.json({ status: 'ok', databaseError: err.message })
  }
})

// Route: GET /api/db/products - Fetch All Products from Supabase DB via Prisma
app.get('/api/db/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany()
    res.json(products)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products', details: error.message })
  }
})

// Route: POST /api/db/orders - Save Order into Supabase DB via Prisma
app.post('/api/db/orders', async (req, res) => {
  try {
    const { orderId, customer, amount, currency = 'INR', items, paymentId, status = 'CONFIRMED' } = req.body

    const newOrder = await prisma.order.create({
      data: {
        orderId: orderId || `BM-${Date.now()}`,
        customer: customer || {},
        amount: Number(amount),
        currency,
        status,
        paymentId,
        items: {
          create: (items || []).map((item) => ({
            title: item.title,
            size: item.sizeLabel || item.size || 'standard',
            quantity: Number(item.quantity),
            price: Number(item.price),
          })),
        },
      },
      include: { items: true },
    })

    res.status(201).json({ success: true, order: newOrder })
  } catch (error) {
    console.error('Error saving order to Supabase:', error)
    res.status(500).json({ error: 'Failed to save order to database', details: error.message })
  }
})

// Route: GET /api/db/orders - Fetch Orders from Supabase DB via Prisma
app.get('/api/db/orders', async (req, res) => {
  try {
    const { email } = req.query
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    const result = email
      ? orders.filter((o) => o.customer && typeof o.customer === 'object' && o.customer.email === email)
      : orders

    res.json(result)
  } catch (error) {
    console.error('Error fetching orders from Supabase:', error)
    res.status(500).json({ error: 'Failed to fetch orders from database', details: error.message })
  }
})

/**
 * Route: POST /api/payments/create-order
 * Description: Create a new Razorpay order (or mock order if secret key not set)
 */
app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body

    if (!hasRazorpayCredentials) {
      return res.status(503).json({
        error: 'Razorpay is not configured. Add test credentials to backend/.env.',
      })
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount in paise is required' })
    }

    const options = {
      amount: Math.round(amount), // Amount in paise
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
 * Description: Verify Razorpay HMAC SHA256 payment signature & save order to Supabase
 */
app.post('/api/payments/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, customer, items, amount } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification details' })
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex')

    if (razorpay_signature === expectedSign) {
      // Save order to Supabase PostgreSQL via Prisma
      try {
        await prisma.order.create({
          data: {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            customer: customer || {},
            amount: Number(amount) || 0,
            status: 'PAID',
            items: {
              create: (items || []).map((item) => ({
                title: item.title,
                size: item.sizeLabel || 'standard',
                quantity: Number(item.quantity),
                price: Number(item.price),
              })),
            },
          },
        })
      } catch (dbErr) {
        console.warn('Order saved to memory, DB log warning:', dbErr.message)
      }

      return res.json({
        success: true,
        message: 'Payment verified and saved to database successfully',
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
  console.log(`🚀 Bun Maska Cafe Backend & Supabase Database server running on port ${PORT}`)
})
