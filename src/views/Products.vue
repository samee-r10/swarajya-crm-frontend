<template>
  <div class="products-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Product Management</p>
        <h1>Products</h1>
        <p class="muted">Track product ownership, revenue, expense, invoices, customers, and profitability.</p>
      </div>
      <button class="button" type="button" @click="openProductForm()">New Product</button>
    </header>

    <p v-if="statusMessage" class="flash success">{{ statusMessage }}</p>

    <section v-if="!selectedProduct" class="product-catalog">
      <div class="catalog-header">
        <div>
          <h2>Product Portfolio</h2>
          <p class="muted">{{ filteredProducts.length }} product{{ filteredProducts.length === 1 ? '' : 's' }} available</p>
        </div>
        <input v-model="search" type="search" placeholder="Search products...">
      </div>
      <div class="product-card-grid">
        <button
          v-for="product in filteredProducts"
          :key="product.id || product.product_code"
          class="product-tile"
          type="button"
          @click="selectedProductKey = productKey(product)"
        >
          <span class="product-tile-main">
            <strong>{{ product.product_name || product.name }}</strong>
            <small>{{ product.product_code || product.code || 'No code' }} · {{ product.product_category || product.category || 'Uncategorized' }}</small>
          </span>
          <em :class="statusClass(product.product_status || product.status)">{{ product.product_status || product.status || 'Active' }}</em>
        </button>
      </div>
      <div v-if="filteredProducts.length === 0" class="empty-state">No products found.</div>
    </section>

    <section v-else class="workspace-grid">
      <aside class="product-list">
        <div class="list-header">
          <button class="back-link" type="button" @click="selectedProductKey = ''">All Products</button>
          <input v-model="search" type="search" placeholder="Search products...">
        </div>
        <button
          v-for="product in filteredProducts"
          :key="product.id || product.product_code"
          class="product-row"
          :class="{ active: selectedProductKey === productKey(product) }"
          type="button"
          @click="selectedProductKey = productKey(product)"
        >
          <span>
            <strong>{{ product.product_name || product.name }}</strong>
            <small>{{ product.product_code || product.code || 'No code' }} · {{ product.product_category || product.category || 'Uncategorized' }}</small>
          </span>
          <em :class="statusClass(product.product_status || product.status)">{{ product.product_status || product.status || 'Active' }}</em>
        </button>
        <div v-if="filteredProducts.length === 0" class="empty-state">No products found.</div>
      </aside>

      <section class="product-dashboard">
        <div class="summary-card">
          <div>
            <h2>{{ selectedProduct.product_name || selectedProduct.name }}</h2>
            <p class="muted small">{{ selectedProduct.product_code || selectedProduct.code || 'No code' }} · {{ selectedProduct.product_category || selectedProduct.category || 'Uncategorized' }}</p>
            <span :class="statusClass(selectedProduct.product_status || selectedProduct.status)">{{ selectedProduct.product_status || selectedProduct.status || 'Active' }}</span>
          </div>
          <div class="summary-actions">
            <button class="button secondary" type="button" @click="selectedProductKey = ''">Back</button>
            <button class="button secondary" type="button" @click="openProductForm(selectedProduct)">Edit</button>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card"><span>Total Revenue</span><strong>{{ money(selectedMetrics.revenue) }}</strong></div>
          <div class="kpi-card"><span>Total Expense</span><strong>{{ money(selectedMetrics.expense) }}</strong></div>
          <div class="kpi-card"><span>Net Profit / Loss</span><strong :class="{ negative: selectedMetrics.net < 0 }">{{ money(selectedMetrics.net) }}</strong></div>
          <div class="kpi-card"><span>Active Customers</span><strong>{{ selectedMetrics.customerCount }}</strong></div>
          <div class="kpi-card"><span>Total Invoice Amount</span><strong>{{ money(selectedMetrics.invoiceAmount) }}</strong></div>
          <div class="kpi-card"><span>Outstanding Amount</span><strong>{{ money(selectedMetrics.outstanding) }}</strong></div>
        </div>

        <div class="detail-grid">
          <div class="record-card">
            <h3>Customer Mapping</h3>
            <p class="muted small">Active customers include only Approved and DA Signed customers linked through invoices or ledger transactions.</p>
            <table class="record-table">
              <thead><tr><th>Customer</th><th class="right">Revenue</th></tr></thead>
              <tbody>
                <tr v-for="customer in selectedCustomers" :key="customer.id || customer.name">
                  <td>{{ customer.name }}</td>
                  <td class="right">{{ money(customer.revenue) }}</td>
                </tr>
                <tr v-if="selectedCustomers.length === 0"><td colspan="2" class="empty-row">No customer activity yet.</td></tr>
              </tbody>
            </table>
          </div>

          <div class="record-card">
            <h3>Product Analytics</h3>
            <div class="analytics-list">
              <div v-for="row in analyticsRows" :key="row.label">
                <span>{{ row.label }}</span>
                <strong>{{ row.value }}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>

    <div v-if="showForm" class="modal-overlay" @click.self="closeProductForm">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <p class="eyebrow">{{ productForm.id ? 'Edit Product' : 'New Product' }}</p>
            <h2>{{ productForm.product_name || 'Product Details' }}</h2>
          </div>
          <button class="modal-close" type="button" @click="closeProductForm">&times;</button>
        </div>
        <form class="form-grid" @submit.prevent="saveProduct">
          <label>Product Code<input v-model="productForm.product_code" required></label>
          <label>Product Name<input v-model="productForm.product_name" required></label>
          <label>Product Category<input v-model="productForm.product_category"></label>
          <label>Product Owner<input v-model="productForm.product_owner"></label>
          <label>Status<select v-model="productForm.product_status"><option>Active</option><option>Inactive</option></select></label>
          <label>Launch Date<input v-model="productForm.launch_date" type="date"></label>
          <label>Product Type<input v-model="productForm.product_type"></label>
          <label>Product Manager<input v-model="productForm.product_manager"></label>
          <label>Revenue Account<input v-model="productForm.product_revenue_account"></label>
          <label>Expense Account<input v-model="productForm.product_expense_account"></label>
          <label class="span-2">Product Description<textarea v-model="productForm.product_description" rows="3"></textarea></label>
          <label class="span-2">Remarks<textarea v-model="productForm.remarks" rows="3"></textarea></label>
          <p v-if="error" class="span-2 flash warning">{{ error }}</p>
          <div class="span-2 action-row">
            <button class="button secondary" type="button" @click="closeProductForm">Cancel</button>
            <button class="button" type="submit">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiGet, apiPost, apiPut } from '../api/client'

