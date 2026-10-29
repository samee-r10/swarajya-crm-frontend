<template>
  <div class="invoice-container">
    
    <!-- LOADING STATE -->
    <div v-if="!invoice && !error" class="loading-state">
      <div class="spinner"></div>
      <p>Loading invoice details...</p>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="error" class="loading-state error no-print">
      <div class="error-icon">!</div>
      <p>{{ error }}</p>
      <button class="button secondary mt-16" @click="router.back()">Go Back</button>
    </div>

    <!-- MAIN VIEW -->
    <div v-else-if="invoice">
      
      <!-- 1. PAGE HEADER (On-screen) -->
      <header class="page-header no-print">
        <div>
          <p class="eyebrow">Finance / Invoice</p>
          <h1>{{ invoice.invoice_number }}</h1>
          <p class="muted">Issued to {{ invoice.customer_name }} on {{ formatDate(invoice.invoice_date) }}</p>
        </div>
        <div class="actions">
          <button class="button secondary btn-animate" @click="showPreviewModal = true">
            <svg viewBox="0 0 24 24" width="18" height="18" class="btn-icon"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/></svg>
            Preview
          </button>
          <button v-if="canGenerateReceipt" class="button secondary btn-animate" @click="showReceiptModal = true">
            <svg viewBox="0 0 24 24" width="18" height="18" class="btn-icon"><path d="M7 2h10a2 2 0 0 1 2 2v18l-3-2-2 2-2-2-2 2-2-2-3 2V4a2 2 0 0 1 2-2Zm2 5v2h6V7H9Zm0 4v2h6v-2H9Zm0 4v2h4v-2H9Z" fill="currentColor"/></svg>
            Receipt
          </button>
          <button class="button secondary btn-animate" @click="printInvoice">
            <svg viewBox="0 0 24 24" width="18" height="18" class="btn-icon"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" fill="currentColor"/></svg>
            Print
          </button>
          <RouterLink v-if="!isInvoiceLocked" :to="`/finance/invoices/${id}/edit`" class="button btn-animate">
            <svg viewBox="0 0 24 24" width="18" height="18" class="btn-icon"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
            Edit
          </RouterLink>
          <span v-else class="locked-note" title="Invoice locked" aria-label="Invoice locked">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4V6Zm3 10.73V18h-2v-1.27a2 2 0 1 1 2 0Z" fill="currentColor"/></svg>
          </span>
        </div>
      </header>

      <!-- CHEVRON STATUS PATH TRACKER (Salesforce-Style) -->
      <div class="status-path-tracker no-print">
        <div class="path-scroller">
          <div class="path-steps">
            <button
              v-for="step in pathSteps" 
              :key="step.status" 
              type="button"
              class="path-step"
              :disabled="isUpdatingStatus || isStatusBlocked(step.status)"
              :aria-pressed="selectedStatus === step.status"
              :title="isStatusBlocked(step.status) ? 'Approved invoices cannot return to Draft or Sent to Client.' : step.label"
              :class="{
                'active': invoice.status === step.status,
                'complete': isStepComplete(step.status),
                'selected': selectedStatus === step.status
              }"
              @click="selectStatus(step.status)"
            >
              <span class="step-label">
                <span class="step-icon" v-if="isStepComplete(step.status) && invoice.status !== step.status">✓</span>
                {{ step.label }}
              </span>
            </button>
          </div>
        </div>
        <div class="path-actions">
          <button 
            class="button btn-animate" 
            :disabled="!canUpdateStatus || isUpdatingStatus"
            @click="markStatusComplete"
          >
            <span v-if="isUpdatingStatus" class="btn-spinner"></span>
            <span v-else>✓ Mark Status as Complete</span>
          </button>
        </div>
      </div>

      <p v-if="statusError" class="status-error no-print" role="alert">{{ statusError }}</p>
      <p v-if="statusMessage" class="status-message no-print" role="status">{{ statusMessage }}</p>

      <!-- PARTIAL PAYMENT VALUE INPUT (Expands when Partially Paid is selected) -->
      <transition name="fade-slide">
        <div v-if="selectedStatus === 'Partially Paid'" class="partial-payment-card card-premium no-print">
          <div class="card-section-title">
            <h2>Record Partial Payment</h2>
          </div>
          <div class="payment-input-grid">
            <div class="input-wrap">
              <label style="font-weight: 700; font-size: 13px; color: var(--muted); display: block; margin-bottom: 6px;">
                Amount Received ({{ invoice.currency }})
              </label>
              <div class="amount-field-group">
                <input 
                  type="number" 
                  v-model.number="tempAmountPaid" 
                  step="0.01" 
                  :max="invoice.total_amount"
                  min="0"
                  placeholder="0.00"
                  class="payment-input-box"
                  @input="validateTempAmount"
                >
                <button type="button" class="button secondary small btn-animate" @click="setHalfPaid">Half Paid</button>
                <button type="button" class="button secondary small btn-animate" @click="setFullPaid">Full Paid</button>
              </div>
            </div>
            
            <div class="payment-metrics-display">
              <div class="metric">
                <span class="label">Total Amount:</span>
                <span class="value">{{ invoice.currency }} {{ Number(invoice.total_amount).toFixed(2) }}</span>
              </div>
              <div class="metric">
                <span class="label">Amount Paid:</span>
                <span class="value success">{{ invoice.currency }} {{ Number(tempAmountPaid || 0).toFixed(2) }}</span>
              </div>
              <div class="metric">
                <span class="label">Remaining Balance:</span>
                <span class="value warning" :class="{'balance-zero': remainingTempBalance <= 0}">
                  {{ invoice.currency }} {{ Number(remainingTempBalance).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <div v-if="showReceiptPrompt" class="receipt-prompt no-print">
        <div>
          <strong>Payment recorded</strong>
          <span>{{ invoice.currency }} {{ amountPaid.toFixed(2) }} acknowledged for {{ invoice.invoice_number }}.</span>
        </div>
        <div class="receipt-prompt-actions">
          <button class="button small btn-animate" @click="showReceiptModal = true; showReceiptPrompt = false">Generate Receipt</button>
          <button class="button secondary small" @click="showReceiptPrompt = false">Later</button>
        </div>
      </div>

      <!-- 2. STRUCTURED CRM DETAILS LAYOUT (On-screen) -->
      <section class="record-layout no-print">
        
        <!-- MAIN CONTENT (LEFT) -->
        <div class="main-record-pane">
          
          <!-- Invoice Details Card -->
          <div class="form-grid record-card card-premium">
            <div class="span-2 card-section-title">
              <h2>Invoice Information</h2>
              <span class="pill-badge" :class="invoice.status.toLowerCase()">{{ invoice.status }}</span>
            </div>
            
            <label>Invoice Number
              <input readonly :value="invoice.invoice_number">
            </label>
            <label>Currency
              <input readonly :value="invoice.currency">
            </label>
            <label>Invoice Date
              <input readonly :value="formatDate(invoice.invoice_date)">
            </label>
            <label>Due Date
              <input readonly :value="formatDate(invoice.due_date)">
            </label>
            <label v-if="invoice.project_name">Project
              <input readonly :value="invoice.project_name">
            </label>
            <label v-if="invoice.account_name">Account
              <input readonly :value="invoice.account_name">
            </label>
            <!-- System Information -->
            <div class="span-2">
              <SystemInfo :record="invoice" />
            </div>
          </div>

          <!-- Line Items Table Card -->
          <div class="record-card card-premium items-container">
            <div class="card-section-title">
              <h2>Line Items</h2>
            </div>
            <div class="items-table-wrap">
              <table class="items-view-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>HSN/SAC</th>
                    <th class="right">Qty</th>
                    <th class="right">Rate</th>
                    <th>Unit of Measure</th>
                    <th class="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in invoiceItems" :key="index">
                    <td class="desc-cell">{{ item.description }}</td>
                    <td>{{ item.hsn_sac || '-' }}</td>
                    <td class="right qty-cell">{{ item.qty }}</td>
                    <td class="right price-cell">{{ moneyValue(item.rate) }}</td>
                    <td>{{ item.unit_of_measure || '-' }}</td>
                    <td class="right total-cell"><strong>{{ moneyValue(item.amount) }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Notes & Terms Card -->
          <div class="record-card card-premium">
            <div class="card-section-title">
              <h2>Notes & Terms</h2>
            </div>
            <div class="notes-display">
              <p v-if="invoice.notes">{{ invoice.notes }}</p>
              <p v-else class="muted italic">No custom notes or terms configured for this invoice. Default terms apply.</p>
            </div>
          </div>

        </div>

        <!-- SIDEBAR CONTENT (RIGHT) -->
        <aside class="related-pane">
          
          <!-- Client Billing Panel -->
          <div class="panel card-premium">
            <div class="related-heading">
              <span>Bill To</span>
            </div>
            <div class="client-detail-block">
              <h3>{{ invoice.customer_name }}</h3>
              <p class="client-meta"><strong>Contact:</strong> {{ invoice.contact_name }}</p>
              <p class="client-meta"><strong>Email:</strong> {{ invoice.customer_email }}</p>
              
              <div v-if="invoice.billing_address" class="billing-address-card">
                <p class="section-sub-label">Billing Address</p>
                <p class="address-text">{{ invoice.billing_address }}</p>
              </div>
              <div v-else class="billing-address-card empty">
                <p class="address-text italic text-center">No billing address provided.</p>
              </div>
            </div>
          </div>

          <!-- Financial Summary Panel -->
          <div class="panel card-premium">
            <div class="related-heading">
              <span>Financial Summary</span>
            </div>
            <div class="summary-details">
              <div class="summary-row">
                <span>Subtotal</span>
                <strong>{{ moneyValue(gstSummary.subtotal) }}</strong>
              </div>
              <div class="summary-row">
                <span>CGST {{ moneyValue(gstSummary.cgst_percent) }}%</span>
                <strong>{{ moneyValue(gstSummary.cgst_amount) }}</strong>
              </div>
              <div class="summary-row">
                <span>SGST {{ moneyValue(gstSummary.sgst_percent) }}%</span>
                <strong>{{ moneyValue(gstSummary.sgst_amount) }}</strong>
              </div>
              <div class="summary-row">
                <span>IGST {{ moneyValue(gstSummary.igst_percent) }}%</span>
                <strong>{{ moneyValue(gstSummary.igst_amount) }}</strong>
              </div>
              <div v-if="gstSummary.legacy_tax_amount" class="summary-row">
                <span>Tax Amount</span>
                <strong>{{ moneyValue(gstSummary.legacy_tax_amount) }}</strong>
              </div>
              <div class="summary-row">
                <span>Amount Paid</span>
                <strong style="color: #16a34a;">{{ Number(invoice.amount_paid || 0).toFixed(2) }}</strong>
              </div>
              <div class="summary-row">
                <span>Balance Due</span>
                <strong :class="{'balance-zero': (invoice.total_amount - (invoice.amount_paid || 0)) <= 0}" style="color: #ea580c;">
                  {{ invoice.currency }} {{ Number(invoice.total_amount - (invoice.amount_paid || 0)).toFixed(2) }}
                </strong>
              </div>
              
              <div class="summary-row grand-total-row">
                <span>Total Amount</span>
                <span class="total-badge">{{ invoice.currency }} {{ Number(invoice.total_amount).toFixed(2) }}</span>
              </div>
            </div>
          </div>

        </aside>
      </section>

      <!-- 3. PREVIEW MODAL (Glassmorphic Lightbox - On-screen) -->
      <div v-if="showPreviewModal" class="preview-modal-overlay no-print" @click.self="showPreviewModal = false">
        <div class="preview-modal-content">
          <div class="preview-modal-header">
            <h2>Print Preview</h2>
            <div class="modal-actions">
              <button class="button btn-animate" @click="printInvoice">
                <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right: 6px;"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" fill="currentColor"/></svg>
                Print
              </button>
              <button class="button secondary btn-animate" @click="showPreviewModal = false">Close</button>
            </div>
          </div>
          <div class="preview-modal-body">
            
            <InvoiceDocument
              :invoice="invoice"
              :items="invoiceItems"
              :summary="gstSummary"
              :title="invoiceDocumentTitle"
              :amount-in-words="amountInWords"
            />

          </div>
        </div>
      </div>

      <div v-if="showReceiptModal" class="preview-modal-overlay no-print" @click.self="showReceiptModal = false">
        <div class="preview-modal-content receipt-modal-content">
          <div class="preview-modal-header">
            <div class="receipt-modal-title"><h2>Payment Receipt</h2><span>A4 · 1 page</span></div>
            <div class="modal-actions">
              <button class="button btn-animate" @click="printReceipt">
                <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right: 6px;"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" fill="currentColor"/></svg>
                Print Receipt
              </button>
              <button class="button secondary btn-animate" @click="showReceiptModal = false">Close</button>
            </div>
          </div>
          <p v-if="receiptPrintError" class="receipt-print-error" role="alert">{{ receiptPrintError }}</p>
          <div ref="receiptViewport" class="preview-modal-body receipt-preview-body">
            <div class="receipt-preview-frame" :style="receiptPreviewStyle">
              <PaymentReceipt
                ref="receiptPreview"
                :invoice="invoice"
                :receipt-number="receiptNumber"
                :receipt-date="receiptDate"
                :amount-paid="amountPaid"
                :balance-due="balanceDue"
                :payment-mode="receiptPaymentMode"
                :amount-in-words="receiptAmountInWords"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Preview and print share one invoice template. -->
      <div class="print-document-only">
        <InvoiceDocument
          :invoice="invoice"
          :items="invoiceItems"
          :summary="gstSummary"
          :title="invoiceDocumentTitle"
          :amount-in-words="amountInWords"
        />
      </div>


    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPut } from '../api/client'
import SystemInfo from '../components/SystemInfo.vue'
import InvoiceDocument from '../components/InvoiceDocument.vue'
import PaymentReceipt from '../components/PaymentReceipt.vue'
import { printReceiptDocument } from '../utils/printReceipt'

const router = useRouter()
const props = defineProps({ id: String })
const invoice = ref(null)
const error = ref('')
const showPreviewModal = ref(false)
const showReceiptModal = ref(false)
const showReceiptPrompt = ref(false)
const receiptPreview = ref(null)
const receiptViewport = ref(null)
const receiptPrintError = ref('')
const receiptPreviewStyle = ref({})
let receiptResizeObserver

watch(showReceiptModal, async isOpen => {
  receiptResizeObserver?.disconnect()
  receiptPrintError.value = ''
  if (!isOpen) return
  await nextTick()
  const viewport = receiptViewport.value
  const sheet = receiptPreview.value?.$el
  if (!viewport || !sheet) return
  const fitReceiptPreview = () => {
    // Match the preview to both available dimensions, without changing the paper layout.
    const { paddingLeft, paddingRight, paddingTop, paddingBottom } = getComputedStyle(viewport)
    const width = viewport.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight)
    const height = viewport.clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom)
    const scale = Math.min(1, width / sheet.offsetWidth, height / sheet.offsetHeight)
    receiptPreviewStyle.value = {
      '--receipt-preview-scale': scale,
      width: `${sheet.offsetWidth * scale}px`,
      height: `${sheet.offsetHeight * scale}px`
    }
  }
  receiptResizeObserver = new ResizeObserver(fitReceiptPreview)
  receiptResizeObserver.observe(viewport)
  receiptResizeObserver.observe(sheet)
  fitReceiptPreview()
})

