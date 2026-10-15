<template>
  <div class="transaction-form-view">
    <!-- Page Header (Only when not inside modal) -->
    <header v-if="!props.isModal" class="form-header">
      <div>
        <p class="eyebrow">Finance Module</p>
        <h1>{{ isEditing ? `Edit Transaction #${displayTransactionId(props.id)}` : 'Create Transaction' }}</h1>
        <p class="muted">Post standard double-entry accounting records to the General Ledger.</p>
      </div>

      <!-- Type Switcher Pill -->
      <div class="type-toggle-group">
        <button 
          type="button" 
          class="type-btn" 
          :class="{ active: form.type === 'Income' }" 
          @click="form.type = 'Income'"
        >
          <span class="dot income-dot"></span>
          Inflow (Income)
        </button>
        <button 
          type="button" 
          class="type-btn" 
          :class="{ active: form.type === 'Expense' }" 
          @click="form.type = 'Expense'"
        >
          <span class="dot expense-dot"></span>
          Outflow (Expense)
        </button>
      </div>
    </header>

    <!-- Modal Header (When rendered inside modal) -->
    <div v-else class="modal-form-header">
      <div>
        <h2 class="modal-title">{{ isEditing ? `Edit Transaction #${displayTransactionId(props.id)}` : 'New Transaction Entry' }}</h2>
        <span class="muted small">Record dual-entry financial movement.</span>
      </div>
      <div class="type-toggle-group compact">
        <button 
          type="button" 
          class="type-btn" 
          :class="{ active: form.type === 'Income' }" 
          @click="form.type = 'Income'"
        >
          Income
        </button>
        <button 
          type="button" 
          class="type-btn" 
          :class="{ active: form.type === 'Expense' }" 
          @click="form.type = 'Expense'"
        >
          Expense
        </button>
      </div>
    </div>

    <!-- Main Form -->
    <form class="transaction-main-form" @submit.prevent="openPreview">
      
      <!-- Section 1: Transaction & Timing Information -->
      <section class="form-section-card">
        <div class="section-head">
          <span class="section-step-num">1</span>
          <div>
            <h3>Transaction Information</h3>
            <span class="section-sub">Posting date, currency, and reference identifiers</span>
          </div>
        </div>

        <div class="form-row-grid">
          <div class="form-field">
            <label>Posting Date Option</label>
            <select v-model="postingDateOption" class="form-control">
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          <div class="form-field" v-if="postingDateOption === 'custom'">
            <label>Custom Posting Date <span class="req">*</span></label>
            <input v-model="form.transaction_date" type="date" required class="form-control" :class="{ 'input-error': isPeriodLocked }">
          </div>

          <div class="form-field">
            <label>Currency</label>
            <select v-model="form.currency" class="form-control">
              <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }} ({{ currencySymbolsMap[c.code] || '$' }})</option>
            </select>
          </div>

          <div class="form-field">
            <label>Reference Number</label>
            <input v-model="form.reference" type="text" placeholder="e.g. INV-9902 or Bank UTR" class="form-control">
          </div>
        </div>

        <!-- Locked Period Alert in Section 1 -->
        <div v-if="isPeriodLocked" class="locked-period-callout">
          <div class="lock-callout-icon">🔒</div>
          <div class="lock-callout-content">
            <h4 class="lock-callout-title">Posting Blocked: Accounting Period is Locked ({{ lockedPeriodName }})</h4>
            <p class="lock-callout-desc">{{ lockedPeriodWarning }}</p>
            <p class="lock-callout-hint">To maintain regulatory and financial integrity, transactions cannot be posted to closed periods. Please select an open date or contact an administrator to reopen this period in <strong>Settings → Accounting Periods</strong>.</p>
          </div>
        </div>
      </section>

      <!-- Section 2: Business & Allocation Details -->
      <section class="form-section-card">
        <div class="section-head">
          <span class="section-step-num">2</span>
          <div>
            <h3>Commercial & Account Allocation</h3>
            <span class="section-sub">Select counterpart entity, GL posting account, and product</span>
          </div>
        </div>

        <div class="form-row-grid">
          <!-- Primary Account -->
          <div class="form-field span-2">
            <label>GL Posting Account <span class="req">*</span></label>
            <select v-model="form.account_id" required class="form-control highlight-select">
              <option value="">Select Account</option>
              <option v-for="acc in filteredAccountsForDropdown" :key="acc.id" :value="acc.id">
                {{ accountLabel(acc) }}
              </option>
            </select>
          </div>

          <!-- Customer (If Income) -->
          <div class="form-field" v-if="form.type === 'Income'">
            <label>Customer</label>
            <select v-model="form.customer_id" class="form-control">
              <option value="">Select Customer</option>
              <option v-for="cust in customers" :key="cust.id" :value="cust.id">{{ cust.company_name }}</option>
            </select>
          </div>

          <!-- Invoice Selector (If Sales Revenue Receipt) -->
          <div class="form-field" v-if="isSalesRevenueReceipt">
            <label>Linked Receivable Invoice <span class="req">*</span></label>
            <select v-model="form.invoice_id" :disabled="!form.customer_id || invoiceLoading" required class="form-control">
              <option value="">{{ invoiceSelectPlaceholder }}</option>
              <option v-for="inv in receivableInvoices" :key="inv.id" :value="inv.id">
                {{ invoiceLabel(inv) }}
              </option>
            </select>
            <span v-if="invoiceHint" class="field-hint">{{ invoiceHint }}</span>
          </div>

          <!-- Associated Project (If Income) -->
          <div class="form-field" v-if="form.type === 'Income'">
            <label>Associated Project</label>
            <select v-model="form.project_id" class="form-control">
              <option value="">Select Project</option>
              <option v-for="p in filteredProjects" :key="p.id" :value="p.id">{{ p.project_name }}</option>
            </select>
          </div>

          <!-- Vendor (If Expense) -->
          <div class="form-field" v-if="form.type === 'Expense'">
            <label>Vendor / Supplier</label>
            <select v-model="form.vendor_id" class="form-control">
              <option value="">Select Vendor</option>
              <option v-for="vend in vendors" :key="vend.id" :value="vend.id">{{ vend.name }}</option>
            </select>
          </div>

          <!-- Approved Claim (If GL 7010 Employee Claims) -->
          <div class="form-field span-2" v-if="isEmployeeClaimsAccount">
            <label>Approved Employee Claim <span class="req">*</span></label>
            <select v-model="form.expense_claim_id" required class="form-control">
              <option value="">Select approved claim</option>
              <option v-for="claim in approvedClaims" :key="claim.id" :value="claim.id">
                {{ claim.claim_number || 'Claim' }} · {{ claim.employee_name }} - {{ money(claim.amount || claim.total_claim_amount) }}
              </option>
            </select>
            <span class="field-hint">Only approved, unposted claims are eligible for GL 7010 - Employee Claims.</span>
          </div>

          <!-- Product / Service -->
          <div class="form-field">
            <label>Product / Service</label>
            <select v-model="form.product_id" class="form-control">
              <option value="">No Product</option>
              <option v-for="prod in activeProducts" :key="prod.id || prod.product_code" :value="prod.id || prod.product_code">
                {{ productName(prod) }}
              </option>
            </select>
          </div>

          <!-- Category -->
          <div class="form-field">
            <label>Transaction Category</label>
            <select v-model="form.category" class="form-control">
              <option value="">Select Category</option>
              <option>Item</option>
              <option>Service</option>
              <option>Fixed Assets</option>
              <option>Loan Disbursement</option>
              <option>Loan Repayment</option>
            </select>
          </div>

          <!-- Loan Account & Schedule -->
          <div class="form-field" v-if="requiresLoanAccount">
            <label>Loan Account <span class="req">*</span></label>
            <select v-model="form.loan_account_id" required class="form-control">
              <option value="">Select Loan Account</option>
              <option v-for="loan in loans" :key="loan.id" :value="loan.id">
                {{ loan.loan_account_number }} · {{ loan.provider_name }}
              </option>
            </select>
          </div>

          <div class="form-field" v-if="form.category === 'Loan Repayment'">
            <label>Repayment Schedule Line <span class="req">*</span></label>
            <select v-model="form.loan_schedule_id" required class="form-control">
              <option value="">Select Schedule Line</option>
              <option v-for="sched in selectedLoanSchedules" :key="sched.id" :value="sched.id">
                #{{ sched.installment_number }} · {{ sched.due_date }} · {{ money(sched.total_amount) }}
              </option>
            </select>
          </div>

          <!-- Fixed Assets Current Value -->
          <div class="form-field" v-if="form.category === 'Fixed Assets'">
            <label>Current / Book Value</label>
            <input v-model="form.depreciation_value" type="number" step="0.01" placeholder="Book value after depreciation" class="form-control">
            <span class="field-hint">The asset's present book value on the balance sheet.</span>
          </div>
        </div>
      </section>

      <!-- Section 3: Financial Details & Statutory Breakdown -->
      <section class="form-section-card">
        <div class="section-head">
          <span class="section-step-num">3</span>
          <div>
            <h3>Financial Breakdown & Taxes</h3>
            <span class="section-sub">Enter base amount, applicable GST, withholding TDS, and fees</span>
          </div>
        </div>

        <div class="form-row-grid">
          <!-- Base Amount -->
          <div class="form-field span-2 base-amount-wrap">
            <label>Base Transaction Amount <span class="req">*</span></label>
            <div class="amount-input-group">
              <span class="curr-prefix">{{ currentCurrencySymbol }}</span>
              <input 
                v-model="form.amount" 
                type="number" 
                step="0.01" 
                min="0.01" 
                required 
                @input="onAmountInput" 
                placeholder="0.00"
                class="form-control amount-input"
              >
            </div>
          </div>

          <!-- CGST % -->
          <div class="form-field">
            <label>CGST (%)</label>
            <div class="tax-input-group">
              <input v-model="form.cgst_percent" type="number" step="0.01" min="0" placeholder="0" class="form-control">
              <span class="tax-computed" v-if="computedCGST > 0">+{{ money(computedCGST) }}</span>
            </div>
          </div>

          <!-- IGST % -->
          <div class="form-field">
            <label>IGST (%)</label>
            <div class="tax-input-group">
              <input v-model="form.igst_percent" type="number" step="0.01" min="0" placeholder="0" class="form-control">
              <span class="tax-computed" v-if="computedIGST > 0">+{{ money(computedIGST) }}</span>
            </div>
          </div>

          <!-- TDS % -->
          <div class="form-field">
            <label>TDS Withheld (%)</label>
            <div class="tax-input-group">
              <input v-model="form.tds_percent" type="number" step="0.01" min="0" placeholder="0" class="form-control">
              <span class="tax-computed negative" v-if="computedTDS > 0">-{{ money(computedTDS) }}</span>
            </div>
          </div>

          <!-- Additional Charges -->
          <div class="form-field">
            <label>Additional Charges ({{ currentCurrencySymbol }})</label>
            <input 
              v-model="form.additional_charges" 
              type="number" 
              step="0.01" 
              @input="onAdditionalChargesAmountInput" 
              placeholder="e.g. 10.00" 
              class="form-control"
            >
          </div>

          <!-- Platform / Gateway Fee -->
          <div class="form-field">
            <label>Platform / Gateway Fee ({{ currentCurrencySymbol }})</label>
            <input 
              v-model="form.platform_fee_amount" 
              type="number" 
              step="0.01" 
              @input="onPlatformFeeAmountInput" 
              placeholder="e.g. 1.40" 
              class="form-control"
            >
          </div>

          <!-- Payment / Settlement Mode -->
          <div class="form-field">
            <label>Counterpart Settlement</label>
            <select v-model="form.payment_status" class="form-control">
              <option value="Paid">Immediate Bank Disbursement / Receipt</option>
              <option value="Unpaid">Unpaid (Book to Accounts Payable / Receivable)</option>
            </select>
          </div>
        </div>

        <!-- Grand Total Calculation Box -->
        <div class="grand-total-summary-card" :class="form.type === 'Income' ? 'income-card' : 'expense-card'">
          <div class="total-breakdown-details">
            <span class="total-label">Total Calculated Net Movement:</span>
            <div class="calc-chips">
              <span>Base: {{ money(form.amount || 0) }}</span>
              <span v-if="computedCGST > 0">CGST: +{{ money(computedCGST) }}</span>
              <span v-if="computedIGST > 0">IGST: +{{ money(computedIGST) }}</span>
              <span v-if="computedAdditionalCharges > 0">Charges: +{{ money(computedAdditionalCharges) }}</span>
              <span v-if="computedTDS > 0" class="neg">TDS: -{{ money(computedTDS) }}</span>
              <span v-if="computedPlatformFee > 0" class="neg">Platform: {{ form.type === 'Income' ? '-' : '+' }}{{ money(computedPlatformFee) }}</span>
            </div>
          </div>
          <div class="total-amount-display">
            <span class="net-val-label">{{ form.type === 'Income' ? 'Net Bank Inflow' : 'Net Bank Outflow' }}</span>
            <strong class="net-val">{{ form.type === 'Income' ? '+' : '-' }} {{ money(computedTotal) }}</strong>
          </div>
        </div>
      </section>

      <!-- Section 4: LIVE ACCOUNTING PREVIEW (PART C) -->
      <section class="form-section-card preview-section-card">
        <div class="section-head preview-toggle-head" @click="showLivePreview = !showLivePreview">
          <div class="head-title-wrap">
            <span class="section-step-num special">4</span>
            <div>
              <div class="preview-badge-row">
                <h3>Accounting Preview — Debit & Credit</h3>
                <span class="simulated-pill">Simulated Preview (Unposted)</span>
                <span v-if="isPeriodLocked" class="period-locked-pill">🔒 Period Locked</span>
                <span class="balance-tag" :class="simulatedLedgerTotals.isBalanced ? 'pass' : 'fail'">
                  {{ simulatedLedgerTotals.isBalanced ? '✓ Balanced (Dr = Cr)' : `⚠ Out of Balance` }}
                </span>
              </div>
              <span class="section-sub">Real-time simulation of the double-entry journal lines generated upon posting</span>
            </div>
          </div>
          <button type="button" class="preview-toggle-btn">
            {{ showLivePreview ? 'Collapse ▲' : 'Expand Preview ▼' }}
          </button>
        </div>

        <!-- Collapsible Content -->
        <transition name="expand">
          <div v-if="showLivePreview" class="preview-section-body">
            <!-- Locked Period Notification in Simulated Preview -->
            <div v-if="isPeriodLocked" class="preview-period-locked-notice">
              <span class="lock-notice-icon">🔒</span>
              <div>
                <strong>Posting will be rejected:</strong> {{ lockedPeriodWarning }} Double-entry ledger journal lines cannot be committed while this period is locked.
              </div>
            </div>

            <div class="preview-disclaimer">
              <span class="info-icon">ℹ️</span>
              <span><strong>Pre-posting validation:</strong> Official General Ledger entries are validated and posted to the database upon submission. No unposted entries affect financial reports.</span>
            </div>

            <!-- Simulated Journal Table -->
            <div class="table-responsive">
              <table class="simulated-gl-table">
                <thead>
                  <tr>
                    <th style="width: 85px;">GL Code</th>
                    <th style="width: 190px;">Account Name</th>
                    <th style="width: 95px;">Type</th>
                    <th>Line Purpose / Description</th>
                    <th class="right" style="width: 125px;">Debit (Dr)</th>
                    <th class="right" style="width: 125px;">Credit (Cr)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(entry, idx) in simulatedLedger" :key="idx" :class="entry.debit ? 'dr-row' : 'cr-row'">
                    <td class="mono font-bold text-primary">{{ entry.gl_code }}</td>
                    <td><strong>{{ entry.account }}</strong></td>
                    <td>
                      <span class="type-pill-sm" :class="entry.type.toLowerCase()">{{ entry.type }}</span>
                    </td>
                    <td class="muted small">{{ entry.description }}</td>
                    <td class="right mono debit-col">
                      <span v-if="entry.debit && Number(entry.debit) > 0">+{{ money(entry.debit) }}</span>
                      <span v-else class="muted">—</span>
                    </td>
                    <td class="right mono credit-col">
                      <span v-if="entry.credit && Number(entry.credit) > 0">-{{ money(entry.credit) }}</span>
                      <span v-else class="muted">—</span>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="simulated-footer-row">
                    <td colspan="4">
                      <strong>SIMULATED JOURNAL TOTAL</strong>
                    </td>
                    <td class="right mono debit-col">
                      <strong>+{{ money(simulatedLedgerTotals.totalDebit) }}</strong>
                    </td>
                    <td class="right mono credit-col">
                      <strong>-{{ money(simulatedLedgerTotals.totalCredit) }}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Dynamic Accounting Explanation -->
            <div class="dynamic-explanation-callout">
              <div class="exp-icon">💡</div>
              <div class="exp-text">
                <strong>Accounting Impact:</strong> {{ liveAccountingExplanation }}
              </div>
            </div>
          </div>
        </transition>
      </section>

      <!-- Section 5: Description & Supporting Documents -->
      <section class="form-section-card">
        <div class="section-head">
          <span class="section-step-num">5</span>
          <div>
            <h3>Description & Supporting Documents</h3>
            <span class="section-sub">Add transaction remarks and attach invoices, bills, or receipts</span>
          </div>
        </div>

        <div class="form-row-grid">
          <div class="form-field span-2">
            <label>Description / Remarks</label>
            <textarea v-model="form.description" rows="3" placeholder="Provide notes, business rationale, or invoice description..." class="form-control"></textarea>
          </div>

          <!-- Attachments -->
          <div class="form-field span-2">
            <label>Supporting Documents</label>
            <div class="file-upload-dropzone">
              <input 
                type="file" 
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" 
                :disabled="uploadingDocument" 
                multiple 
                @change="handleTransactionDocuments" 
                id="doc-upload" 
                class="hidden-file-input"
              >
              <label for="doc-upload" class="dropzone-label">
                <svg viewBox="0 0 24 24" width="28" height="28" class="upload-icon"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="currentColor"/></svg>
                <span class="dropzone-text">
                  <strong v-if="uploadingDocument">Uploading files...</strong>
                  <strong v-else>Click to upload documents</strong>
                  <small>PDF, PNG, JPG, Excel, Word (up to 10MB each)</small>
                </span>
              </label>
            </div>
          </div>

          <div v-if="form.attachments.length" class="form-field span-2">
            <DocumentPreview :documents="form.attachments" label="Attached Files" />
          </div>
        </div>
      </section>

      <!-- Section 6: Custom Fields (If present) -->
      <section class="form-section-card" v-if="customTransactionFields.length">
        <div class="section-head">
          <span class="section-step-num">6</span>
          <div>
            <h3>Additional Attributes</h3>
            <span class="section-sub">Configured custom CRM fields</span>
          </div>
        </div>

        <div class="form-row-grid">
          <div 
            v-for="field in customTransactionFields" 
            :key="field.api_name" 
            class="form-field"
            :class="isSpan2(field) ? 'span-2' : ''"
          >
            <label>{{ field.label }} <span v-if="field.is_required" class="req">*</span></label>
            
            <textarea
              v-if="field.field_type === 'Long Text'"
              v-model="form[field.api_name]"
              :required="field.is_required"
              rows="3"
              class="form-control"
            ></textarea>

            <select
              v-else-if="field.field_type === 'Dropdown'"
              v-model="form[field.api_name]"
              :required="field.is_required"
              class="form-control"
            >
              <option value="">Select {{ field.label }}</option>
              <option v-for="opt in parseOptions(field.picklist_options)" :key="opt" :value="opt">{{ opt }}</option>
            </select>

            <label v-else-if="field.field_type === 'Checkbox'" class="checkbox-label">
              <input type="checkbox" v-model="form[field.api_name]">
              <span>{{ field.label }}</span>
            </label>

            <input
              v-else-if="field.field_type === 'Number'"
              type="number"
              v-model="form[field.api_name]"
              :required="field.is_required"
              class="form-control"
            >

            <input
              v-else-if="field.field_type === 'Date'"
              type="date"
              v-model="form[field.api_name]"
              :required="field.is_required"
              class="form-control"
            >

            <input
              v-else
              type="text"
              v-model="form[field.api_name]"
              :required="field.is_required"
              class="form-control"
            >
          </div>
        </div>
      </section>

      <!-- Error banner if validation fails -->
      <div v-if="error" class="form-error-banner">
        <span class="err-icon">⚠️</span>
        <span>{{ error }}</span>
      </div>

      <!-- Action Footer -->
      <footer class="form-actions-footer">
        <button 
          v-if="props.isModal" 
          class="button secondary" 
          type="button" 
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <RouterLink 
          v-else 
          class="button secondary" 
          to="/finance/transactions"
        >
          Cancel
        </RouterLink>

        <button 
          class="button primary-submit-btn" 
          :class="{ 'blocked-btn': isPeriodLocked }"
          type="submit"
          :disabled="isPosting || isPeriodLocked"
          :title="isPeriodLocked ? lockedPeriodWarning : ''"
        >
          <span v-if="isPosting" class="btn-spinner"></span>
          <span v-else-if="isPeriodLocked">🔒 Period Locked (Posting Blocked)</span>
          <span v-else>{{ isPosting ? 'Posting to Ledger...' : (isEditing ? 'Save Changes' : 'Confirm & Post Entry') }}</span>
        </button>
      </footer>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut, apiUploadFile } from '../api/client'
