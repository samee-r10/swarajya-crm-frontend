<template>
  <div class="gl-report-page">

    <!-- Header -->
    <header class="page-header">
      <div>
        <p class="eyebrow">Finance · Reports</p>
        <h1>Vendor Ledger Report</h1>
        <p class="muted">A complete chronological ledger of vendor expenses, bills, payments, and payables.</p>
      </div>
      <div class="header-actions no-print">
        <!-- Currency Toggle -->
        <div class="currency-toggle-wrap">
          <span class="toggle-label">Currency:</span>
          <div class="toggle-buttons">
            <button type="button" class="toggle-btn" :class="{ active: viewCurrency === 'USD' }" @click="viewCurrency = 'USD'">USD</button>
            <button type="button" class="toggle-btn" :class="{ active: viewCurrency === 'INR' }" @click="viewCurrency = 'INR'">INR</button>
          </div>
        </div>
        <button class="button secondary" @click="exportCSV">
          <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right:6px"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/></svg>
          Export CSV
        </button>
        <button class="button secondary" @click="exportExcel">
          <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right:6px"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/></svg>
          Export Excel
        </button>
        <button class="button secondary" @click="printReport">
          <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right:6px"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" fill="currentColor"/></svg>
          Print
        </button>
      </div>
    </header>

    <!-- Sub-navigation Tabs -->
    <ReportHeaderTabs activeTab="vendor" />

    <!-- Filters -->
    <section class="filters-card no-print">
      <div class="filter-row">
        <label>
          <span>From Date</span>
          <input type="date" v-model="filters.start_date" @change="loadReport">
        </label>
        <label>
          <span>To Date</span>
          <input type="date" v-model="filters.end_date" @change="loadReport">
        </label>
        <label>
          <span>Vendor</span>
          <select v-model="filters.vendor_id" @change="loadReport">
            <option value="">All Vendors</option>
            <option v-for="v in vendors" :key="v.id" :value="v.id">{{ v.name || v.company_name }}</option>
          </select>
        </label>
        <label>
          <span>Type</span>
          <select v-model="filters.type" @change="loadReport">
            <option value="">All Types</option>
            <option value="expense">Bills / Expenses (Credit)</option>
            <option value="payment">Payments (Debit)</option>
          </select>
        </label>
        <label class="search-label">
          <span>Search</span>
          <input type="search" v-model="filters.search" placeholder="Search vendor, reference, payable, memo..." @input="loadReport">
        </label>
        <button class="button" @click="loadReport" :disabled="loading">
          {{ loading ? 'Loading...' : 'Generate Report' }}
        </button>
      </div>
    </section>

    <!-- Print Header (visible only on print) -->
    <div class="print-header">
      <h2>Vendor Ledger Statement</h2>
      <p>Period: {{ filters.start_date || 'All Time' }} to {{ filters.end_date || 'Present' }}</p>
      <p v-if="filters.vendor_id">Vendor: {{ selectedVendorName }}</p>
    </div>

    <!-- Summary Cards -->
    <section v-if="report" class="summary-cards">
      <div class="summary-card opening">
        <span class="card-label">Opening Vendor Balance</span>
        <strong class="card-value" :class="{ negative: report.opening_balance < 0 }">
          {{ money(convertSummary(report.opening_balance)) }}
        </strong>
        <span class="card-sub">Payables brought forward</span>
      </div>
      <div class="summary-card credits">
        <span class="card-label">Total Bills / Expenses (Credits)</span>
        <strong class="card-value positive">+ {{ money(convertSummary(report.total_credits)) }}</strong>
        <span class="card-sub">Vendor liability accrued</span>
      </div>
      <div class="summary-card debits">
        <span class="card-label">Total Payments (Debits)</span>
        <strong class="card-value negative">- {{ money(convertSummary(report.total_debits)) }}</strong>
        <span class="card-sub">Disbursements settled</span>
      </div>
      <div class="summary-card closing">
        <span class="card-label">Closing Vendor Balance</span>
        <strong class="card-value" :class="report.closing_balance >= 0 ? 'positive' : 'negative'">
          {{ money(convertSummary(report.closing_balance)) }}
        </strong>
        <span class="card-sub">Net payable balance</span>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p>Generating vendor ledger entries...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="report && report.entries.length === 0" class="state-box">
      <svg viewBox="0 0 24 24" width="48" height="48" style="color:var(--muted)"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="currentColor"/></svg>
      <p>No vendor transactions found for the selected period.</p>
    </div>

    <!-- Vendor Ledger Table -->
    <section v-else-if="report" class="table-wrap">
      <table class="gl-table">
        <thead>
          <tr>
            <th style="width:50px">#</th>
            <th style="width:140px">Date</th>
            <th style="width:130px">Ref / Trans ID</th>
            <th style="width:180px">Vendor Name</th>
            <th>Description / Category</th>
            <th style="width:130px">Payable Ref</th>
            <th style="width:120px">Payment Ref</th>
            <th style="width:140px">Created By</th>
            <th style="width:110px">Status</th>
            <th class="right" style="width:140px">Debit (Payment)</th>
            <th class="right" style="width:140px">Credit (Expense)</th>
            <th class="right" style="width:150px">Running Balance</th>
          </tr>
        </thead>
        <tbody>
          <!-- Opening Balance Row -->
          <tr class="opening-row">
            <td colspan="9"><strong>Opening Balance</strong> — Brought Forward</td>
            <td class="right">—</td>
            <td class="right">—</td>
            <td class="right mono" :class="report.opening_balance >= 0 ? 'positive' : 'negative'">
              <strong>{{ money(convertSummary(report.opening_balance)) }}</strong>
            </td>
          </tr>

          <!-- Journal Entries -->
          <tr v-for="(entry, idx) in report.entries" :key="entry.id" :class="rowClass(entry)">
            <td class="muted-sm">{{ idx + 1 }}</td>
            <td class="date-cell">{{ formatDate(entry.transaction_date || entry.date) }}</td>
            <td class="ref-cell">
              <RouterLink
                :to="`/finance/transactions/${entry.transaction_id || entry.id}`"
                class="ref-link"
                title="View Transaction Details"
              >
                <span class="ref-badge">{{ entry.reference || entry.id }}</span>
              </RouterLink>
            </td>
            <td class="account-cell">
              <strong>{{ entry.vendor_name || '—' }}</strong>
            </td>
            <td>
              <div class="entry-desc">
                <strong>{{ entry.transaction_type || entry.category || 'Vendor Expense' }}</strong>
                <p v-if="entry.description" class="desc-text">{{ entry.description }}</p>
                <div v-if="entry.product_name || entry.project_name || entry.account_name" class="tax-tags">
                  <span v-if="entry.account_name">Account: {{ entry.gl_code ? `${entry.gl_code} · ` : '' }}{{ entry.account_name }}</span>
                  <span v-if="entry.product_name">Product: {{ entry.product_name }}</span>
                  <span v-if="entry.project_name">Project: {{ entry.project_name }}</span>
                </div>
              </div>
            </td>
            <td class="mono">
              <span>{{ entry.payable_number || '—' }}</span>
            </td>
            <td class="mono">
              <RouterLink
                v-if="entry.payment_reference && entry.payment_reference !== '—'"
                :to="`/finance/transactions/${entry.payment_reference}`"
                class="entity-link"
              >
                {{ entry.payment_reference }}
              </RouterLink>
              <span v-else>{{ entry.payment_reference || '—' }}</span>
            </td>
            <td class="text-cell">{{ entry.created_by_name || '—' }}</td>
            <td>
              <span class="status-badge" :class="{ reversed: entry.status === 'Reversed' }">
                {{ entry.status || 'Active' }}
              </span>
            </td>
            <td class="right mono debit-amount">
              <span v-if="entry.debit">- {{ money(convertAmt(entry.debit, entry.currency, entry.transaction_date)) }}</span>
              <span v-else class="muted">—</span>
            </td>
            <td class="right mono credit-amount">
              <span v-if="entry.credit">+ {{ money(convertAmt(entry.credit, entry.currency, entry.transaction_date)) }}</span>
              <span v-else class="muted">—</span>
            </td>
            <td class="right mono running-balance" :class="entry.running_balance >= 0 ? 'positive' : 'negative'">
              <strong>{{ money(convertSummary(entry.running_balance)) }}</strong>
            </td>
          </tr>

          <!-- Closing Balance Row -->
          <tr class="closing-row">
            <td colspan="9"><strong>Closing Balance</strong> — Net Payable Balance</td>
            <td class="right mono negative"><strong>- {{ money(convertSummary(report.total_debits)) }}</strong></td>
            <td class="right mono positive"><strong>+ {{ money(convertSummary(report.total_credits)) }}</strong></td>
            <td class="right mono" :class="report.closing_balance >= 0 ? 'positive' : 'negative'">
              <strong>{{ money(convertSummary(report.closing_balance)) }}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiGet } from '../api/client'
