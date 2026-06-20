<template>
  <div class="payables-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Treasury</p>
        <h1>Payables</h1>
        <p class="muted">Review expense obligations and deduct company fund only when paid.</p>
      </div>
      <div class="action-row">
        <button class="button secondary" type="button" @click="openRecipientAccountOptions">Recipient Bank Accounts</button>
        <button class="button secondary" type="button" @click="loadPayables">Refresh</button>
      </div>
    </header>

    <section class="metrics-grid">
      <div class="metric-card"><span>Company Fund</span><strong>{{ money(stats.company_fund_available) }}</strong></div>
      <div class="metric-card"><span>Total Payables</span><strong>{{ money(stats.total_payables) }}</strong></div>
      <div class="metric-card"><span>Pending Payments</span><strong>{{ money(stats.pending_payments) }}</strong></div>
      <div class="metric-card"><span>Paid</span><strong>{{ money(stats.paid_amount) }}</strong></div>
    </section>

    <section class="filters-bar">
      <input v-model="search" placeholder="Search payable, source, party...">
    </section>

    <section class="tabs-row">
      <button :class="{ active: activeTab === 'pending' }" type="button" @click="activeTab = 'pending'">
        Payment Pending <span>{{ pendingPayables.length }}</span>
      </button>
      <button :class="{ active: activeTab === 'paid' }" type="button" @click="activeTab = 'paid'">
        Paid <span>{{ paidPayables.length }}</span>
      </button>
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
          <tr v-for="payable in visiblePayables" :key="payable.id" @click="openPayment(payable)">
            <td><strong>{{ payable.payable_number }}</strong></td>
            <td>
              {{ payable.source_module }}
              <span class="muted block">{{ payable.source_reference }}</span>
              <button v-if="payable.transaction_id" class="link-button" type="button" @click.stop="openTransaction(payable.transaction_id)">Txn #{{ payable.transaction_id }}</button>
              <span v-else-if="paymentReference(payable)" class="muted block">Payment Ref: {{ paymentReference(payable) }}</span>
            </td>
            <td>{{ payable.party_name || '-' }}</td>
            <td>{{ formatDate(payable.transaction_date) }}</td>
            <td class="right">{{ money(payable.original_amount) }}</td>
            <td class="right">{{ money(payable.paid_amount) }}</td>
            <td class="right">{{ money(payable.outstanding_amount) }}</td>
            <td><span class="pill" :class="statusClass(payable.status)">{{ payable.status }}</span></td>
            <td class="right">
              <button v-if="payable.transaction_id" class="button secondary small" type="button" @click.stop="openTransaction(payable.transaction_id)">View Txn</button>
              <button v-if="['Pending','Partially Paid'].includes(payable.status)" class="button secondary small" type="button" @click.stop="openPayment(payable)">Mark Paid</button>
            </td>
          </tr>
          <tr v-if="visiblePayables.length === 0"><td colspan="9" class="empty-state">No {{ activeTab === 'pending' ? 'payment pending' : 'paid' }} payables found.</td></tr>
        </tbody>
      </table>
    </section>

    <div v-if="selectedPayable" class="modal-overlay" @click.self="selectedPayable = null">
      <div class="modal-content payable-modal">
        <div class="modal-header">
          <div>
            <p class="eyebrow">{{ canPaySelected ? 'Payable Settlement' : 'Payable Details' }}</p>
            <h2>{{ selectedPayable.payable_number }}</h2>
          </div>
          <button class="modal-close" type="button" @click="selectedPayable = null">&times;</button>
        </div>

        <section class="detail-grid">
          <div><span>Source</span><strong>{{ selectedPayable.source_module }}</strong></div>
          <div><span>Reference</span><strong>{{ selectedPayable.source_reference }}</strong></div>
          <div><span>Transaction ID / Ref</span><strong><button v-if="selectedPayable.transaction_id" class="link-button" type="button" @click="openTransaction(selectedPayable.transaction_id)">#{{ selectedPayable.transaction_id }}</button><span v-else>{{ paymentReference(selectedPayable) || '-' }}</span></strong></div>
          <div><span>Payment Date</span><strong>{{ formatDate(selectedPayable.last_payment_date) }}</strong></div>
          <div><span>Payment Mode</span><strong>{{ selectedPayable.last_payment_mode || selectedPayable.payment_mode || '-' }}</strong></div>
          <div><span>Paid To Account</span><strong>{{ selectedPayable.recipient_account_label || '-' }}</strong></div>
          <div><span>Outstanding</span><strong>{{ money(selectedPayable.outstanding_amount) }}</strong></div>
          <div><span>Status</span><strong>{{ selectedPayable.status }}</strong></div>
        </section>

        <form v-if="canPaySelected" class="form-grid" @submit.prevent="markPaid">
          <label>Payment Amount<input v-model.number="payment.payment_amount" type="number" min="0" step="0.01" required></label>
          <label>Payment Date<input v-model="payment.payment_date" type="date" required></label>
          <label>Payment Mode<select v-model="payment.payment_mode"><option value="">Select mode</option><option v-for="mode in paymentModes" :key="mode">{{ mode }}</option></select></label>
          <label>Paid From Bank Account<select v-model="payment.bank_account_id" required><option value="">Select account</option><option v-for="account in bankAccounts" :key="account.id" :value="account.id">{{ account.label }}</option></select></label>
          <label>Paid To Type<select v-model="payment.recipient_owner_type" required @change="handlePaymentRecipientTypeChange"><option v-for="type in recipientTypes" :key="type" :value="type">{{ type }}</option></select></label>
          <label>Paid To Name
            <select v-model="paymentRecipientOwnerKey" required>
              <option value="">Select {{ recipientOwnerLabel.toLowerCase() }}</option>
              <option v-for="owner in filteredRecipientOwners" :key="owner.key" :value="owner.key">{{ owner.name }}</option>
            </select>
          </label>
          <label>Paid To Account
            <select v-model="payment.recipient_account_id" :required="isRecipientAccountRequired" :disabled="!paymentRecipientOwnerKey">
              <option value="">Select recipient account</option>
              <option v-for="account in filteredRecipientAccounts" :key="account.id" :value="account.id">{{ account.label }}</option>
            </select>
          </label>
          <label>Payment Transaction ID / Reference<input v-model="payment.reference"></label>
          <label>Remarks<input v-model="payment.remarks"></label>
          <button class="button secondary span-2" type="button" @click="openRecipientAccountForm">Add Recipient Bank Account</button>
          <p v-if="error" class="span-2 flash warning">{{ error }}</p>
          <div class="span-2 action-row">
            <button class="button secondary" type="button" @click="selectedPayable = null">Cancel</button>
            <button class="button" type="submit">Confirm Payment</button>
          </div>
        </form>
        <div v-else class="action-row">
          <button class="button secondary" type="button" @click="selectedPayable = null">Close</button>
        </div>
      </div>
    </div>

    <div v-if="showRecipientAccounts" class="modal-overlay" @click.self="closeRecipientAccounts">
      <div class="modal-content payable-modal">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Payables</p>
            <h2>{{ recipientAccountsTitle }}</h2>
          </div>
          <button v-if="recipientAccountsMode" class="button secondary small" type="button" @click="recipientAccountsMode = ''">Options</button>
          <button class="modal-close" type="button" @click="closeRecipientAccounts">&times;</button>
        </div>
        <section v-if="!recipientAccountsMode" class="recipient-account-options">
          <button class="recipient-option-card" type="button" @click="showCreateRecipientAccount">
            <span>Create Account</span>
            <strong>Add a new payee bank account or UPI detail.</strong>
          </button>
          <button class="recipient-option-card" type="button" @click="showViewRecipientAccounts">
            <span>View Accounts</span>
            <strong>Review saved recipient bank accounts.</strong>
          </button>
        </section>
        <form v-if="recipientAccountsMode === 'create'" class="form-grid" @submit.prevent="saveRecipientAccount">
          <label>Payee Type<select v-model="recipientForm.owner_type" required @change="handleRecipientTypeChange"><option v-for="type in recipientTypes" :key="type" :value="type">{{ type }}</option></select></label>
          <label v-if="recipientForm.owner_type === 'Stakeholder'">Stakeholder<select v-model="recipientForm.owner_id" required @change="fillRecipientName"><option value="">Select stakeholder</option><option v-for="item in recipientOptions.stakeholders" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label v-else-if="recipientForm.owner_type === 'Channel Partner'">Channel Partner<select v-model="recipientForm.owner_id" required @change="fillRecipientName"><option value="">Select channel partner</option><option v-for="item in recipientOptions.partners" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label v-else-if="recipientForm.owner_type === 'Vendor'">Vendor<select v-model="recipientForm.owner_id" required @change="fillRecipientName"><option value="">Select vendor</option><option v-for="item in recipientOptions.vendors" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label v-else-if="recipientForm.owner_type === 'Employee'">Employee<select v-model="recipientForm.owner_name" required><option value="">Select employee</option><option v-for="item in recipientOptions.employees" :key="item.name" :value="item.name">{{ item.name }}</option></select></label>
          <label v-else>Payee Name<input v-model="recipientForm.owner_name" required></label>
          <label>Account Name<input v-model="recipientForm.account_name"></label>
          <label>Bank Name<input v-model="recipientForm.bank_name"></label>
          <label>Account Number<input v-model="recipientForm.account_number"></label>
          <label>IFSC<input v-model="recipientForm.ifsc"></label>
          <label>UPI ID<input v-model="recipientForm.upi_id"></label>
          <label class="span-2">Remarks<input v-model="recipientForm.remarks"></label>
          <p v-if="recipientError" class="span-2 flash warning">{{ recipientError }}</p>
          <div class="span-2 action-row">
            <button class="button secondary" type="button" @click="resetRecipientForm">Reset</button>
            <button class="button" type="submit">Save Recipient Account</button>
          </div>
        </form>
        <section v-if="recipientAccountsMode === 'view'" class="recipient-list">
          <div class="recipient-list-header">
            <h3>Saved Accounts</h3>
            <button class="button secondary small" type="button" @click="showCreateRecipientAccount">Create Account</button>
          </div>
          <table class="record-table">
            <thead><tr><th>Payee</th><th>Type</th><th>Bank</th><th>Account / UPI</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="account in recipientAccounts" :key="account.id">
                <td><strong>{{ account.owner_name }}</strong></td>
                <td>{{ account.owner_type }}</td>
                <td>{{ account.bank_name || '-' }}</td>
                <td>{{ account.account_number || account.upi_id || '-' }}</td>
                <td><span class="pill" :class="account.status === 'Active' ? 'status-success' : 'status-muted'">{{ account.status }}</span></td>
              </tr>
              <tr v-if="recipientAccounts.length === 0"><td colspan="5" class="empty-state">No recipient bank accounts added yet.</td></tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost } from '../api/client'

