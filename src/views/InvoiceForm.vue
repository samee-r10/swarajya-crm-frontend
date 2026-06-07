<template>
  <div class="invoice-form-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Finance</p>
        <h1>{{ id ? 'Edit Invoice' : 'New Invoice' }}</h1>
        <p class="muted">Generate a new sales invoice for your customer.</p>
      </div>
    </header>

    <form class="invoice-form" @submit.prevent="save">
      <div class="form-grid record-card">
        <div class="span-2 card-section-title"><h2>Invoice Basic Info</h2></div>

        <label>Invoice Type
          <select v-model="form.invoice_type">
            <option>Normal Invoice</option>
            <option>Product Invoice</option>
          </select>
        </label>
        
        <label>Customer
          <select v-model="form.customer_id" required>
            <option value="">Select Customer</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.company_name }}</option>
          </select>
        </label>

        <label v-if="isProductInvoice">Product
          <select v-model="form.product_id" required>
            <option value="">Select Product</option>
            <option v-for="product in activeProducts" :key="product.id || product.product_code" :value="product.id || product.product_code">{{ productName(product) }}</option>
          </select>
        </label>

        <label>Project
          <select v-model="form.project_id" :required="isProductInvoice">
            <option value="">{{ isProductInvoice ? 'Select Project' : 'Select Project (Optional)' }}</option>
            <option v-for="p in filteredProjects" :key="p.id" :value="p.id">{{ p.project_name }}</option>
          </select>
        </label>

        <label>Account *
          <select v-model="form.account_id" required>
            <option value="">Select Account</option>
            <option v-for="a in incomeAccounts" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </label>
        
        <label>Invoice # (Auto if empty)<input v-model="form.invoice_number" placeholder="INV-0001"></label>
        
        <label>Invoice Date<input v-model="form.invoice_date" type="date" required></label>
        <label>Due Date<input v-model="form.due_date" type="date"></label>
        
        <label>Currency
          <select v-model="form.currency">
            <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }}</option>
          </select>
        </label>
        
        <label>Status
          <select v-model="form.status">
            <option v-for="s in statuses" :key="s">{{ s }}</option>
          </select>
        </label>
        
        <label v-if="form.status === 'Partially Paid'">Amount Paid ({{ form.currency }})
          <input type="number" v-model.number="form.amount_paid" step="0.01" min="0" :max="form.total_amount" placeholder="0.00">
        </label>
      </div>

      <div class="record-card items-card">
        <div class="card-section-title"><h2>Line Items</h2></div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%;">Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Tax %</th>
              <th class="right">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in form.items" :key="index">
              <td><input v-model="item.description" placeholder="Service or product description" required></td>
              <td><input v-model.number="item.qty" type="number" min="1" @input="updateItemTotal(index)"></td>
              <td><input v-model.number="item.price" type="number" step="0.01" @input="updateItemTotal(index)"></td>
              <td><input v-model.number="item.tax_percent" type="number" step="0.1" @input="updateItemTotal(index)"></td>
              <td class="right"><strong>{{ (item.total || 0).toFixed(2) }}</strong></td>
              <td><button type="button" class="icon-button delete" @click="removeItem(index)">&times;</button></td>
            </tr>
          </tbody>
        </table>
        <button type="button" class="button secondary add-item" @click="addItem">+ Add Item</button>

        <div class="totals-section">
          <div class="total-row"><span>Subtotal</span><span>{{ form.subtotal.toFixed(2) }}</span></div>
          <div class="total-row"><span>Tax Amount</span><span>{{ form.tax_amount.toFixed(2) }}</span></div>
          <div class="total-row grand-total"><span>Grand Total</span><span>{{ form.currency }} {{ form.total_amount.toFixed(2) }}</span></div>
        </div>
      </div>

      <div class="record-card">
        <div class="card-section-title"><h2>Additional Details</h2></div>
        <label>Bank account for payment details
          <select v-model="form.bank_account_id">
            <option value="">No payment details on invoice</option>
            <option v-for="b in activeBankAccounts" :key="b.id" :value="b.id">{{ bankAccountLabel(b) }}</option>
          </select>
        </label>
        <div v-if="paymentPreview" class="payment-preview span-2">
          <p class="preview-title">Payment details preview (shown below notes on invoice)</p>
          <p><strong>Name of Beneficiary for NEFT/RTGS:</strong> {{ paymentPreview.beneficiary_name }}</p>
          <p><strong>Name of Bank:</strong> {{ paymentPreview.bank_name }}</p>
          <p><strong>Account Number:</strong> {{ paymentPreview.account_number }}</p>
          <p><strong>IFSC Code:</strong> {{ paymentPreview.ifsc_code }}</p>
          <p><strong>Payment reference:</strong> {{ paymentPreview.payment_reference }}</p>
        </div>
        <label class="span-2">Notes & Terms<textarea v-model="form.notes" rows="4" placeholder="Payment terms, delivery notes, etc."></textarea></label>
      </div>

      <p v-if="error" class="flash warning">{{ error }}</p>

      <div class="action-row">
        <button type="button" class="button secondary" @click="router.back()">Cancel</button>
        <button type="submit" class="button">Save Invoice</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api/client'