onBeforeUnmount(() => receiptResizeObserver?.disconnect())

// Chevron Path & Payment tracking state
const selectedStatus = ref(null)
const tempAmountPaid = ref(0)
const isUpdatingStatus = ref(false)
const statusError = ref('')
const statusMessage = ref('')

const pathSteps = [
  { status: 'Draft', label: 'Draft' },
  { status: 'Sent', label: 'Sent to Client' },
  { status: 'Approved', label: 'Unpaid' },
  { status: 'Partially Paid', label: 'Partially Paid' },
  { status: 'Paid', label: 'Fully Paid' },
  { status: 'Cancelled', label: 'Void' }
]

const statusOrder = ['Draft', 'Sent', 'Approved', 'Partially Paid', 'Paid']

watch(() => invoice.value, (newInv) => {
  if (newInv) {
    if (!selectedStatus.value) {
      selectedStatus.value = newInv.status
    }
    tempAmountPaid.value = newInv.amount_paid || 0
  }
}, { immediate: true })

const remainingTempBalance = computed(() => {
  if (!invoice.value) return 0
  return Math.max(0, invoice.value.total_amount - (tempAmountPaid.value || 0))
})

const amountPaid = computed(() => Number(invoice.value?.amount_paid || 0))
const balanceDue = computed(() => {
  if (!invoice.value) return 0
  return Math.max(0, Number(invoice.value.total_amount || 0) - amountPaid.value)
})
const canGenerateReceipt = computed(() => amountPaid.value > 0 && ['Partially Paid', 'Paid'].includes(invoice.value?.status))
const isTaxInvoice = computed(() => ['Approved', 'Partially Paid', 'Paid'].includes(invoice.value?.status))
const isInvoiceLocked = computed(() => isTaxInvoice.value)
const canUpdateStatus = computed(() => {
  if (!invoice.value || !selectedStatus.value || isStatusBlocked(selectedStatus.value)) return false
  return selectedStatus.value !== invoice.value.status || (
    selectedStatus.value === 'Partially Paid' && Number(tempAmountPaid.value) !== amountPaid.value
  )
})
const invoiceDocumentTitle = computed(() => isTaxInvoice.value ? 'TAX INVOICE' : 'PROFORMA INVOICE')
const receiptNumber = computed(() => invoice.value ? `${invoice.value.invoice_number}-RCPT` : '')
const receiptDate = computed(() => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))
const receiptAmountInWords = computed(() => amountToWords(amountPaid.value, invoice.value?.currency || ''))
const receiptPaymentMode = computed(() => invoice.value?.payment_details ? 'Bank Transfer' : 'Not specified')
const invoiceItems = computed(() => (invoice.value?.items || []).map(normalizeInvoiceItem))
const gstSummary = computed(() => {
  const inv = invoice.value || {}
  const subtotal = roundMoney(invoiceItems.value.reduce((sum, item) => sum + item.amount, 0))
  const cgstPercent = Number(inv.cgst_percent || 0)
  const sgstPercent = Number(inv.sgst_percent || 0)
  const igstPercent = Number(inv.igst_percent || 0)
  const hasGstFields = ['cgst_percent', 'sgst_percent', 'igst_percent', 'cgst_amount', 'sgst_amount', 'igst_amount'].some((field) => inv[field] !== undefined && inv[field] !== null)
  const legacyTaxAmount = Number(inv.legacy_tax_amount || (!hasGstFields ? inv.tax_amount || 0 : 0))
  const cgstAmount = roundMoney(subtotal * cgstPercent / 100)
  const sgstAmount = roundMoney(subtotal * sgstPercent / 100)
  const igstAmount = roundMoney(subtotal * igstPercent / 100)
  const totalTax = roundMoney(cgstAmount + sgstAmount + igstAmount + legacyTaxAmount)
  return {
    subtotal,
    cgst_percent: cgstPercent,
    cgst_amount: cgstAmount,
    sgst_percent: sgstPercent,
    sgst_amount: sgstAmount,
    igst_percent: igstPercent,
    igst_amount: igstAmount,
    legacy_tax_amount: legacyTaxAmount,
    tax_amount: totalTax,
    total_amount: roundMoney(subtotal + totalTax)
  }
})
const amountInWords = computed(() => {
  if (!invoice.value) return ''
  return `Amount in words: ${amountToWords(gstSummary.value.total_amount, invoice.value.currency || '')}`
})