import DocumentPreview from '../components/DocumentPreview.vue'

const props = defineProps({
  id: {
    type: String,
    default: null
  },
  isModal: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cancel', 'save-success'])
const router = useRouter()

const isEditing = computed(() => Boolean(props.id))
const accounts = ref([])
const customers = ref([])
const vendors = ref([])
const products = ref([])
const currencies = ref([])
const projects = ref([])
const loans = ref([])
const approvedClaims = ref([])
const receivableInvoices = ref([])
const invoiceLoading = ref(false)
const transactionFields = ref([])
const uploadingDocument = ref(false)
const isPosting = ref(false)
const error = ref('')
const postingDateOption = ref('today')
const showLivePreview = ref(true)

const isPeriodLocked = ref(false)
const lockedPeriodName = ref('')
const lockedPeriodWarning = ref('')

async function checkDatePeriodLock(date) {
  if (!date) {
    isPeriodLocked.value = false
    lockedPeriodName.value = ''
    lockedPeriodWarning.value = ''
    return
  }
  try {
    const res = await apiGet(`/api/settings/accounting-periods/check?date=${date}`)
    if (res?.is_locked) {
      isPeriodLocked.value = true
      lockedPeriodName.value = res.period_name || ''
      lockedPeriodWarning.value = res.message || 'This accounting period is locked.'
    } else {
      isPeriodLocked.value = false
      lockedPeriodName.value = ''
      lockedPeriodWarning.value = ''
    }
  } catch (err) {
    console.error('Error checking accounting period lock:', err)
  }
}

const currencySymbolsMap = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£'
}

function offsetDate(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const form = reactive({
  transaction_date: offsetDate(0),
  type: 'Expense',
  account_id: '',
  product_id: '',
  customer_id: '',
  project_id: '',
  vendor_id: '',
  invoice_id: '',
  invoice_number: '',
  expense_claim_id: '',
  loan_account_id: '',
  loan_schedule_id: '',
  currency: 'INR',
  amount: '',
  cgst_percent: 0,
  cgst_amount: 0,
  igst_percent: 0,
  igst_amount: 0,
  tds_percent: 0,
  tds_amount: 0,
  additional_charges_percent: '',
  additional_charges: '',
  platform_fee_percent: '',
  platform_fee_amount: '',
  payment_status: 'Paid',
  category: '',
  depreciation_value: '',
  description: '',
  reference: '',
  attachments: []
})

watch(() => form.transaction_date, (newDate) => {
  checkDatePeriodLock(newDate)
}, { immediate: true })

watch(postingDateOption, (opt) => {
  if (opt === 'today') form.transaction_date = offsetDate(0)
  else if (opt === 'yesterday') form.transaction_date = offsetDate(-1)
})

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
  if (!isEmployeeClaimsAccount.value) form.expense_claim_id = ''
  loadReceivableInvoices()
})

