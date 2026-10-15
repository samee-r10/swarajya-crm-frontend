<template>
  <div class="gl-report-page">

    <!-- Header -->
    <header class="page-header">
      <div>
        <p class="eyebrow">Finance · Reports</p>
        <h1>General Ledger Report</h1>
        <p class="muted">A complete chronological record of all financial journal entries.</p>
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
    <ReportHeaderTabs activeTab="general" />

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
          <span>Account</span>
          <select v-model="filters.account_id" @change="loadReport">
            <option value="">All Accounts</option>
            <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.gl_code ? `${acc.gl_code} · ` : '' }}{{ acc.name }}</option>
          </select>
        </label>
        <label>
          <span>Type</span>
          <select v-model="filters.type">
            <option value="">All Types</option>
            <option value="Income">Income (Credit)</option>
            <option value="Expense">Expense (Debit)</option>
          </select>
        </label>
        <label class="search-label">
          <span>Search</span>
          <input type="search" v-model="filters.search" placeholder="Search reference, party, memo...">
        </label>
        <button class="button" @click="loadReport" :disabled="loading">
          {{ loading ? 'Loading...' : 'Generate Report' }}
        </button>
      </div>
    </section>

    <!-- Print Header (visible only on print) -->
    <div class="print-header">
      <h2>General Ledger Statement</h2>
      <p>Period: {{ filters.start_date || 'All Time' }} to {{ filters.end_date || 'Present' }}</p>
      <p v-if="filters.account_id">Account: {{ accounts.find(a => a.id == filters.account_id)?.name }}</p>
    </div>

    <!-- Summary Cards -->
    <section v-if="report" class="summary-cards">
      <div class="summary-card revenue">
        <span class="card-label">Operational Revenue / Inflow</span>
        <strong class="card-value positive">
          {{ money(convertSummary(report.summary?.operational_revenue ?? report.total_credits)) }}
        </strong>
        <span class="card-sub">
          Gross: {{ money(convertSummary(report.summary?.gross_revenue ?? report.total_credits)) }}
          <template v-if="report.summary?.gateway_fees"> · Fee: -{{ money(convertSummary(report.summary.gateway_fees)) }}</template>
        </span>
      </div>
      <div class="summary-card expenses">
        <span class="card-label">Total Expenses / Outflow</span>
        <strong class="card-value negative">
          {{ money(convertSummary(report.summary?.operational_expenses ?? report.total_debits)) }}
        </strong>
        <span class="card-sub">Operating expenses & payroll</span>
      </div>
      <div class="summary-card net">
        <span class="card-label">Net Operating Result</span>
        <strong class="card-value" :class="(report.summary?.net_result ?? (report.total_credits - report.total_debits)) >= 0 ? 'positive' : 'negative'">
          {{ formatSignedMoney(convertSummary(report.summary?.net_result ?? (report.total_credits - report.total_debits))) }}
        </strong>
        <span class="card-sub">Revenue - Expenses</span>
      </div>
      <div class="summary-card closing">
        <span class="card-label">Bank Settlement Movement</span>
        <strong class="card-value" :class="(report.summary?.bank_net ?? report.closing_balance) >= 0 ? 'positive' : 'negative'">
          {{ money(convertSummary(report.summary?.bank_net ?? report.closing_balance)) }}
        </strong>
        <span class="card-sub">
          Inflow: {{ money(convertSummary(report.summary?.bank_inflows ?? report.total_credits)) }} · Outflow: {{ money(convertSummary(report.summary?.bank_outflows ?? report.total_debits)) }}
        </span>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p>Generating ledger entries...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="report && report.entries.length === 0" class="state-box">
      <svg viewBox="0 0 24 24" width="48" height="48" style="color:var(--muted)"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" fill="currentColor"/></svg>
      <p>No journal entries found for the selected period.</p>
    </div>

    <!-- GL Journal Table -->
    <section v-else-if="report" class="table-wrap">
      <!-- Active Transaction Drill-Down Banner -->
      <div v-if="filters.search" class="filter-active-banner no-print">
        <div class="banner-content">
          <span class="banner-icon">🔍</span>
          <span>Filtered to transaction reference: <strong>{{ filters.search }}</strong> (showing all counterpart journal legs)</span>
        </div>
        <div class="banner-actions">
          <RouterLink v-if="returnTransactionId" :to="`/finance/transactions/${returnTransactionId}`" class="banner-btn primary">
            ← Return to Transaction #{{ returnTransactionId }}
          </RouterLink>
          <button type="button" class="banner-btn secondary" @click="clearSearchFilter">
            Clear Filter
          </button>
        </div>
      </div>

      <table class="gl-table">
        <thead>
          <tr>
            <th style="width:45px">#</th>
            <th style="width:150px">Date / Time</th>
            <th style="width:105px">Txn ID</th>
            <th style="width:90px">GL Code</th>
            <th style="width:170px">Account Name</th>
            <th style="width:115px">Entry Type</th>
            <th>Description / Party</th>
            <th style="width:130px">Reference</th>
            <th class="right" style="width:115px">Debit</th>
            <th class="right" style="width:115px">Credit</th>
            <th class="right" style="width:125px">Net Amount</th>
            <th class="right" style="width:135px">Running Balance</th>
          </tr>
        </thead>
        <tbody>
          <!-- Opening Balance Row -->
          <tr class="opening-row">
            <td colspan="8"><strong>Opening Balance</strong> — Brought Forward</td>
            <td class="right mono muted">—</td>
            <td class="right mono muted">—</td>
            <td class="right mono muted">—</td>
            <td class="right mono" :class="report.opening_balance >= 0 ? 'positive' : 'negative'">
              <strong>{{ money(convertSummary(report.opening_balance)) }}</strong>
            </td>
          </tr>

          <!-- Journal Entries -->
          <tr v-for="(entry, idx) in visibleEntries" :key="entry.leg_id || (entry.id + '-' + idx)" :class="rowClass(entry)">
            <td class="muted-sm">{{ idx + 1 }}</td>
            <td class="date-cell">{{ formatDateTime(entry.transaction_date || entry.date || entry.created_at) }}</td>
            <td class="ref-cell">
              <RouterLink :to="`/finance/transactions/${entry.id || entry.transaction_id}`" class="ref-link">
                <span class="ref-badge">{{ displayTransactionId(entry) }}</span>
              </RouterLink>
            </td>
            <td class="account-cell mono">{{ entry.gl_account_number || entry.gl_code || '—' }}</td>
            <td class="account-cell">
              <strong>{{ entry.gl_account_name || entry.account_name || '—' }}</strong>
            </td>
            <td>
              <span class="type-badge" :class="entryTypeClass(entry)">{{ entry.entry_type || getEntryType(entry) }}</span>
            </td>
            <td>
              <div class="entry-desc">
                <strong>{{ entry.category || 'General' }}</strong>
                <span class="party">{{ entry.type === 'Income' ? (entry.customer_name || 'Customer') : (entry.vendor_name || 'Vendor') }}</span>
                <span class="party">Accounting date: {{ formatDate(entry.transaction_date) }}</span>
                <p v-if="entry.description" class="desc-text">{{ entry.description }}</p>
                <div v-if="entry.cgst_amount || entry.igst_amount || entry.tds_amount" class="tax-tags">
                  <span v-if="entry.cgst_amount">CGST {{ money(convertAmt(entry.cgst_amount, entry.currency, entry.transaction_date)) }}</span>
                  <span v-if="entry.igst_amount">IGST {{ money(convertAmt(entry.igst_amount, entry.currency, entry.transaction_date)) }}</span>
                  <span v-if="entry.tds_amount" class="tds">TDS -{{ money(convertAmt(entry.tds_amount, entry.currency, entry.transaction_date)) }}</span>
                </div>
              </div>
            </td>
            <td class="text-cell mono">{{ entryRefLabel(entry) }}</td>
            <td class="right mono debit-cell">
              <span v-if="entry.debit != null && entry.debit !== ''">{{ money(convertAmt(entry.debit, entry.currency, entry.transaction_date)) }}</span>
              <span v-else class="muted">—</span>
            </td>
            <td class="right mono credit-cell">
              <span v-if="entry.credit != null && entry.credit !== ''">{{ money(convertAmt(entry.credit, entry.currency, entry.transaction_date)) }}</span>
              <span v-else class="muted">—</span>
            </td>
            <td class="right mono amount-cell" :class="getEntryAmountClass(entry)">
              <strong>{{ formatEntryAmount(entry) }}</strong>
            </td>
            <td class="right mono running-balance" :class="entry.running_balance >= 0 ? 'positive' : 'negative'">
              <strong>{{ money(convertSummary(entry.running_balance)) }}</strong>
            </td>
          </tr>

          <!-- Closing Balance / Totals Row -->
          <tr class="closing-row">
            <td colspan="8">
              <div class="footer-totals-label">
                <strong>TOTAL / CLOSING BALANCE</strong>
                <span class="sub-label">
                  Journal Turnover: {{ money(convertSummary(report.total_debits)) }} (Dr = Cr Balanced) &bull; Net Movement: {{ formatSignedMoney(convertSummary(filters.account_id ? ((report.total_debits || 0) - (report.total_credits || 0)) : (report.summary?.net_result || 0))) }}
                </span>
              </div>
            </td>
            <td class="right mono" title="Total Debit Journal Turnover"><strong>{{ money(convertSummary(report.total_debits)) }}</strong></td>
            <td class="right mono" title="Total Credit Journal Turnover"><strong>{{ money(convertSummary(report.total_credits)) }}</strong></td>
            <td class="right mono amount-cell" :class="(filters.account_id ? ((report.total_debits || 0) - (report.total_credits || 0)) : (report.summary?.net_result || 0)) >= 0 ? 'positive' : 'negative'" title="Net Operational Movement">
              <strong>{{ formatSignedMoney(convertSummary(filters.account_id ? ((report.total_debits || 0) - (report.total_credits || 0)) : (report.summary?.net_result || 0))) }}</strong>
            </td>
            <td class="right mono" :class="report.closing_balance >= 0 ? 'positive' : 'negative'" title="Closing Balance">
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
import { useRoute, useRouter } from 'vue-router'
import { apiGet } from '../api/client'
import ReportHeaderTabs from '../components/ReportHeaderTabs.vue'