import ReportHeaderTabs from '../components/ReportHeaderTabs.vue'

// ── State ──────────────────────────────────────────────────────────
const loading = ref(false)
const report = ref(null)
const vendors = ref([])
const viewCurrency = ref('INR')
const currencySymbols = reactive({ USD: '$', INR: '₹', EUR: '€', GBP: '£' })
const exchangeRates = ref({ INR: { default: 95.0, monthly: {} } })

const now = new Date()
const startOfYear = `${now.getFullYear()}-01-01`
const today = now.toISOString().split('T')[0]

const filters = reactive({
  start_date: startOfYear,
  end_date: today,
  vendor_id: '',
  type: '',
  search: ''
})

const selectedVendorName = computed(() => {
  if (!filters.vendor_id) return 'All Vendors'
  const v = vendors.value.find(item => String(item.id) === String(filters.vendor_id))
  return v ? (v.name || v.company_name) : `Vendor #${filters.vendor_id}`
})

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const venData = await apiGet('/api/vendors')
    vendors.value = venData.vendors || []
  } catch (e) { console.error(e) }

  try {
    const ratesData = await apiGet('/api/settings/exchange-rates')
    if (ratesData?.INR) exchangeRates.value = ratesData
  } catch (e) { console.error(e) }

  try {
    const curData = await apiGet('/api/settings/currencies')
    if (Array.isArray(curData)) curData.forEach(c => { currencySymbols[c.code] = c.symbol })
  } catch (e) { console.error(e) }

  await loadReport()
})