watch(() => form.category, (category) => {
  if (category === 'Loan Disbursement') {
    form.type = 'Income'
    form.loan_schedule_id = ''
  } else if (category === 'Loan Repayment') {
    form.type = 'Expense'
  } else {
    form.loan_account_id = ''
    form.loan_schedule_id = ''
  }
})

watch(() => form.loan_account_id, () => {
  form.loan_schedule_id = ''
})

const customTransactionFields = computed(() => {
  return transactionFields.value.filter(f => !f.is_native)
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
  } catch {
    return options.split(',').map(s => s.trim()).filter(Boolean)
  }
}

const filteredProjects = computed(() => {
  if (!form.customer_id) return projects.value
  let list = projects.value.filter(p => p.customer_id === parseInt(form.customer_id))
  return list
})

onMounted(async () => {
  try {
    const options = await apiGet('/api/options')
    accounts.value = (options.accounts || []).filter(a => a.name !== 'Bank Account' && a.name !== 'Cash on Hand')
    customers.value = options.customers || []
    vendors.value = options.vendors || []
    products.value = options.products || []
    currencies.value = options.currencies || []
    projects.value = options.projects || []
  } catch (err) {
    console.error(err)
  }

  try {
    const loanData = await apiGet('/api/treasury/loans')
    loans.value = loanData.loans || []
  } catch {
    loans.value = []
  }

  try {
    const claimData = await apiGet('/api/finance/expense-claims/approved-unposted')
    approvedClaims.value = claimData.claims || []
  } catch {
    approvedClaims.value = []
  }

  try {
    const transactionData = await apiGet('/api/finance/transactions')
    transactionFields.value = transactionData.fields || []
    initialiseCustomFields(customTransactionFields.value)
  } catch (err) {
    console.error(err)
  }

  if (isEditing.value) {
    await loadExistingTransaction()
  } else if (form.type === 'Income') {
    const salesRev = accounts.value.find(a => a.name === 'Sales Revenue')
    if (salesRev) form.account_id = salesRev.id
  }
})

