<template>
  <div class="invoices-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Finance</p>
        <h1>Invoices</h1>
        <p class="muted">Manage and track your sales invoices.</p>
      </div>
      <div style="display: flex; align-items: center; gap: 20px;">
        <!-- Currency View Toggle Selection -->
        <div class="currency-toggle-wrap">
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
        
        <RouterLink class="button" to="/finance/invoices/new">
          <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
          New Invoice
        </RouterLink>
      </div>
    </header>

    <!-- INVOICE METRICS DASHBOARD PANELS -->
    <section class="metrics-grid">
      
      <!-- Card 1: Total Invoiced -->
      <div class="metric-card card-premium">
        <div class="metric-icon invoiced">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/></svg>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Invoiced</span>
          <h2 class="metric-value">{{ activeCurrency }} {{ Number(totalInvoiced).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</h2>
          <span class="metric-sub">Across all active accounts</span>
        </div>
      </div>

      <!-- Card 2: Total Collection -->
      <div class="metric-card card-premium">
        <div class="metric-icon collected">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Collection</span>
          <h2 class="metric-value success">{{ activeCurrency }} {{ Number(totalCollected).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</h2>
          <span class="metric-sub">Revenue received successfully</span>
        </div>
      </div>

      <!-- Card 3: Pending Collection -->
      <div class="metric-card card-premium">
        <div class="metric-icon pending">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="currentColor"/></svg>
        </div>
        <div class="metric-info">
          <span class="metric-label">Pending Collection</span>
          <h2 class="metric-value warning">{{ activeCurrency }} {{ Number(totalPending).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</h2>
          <span class="metric-sub">Outstanding balances due</span>
        </div>
      </div>

    </section>

    <section class="filters-bar">
      <div class="filter-group search">
        <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        <input v-model="search" placeholder="Search invoices by number or customer...">
      </div>
      <div class="filter-group">
        <label>Status:</label>
        <select v-model="status">
          <option value="">All Statuses</option>
          <option v-for="s in statuses" :key="s">{{ s }}</option>
        </select>
      </div>
    </section>

    <section class="table-container">
      <table class="record-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Project</th>
            <th>Date</th>
            <th>Due Date</th>
            <th class="right">Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in paginatedInvoices" :key="inv.id" @click="goToDetail(inv.id)">
            <td><strong>{{ inv.invoice_number }}</strong></td>
            <td>
              <div class="name-cell">
                <strong>{{ inv.customer_name }}</strong>
              </div>
            </td>
            <td>
              <span v-if="inv.project_name" class="pill" style="font-size: 11px; background: #e0f2fe; color: #0369a1;">{{ inv.project_name }}</span>
              <span v-else class="muted italic small">None</span>
            </td>
            <td>{{ formatDate(inv.invoice_date) }}</td>
            <td>{{ formatDate(inv.due_date) }}</td>
            <td class="right money-cell">{{ viewCurrency }} {{ Number(convertAmount(inv.total_amount, inv.currency, inv.invoice_date)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</td>
            <td><span class="pill" :class="statusClass(inv.status)">{{ inv.status }}</span></td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="7" class="empty-state">No invoices found.</td>
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
        <span class="pagination-info">Page {{ currentPage }} of {{ totalPages }} ({{ filtered.length }} records)</span>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '../api/client'

const router = useRouter()
const invoices = ref([])
const search = ref('')
const status = ref('')
const statuses = ['Draft', 'Sent', 'Approved', 'Partially Paid', 'Paid', 'Cancelled', 'Overdue']

const viewCurrency = ref('INR')
const exchangeRates = ref({
  INR: {
    default: 95.0,
    monthly: {}
  }
})

const activeCurrency = computed(() => {
  return viewCurrency.value
})

function convertAmount(amount, fromCurrency, invoiceDateStr) {
  const target = viewCurrency.value
  const numAmount = Number(amount) || 0
  if (fromCurrency === target) return numAmount
  
  // Get invoice month (e.g. "2026-05")
  const month = invoiceDateStr ? invoiceDateStr.substring(0, 7) : ''
  
  // Find exchange rate for INR relative to USD
  let inrRate = exchangeRates.value.INR.default || 95.0
  if (month && exchangeRates.value.INR.monthly[month]) {
    inrRate = exchangeRates.value.INR.monthly[month]
  }
  
  if (fromCurrency === 'USD' && target === 'INR') {
    return numAmount * inrRate
  } else if (fromCurrency === 'INR' && target === 'USD') {
    return numAmount / inrRate
  }
  
  return numAmount
}

const totalInvoiced = computed(() => {
  return invoices.value
    .filter(inv => inv.status !== 'Cancelled')
    .reduce((sum, inv) => sum + convertAmount(Number(inv.total_amount) || 0, inv.currency, inv.invoice_date), 0)
})

const totalCollected = computed(() => {
  return invoices.value
    .filter(inv => inv.status !== 'Cancelled')
    .reduce((sum, inv) => sum + convertAmount(Number(inv.amount_paid) || 0, inv.currency, inv.invoice_date), 0)
})

const totalPending = computed(() => {
  return invoices.value
    .filter(inv => inv.status !== 'Cancelled')
    .reduce((sum, inv) => {
      const balance = Math.max(0, (Number(inv.total_amount) || 0) - (Number(inv.amount_paid) || 0))
      return sum + convertAmount(balance, inv.currency, inv.invoice_date)
    }, 0)
})

const filtered = computed(() => invoices.value.filter((inv) => {
  const matchesStatus = !status.value || inv.status === status.value
  const matchesSearch = !search.value || 
    inv.invoice_number.toLowerCase().includes(search.value.toLowerCase()) || 
    inv.customer_name.toLowerCase().includes(search.value.toLowerCase())
  return matchesStatus && matchesSearch
}))

const currentPage = ref(1)
const itemsPerPage = 10

const totalPages = computed(() => Math.ceil(filtered.value.length / itemsPerPage))

const paginatedInvoices = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filtered.value.slice(start, end)
})

watch([search, status], () => {
  currentPage.value = 1
})

onMounted(async () => {
  const data = await apiGet('/api/finance/invoices')
  invoices.value = data.invoices || []
  
  try {
    const ratesData = await apiGet('/api/settings/exchange-rates')
    if (ratesData && ratesData.INR) {
      exchangeRates.value = ratesData
    }
  } catch (err) {
    console.error("Failed to load exchange rates", err)
  }
})

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function goToDetail(id) {
  router.push(`/finance/invoices/${id}`)
}

function statusClass(s) {
  const map = {
    'Paid': 'status-success',
    'Sent': 'status-info',
    'Approved': 'status-warning',
    'Partially Paid': 'status-warning',
    'Draft': 'status-muted',
    'Overdue': 'status-danger',
    'Cancelled': 'status-danger'
  }
  return map[s] || ''
}
</script>

<style scoped>
.invoices-page {
  max-width: 1400px;
  margin: 0 auto;
}

.filters-bar {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  align-items: center;
}

.filter-group.search {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
}

.filter-group.search input {
  padding-left: 40px;
  background: #f8fafc;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
  white-space: nowrap;
}

.table-container {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}

.record-table {
  width: 100%;
  border-collapse: collapse;
}

.record-table th {
  background: #f8fafc;
  padding: 16px 24px;
  text-align: left;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
}

.record-table td {
  padding: 16px 24px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background 0.2s;
}

.record-table tr:hover td {
  background: #f1f5f9;
}

.record-table tr:last-child td {
  border-bottom: none;
}

.right { text-align: right !important; }
.money-cell { font-weight: 700; }

.pill.status-success { background: #dcfce7; color: #166534; }
.pill.status-info { background: #dbeafe; color: #1e40af; }
.pill.status-muted { background: #f1f5f9; color: #475569; }
.pill.status-danger { background: #fee2e2; color: #991b1b; }

.empty-state {
  font-style: italic;
}

.pill.status-warning { background: #fef3c7; color: #d97706; }

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

/* PREMIUM CARD SHADOWS & SHAPES */
.card-premium {
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: 0 4px 20px -2px rgba(120, 113, 108, 0.05), 0 2px 8px -1px rgba(120, 113, 108, 0.03);
  transition: all 0.3s ease;
}

.card-premium:hover {
  box-shadow: 0 10px 30px -5px rgba(120, 113, 108, 0.08), 0 4px 12px -2px rgba(120, 113, 108, 0.04);
  transform: translateY(-2px);
}

/* METRICS PANEL */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: #ffffff;
}

.metric-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.metric-card:hover .metric-icon {
  transform: scale(1.08);
}

.metric-icon.invoiced {
  background: #eff6ff;
  color: #1d4ed8;
}

.metric-icon.collected {
  background: #f0fdf4;
  color: #166534;
}

.metric-icon.pending {
  background: #fff7ed;
  color: #c2410c;
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--muted);
  letter-spacing: 0.8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 855;
  color: var(--primary);
  margin: 0;
  letter-spacing: -0.5px;
}

.metric-value.success {
  color: #166534;
}

.metric-value.warning {
  color: #c2410c;
}

.metric-sub {
  font-size: 11px;
  color: var(--muted);
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
</style>