const products = ref([])
const transactions = ref([])
const invoices = ref([])
const customers = ref([])
const search = ref('')
const selectedProductKey = ref('')
const showForm = ref(false)
const error = ref('')
const statusMessage = ref('')
const LOCAL_PRODUCTS_KEY = 'crm_products_fallback'

const productForm = reactive(defaultProduct())

onMounted(loadData)

function defaultProduct() {
  return {
    id: null,
    product_code: '',
    product_name: '',
    product_category: '',
    product_description: '',
    product_owner: '',
    product_status: 'Active',
    launch_date: '',
    product_type: '',
    product_manager: '',
    product_revenue_account: '',
    product_expense_account: '',
    remarks: ''
  }
}

async function loadData() {
  const safe = async (fn) => {
    try { return await fn() } catch { return null }
  }
  const productData = await safe(() => apiGet('/api/products'))
  if (productData?.products) {
    await syncLocalProductsToBackend(productData.products)
  }
  const refreshedProductData = productData?.products ? await safe(() => apiGet('/api/products')) : null
  const options = await safe(() => apiGet('/api/options'))
  products.value = mergeProducts(refreshedProductData?.products || productData?.products || options?.products || [], productData?.products ? [] : loadLocalProducts())
  const txData = await safe(() => apiGet('/api/finance/transactions'))
  transactions.value = txData?.transactions || []
  const invoiceData = await safe(() => apiGet('/api/finance/invoices'))
  invoices.value = invoiceData?.invoices || []
  const customerData = await safe(() => apiGet('/api/customers'))
  customers.value = customerData?.customers || []
}