function validateTempAmount() {
  if (invoice.value && tempAmountPaid.value > invoice.value.total_amount) {
    tempAmountPaid.value = invoice.value.total_amount
  }
}

function setHalfPaid() {
  if (invoice.value) {
    tempAmountPaid.value = Number((invoice.value.total_amount / 2).toFixed(2))
  }
}

function setFullPaid() {
  if (invoice.value) {
    tempAmountPaid.value = invoice.value.total_amount
    selectStatus('Paid')
  }
}

function isStepComplete(status) {
  if (!invoice.value) return false
  if (invoice.value.status === 'Cancelled') {
    return status === 'Cancelled'
  }
  if (status === 'Cancelled') {
    return false
  }
  const currentIndex = statusOrder.indexOf(invoice.value.status)
  const stepIndex = statusOrder.indexOf(status)
  return stepIndex <= currentIndex
}

function selectStatus(status) {
  if (isUpdatingStatus.value || isStatusBlocked(status)) return
  statusError.value = ''
  statusMessage.value = ''
  selectedStatus.value = status
  if (status === 'Partially Paid' && invoice.value) {
    tempAmountPaid.value = invoice.value.amount_paid || Number((invoice.value.total_amount / 2).toFixed(2))
  }
}

function isStatusBlocked(status) {
  return isInvoiceLocked.value && ['Draft', 'Sent'].includes(status)
}