const router = useRouter()
const payables = ref([])
const stats = ref({})
const loading = ref(false)
const search = ref('')
const activeTab = ref('pending')
const selectedPayable = ref(null)
const error = ref('')
const paymentModes = ref([])
const bankAccounts = ref([])
const recipientAccounts = ref([])
const recipientOptions = ref({ stakeholders: [], partners: [], employees: [], vendors: [] })
const showRecipientAccounts = ref(false)
const recipientAccountsMode = ref('')
const recipientError = ref('')
const paymentRecipientOwnerKey = ref('')
const recipientTypes = ['Employee', 'Stakeholder', 'Channel Partner', 'Vendor', 'Other']
const LOCAL_TREASURY_BANKS_KEY = 'crm_treasury_bank_accounts'
const payment = reactive(defaultPayment())
const recipientForm = reactive(defaultRecipientForm())
const canPaySelected = computed(() => selectedPayable.value && ['Pending', 'Partially Paid'].includes(selectedPayable.value.status))

const filteredPayables = computed(() => {
  const term = search.value.toLowerCase()
  return payables.value.filter(payable => {
    const matchesSearch = !term || [payable.payable_number, payable.source_module, payable.source_reference, payable.party_name, payable.remarks, payable.transaction_id, paymentReference(payable)].some(value => String(value || '').toLowerCase().includes(term))
    return matchesSearch
  })
})