const route = useRoute()
const router = useRouter()

// ── State ──────────────────────────────────────────────────────────
const loading = ref(false)
const report = ref(null)
const accounts = ref([])
const viewCurrency = ref('INR')
const currencySymbols = reactive({ USD: '$', INR: '₹', EUR: '€', GBP: '£' })
const exchangeRates = ref({ INR: { default: 95.0, monthly: {} } })

const now = new Date()
const startOfYear = `${now.getFullYear()}-01-01`
const today = now.toISOString().split('T')[0]

const filters = reactive({
  start_date: startOfYear,
  end_date: today,
  account_id: '',
  type: '',
  search: ''
})

const returnTransactionId = computed(() => {
  if (route.query.search) return String(route.query.search)
  if (filters.search && /^TXN\d+$/i.test(filters.search.trim())) return filters.search.trim()
  return ''
})

function clearSearchFilter() {
  filters.search = ''
  if (route.query.search) {
    router.replace({ path: '/finance/reports/general-ledger' })
  }
}

const visibleEntries = computed(() => {
  if (!report.value?.entries) return []
  let list = report.value.entries
  if (filters.type) {
    list = list.filter(e => e.type === filters.type)
  }
  if (filters.search) {
    const q = filters.search.trim().toLowerCase()
    list = list.filter(e => {
      const txDisplay = displayTransactionId(e).toLowerCase()
      const rawId = String(e.id || e.transaction_id || '').toLowerCase()
      const text = `${txDisplay} ${rawId} ${e.reference || ''} ${e.description || ''} ${e.customer_name || ''} ${e.vendor_name || ''} ${e.gl_account_name || ''} ${e.gl_account_number || ''} ${e.category || ''} ${e.entry_type || ''}`.toLowerCase()
      return text.includes(q)
    })
  }
  return list
})

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
  if (route.query.search) {
    filters.search = String(route.query.search).trim()
    // Relax start date and clear specific account so full dual-entry journal appears
    filters.start_date = ''
    filters.account_id = ''
  }

  // Load accounts for filter dropdown
  try {
    const opts = await apiGet('/api/options')
    accounts.value = opts.accounts || []
  } catch (e) { console.error(e) }

  // Load exchange rates
  try {
    const ratesData = await apiGet('/api/settings/exchange-rates')
    if (ratesData?.INR) exchangeRates.value = ratesData
  } catch (e) { console.error(e) }

  // Load dynamic currency symbols
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
    if (filters.account_id) params.set('account_id', filters.account_id)
    const data = await apiGet(`/api/finance/reports/general-ledger?${params}`)
    report.value = data
  } catch (e) {
    console.error('Failed to load GL report:', e)
  } finally {
    loading.value = false
  }
}