async function markStatusComplete() {
  if (!invoice.value || !canUpdateStatus.value || isUpdatingStatus.value) return
  statusError.value = ''
  statusMessage.value = ''
  if (selectedStatus.value === 'Partially Paid' && (
    !Number.isFinite(Number(tempAmountPaid.value)) ||
    Number(tempAmountPaid.value) <= 0 || Number(tempAmountPaid.value) >= Number(invoice.value.total_amount)
  )) {
    statusError.value = 'Enter an amount greater than zero and less than the invoice total, or select Fully Paid.'
    return
  }
  isUpdatingStatus.value = true
  try {
    const payload = { status: selectedStatus.value }
    if (selectedStatus.value === 'Partially Paid') {
      payload.amount_paid = Number(tempAmountPaid.value)
    }
    const data = await apiPut(`/api/finance/invoices/${props.id}/status`, payload)
    invoice.value = normalizeInvoice({ ...invoice.value, ...data.invoice })
    selectedStatus.value = invoice.value.status
    tempAmountPaid.value = invoice.value.amount_paid || 0
    statusMessage.value = `Invoice stage updated to ${pathSteps.find(step => step.status === invoice.value.status)?.label || invoice.value.status}.`
    showReceiptPrompt.value = canGenerateReceipt.value
  } catch (err) {
    console.error("Failed to update status:", err)
    statusError.value = "Failed to update status: " + err.message
  } finally {
    isUpdatingStatus.value = false
  }
}

