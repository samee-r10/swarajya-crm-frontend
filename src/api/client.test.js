import assert from 'node:assert/strict'
import test from 'node:test'

let instance = 0

async function setup(t, fetchHandler) {
  const originals = { window: globalThis.window, fetch: globalThis.fetch, CustomEvent: globalThis.CustomEvent }
  const events = []
  globalThis.window = {
    dispatchEvent: event => events.push(event.type),
    localStorage: { removeItem() {} },
    location: { pathname: '/finance/transactions' }
  }
  globalThis.CustomEvent = class { constructor(type) { this.type = type } }
  globalThis.fetch = fetchHandler
  t.after(() => {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) delete globalThis[key]
      else globalThis[key] = value
    }
  })
  return { api: await import(`./client.js?test=${++instance}`), events }
}

const response = data => ({ ok: true, json: async () => data })

test('background ledger reads skip the overlay and do not forward UI options to fetch', async t => {
  const requests = []
  const { api, events } = await setup(t, async (url, options) => {
    requests.push({ url, options })
    return response({ transactions: [{ id: 'TXN1' }] })
  })
  const data = await api.apiGet('/api/finance/transactions?view=ledger', { background: true, bypassCache: true })
  assert.equal(data.transactions[0].id, 'TXN1')
  assert.deepEqual(events, [])
  assert.equal(requests[0].options.credentials, 'include')
  assert.ok(!('background' in requests[0].options))
  assert.ok(!('bypassCache' in requests[0].options))
})

test('posting entries retains the blocking loader and POST payload', async t => {
  let request
  const { api, events } = await setup(t, async (url, options) => {
    request = { url, options }
    return response({ id: 'TXN2' })
  })
  assert.deepEqual(await api.apiPost('/api/finance/transactions', { amount: 100 }), { id: 'TXN2' })
  assert.equal(request.options.method, 'POST')
  assert.deepEqual(JSON.parse(request.options.body), { amount: 100 })
  assert.deepEqual(events, ['app-loading-start', 'app-loading-stop'])
})

test('background errors preserve API errors without affecting foreground loader counts', async t => {
  const { api, events } = await setup(t, async () => ({
    ok: false, status: 503, json: async () => ({ error: 'Database unavailable' })
  }))
  await assert.rejects(api.apiGet('/api/finance/transactions?view=ledger', { background: true }), /Database unavailable/)
  assert.deepEqual(events, [])
  await assert.rejects(api.apiGet('/api/company'), /Database unavailable/)
  assert.deepEqual(events, ['app-loading-start', 'app-loading-stop'])
})

test('background reads retain request deduplication and settings caching', async t => {
  let requests = 0
  const { api, events } = await setup(t, async () => {
    requests++
    return response({ INR: { default: 95 } })
  })
  const path = '/api/settings/exchange-rates'
  const values = await Promise.all([api.apiGet(path, { background: true }), api.apiGet(path, { background: true })])
  assert.equal(requests, 1)
  assert.deepEqual(values[0], values[1])
  assert.deepEqual(await api.apiGet(path, { background: true }), values[0])
  assert.equal(requests, 1)
  assert.deepEqual(events, [])
})