// ── Data Fetching ──────────────────────────────────────────────────
async function loadReport() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.start_date) params.set('start_date', filters.start_date)
    if (filters.end_date) params.set('end_date', filters.end_date)
    if (filters.vendor_id) params.set('vendor_id', filters.vendor_id)
    if (filters.type) params.set('type', filters.type)
    if (filters.search) params.set('search', filters.search)
    const data = await apiGet(`/api/finance/reports/vendor-ledger?${params}`)
    report.value = data
  } catch (e) {
    console.error('Failed to load Vendor Ledger report:', e)
  } finally {
    loading.value = false
  }
}

// ── Currency Conversion ────────────────────────────────────────────
function convertAmt(amount, fromCurrency, dateStr) {
  const target = viewCurrency.value
  const num = Number(amount) || 0
  if (!fromCurrency || fromCurrency === target) return num

  const month = dateStr ? String(dateStr).substring(0, 7) : ''
  let inrRate = exchangeRates.value.INR?.default || 95.0
  if (month && exchangeRates.value.INR?.monthly?.[month]) {
    inrRate = exchangeRates.value.INR.monthly[month]
  }

  if (fromCurrency === 'USD' && target === 'INR') return num * inrRate
  if (fromCurrency === 'INR' && target === 'USD') return num / inrRate
  return num
}