// ── Entry Classification Helpers ────────────────────────────────────
function getEntryType(entry) {
  if (entry.entry_type) return entry.entry_type
  const code = String(entry.gl_account_number || entry.gl_code || '')
  const name = String(entry.gl_account_name || entry.account_name || '').toLowerCase()
  if (code === '1010' || String(entry.leg_id || '').includes('bank')) return 'Bank Movement'
  if (code === '5040' || name.includes('fee')) return 'Gateway Fee'
  if (code === '7010' || entry.category === 'Employee Claim' || name.includes('expense') || entry.type === 'Expense') return 'Expense'
  if (code.startsWith('4') || entry.type === 'Income') return 'Revenue'
  if (code.startsWith('5') || code.startsWith('6') || code.startsWith('7')) return 'Expense'
  if (code.startsWith('2')) return 'Tax / TDS'
  return entry.type === 'Income' ? 'Revenue' : 'Expense'
}

function entryTypeClass(entry) {
  const t = String(entry.entry_type || getEntryType(entry)).toLowerCase()
  if (t.includes('revenue') || t.includes('income')) return 'type-revenue'
  if (t.includes('fee')) return 'type-fee'
  if (t.includes('bank')) return 'type-bank'
  if (t.includes('expense') || t.includes('claim')) return 'type-expense'
  if (t.includes('tax') || t.includes('tds')) return 'type-tax'
  return 'type-default'
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
  const absFormatted = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (num < 0) return `-${sym}${absFormatted}`
  return `${sym}${absFormatted}`
}

