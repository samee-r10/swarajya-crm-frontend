<template>
  <div class="ledger-container">
    <header class="page-header">
      <div>
        <p class="eyebrow">Finance Module</p>
        <h1>Transaction Ledger</h1>
        <p class="muted">Monitor and manage all financial inflows and outflows.</p>
      </div>
      <div class="header-actions" style="display: flex; align-items: center; gap: 20px;">
        <!-- Currency View Toggle Selection -->
        <div class="currency-toggle-wrap" style="display: flex; align-items: center; background: var(--surface); border: 1px solid var(--line); padding: 4px 12px; border-radius: 30px;">
          <span class="muted small" style="font-weight: 700; margin-right: 8px; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Currency:</span>
          <div class="toggle-buttons" style="display: flex; background: #f1f5f9; padding: 2px; border-radius: 20px;">
            <button 
              type="button" 
              class="toggle-btn" 
              :class="{ active: viewCurrency === 'USD' }" 
              @click="viewCurrency = 'USD'"
              style="border: none; background: none; padding: 6px 16px; font-size: 11px; font-weight: 800; cursor: pointer; border-radius: 18px; transition: all 0.2s;"
            >
              USD
            </button>
            <button 
              type="button" 
              class="toggle-btn" 
              :class="{ active: viewCurrency === 'INR' }" 
              @click="viewCurrency = 'INR'"
              style="border: none; background: none; padding: 6px 16px; font-size: 11px; font-weight: 800; cursor: pointer; border-radius: 18px; transition: all 0.2s;"
            >
              INR
            </button>
          </div>
        </div>

        <button class="button secondary" @click="exportData">
          <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/></svg>
          Export
        </button>
        <RouterLink class="button" to="/finance/transactions/new">
          <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
          New Transaction
        </RouterLink>
      </div>
    </header>

    <!-- Financial Summary -->
    <section v-if="!loading" class="summary-bar">
      <div class="summary-card income">
        <span class="label">Total Inflow</span>
        <strong class="value">+ {{ money(viewCurrency, totals.income) }}</strong>
        <span class="trend">Cash / Bank Received</span>
      </div>
      <div class="summary-card expense">
        <span class="label">Total Outflow</span>
        <strong class="value">- {{ money(viewCurrency, totals.expense) }}</strong>
        <span class="trend">Business Expenses</span>
      </div>
      <div class="summary-card balance">
        <span class="label">Net Cash Flow</span>
        <strong class="value" :class="{ 'positive': totals.balance >= 0, 'negative': totals.balance < 0 }">
          {{ totals.balance >= 0 ? '+' : '-' }} {{ money(viewCurrency, Math.abs(totals.balance)) }}
        </strong>
        <span class="trend">Real-time Balance</span>
      </div>
    </section>

    <!-- Horizontal Filter Bar -->
    <section class="filter-bar">
      <div class="filter-group search">
        <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        <input v-model="filters.search" type="text" placeholder="Search by description or party...">
      </div>
      <div class="filter-group">
        <label>Type:</label>
        <select v-model="filters.type">
          <option value="All">All Transactions</option>
          <option value="Income">Inflow (Income)</option>
          <option value="Expense">Outflow (Expense)</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Sort By:</label>
        <select v-model="filters.sort">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amount-high">Amount (High to Low)</option>
          <option value="amount-low">Amount (Low to High)</option>
        </select>
      </div>
    </section>

    <!-- Ledger Table -->
    <section v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Synchronizing ledger...</p>
    </section>
    
    <section v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </section>

    <section v-else class="table-container">
      <table class="ledger-table">
        <thead>
          <tr>
            <th width="100">ID</th>
            <th width="140">Date</th>
            <th width="120">Status</th>
            <th>Description & Party</th>
            <th>Account</th>
            <th class="right">Base Amount</th>
            <th class="right">Tax/TDS</th>
            <th class="right">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transaction in paginatedTransactions" :key="transaction.id" @click="goToDetail(transaction.id)">
            <td class="id-col">#{{ transaction.id }}</td>
            <td class="date-col">{{ formatDate(transaction.transaction_date) }}</td>
            <td>
              <span v-if="transaction.status === 'Reversed'" class="pill" style="background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; font-weight: 800;">
                Reversed
              </span>
              <span v-else class="pill" :class="transaction.type === 'Income' ? 'status' : 'stage'">
                {{ transaction.type }}
              </span>
            </td>
            <td>
              <div class="party-info">
                <strong>{{ transaction.category || 'Uncategorized' }}</strong>
                <span class="party-label">{{ partyLabel(transaction) }}</span>
                <p v-if="transaction.description" class="muted small-desc">{{ transaction.description }}</p>
              </div>
            </td>
            <td>{{ transaction.account_name }}</td>
            <td class="right money-cell" :class="amountClass(transaction)">
              {{ money(viewCurrency, convertAmount(transaction.amount, transaction.currency, transaction.transaction_date)) }}
            </td>
            <td class="right">
              <div v-if="hasTax(transaction)" class="tax-info">
                <span v-if="transaction.cgst_amount">C: {{ money(viewCurrency, convertAmount(transaction.cgst_amount, transaction.currency, transaction.transaction_date)) }}</span>
                <span v-if="transaction.igst_amount">I: {{ money(viewCurrency, convertAmount(transaction.igst_amount, transaction.currency, transaction.transaction_date)) }}</span>
                <span v-if="transaction.tds_amount" class="negative">TDS: -{{ money(viewCurrency, convertAmount(transaction.tds_amount, transaction.currency, transaction.transaction_date)) }}</span>
              </div>
              <span v-else class="muted">--</span>
            </td>
            <td class="right money-cell total-col" :class="amountClass(transaction)">
              {{ transaction.type === 'Income' ? '+' : '-' }} {{ money(viewCurrency, convertAmount(transaction.total_amount || transaction.amount, transaction.currency, transaction.transaction_date)) }}
            </td>
          </tr>
          <tr v-if="filteredTransactions.length === 0">
            <td colspan="8" class="empty-row">No transactions match your filters.</td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="totalPages > 1" class="pagination-bar">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1" 
          @click="currentPage--"
        >
          Previous
        </button>
        <span class="pagination-info">Page {{ currentPage }} of {{ totalPages }} ({{ filteredTransactions.length }} records)</span>
        <button 
          class="pagination-btn" 
          :disabled="currentPage === totalPages" 
          @click="currentPage++"
        >
          Next
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '../api/client'