const requiresLoanAccount = computed(() => ['Loan Disbursement', 'Loan Repayment'].includes(form.category))
const selectedLoanSchedules = computed(() => {
  const loan = loans.value.find(item => Number(item.id) === Number(form.loan_account_id))
  return loan?.schedules || []
})

const currentCurrencySymbol = computed(() => currencySymbolsMap[form.currency] || '$')

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

const computedAdditionalCharges = computed(() => {
  return parseFloat((parseFloat(form.additional_charges) || 0).toFixed(2))
})

const computedPlatformFee = computed(() => {
  return parseFloat((parseFloat(form.platform_fee_amount) || 0).toFixed(2))
})

function onAmountInput() {
  if (form.additional_charges_percent !== '' && form.additional_charges_percent !== undefined) {
    onAdditionalChargesPercentInput()
  }
  if (form.platform_fee_percent !== '' && form.platform_fee_percent !== undefined) {
    onPlatformFeePercentInput()
  }
}

function onAdditionalChargesPercentInput() {
  const amt = parseFloat(form.amount) || 0
  const pct = parseFloat(form.additional_charges_percent) || 0
  form.additional_charges = amt > 0 && pct ? parseFloat((amt * (pct / 100)).toFixed(2)) : (pct === 0 ? 0 : '')
}

