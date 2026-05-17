<template>
  <section class="page-header"><div><p class="eyebrow">Finance</p><h1>New Transaction</h1></div></section>
  <form class="form-grid record-card" @submit.prevent="openPreview">
    <label>Date<input v-model="form.transaction_date" type="date" required></label>
    <label>Type<select v-model="form.type"><option>Income</option><option>Expense</option></select></label>
    <label>Account<select v-model="form.account_id" required><option value="">Select Account</option><option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option></select></label>
    <label v-if="form.type === 'Income'">Customer<select v-model="form.customer_id"><option value="">Select Customer</option><option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.company_name }}</option></select></label>
    <label v-if="form.type === 'Income'">Associated Project<select v-model="form.project_id"><option value="">Select Project</option><option v-for="project in filteredProjects" :key="project.id" :value="project.id">{{ project.project_name }}</option></select></label>
    <label v-else>Vendor<select v-model="form.vendor_id"><option value="">Select Vendor</option><option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select></label>
    <label>Currency<select v-model="form.currency"><option v-for="currency in currencies" :key="currency.code" :value="currency.code">{{ currency.code }}</option></select></label>
    <label>Amount<input v-model="form.amount" type="number" step="0.01" required></label>
    <label>CGST %<input v-model="form.cgst_percent" type="number" step="0.01"></label>
    <label>IGST %<input v-model="form.igst_percent" type="number" step="0.01"></label>
    <label>TDS %<input v-model="form.tds_percent" type="number" step="0.01"></label>
    <label>Category<input v-model="form.category"></label>
    <label class="span-2">Description<textarea v-model="form.description" rows="5"></textarea></label>
    <p v-if="error" class="span-2 flash warning">{{ error }}</p>
    <div class="span-2 action-row">
      <button class="button btn-animate" type="submit">Preview Posting</button>
    </div>
  </form>

  <!-- Glassmorphic Preview Modal -->
  <transition name="fade">
    <div v-if="showPreviewModal" class="preview-modal-overlay" @click.self="showPreviewModal = false">
      <div class="preview-modal-content card-premium">
        <header class="modal-header">
          <div>
            <p class="eyebrow">Finance · Posting Preview</p>
            <h2>Simulated Journal Voucher</h2>
          </div>
          <button type="button" class="close-btn" @click="showPreviewModal = false">×</button>
        </header>

        <main class="modal-body">
          <!-- Overview -->
          <div class="overview-grid">
            <div class="overview-item"><span>Date</span><strong>{{ form.transaction_date }}</strong></div>
            <div class="overview-item"><span>Type</span><strong>{{ form.type }}</strong></div>
            <div class="overview-item"><span>Account</span><strong>{{ selectedAccountName }}</strong></div>
            <div class="overview-item" v-if="form.type === 'Income'"><span>Customer Name</span><strong>{{ selectedPartyName }}</strong></div>
            <div class="overview-item" v-else><span>Vendor Name</span><strong>{{ selectedPartyName }}</strong></div>
            <div class="overview-item" v-if="form.category"><span>Category</span><strong>{{ form.category }}</strong></div>
            <div class="overview-item"><span>Currency</span><strong>{{ form.currency }}</strong></div>
          </div>

          <!-- Amount Breakdown -->
          <div class="breakdown-card">
            <h3>Calculated Entry Amounts</h3>
            <div class="breakdown-row"><span>Base Amount</span><strong>{{ money(form.amount) }}</strong></div>
            <div class="breakdown-row" v-if="computedCGST > 0"><span>CGST ({{ form.cgst_percent }}%)</span><strong>+ {{ money(computedCGST) }}</strong></div>
            <div class="breakdown-row" v-if="computedIGST > 0"><span>IGST ({{ form.igst_percent }}%)</span><strong>+ {{ money(computedIGST) }}</strong></div>
            <div class="breakdown-row" v-if="computedTDS > 0"><span>TDS ({{ form.tds_percent }}%)</span><strong class="negative">- {{ money(computedTDS) }}</strong></div>
            <div class="breakdown-row grand-total"><span>Total Posting Amount</span><strong>{{ money(computedTotal) }}</strong></div>
          </div>

          <!-- Double Entry Ledger simulated table -->
          <div class="ledger-preview-card">
            <h3>Simulated General Ledger Postings</h3>
            <table class="preview-ledger-table">
              <thead>
                <tr>
                  <th>Account Name</th>
                  <th class="right">Debit (Dr)</th>
                  <th class="right">Credit (Cr)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in simulatedLedger" :key="entry.account" :class="entry.debit ? 'debit-row' : 'credit-row'">
                  <td>{{ entry.account }}</td>
                  <td class="right mono debit-col"><span v-if="entry.debit">+ {{ money(entry.debit) }}</span><span v-else class="muted">—</span></td>
                  <td class="right mono credit-col"><span v-if="entry.credit">+ {{ money(entry.credit) }}</span><span v-else class="muted">—</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>

        <footer class="modal-footer">
          <button type="button" class="button secondary" @click="showPreviewModal = false">Cancel / Edit</button>
          <button type="button" class="button" @click="confirmAndPost">Confirm & Post Entry</button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { onMounted, reactive, ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost } from '../api/client'
