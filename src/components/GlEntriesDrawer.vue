<template>
  <Teleport to="body">
    <transition name="drawer-fade">
      <div v-if="isOpen" class="gl-drawer-backdrop" @click="handleBackdropClick">
        <div class="gl-drawer-panel" @click.stop>
          <!-- Header -->
          <header class="drawer-header">
            <div class="header-main">
              <div class="title-row">
                <span class="eyebrow-tag">Accounting & Audit</span>
                <span v-if="glData?.is_reversed" class="status-badge reversed">Reversed</span>
                <span v-else-if="glData?.is_draft" class="status-badge draft">Draft / Unposted</span>
                <span v-else-if="glData?.is_posted" class="status-badge posted">Posted to GL</span>
              </div>
              <h2 class="drawer-title">General Ledger Entries</h2>
              <div class="tx-ref-wrap" v-if="glData">
                <span class="tx-badge">#{{ glData.display_id || glData.transaction_id }}</span>
                <span class="tx-desc" :title="glData.description">{{ glData.description }}</span>
              </div>
            </div>
            <button class="close-btn" @click="closeDrawer" aria-label="Close drawer">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
            </button>
          </header>

          <!-- Drawer Action Bar -->
          <div class="drawer-actions-bar" v-if="glData">
            <div class="meta-pills">
              <span class="meta-pill">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="currentColor"/></svg>
                Date: <strong>{{ formatDate(glData.transaction_date) }}</strong>
              </span>
              <span class="meta-pill" v-if="glData.party_name && glData.party_name !== '—'">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>
                Party: <strong>{{ glData.party_name }}</strong>
              </span>
            </div>

            <button class="button gl-drilldown-btn" @click="drillDownToGL" title="Open complete journal in General Ledger report">
              <svg viewBox="0 0 24 24" width="15" height="15"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" fill="currentColor"/></svg>
              Open in General Ledger
            </button>
          </div>

          <!-- Body content -->
          <main class="drawer-body">
            <!-- Loading state -->
            <div v-if="loading" class="state-container">
              <div class="spinner"></div>
              <p>Retrieving General Ledger records...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="error" class="state-container error-state">
              <div class="state-icon">⚠️</div>
              <p>{{ error }}</p>
              <button class="button secondary" @click="loadGlEntries">Retry</button>
            </div>

            <!-- Draft / Unposted state -->
            <div v-else-if="glData?.is_draft" class="state-container empty-state">
              <div class="state-icon">📄</div>
              <h3>Draft / Unposted Transaction</h3>
              <p>No posted General Ledger entries are available for this transaction.</p>
              <span class="muted small">Entries are generated and posted automatically when the transaction is approved or confirmed.</span>
            </div>

            <!-- Content when loaded -->
            <div v-else-if="glData" class="gl-content-wrap">
              <!-- Reversal Notice Banner if applicable -->
              <div v-if="glData.is_reversed" class="reversal-alert-card">
                <div class="alert-icon">⚠️</div>
                <div class="alert-text">
                  <strong>Transaction Reversed:</strong> This transaction ledger entry was voided/reversed. Both the original posted entries and offsetting reversal entries are displayed below.
                </div>
              </div>

              <!-- Journal Summary KPI Cards -->
              <div class="journal-summary-grid">
                <div class="summary-box dr">
                  <span class="box-label">Total Debit (Dr)</span>
                  <strong class="box-value text-success">+{{ formatMoney(glData.totals.total_debit, glData.currency) }}</strong>
                  <span class="box-sub">Inflow / Asset / Expense</span>
                </div>
                <div class="summary-box cr">
                  <span class="box-label">Total Credit (Cr)</span>
                  <strong class="box-value text-danger">-{{ formatMoney(glData.totals.total_credit, glData.currency) }}</strong>
                  <span class="box-sub">Outflow / Revenue / Liability</span>
                </div>
                <div class="summary-box balance" :class="glData.totals.is_balanced ? 'balanced' : 'unbalanced'">
                  <span class="box-label">Balance Status</span>
                  <strong class="box-value status-text">
                    {{ glData.totals.is_balanced ? '✓ Balanced' : `⚠ ${formatMoney(glData.totals.difference, glData.currency)} Imbalance` }}
                  </strong>
                  <span class="box-sub">
                    {{ glData.totals.is_balanced ? 'Total Dr = Total Cr (0.00 Diff)' : 'Audit Warning: Debits != Credits' }}
                  </span>
                </div>
              </div>

              <!-- Primary Posted Journal Table -->
              <div class="journal-table-card">
                <div class="card-header-bar">
                  <div class="card-title-group">
                    <span class="section-tag">Double-Entry Journal</span>
                    <h3>Official Journal Lines</h3>
                  </div>
                  <span class="lines-count-pill">{{ glData.entries?.length || 0 }} Legs</span>
                </div>

                <div class="table-responsive">
                  <table class="gl-lines-table">
                    <thead>
                      <tr>
                        <th style="width: 80px;">GL Code</th>
                        <th style="width: 170px;">Account Name</th>
                        <th style="width: 95px;">Type</th>
                        <th>Description / Leg Purpose</th>
                        <th class="right" style="width: 120px;">Debit (Dr)</th>
                        <th class="right" style="width: 120px;">Credit (Cr)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(leg, idx) in glData.entries" :key="leg.leg_id || idx" :class="rowClass(leg)">
                        <td class="gl-code-cell mono">{{ leg.gl_account_number || leg.gl_code }}</td>
                        <td class="account-name-cell">
                          <strong>{{ leg.gl_account_name || leg.account_name }}</strong>
                        </td>
                        <td>
                          <span class="type-pill" :class="accountTypeClass(leg.account_type || leg.type)">
                            {{ leg.account_type || leg.type }}
                          </span>
                        </td>
                        <td class="desc-cell">
                          <span>{{ leg.description }}</span>
                        </td>
                        <td class="right mono debit-col">
                          <span v-if="leg.debit != null && Number(leg.debit) > 0" class="dr-val">
                            +{{ formatMoney(leg.debit, glData.currency) }}
                          </span>
                          <span v-else class="muted">—</span>
                        </td>
                        <td class="right mono credit-col">
                          <span v-if="leg.credit != null && Number(leg.credit) > 0" class="cr-val">
                            -{{ formatMoney(leg.credit, glData.currency) }}
                          </span>
                          <span v-else class="muted">—</span>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="table-footer-row">
                        <td colspan="4">
                          <div class="footer-totals-title">
                            <strong>JOURNAL TOTALS</strong>
                            <span class="footer-status-pill" :class="glData.totals.is_balanced ? 'pass' : 'fail'">
                              {{ glData.totals.is_balanced ? '✓ Dr = Cr Balanced' : '⚠ Out of Balance' }}
                            </span>
                          </div>
                        </td>
                        <td class="right mono debit-col">
                          <strong>+{{ formatMoney(glData.totals.total_debit, glData.currency) }}</strong>
                        </td>
                        <td class="right mono credit-col">
                          <strong>-{{ formatMoney(glData.totals.total_credit, glData.currency) }}</strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <!-- Accounting Impact Explanation Callout -->
              <div class="accounting-explanation-card">
                <div class="explanation-icon">💡</div>
                <div class="explanation-content">
                  <h4>Accounting Impact Analysis</h4>
                  <p>{{ glData.explanation }}</p>
                </div>
              </div>

              <!-- Reversal Journal Table (if reversed) -->
              <div v-if="glData.is_reversed && glData.reversal_entries?.length" class="journal-table-card reversal-card">
                <div class="card-header-bar reversal-header">
                  <div class="card-title-group">
                    <span class="section-tag reversed">Offsetting Reversal</span>
                    <h3>Reversal Journal Lines</h3>
                  </div>
                  <span class="reversal-pill">Voided Entry</span>
                </div>

                <div class="table-responsive">
                  <table class="gl-lines-table">
                    <thead>
                      <tr>
                        <th style="width: 80px;">GL Code</th>
                        <th style="width: 170px;">Account Name</th>
                        <th style="width: 95px;">Type</th>
                        <th>Description / Reversal Leg</th>
                        <th class="right" style="width: 120px;">Debit (Dr)</th>
                        <th class="right" style="width: 120px;">Credit (Cr)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(leg, idx) in glData.reversal_entries" :key="leg.leg_id || idx" class="reversed-line-row">
                        <td class="gl-code-cell mono">{{ leg.gl_account_number || leg.gl_code }}</td>
                        <td class="account-name-cell">
                          <strong>{{ leg.gl_account_name || leg.account_name }}</strong>
                        </td>
                        <td>
                          <span class="type-pill" :class="accountTypeClass(leg.account_type || leg.type)">
                            {{ leg.account_type || leg.type }}
                          </span>
                        </td>
                        <td class="desc-cell">
                          <span>{{ leg.description }}</span>
                        </td>
                        <td class="right mono debit-col">
                          <span v-if="leg.debit != null && Number(leg.debit) > 0" class="dr-val">
                            +{{ formatMoney(leg.debit, glData.currency) }}
                          </span>
                          <span v-else class="muted">—</span>
                        </td>
                        <td class="right mono credit-col">
                          <span v-if="leg.credit != null && Number(leg.credit) > 0" class="cr-val">
                            -{{ formatMoney(leg.credit, glData.currency) }}
                          </span>
                          <span v-else class="muted">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Source Document & Linked Records Traceability -->
              <div class="traceability-card" v-if="hasRelatedRecords">
                <h4>Linked Source Documents</h4>
                <div class="related-pills">
                  <RouterLink 
                    v-if="glData.related_documents?.invoice_id" 
                    :to="`/finance/invoices/${glData.related_documents.invoice_id}`"
                    class="related-link-pill"
                  >
                    <span>📄 Invoice</span>
                    <strong>#{{ glData.related_documents.invoice_number || glData.related_documents.invoice_id }}</strong>
                  </RouterLink>

                  <RouterLink 
                    v-if="glData.related_documents?.customer_id" 
                    :to="`/finance/reports/customer-ledger?customer_id=${glData.related_documents.customer_id}`"
                    class="related-link-pill"
                  >
                    <span>👤 Customer Ledger</span>
                    <strong>{{ glData.related_documents.customer_name || 'Customer' }}</strong>
                  </RouterLink>

                  <RouterLink 
                    v-if="glData.related_documents?.vendor_id" 
                    :to="`/finance/reports/vendor-ledger?vendor_id=${glData.related_documents.vendor_id}`"
                    class="related-link-pill"
                  >
                    <span>🏢 Vendor Ledger</span>
                    <strong>{{ glData.related_documents.vendor_name || 'Vendor' }}</strong>
                  </RouterLink>
                </div>
              </div>

            </div>
          </main>

          <!-- Drawer Footer -->
          <footer class="drawer-footer">
            <button class="button secondary" @click="closeDrawer">Close</button>
            <button class="button" @click="drillDownToGL" v-if="glData?.is_posted">
              <svg viewBox="0 0 24 24" width="15" height="15" style="margin-right: 6px;"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" fill="currentColor"/></svg>
              View in General Ledger Report
            </button>
          </footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '../api/client'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  transactionId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close'])