function convertSummary(amount) {
  const num = Number(amount) || 0
  if (viewCurrency.value === 'USD') return num
  const rate = exchangeRates.value.INR?.default || 95.0
  return num * rate
}

function getEntryAmount(entry) {
  const hasCredit = entry.credit != null && entry.credit !== ''
  const hasDebit = entry.debit != null && entry.debit !== ''
  const c = hasCredit ? convertAmt(entry.credit, entry.currency, entry.transaction_date) : 0
  const d = hasDebit ? convertAmt(entry.debit, entry.currency, entry.transaction_date) : 0
  return d - c
}

function formatSignedMoney(amount) {
  if (amount == null || isNaN(amount)) return '—'
  const sym = currencySymbols[viewCurrency.value] || '$'
  const num = Number(amount) || 0
  const absFormatted = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (num > 0) return `+${sym}${absFormatted}`
  if (num < 0) return `-${sym}${absFormatted}`
  return `${sym}0.00`
}

function formatEntryAmount(entry) {
  const hasCredit = entry.credit != null && entry.credit !== ''
  const hasDebit = entry.debit != null && entry.debit !== ''
  if (!hasCredit && !hasDebit) return '—'
  const amt = getEntryAmount(entry)
  return formatSignedMoney(amt)
}

function getEntryAmountClass(entry) {
  const hasCredit = entry.credit != null && entry.credit !== ''
  const hasDebit = entry.debit != null && entry.debit !== ''
  if (!hasCredit && !hasDebit) return ''
  const amt = getEntryAmount(entry)
  if (amt > 0) return 'positive'
  if (amt < 0) return 'negative'
  return ''
}