const router = useRouter()
const accounts = ref([])
const customers = ref([])
const vendors = ref([])
const currencies = ref([])
const projects = ref([])
const error = ref('')
const form = reactive({ transaction_date: new Date().toISOString().slice(0, 10), type: 'Income', account_id: '', customer_id: '', project_id: '', vendor_id: '', currency: 'INR', amount: '', cgst_percent: 0, igst_percent: 0, tds_percent: 0, category: '', description: '' })

const showPreviewModal = ref(false)
const currencySymbolsMap = { USD: '$', INR: '₹', EUR: '€', GBP: '£' }

watch(() => form.type, (newType) => {
  if (newType === 'Income') {
    const salesRev = accounts.value.find(a => a.name === 'Sales Revenue')
    if (salesRev) form.account_id = salesRev.id
  } else {
    form.account_id = ''
  }
})

watch(() => form.project_id, (newProjId) => {
  if (newProjId) {
    const selected = projects.value.find(p => p.id === parseInt(newProjId))
    if (selected && selected.customer_id) {
      form.customer_id = selected.customer_id
    }
  }
})

const filteredProjects = computed(() => {
  if (!form.customer_id) return projects.value
  return projects.value.filter(p => p.customer_id === parseInt(form.customer_id))
})

onMounted(async () => {
  const options = await apiGet('/api/options')
  accounts.value = (options.accounts || []).filter(a => a.name !== 'Bank Account' && a.name !== 'Cash on Hand')
  customers.value = options.customers || []
  vendors.value = options.vendors || []
  currencies.value = options.currencies || []
  projects.value = options.projects || []

  if (form.type === 'Income') {
    const salesRev = accounts.value.find(a => a.name === 'Sales Revenue')
    if (salesRev) form.account_id = salesRev.id
  }
})

const computedCGST = computed(() => {
  const amt = parseFloat(form.amount) || 0
  const pct = parseFloat(form.cgst_percent) || 0
  return parseFloat((amt * (pct / 100)).toFixed(2))
})

const computedIGST = computed(() => {
  const amt = parseFloat(form.amount) || 0
  const pct = parseFloat(form.igst_percent) || 0
  return parseFloat((amt * (pct / 100)).toFixed(2))
})

const computedTDS = computed(() => {
  const amt = parseFloat(form.amount) || 0
  const pct = parseFloat(form.tds_percent) || 0
  return parseFloat((amt * (pct / 100)).toFixed(2))
})

const computedTotal = computed(() => {
  const amt = parseFloat(form.amount) || 0
  return parseFloat((amt + computedCGST.value + computedIGST.value - computedTDS.value).toFixed(2))
})

const selectedAccountName = computed(() => {
  if (!form.account_id) return 'Not Selected'
  const acc = accounts.value.find(a => a.id === parseInt(form.account_id))
  return acc ? acc.name : 'Unknown'
})

const selectedPartyName = computed(() => {
  if (form.type === 'Income') {
    if (!form.customer_id) return 'Generic Customer'
    const cust = customers.value.find(c => c.id === parseInt(form.customer_id))
    return cust ? cust.company_name : 'Unknown'
  } else {
    if (!form.vendor_id) return 'General Vendor'
    const vend = vendors.value.find(v => v.id === parseInt(form.vendor_id))
    return vend ? vend.name : 'Unknown'
  }
})

