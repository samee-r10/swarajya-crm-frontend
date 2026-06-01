<template>
  <section class="page-header"><div><p class="eyebrow">Finance</p><h1>New Transaction</h1></div></section>
  <form class="form-grid record-card" @submit.prevent="openPreview">
    <label>
      Posting Date
      <select v-model="postingDateOption">
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="custom">Custom date</option>
      </select>
    </label>
    <label v-if="postingDateOption === 'custom'">
      Custom Posting Date
      <input v-model="form.transaction_date" type="date" required>
    </label>
    <label>Type<select v-model="form.type"><option>Income</option><option>Expense</option></select></label>
    <label>Account<select v-model="form.account_id" required><option value="">Select Account</option><option v-for="account in filteredAccountsForDropdown" :key="account.id" :value="account.id">{{ accountLabel(account) }}</option></select></label>
    <label v-if="form.type === 'Income'">Customer<select v-model="form.customer_id"><option value="">Select Customer</option><option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.company_name }}</option></select></label>
    <label v-if="isSalesRevenueReceipt">Invoice Number
      <select v-model="form.invoice_id" :disabled="!form.customer_id || invoiceLoading" required>
        <option value="">{{ invoiceSelectPlaceholder }}</option>
        <option v-for="invoice in receivableInvoices" :key="invoice.id" :value="invoice.id">
          {{ invoiceLabel(invoice) }}
        </option>
      </select>
      <span v-if="invoiceHint" class="field-hint">{{ invoiceHint }}</span>
    </label>
    <label v-if="form.type === 'Income'">Associated Project<select v-model="form.project_id"><option value="">Select Project</option><option v-for="project in filteredProjects" :key="project.id" :value="project.id">{{ project.project_name }}</option></select></label>
    <label v-else>Vendor<select v-model="form.vendor_id"><option value="">Select Vendor</option><option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select></label>
    <label>Currency<select v-model="form.currency"><option v-for="currency in currencies" :key="currency.code" :value="currency.code">{{ currency.code }}</option></select></label>
    <label>Amount<input v-model="form.amount" type="number" step="0.01" required></label>
    <label>CGST %<input v-model="form.cgst_percent" type="number" step="0.01"></label>
    <label>IGST %<input v-model="form.igst_percent" type="number" step="0.01"></label>
    <label>TDS %<input v-model="form.tds_percent" type="number" step="0.01"></label>
    <label>Category<select v-model="form.category"><option value="">Select Category</option><option>Item</option><option>Service</option><option>Fixed Assets</option></select></label>
    <label v-if="form.category === 'Fixed Assets'">
      Current / Depreciated Value
      <input v-model="form.depreciation_value" type="number" step="0.01" placeholder="Enter current or depreciated value">
      <span class="field-hint">The present/book value of this asset after depreciation</span>
    </label>
    <label class="span-2">Description<textarea v-model="form.description" rows="5"></textarea></label>
    <label
      v-for="field in customTransactionFields"
      :key="field.api_name"
      :class="isSpan2(field) ? 'span-2' : ''"
    >
      {{ field.label }} <span v-if="field.is_required" style="color: #dc2626; margin-left: 2px;">*</span>

      <textarea
        v-if="field.field_type === 'Long Text'"
        v-model="form[field.api_name]"
        :required="field.is_required"
        rows="3"
        :placeholder="'Enter ' + field.label.toLowerCase() + '...'"
      ></textarea>

      <select
        v-else-if="field.field_type === 'Dropdown'"
        v-model="form[field.api_name]"
        :required="field.is_required"
      >
        <option value="">Select {{ field.label }}</option>
        <option v-for="opt in parseOptions(field.picklist_options)" :key="opt" :value="opt">{{ opt }}</option>
      </select>

      <input
        v-else-if="field.field_type === 'Checkbox'"
        type="checkbox"
        v-model="form[field.api_name]"
      >

      <input
        v-else-if="field.field_type === 'Number'"
        type="number"
        v-model="form[field.api_name]"
        :required="field.is_required"
        :placeholder="'Enter ' + field.label.toLowerCase() + '...'"
      >

      <input
        v-else-if="field.field_type === 'Date'"
        type="date"
        v-model="form[field.api_name]"
        :required="field.is_required"
      >

      <input
        v-else
        type="text"
        v-model="form[field.api_name]"
        :required="field.is_required"
        :placeholder="'Enter ' + field.label.toLowerCase() + '...'"
      >
    </label>
    <p v-if="error" class="span-2 flash warning">{{ error }}</p>
    <div class="span-2 action-row">
      <button v-if="props.isModal" class="button secondary btn-animate" type="button" @click="emit('cancel')">
        Cancel
      </button>
      <button class="button btn-animate" type="submit">Preview Posting</button>
    </div>
  </form>

  <!-- Full-page Posting Preview Modal -->
  <transition name="fade">
    <div v-if="showPreviewModal" class="preview-modal-overlay" @click.self="showPreviewModal = false">
      <div class="preview-modal-content">
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
            <div class="overview-item"><span>Posting Date</span><strong>{{ form.transaction_date }}</strong></div>
            <div class="overview-item"><span>Type</span><strong>{{ form.type }}</strong></div>
            <div class="overview-item"><span>Account</span><strong>{{ selectedAccountName }}</strong></div>
            <div class="overview-item" v-if="form.type === 'Income'"><span>Customer Name</span><strong>{{ selectedPartyName }}</strong></div>
            <div class="overview-item" v-if="selectedInvoice"><span>Invoice Number</span><strong>{{ selectedInvoice.invoice_number }}</strong></div>
            <div class="overview-item" v-if="form.type !== 'Income'"><span>Vendor Name</span><strong>{{ selectedPartyName }}</strong></div>
            <div class="overview-item" v-if="form.category"><span>Category</span><strong>{{ form.category }}</strong></div>
            <div class="overview-item" v-if="form.category === 'Fixed Assets' && form.depreciation_value"><span>Current Value</span><strong>{{ money(form.depreciation_value) }}</strong></div>
            <div class="overview-item"><span>Currency</span><strong>{{ form.currency }}</strong></div>
            <div
              v-for="field in customTransactionPreviewFields"
              :key="field.api_name"
              class="overview-item"
            >
              <span>{{ field.label }}</span><strong>{{ formatCustomFieldValue(field) }}</strong>
            </div>
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
          <button type="button" class="button secondary" :disabled="isPosting" @click="showPreviewModal = false">Cancel / Edit</button>
          <button type="button" class="button" :disabled="isPosting" @click="confirmAndPost">
            <span v-if="isPosting" class="btn-spinner"></span>
            {{ isPosting ? 'Posting...' : 'Confirm & Post Entry' }}
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { onMounted, reactive, ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost } from '../api/client'