// ── Formatting ─────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })
}

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function productLabel(entry) {
  if (entry.product_code && entry.product_name) return `${entry.product_code} · ${entry.product_name}`
  return entry.product_name || entry.product_code || '—'
}

function rowClass(entry) {
  if (entry.status === 'Reversed') return 'reversed-row'
  const amt = getEntryAmount(entry)
  return amt >= 0 ? 'positive-row debit-row' : 'negative-row credit-row'
}

function entryRefLabel(entry) {
  if (entry.source_module === 'HR Salary' || String(entry.transaction_type || '').includes('Salary')) {
    return displayTransactionId(entry)
  }
  return entry.reference || entry.transaction_reference || displayTransactionId(entry)
}

function displayTransactionId(entry) {
  return formatTransactionId(entry.display_id || entry.transaction_number || entry.id)
}

function formatTransactionId(value) {
  const text = String(value || '').trim()
  const txMatch = text.match(/^TXN(\d+)$/i)
  if (txMatch) return `TXN${String(Number(txMatch[1])).padStart(3, '0')}`
  if (/^\d+$/.test(text)) return `TXN${String(Number(text)).padStart(3, '0')}`
  return text
}

function printReport() {
  window.print()
}

function exportCSV() {
  if (!visibleEntries.value || !visibleEntries.value.length) return
  
  const headers = [
    'Date', 'Txn ID', 'GL Code', 'Account Name', 'Entry Type', 'Category', 'Description', 
    'Vendor', 'Customer', 'Product', 'Reference', 'Debit', 'Credit', 'Net Amount', 'Running Balance'
  ]
  
  const escapeCSV = (str) => {
    const text = String(str || '').replace(/"/g, '""')
    return `"${text}"`
  }
  
  const rows = visibleEntries.value.map(entry => {
    const amt = getEntryAmount(entry)
    const formattedAmt = amt > 0 ? `+${amt.toFixed(2)}` : amt < 0 ? `-${Math.abs(amt).toFixed(2)}` : '0.00'
    const debitVal = entry.debit != null && entry.debit !== '' ? convertAmt(entry.debit, entry.currency, entry.transaction_date).toFixed(2) : ''
    const creditVal = entry.credit != null && entry.credit !== '' ? convertAmt(entry.credit, entry.currency, entry.transaction_date).toFixed(2) : ''
    return [
      formatDate(entry.transaction_date || entry.date || entry.created_at),
      displayTransactionId(entry),
      entry.gl_account_number || entry.gl_code || '',
      entry.gl_account_name || entry.account_name || '',
      entry.entry_type || getEntryType(entry),
      entry.category || 'General',
      entry.description || '',
      entry.vendor_name || '',
      entry.customer_name || '',
      productLabel(entry),
      entryRefLabel(entry),
      debitVal,
      creditVal,
      formattedAmt,
      convertSummary(entry.running_balance).toFixed(2)
    ].map(escapeCSV).join(',')
  })
  
  const csvContent = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `General_Ledger_${filters.start_date || 'All'}_to_${filters.end_date || 'All'}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function exportExcel() {
  if (!visibleEntries.value || !visibleEntries.value.length) return
  
  const headers = [
    'Date', 'Txn ID', 'GL Code', 'Account Name', 'Entry Type', 'Category', 'Description', 
    'Vendor', 'Customer', 'Product', 'Reference', 'Debit', 'Credit', 'Net Amount', 'Running Balance'
  ]
  
  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"/></head><body><table border="1">`
  tableHtml += `<tr style="background:#f1f5f9;font-weight:bold">${headers.map(h => `<th>${h}</th>`).join('')}</tr>`
  
  visibleEntries.value.forEach(entry => {
    const amt = getEntryAmount(entry)
    const formattedAmt = amt > 0 ? `+${amt.toFixed(2)}` : amt < 0 ? `-${Math.abs(amt).toFixed(2)}` : '0.00'
    const color = amt < 0 ? '#dc2626' : amt > 0 ? '#16a34a' : '#000000'
    const debitVal = entry.debit != null && entry.debit !== '' ? convertAmt(entry.debit, entry.currency, entry.transaction_date).toFixed(2) : ''
    const creditVal = entry.credit != null && entry.credit !== '' ? convertAmt(entry.credit, entry.currency, entry.transaction_date).toFixed(2) : ''
    tableHtml += `<tr>
      <td>${formatDate(entry.transaction_date || entry.date || entry.created_at)}</td>
      <td>${displayTransactionId(entry)}</td>
      <td>${entry.gl_account_number || entry.gl_code || ''}</td>
      <td>${entry.gl_account_name || entry.account_name || ''}</td>
      <td>${entry.entry_type || getEntryType(entry)}</td>
      <td>${entry.category || 'General'}</td>
      <td>${entry.description || ''}</td>
      <td>${entry.vendor_name || ''}</td>
      <td>${entry.customer_name || ''}</td>
      <td>${productLabel(entry)}</td>
      <td>${entryRefLabel(entry)}</td>
      <td>${debitVal}</td>
      <td>${creditVal}</td>
      <td style="color:${color};font-weight:bold">${formattedAmt}</td>
      <td>${convertSummary(entry.running_balance).toFixed(2)}</td>
    </tr>`
  })
  tableHtml += `</table></body></html>`
  
  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `General_Ledger_${filters.start_date || 'All'}_to_${filters.end_date || 'All'}.xls`)
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
  background: var(--surface);
  border: 1px solid var(--line);
  padding: 4px 14px;
  border-radius: 30px;
}