function onAdditionalChargesAmountInput() {
  const amt = parseFloat(form.amount) || 0
  const val = parseFloat(form.additional_charges) || 0
  form.additional_charges_percent = amt > 0 && val ? parseFloat(((val / amt) * 100).toFixed(2)) : (val === 0 ? 0 : '')
}

function onPlatformFeePercentInput() {
  const amt = parseFloat(form.amount) || 0
  const pct = parseFloat(form.platform_fee_percent) || 0
  form.platform_fee_amount = amt > 0 && pct ? parseFloat((amt * (pct / 100)).toFixed(2)) : (pct === 0 ? 0 : '')
}

function onPlatformFeeAmountInput() {
  const amt = parseFloat(form.amount) || 0
  const val = parseFloat(form.platform_fee_amount) || 0
  form.platform_fee_percent = amt > 0 && val ? parseFloat(((val / amt) * 100).toFixed(2)) : (val === 0 ? 0 : '')
}

const computedTotal = computed(() => {
  const amt = parseFloat(form.amount) || 0
  const addCharges = computedAdditionalCharges.value
  const platformFee = computedPlatformFee.value
  const cgst = computedCGST.value
  const igst = computedIGST.value
  const tds = computedTDS.value

  if (form.type === 'Income') {
    return parseFloat((amt + cgst + igst + addCharges - tds - platformFee).toFixed(2))
  } else {
    return parseFloat((amt + cgst + igst + addCharges + platformFee - tds).toFixed(2))
  }
})

const selectedAccount = computed(() => {
  if (!form.account_id) return null
  return accounts.value.find(a => a.id === parseInt(form.account_id)) || null
})

const activeProducts = computed(() => {
  return products.value.filter(p => !['Inactive', 'Archived'].includes(p.status || 'Active'))
})

const isEmployeeClaimsAccount = computed(() => {
  return form.type === 'Expense' && selectedAccount.value && (
    String(selectedAccount.value.gl_code || '').trim() === '7010' || selectedAccount.value.name === 'Employee Claims'
  )
})

const isSalesRevenueReceipt = computed(() => {
  return form.type === 'Income' && selectedAccount.value?.name === 'Sales Revenue'
})

const selectedInvoice = computed(() => {
  if (!form.invoice_id) return null
  return receivableInvoices.value.find(inv => Number(inv.id) === Number(form.invoice_id)) || null
})

const invoiceSelectPlaceholder = computed(() => {
  if (!form.customer_id) return 'Select customer first'
  if (invoiceLoading.value) return 'Loading invoices...'
  if (receivableInvoices.value.length === 0) return 'No unpaid invoices found'
  return 'Select invoice'
})

const invoiceHint = computed(() => {
  if (!isSalesRevenueReceipt.value) return ''
  if (!form.customer_id) return 'Select a customer to load open invoices.'
  if (!invoiceLoading.value && receivableInvoices.value.length === 0) {
    return 'Only outstanding invoices with remaining balance are shown.'
  }
  return ''
})

function accountLabel(acc) {
  return acc.gl_code ? `${acc.gl_code} - ${acc.name}` : acc.name
}

function productName(prod) {
  const code = prod.product_code || prod.code
  const name = prod.product_name || prod.name
  return code ? `${code} - ${name}` : name
}

function invoiceLabel(inv) {
  return `${inv.invoice_number} - ${inv.currency} ${Number(inv.balance_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} due`
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
    if (props.id && form.invoice_id) params.append('include_invoice_id', form.invoice_id)
    const data = await apiGet(`/api/finance/invoices/receivable?${params}`)
    receivableInvoices.value = data.invoices || []
  } catch (err) {
    error.value = err.message || 'Unable to load invoice records.'
  } finally {
    invoiceLoading.value = false
  }
}