onMounted(async () => {
  try {
    const data = await apiGet(`/api/finance/invoices/${props.id}`)
    invoice.value = normalizeInvoice(data.invoice)
  } catch (err) {
    console.error('Failed to load invoice', err)
    error.value = err.message || 'Could not load invoice details.'
  }
})

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function normalizeInvoice(rawInvoice) {
  if (!rawInvoice) return rawInvoice
  const items = (rawInvoice.items || []).map(normalizeInvoiceItem)
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.amount, 0))
  const cgstPercent = Number(rawInvoice.cgst_percent || 0)
  const sgstPercent = Number(rawInvoice.sgst_percent || 0)
  const igstPercent = Number(rawInvoice.igst_percent || 0)
  const hasGstFields = ['cgst_percent', 'sgst_percent', 'igst_percent', 'cgst_amount', 'sgst_amount', 'igst_amount'].some((field) => rawInvoice[field] !== undefined && rawInvoice[field] !== null)
  const legacyTaxAmount = Number(rawInvoice.legacy_tax_amount || (!hasGstFields ? rawInvoice.tax_amount || 0 : 0))
  const cgstAmount = roundMoney(subtotal * cgstPercent / 100)
  const sgstAmount = roundMoney(subtotal * sgstPercent / 100)
  const igstAmount = roundMoney(subtotal * igstPercent / 100)
  const taxAmount = roundMoney(cgstAmount + sgstAmount + igstAmount + legacyTaxAmount)

  return {
    ...rawInvoice,
    items,
    subtotal,
    cgst_percent: cgstPercent,
    cgst_amount: cgstAmount,
    sgst_percent: sgstPercent,
    sgst_amount: sgstAmount,
    igst_percent: igstPercent,
    igst_amount: igstAmount,
    legacy_tax_amount: legacyTaxAmount,
    tax_amount: taxAmount,
    total_amount: roundMoney(subtotal + taxAmount)
  }
}

