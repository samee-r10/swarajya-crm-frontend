<template>
  <div class="payables-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Treasury</p>
        <h1>Payables</h1>
        <p class="muted">Review expense obligations and deduct company fund only when paid.</p>
      </div>
      <button class="button secondary" type="button" @click="loadPayables">Refresh</button>
    </header>

    <section class="metrics-grid">
      <div class="metric-card"><span>Company Fund</span><strong>{{ money(stats.company_fund_available) }}</strong></div>
      <div class="metric-card"><span>Total Payables</span><strong>{{ money(stats.total_payables) }}</strong></div>
      <div class="metric-card"><span>Pending Payments</span><strong>{{ money(stats.pending_payments) }}</strong></div>
      <div class="metric-card"><span>Paid</span><strong>{{ money(stats.paid_amount) }}</strong></div>
    </section>

    <section class="filters-bar">
      <input v-model="search" placeholder="Search payable, source, party...">
      <select v-model="statusFilter">
        <option value="">All Statuses</option>
        <option>Pending</option>
        <option>Partially Paid</option>
        <option>Paid</option>
        <option>Cancelled</option>
      </select>
    </section>

    <section v-if="loading" class="record-card empty-state">Loading payables...</section>
    <section v-else class="table-container">
      <table class="record-table">
        <thead>
          <tr>
            <th>Payable #</th>
            <th>Source</th>
            <th>Party</th>
            <th>Date</th>
            <th class="right">Original</th>
            <th class="right">Paid</th>
            <th class="right">Outstanding</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payable in filteredPayables" :key="payable.id" @click="openPayment(payable)">
            <td><strong>{{ payable.payable_number }}</strong></td>
            <td>{{ payable.source_module }}<span class="muted block">{{ payable.source_reference }}</span></td>
            <td>{{ payable.party_name || '-' }}</td>
            <td>{{ formatDate(payable.transaction_date) }}</td>
            <td class="right">{{ money(payable.original_amount) }}</td>
            <td class="right">{{ money(payable.paid_amount) }}</td>
            <td class="right">{{ money(payable.outstanding_amount) }}</td>
            <td><span class="pill" :class="statusClass(payable.status)">{{ payable.status }}</span></td>
            <td class="right"><button v-if="['Pending','Partially Paid'].includes(payable.status)" class="button secondary small" type="button" @click.stop="openPayment(payable)">Mark Paid</button></td>
          </tr>
          <tr v-if="filteredPayables.length === 0"><td colspan="9" class="empty-state">No payables found.</td></tr>
        </tbody>
      </table>
    </section>

    <div v-if="selectedPayable" class="modal-overlay" @click.self="selectedPayable = null">
      <div class="modal-content payable-modal">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Payable Settlement</p>
            <h2>{{ selectedPayable.payable_number }}</h2>
          </div>
          <button class="modal-close" type="button" @click="selectedPayable = null">&times;</button>
        </div>

        <section class="detail-grid">
          <div><span>Source</span><strong>{{ selectedPayable.source_module }}</strong></div>
          <div><span>Reference</span><strong>{{ selectedPayable.source_reference }}</strong></div>
          <div><span>Outstanding</span><strong>{{ money(selectedPayable.outstanding_amount) }}</strong></div>
          <div><span>Status</span><strong>{{ selectedPayable.status }}</strong></div>
        </section>

        <form class="form-grid" @submit.prevent="markPaid">
          <label>Payment Amount<input v-model.number="payment.payment_amount" type="number" min="0" step="0.01" required></label>
          <label>Payment Date<input v-model="payment.payment_date" type="date" required></label>
          <label>Payment Mode<select v-model="payment.payment_mode"><option value="">Select mode</option><option v-for="mode in paymentModes" :key="mode">{{ mode }}</option></select></label>
          <label>Company Bank Account<select v-model="payment.bank_account_id"><option value="">Select account</option><option v-for="account in bankAccounts" :key="account.id" :value="account.id">{{ account.label }}</option></select></label>
          <label>Transaction Reference<input v-model="payment.reference"></label>
          <label>Remarks<input v-model="payment.remarks"></label>
          <p v-if="error" class="span-2 flash warning">{{ error }}</p>
          <div class="span-2 action-row">
            <button class="button secondary" type="button" @click="selectedPayable = null">Cancel</button>
            <button class="button" type="submit">Confirm Payment</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiGet, apiPost } from '../api/client'

const payables = ref([])
const stats = ref({})
const loading = ref(false)
const search = ref('')
const statusFilter = ref('')
const selectedPayable = ref(null)
const error = ref('')
const paymentModes = ref([])
const bankAccounts = ref([])
const payment = reactive(defaultPayment())

const filteredPayables = computed(() => {
  const term = search.value.toLowerCase()
  return payables.value.filter(payable => {
    const matchesStatus = !statusFilter.value || payable.status === statusFilter.value
    const matchesSearch = !term || [payable.payable_number, payable.source_module, payable.source_reference, payable.party_name, payable.remarks].some(value => String(value || '').toLowerCase().includes(term))
    return matchesStatus && matchesSearch
  })
})

onMounted(async () => {
  await Promise.all([loadPayables(), loadOptions()])
})

function defaultPayment() {
  return { payment_amount: 0, payment_date: new Date().toISOString().slice(0, 10), payment_mode: '', bank_account_id: '', reference: '', remarks: '' }
}

async function loadOptions() {
  const options = await apiGet('/api/options')
  paymentModes.value = options.payment_modes || []
  bankAccounts.value = options.bank_accounts || []
}

async function loadPayables() {
  loading.value = true
  try {
    const data = await apiGet('/api/treasury/payables')
    payables.value = data.payables || []
    stats.value = data.stats || {}
  } finally {
    loading.value = false
  }
}

function openPayment(payable) {
  if (!['Pending', 'Partially Paid'].includes(payable.status)) return
  selectedPayable.value = payable
  Object.assign(payment, defaultPayment(), { payment_amount: payable.outstanding_amount || 0 })
  error.value = ''
}

async function markPaid() {
  if (!confirm('Confirm payable payment? This will deduct company fund.')) return
  error.value = ''
  try {
    await apiPost(`/api/treasury/payables/${selectedPayable.value.id}/payments`, payment)
    selectedPayable.value = null
    await loadPayables()
  } catch (err) {
    error.value = err.message
  }
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

function money(value) {
  return `INR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusClass(status) {
  if (status === 'Paid') return 'status-success'
  if (status === 'Cancelled') return 'status-danger'
  if (status === 'Partially Paid') return 'status-warning'
  return 'status-muted'
}
</script>

<style scoped>
.payables-page { max-width: 1400px; margin: 0 auto; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px; }
.metric-card { border: 1px solid var(--line); background: var(--surface); border-radius: 8px; padding: 18px; }
.metric-card span { display: block; color: var(--muted); font-size: 12px; text-transform: uppercase; font-weight: 800; }
.metric-card strong { font-size: 24px; }
.filters-bar { display: flex; gap: 12px; margin-bottom: 18px; }
.filters-bar input { flex: 1; }
.block { display: block; }
.payable-modal { max-width: 900px; width: min(900px, calc(100vw - 32px)); }
.detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 18px; }
.detail-grid div { border: 1px solid var(--line); border-radius: 8px; padding: 12px; background: var(--surface); }
.detail-grid span { display: block; color: var(--muted); font-size: 12px; font-weight: 800; text-transform: uppercase; }
</style>