.toggle-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
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
  color: var(--muted);
}

.toggle-btn.active {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);
}

/* ── Transaction Drill-down Banner ── */
.filter-active-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 12px 18px;
  margin-bottom: 16px;
  font-size: 13.5px;
  color: #1e40af;
  flex-wrap: wrap;
  gap: 12px;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.banner-btn {
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  line-height: 1.2;
}

.banner-btn.primary {
  background: #2563eb;
  color: #ffffff;
  border: 1px solid #1d4ed8;
}

.banner-btn.primary:hover {
  background: #1d4ed8;
}

.banner-btn.secondary {
  background: #ffffff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.banner-btn.secondary:hover {
  background: #dbeafe;
}

/* ── Filters ── */
.filters-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 28px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-row label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-row label input,
.filter-row label select {
  font-size: 14px;
  min-width: 160px;
}

/* ── Summary Cards ── */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.summary-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px -8px rgba(0,0,0,0.1);
}

.summary-card.closing {
  background: var(--primary);
  border-color: var(--primary);
}

.summary-card.closing .card-label,
.summary-card.closing .card-sub { color: rgba(255,255,255,0.8); }
.summary-card.closing .card-value { color: #fff; }

.card-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--muted);
}

.card-value {
  font-size: 26px;
  font-weight: 900;
  color: var(--primary);
  font-family: 'JetBrains Mono', monospace;
}