async function loadExistingTransaction() {
  try {
    const data = await apiGet(`/api/finance/transactions/${props.id}`)
    const tx = data.transaction || {}
    Object.assign(form, {
      transaction_date: tx.transaction_date || tx.date || offsetDate(0),
      type: tx.type || 'Expense',
      account_id: tx.account_id || '',
      product_id: tx.product_id || '',
      customer_id: tx.customer_id || '',
      project_id: tx.project_id || '',
      vendor_id: tx.vendor_id || '',
      invoice_id: tx.invoice_id || '',
      invoice_number: tx.invoice_number || '',
      expense_claim_id: tx.expense_claim_id || '',
      loan_account_id: tx.loan_account_id || '',
      loan_schedule_id: tx.loan_schedule_id || '',
      currency: tx.currency || 'INR',
      amount: tx.amount ?? '',
      cgst_percent: tx.cgst_percent || 0,
      igst_percent: tx.igst_percent || 0,
      tds_percent: tx.tds_percent || 0,
      additional_charges_percent: tx.additional_charges_percent ?? '',
      additional_charges: tx.additional_charges ?? tx.additional_charges_amount ?? '',
      platform_fee_percent: tx.platform_fee_percent ?? '',
      platform_fee_amount: tx.platform_fee_amount ?? tx.platform_charges ?? '',
      payment_status: tx.payment_status || 'Paid',
      category: tx.category || '',
      depreciation_value: tx.depreciation_value ?? '',
      description: tx.description || '',
      reference: tx.reference || '',
      attachments: Array.isArray(tx.attachments) ? tx.attachments : []
    })
    postingDateOption.value = 'custom'
  } catch (err) {
    error.value = err.message || 'Unable to load transaction.'
  }
}

watch(() => form.expense_claim_id, (claimId) => {
  const claim = approvedClaims.value.find(c => Number(c.id) === Number(claimId))
  if (!claim) return
  const claimAmt = Number(claim.total_claim_amount || claim.amount || 0)
  form.amount = claimAmt || ''
  form.cgst_percent = 0
  form.igst_percent = 0
  form.tds_percent = 0
  form.category = claim.expense_category || 'Employee Claim'
  form.description = `Employee claim ${claim.claim_number} - ${claim.employee_name || ''}`.trim()
})

const filteredAccountsForDropdown = computed(() => {
  return accounts.value.filter(a => {
    if (!a || a.is_active === 0 || a.is_active === false) return false
    if (form.type === 'Income') {
      return a.show_in_income === 1 || a.show_in_income === true || (a.show_in_income === undefined && a.type === 'Revenue')
    }
    return a.show_in_expense === 1 || a.show_in_expense === true || (a.show_in_expense === undefined && a.type === 'Expense')
  })
})

/* Simulated Ledger calculation */
const simulatedLedger = computed(() => {
  const amt = parseFloat(form.amount) || 0
  const addCharges = computedAdditionalCharges.value
  const platformFee = computedPlatformFee.value
  const cgst = computedCGST.value
  const igst = computedIGST.value
  const tds = computedTDS.value
  const netTotal = computedTotal.value
  const isUnpaid = form.payment_status === 'Unpaid'
  const ledger = []

  if (form.type === 'Income') {
    // 1. Bank Receipt or AR
    if (netTotal > 0) {
      ledger.push({
        gl_code: isUnpaid ? '1050' : '1010',
        account: isUnpaid ? 'Accounts Receivable' : 'Bank Account',
        type: 'Asset',
        description: isUnpaid ? 'Receivable Claim Due from Customer' : 'Net Settlement Received in Bank',
        debit: netTotal,
        credit: 0
      })
    }
    // 2. Gateway Fee
    if (platformFee > 0) {
      ledger.push({
        gl_code: '5040',
        account: 'Payment Gateway & Platform Fees',
        type: 'Expense',
        description: `Payment Gateway Fee (${form.platform_fee_percent || 0}%)`,
        debit: platformFee,
        credit: 0
      })
    }
    // 3. TDS Receivable
    if (tds > 0) {
      ledger.push({
        gl_code: '1040',
        account: 'TDS Receivable',
        type: 'Asset',
        description: `TDS Receivable Asset (${form.tds_percent || 0}%)`,
        debit: tds,
        credit: 0
      })
    }
    // 4. Primary Revenue
    const acc = selectedAccount.value
    const revGl = acc?.gl_code || '4000'
    const revName = acc?.name || (revGl === '4010' ? 'Subscription Revenue' : 'Sales Revenue')
    ledger.push({
      gl_code: revGl,
      account: revName,
      type: 'Revenue',
      description: form.description || `Gross Revenue (${revName})`,
      debit: 0,
      credit: amt
    })
    // 5. Additional Charges
    if (addCharges > 0) {
      ledger.push({
        gl_code: '4020',
        account: 'Additional Charges Income',
        type: 'Revenue',
        description: 'Additional Charges Income',
        debit: 0,
        credit: addCharges
      })
    }
    // 6. Taxes
    if (cgst > 0) {
      ledger.push({
        gl_code: '2010',
        account: 'CGST Output Tax Payable',
        type: 'Liability',
        description: `CGST Output Tax (${form.cgst_percent}%)`,
        debit: 0,
        credit: cgst
      })
    }
    if (igst > 0) {
      ledger.push({
        gl_code: '2020',
        account: 'IGST Output Tax Payable',
        type: 'Liability',
        description: `IGST Output Tax (${form.igst_percent}%)`,
        debit: 0,
        credit: igst
      })
    }
  } else {
    // Expense
    // 1. Primary Expense
    const acc = selectedAccount.value
    const expGl = acc?.gl_code || '5000'
    const expName = acc?.name || 'Operating Expenses'
    ledger.push({
      gl_code: expGl,
      account: expName,
      type: 'Expense',
      description: form.description || `Operating Expense (${expName})`,
      debit: amt,
      credit: 0
    })
    // 2. Additional Charges
    if (addCharges > 0) {
      ledger.push({
        gl_code: '5050',
        account: 'Additional Charges Expense',
        type: 'Expense',
        description: 'Additional Charges Expense',
        debit: addCharges,
        credit: 0
      })
    }
    // 3. Platform Fee
    if (platformFee > 0) {
      ledger.push({
        gl_code: '5040',
        account: 'Payment Gateway & Platform Fees',
        type: 'Expense',
        description: 'Platform Processing Fee',
        debit: platformFee,
        credit: 0
      })
    }
    // 4. Taxes
    if (cgst > 0) {
      ledger.push({
        gl_code: '1020',
        account: 'CGST Input Tax Credit',
        type: 'Asset',
        description: `CGST Input Tax Credit (${form.cgst_percent}%)`,
        debit: cgst,
        credit: 0
      })
    }
    if (igst > 0) {
      ledger.push({
        gl_code: '1030',
        account: 'IGST Input Tax Credit',
        type: 'Asset',
        description: `IGST Input Tax Credit (${form.igst_percent}%)`,
        debit: igst,
        credit: 0
      })
    }
    // 5. TDS Payable
    if (tds > 0) {
      ledger.push({
        gl_code: '2030',
        account: 'TDS Payable',
        type: 'Liability',
        description: `TDS Payable Liability (${form.tds_percent}%)`,
        debit: 0,
        credit: tds
      })
    }
    // 6. Counterpart: Bank Account or Accounts Payable
    if (netTotal > 0) {
      ledger.push({
        gl_code: isUnpaid ? '2000' : '1010',
        account: isUnpaid ? 'Accounts Payable' : 'Bank Account',
        type: isUnpaid ? 'Liability' : 'Asset',
        description: isUnpaid ? 'Accounts Payable Liability' : 'Net Cash Outflow from Bank',
        debit: 0,
        credit: netTotal
      })
    }
  }

  return ledger
})