const router = useRouter()

const loading = ref(false)
const error = ref('')
const glData = ref(null)

watch(() => props.isOpen, (val) => {
  if (val && props.transactionId) {
    loadGlEntries()
  } else if (!val) {
    glData.value = null
    error.value = ''
  }
})

watch(() => props.transactionId, (newId) => {
  if (props.isOpen && newId) {
    loadGlEntries()
  }
})

async function loadGlEntries() {
  if (!props.transactionId) return
  loading.value = true
  error.value = ''
  try {
    const data = await apiGet(`/api/finance/transactions/${props.transactionId}/gl-entries`)
    glData.value = data
  } catch (err) {
    error.value = err.message || 'Unable to load General Ledger entries for this transaction.'
  } finally {
    loading.value = false
  }
}

function closeDrawer() {
  emit('close')
}

function handleBackdropClick() {
  closeDrawer()
}

function drillDownToGL() {
  if (!props.transactionId) return
  closeDrawer()
  router.push({
    path: '/finance/reports/general-ledger',
    query: {
      search: props.transactionId
    }
  })
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

function formatMoney(amount, currency = 'INR') {
  const num = Number(amount || 0)
  const sym = currency === 'INR' ? '₹' : (currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : '$'))
  return `${sym}${Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function rowClass(leg) {
  if (leg.debit && Number(leg.debit) > 0) return 'dr-row'
  return 'cr-row'
}

function accountTypeClass(tp) {
  const t = String(tp || '').toLowerCase()
  if (t.includes('asset')) return 'type-asset'
  if (t.includes('liability')) return 'type-liability'
  if (t.includes('expense')) return 'type-expense'
  if (t.includes('revenue') || t.includes('income')) return 'type-revenue'
  return 'type-default'
}

const hasRelatedRecords = computed(() => {
  if (!glData.value?.related_documents) return false
  const r = glData.value.related_documents
  return Boolean(r.invoice_id || r.customer_id || r.vendor_id || r.expense_claim_id)
})
</script>

<style scoped>
.gl-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease-out;
}

.gl-drawer-panel {
  width: 100%;
  max-width: 680px;
  background: #ffffff;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.16);
  animation: slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

/* Header */
.drawer-header {
  padding: 22px 28px 18px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.header-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.eyebrow-tag {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #64748b;
}

.drawer-title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.3px;
}

.tx-ref-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.tx-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 800;
  background: #e2e8f0;
  color: #1e293b;
  padding: 2px 7px;
  border-radius: 4px;
}

.tx-desc {
  font-size: 12.5px;
  color: #64748b;
  max-width: 420px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Status Badges */
.status-badge {
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 2px 8px;
  border-radius: 999px;
}

.status-badge.posted {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status-badge.reversed {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.status-badge.draft {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

/* Actions bar */
.drawer-actions-bar {
  padding: 12px 28px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-pills {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.gl-drilldown-btn {
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  color: #0284c7;
  border: 1px solid #bae6fd;
}

.gl-drilldown-btn:hover {
  background: #f0f9ff;
  border-color: #7dd3fc;
}

/* Body */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  background: #f8fafc;
}

.gl-content-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* States */
.state-container {
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  color: #64748b;
}

.state-icon {
  font-size: 40px;
  margin-bottom: 4px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--primary, #0284c7);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Reversal Alert */
.reversal-alert-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 10px;
  color: #9f1239;
  font-size: 12.5px;
  line-height: 1.5;
}

.alert-icon { font-size: 18px; }

/* Journal Summary Cards */
.journal-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.summary-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.summary-box.dr { border-left: 4px solid #16a34a; }
.summary-box.cr { border-left: 4px solid #dc2626; }
.summary-box.balance.balanced { border-left: 4px solid #0284c7; }
.summary-box.balance.unbalanced { border-left: 4px solid #f59e0b; background: #fffbeb; }

.box-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
}

.box-value {
  font-size: 18px;
  font-weight: 900;
  margin: 4px 0 2px;
}

.box-sub {
  font-size: 11px;
  color: #94a3b8;
}

.text-success { color: #16a34a !important; }
.text-danger { color: #dc2626 !important; }

/* Journal Table Card */
.journal-table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-header-bar {
  padding: 14px 18px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-tag {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  color: #0284c7;
  letter-spacing: 0.5px;
}

.section-tag.reversed { color: #dc2626; }

.card-title-group h3 {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.lines-count-pill {
  font-size: 11px;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
  padding: 3px 10px;
  border-radius: 999px;
}

.table-responsive {
  overflow-x: auto;
}

.gl-lines-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.gl-lines-table th {
  background: #f8fafc;
  padding: 10px 14px;
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  color: #475569;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

.gl-lines-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.dr-row:hover, .cr-row:hover {
  background: #f8fafc;
}

.gl-code-cell {
  font-size: 12px;
  font-weight: 700;
  color: #0284c7;
}

.account-name-cell strong {
  color: #0f172a;
  font-size: 13px;
}

.type-pill {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 4px;
  display: inline-block;
}

.type-asset { background: #e0f2fe; color: #0369a1; }
.type-liability { background: #fef3c7; color: #92400e; }
.type-expense { background: #fee2e2; color: #991b1b; }
.type-revenue { background: #dcfce7; color: #166534; }
.type-default { background: #f1f5f9; color: #475569; }

.desc-cell {
  color: #64748b;
  font-size: 12px;
}

.debit-col {
  color: #16a34a;
  font-weight: 700;
  font-size: 13px;
}

.credit-col {
  color: #dc2626;
  font-weight: 700;
  font-size: 13px;
}

.table-footer-row td {
  background: #f8fafc;
  border-top: 2px solid #e2e8f0;
  padding: 13px 14px;
}

.footer-totals-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-totals-title strong {
  font-size: 12px;
  color: #0f172a;
}

.footer-status-pill {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
}

.footer-status-pill.pass { background: #dcfce7; color: #166534; }
.footer-status-pill.fail { background: #fee2e2; color: #991b1b; }

/* Accounting Explanation Card */
.accounting-explanation-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
}

.explanation-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}

.explanation-content h4 {
  font-size: 12.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #166534;
  margin: 0 0 4px;
}

.explanation-content p {
  font-size: 13px;
  color: #14532d;
  margin: 0;
  line-height: 1.5;
  font-weight: 500;
}

/* Reversal card */
.reversal-card {
  border-color: #fecdd3;
}

.reversal-header {
  background: #fff1f2;
}

.reversal-pill {
  font-size: 11px;
  font-weight: 800;
  background: #ffe4e6;
  color: #9f1239;
  padding: 3px 9px;
  border-radius: 999px;
}

.reversed-line-row {
  background: #fff5f5;
}

/* Traceability card */
.traceability-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px;
}

.traceability-card h4 {
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  margin: 0 0 10px;
}

.related-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.related-link-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #0f172a;
  text-decoration: none;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.15s;
}

.related-link-pill:hover {
  background: #f0f9ff;
  border-color: #bae6fd;
  color: #0284c7;
}

/* Drawer Footer */
.drawer-footer {
  padding: 16px 28px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.mono { font-family: 'JetBrains Mono', monospace; }
.right { text-align: right; }

/* Mobile responsiveness */
@media (max-width: 768px) {
  .gl-drawer-panel {
    max-width: 100%;
  }

  .drawer-header, .drawer-actions-bar, .drawer-body, .drawer-footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .journal-summary-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.22s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
</style>