async function syncLocalProductsToBackend(existingProducts = []) {
  const localProducts = loadLocalProducts()
  if (!localProducts.length) return
  const existingCodes = new Set(existingProducts.map(product => String(product.product_code || product.code || '').trim()).filter(Boolean))
  let migrated = 0
  for (const product of localProducts) {
    const code = String(product.product_code || product.code || '').trim()
    if (!code || existingCodes.has(code)) continue
    const payload = { ...product }
    if (String(payload.id || '').startsWith('local-')) delete payload.id
    try {
      await apiPost('/api/products', payload)
      migrated += 1
    } catch (err) {
      if (!String(err.message || '').includes('already exists')) {
        return
      }
    }
  }
  window.localStorage.removeItem(LOCAL_PRODUCTS_KEY)
  if (migrated > 0) {
    statusMessage.value = `${migrated} locally saved product${migrated === 1 ? '' : 's'} moved to the backend.`
  }
}

const filteredProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return products.value
  return products.value.filter(product => [
    product.product_code,
    product.code,
    product.product_name,
    product.name,
    product.product_category,
    product.category,
    product.product_owner
  ].some(value => String(value || '').toLowerCase().includes(term)))
})

const selectedProduct = computed(() => products.value.find(product => productKey(product) === selectedProductKey.value) || null)
const activeProductCount = computed(() => products.value.filter(product => (product.product_status || product.status || 'Active') === 'Active').length)

const summary = computed(() => products.value.reduce((totals, product) => {
  const metrics = metricsFor(product)
  totals.revenue += metrics.revenue
  totals.expense += metrics.expense
  totals.net += metrics.net
  return totals
}, { revenue: 0, expense: 0, net: 0 }))

const selectedMetrics = computed(() => selectedProduct.value ? metricsFor(selectedProduct.value) : emptyMetrics())
const selectedCustomers = computed(() => selectedProduct.value ? customersFor(selectedProduct.value) : [])

const analyticsRows = computed(() => {
  const metrics = selectedMetrics.value
  return [
    { label: 'Monthly revenue', value: money(metrics.monthlyRevenue) },
    { label: 'Monthly expense', value: money(metrics.monthlyExpense) },
    { label: 'Profitability trend', value: metrics.net >= 0 ? 'Profitable' : 'Loss making' },
    { label: 'Customer growth', value: `${metrics.customerCount} active customer${metrics.customerCount === 1 ? '' : 's'}` },
    { label: 'Project association', value: `${metrics.projectCount} linked project${metrics.projectCount === 1 ? '' : 's'}` }
  ]
})

function productKey(product) {
  return String(product.id || product.product_id || product.product_code || product.code || '')
}

function productMatches(record, product) {
  const keys = [record.product_id, record.product_code, record.product_name, record.product]
  const productKeys = [product.id, product.product_id, product.product_code, product.code, product.product_name, product.name]
  return keys.some(key => key !== undefined && key !== null && productKeys.some(value => String(value || '') === String(key)))
}

function expenseTransactionMatchesProduct(record, product) {
  const keys = [record.product_id, record.product_code]
  const productKeys = [product.id, product.product_id, product.product_code, product.code]
  return keys.some(key => {
    if (key === undefined || key === null || String(key).trim() === '') return false
    return productKeys.some(value => value !== undefined && value !== null && String(value) === String(key))
  })
}

function emptyMetrics() {
  return { revenue: 0, expense: 0, net: 0, customerCount: 0, invoiceAmount: 0, outstanding: 0, monthlyRevenue: 0, monthlyExpense: 0, projectCount: 0 }
}