const props = defineProps({ id: String })
const router = useRouter()
const customers = ref([])
const projects = ref([])
const products = ref([])
const accounts = ref([])
const bankAccounts = ref([])
const currencies = ref([])
const statuses = ['Draft', 'Sent', 'Approved', 'Partially Paid', 'Paid', 'Cancelled']
const error = ref('')
const LOCAL_PRODUCTS_KEY = 'crm_products_fallback'
const LOCAL_TREASURY_BANKS_KEY = 'crm_treasury_bank_accounts'

const form = reactive({
  invoice_type: 'Normal Invoice',
  customer_id: '',
  product_id: '',
  project_id: '',
  account_id: '',
  invoice_number: '',
  invoice_date: new Date().toISOString().split('T')[0],
  due_date: '',
  currency: 'INR',
  status: 'Draft',
  notes: '',
  bank_account_id: '',
  items: [
    { description: '', qty: 1, price: 0, tax_percent: 0, total: 0 }
  ],
  subtotal: 0,
  tax_amount: 0,
  total_amount: 0,
  amount_paid: 0
})

const incomeAccounts = computed(() => {
  return accounts.value.filter(account => {
    if (account.is_active === 0 || account.is_active === false) return false
    return account.show_in_income === 1 || account.show_in_income === true || (account.show_in_income === undefined && account.type === 'Revenue')
  })
})

const filteredProjects = computed(() => {
  let list = form.customer_id ? projects.value.filter(p => Number(p.customer_id) === Number(form.customer_id)) : projects.value
  if (isProductInvoice.value && form.product_id) {
    const mapped = list.filter(projectMatchesSelectedProduct)
    if (mapped.length) list = mapped
  }
  return list
})

const isProductInvoice = computed(() => form.invoice_type === 'Product Invoice')

const activeProducts = computed(() => {
  return products.value.filter(product => !['Inactive', 'Archived'].includes(product.product_status || product.status || 'Active'))
})

const activeBankAccounts = computed(() => {
  return bankAccounts.value.filter(bank => (bank.status || 'Active') === 'Active')
})

const paymentPreview = computed(() => {
  if (!form.bank_account_id) return null
  const bank = bankAccounts.value.find(b => Number(b.id) === Number(form.bank_account_id))
  if (!bank) return null
  const ref = form.invoice_number?.trim() || '(auto-generated on save)'
  return {
    beneficiary_name: bank.beneficiary_name || bank.account_name || bank.label,
    bank_name: bank.bank_name,
    account_number: bank.account_number,
    ifsc_code: bank.ifsc_code || bank.ifsc,
    payment_reference: ref,
  }
})

watch(() => form.customer_id, (newCust) => {
  if (newCust && form.project_id) {
    const proj = projects.value.find(p => Number(p.id) === Number(form.project_id))
    if (proj && Number(proj.customer_id) !== Number(newCust)) {
      form.project_id = ''
    }
  }
})

watch(() => form.product_id, () => {
  if (form.project_id) {
    const project = projects.value.find(p => Number(p.id) === Number(form.project_id))
    if (project && !projectMatchesSelectedProduct(project)) {
      form.project_id = ''
    }
  }
})

watch(() => form.invoice_type, (type) => {
  if (type === 'Normal Invoice') {
    form.product_id = ''
  }
})

onMounted(async () => {
  const options = await apiGet('/api/options')
  customers.value = options.customers || []
  projects.value = options.projects || []
  products.value = mergeProducts(options.products || [], loadLocalProducts())
  accounts.value = options.accounts || []
  currencies.value = options.currencies || []
  bankAccounts.value = await loadTreasuryBankAccounts()

  if (!props.id) {
    const salesRev = accounts.value.find(a => a.name === 'Sales Revenue')
    if (salesRev) form.account_id = salesRev.id
    const defaultBank = activeBankAccounts.value.find(b => b.is_default) || activeBankAccounts.value[0]
    if (defaultBank) form.bank_account_id = defaultBank.id
  }

  if (props.id) {
    const data = await apiGet(`/api/finance/invoices/${props.id}`)
    if (['Approved', 'Partially Paid', 'Paid'].includes(data.invoice?.status)) {
      alert('Approved invoices cannot be edited. Void this invoice and create a new one if correction is required.')
      router.replace(`/finance/invoices/${props.id}`)
      return
    }
    Object.assign(form, data.invoice)
    // Recalculate just in case
    calculateTotals()
  }
})

