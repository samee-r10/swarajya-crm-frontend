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
        <button class="button secondary" @click="printReport">
          <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right:6px"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" fill="currentColor"/></svg>
          Export / Print
        </button>
      </div>
    </header>

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
            <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
          </select>
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
      <div class="summary-card opening">
        <span class="card-label">Opening Balance</span>
        <strong class="card-value" :class="{ negative: report.opening_balance < 0 }">
          {{ money(convertSummary(report.opening_balance)) }}
        </strong>
        <span class="card-sub">Before period start</span>
      </div>
      <div class="summary-card credits">
        <span class="card-label">Total Credits (Inflow)</span>
        <strong class="card-value positive">+ {{ money(convertSummary(report.total_credits)) }}</strong>
        <span class="card-sub">Income received</span>
      </div>
      <div class="summary-card debits">
        <span class="card-label">Total Debits (Outflow)</span>
        <strong class="card-value negative">- {{ money(convertSummary(report.total_debits)) }}</strong>
        <span class="card-sub">Expenses paid out</span>
      </div>
      <div class="summary-card closing">
        <span class="card-label">Closing Balance</span>
        <strong class="card-value" :class="report.closing_balance >= 0 ? 'positive' : 'negative'">
          {{ money(convertSummary(report.closing_balance)) }}
        </strong>
        <span class="card-sub">End of period net</span>
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
      <!-- Opening Balance Row -->
      <table class="gl-table">
        <thead>
          <tr>
            <th style="width:50px">#</th>
            <th style="width:120px">Date</th>
            <th style="width:100px">Ref ID</th>
            <th>Description / Party</th>
            <th style="width:110px">Account</th>
            <th class="right" style="width:130px">Debit (Out)</th>
            <th class="right" style="width:130px">Credit (In)</th>
            <th class="right" style="width:140px">Running Balance</th>
          </tr>
        </thead>
        <tbody>
          <!-- Opening Balance Row -->
          <tr class="opening-row">
            <td colspan="5"><strong>Opening Balance</strong> — Brought Forward</td>
            <td class="right">—</td>
            <td class="right">—</td>
            <td class="right mono" :class="report.opening_balance >= 0 ? 'positive' : 'negative'">
              <strong>{{ money(convertSummary(report.opening_balance)) }}</strong>
            </td>
          </tr>

          <!-- Journal Entries -->
          <tr v-for="(entry, idx) in report.entries" :key="entry.id" :class="entry.type === 'Income' ? 'credit-row' : 'debit-row'">
            <td class="muted-sm">{{ idx + 1 }}</td>
            <td class="date-cell">{{ formatDate(entry.transaction_date) }}</td>
            <td class="ref-cell">
              <span class="ref-badge">TXN-{{ entry.id }}</span>
            </td>
            <td>
              <div class="entry-desc">
                <strong>{{ entry.category || 'General' }}</strong>
                <span class="party">{{ entry.type === 'Income' ? (entry.customer_name || 'Customer') : (entry.vendor_name || 'Vendor') }}</span>
                <p v-if="entry.description" class="desc-text">{{ entry.description }}</p>
                <div v-if="entry.cgst_amount || entry.igst_amount || entry.tds_amount" class="tax-tags">
                  <span v-if="entry.cgst_amount">CGST {{ money(convertAmt(entry.cgst_amount, entry.currency, entry.transaction_date)) }}</span>
                  <span v-if="entry.igst_amount">IGST {{ money(convertAmt(entry.igst_amount, entry.currency, entry.transaction_date)) }}</span>
                  <span v-if="entry.tds_amount" class="tds">TDS -{{ money(convertAmt(entry.tds_amount, entry.currency, entry.transaction_date)) }}</span>
                </div>
              </div>
            </td>
            <td class="account-cell">{{ entry.account_name }}</td>
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
            <td colspan="5"><strong>Closing Balance</strong> — Carried Forward</td>
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
import { onMounted, reactive, ref } from 'vue'
import { apiGet } from '../api/client'

// ── State ──────────────────────────────────────────────────────────
const loading = ref(false)
const report = ref(null)
const accounts = ref([])
const viewCurrency = ref('USD')
const currencySymbols = reactive({ USD: '$', INR: '₹', EUR: '€', GBP: '£' })
const exchangeRates = ref({ INR: { default: 95.0, monthly: {} } })

const now = new Date()
const startOfYear = `${now.getFullYear()}-01-01`
const today = now.toISOString().split('T')[0]

const filters = reactive({
  start_date: startOfYear,
  end_date: today,
  account_id: ''
})

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
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

// ── Currency Conversion ────────────────────────────────────────────
// Convert a native-currency amount into the currently selected view currency
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

// Pure formatter — caller must pre-convert the amount
function money(amount) {
  const sym = currencySymbols[viewCurrency.value] || '$'
  const num = Number(amount) || 0
  return `${sym}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Summary totals from backend are computed in mixed native currencies (INR + USD).
// We normalize them using the default exchange rate for display in the summary cards.
function convertSummary(amount) {
  const num = Number(amount) || 0
  if (viewCurrency.value === 'USD') return num
  const rate = exchangeRates.value.INR?.default || 95.0
  return num * rate
}

// ── Formatting ─────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })
}

function printReport() {
  window.print()
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

/* ── Table ── */
.table-wrap {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 20px -4px rgba(0,0,0,0.07);
}

.gl-table {
  width: 100%;
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
.credit-row { background: #f0fdf4; }
.debit-row  { background: #fff7f7; }

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
.muted-sm { font-size: 12px; color: var(--muted); text-align: center; }

.right { text-align: right; }
.mono { font-family: 'JetBrains Mono', monospace; }

.debit-amount  { color: #dc2626; }
.credit-amount { color: #16a34a; }
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

  .credit-row { background: #f6fff8 !important; }
  .debit-row  { background: #fff8f8 !important; }

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