function money(amount) {
  const sym = currencySymbols[viewCurrency.value] || '$'
  const num = Number(amount) || 0
  return `${sym}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function convertSummary(amount) {
  const num = Number(amount) || 0
  if (viewCurrency.value === 'USD') return num
  const rate = exchangeRates.value.INR?.default || 95.0
  return num * rate
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })
}

function rowClass(entry) {
  if (entry.status === 'Reversed') return 'reversed-row'
  return entry.type === 'Income' ? 'credit-row' : 'debit-row'
}

function printReport() {
  window.print()
}

function exportCSV() {
  if (!report.value || !report.value.entries || !report.value.entries.length) return
  
  const headers = [
    'Date', 'Ref ID', 'Vendor Name', 'Category', 'Description', 
    'Payable Ref', 'Payment Ref', 'Created By', 'Status', 'Debit (Payment)', 'Credit (Expense)', 'Running Balance'
  ]
  
  const escapeCSV = (str) => {
    const text = String(str || '').replace(/"/g, '""')
    return `"${text}"`
  }
  
  const rows = report.value.entries.map(entry => {
    return [
      formatDate(entry.transaction_date || entry.date),
      entry.reference || entry.id || '',
      entry.vendor_name || '',
      entry.transaction_type || entry.category || '',
      entry.description || '',
      entry.payable_number || '',
      entry.payment_reference || '',
      entry.created_by_name || '',
      entry.status || 'Active',
      entry.debit ? convertAmt(entry.debit, entry.currency, entry.transaction_date).toFixed(2) : '',
      entry.credit ? convertAmt(entry.credit, entry.currency, entry.transaction_date).toFixed(2) : '',
      convertSummary(entry.running_balance).toFixed(2)
    ].map(escapeCSV).join(',')
  })
  
  const csvContent = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Vendor_Ledger_${filters.start_date || 'All'}_to_${filters.end_date || 'All'}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function exportExcel() {
  if (!report.value || !report.value.entries || !report.value.entries.length) return
  
  const headers = [
    'Date', 'Ref ID', 'Vendor Name', 'Category', 'Description', 
    'Payable Ref', 'Payment Ref', 'Created By', 'Status', 'Debit (Payment)', 'Credit (Expense)', 'Running Balance'
  ]
  
  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"/></head><body><table border="1">`
  tableHtml += `<tr style="background:#f1f5f9;font-weight:bold">${headers.map(h => `<th>${h}</th>`).join('')}</tr>`
  
  report.value.entries.forEach(entry => {
    tableHtml += `<tr>
      <td>${formatDate(entry.transaction_date || entry.date)}</td>
      <td>${entry.reference || entry.id || ''}</td>
      <td>${entry.vendor_name || ''}</td>
      <td>${entry.transaction_type || entry.category || ''}</td>
      <td>${entry.description || ''}</td>
      <td>${entry.payable_number || ''}</td>
      <td>${entry.payment_reference || ''}</td>
      <td>${entry.created_by_name || ''}</td>
      <td>${entry.status || 'Active'}</td>
      <td>${entry.debit ? convertAmt(entry.debit, entry.currency, entry.transaction_date).toFixed(2) : ''}</td>
      <td>${entry.credit ? convertAmt(entry.credit, entry.currency, entry.transaction_date).toFixed(2) : ''}</td>
      <td>${convertSummary(entry.running_balance).toFixed(2)}</td>
    </tr>`
  })
  tableHtml += `</table></body></html>`
  
  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Vendor_Ledger_${filters.start_date || 'All'}_to_${filters.end_date || 'All'}.xls`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.gl-report-page {
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Header ── */
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.currency-toggle-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--line, #e2e8f0);
  padding: 4px 14px;
  border-radius: 30px;
}

.toggle-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toggle-buttons {
  display: flex;
  background: #f1f5f9;
  padding: 2px;
  border-radius: 20px;
}

.toggle-btn {
  border: none;
  background: none;
  padding: 5px 14px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  border-radius: 18px;
  transition: all 0.18s;
  color: var(--muted, #64748b);
}

.toggle-btn.active {
  background: var(--primary, #f97316);
  color: #fff;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);
}

/* ── Filters ── */
.filters-card {
  background: #fff;
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 28px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-row label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted, #64748b);
  min-width: 150px;
}

.filter-row label.search-label {
  min-width: 220px;
  flex: 1;
}

.filter-row input,
.filter-row select {
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  color: var(--foreground, #0f172a);
}

.filter-row input:focus,
.filter-row select:focus {
  outline: none;
  border-color: var(--primary, #f97316);
}

/* ── Summary Cards ── */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.summary-card {
  background: #fff;
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-value {
  font-size: 20px;
  font-weight: 800;
  color: var(--foreground, #0f172a);
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
}

.card-value.positive {
  color: #10b981;
}

.card-value.negative {
  color: #ef4444;
}

.card-sub {
  font-size: 11px;
  color: var(--muted, #64748b);
}

/* ── Table ── */
.table-wrap {
  background: #fff;
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 12px;
  overflow-x: auto;
  margin-bottom: 32px;
}

.gl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.gl-table th {
  background: #f8fafc;
  padding: 12px 14px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--muted, #64748b);
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--line, #e2e8f0);
  white-space: nowrap;
}

.gl-table td {
  padding: 14px;
  border-bottom: 1px solid #f1f5f9;
  color: var(--foreground, #0f172a);
  vertical-align: middle;
}

.gl-table tr:last-child td {
  border-bottom: none;
}

.right {
  text-align: right;
}

.mono {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
  font-size: 12px;
}

.muted-sm {
  font-size: 11px;
  color: var(--muted, #64748b);
}

.date-cell {
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
}

.ref-cell {
  white-space: nowrap;
}

.ref-badge {
  display: inline-block;
  padding: 3px 8px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-mono, monospace);
  color: #334155;
}

.ref-link, .entity-link {
  text-decoration: none;
  color: var(--primary, #f97316);
  font-weight: 600;
  transition: opacity 0.15s;
}

.ref-link:hover .ref-badge {
  background: #ffedd5;
  border-color: #fdba74;
  color: #c2410c;
}

.entity-link:hover {
  text-decoration: underline;
}

.entry-desc {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.desc-text {
  font-size: 12px;
  color: #475569;
  margin: 0;
}

.tax-tags {
  display: flex;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  margin-top: 4px;
}

.tax-tags span {
  padding: 2px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
}

.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  background: #ecfdf5;
  color: #059669;
}

.status-badge.reversed {
  background: #fef2f2;
  color: #dc2626;
}

.debit-amount {
  color: #ef4444;
  font-weight: 700;
}

.credit-amount {
  color: #10b981;
  font-weight: 700;
}

.running-balance.positive {
  color: #10b981;
}

.running-balance.negative {
  color: #ef4444;
}

/* ── Opening & Closing Rows ── */
.opening-row td {
  background: #f8fafc;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
}

.closing-row td {
  background: #f8fafc;
  font-weight: 700;
  border-top: 2px solid #e2e8f0;
}

/* ── States ── */
.state-box {
  background: #fff;
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--muted, #64748b);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--primary, #f97316);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.print-header {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }
  .print-header {
    display: block;
    margin-bottom: 20px;
  }
  .gl-report-page {
    max-width: 100%;
  }
}

@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-row label {
    min-width: 100%;
  }
}
</style>