const simulatedLedgerTotals = computed(() => {
  const dr = simulatedLedger.value.reduce((s, i) => s + (parseFloat(i.debit) || 0), 0)
  const cr = simulatedLedger.value.reduce((s, i) => s + (parseFloat(i.credit) || 0), 0)
  const diff = Math.abs(dr - cr)
  return {
    totalDebit: Number(dr.toFixed(2)),
    totalCredit: Number(cr.toFixed(2)),
    difference: Number(diff.toFixed(2)),
    isBalanced: diff < 0.01
  }
})

const liveAccountingExplanation = computed(() => {
  const sym = currentCurrencySymbol.value
  const isUnpaid = form.payment_status === 'Unpaid'
  const amt = parseFloat(form.amount) || 0
  const accName = selectedAccount.value?.name || (form.type === 'Income' ? 'Sales Revenue' : 'Operating Expenses')

  if (form.type === 'Income') {
    if (computedPlatformFee.value > 0) {
      return `Gross Revenue of ${sym}${amt.toFixed(2)} recognized through credit. Platform Fee of ${sym}${computedPlatformFee.value.toFixed(2)} recognized as debit. Bank receives net deposit of ${sym}${computedTotal.value.toFixed(2)}.`
    }
    return `Revenue account (${accName}) increased by ${sym}${amt.toFixed(2)} through a credit. ${isUnpaid ? 'Accounts Receivable asset' : 'Bank Account'} debited with net amount ${sym}${computedTotal.value.toFixed(2)}.`
  } else {
    if (isUnpaid) {
      return `${accName} expense increased by ${sym}${amt.toFixed(2)} through a debit. Accounts Payable liability increased by ${sym}${computedTotal.value.toFixed(2)} through a credit. No bank movement has occurred yet.`
    }
    return `${accName} expense increased by ${sym}${amt.toFixed(2)} through a debit. Bank Account decreased by ${sym}${computedTotal.value.toFixed(2)} through a credit disbursement.`
  }
})

async function handleTransactionDocuments(event) {
  const files = Array.from(event.target.files || [])
  if (!files.length) return
  uploadingDocument.value = true
  error.value = ''
  try {
    for (const file of files) {
      const data = await apiUploadFile('/api/uploads/cloudinary', file, { folder: 'transactions' })
      form.attachments.push(data.document)
    }
  } catch (err) {
    error.value = err.message || 'Unable to upload document.'
  } finally {
    uploadingDocument.value = false
    event.target.value = ''
  }
}

function validateBeforePosting() {
  if (isPeriodLocked.value) {
    error.value = lockedPeriodWarning.value || 'Cannot post transaction into a closed/locked accounting period.'
    return false
  }
  if (!form.transaction_date || !form.account_id || !form.amount) {
    error.value = 'Please fill out all required fields: Date, Account, and Amount.'
    return false
  }
  if (Number(form.amount || 0) <= 0) {
    error.value = 'Base amount must be greater than zero.'
    return false
  }
  if (isSalesRevenueReceipt.value && !form.invoice_id) {
    error.value = 'Please select the invoice number for this Sales Revenue receipt.'
    return false
  }
  if (isEmployeeClaimsAccount.value && !form.expense_claim_id) {
    error.value = 'Please select an approved employee claim for GL 7010.'
    return false
  }
  return true
}

async function openPreview() {
  error.value = ''
  if (!validateBeforePosting()) return
  await confirmAndPost()
}

async function confirmAndPost() {
  if (isPosting.value) return
  isPosting.value = true
  error.value = ''
  try {
    const data = isEditing.value
      ? await apiPut(`/api/finance/transactions/${props.id}`, form)
      : await apiPost('/api/finance/transactions', form)
    isPosting.value = false
    if (props.isModal) {
      emit('save-success', data.id || props.id)
    } else {
      router.replace(`/finance/transactions/${data.id || props.id}?${isEditing.value ? 'updated=true' : 'posted=true'}`)
    }
  } catch (err) {
    isPosting.value = false
    error.value = err.message || 'Failed to post transaction.'
  }
}

