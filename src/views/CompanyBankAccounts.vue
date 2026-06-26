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
            <td>
              <button class="account-link" type="button" @click="openStatement(account)">
                <strong>{{ account.account_name }}</strong>
                <span class="muted block">{{ account.account_number }}</span>
              </button>
            </td>
            <td>{{ account.bank_name }}<span class="muted block">{{ account.branch || '-' }} · {{ account.ifsc || account.ifsc_code || '-' }}</span></td>
            <td>{{ account.currency || 'INR' }}</td>
            <td>{{ account.account_type || '-' }}</td>
            <td>{{ account.legal_entity || '-' }}</td>
            <td><span :class="statusClass(account.status)">{{ account.status || 'Active' }}</span></td>
            <td class="right">{{ money(account.current_balance ?? account.balance ?? account.opening_balance, account.currency) }}</td>
            <td class="right actions-cell">
              <button class="button secondary small" type="button" @click="openStatement(account)">Statement</button>
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

    <div v-if="selectedStatementAccount" class="modal-overlay" @click.self="closeStatement">
      <div class="modal-content statement-modal">
        <div class="statement-header">
          <div>
            <p class="statement-kicker">Bank Statement</p>
            <h2>{{ selectedStatementAccount.account_name }}</h2>
            <p>{{ selectedStatementAccount.bank_name }} · {{ selectedStatementAccount.account_number }}</p>
          </div>
          <div class="statement-header-balance">
            <span>Closing Balance</span>
            <strong>{{ money(statementClosingBalance, selectedStatementAccount.currency) }}</strong>
          </div>
          <button class="modal-close statement-close" type="button" @click="closeStatement">&times;</button>
        </div>

        <section class="statement-summary">
          <div class="summary-tile">
            <span>Opening Balance</span>
            <strong>{{ money(statementOpeningBalance, selectedStatementAccount.currency) }}</strong>
          </div>
          <div class="summary-tile credit">
            <span>Total Credited</span>
            <strong>{{ money(statementTotals.credit, selectedStatementAccount.currency) }}</strong>
          </div>
          <div class="summary-tile debit">
            <span>Total Debited</span>
            <strong>{{ money(statementTotals.debit, selectedStatementAccount.currency) }}</strong>
          </div>
          <div class="summary-tile closing">
            <span>Closing Balance</span>
            <strong>{{ money(statementClosingBalance, selectedStatementAccount.currency) }}</strong>
          </div>
        </section>

        <div v-if="statementLoading" class="vue-state">Loading statement...</div>
        <div v-else class="statement-table-wrap">
          <table class="record-table statement-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Description</th>
                <th class="right">Credit</th>
                <th class="right">Debit</th>
                <th class="right">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr class="statement-opening-row">
                <td colspan="5"><strong>Opening Balance</strong></td>
                <td class="right"><strong>{{ money(statementOpeningBalance, selectedStatementAccount.currency) }}</strong></td>
              </tr>
              <tr v-for="entry in statementRows" :key="entry.id || `${entry.reference}-${entry.date}-${entry.balance}`">
                <td class="statement-date">{{ formatDate(entry.date || entry.transaction_date) }}</td>
                <td class="statement-ref">{{ entry.reference || entry.transaction_reference || '-' }}</td>
                <td class="statement-desc">
                  <strong>{{ entry.transaction_type || entry.type || 'Transaction' }}</strong>
                  <span class="muted block">{{ entry.description || entry.remarks || '-' }}</span>
                </td>
                <td class="right positive">{{ entry.credit ? money(entry.credit, entry.currency || selectedStatementAccount.currency) : '-' }}</td>
                <td class="right negative">{{ entry.debit ? money(entry.debit, entry.currency || selectedStatementAccount.currency) : '-' }}</td>
                <td class="right statement-balance"><strong>{{ money(entry.balance, entry.currency || selectedStatementAccount.currency) }}</strong></td>
              </tr>
              <tr v-if="statementRows.length === 0">
                <td colspan="6" class="empty-row">No transactions for this bank account yet.</td>
              </tr>
              <tr class="statement-closing-row">
                <td colspan="5"><strong>Closing Balance</strong></td>
                <td class="right"><strong>{{ money(statementClosingBalance, selectedStatementAccount.currency) }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

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
import { computed, onMounted, reactive, ref } from 'vue'
import { apiGet, apiPost, apiPut } from '../api/client'

const bankAccounts = ref([])
const transactions = ref([])
const stats = ref({})
const showForm = ref(false)
const error = ref('')
const statusMessage = ref('')
const balanceResult = ref(null)
const selectedStatementAccount = ref(null)
const statementTransactions = ref([])
const statementLoading = ref(false)
const LOCAL_TREASURY_BANKS_KEY = 'crm_treasury_bank_accounts'
const form = reactive(defaultAccount())

onMounted(loadData)

const statementOpeningBalance = computed(() => Number(selectedStatementAccount.value?.opening_balance || 0))
const statementRows = computed(() => {
  let balance = statementOpeningBalance.value
  return [...statementTransactions.value]
    .sort((a, b) => new Date(a.date || a.transaction_date || 0) - new Date(b.date || b.transaction_date || 0))
    .map((entry) => {
      const credit = transactionCredit(entry, selectedStatementAccount.value)
      const debit = transactionDebit(entry, selectedStatementAccount.value)
      balance += credit - debit
      return { ...entry, credit, debit, balance }
    })
})
const statementTotals = computed(() => {
  return statementRows.value.reduce((totals, entry) => {
    totals.credit += Number(entry.credit || 0)
    totals.debit += Number(entry.debit || 0)
    return totals
  }, { credit: 0, debit: 0 })
})
const statementClosingBalance = computed(() => {
  return statementOpeningBalance.value + statementTotals.value.credit - statementTotals.value.debit
})

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

async function openStatement(account) {
  selectedStatementAccount.value = account
  statementTransactions.value = filterTransactionsForAccount(transactions.value, account)
  statementLoading.value = true
  error.value = ''
  try {
    const data = await apiGet(`/api/treasury/bank-accounts/${account.id}/statement`)
    const entries = data?.transactions || data?.statement || data?.entries || []
    if (Array.isArray(entries)) statementTransactions.value = entries
  } catch (err) {
    if (!String(err.message || '').includes('404')) {
      error.value = err.message || 'Unable to load statement.'
    }
  } finally {
    statementLoading.value = false
  }
}

function closeStatement() {
  selectedStatementAccount.value = null
  statementTransactions.value = []
  statementLoading.value = false
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

function filterTransactionsForAccount(entries, account) {
  return (entries || []).filter((entry) => {
    const directIds = [
      entry.bank_account_id,
      entry.account_id,
      entry.from_bank_account_id,
      entry.to_bank_account_id
    ].filter(value => value !== undefined && value !== null && value !== '')
    if (directIds.some(value => String(value) === String(account.id))) return true

    const entryAccount = String(entry.bank_account_name || entry.account_name || entry.bank_account || '').toLowerCase()
    const names = [account.account_name, account.label].filter(Boolean).map(value => String(value).toLowerCase())
    const accountNumber = account.account_number ? String(account.account_number) : ''
    return names.some(name => entryAccount.includes(name)) || (accountNumber && entryAccount.includes(accountNumber))
  })
}

function transactionCredit(entry, account) {
  if (account && String(entry.to_bank_account_id || '') === String(account.id)) {
    return Math.abs(Number(entry.transfer_amount ?? entry.amount ?? entry.transaction_amount ?? 0)) || 0
  }
  const amount = Number(entry.inflow ?? entry.credit ?? entry.deposit ?? entry.amount_credit ?? 0)
  return Math.abs(amount) || creditDebitFromSignedAmount(entry, 'credit')
}

function transactionDebit(entry, account) {
  if (account && String(entry.from_bank_account_id || '') === String(account.id)) {
    return Math.abs(Number(entry.transfer_amount ?? entry.amount ?? entry.transaction_amount ?? 0)) || 0
  }
  const amount = Number(entry.outflow ?? entry.debit ?? entry.withdrawal ?? entry.amount_debit ?? 0)
  return Math.abs(amount) || creditDebitFromSignedAmount(entry, 'debit')
}

function creditDebitFromSignedAmount(entry, side) {
  const amount = Number(entry.amount ?? entry.transaction_amount ?? 0)
  if (!amount) return 0
  const type = String(entry.transaction_type || entry.type || '').toLowerCase()
  const isDebit = type.includes('debit') || type.includes('outflow') || type.includes('expense') || type.includes('payment') || amount < 0
  const isCredit = type.includes('credit') || type.includes('inflow') || type.includes('income') || type.includes('receipt') || amount > 0
  if (side === 'debit' && isDebit) return Math.abs(amount)
  if (side === 'credit' && isCredit && !isDebit) return Math.abs(amount)
  return 0
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
.account-link {
  appearance: none;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 0;
  text-align: left;
}
.account-link:hover strong { color: var(--primary); text-decoration: underline; }
.actions-cell { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.balance-check-card { align-items: center; display: flex; justify-content: space-between; gap: 18px; }
.balance-check-card strong { display: block; font-size: 26px; }
.last-check-transaction { border: 1px solid var(--line); border-radius: 8px; padding: 12px; min-width: 240px; }
.last-check-transaction span, .last-check-transaction small { color: var(--muted); display: block; font-size: 12px; font-weight: 800; text-transform: uppercase; }
.statement-modal {
  border: 1px solid #dbe5f0;
  border-radius: 12px;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
  max-height: calc(100vh - 64px);
  max-width: 1180px;
  overflow: hidden;
  width: min(1180px, calc(100vw - 40px));
}
.statement-header {
  align-items: flex-start;
  background:
    linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  color: #ffffff;
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr) auto auto;
  padding: 28px 32px;
}
.statement-header h2 {
  color: #ffffff;
  font-size: 26px;
  line-height: 1.2;
  margin: 8px 0 6px;
}
.statement-header p {
  color: #cbd5e1;
  font-size: 14px;
  margin: 0;
}
.statement-kicker {
  color: #67e8f9 !important;
  font-size: 11px !important;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.statement-header-balance {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  min-width: 220px;
  padding: 14px 16px;
  text-align: right;
}
.statement-header-balance span {
  color: #cbd5e1;
  display: block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.statement-header-balance strong {
  color: #ffffff;
  display: block;
  font-size: 22px;
  margin-top: 4px;
  white-space: nowrap;
}
.statement-close {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #e2e8f0;
  height: 36px;
  position: static;
  width: 36px;
}
.statement-close:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}
.statement-summary {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 18px 20px;
}
.summary-tile {
  background: #ffffff;
  border: 1px solid #dbe5f0;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.045);
  padding: 16px 18px;
  position: relative;
}
.summary-tile::before {
  background: #64748b;
  border-radius: 999px;
  content: '';
  height: 3px;
  left: 18px;
  position: absolute;
  right: 18px;
  top: 0;
}
.summary-tile.credit::before { background: #16a34a; }
.summary-tile.debit::before { background: #dc2626; }
.summary-tile.closing::before { background: #2563eb; }
.summary-tile.closing {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.statement-summary span {
  color: #64748b;
  display: block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.statement-summary strong {
  color: #0f172a;
  display: block;
  font-size: 20px;
  margin-top: 8px;
}
.statement-table-wrap {
  max-height: min(520px, calc(100vh - 360px));
  overflow: auto;
}
.statement-table {
  border-collapse: separate;
  border-spacing: 0;
  min-width: 980px;
}
.statement-table thead th {
  background: #f1f5f9;
  border-bottom: 1px solid #dbe5f0;
  color: #64748b;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.06em;
  padding: 14px 18px;
  position: sticky;
  text-transform: uppercase;
  top: 0;
  z-index: 1;
}
.statement-table td {
  border-bottom: 1px solid #e8eef5;
  color: #1f2937;
  padding: 16px 18px;
  vertical-align: middle;
}
.statement-table tbody tr:hover td {
  background: #fbfdff;
}
.statement-date,
.statement-ref {
  color: #334155;
  font-weight: 650;
  white-space: nowrap;
}
.statement-ref {
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.statement-desc strong {
  color: #111827;
  display: block;
  margin-bottom: 3px;
}
.statement-balance {
  background: #fbfdff;
}
.statement-opening-row td,
.statement-closing-row td {
  background: #f8fafc !important;
  border-bottom: 1px solid #dbe5f0;
  font-weight: 800;
}
.statement-closing-row td {
  background: #eff6ff !important;
  border-top: 1px solid #bfdbfe;
  color: #0f172a;
}
.positive { color: #166534; }
.negative { color: #b91c1c; }
.status-pill { border-radius: 999px; display: inline-flex; padding: 4px 10px; font-size: 11px; font-weight: 800; }
.status-pill.active { background: #dcfce7; color: #166534; }
.status-pill.inactive { background: #f1f5f9; color: #475569; }
@media (max-width: 760px) {
  .balance-check-card { align-items: stretch; flex-direction: column; }
  .statement-modal {
    max-height: calc(100vh - 32px);
    width: calc(100vw - 24px);
  }
  .statement-header {
    grid-template-columns: minmax(0, 1fr) auto;
    padding: 22px;
  }
  .statement-header-balance {
    grid-column: 1 / -1;
    min-width: 0;
    text-align: left;
  }
  .statement-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .statement-table-wrap { max-height: min(520px, calc(100vh - 430px)); }
}
@media (max-width: 520px) {
  .statement-summary { grid-template-columns: 1fr; }
  .statement-header h2 { font-size: 22px; }
}
</style>