.card-value.positive { color: #16a34a; }
.card-value.negative { color: #dc2626; }

.card-sub {
  font-size: 12px;
  color: var(--muted);
}

/* ── Entry Type Badges ── */
.type-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  white-space: nowrap;
}

.type-revenue {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.type-expense {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.type-fee {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

.type-bank {
  background: #e0e7ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
}

.type-tax {
  background: #f3e8ff;
  color: #7e22ce;
  border: 1px solid #e9d5ff;
}

.type-default {
  background: #f1f5f9;
  color: #475569;
}

.debit-cell {
  color: #16a34a;
  font-weight: 600;
}

.credit-cell {
  color: #dc2626;
  font-weight: 600;
}

.text-success { color: #16a34a !important; }
.text-danger { color: #dc2626 !important; }

/* ── Table ── */
.table-wrap {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow-x: auto;
  box-shadow: 0 4px 20px -4px rgba(0,0,0,0.07);
}

.gl-table {
  width: 100%;
  min-width: 1900px;
  border-collapse: collapse;
}

.gl-table th {
  background: #f8fafc;
  padding: 13px 16px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.gl-table td {
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
  vertical-align: top;
}

.gl-table tr:last-child td { border-bottom: none; }

/* Row Types */
.positive-row, .debit-row  { background: #f0fdf4; }
.negative-row, .credit-row { background: #fff7f7; }
.reversed-row { background: #f8fafc; color: #64748b; }
.reversed-row td { text-decoration-color: rgba(100, 116, 139, 0.45); }

.opening-row td,
.closing-row td {
  background: #f1f5f9;
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
  border-top: 2px solid var(--line);
  border-bottom: 2px solid var(--line);
  padding: 14px 16px;
}

.footer-totals-label {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.footer-totals-label strong {
  font-size: 13.5px;
  color: var(--primary);
}

.footer-totals-label .sub-label {
  font-size: 11.5px;
  font-weight: 500;
  color: #64748b;
}

/* Entry Details */
.entry-desc strong { display: block; font-size: 14px; margin-bottom: 2px; }
.party { font-size: 12px; color: var(--muted); font-weight: 600; display: block; }
.desc-text { font-size: 12px; color: var(--muted); margin: 3px 0 0; line-height: 1.4; }

.tax-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 5px;
}

.tax-tags span {
  font-size: 10px;
  font-weight: 700;
  background: #e0f2fe;
  color: #0369a1;
  padding: 2px 7px;
  border-radius: 4px;
}

.tax-tags .tds {
  background: #fef2f2;
  color: #dc2626;
}

.ref-badge {
  font-size: 11px;
  font-weight: 800;
  background: #f1f5f9;
  color: var(--primary);
  padding: 3px 8px;
  border-radius: 5px;
  font-family: monospace;
}

.date-cell { font-size: 13px; white-space: nowrap; }
.account-cell { font-size: 12px; color: var(--muted); }
.text-cell { font-size: 12px; color: #334155; min-width: 130px; }
.muted-sm { font-size: 12px; color: var(--muted); text-align: center; }

.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  font-size: 10px;
  font-weight: 800;
  padding: 3px 8px;
  text-transform: uppercase;
  white-space: nowrap;
}

.status-badge.reversed {
  background: #fee2e2;
  color: #991b1b;
}

.right { text-align: right; }
.mono { font-family: 'JetBrains Mono', monospace; }

.amount-cell   { font-weight: 700; font-size: 13.5px; }
.debit-amount  { color: #16a34a; font-weight: 700; }
.credit-amount { color: #dc2626; font-weight: 700; }
.positive { color: #16a34a; }
.negative { color: #dc2626; }
.running-balance { font-weight: 700; font-size: 14px; }

/* ── State Boxes ── */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: var(--muted);
  gap: 16px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid var(--surface-soft);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Print Styles ── */
.print-header { display: none; }

@media print {
  .no-print { display: none !important; }

  .gl-report-page { max-width: 100%; }

  .print-header {
    display: block;
    text-align: center;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 2px solid #000;
  }
  .print-header h2 { font-size: 20px; margin: 0 0 4px; }
  .print-header p  { font-size: 13px; margin: 2px 0; }

  .summary-cards {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .summary-card {
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 12px;
    break-inside: avoid;
  }

  .summary-card.closing {
    background: #f0f0f0 !important;
    border-color: #999 !important;
  }
  .summary-card.closing .card-label,
  .summary-card.closing .card-sub,
  .summary-card.closing .card-value { color: #000 !important; }

  .table-wrap {
    border: none;
    box-shadow: none;
    border-radius: 0;
  }

  .gl-table th {
    background: #e8e8e8;
    font-size: 9px;
    padding: 8px 10px;
  }

  .gl-table td {
    padding: 8px 10px;
    font-size: 11px;
  }

  .positive-row, .debit-row  { background: #f6fff8 !important; }
  .negative-row, .credit-row { background: #fff8f8 !important; }

  tr { page-break-inside: avoid; }
}

@media (max-width: 1100px) {
  .summary-cards { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 700px) {
  .summary-cards { grid-template-columns: 1fr; }
  .filter-row { flex-direction: column; align-items: stretch; }
}
</style>