function normalizeInvoiceItem(item = {}) {
  const qty = Number(item.qty || 0)
  const rate = Number(item.rate ?? item.price ?? 0)
  const amount = roundMoney(qty * rate)
  return {
    ...item,
    description: item.description || '',
    hsn_sac: item.hsn_sac || item.hsn || item.sac || '',
    qty,
    rate,
    price: rate,
    unit_of_measure: item.unit_of_measure || item.uom || '',
    amount,
    total: amount
  }
}

function roundMoney(value) {
  return Number((Number(value || 0)).toFixed(2))
}

function moneyValue(value) {
  return Number(value || 0).toFixed(2)
}

function amountToWords(value, currency) {
  const amount = Math.abs(Number(value || 0))
  const whole = Math.floor(amount)
  const decimal = Math.round((amount - whole) * 100)
  const wholeWords = numberToWords(whole)
  const decimalWords = decimal ? ` and ${numberToWords(decimal)} paise` : ''
  const prefix = Number(value || 0) < 0 ? 'minus ' : ''
  return `${prefix}${wholeWords} ${currency}${decimalWords} only`.replace(/\s+/g, ' ').trim()
}

function numberToWords(num) {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
  const units = [
    [10000000, 'crore'],
    [100000, 'lakh'],
    [1000, 'thousand'],
    [100, 'hundred']
  ]
  if (num === 0) return 'zero'
  if (num < 20) return ones[num]
  if (num < 100) return `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${ones[num % 10]}` : ''}`
  const parts = []
  let remainder = num
  for (const [value, label] of units) {
    if (remainder >= value) {
      parts.push(`${numberToWords(Math.floor(remainder / value))} ${label}`)
      remainder %= value
    }
  }
  if (remainder) {
    parts.push(numberToWords(remainder))
  }
  return parts.join(' ')
}

function printInvoice() {
  const originalTitle = document.title
  document.title = ' ' // Remove title from print header
  window.print()
  document.title = originalTitle
}

async function printReceipt() {
  receiptPrintError.value = ''
  try {
    await printReceiptDocument(receiptPreview.value?.$el, receiptNumber.value)
  } catch (err) {
    receiptPrintError.value = err.message || 'Could not print the receipt. Please try again.'
  }
}

</script>

<style scoped>
/* BASE CONTAINER */
.invoice-container {
  max-width: 1280px;
  margin: 0 auto;
  padding-bottom: 32px;
}

.invoice-container .page-header {
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
  display: flex;
  gap: 20px;
  justify-content: space-between;
  margin-bottom: 18px;
  padding: 22px 24px;
}

.invoice-container .page-header h1 {
  font-size: clamp(30px, 4vw, 46px);
  letter-spacing: 0;
  margin: 0;
}

.invoice-container .page-header .muted {
  margin-top: 6px;
}

.actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* PREMIUM SHADOWS & CARDS */
.card-premium {
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: 0 4px 20px -2px rgba(120, 113, 108, 0.05), 0 2px 8px -1px rgba(120, 113, 108, 0.03);
  transition: all 0.3s ease;
}

.card-premium:hover {
  box-shadow: 0 10px 30px -5px rgba(120, 113, 108, 0.08), 0 4px 12px -2px rgba(120, 113, 108, 0.04);
}

/* BUTTON ANIMATIONS */
.btn-animate {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-animate:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
}

.btn-animate.secondary:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.btn-icon {
  transition: transform 0.2s;
}

.btn-animate:hover .btn-icon {
  transform: scale(1.08);
}

.locked-note {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  width: 42px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #f8fafc;
  color: var(--muted);
}

.locked-note svg {
  color: #64748b;
}

/* ON-SCREEN LAYOUT styling */
.card-section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.card-section-title h2 {
  font-size: 15px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0;
}

/* PILLS & BADGES */
.pill-badge {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 800;
  padding: 5px 12px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pill-badge.approved,
.pill-badge.paid {
  background: #dcfce7;
  color: #166534;
}

.pill-badge.draft {
  background: #f1f5f9;
  color: #475569;
}

.pill-badge.sent {
  background: #dbeafe;
  color: #1e40af;
}

.record-layout {
  align-items: start;
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 390px);
}

.main-record-pane,
.related-pane {
  display: grid;
  gap: 16px;
}

.main-record-pane .record-card,
.related-pane .panel {
  padding: 22px;
}

.main-record-pane > .form-grid {
  gap: 18px 22px;
}

.main-record-pane label {
  color: #334155;
  font-size: 13px;
  font-weight: 850;
}

.main-record-pane input[readonly] {
  background: #f8fafc;
  border: 1px solid #dbe5f0;
  border-radius: 8px;
  color: #0f172a;
  font-weight: 800;
  min-height: 42px;
}

.pill-badge.overdue,
.pill-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

/* LINE ITEMS CONTAINER */
.items-container {
  padding: 24px;
  margin-top: 24px;
}

.items-table-wrap {
  overflow-x: auto;
  margin-top: 12px;
}

.items-view-table {
  width: 100%;
  border-collapse: collapse;
}

.items-view-table th {
  background: var(--surface-soft);
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 14px 16px;
  text-align: left;
  border-bottom: 2px solid var(--line);
}

.items-view-table td {
  padding: 16px;
  border-bottom: 1px solid var(--line);
  font-size: 14px;
  vertical-align: middle;
}

.items-view-table tr:last-child td {
  border-bottom: none;
}

.desc-cell {
  font-weight: 600;
}

.qty-cell, .price-cell, .tax-cell {
  color: var(--muted);
}

.total-cell {
  color: var(--text);
}

.right {
  text-align: right;
}

/* NOTES SECTION */
.notes-display {
  margin-top: 8px;
  line-height: 1.6;
  font-size: 14px;
  color: var(--text);
  white-space: pre-wrap;
}

/* SIDEBAR STYLINGS */
.client-detail-block h3 {
  font-size: 20px;
  color: var(--primary);
  margin: 0 0 16px;
}

.client-meta {
  font-size: 14px;
  margin: 6px 0;
  color: var(--text);
}

.billing-address-card {
  margin-top: 20px;
  padding: 16px;
  background: var(--surface-soft);
  border-radius: 10px;
  border-left: 4px solid var(--primary);
}

.section-sub-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 800;
  margin: 0 0 8px;
}

.address-text {
  font-size: 13.5px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}

.billing-address-card.empty {
  border-left-color: var(--line);
  background: #fafaf9;
}

/* FINANCIAL SUMMARY */
.summary-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  align-items: center;
}

.summary-row span {
  color: var(--muted);
}

.summary-row strong {
  font-size: 15px;
}

.grand-total-row {
  border-top: 2px dashed var(--line);
  margin-top: 12px;
  padding-top: 18px;
  font-weight: 800;
  font-size: 18px;
  color: var(--primary);
}

.grand-total-row span:first-child {
  color: var(--text);
  font-weight: 800;
}

.total-badge {
  font-size: 20px !important;
  color: var(--primary);
  background: var(--surface-soft);
  padding: 4px 12px;
  border-radius: 8px;
}

/* PREVIEW MODAL STYLING (Glassmorphic) */
.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.preview-modal-content {
  background: var(--surface-soft);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 980px;
  width: 100%;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.preview-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 28px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}

.preview-modal-header h2 {
  font-size: 18px;
  font-weight: 800;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.preview-modal-body {
  flex: 1;
  overflow: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #e9eef4;
}

.preview-modal-body > :first-child {
  margin-inline: auto;
}

/* CRM line item table column widths and alignment. */
.items-view-table th:nth-child(1) { width: 34%; }
.items-view-table th:nth-child(2) { width: 12%; }
.items-view-table th:nth-child(3) { width: 8%; text-align: right !important; }
.items-view-table th:nth-child(4) { width: 14%; text-align: right !important; }
.items-view-table th:nth-child(5) { width: 14%; }
.items-view-table th:nth-child(6) { width: 18%; text-align: right !important; }

.items-view-table td:nth-child(3) { text-align: right !important; }
.items-view-table td:nth-child(4) { text-align: right !important; }
.items-view-table td:nth-child(6) { text-align: right !important; }

/* LOADING & ANIMATION */
.loading-state {
  text-align: center;
  padding: 100px;
  color: var(--muted);
}

.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--line);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.loading-state.error {
  color: #dc2626;
}

.error-icon {
  width: 48px;
  height: 48px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 900;
  margin: 0 auto 16px;
  border: 2px solid #fca5a5;
}

.mt-16 {
  margin-top: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ON-SCREEN PRINT TEMPLATE (Purely hidden) */
.print-document-only {
  display: none;
}

.receipt-prompt {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin: -8px 0 24px;
  padding: 14px 18px;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  background: #f0fdf4;
  color: #14532d;
}

.receipt-prompt strong,
.receipt-prompt span {
  display: block;
}

.receipt-prompt span {
  margin-top: 2px;
  font-size: 13px;
}

.receipt-prompt-actions {
  display: flex;
  gap: 10px;
}

.receipt-modal-content { max-width: 920px; }
.receipt-modal-title { display: flex; align-items: center; gap: 12px; }
.receipt-modal-title span { font-size: 12px; color: var(--muted); }
.receipt-modal-content .preview-modal-header { flex-shrink: 0; flex-wrap: wrap; gap: 12px; }
.receipt-preview-body { min-height: 0; padding: 20px; overflow: hidden; }
.receipt-preview-frame {
  flex: 0 0 auto;
  width: calc(210mm * var(--receipt-preview-scale, 1));
  height: calc(296mm * var(--receipt-preview-scale, 1));
}
.receipt-preview-frame :deep(.receipt-sheet) {
  transform: scale(var(--receipt-preview-scale, 1));
  transform-origin: top left;
}
.receipt-print-error { margin: 0; padding: 10px 28px; color: #b91c1c; background: #fef2f2; }

/* Zero page margins suppress the browser's automatic print header/footer.
   The invoice sheet supplies its own 12mm content inset. */
@page crm-invoice {
  size: A4 portrait;
  margin: 0;
}

@media print {
  :global(body:has(.invoice-container)) {
    page: crm-invoice;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  :global(html:has(.invoice-container)),
  :global(body:has(.invoice-container)),
  :global(body:has(.invoice-container) #app),
  :global(body:has(.invoice-container) .app-shell),
  :global(body:has(.invoice-container) .main-layout-container),
  :global(body:has(.invoice-container) .main) {
    display: block !important;
    position: static !important;
    width: auto !important;
    max-width: none !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    transform: none !important;
  }

  :global(body:has(.invoice-container) .enterprise-sidebar),
  :global(body:has(.invoice-container) .app-footer),
  :global(body:has(.invoice-container) .mobile-sidebar-backdrop),
  :global(body:has(.invoice-container) .app-loader-track),
  :global(body:has(.invoice-container) .app-loader-backdrop),
  .no-print,
  .preview-modal-overlay {
    display: none !important;
  }

  .invoice-container {
    padding: 0 !important;
    margin: 0 !important;
    max-width: none !important;
  }

  .print-document-only {
    display: block !important;
    width: 100%;
  }

}

/* SALESFORCE-STYLE CHEVRON PATH TRACKER */
.status-path-tracker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 30px;
  padding: 8px 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px -2px rgba(120, 113, 108, 0.03);
  gap: 16px;
}

.path-scroller {
  flex: 1;
  overflow-x: auto;
}

.path-steps {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 4px;
}

.path-step {
  border: 0;
  font-family: inherit;
  flex: 1;
  text-align: center;
  padding: 10px 12px 10px 24px;
  background: #f1f5f9;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  transition: all 0.25s ease;
  clip-path: polygon(calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%, 0% 0%);
  user-select: none;
  min-width: 110px;
}

.path-step:first-child {
  padding-left: 16px;
  clip-path: polygon(calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 0% 50%, 0% 0%);
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
}

.path-step:last-child {
  padding-right: 20px;
  clip-path: polygon(100% 0%, 100% 50%, 100% 100%, 0% 100%, 12px 50%, 0% 0%);
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
}

/* HOVER STATUSES */
.path-step:hover {
  background: #e2e8f0;
  color: #1e293b;
}

/* COMPLETE STATUSES (Finished stages before current) */
.path-step.complete {
  background: #dbeafe;
  color: #1e40af;
}

.path-step.complete:hover {
  background: #bfdbfe;
}

/* CURRENT ACTIVE STATUS */
.path-step.active {
  background: #1e40af;
  color: #ffffff;
}

.path-step.active:hover {
  background: #1d4ed8;
}

/* SELECTED STATUS (User clicked but not confirmed yet) */
.path-step.selected {
  background: #f97316;
  color: #ffffff;
}

.path-step.selected:hover {
  background: #ea580c;
}

.path-step:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.path-step:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 3px var(--primary, #2563eb);
}

.status-error,
.status-message {
  margin: -12px 0 24px;
}

.status-error { color: #b91c1c; }
.status-message { color: #15803d; }

.step-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
}

.step-icon {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.2);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ACTION SECTION */
.path-actions {
  display: flex;
  align-items: center;
}

.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* PARTIAL PAYMENT GRID & PROMPT CARD */
.partial-payment-card {
  padding: 24px;
  margin-bottom: 24px;
  background: var(--surface);
  border: 1px solid var(--line);
}

.payment-input-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 32px;
  align-items: center;
}

.amount-field-group {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.payment-input-box {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid var(--line);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
  background: var(--bg);
  transition: border-color 0.2s;
}

.payment-input-box:focus {
  border-color: #f97316;
  outline: none;
}

.payment-metrics-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--bg);
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed var(--line);
}

.payment-metrics-display .metric {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.payment-metrics-display .metric .label {
  color: var(--muted);
}

.payment-metrics-display .metric .value {
  font-weight: 700;
}

.payment-metrics-display .metric .value.success {
  color: #16a34a;
}

.payment-metrics-display .metric .value.warning {
  color: #ea580c;
}

.balance-zero {
  color: #16a34a !important;
}

/* TRANSITIONS */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 980px) {
  .invoice-container .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .actions {
    justify-content: flex-start;
    width: 100%;
  }

  .record-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .invoice-container .page-header {
    padding: 18px;
  }

  .invoice-container .page-header h1 {
    font-size: 30px;
  }

  .actions .button {
    flex: 1 1 auto;
    justify-content: center;
  }

  .locked-note {
    flex: 0 0 42px;
  }
}
</style>