function metricsFor(product) {
  const productIncomeTransactions = transactions.value.filter(row => row.type === 'Income' && productMatches(row, product))
  const productExpenseTransactions = transactions.value.filter(row => row.type === 'Expense' && expenseTransactionMatchesProduct(row, product))
  const productInvoices = invoices.value.filter(row => productMatches(row, product))
  const revenue = productIncomeTransactions.reduce((sum, row) => sum + transactionBaseAmount(row), 0)
  const expense = productExpenseTransactions.reduce((sum, row) => sum + transactionBaseAmount(row), 0)
  const invoiceAmount = productInvoices.reduce((sum, row) => sum + Number(row.total_amount || 0), 0)
  const outstanding = productInvoices.reduce((sum, row) => sum + Math.max(0, Number(row.total_amount || 0) - Number(row.amount_paid || 0)), 0)
  const productActivity = [...productIncomeTransactions, ...productExpenseTransactions, ...productInvoices]
  const customerIds = new Set(productActivity.filter(isActiveCustomerActivity).map(row => customerKey(row)).filter(Boolean))
  const projectIds = new Set(productActivity.map(row => row.project_id || row.project_name).filter(Boolean))
  return {
    revenue,
    expense,
    net: revenue - expense,
    customerCount: customerIds.size,
    invoiceAmount,
    outstanding,
    monthlyRevenue: revenue,
    monthlyExpense: expense,
    projectCount: projectIds.size
  }
}

function customersFor(product) {
  const rows = [...transactions.value, ...invoices.value].filter(row => productMatches(row, product) && isActiveCustomerActivity(row))
  const map = new Map()
  rows.forEach(row => {
    const key = customerKey(row)
    if (!key) return
    const existing = map.get(key) || { id: key, name: row.customer_name || row.customer_company || `Customer #${key}`, revenue: 0 }
    if (row.type === 'Income' || row.invoice_number || row.total_amount) {
      existing.revenue += row.type === 'Income' ? transactionBaseAmount(row) : Number(row.total_amount || row.amount || 0)
    }
    map.set(key, existing)
  })
  return Array.from(map.values())
}

function transactionBaseAmount(row) {
  return Number(row.amount || row.subtotal || row.taxable_amount || row.total_amount || 0)
}

function customerKey(row) {
  return row.customer_id || row.customer_name || row.customer_company || ''
}

function isActiveCustomerActivity(row) {
  const customer = customerForActivity(row)
  const status = String(customer?.status || row.customer_status || row.customer_stage || '').trim().toLowerCase()
  return status === 'approved' || status === 'da signed'
}

function customerForActivity(row) {
  const id = row.customer_id
  if (id !== undefined && id !== null && id !== '') {
    const byId = customers.value.find(customer => String(customer.id) === String(id))
    if (byId) return byId
  }
  const name = String(row.customer_name || row.customer_company || '').trim().toLowerCase()
  if (!name) return null
  return customers.value.find(customer => String(customer.company_name || customer.name || '').trim().toLowerCase() === name)
}

function openProductForm(product = null) {
  Object.assign(productForm, defaultProduct(), product || {})
  if (product?.name && !productForm.product_name) productForm.product_name = product.name
  if (product?.code && !productForm.product_code) productForm.product_code = product.code
  showForm.value = true
  error.value = ''
}

function closeProductForm() {
  showForm.value = false
}

async function saveProduct() {
  error.value = ''
  statusMessage.value = ''
  try {
    if (productForm.id) {
      await apiPut(`/api/products/${productForm.id}`, productForm)
    } else {
      await apiPost('/api/products', productForm)
    }
    showForm.value = false
    await loadData()
  } catch (err) {
    if (String(err.message || '').includes('404')) {
      saveProductLocally(productForm)
      showForm.value = false
      statusMessage.value = 'Product saved locally because the backend /api/products endpoint is not available yet.'
      await loadData()
      return
    }
    error.value = err.message || 'Unable to save product.'
  }
}

function loadLocalProducts() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_PRODUCTS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveProductLocally(product) {
  const existing = loadLocalProducts()
  const payload = { ...product }
  if (!payload.id) payload.id = `local-${Date.now()}`
  const index = existing.findIndex(item => String(item.id) === String(payload.id))
  if (index >= 0) existing.splice(index, 1, payload)
  else existing.unshift(payload)
  window.localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(existing))
}

