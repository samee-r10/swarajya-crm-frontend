<template>
  <div class="bank-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Treasury</p>
        <h1>Company Bank Accounts</h1>
        <p class="muted">Manage legal-entity bank accounts, balances, and transaction history.</p>
      </div>
      <button class="button" type="button" @click="openForm()">New Bank Account</button>
    </header>

    <p v-if="statusMessage" class="flash success">{{ statusMessage }}</p>

    <section class="metric-grid">
      <div class="metric-card"><span>Available Balance</span><strong>{{ money(stats.available_balance) }}</strong></div>
      <div class="metric-card"><span>Total Inflow</span><strong>{{ money(stats.total_inflow) }}</strong></div>
      <div class="metric-card"><span>Total Outflow</span><strong>{{ money(stats.total_outflow) }}</strong></div>
      <div class="metric-card"><span>Pending Payables</span><strong>{{ money(stats.pending_payables) }}</strong></div>
    </section>

    <section class="table-container">
      <table class="record-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Bank</th>
            <th>Currency</th>
            <th>Type</th>
            <th>Legal Entity</th>
            <th>Status</th>
            <th class="right">Current Balance</th>
            <th class="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in bankAccounts" :key="account.id">
            <td><strong>{{ account.account_name }}</strong><span class="muted block">{{ account.account_number }}</span></td>
            <td>{{ account.bank_name }}<span class="muted block">{{ account.branch || '-' }} · {{ account.ifsc || account.ifsc_code || '-' }}</span></td>
            <td>{{ account.currency || 'INR' }}</td>
            <td>{{ account.account_type || '-' }}</td>
            <td>{{ account.legal_entity || '-' }}</td>
            <td><span :class="statusClass(account.status)">{{ account.status || 'Active' }}</span></td>
            <td class="right">{{ money(account.current_balance ?? account.balance ?? account.opening_balance, account.currency) }}</td>
            <td class="right actions-cell">
              <button class="button small" type="button" @click="checkBalance(account)">Check Balance</button>
              <button class="button secondary small" type="button" @click="openForm(account)">Edit</button>
            </td>
          </tr>
          <tr v-if="bankAccounts.length === 0"><td colspan="8" class="empty-row">No company bank accounts configured.</td></tr>
        </tbody>
      </table>
    </section>

    <section v-if="balanceResult" class="record-card balance-check-card">
      <div>
        <p class="eyebrow">Balance Check</p>
        <h2>{{ balanceResult.bank_account?.label || balanceResult.bank_account?.account_name }}</h2>
        <strong>{{ money(balanceResult.available_balance, balanceResult.bank_account?.currency) }}</strong>
        <span class="muted block">Checked {{ formatTimestamp(balanceResult.checked_at) }}</span>
      </div>
      <div v-if="balanceResult.last_transaction" class="last-check-transaction">
        <span>Last movement</span>
        <strong>{{ balanceResult.last_transaction.transaction_type }} · {{ balanceResult.last_transaction.reference || '-' }}</strong>
        <small>{{ money((balanceResult.last_transaction.inflow || balanceResult.last_transaction.outflow), balanceResult.last_transaction.currency) }}</small>
      </div>
    </section>

    <section class="record-card">
      <h2>Last Transactions</h2>
      <table class="record-table">
        <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Description</th><th>Bank Account</th><th class="right">Inflow</th><th class="right">Outflow</th><th class="right">Running Balance</th></tr></thead>
        <tbody>
          <tr v-for="entry in transactions" :key="entry.id || `${entry.reference}-${entry.date}`">
            <td>{{ formatDate(entry.date || entry.transaction_date) }}</td>
            <td>{{ entry.transaction_type || entry.type }}</td>
            <td>{{ entry.reference || entry.transaction_reference || '-' }}</td>
            <td>{{ entry.description || '-' }}</td>
            <td>{{ entry.bank_account_name || entry.account_name || '-' }}</td>
            <td class="right">{{ entry.inflow ? money(entry.inflow, entry.currency) : '-' }}</td>
            <td class="right">{{ entry.outflow ? money(entry.outflow, entry.currency) : '-' }}</td>
            <td class="right">{{ money(entry.running_balance, entry.currency) }}</td>
          </tr>
          <tr v-if="transactions.length === 0"><td colspan="8" class="empty-row">No bank transactions found.</td></tr>
        </tbody>
      </table>
    </section>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <p class="eyebrow">{{ form.id ? 'Edit Bank Account' : 'New Bank Account' }}</p>
            <h2>{{ form.account_name || 'Bank Account' }}</h2>
          </div>
          <button class="modal-close" type="button" @click="showForm = false">&times;</button>
        </div>
        <form class="form-grid" @submit.prevent="saveAccount">
          <label>Account Number<input v-model="form.account_number" required></label>
          <label>Account Name<input v-model="form.account_name" required></label>
          <label>Bank Name<input v-model="form.bank_name" required></label>
          <label>Branch<input v-model="form.branch"></label>
          <label>IFSC<input v-model="form.ifsc"></label>
          <label>Currency<input v-model="form.currency" required></label>
          <label>Opening Balance<input v-model.number="form.opening_balance" type="number" step="0.01"></label>
          <label>Account Type<input v-model="form.account_type"></label>
          <label>Legal Entity<input v-model="form.legal_entity"></label>
          <label>Status<select v-model="form.status"><option>Active</option><option>Inactive</option></select></label>
          <label class="span-2">Remarks<textarea v-model="form.remarks" rows="3"></textarea></label>
          <p v-if="error" class="span-2 flash warning">{{ error }}</p>
          <div class="span-2 action-row">
            <button class="button secondary" type="button" @click="showForm = false">Cancel</button>
            <button class="button" type="submit">Save Account</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { apiGet, apiPost, apiPut } from '../api/client'