const simulatedLedger = computed(() => {
  const amt = parseFloat(form.amount) || 0
  const ledger = []
  
  if (form.type === 'Income') {
    // Total amount is debited to the selected Cash/Bank asset account
    ledger.push({
      account: `[Asset] ${selectedAccountName.value}`,
      debit: computedTotal.value,
      credit: 0
    })
    // Base amount is credited to Sales Revenue (or category matching account)
    ledger.push({
      account: `[Revenue] ${form.category || 'Sales Revenue'}`,
      debit: 0,
      credit: amt
    })
    // Tax credits if CGST / IGST present
    if (computedCGST.value > 0) {
      ledger.push({
        account: `[Liability] CGST Output Tax Payable`,
        debit: 0,
        credit: computedCGST.value
      })
    }
    if (computedIGST.value > 0) {
      ledger.push({
        account: `[Liability] IGST Output Tax Payable`,
        debit: 0,
        credit: computedIGST.value
      })
    }
    // TDS debit if TDS present (TDS Receivable asset)
    if (computedTDS.value > 0) {
      ledger.push({
        account: `[Asset] TDS Receivable`,
        debit: computedTDS.value,
        credit: 0
      })
    }
  } else {
    // Total amount is credited to the selected Cash/Bank asset account
    ledger.push({
      account: `[Asset] ${selectedAccountName.value}`,
      debit: 0,
      credit: computedTotal.value
    })
    // Base amount is debited to Operating Expenses (or category matching account)
    ledger.push({
      account: `[Expense] ${form.category || 'Operating Expenses'}`,
      debit: amt,
      credit: 0
    })
    // Tax debits if CGST / IGST present
    if (computedCGST.value > 0) {
      ledger.push({
        account: `[Asset] CGST Input Tax Credit`,
        debit: computedCGST.value,
        credit: 0
      })
    }
    if (computedIGST.value > 0) {
      ledger.push({
        account: `[Asset] IGST Input Tax Credit`,
        debit: computedIGST.value,
        credit: 0
      })
    }
    // TDS credit if TDS present (TDS Payable liability)
    if (computedTDS.value > 0) {
      ledger.push({
        account: `[Liability] TDS Payable`,
        debit: 0,
        credit: computedTDS.value
      })
    }
  }
  return ledger
})

function openPreview() {
  error.value = ''
  if (!form.transaction_date || !form.account_id || !form.amount) {
    error.value = 'Please fill out all required fields (Date, Account, Amount) before previewing.'
    return
  }
  showPreviewModal.value = true
}

async function confirmAndPost() {
  showPreviewModal.value = false
  await save()
}

function money(amount) {
  const sym = currencySymbolsMap[form.currency] || '$'
  const number = Number(amount || 0)
  return `${sym}${number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

async function save() {
  error.value = ''
  try {
    const data = await apiPost('/api/finance/transactions', form)
    router.push(`/finance/transactions/${data.id}`)
  } catch (err) {
    error.value = err.message
  }
}
</script>

<style scoped>
.btn-animate {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-animate:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
}

.btn-animate.secondary:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Glassmorphic Modal Overlay */
.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}

.preview-modal-content {
  background: var(--surface);
  border-radius: 16px;
  border: 1px solid var(--line);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 680px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 800;
  margin: 4px 0 0;
  color: var(--text);
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--muted);
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--primary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Overview grid */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  background: var(--surface-soft);
  padding: 16px;
  border-radius: 10px;
  border: 1px solid var(--line);
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.overview-item span {
  color: var(--muted);
  text-transform: uppercase;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.overview-item strong {
  color: var(--text);
}

/* Breakdown Card */
.breakdown-card {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 12px;
  padding: 18px;
}

.breakdown-card h3, .ledger-preview-card h3 {
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
  margin: 0 0 14px;
  letter-spacing: 0.8px;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px dashed var(--line);
}

.breakdown-row:last-of-type {
  border-bottom: none;
}

.breakdown-row.grand-total {
  font-size: 16px;
  font-weight: 800;
  color: var(--primary);
  border-top: 1.5px solid var(--line);
  padding-top: 12px;
}

.negative {
  color: #dc2626 !important;
}

/* Ledger Preview Table */
.ledger-preview-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 18px;
  background: var(--surface-soft);
}

.preview-ledger-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-ledger-table th {
  padding: 10px 12px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--muted);
  border-bottom: 2px solid var(--line);
  text-align: left;
}

.preview-ledger-table td {
  padding: 12px;
  font-size: 13.5px;
  border-bottom: 1px solid var(--line);
}

.preview-ledger-table tr:last-child td {
  border-bottom: none;
}

.preview-ledger-table th.right, .preview-ledger-table td.right {
  text-align: right;
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}

.debit-col {
  color: #16a34a;
  font-weight: 700;
}

.credit-col {
  color: #dc2626;
  font-weight: 700;
}

.debit-row td:first-child {
  border-left: 4px solid #16a34a;
}

.credit-row td:first-child {
  border-left: 4px solid #dc2626;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 18px 24px;
  border-top: 1px solid var(--line);
}

/* Fade animation */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