const pendingPayables = computed(() => filteredPayables.value.filter(payable => ['Pending', 'Partially Paid'].includes(payable.status)))
const paidPayables = computed(() => filteredPayables.value.filter(payable => payable.status === 'Paid'))
const visiblePayables = computed(() => activeTab.value === 'paid' ? paidPayables.value : pendingPayables.value)
const recipientOwnerLabel = computed(() => {
  if (payment.recipient_owner_type === 'Stakeholder') return 'stakeholder'
  if (payment.recipient_owner_type === 'Channel Partner') return 'channel partner'
  if (payment.recipient_owner_type === 'Employee') return 'employee'
  return 'payee'
})
const filteredRecipientOwners = computed(() => ownerOptionsForType(payment.recipient_owner_type))
const selectedRecipientOwner = computed(() => filteredRecipientOwners.value.find(option => option.key === paymentRecipientOwnerKey.value) || null)
const isVendorPayment = computed(() => payment.recipient_owner_type === 'Vendor' || paymentRecipientOwnerKey.value.startsWith('Vendor:'))
const isRecipientAccountRequired = computed(() => !isVendorPayment.value)
const recipientAccountsTitle = computed(() => {
  if (recipientAccountsMode.value === 'create') return 'Create Recipient Account'
  if (recipientAccountsMode.value === 'view') return 'Saved Recipient Accounts'
  return 'Recipient Bank Accounts'
})
const filteredRecipientAccounts = computed(() => {
  return recipientAccounts.value.filter(account => {
    if ((account.status || 'Active') !== 'Active') return false
    if (account.owner_type !== payment.recipient_owner_type) return false
    return accountMatchesOwner(account, paymentRecipientOwnerKey.value)
  })
})