function mergeProducts(primary, fallback) {
  const merged = []
  const seen = new Set()
  ;[...primary, ...fallback].forEach(product => {
    const key = productKey(product)
    if (!key || seen.has(key)) return
    seen.add(key)
    merged.push(product)
  })
  return merged
}

function money(value) {
  return `INR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusClass(status) {
  return (status || 'Active') === 'Active' ? 'status-pill active' : 'status-pill inactive'
}
</script>

<style scoped>
.products-page { max-width: 1440px; margin: 0 auto; }
.metric-grid, .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px; }
.metric-card, .kpi-card { border: 1px solid var(--line); background: var(--surface); border-radius: 8px; padding: 18px; }
.metric-card span, .kpi-card span { display: block; color: var(--muted); font-size: 12px; font-weight: 800; text-transform: uppercase; }
.metric-card strong, .kpi-card strong { font-size: 24px; }
.negative { color: #dc2626; }
.product-catalog { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow-sm); padding: 20px; }
.catalog-header { align-items: center; display: flex; gap: 18px; justify-content: space-between; margin-bottom: 18px; }
.catalog-header h2 { font-size: 20px; margin: 0 0 4px; }
.catalog-header p { margin: 0; }
.catalog-header input { max-width: 360px; }
.product-card-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.product-tile { align-items: flex-start; background: #ffffff; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; display: flex; gap: 16px; justify-content: space-between; min-height: 118px; padding: 18px; text-align: left; transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s; }
.product-tile:hover { border-color: rgba(37, 99, 235, 0.45); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
.product-tile-main { min-width: 0; }
.product-tile strong { color: var(--heading); display: block; font-size: 18px; line-height: 1.25; }
.product-tile small { color: var(--muted); display: block; font-size: 13px; line-height: 1.45; margin-top: 8px; }
.workspace-grid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 20px; }
.product-list { border: 1px solid var(--line); border-radius: 8px; background: var(--surface); padding: 12px; align-self: start; }
.list-header { display: grid; gap: 10px; margin-bottom: 10px; }
.back-link { background: transparent; border: 0; color: var(--primary); cursor: pointer; font: inherit; font-weight: 850; padding: 4px 0; text-align: left; }
.back-link:hover { text-decoration: underline; }
.product-row { width: 100%; border: 1px solid transparent; background: transparent; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; gap: 10px; text-align: left; cursor: pointer; transition: background 0.18s, border-color 0.18s; }
.product-row.active, .product-row:hover { border-color: rgba(37, 99, 235, 0.48); background: #f8fbff; }
.product-row small { display: block; color: var(--muted); margin-top: 4px; }
.summary-card { align-items: flex-start; border: 1px solid var(--line); border-radius: 8px; padding: 22px 24px; background: var(--surface); display: flex; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
.summary-card h2 { font-size: 28px; margin: 0 0 6px; }
.summary-actions { align-items: center; display: flex; gap: 10px; }
.detail-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr); gap: 18px; }
.record-card h3 { margin-top: 0; }
.analytics-list { display: grid; gap: 12px; }
.analytics-list div { border: 1px solid var(--line); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; gap: 16px; }
.analytics-list span { color: var(--muted); font-weight: 800; }
.status-pill { border-radius: 999px; display: inline-flex; padding: 4px 10px; font-size: 11px; font-style: normal; font-weight: 800; }
.status-pill.active { background: #dcfce7; color: #166534; }
.status-pill.inactive { background: #f1f5f9; color: #475569; }
@media (max-width: 900px) {
  .workspace-grid, .detail-grid { grid-template-columns: 1fr; }
  .catalog-header { align-items: stretch; flex-direction: column; }
  .catalog-header input { max-width: none; }
  .summary-card,
  .summary-actions { align-items: stretch; flex-direction: column; }
}
</style>
