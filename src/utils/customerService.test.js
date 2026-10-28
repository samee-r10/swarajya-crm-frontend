import { test } from 'node:test'
import assert from 'node:assert/strict'
import { freeServiceEnd, serviceDate, serviceLabel, serviceRate, serviceState, serviceToday } from './customerService.js'

test('free service presets use inclusive dates and handle month ends and leap years', () => {
  assert.equal(freeServiceEnd('2026-10-28', 6), '2027-04-27')
  assert.equal(freeServiceEnd('2026-10-28', 12), '2027-10-27')
  assert.equal(freeServiceEnd('2026-10-01', 6), '2027-03-31')
  assert.equal(freeServiceEnd('2026-08-31', 6), '2027-02-28')
  assert.equal(freeServiceEnd('2023-08-31', 6), '2024-02-29')
  assert.equal(freeServiceEnd('2024-02-29', 12), '2025-02-28')
  assert.equal(freeServiceEnd('', 6), '')
})

test('free coverage remains active through its end date and expires without switching to paid', () => {
  const terms = { type: 'Free', start_date: '2026-10-28', end_date: '2027-04-27' }
  assert.equal(serviceState(terms, '2026-10-27'), 'scheduled')
  assert.equal(serviceState(terms, '2026-10-28'), 'free')
  assert.equal(serviceState(terms, '2027-04-27'), 'free')
  assert.equal(serviceState(terms, '2027-04-28'), 'expired')
  assert.equal(serviceLabel(terms, '2027-04-28'), 'Free service · Expired')
})

test('paid terms can be scheduled, active without an end date, or expired', () => {
  const terms = { type: 'Paid', start_date: '2026-10-28' }
  assert.equal(serviceState(terms, '2026-10-27'), 'scheduled')
  assert.equal(serviceState(terms, '2027-10-28'), 'paid')
  assert.equal(serviceState({ ...terms, end_date: '2026-12-31' }, '2027-01-01'), 'expired')
  assert.equal(serviceLabel(terms, '2026-10-27'), 'Paid service · Upcoming')
})

test('existing customers without terms remain unassigned', () => {
  assert.equal(serviceState(null), 'unassigned')
  assert.equal(serviceState(undefined), 'unassigned')
  assert.equal(serviceLabel(null), 'No service added')
})

test('status dates use India time across a UTC date boundary', () => {
  assert.equal(serviceToday(new Date('2026-10-28T18:29:59Z')), '2026-10-28')
  assert.equal(serviceToday(new Date('2026-10-28T18:30:00Z')), '2026-10-29')
  assert.equal(serviceDate(null), 'No end date')
})

test('hourly rate display includes currency, decimals, and billing unit', () => {
  assert.equal(serviceRate({ hourly_rate: 1500.5, currency: 'INR' }), '₹1,500.50 / hour')
  assert.equal(serviceRate({ hourly_rate: 25, currency: 'USD' }), '$25.00 / hour')
  assert.equal(serviceRate({}), 'Rate not set')
})