onMounted(async () => {
  await Promise.all([loadPayables(), loadOptions()])
})

watch(paymentRecipientOwnerKey, () => {
  payment.recipient_account_id = ''
})

function defaultPayment() {
  return { payment_amount: 0, payment_date: new Date().toISOString().slice(0, 10), payment_mode: '', bank_account_id: '', recipient_owner_type: 'Employee', recipient_account_id: '', reference: '', remarks: '' }
}

function defaultRecipientForm() {
  return { owner_type: 'Employee', owner_id: '', owner_name: '', account_name: '', bank_name: '', account_number: '', ifsc: '', upi_id: '', remarks: '', status: 'Active' }
}

async function loadOptions() {
  const options = await apiGet('/api/options')
  paymentModes.value = options.payment_modes || []
  bankAccounts.value = await loadTreasuryBankAccounts()
  await loadRecipientAccounts()
}

async function loadRecipientAccounts() {
  const [data, vendorData] = await Promise.all([
    apiGet('/api/treasury/payee-bank-accounts'),
    apiGet('/api/finance/vendors'),
  ])
  recipientAccounts.value = data.accounts || []
  recipientOptions.value = {
    stakeholders: data.recipients?.stakeholders || [],
    partners: data.recipients?.partners || [],
    employees: data.recipients?.employees || [],
    vendors: data.recipients?.vendors || vendorData.vendors || [],
  }
}

async function loadTreasuryBankAccounts() {
  let treasuryAccounts = []
  try {
    const data = await apiGet('/api/treasury/bank-accounts')
    treasuryAccounts = data.bank_accounts || data.accounts || []
  } catch {
    treasuryAccounts = []
  }
  return mergeBankAccounts(treasuryAccounts, loadLocalBankAccounts())
}

function loadLocalBankAccounts() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_TREASURY_BANKS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function mergeBankAccounts(primary, fallback) {
  const merged = []
  const seen = new Set()
  ;[...primary, ...fallback].forEach(bank => {
    const accountName = bank.account_name || bank.beneficiary_name || bank.label || ''
    const normalized = {
      ...bank,
      account_name: accountName,
      label: bank.label || [accountName, bank.bank_name, bank.account_number ? `••${String(bank.account_number).slice(-4)}` : ''].filter(Boolean).join(' · '),
      status: bank.status || 'Active',
    }
    const key = String(normalized.account_number || normalized.id || '')
    if (!key || seen.has(key)) return
    seen.add(key)
    merged.push(normalized)
  })
  return merged.filter(bank => (bank.status || 'Active') === 'Active')
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
  selectedPayable.value = payable
  const recipientType = inferRecipientType(payable)
  Object.assign(payment, defaultPayment(), {
    payment_amount: payable.outstanding_amount || 0,
    recipient_owner_type: recipientType
  })
  paymentRecipientOwnerKey.value = inferRecipientOwnerKey(payable, recipientType)
  error.value = ''
}