const props = defineProps({
  isModal: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['save-success', 'cancel'])
const router = useRouter()
const accounts = ref([])
const customers = ref([])
const vendors = ref([])
const currencies = ref([])
const projects = ref([])
const receivableInvoices = ref([])
const invoiceLoading = ref(false)
const transactionFields = ref([])
const error = ref('')
const form = reactive({ transaction_date: new Date().toISOString().slice(0, 10), type: 'Income', account_id: '', customer_id: '', project_id: '', vendor_id: '', invoice_id: '', invoice_number: '', currency: 'INR', amount: '', cgst_percent: 0, igst_percent: 0, tds_percent: 0, category: '', depreciation_value: '', description: '' })
const postingDateOption = ref('today')

const showPreviewModal = ref(false)
const isPosting = ref(false)
const currencySymbolsMap = { USD: '$', INR: '₹', EUR: '€', GBP: '£' }

function offsetDate(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

watch(postingDateOption, (option) => {
  if (option === 'today') {
    form.transaction_date = offsetDate(0)
  } else if (option === 'yesterday') {
    form.transaction_date = offsetDate(-1)
  }
})

const customTransactionFields = computed(() => {
  return transactionFields.value.filter(field => !field.is_native)
})

const customTransactionPreviewFields = computed(() => {
  return customTransactionFields.value.filter(field => {
    const value = form[field.api_name]
    return field.field_type === 'Checkbox' || value !== undefined && value !== null && value !== ''
  })
})

function initialiseCustomFields(fields) {
  fields.forEach(field => {
    if (!(field.api_name in form)) {
      form[field.api_name] = field.field_type === 'Checkbox' ? false : ''
    }
  })
}

function isSpan2(field) {
  return field.field_type === 'Long Text'
}

function parseOptions(options) {
  if (!options) return []
  try {
    const parsed = JSON.parse(options)
    return Array.isArray(parsed) ? parsed : [options]
  } catch (e) {
    return options.split(',').map(s => s.trim()).filter(Boolean)
  }
}

function formatCustomFieldValue(field) {
  const value = form[field.api_name]
  if (field.field_type === 'Checkbox') return value ? 'Yes' : 'No'
  return value || '—'
}

watch(() => form.type, (newType) => {
  if (newType === 'Income') {
    const salesRev = accounts.value.find(a => a.name === 'Sales Revenue')
    if (salesRev) form.account_id = salesRev.id
  } else {
    form.account_id = ''
    clearInvoiceSelection()
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

watch([() => form.account_id, () => form.customer_id, () => form.type], () => {
  clearInvoiceSelection()
  loadReceivableInvoices()
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

  const transactionData = await apiGet('/api/finance/transactions')
  transactionFields.value = transactionData.fields || []
  initialiseCustomFields(customTransactionFields.value)

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

const selectedAccount = computed(() => {
  if (!form.account_id) return null
  return accounts.value.find(a => a.id === parseInt(form.account_id)) || null
})

const isSalesRevenueReceipt = computed(() => {
  return form.type === 'Income' && selectedAccount.value?.name === 'Sales Revenue'
})

const selectedInvoice = computed(() => {
  if (!form.invoice_id) return null
  return receivableInvoices.value.find(invoice => Number(invoice.id) === Number(form.invoice_id)) || null
})

const invoiceSelectPlaceholder = computed(() => {
  if (!form.customer_id) return 'Select customer first'
  if (invoiceLoading.value) return 'Loading invoice records...'
  if (receivableInvoices.value.length === 0) return 'No eligible invoices found'
  return 'Select invoice'
})

const invoiceHint = computed(() => {
  if (!isSalesRevenueReceipt.value) return ''
  if (!form.customer_id) return 'Select a customer to load approved, partially paid, or paid invoices.'
  if (!invoiceLoading.value && receivableInvoices.value.length === 0) {
    return 'Approved, Partially Paid, and Paid invoices for this customer and Sales Revenue account are shown.'
  }
  return ''
})

function accountLabel(account) {
  return account.gl_code ? `${account.gl_code} - ${account.name}` : account.name
}

function invoiceLabel(invoice) {
  return `${invoice.invoice_number} - ${invoice.currency} ${Number(invoice.balance_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due`
}

function clearInvoiceSelection() {
  form.invoice_id = ''
  form.invoice_number = ''
  receivableInvoices.value = []
}

async function loadReceivableInvoices() {
  if (!isSalesRevenueReceipt.value || !form.customer_id || !form.account_id) return
  invoiceLoading.value = true
  try {
    const params = new URLSearchParams({
      customer_id: form.customer_id,
      account_id: form.account_id
    })
    const data = await apiGet(`/api/finance/invoices/receivable?${params}`)
    receivableInvoices.value = data.invoices || []
  } catch (err) {
    error.value = err.message || 'Unable to load invoice records.'
  } finally {
    invoiceLoading.value = false
  }
}

watch(selectedInvoice, (invoice) => {
  form.invoice_number = invoice?.invoice_number || ''
  if (invoice?.project_id && !form.project_id) {
    form.project_id = invoice.project_id
  }
  if (invoice?.currency) {
    form.currency = invoice.currency
  }
})

const filteredAccountsForDropdown = computed(() => {
  if (form.type === 'Income') {
    return accounts.value.filter(account => accountAvailableFor(account, 'Income'))
  } else {
    return accounts.value.filter(account => accountAvailableFor(account, 'Expense'))
  }
})

function accountAvailableFor(account, transactionType) {
  if (!account || account.is_active === 0 || account.is_active === false) return false
  if (transactionType === 'Income') {
    return account.show_in_income === 1 || account.show_in_income === true || (account.show_in_income === undefined && account.type === 'Revenue')
  }
  return account.show_in_expense === 1 || account.show_in_expense === true || (account.show_in_expense === undefined && account.type === 'Expense')
}

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
    // Total amount is debited to Bank Account asset
    ledger.push({
      account: `[Asset] Bank Account`,
      debit: computedTotal.value,
      credit: 0
    })
    // Base amount is credited to selected Revenue account
    const revenueAccName = selectedAccountName.value !== 'Not Selected' ? selectedAccountName.value : 'Sales Revenue'
    ledger.push({
      account: `[Revenue] ${revenueAccName}${form.category ? ` (${form.category})` : ''}`,
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
    // Total amount is credited to Bank Account asset
    ledger.push({
      account: `[Asset] Bank Account`,
      debit: 0,
      credit: computedTotal.value
    })
    // Base amount is debited to selected Expense account
    const expenseAccName = selectedAccountName.value !== 'Not Selected' ? selectedAccountName.value : 'Operating Expenses'
    ledger.push({
      account: `[Expense] ${expenseAccName}${form.category ? ` (${form.category})` : ''}`,
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
  if (isSalesRevenueReceipt.value && !form.invoice_id) {
    error.value = 'Please select the invoice number for this Sales Revenue receipt.'
    return
  }
  showPreviewModal.value = true
}

async function confirmAndPost() {
  if (isPosting.value) return
  isPosting.value = true
  error.value = ''
  try {
    const data = await apiPost('/api/finance/transactions', form)
    showPreviewModal.value = false
    isPosting.value = false
    if (props.isModal) {
      emit('save-success', data.id)
    } else {
      router.replace(`/finance/transactions/${data.id}?posted=true`)
    }
  } catch (err) {
    isPosting.value = false
    error.value = err.message
    showPreviewModal.value = false
  }
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
    if (props.isModal) {
      emit('save-success', data.id)
    } else {
      router.replace(`/finance/transactions/${data.id}`)
    }
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

.field-hint {
  display: block;
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
  font-style: italic;
}

.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--surface, #ffffff);
  z-index: 9999;
}

.preview-modal-content {
  background: var(--surface);
  min-height: 100vh;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.22s ease-out;
}

@keyframes slideIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px clamp(20px, 4vw, 56px);
  border-bottom: 1px solid var(--line);
  background: #ffffff;
  flex-shrink: 0;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 800;
  margin: 4px 0 0;
  color: var(--text);
}

.close-btn {
  align-items: center;
  background: var(--surface-soft, #f8fafc);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
  cursor: pointer;
  display: inline-flex;
  font-size: 24px;
  height: 40px;
  justify-content: center;
  line-height: 1;
  transition: color 0.2s;
  width: 40px;
}

.close-btn:hover {
  background: #fff7ed;
  border-color: var(--primary);
  color: var(--primary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 28px clamp(20px, 4vw, 56px) 96px;
  display: grid;
  grid-template-columns: minmax(280px, 0.8fr) minmax(420px, 1.2fr);
  align-content: start;
  gap: 24px;
  background: var(--surface-soft, #f8fafc);
}

/* Overview grid */
.overview-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  background: var(--surface);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--line);
  align-self: start;
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
  overflow-wrap: anywhere;
}

/* Breakdown Card */
.breakdown-card {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
  padding: 22px;
  align-self: start;
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
  border-radius: 8px;
  padding: 22px;
  background: var(--surface);
  grid-column: 1 / -1;
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
  padding: 18px clamp(20px, 4vw, 56px);
  border-top: 1px solid var(--line);
  background: #ffffff;
  box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.08);
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .modal-body {
    grid-template-columns: 1fr;
    padding-bottom: 116px;
  }

  .ledger-preview-card {
    grid-column: auto;
  }

  .modal-header,
  .modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .modal-footer {
    align-items: stretch;
    flex-direction: column-reverse;
  }
}

/* Fade animation */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
