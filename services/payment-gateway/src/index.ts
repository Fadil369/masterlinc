/**
 * Payment Gateway Service
 * Stripe integration for healthcare payments
 */

import express from 'express'
import Stripe from 'stripe'
import cors from 'cors'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
})

// Database connection
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'masterlinc',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
})

app.use(cors())
app.use(express.json())

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-gateway' })
})

/**
 * Create payment intent for consultation
 */
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    const { amount, currency, patientId, doctorId, appointmentId, description } = req.body

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || 'sar',
      metadata: {
        patientId,
        doctorId,
        appointmentId,
        description
      },
      automatic_payment_methods: {
        enabled: true
      }
    })

    // Store in database
    await db.query(
      `INSERT INTO payments (
        payment_intent_id, patient_id, doctor_id, appointment_id,
        amount, currency, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        paymentIntent.id,
        patientId,
        doctorId,
        appointmentId,
        amount,
        currency || 'sar',
        paymentIntent.status
      ]
    )

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Confirm payment
 */
app.post('/api/payments/confirm', async (req, res) => {
  try {
    const { paymentIntentId } = req.body

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Update database
    await db.query(
      `UPDATE payments 
       SET status = $1, updated_at = NOW()
       WHERE payment_intent_id = $2`,
      [paymentIntent.status, paymentIntentId]
    )

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    })
  } catch (error: any) {
    console.error('Error confirming payment:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Refund payment
 */
app.post('/api/payments/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || 'requested_by_customer'
    })

    // Store refund in database
    await db.query(
      `INSERT INTO refunds (
        refund_id, payment_intent_id, amount, reason, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [refund.id, paymentIntentId, refund.amount / 100, reason, refund.status]
    )

    // Update payment status
    await db.query(
      `UPDATE payments 
       SET status = 'refunded', updated_at = NOW()
       WHERE payment_intent_id = $1`,
      [paymentIntentId]
    )

    res.json({
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100
    })
  } catch (error: any) {
    console.error('Error processing refund:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get payment history
 */
app.get('/api/payments/history/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params

    const result = await db.query(
      `SELECT * FROM payments 
       WHERE patient_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [patientId]
    )

    res.json({
      payments: result.rows
    })
  } catch (error: any) {
    console.error('Error fetching payment history:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Stripe webhook handler
 */
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await db.query(
          `UPDATE payments 
           SET status = 'succeeded', updated_at = NOW()
           WHERE payment_intent_id = $1`,
          [paymentIntent.id]
        )
        break

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent
        await db.query(
          `UPDATE payments 
           SET status = 'failed', updated_at = NOW()
           WHERE payment_intent_id = $1`,
          [failedIntent.id]
        )
        break
    }

    res.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    res.status(400).send(`Webhook Error: ${error.message}`)
  }
})

app.listen(port, () => {
  console.log(`Payment Gateway running on port ${port}`)
})

export default app