const router = useRouter()
const transactions = ref([])
const loading = ref(true)
const error = ref('')

const viewCurrency = ref('USD')
const exchangeRates = ref({
  INR: {
    default: 95.0,
    monthly: {}
  }
})

const filters = reactive({
  search: '',
  type: 'All',
  sort: 'newest'
})

const currencySymbols = reactive({ USD: '$', INR: '₹', EUR: '€', GBP: '£' })

onMounted(async () => {
  try {
    const data = await apiGet('/api/finance/transactions')
    transactions.value = data.transactions || []
  } catch (err) {
    error.value = 'Unable to load transactions. Please check your connection.'
  } finally {
    loading.value = false
  }
  
  try {
    const ratesData = await apiGet('/api/settings/exchange-rates')
    if (ratesData && ratesData.INR) {
      exchangeRates.value = ratesData
    }
  } catch (err) {
    console.error("Failed to load exchange rates", err)
  }
  
  try {
    const curData = await apiGet('/api/settings/currencies')
    if (curData && Array.isArray(curData)) {
      curData.forEach(c => {
        currencySymbols[c.code] = c.symbol
      })
    }
  } catch (e) {
    console.error("Failed to load dynamic currencies:", e)
  }
})

function convertAmount(amount, fromCurrency, transactionDateStr) {
  const target = viewCurrency.value
  const numAmount = Number(amount) || 0
  if (fromCurrency === target) return numAmount
  
  const month = transactionDateStr ? transactionDateStr.substring(0, 7) : ''
  let inrRate = exchangeRates.value.INR.default || 95.0
  if (month && exchangeRates.value.INR.monthly && exchangeRates.value.INR.monthly[month]) {
    inrRate = exchangeRates.value.INR.monthly[month]
  }
  
  if (fromCurrency === 'USD' && target === 'INR') {
    return numAmount * inrRate
  } else if (fromCurrency === 'INR' && target === 'USD') {
    return numAmount / inrRate
  }
  
  return numAmount
}

const totals = computed(() => {
  let income = 0
  let expense = 0
  // Exclude reversed entries from the summary totals
  transactions.value.filter(t => t.status !== 'Reversed').forEach(t => {
    const amt = parseFloat(t.total_amount || t.amount || 0)
    const converted = convertAmount(amt, t.currency, t.transaction_date)
    if (t.type === 'Income') income += converted
    else expense += converted
  })
  return { income, expense, balance: income - expense }
})