function inferRecipientType(payable) {
  const text = [payable.source_module, payable.source_reference, payable.party_name, payable.remarks].join(' ').toLowerCase()
  if (text.includes('channel partner')) return 'Channel Partner'
  if (text.includes('stakeholder') || text.includes('owner')) return 'Stakeholder'
  if (text.includes('claim') || text.includes('employee')) return 'Employee'
  if (text.includes('vendor')) return 'Vendor'
  return 'Other'
}

function openTransaction(transactionId) {
  if (!transactionId) return
  router.push(`/finance/transactions/${transactionId}`)
}

function paymentReference(payable) {
  return payable?.last_payment_reference || payable?.payment_reference || payable?.reference || ''
}

async function markPaid() {
  if (!payment.bank_account_id) {
    error.value = 'Select the bank account used for this payable payment.'
    return
  }
  if (!paymentRecipientOwnerKey.value) {
    error.value = `Select the ${recipientOwnerLabel.value} paid to.`
    return
  }
  if (isRecipientAccountRequired.value && !payment.recipient_account_id) {
    error.value = 'Select the recipient account paid to.'
    return
  }
  error.value = ''
  try {
    await apiPost(`/api/treasury/payables/${selectedPayable.value.id}/payments`, paymentPayload())
    selectedPayable.value = null
    await loadPayables()
  } catch (err) {
    error.value = err.message
  }
}

function paymentPayload() {
  return {
    ...payment,
    recipient_account_id: isRecipientAccountRequired.value ? payment.recipient_account_id : '',
    recipient_owner_id: selectedRecipientOwner.value?.id || '',
    recipient_owner_name: selectedRecipientOwner.value?.name || '',
  }
}

function openRecipientAccountForm() {
  Object.assign(recipientForm, defaultRecipientForm(), { owner_type: payment.recipient_owner_type })
  applyRecipientOwnerToForm()
  showRecipientAccounts.value = true
  recipientAccountsMode.value = 'create'
  recipientError.value = ''
}

function openRecipientAccountOptions() {
  showRecipientAccounts.value = true
  recipientAccountsMode.value = ''
  recipientError.value = ''
}

function showCreateRecipientAccount() {
  recipientAccountsMode.value = 'create'
  recipientError.value = ''
}

function showViewRecipientAccounts() {
  recipientAccountsMode.value = 'view'
  recipientError.value = ''
}

function closeRecipientAccounts() {
  showRecipientAccounts.value = false
  recipientAccountsMode.value = ''
  recipientError.value = ''
}

function resetRecipientForm() {
  Object.assign(recipientForm, defaultRecipientForm())
  recipientError.value = ''
}

function handleRecipientTypeChange() {
  recipientForm.owner_id = ''
  recipientForm.owner_name = ''
}

function handlePaymentRecipientTypeChange() {
  paymentRecipientOwnerKey.value = ''
  payment.recipient_account_id = ''
}

function fillRecipientName() {
  if (recipientForm.owner_type === 'Stakeholder') {
    const item = recipientOptions.value.stakeholders.find(row => Number(row.id) === Number(recipientForm.owner_id))
    recipientForm.owner_name = item?.name || ''
  } else if (recipientForm.owner_type === 'Channel Partner') {
    const item = recipientOptions.value.partners.find(row => Number(row.id) === Number(recipientForm.owner_id))
    recipientForm.owner_name = item?.name || ''
  } else if (recipientForm.owner_type === 'Vendor') {
    const item = recipientOptions.value.vendors.find(row => Number(row.id) === Number(recipientForm.owner_id))
    recipientForm.owner_name = item?.name || ''
  }
}