const bankAccounts = ref([])
const transactions = ref([])
const stats = ref({})
const showForm = ref(false)
const error = ref('')
const statusMessage = ref('')
const balanceResult = ref(null)
const LOCAL_TREASURY_BANKS_KEY = 'crm_treasury_bank_accounts'
const form = reactive(defaultAccount())

onMounted(loadData)

function defaultAccount() {
  return { id: null, account_number: '', account_name: '', bank_name: '', branch: '', ifsc: '', currency: 'INR', opening_balance: 0, account_type: '', legal_entity: '', status: 'Active', remarks: '' }
}

async function loadData() {
  const safe = async (fn) => {
    try { return await fn() } catch { return null }
  }
  const data = await safe(() => apiGet('/api/treasury/bank-accounts'))
  bankAccounts.value = mergeBankAccounts(data?.bank_accounts || data?.accounts || [], loadLocalBankAccounts())
  stats.value = data?.stats || {
    available_balance: bankAccounts.value.reduce((sum, account) => sum + Number(account.current_balance ?? account.balance ?? account.opening_balance ?? 0), 0),
    total_inflow: 0,
    total_outflow: 0,
    pending_payables: 0
  }
  transactions.value = data?.transactions || data?.statement || []
}

function openForm(account = null) {
  Object.assign(form, defaultAccount(), account || {})
  if (account?.ifsc_code && !form.ifsc) form.ifsc = account.ifsc_code
  if (account?.beneficiary_name && !form.account_name) form.account_name = account.beneficiary_name
  showForm.value = true
  error.value = ''
}

async function saveAccount() {
  error.value = ''
  statusMessage.value = ''
  try {
    if (form.id) await apiPut(`/api/treasury/bank-accounts/${form.id}`, form)
    else await apiPost('/api/treasury/bank-accounts', form)
    showForm.value = false
    await loadData()
  } catch (err) {
    if (String(err.message || '').includes('404')) {
      saveBankAccountLocally(form)
      showForm.value = false
      statusMessage.value = 'Bank account saved in Treasury locally because the backend treasury bank account endpoint is not available yet.'
      await loadData()
      return
    }
    error.value = err.message || 'Unable to save bank account.'
  }
}

async function checkBalance(account) {
  error.value = ''
  statusMessage.value = ''
  try {
    const data = await apiGet(`/api/treasury/bank-accounts/${account.id}/balance`)
    balanceResult.value = data
    await loadData()
  } catch (err) {
    error.value = err.message || 'Unable to check account balance.'
  }
}

function loadLocalBankAccounts() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_TREASURY_BANKS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveBankAccountLocally(account) {
  const existing = loadLocalBankAccounts()
  const payload = normalizeBankAccount({ ...account })
  if (!payload.id) payload.id = `local-bank-${Date.now()}`
  const index = existing.findIndex(item => String(item.id) === String(payload.id))
  if (index >= 0) existing.splice(index, 1, payload)
  else existing.unshift(payload)
  window.localStorage.setItem(LOCAL_TREASURY_BANKS_KEY, JSON.stringify(existing))
}

function mergeBankAccounts(primary, fallback) {
  const merged = []
  const seen = new Set()
  ;[...primary, ...fallback].forEach(account => {
    const normalized = normalizeBankAccount(account)
    const key = String(normalized.account_number || normalized.id || '')
    if (!key || seen.has(key)) return
    seen.add(key)
    merged.push(normalized)
  })
  return merged
}

function normalizeBankAccount(account) {
  const accountName = account.account_name || account.beneficiary_name || account.label || ''
  return {
    ...account,
    account_name: accountName,
    beneficiary_name: account.beneficiary_name || accountName,
    ifsc: account.ifsc || account.ifsc_code || '',
    ifsc_code: account.ifsc_code || account.ifsc || '',
    label: account.label || [accountName, account.bank_name, account.account_number ? `••${String(account.account_number).slice(-4)}` : ''].filter(Boolean).join(' · '),
    status: account.status || 'Active',
  }
}

function money(value, currency = 'INR') {
  return `${currency || 'INR'} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-'
}

function formatTimestamp(value) {
  return value ? new Date(value).toLocaleString() : '-'
}

function statusClass(status) {
  return (status || 'Active') === 'Active' ? 'status-pill active' : 'status-pill inactive'
}
</script>

<style scoped>
.bank-page { max-width: 1440px; margin: 0 auto; }
.metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; margin-bottom: 20px; }
.metric-card { border: 1px solid var(--line); background: var(--surface); border-radius: 8px; padding: 18px; }
.metric-card span { display: block; color: var(--muted); font-size: 12px; font-weight: 800; text-transform: uppercase; }
.metric-card strong { font-size: 24px; }
.block { display: block; }
.record-card { margin-top: 20px; }
.record-card h2 { font-size: 18px; margin-top: 0; }
.actions-cell { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.balance-check-card { align-items: center; display: flex; justify-content: space-between; gap: 18px; }
.balance-check-card strong { display: block; font-size: 26px; }
.last-check-transaction { border: 1px solid var(--line); border-radius: 8px; padding: 12px; min-width: 240px; }
.last-check-transaction span, .last-check-transaction small { color: var(--muted); display: block; font-size: 12px; font-weight: 800; text-transform: uppercase; }
.status-pill { border-radius: 999px; display: inline-flex; padding: 4px 10px; font-size: 11px; font-weight: 800; }
.status-pill.active { background: #dcfce7; color: #166534; }
.status-pill.inactive { background: #f1f5f9; color: #475569; }
</style>