const filteredTransactions = computed(() => {
  let result = [...transactions.value]
  
  if (filters.type !== 'All') {
    result = result.filter(t => t.type === filters.type)
  }
  
  if (filters.search) {
    const term = filters.search.toLowerCase()
    result = result.filter(t => 
      (t.description || '').toLowerCase().includes(term) || 
      (t.category || '').toLowerCase().includes(term) ||
      (t.customer_name || '').toLowerCase().includes(term) ||
      (t.vendor_name || '').toLowerCase().includes(term)
    )
  }
  
  result.sort((a, b) => {
    if (filters.sort === 'newest') return new Date(b.transaction_date) - new Date(a.transaction_date)
    if (filters.sort === 'oldest') return new Date(a.transaction_date) - new Date(b.transaction_date)
    const amtA = parseFloat(a.total_amount || a.amount)
    const amtB = parseFloat(b.total_amount || b.amount)
    if (filters.sort === 'amount-high') return amtB - amtA
    if (filters.sort === 'amount-low') return amtA - amtB
    return 0
  })
  
  return result
})

const currentPage = ref(1)
const itemsPerPage = 10

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage))

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredTransactions.value.slice(start, end)
})

watch(filters, () => {
  currentPage.value = 1
})

function partyLabel(transaction) {
  let label = transaction.type === 'Income' ? (transaction.customer_name || 'Generic Customer') : (transaction.vendor_name || 'General Vendor')
  if (transaction.project_name) {
    label += ` • Project: ${transaction.project_name}`
  }
  return label
}

function hasTax(transaction) {
  return transaction.cgst_amount || transaction.igst_amount || transaction.tds_amount
}

function money(currency, amount) {
  const number = Number(amount || 0)
  return `${currencySymbols[currency] || '$'}${number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

function amountClass(transaction) {
  return transaction.type === 'Income' ? 'amount-positive' : 'amount-negative'
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function goToDetail(id) {
  router.push(`/finance/transactions/${id}`)
}

function exportData() {
  alert('Export feature coming soon! (CSV/PDF)')
}
</script>

<style scoped>
.ledger-container {
  max-width: 1440px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Summary Bar */
.summary-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.summary-card {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.summary-card .label {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--muted);
}

.summary-card .value {
  font-size: 28px;
  font-weight: 800;
}

.summary-card.income .value { color: #16a34a; }
.summary-card.expense .value { color: #dc2626; }
.summary-card.balance .value.positive { color: #2563eb; }
.summary-card.balance .value.negative { color: #dc2626; }

.summary-card .trend {
  font-size: 12px;
  color: var(--muted);
}

/* Filter Bar */
.filter-bar {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 24px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group.search {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--muted);
}

.filter-group.search input {
  padding-left: 40px;
  background: #f8fafc;
}

.filter-group label {
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
  white-space: nowrap;
}

.filter-group select {
  min-width: 160px;
  background: #f8fafc;
}

/* Table */
.table-container {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.ledger-table {
  width: 100%;
  border-collapse: collapse;
}

.ledger-table th {
  background: #f8fafc;
  padding: 16px 24px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
}

.ledger-table td {
  padding: 16px 24px;
  border-bottom: 1px solid var(--line);
  transition: background 0.2s;
  cursor: pointer;
}

.ledger-table tr:hover td {
  background: #f1f5f9;
}

.ledger-table tr:last-child td {
  border-bottom: none;
}

.id-col { font-weight: 700; color: var(--primary); }
.date-col { font-size: 14px; white-space: nowrap; }

.party-info strong { display: block; font-size: 15px; margin-bottom: 2px; }
.party-label { font-size: 12px; color: var(--muted); font-weight: 600; }
.small-desc { margin: 4px 0 0; font-size: 12px; line-height: 1.4; }

.right { text-align: right; }
.money-cell { font-family: 'JetBrains Mono', monospace; font-size: 15px; }
.total-col { font-weight: 800; }

.amount-positive { color: #16a34a; }
.amount-negative { color: #dc2626; }

.tax-info {
  display: flex;
  flex-direction: column;
  font-size: 11px;
  color: var(--muted);
  gap: 2px;
}

.tax-info .negative { color: #dc2626; }

.empty-row {
  padding: 48px !important;
  text-align: center;
  color: var(--muted);
  font-style: italic;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  color: var(--muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--surface-soft);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1100px) {
  .summary-bar { grid-template-columns: 1fr; }
  .filter-bar { flex-direction: column; align-items: stretch; gap: 16px; }
}

.toggle-btn.active {
  background: var(--primary) !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.2);
}

.currency-toggle-wrap {
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line);
  padding: 4px 12px;
  border-radius: 30px;
}

/* Pagination Bar styling */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #ffffff;
  border-top: 1px solid var(--line);
}

.pagination-btn {
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--surface-soft);
  color: var(--primary);
  border-color: var(--primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: var(--muted);
  font-weight: 500;
}
</style>