async function saveRecipientAccount() {
  recipientError.value = ''
  try {
    await apiPost('/api/treasury/payee-bank-accounts', recipientForm)
    await loadRecipientAccounts()
    const latest = recipientAccounts.value.find(account =>
      account.owner_type === recipientForm.owner_type &&
      account.owner_name === recipientForm.owner_name &&
      ((recipientForm.account_number && account.account_number === recipientForm.account_number) || (recipientForm.upi_id && account.upi_id === recipientForm.upi_id))
    )
    if (latest && payment.recipient_owner_type === recipientForm.owner_type) {
      paymentRecipientOwnerKey.value = ownerKeyFromAccount(latest)
      payment.recipient_account_id = latest.id
    }
    resetRecipientForm()
    recipientAccountsMode.value = 'view'
  } catch (err) {
    recipientError.value = err.message || 'Unable to save recipient account.'
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
  if (['Cancelled', 'Reversed'].includes(status)) return 'status-danger'
  if (status === 'Partially Paid') return 'status-warning'
  return 'status-muted'
}

function ownerOptionsForType(type) {
  const sourceOptions = {
    Stakeholder: recipientOptions.value.stakeholders,
    'Channel Partner': recipientOptions.value.partners,
    Employee: recipientOptions.value.employees,
    Vendor: recipientOptions.value.vendors,
  }[type] || []

  const options = sourceOptions.map(item => ({
    id: item.id,
    name: item.name,
    key: ownerKey(type, item.id, item.name),
  }))

  recipientAccounts.value
    .filter(account => (account.status || 'Active') === 'Active' && account.owner_type === type)
    .forEach(account => {
      const key = ownerKeyFromAccount(account)
      const accountName = String(account.owner_name || '').trim().toLowerCase()
      if (!options.some(option => option.key === key || option.name.toLowerCase() === accountName)) {
        options.push({ id: account.owner_id, name: account.owner_name, key })
      }
    })

  return options.filter(option => option.name)
}

function inferRecipientOwnerKey(payable, type) {
  const partyName = String(payable.party_name || '').trim().toLowerCase()
  if (!partyName) return ''
  const match = ownerOptionsForType(type).find(option => option.name.toLowerCase() === partyName)
  return match?.key || ''
}

function applyRecipientOwnerToForm() {
  const owner = filteredRecipientOwners.value.find(option => option.key === paymentRecipientOwnerKey.value)
  if (!owner) return
  recipientForm.owner_id = owner.id || ''
  recipientForm.owner_name = owner.name
}

function accountMatchesOwner(account, key) {
  if (!key) return false
  if (ownerKeyFromAccount(account) === key) return true
  const owner = filteredRecipientOwners.value.find(option => option.key === key)
  if (!owner) return false
  return String(account.owner_name || '').trim().toLowerCase() === owner.name.toLowerCase()
}

function ownerKeyFromAccount(account) {
  return ownerKey(account.owner_type, account.owner_id, account.owner_name)
}

function ownerKey(type, id, name) {
  const cleanName = String(name || '').trim().toLowerCase()
  if (id !== undefined && id !== null && id !== '') return `${type}:id:${id}`
  return `${type}:name:${cleanName}`
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
.tabs-row { display: flex; gap: 8px; margin-bottom: 16px; }
.tabs-row button { border: 1px solid var(--line); background: var(--surface); border-radius: 8px; padding: 10px 14px; font-weight: 800; cursor: pointer; }
.tabs-row button.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.tabs-row span { margin-left: 8px; opacity: 0.75; }
.block { display: block; }
.payable-modal { max-width: 900px; width: min(900px, calc(100vw - 32px)); }
.detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 18px; }
.detail-grid div { border: 1px solid var(--line); border-radius: 8px; padding: 12px; background: var(--surface); }
.detail-grid span { display: block; color: var(--muted); font-size: 12px; font-weight: 800; text-transform: uppercase; }
.link-button { border: 0; background: transparent; color: var(--primary); padding: 0; font-weight: 800; cursor: pointer; }
.recipient-account-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; padding: 20px; }
.recipient-option-card { border: 1px solid var(--line); background: var(--surface); border-radius: 8px; box-shadow: var(--shadow-sm); cursor: pointer; display: grid; gap: 8px; min-height: 140px; padding: 20px; text-align: left; }
.recipient-option-card:hover { border-color: rgba(29, 95, 209, 0.35); background: var(--primary-soft); }
.recipient-option-card span { color: var(--primary); font-size: 12px; font-weight: 850; text-transform: uppercase; }
.recipient-option-card strong { color: var(--heading); font-size: 18px; line-height: 1.3; }
.recipient-list { margin-top: 22px; }
.recipient-list-header { align-items: center; display: flex; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.recipient-list h3 { margin: 0 0 10px; font-size: 16px; }
.recipient-list-header h3 { margin: 0; }

@media (max-width: 767px) {
  .recipient-account-options { grid-template-columns: 1fr; padding: 16px; }
  .recipient-list-header { align-items: stretch; flex-direction: column; }
}
</style>