function addItem() {
  form.items.push({ description: '', qty: 1, price: 0, tax_percent: 0, total: 0 })
}

function removeItem(index) {
  if (form.items.length > 1) {
    form.items.splice(index, 1)
    calculateTotals()
  }
}

function updateItemTotal(index) {
  const item = form.items[index]
  const base = (item.qty || 0) * (item.price || 0)
  item.total = base + (base * (item.tax_percent || 0) / 100)
  calculateTotals()
}

function calculateTotals() {
  let sub = 0
  let tax = 0
  form.items.forEach(item => {
    const base = (item.qty || 0) * (item.price || 0)
    sub += base
    tax += (base * (item.tax_percent || 0) / 100)
  })
  form.subtotal = sub
  form.tax_amount = tax
  form.total_amount = sub + tax
}

async function save() {
  error.value = ''
  try {
    if (isProductInvoice.value && (!form.customer_id || !form.product_id || !form.project_id)) {
      error.value = 'Customer, Product, and Project are required for Product Invoice.'
      return
    }
    if (form.status === 'Paid') {
      form.amount_paid = form.total_amount
    } else if (form.status !== 'Partially Paid') {
      form.amount_paid = 0
    }
    
    if (props.id) {
      await apiPut(`/api/finance/invoices/${props.id}`, form)
      router.replace(`/finance/invoices/${props.id}`)
    } else {
      const res = await apiPost('/api/finance/invoices', form)
      router.replace(`/finance/invoices/${res.id}`)
    }
  } catch (err) {
    error.value = err.message
  }
}

function productName(product) {
  const code = product.product_code || product.code
  const name = product.product_name || product.name
  return code ? `${code} - ${name}` : name
}

function loadLocalProducts() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_PRODUCTS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function mergeProducts(primary, fallback) {
  const merged = []
  const seen = new Set()
  ;[...primary, ...fallback].forEach(product => {
    const key = String(product.id || product.product_id || product.product_code || product.code || '')
    if (!key || seen.has(key)) return
    seen.add(key)
    merged.push(product)
  })
  return merged
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
    const normalized = normalizeBankAccount(bank)
    const key = String(normalized.account_number || normalized.id || '')
    if (!key || seen.has(key)) return
    seen.add(key)
    merged.push(normalized)
  })
  return merged
}

function normalizeBankAccount(bank) {
  const accountName = bank.account_name || bank.beneficiary_name || bank.label || ''
  return {
    ...bank,
    account_name: accountName,
    beneficiary_name: bank.beneficiary_name || accountName,
    ifsc: bank.ifsc || bank.ifsc_code || '',
    ifsc_code: bank.ifsc_code || bank.ifsc || '',
    label: bank.label || [accountName, bank.bank_name, bank.account_number ? `••${String(bank.account_number).slice(-4)}` : ''].filter(Boolean).join(' · '),
    status: bank.status || 'Active',
  }
}

function bankAccountLabel(bank) {
  return bank.label || [bank.account_name || bank.beneficiary_name, bank.bank_name, bank.account_number ? `••${String(bank.account_number).slice(-4)}` : ''].filter(Boolean).join(' · ')
}

function projectMatchesSelectedProduct(project) {
  if (!form.product_id) return true
  return [project.product_id, project.product_code, project.product_name].some(value => value !== undefined && value !== null && String(value) === String(form.product_id))
}
</script>

<style scoped>
.invoice-form-page {
  max-width: 1000px;
  margin: 0 auto;
}

.card-section-title {
  margin-bottom: 24px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 8px;
}

.card-section-title h2 {
  font-size: 14px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.items-card {
  margin-top: 24px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th {
  text-align: left;
  padding: 12px 8px;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.items-table td {
  padding: 8px;
}

.items-table input {
  width: 100%;
  padding: 8px;
}

.right { text-align: right; }

.icon-button.delete {
  background: #fee2e2;
  color: #991b1b;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: none;
  cursor: pointer;
}

.add-item {
  margin-top: 16px;
}

.totals-section {
  margin-top: 32px;
  width: 300px;
  margin-left: auto;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.grand-total {
  border-top: 2px solid var(--line);
  margin-top: 8px;
  padding-top: 16px;
  font-weight: 800;
  font-size: 18px;
  color: var(--primary);
}

.action-row {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.payment-preview {
  margin-top: 8px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.7;
}

.payment-preview p { margin: 4px 0; }

.preview-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--muted);
  margin-bottom: 8px !important;
}
</style>
