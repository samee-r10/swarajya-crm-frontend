<template>
  <div class="transaction-detail-view">
    <!-- Breadcrumb -->
    <nav class="breadcrumb-nav">
      <RouterLink to="/finance/transactions" class="crumb-link">Transaction Ledger</RouterLink>
      <span class="crumb-sep">/</span>
      <span class="crumb-current">#{{ headerTransactionId }}</span>
    </nav>

    <!-- Header -->
    <header class="detail-header">
      <div class="header-left">
        <div class="header-badge-row">
          <span class="type-pill" :class="transaction?.type === 'Income' ? 'income' : 'expense'">
            {{ transaction?.type || 'Transaction' }}
          </span>
          <span v-if="transaction?.status === 'Reversed'" class="status-pill reversed">Reversed</span>
          <span v-else class="status-pill completed">{{ transaction?.status || 'Completed' }}</span>
          <span v-if="periodLockInfo.is_locked" class="status-pill locked-period-badge" :title="periodLockInfo.message">
            🔒 Locked Period ({{ periodLockInfo.period_name }})
          </span>
          <span class="date-pill" v-if="transaction">
            <svg viewBox="0 0 24 24" width="13" height="13"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="currentColor"/></svg>
            {{ formatDate(transaction.transaction_date) }}
          </span>
        </div>
        <h1 class="header-title">Transaction #{{ headerTransactionId }}</h1>
        <p v-if="transaction?.description" class="header-desc">{{ transaction.description }}</p>
      </div>

      <div class="header-actions">
        <!-- Prominent View GL Entries Action -->
        <button class="button primary-action-btn" type="button" @click="showGlDrawer = true">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-2-7h-4v2h4V9zm-4 4h4v2h-4v-2zm0-8h4v2h-4V5z" fill="currentColor"/></svg>
          View GL Entries
        </button>

        <!-- Open in GL Report -->
        <button class="button secondary" type="button" @click="drillDownToGL" title="Open transaction in full General Ledger report">
          <svg viewBox="0 0 24 24" width="15" height="15"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" fill="currentColor"/></svg>
          GL Report
        </button>

        <button 
          v-if="transaction && transaction.status !== 'Reversed' && !isSalaryTransaction" 
          class="button danger-btn" 
          :class="{ 'disabled-btn': periodLockInfo.is_locked }"
          type="button" 
          :disabled="periodLockInfo.is_locked"
          :title="periodLockInfo.is_locked ? periodLockInfo.message : 'Reverse Entry'"
          @click="showReverseConfirm = true"
        >
          <span v-if="periodLockInfo.is_locked">🔒 Period Locked</span>
          <span v-else>Reverse Entry</span>
        </button>

        <RouterLink class="button secondary" to="/finance/transactions">
          Back to Ledger
        </RouterLink>
      </div>
    </header>

    <!-- Period Locked Warning Banner -->
    <div v-if="periodLockInfo.is_locked" class="period-locked-alert-banner">
      <div class="lock-banner-icon">🔒</div>
      <div class="lock-banner-content">
        <strong>Accounting Period Closed: {{ periodLockInfo.period_name }}</strong>
        <p>{{ periodLockInfo.message }} This transaction is permanently protected against reversal, deletion, or modifications while the period is closed.</p>
      </div>
    </div>

    <!-- Success flash banner -->
    <transition name="fade-slide">
      <div v-if="showSuccessMsg" class="post-success-banner">
        <span class="success-icon">✓</span>
        <span>Entry posted successfully to the financial ledger.</span>
        <button type="button" class="dismiss-btn" @click="showSuccessMsg = false" aria-label="Dismiss">×</button>
      </div>
    </transition>

    <!-- Loading / Error -->
    <div v-if="loading" class="state-container">
      <div class="spinner"></div>
      <p>Loading transaction details...</p>
    </div>
    <div v-else-if="error" class="state-container error-state">
      <p>{{ error }}</p>
      <RouterLink class="button secondary" to="/finance/transactions">Back to Transactions</RouterLink>
    </div>

    <!-- Main Content Grid -->
    <div v-else-if="transaction" class="detail-content-layout">
      <!-- Top Financial Metrics Summary Cards -->
      <section class="financial-summary-grid">
        <div class="summary-card">
          <span class="card-label">Base Amount</span>
          <strong class="card-val">{{ money(transaction.currency, transaction.amount) }}</strong>
          <span class="card-sub">{{ transaction.currency }} Net Base</span>
        </div>

        <div class="summary-card" v-if="hasTax">
          <span class="card-label">Taxes & Deductions</span>
          <div class="tax-breakdown-pills">
            <span v-if="transaction.cgst_amount" class="pill-chip">CGST: +{{ money(transaction.currency, transaction.cgst_amount) }}</span>
            <span v-if="transaction.igst_amount" class="pill-chip">IGST: +{{ money(transaction.currency, transaction.igst_amount) }}</span>
            <span v-if="transaction.tds_amount" class="pill-chip negative">TDS: -{{ money(transaction.currency, transaction.tds_amount) }}</span>
          </div>
          <span class="card-sub">Statutory Taxes</span>
        </div>

        <div class="summary-card" v-if="hasFees">
          <span class="card-label">Fees & Surcharges</span>
          <div class="tax-breakdown-pills">
            <span v-if="transaction.additional_charges || transaction.additional_charges_amount" class="pill-chip">
              Addl: {{ money(transaction.currency, transaction.additional_charges || transaction.additional_charges_amount) }}
            </span>
            <span v-if="transaction.platform_fee_amount || transaction.platform_charges" class="pill-chip">
              Platform Fee: {{ money(transaction.currency, transaction.platform_fee_amount || transaction.platform_charges) }}
            </span>
          </div>
          <span class="card-sub">Processing charges</span>
        </div>

        <div class="summary-card total-card" :class="transaction.type === 'Income' ? 'income' : 'expense'">
          <span class="card-label">Total Net Amount</span>
          <strong class="card-val grand-val">
            {{ transaction.type === 'Income' ? '+' : '-' }} {{ money(transaction.currency, transactionTotalAmount(transaction)) }}
          </strong>
          <span class="card-sub">{{ transaction.type === 'Income' ? 'Cash Inflow to Bank' : 'Cash Outflow from Bank' }}</span>
        </div>
      </section>

      <!-- Two-Column Layout -->
      <div class="content-columns">
        <!-- Left / Primary Column -->
        <div class="primary-column">
          <!-- Business & Commercial Details Card -->
          <div class="panel-card">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <span class="panel-eyebrow">Context</span>
                <h3>Business & Commercial Information</h3>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Party / Entity</span>
                <strong class="info-val">{{ partyLabel(transaction) }}</strong>
              </div>
              <div class="info-item" v-if="transaction.account_name">
                <span class="info-label">Posting Account</span>
                <strong class="info-val">
                  <span class="mono-tag" v-if="transaction.gl_code">{{ transaction.gl_code }}</span>
                  {{ transaction.account_name }}
                </strong>
              </div>
              <div class="info-item" v-if="transaction.category">
                <span class="info-label">Category</span>
                <strong class="info-val">{{ transaction.category }}</strong>
              </div>
              <div class="info-item" v-if="transaction.product_name || transaction.product_code">
                <span class="info-label">Product / Service</span>
                <strong class="info-val">{{ transaction.product_name || transaction.product_code }}</strong>
              </div>
              <div class="info-item" v-if="transaction.project_name">
                <span class="info-label">Associated Project</span>
                <strong class="info-val">{{ transaction.project_name }}</strong>
              </div>
              <div class="info-item" v-if="transaction.reference">
                <span class="info-label">External Reference</span>
                <strong class="info-val mono">{{ transaction.reference }}</strong>
              </div>
            </div>
          </div>

          <!-- Settlement & Payment Details Card -->
          <div class="panel-card">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <span class="panel-eyebrow">Settlement</span>
                <h3>Payment & Banking Details</h3>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Bank Account</span>
                <strong class="info-val">{{ transaction.bank_account_name || 'Primary Bank Account' }}</strong>
              </div>
              <div class="info-item">
                <span class="info-label">Transaction Date</span>
                <strong class="info-val">{{ formatDate(transaction.transaction_date) }}</strong>
              </div>
              <div class="info-item">
                <span class="info-label">Currency</span>
                <strong class="info-val">{{ transaction.currency }}</strong>
              </div>
              <div class="info-item">
                <span class="info-label">Payment Status</span>
                <span class="status-chip" :class="transaction.status === 'Reversed' ? 'rev' : 'paid'">
                  {{ transaction.status === 'Reversed' ? 'Voided / Reversed' : 'Settled / Paid' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Full Notes & Description -->
          <div class="panel-card" v-if="transaction.description">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <span class="panel-eyebrow">Notes</span>
                <h3>Description & Remarks</h3>
              </div>
            </div>
            <div class="description-body">
              <p>{{ transaction.description }}</p>
            </div>
          </div>

          <!-- Supporting Documents -->
          <div class="panel-card" v-if="transaction.attachments?.length">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <span class="panel-eyebrow">Files</span>
                <h3>Attached Supporting Documents</h3>
              </div>
              <span class="count-pill">{{ transaction.attachments.length }} files</span>
            </div>
            <div class="panel-body">
              <DocumentPreview :documents="transaction.attachments" label="Transaction Documents" />
            </div>
          </div>

          <!-- Custom Fields -->
          <div class="panel-card" v-if="customFieldsList.length">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <span class="panel-eyebrow">Attributes</span>
                <h3>Additional Custom Fields</h3>
              </div>
            </div>
            <div class="info-grid">
              <div v-for="cf in customFieldsList" :key="cf.label" class="info-item">
                <span class="info-label">{{ cf.label }}</span>
                <strong class="info-val">{{ cf.value || '—' }}</strong>
              </div>
            </div>
          </div>

          <!-- System Audit Info -->
          <SystemInfo :record="transaction" />
        </div>

        <!-- Right / Secondary Column: GL Traceability & Related Links -->
        <div class="secondary-column">
          <!-- GL Traceability Showcase Card -->
          <div class="gl-feature-card">
            <div class="gl-feature-header">
              <div class="gl-badge-row">
                <span class="gl-badge">General Ledger</span>
                <span class="balanced-chip">✓ Balanced (Dr = Cr)</span>
              </div>
              <h3>Double-Entry Journal</h3>
              <p>Every transaction is recorded across dual entry GL accounts to preserve trial balance equilibrium.</p>
            </div>

            <!-- Mini Journal Preview Table -->
            <div class="mini-gl-table-wrap" v-if="miniJournalLines.length">
              <table class="mini-gl-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th class="right">Debit</th>
                    <th class="right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(line, idx) in miniJournalLines" :key="idx">
                    <td>
                      <span class="mono-code">{{ line.gl_code }}</span>
                      <strong>{{ line.account_name }}</strong>
                    </td>
                    <td class="right mono text-success">
                      {{ line.debit ? '+' + formatMiniMoney(line.debit) : '—' }}
                    </td>
                    <td class="right mono text-danger">
                      {{ line.credit ? '-' + formatMiniMoney(line.credit) : '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="gl-card-actions">
              <button class="button gl-inspect-btn" type="button" @click="showGlDrawer = true">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-2-7h-4v2h4V9zm-4 4h4v2h-4v-2zm0-8h4v2h-4V5z" fill="currentColor"/></svg>
                Inspect Full GL Journal
              </button>
            </div>
          </div>

          <!-- Related Records Card -->
          <div class="panel-card related-records-card" v-if="hasRelatedRecords">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <span class="panel-eyebrow">Links</span>
                <h3>Related Business Records</h3>
              </div>
            </div>
            <div class="related-links-stack">
              <RouterLink 
                v-if="transaction.invoice_id" 
                :to="`/finance/invoices/${transaction.invoice_id}`"
                class="related-record-item"
              >
                <div class="record-icon">📄</div>
                <div class="record-info">
                  <strong>Invoice #{{ transaction.invoice_number || transaction.invoice_id }}</strong>
                  <span>View customer invoice & receivables</span>
                </div>
                <span class="arrow-icon">→</span>
              </RouterLink>

              <RouterLink 
                v-if="transaction.customer_id" 
                :to="`/finance/reports/customer-ledger?customer_id=${transaction.customer_id}`"
                class="related-record-item"
              >
                <div class="record-icon">👤</div>
                <div class="record-info">
                  <strong>Customer Ledger</strong>
                  <span>{{ transaction.customer_name || 'Customer Statement' }}</span>
                </div>
                <span class="arrow-icon">→</span>
              </RouterLink>

              <RouterLink 
                v-if="transaction.vendor_id" 
                :to="`/finance/reports/vendor-ledger?vendor_id=${transaction.vendor_id}`"
                class="related-record-item"
              >
                <div class="record-icon">🏢</div>
                <div class="record-info">
                  <strong>Vendor Ledger</strong>
                  <span>{{ transaction.vendor_name || 'Vendor Statement' }}</span>
                </div>
                <span class="arrow-icon">→</span>
              </RouterLink>

              <RouterLink 
                v-if="transaction.expense_claim_id" 
                :to="`/finance/claims`"
                class="related-record-item"
              >
                <div class="record-icon">📑</div>
                <div class="record-info">
                  <strong>Expense Claim #{{ transaction.expense_claim_id }}</strong>
                  <span>Approved employee reimbursement</span>
                </div>
                <span class="arrow-icon">→</span>
              </RouterLink>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Reversal Confirmation Modal -->
    <div v-if="showReverseConfirm" class="confirm-overlay" @click.self="closeReverseConfirm">
      <section class="confirm-panel">
        <header>
          <p class="eyebrow">Confirm Reversal</p>
          <h2>Reverse Transaction #{{ headerTransactionId }}</h2>
        </header>
        <p class="muted">
          This will generate offsetting reversal entries in the General Ledger and void this entry across Treasury and Expense logs.
        </p>
        <p v-if="reverseError" class="flash warning">{{ reverseError }}</p>
        <div class="confirm-actions">
          <button class="button secondary" type="button" :disabled="reversing" @click="closeReverseConfirm">Cancel</button>
          <button class="button danger" type="button" :disabled="reversing" @click="reverseTransaction">
            {{ reversing ? 'Reversing...' : 'Confirm Reversal' }}
          </button>
        </div>
      </section>
    </div>

    <!-- Slide-out GL Entries Drawer -->
    <GlEntriesDrawer
      :isOpen="showGlDrawer"
      :transactionId="props.id"
      @close="showGlDrawer = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost } from '../api/client'
import DocumentPreview from '../components/DocumentPreview.vue'
import GlEntriesDrawer from '../components/GlEntriesDrawer.vue'
import SystemInfo from '../components/SystemInfo.vue'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const route = useRoute()
const router = useRouter()
const transaction = ref(null)
const transactionFields = ref([])
const currencySymbols = ref({})
const loading = ref(true)
const error = ref('')
const showReverseConfirm = ref(false)
const reversing = ref(false)
const reverseError = ref('')
const showSuccessMsg = ref(route.query.posted === 'true')
const showGlDrawer = ref(false)
const miniJournalLines = ref([])

const periodLockInfo = ref({ is_locked: false, period_name: '', message: '' })

const isSalaryTransaction = computed(() => {
  return transaction.value?.source_module === 'HR Salary' || String(transaction.value?.id || '').startsWith('salary-')
})

const headerTransactionId = computed(() => {
  return displayTransactionId(transaction.value || { id: props.id })
})

const hasTax = computed(() => {
  if (!transaction.value) return false
  const t = transaction.value
  return Boolean(t.cgst_amount || t.igst_amount || t.tds_amount)
})

const hasFees = computed(() => {
  if (!transaction.value) return false
  const t = transaction.value
  return Boolean(t.additional_charges || t.additional_charges_amount || t.platform_fee_amount || t.platform_charges)
})

const hasRelatedRecords = computed(() => {
  if (!transaction.value) return false
  const t = transaction.value
  return Boolean(t.invoice_id || t.customer_id || t.vendor_id || t.expense_claim_id)
})

const customFieldsList = computed(() => {
  if (!transaction.value) return []
  const t = transaction.value
  return transactionFields.value
    .filter(f => !f.is_native)
    .map(f => ({
      label: f.label,
      value: f.field_type === 'Checkbox' ? (t[f.api_name] ? 'Yes' : 'No') : t[f.api_name]
    }))
})

onMounted(async () => {
  try {
    const data = await apiGet(`/api/finance/transactions/${props.id}`)
    transaction.value = data.transaction
    transactionFields.value = data.fields || []
    currencySymbols.value = data.currency_symbols || {}

    // Check accounting period lock status for this transaction date
    if (transaction.value?.transaction_date) {
      try {
        const periodCheck = await apiGet(`/api/settings/accounting-periods/check?date=${transaction.value.transaction_date}`)
        periodLockInfo.value = periodCheck || { is_locked: false }
      } catch {
        periodLockInfo.value = { is_locked: false }
      }
    }

    // Load mini journal preview
    try {
      const gl = await apiGet(`/api/finance/transactions/${props.id}/gl-entries`)
      if (gl?.entries) {
        miniJournalLines.value = gl.entries.slice(0, 4)
      }
    } catch {
      // Non-critical if GL mini preview fails
    }
  } catch (err) {
    error.value = 'Unable to load this transaction.'
  } finally {
    loading.value = false
  }
})

function drillDownToGL() {
  router.push({
    path: '/finance/reports/general-ledger',
    query: { search: props.id }
  })
}

async function reverseTransaction() {
  if (reversing.value) return
  if (periodLockInfo.value.is_locked) {
    reverseError.value = periodLockInfo.value.message || 'Cannot reverse transaction in a locked accounting period.'
    return
  }
  reverseError.value = ''
  try {
    reversing.value = true
    await apiPost(`/api/finance/transactions/${props.id}/reverse`)
    const data = await apiGet(`/api/finance/transactions/${props.id}`)
    transaction.value = data.transaction
    showReverseConfirm.value = false
  } catch (err) {
    reverseError.value = err.message || 'Failed to reverse transaction.'
  } finally {
    reversing.value = false
  }
}

function closeReverseConfirm() {
  if (reversing.value) return
  showReverseConfirm.value = false
  reverseError.value = ''
}

function partyLabel(t) {
  if (t.source_module === 'HR Salary' || String(t.id || '').startsWith('salary-')) {
    return t.party_name || `Salary for ${[t.salary_month, t.salary_year].filter(Boolean).join(' ')}`
  }
  if (t.type === 'Income') {
    return t.customer_name ? `Customer: ${t.customer_name}` : 'Customer'
  }
  return t.vendor_name ? `Vendor: ${t.vendor_name}` : 'Vendor'
}

function displayTransactionId(transaction) {
  return formatTransactionId(transaction.display_id || transaction.transaction_number || transaction.id)
}

function formatTransactionId(value) {
  const text = String(value || '').trim()
  const txMatch = text.match(/^TXN(\d+)$/i)
  if (txMatch) return `TXN${String(Number(txMatch[1])).padStart(3, '0')}`
  if (/^\d+$/.test(text)) return `TXN${String(Number(text)).padStart(3, '0')}`
  return text
}

function formatDate(dStr) {
  if (!dStr) return '—'
  try {
    const d = new Date(dStr)
    if (isNaN(d.getTime())) return dStr
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dStr
  }
}

function money(currency, amount) {
  const sym = currencySymbols.value[currency] || (currency === 'INR' ? '₹' : '$')
  const number = Number(amount || 0)
  return `${sym}${number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

function formatMiniMoney(amount) {
  const num = Number(amount || 0)
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function transactionTotalAmount(t) {
  if (t.total_amount !== undefined && t.total_amount !== null && t.total_amount !== '') {
    return Number(t.total_amount)
  }
  const amount = Number(t.amount || 0)
  const cgst = Number(t.cgst_amount || 0)
  const igst = Number(t.igst_amount || 0)
  const tds = Number(t.tds_amount || 0)
  const addCharges = Number(t.additional_charges || t.additional_charges_amount || 0)
  const platformFee = Number(t.platform_fee_amount || t.platform_charges || 0)
  if (t.type === 'Income') {
    return Number((amount + cgst + igst + addCharges - tds - platformFee).toFixed(2))
  } else {
    return Number((amount + cgst + igst + addCharges + platformFee - tds).toFixed(2))
  }
}
</script>

<style scoped>
.transaction-detail-view {
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 60px;
}

/* Breadcrumb */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 12px;
}

.crumb-link {
  color: #0284c7;
  text-decoration: none;
  font-weight: 600;
}

.crumb-link:hover { text-decoration: underline; }
.crumb-sep { color: #cbd5e1; }
.crumb-current { font-weight: 700; color: #0f172a; }

/* Header */
.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  background: #ffffff;
  padding: 24px 28px;
  border-radius: 16px;
  border: 1px solid var(--line, #e2e8f0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.type-pill {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 999px;
}

.type-pill.income {
  background: #dcfce7;
  color: #166534;
}

.type-pill.expense {
  background: #fee2e2;
  color: #991b1b;
}

.status-pill {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 999px;
}

.status-pill.completed {
  background: #f1f5f9;
  color: #334155;
}

.status-pill.reversed {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fee2e2;
}

.date-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.header-title {
  font-size: 26px;
  font-weight: 900;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.5px;
}

.header-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  max-width: 650px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.primary-action-btn {
  background: #0284c7 !important;
  color: white !important;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
  transition: all 0.2s;
}

.primary-action-btn:hover {
  background: #0369a1 !important;
  transform: translateY(-1px);
}

.danger-btn {
  background: #ef4444 !important;
  color: white !important;
  border: none;
}

/* Financial Summary Cards */
.financial-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: #ffffff;
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.card-label {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  margin-bottom: 6px;
}

.card-val {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 4px;
  font-family: 'JetBrains Mono', monospace;
}

.card-sub {
  font-size: 11.5px;
  color: #94a3b8;
}

.total-card.income {
  border-left: 4px solid #16a34a;
}

.total-card.expense {
  border-left: 4px solid #dc2626;
}

.total-card.income .grand-val {
  color: #16a34a;
}

.total-card.expense .grand-val {
  color: #dc2626;
}

.tax-breakdown-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0;
}

.pill-chip {
  font-size: 11px;
  font-weight: 700;
  background: #f1f5f9;
  color: #334155;
  padding: 2px 7px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
}

.pill-chip.negative {
  background: #fee2e2;
  color: #991b1b;
}

/* Two-column layout */
.content-columns {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;
}

.primary-column, .secondary-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Panel cards */
.panel-card {
  background: #ffffff;
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 16px;
  padding: 22px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.panel-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.panel-eyebrow {
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.6px;
}

.panel-title-wrap h3 {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.count-pill {
  font-size: 11px;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
  padding: 3px 9px;
  border-radius: 999px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #64748b;
}

.info-val {
  font-size: 14px;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mono-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  background: #e2e8f0;
  padding: 1px 6px;
  border-radius: 4px;
  color: #334155;
}

.status-chip {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 999px;
  text-transform: uppercase;
}

.status-chip.paid { background: #dcfce7; color: #166534; }
.status-chip.rev { background: #fee2e2; color: #991b1b; }

.description-body {
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
  background: #f8fafc;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.description-body p { margin: 0; }

/* Right Column: GL Showcase Card */
.gl-feature-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 16px;
  color: #ffffff;
  padding: 24px;
  box-shadow: 0 12px 30px -6px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.gl-feature-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gl-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.gl-badge {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: #38bdf8;
  letter-spacing: 0.6px;
}

.balanced-chip {
  font-size: 10.5px;
  font-weight: 800;
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.gl-feature-header h3 {
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  color: #ffffff;
}

.gl-feature-header p {
  font-size: 12.5px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}

.mini-gl-table-wrap {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.mini-gl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
}

.mini-gl-table th {
  background: rgba(255, 255, 255, 0.06);
  padding: 8px 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  text-align: left;
}

.mini-gl-table td {
  padding: 9px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
}

.mono-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #38bdf8;
  margin-right: 6px;
}

.gl-inspect-btn {
  width: 100%;
  background: #38bdf8 !important;
  color: #0f172a !important;
  font-weight: 800;
  font-size: 13.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(56, 189, 248, 0.3);
  transition: all 0.2s;
}

.gl-inspect-btn:hover {
  background: #7dd3fc !important;
  transform: translateY(-2px);
}

/* Related links stack */
.related-links-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.related-record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.related-record-item:hover {
  background: #f0f9ff;
  border-color: #bae6fd;
  transform: translateX(3px);
}

.record-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.record-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.record-info strong {
  font-size: 13px;
  color: #0f172a;
}

.record-info span {
  font-size: 11px;
  color: #64748b;
}

.arrow-icon {
  font-size: 14px;
  color: #94a3b8;
  font-weight: 700;
}

/* State & Modals */
.state-container {
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid var(--line, #e2e8f0);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.post-success-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 14px 20px;
  margin-bottom: 24px;
  font-weight: 600;
  font-size: 14px;
}

.success-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #16a34a;
  color: white;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 900;
  flex-shrink: 0;
}

.dismiss-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #166534;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  opacity: 0.7;
}

.dismiss-btn:hover { opacity: 1; }

.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
}

.confirm-panel {
  width: min(520px, 100%);
  background: #ffffff;
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 16px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.25);
  padding: 28px;
}

.confirm-panel h2 {
  margin: 4px 0 12px;
  font-size: 20px;
  font-weight: 800;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.mono { font-family: 'JetBrains Mono', monospace; }
.right { text-align: right; }

/* Responsive adjustments */
@media (max-width: 1024px) {
  .content-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .header-actions .button {
    width: 100%;
    justify-content: center;
  }

  .financial-summary-grid {
    grid-template-columns: 1fr;
  }
}

/* Period Locked Banner & Badges */
.locked-period-badge {
  background: #fee2e2 !important;
  color: #991b1b !important;
  border: 1px solid #fecaca !important;
}

.period-locked-alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid #ef4444;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 24px;
}

.lock-banner-icon {
  font-size: 20px;
  line-height: 1;
  margin-top: 2px;
}

.lock-banner-content {
  flex: 1;
}

.lock-banner-content strong {
  display: block;
  font-size: 13.5px;
  font-weight: 800;
  color: #991b1b;
  margin-bottom: 3px;
}

.lock-banner-content p {
  margin: 0;
  font-size: 12px;
  color: #7f1d1d;
  line-height: 1.4;
}

.danger-btn.disabled-btn {
  background: #e2e8f0 !important;
  color: #94a3b8 !important;
  border-color: #cbd5e1 !important;
  cursor: not-allowed !important;
  opacity: 0.7;
}
</style>