function money(amount) {
  const sym = currentCurrencySymbol.value
  const number = Number(amount || 0)
  return `${sym}${number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

function displayTransactionId(id) {
  return String(id || '').toUpperCase()
}
</script>

<style scoped>
.transaction-form-view {
  max-width: 1040px;
  margin: 0 auto;
  padding-bottom: 80px;
}

/* Header */
.form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  background: #ffffff;
  padding: 24px 28px;
  border-radius: 16px;
  border: 1px solid var(--line, #e2e8f0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
}

.modal-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
}

/* Type Toggle Buttons */
.type-toggle-group {
  display: flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
}

.type-btn {
  border: none;
  background: transparent;
  padding: 8px 18px;
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
  cursor: pointer;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: all 0.2s;
}

.type-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.income-dot { background: #16a34a; }
.expense-dot { background: #dc2626; }

/* Main Form Structure */
.transaction-main-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Section Cards */
.form-section-card {
  background: #ffffff;
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 16px;
  padding: 24px 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.section-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.section-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #f1f5f9;
  color: #0f172a;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  flex-shrink: 0;
}

.section-step-num.special {
  background: #e0f2fe;
  color: #0284c7;
}

.section-head h3 {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 2px;
}

.section-sub {
  font-size: 12px;
  color: #64748b;
}

/* Field Grid */
.form-row-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field.span-2 {
  grid-column: span 2;
}

.form-field label {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 4px;
}

.req { color: #dc2626; }

.form-control {
  width: 100%;
  padding: 10px 14px;
  font-size: 13.5px;
  color: #0f172a;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.highlight-select {
  border-color: #93c5fd;
  background: #f8fafc;
  font-weight: 600;
}

.field-hint {
  font-size: 11px;
  color: #64748b;
  font-style: italic;
}

/* Amount Input Group */
.amount-input-group {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.amount-input-group:focus-within {
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.curr-prefix {
  padding: 0 16px;
  font-size: 18px;
  font-weight: 800;
  color: #64748b;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
}

.amount-input {
  border: none !important;
  font-size: 18px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  box-shadow: none !important;
}

/* Tax Input Group */
.tax-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.tax-computed {
  position: absolute;
  right: 10px;
  font-size: 11px;
  font-weight: 700;
  color: #16a34a;
  background: #dcfce7;
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
}

.tax-computed.negative {
  color: #991b1b;
  background: #fee2e2;
}

/* Grand Total Summary Box */
.grand-total-summary-card {
  margin-top: 20px;
  padding: 18px 22px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.income-card {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.expense-card {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.total-breakdown-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.total-label {
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  color: #475569;
  letter-spacing: 0.5px;
}

.calc-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.calc-chips span {
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.7);
  padding: 2px 8px;
  border-radius: 4px;
  color: #1e293b;
  font-family: 'JetBrains Mono', monospace;
}

.calc-chips .neg { color: #dc2626; }

.total-amount-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.net-val-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.net-val {
  font-size: 24px;
  font-weight: 900;
  font-family: 'JetBrains Mono', monospace;
}

.income-card .net-val { color: #16a34a; }
.expense-card .net-val { color: #dc2626; }

/* Section 4: Live Accounting Preview */
.preview-section-card {
  border-color: #bae6fd;
}

.preview-toggle-head {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.head-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.preview-badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.simulated-pill {
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  background: #e0f2fe;
  color: #0369a1;
  padding: 2px 8px;
  border-radius: 999px;
}

.balance-tag {
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
}

.balance-tag.pass { background: #dcfce7; color: #166534; }
.balance-tag.fail { background: #fee2e2; color: #991b1b; }

.preview-toggle-btn {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #0284c7;
  font-size: 11.5px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.preview-section-body {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #e0f2fe;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-disclaimer {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  color: #0369a1;
}

.simulated-gl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.simulated-gl-table th {
  background: #f8fafc;
  padding: 8px 12px;
  font-size: 10.5px;
  font-weight: 800;
  color: #475569;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

.simulated-gl-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.type-pill-sm {
  font-size: 9.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.type-pill-sm.asset { background: #e0f2fe; color: #0369a1; }
.type-pill-sm.liability { background: #fef3c7; color: #92400e; }
.type-pill-sm.expense { background: #fee2e2; color: #991b1b; }
.type-pill-sm.revenue { background: #dcfce7; color: #166534; }

.debit-col { color: #16a34a; font-weight: 700; }
.credit-col { color: #dc2626; font-weight: 700; }

.simulated-footer-row td {
  background: #f8fafc;
  border-top: 2px solid #e2e8f0;
  padding: 11px 12px;
}

.dynamic-explanation-callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 12.5px;
  color: #334155;
  line-height: 1.5;
}

/* Dropzone */
.file-upload-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  background: #f8fafc;
  transition: all 0.2s;
}

.file-upload-dropzone:hover {
  border-color: #0284c7;
  background: #f0f9ff;
}

.hidden-file-input { display: none; }

.dropzone-label {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon { color: #0284c7; }

.dropzone-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropzone-text strong {
  font-size: 13.5px;
  color: #0f172a;
}

.dropzone-text small {
  font-size: 11.5px;
  color: #64748b;
}

/* Form Error Banner */
.form-error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}

/* Action Footer */
.form-actions-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  padding: 20px 0;
}

.primary-submit-btn {
  background: #0284c7 !important;
  color: white !important;
  font-weight: 800;
  font-size: 14px;
  padding: 12px 28px;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
  transition: all 0.2s;
}

.primary-submit-btn:hover {
  background: #0369a1 !important;
  transform: translateY(-1px);
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}

.mono { font-family: 'JetBrains Mono', monospace; }
.right { text-align: right; }

@media (max-width: 768px) {
  .form-row-grid {
    grid-template-columns: 1fr;
  }
  .form-field.span-2 {
    grid-column: span 1;
  }
  .form-header {
    flex-direction: column;
    align-items: stretch;
  }
  .form-actions-footer {
    flex-direction: column-reverse;
  }
  .form-actions-footer .button {
    width: 100%;
    justify-content: center;
  }
}

/* Period Locked Callouts & Blocked Submit States */
.locked-period-callout {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-top: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid #ef4444;
  border-radius: 10px;
  padding: 14px 18px;
}

.lock-callout-icon {
  font-size: 20px;
  line-height: 1;
  margin-top: 2px;
}

.lock-callout-content {
  flex: 1;
}

.lock-callout-title {
  margin: 0 0 4px;
  font-size: 13.5px;
  font-weight: 800;
  color: #991b1b;
}

.lock-callout-desc {
  margin: 0 0 6px;
  font-size: 12.5px;
  color: #b91c1c;
  font-weight: 600;
}

.lock-callout-hint {
  margin: 0;
  font-size: 11.5px;
  color: #7f1d1d;
  line-height: 1.4;
}

.period-locked-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 9px;
  border-radius: 999px;
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.preview-period-locked-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff1f2;
  border: 1px solid #ffe4e6;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 14px;
  font-size: 12px;
  color: #be123c;
}

.lock-notice-icon {
  font-size: 16px;
}

.primary-submit-btn.blocked-btn {
  background: #94a3b8 !important;
  color: #f1f5f9 !important;
  box-shadow: none !important;
  cursor: not-allowed;
}

.input-error {
  border-color: #ef4444 !important;
  background: #fff5f5 !important;
}
</style>
