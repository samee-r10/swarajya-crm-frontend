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
            <div 
              v-for="step in pathSteps" 
              :key="step.status" 
              class="path-step"
              :class="{
                'active': invoice.status === step.status,
                'complete': isStepComplete(step.status),
                'selected': selectedStatus === step.status
              }"
              @click="selectStatus(step.status)"
            >
              <div class="step-label">
                <span class="step-icon" v-if="isStepComplete(step.status) && invoice.status !== step.status">✓</span>
                {{ step.label }}
              </div>
            </div>
          </div>
        </div>
        <div class="path-actions">
          <button 
            class="button btn-animate" 
            :disabled="selectedStatus === invoice.status || isUpdatingStatus"
            @click="markStatusComplete"
          >
            <span v-if="isUpdatingStatus" class="btn-spinner"></span>
            <span v-else>✓ Mark Status as Complete</span>
          </button>
        </div>
      </div>

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
                    <th class="right">Qty</th>
                    <th class="right">Unit Price</th>
                    <th class="right">Tax</th>
                    <th class="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in invoice.items" :key="index">
                    <td class="desc-cell">{{ item.description }}</td>
                    <td class="right qty-cell">{{ item.qty }}</td>
                    <td class="right price-cell">{{ Number(item.price).toFixed(2) }}</td>
                    <td class="right tax-cell">{{ item.tax_percent }}%</td>
                    <td class="right total-cell"><strong>{{ Number(item.total).toFixed(2) }}</strong></td>
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
                <strong>{{ Number(invoice.subtotal).toFixed(2) }}</strong>
              </div>
              <div class="summary-row">
                <span>Tax Total</span>
                <strong>{{ Number(invoice.tax_amount).toFixed(2) }}</strong>
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
            
            <!-- High fidelity A4 printable document inside modal -->
            <div class="invoice-document shadow-premium modal-a4-sheet">
              <div class="invoice-header">
                <div class="company-brand">
                  <img src="/logo.png" alt="Company Logo" class="invoice-logo">
                  <div class="company-info" v-if="invoice.company_info">
                    <h2>{{ invoice.company_info.company_name || 'Your Company Name' }}</h2>
                    <p v-if="invoice.company_info.company_address" style="white-space: pre-wrap;">{{ invoice.company_info.company_address }}</p>
                    <p v-if="invoice.company_info.company_phone">Phone: {{ invoice.company_info.company_phone }}</p>
                    <p v-if="invoice.company_info.company_email">Email: {{ invoice.company_info.company_email }}</p>
                    <p v-if="invoice.company_info.tax_id">Tax ID: {{ invoice.company_info.tax_id }}</p>
                  </div>
                  <div class="company-info" v-else>
                    <h2 class="muted italic">Company info not set</h2>
                    <p class="muted small">Go to Setup -> Company Information to configure your header.</p>
                  </div>
                </div>
                <div class="document-type">
                  <h1>{{ invoiceDocumentTitle }}</h1>
                  <div class="meta-item"><span>Invoice #</span><strong>{{ invoice.invoice_number }}</strong></div>
                  <div class="meta-item"><span>Date</span><strong>{{ formatDate(invoice.invoice_date) }}</strong></div>
                  <div class="meta-item"><span>Due Date</span><strong>{{ formatDate(invoice.due_date) }}</strong></div>
                  <div class="meta-item" v-if="invoice.project_name"><span>Project</span><strong>{{ invoice.project_name }}</strong></div>
                  <div class="meta-item" v-if="invoice.account_name"><span>Account</span><strong>{{ invoice.account_name }}</strong></div>
                </div>
              </div>

              <div class="invoice-billing">
                <div class="bill-to">
                  <p class="section-label">Bill To:</p>
                  <h3>{{ invoice.customer_name }}</h3>
                  <div v-if="invoice.billing_address" class="address-box">
                    <p style="white-space: pre-wrap;">{{ invoice.billing_address }}</p>
                  </div>
                  <p v-else class="muted italic small">No billing address provided for this customer.</p>
                  
                  <div class="contact-sub">
                    <p><strong>Contact:</strong> {{ invoice.contact_name }}</p>
                    <p><strong>Email:</strong> {{ invoice.customer_email }}</p>
                  </div>
                </div>
              </div>

              <table class="line-items">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th class="right">Qty</th>
                    <th class="right">Unit Price</th>
                    <th class="right">Tax</th>
                    <th class="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in invoice.items" :key="index">
                    <td>{{ item.description }}</td>
                    <td class="right">{{ item.qty }}</td>
                    <td class="right">{{ Number(item.price).toFixed(2) }}</td>
                    <td class="right">{{ item.tax_percent }}%</td>
                    <td class="right"><strong>{{ Number(item.total).toFixed(2) }}</strong></td>
                  </tr>
                </tbody>
              </table>

              <div class="invoice-footer">
                <div class="notes-section">
                  <p class="section-label">Notes & Terms:</p>
                  <p class="notes-content">{{ invoice.notes || 'Please make payment by the due date. Thank you for your business!' }}</p>
                  <div v-if="invoice.payment_details" class="payment-details-section">
                    <p class="section-label">Payment Details (NEFT/RTGS)</p>
                    <p class="payment-line"><strong>Name of Beneficiary for NEFT/RTGS:</strong> {{ invoice.payment_details.beneficiary_name }}</p>
                    <p class="payment-line"><strong>Name of Bank:</strong> {{ invoice.payment_details.bank_name }}</p>
                    <p class="payment-line"><strong>Account Number:</strong> {{ invoice.payment_details.account_number }}</p>
                    <p class="payment-line"><strong>IFSC Code:</strong> {{ invoice.payment_details.ifsc_code }}</p>
                    <p class="payment-line"><strong>Payment reference:</strong> {{ invoice.payment_details.payment_reference }}</p>
                  </div>
                </div>
                <div class="totals-table">
                  <div class="total-row"><span>Subtotal</span><span>{{ Number(invoice.subtotal).toFixed(2) }}</span></div>
                  <div class="total-row"><span>Tax Total</span><span>{{ Number(invoice.tax_amount).toFixed(2) }}</span></div>
                  <div class="total-row grand-total">
                    <span>Total Amount</span>
                    <span>{{ invoice.currency }} {{ Number(invoice.total_amount).toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <div class="system-generated-note">
                This is system generated invoice no signature required.
              </div>
            </div>

          </div>
        </div>
      </div>

      <div v-if="showReceiptModal" class="preview-modal-overlay no-print" @click.self="showReceiptModal = false">
        <div class="preview-modal-content receipt-modal-content">
          <div class="preview-modal-header">
            <h2>Payment Receipt</h2>
            <div class="modal-actions">
              <button class="button btn-animate" @click="printReceipt">
                <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right: 6px;"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" fill="currentColor"/></svg>
                Print Receipt
              </button>
              <button class="button secondary btn-animate" @click="showReceiptModal = false">Close</button>
            </div>
          </div>
          <div class="preview-modal-body receipt-preview-body">
            <div class="receipt-document shadow-premium">
              <div class="receipt-header">
                <div class="company-brand">
                  <img src="/logo.png" alt="Company Logo" class="invoice-logo">
                  <div class="company-info" v-if="invoice.company_info">
                    <h2>{{ invoice.company_info.company_name || 'Your Company Name' }}</h2>
                    <p v-if="invoice.company_info.company_address" style="white-space: pre-wrap;">{{ invoice.company_info.company_address }}</p>
                    <p v-if="invoice.company_info.company_phone">Phone: {{ invoice.company_info.company_phone }}</p>
                    <p v-if="invoice.company_info.company_email">Email: {{ invoice.company_info.company_email }}</p>
                    <p v-if="invoice.company_info.tax_id">Tax ID: {{ invoice.company_info.tax_id }}</p>
                  </div>
                </div>
                <div class="document-type">
                  <h1>PAYMENT RECEIPT</h1>
                  <div class="meta-item"><span>Receipt #</span><strong>{{ receiptNumber }}</strong></div>
                  <div class="meta-item"><span>Date</span><strong>{{ receiptDate }}</strong></div>
                  <div class="meta-item"><span>Invoice #</span><strong>{{ invoice.invoice_number }}</strong></div>
                </div>
              </div>

              <div class="receipt-ack">
                <p>Received from</p>
                <h3>{{ invoice.customer_name }}</h3>
                <span v-if="invoice.billing_address">{{ invoice.billing_address }}</span>
              </div>

              <div class="receipt-amount-panel">
                <span>Amount Received</span>
                <strong>{{ invoice.currency }} {{ amountPaid.toFixed(2) }}</strong>
              </div>

              <div class="receipt-grid">
                <div><span>Invoice Total</span><strong>{{ invoice.currency }} {{ Number(invoice.total_amount || 0).toFixed(2) }}</strong></div>
                <div><span>Payment Status</span><strong>{{ invoice.status }}</strong></div>
                <div><span>Payment Mode</span><strong>{{ receiptPaymentMode }}</strong></div>
                <div><span>Balance Due</span><strong>{{ invoice.currency }} {{ balanceDue.toFixed(2) }}</strong></div>
                <div v-if="invoice.project_name"><span>Project</span><strong>{{ invoice.project_name }}</strong></div>
              </div>

              <div v-if="invoice.payment_details" class="receipt-bank-details">
                <p class="section-label">Bank Details</p>
                <p><strong>Bank:</strong> {{ invoice.payment_details.bank_name }}</p>
                <p><strong>Account Number:</strong> {{ invoice.payment_details.account_number }}</p>
                <p><strong>IFSC:</strong> {{ invoice.payment_details.ifsc_code }}</p>
                <p><strong>Payment Reference:</strong> {{ invoice.payment_details.payment_reference }}</p>
              </div>

              <div class="receipt-note">
                This acknowledges receipt of payment against invoice {{ invoice.invoice_number }}.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. PRINT-ONLY INVOICE (Hidden on screen, shown strictly in @media print) -->
      <div class="invoice-document print-document-only" style="display: none;">
        <div class="invoice-header">
          <div class="company-brand">
            <img src="/logo.png" alt="Company Logo" class="invoice-logo">
            <div class="company-info" v-if="invoice.company_info">
              <h2>{{ invoice.company_info.company_name || 'Your Company Name' }}</h2>
              <p v-if="invoice.company_info.company_address" style="white-space: pre-wrap;">{{ invoice.company_info.company_address }}</p>
              <p v-if="invoice.company_info.company_phone">Phone: {{ invoice.company_info.company_phone }}</p>
              <p v-if="invoice.company_info.company_email">Email: {{ invoice.company_info.company_email }}</p>
              <p v-if="invoice.company_info.tax_id">Tax ID: {{ invoice.company_info.tax_id }}</p>
            </div>
            <div class="company-info" v-else>
              <h2>Company Information</h2>
              <p class="small text-muted">Please configure your company profile in administrative settings.</p>
            </div>
          </div>
          <div class="document-type">
            <h1>{{ invoiceDocumentTitle }}</h1>
            <div class="meta-item"><span>Invoice #</span><strong>{{ invoice.invoice_number }}</strong></div>
            <div class="meta-item"><span>Date</span><strong>{{ formatDate(invoice.invoice_date) }}</strong></div>
            <div class="meta-item"><span>Due Date</span><strong>{{ formatDate(invoice.due_date) }}</strong></div>
          </div>
        </div>

        <div class="invoice-billing">
          <div class="bill-to">
            <p class="section-label">Bill To:</p>
            <h3>{{ invoice.customer_name }}</h3>
            <div v-if="invoice.billing_address" class="address-box">
              <p style="white-space: pre-wrap;">{{ invoice.billing_address }}</p>
            </div>
            <div class="contact-sub">
              <p><strong>Contact:</strong> {{ invoice.contact_name }}</p>
              <p><strong>Email:</strong> {{ invoice.customer_email }}</p>
            </div>
          </div>
        </div>

        <table class="line-items">
          <thead>
            <tr>
              <th>Description</th>
              <th class="right">Qty</th>
              <th class="right">Unit Price</th>
              <th class="right">Tax</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in invoice.items" :key="index">
              <td>{{ item.description }}</td>
              <td class="right">{{ item.qty }}</td>
              <td class="right">{{ Number(item.price).toFixed(2) }}</td>
              <td class="right">{{ item.tax_percent }}%</td>
              <td class="right"><strong>{{ Number(item.total).toFixed(2) }}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="invoice-footer">
          <div class="notes-section">
            <p class="section-label">Notes & Terms:</p>
            <p class="notes-content">{{ invoice.notes || 'Please make payment by the due date. Thank you for your business!' }}</p>
            <div v-if="invoice.payment_details" class="payment-details-section">
              <p class="section-label">Payment Details (NEFT/RTGS)</p>
              <p class="payment-line"><strong>Name of Beneficiary for NEFT/RTGS:</strong> {{ invoice.payment_details.beneficiary_name }}</p>
              <p class="payment-line"><strong>Name of Bank:</strong> {{ invoice.payment_details.bank_name }}</p>
              <p class="payment-line"><strong>Account Number:</strong> {{ invoice.payment_details.account_number }}</p>
              <p class="payment-line"><strong>IFSC Code:</strong> {{ invoice.payment_details.ifsc_code }}</p>
              <p class="payment-line"><strong>Payment reference:</strong> {{ invoice.payment_details.payment_reference }}</p>
            </div>
          </div>
          <div class="totals-table">
            <div class="total-row"><span>Subtotal</span><span>{{ Number(invoice.subtotal).toFixed(2) }}</span></div>
            <div class="total-row"><span>Tax Total</span><span>{{ Number(invoice.tax_amount).toFixed(2) }}</span></div>
            <div class="total-row grand-total">
              <span>Total Amount</span>
              <span>{{ invoice.currency }} {{ Number(invoice.total_amount).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="system-generated-note">
          This is system generated invoice no signature required.
        </div>
      </div>

      <div class="receipt-document print-receipt-only" style="display: none;">
        <div class="receipt-header">
          <div class="company-brand">
            <img src="/logo.png" alt="Company Logo" class="invoice-logo">
            <div class="company-info" v-if="invoice.company_info">
              <h2>{{ invoice.company_info.company_name || 'Your Company Name' }}</h2>
              <p v-if="invoice.company_info.company_address" style="white-space: pre-wrap;">{{ invoice.company_info.company_address }}</p>
              <p v-if="invoice.company_info.company_phone">Phone: {{ invoice.company_info.company_phone }}</p>
              <p v-if="invoice.company_info.company_email">Email: {{ invoice.company_info.company_email }}</p>
              <p v-if="invoice.company_info.tax_id">Tax ID: {{ invoice.company_info.tax_id }}</p>
            </div>
          </div>
          <div class="document-type">
            <h1>PAYMENT RECEIPT</h1>
            <div class="meta-item"><span>Receipt #</span><strong>{{ receiptNumber }}</strong></div>
            <div class="meta-item"><span>Date</span><strong>{{ receiptDate }}</strong></div>
            <div class="meta-item"><span>Invoice #</span><strong>{{ invoice.invoice_number }}</strong></div>
          </div>
        </div>

        <div class="receipt-ack">
          <p>Received from</p>
          <h3>{{ invoice.customer_name }}</h3>
          <span v-if="invoice.billing_address">{{ invoice.billing_address }}</span>
        </div>

        <div class="receipt-amount-panel">
          <span>Amount Received</span>
          <strong>{{ invoice.currency }} {{ amountPaid.toFixed(2) }}</strong>
        </div>

        <div class="receipt-grid">
          <div><span>Invoice Total</span><strong>{{ invoice.currency }} {{ Number(invoice.total_amount || 0).toFixed(2) }}</strong></div>
          <div><span>Payment Status</span><strong>{{ invoice.status }}</strong></div>
          <div><span>Payment Mode</span><strong>{{ receiptPaymentMode }}</strong></div>
          <div><span>Balance Due</span><strong>{{ invoice.currency }} {{ balanceDue.toFixed(2) }}</strong></div>
          <div v-if="invoice.project_name"><span>Project</span><strong>{{ invoice.project_name }}</strong></div>
        </div>

        <div v-if="invoice.payment_details" class="receipt-bank-details">
          <p class="section-label">Bank Details</p>
          <p><strong>Bank:</strong> {{ invoice.payment_details.bank_name }}</p>
          <p><strong>Account Number:</strong> {{ invoice.payment_details.account_number }}</p>
          <p><strong>IFSC:</strong> {{ invoice.payment_details.ifsc_code }}</p>
          <p><strong>Payment Reference:</strong> {{ invoice.payment_details.payment_reference }}</p>
        </div>

        <div class="system-generated-note">
          This is system generated payment receipt no signature required.
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPut } from '../api/client'
import SystemInfo from '../components/SystemInfo.vue'

const router = useRouter()
const props = defineProps({ id: String })
const invoice = ref(null)
const error = ref('')
const showPreviewModal = ref(false)
const showReceiptModal = ref(false)
const showReceiptPrompt = ref(false)

// Chevron Path & Payment tracking state
const selectedStatus = ref(null)
const tempAmountPaid = ref(0)
const isUpdatingStatus = ref(false)

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
const invoiceDocumentTitle = computed(() => isTaxInvoice.value ? 'TAX INVOICE' : 'PROFORMA INVOICE')
const receiptNumber = computed(() => invoice.value ? `${invoice.value.invoice_number}-RCPT` : '')
const receiptDate = computed(() => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
const receiptPaymentMode = computed(() => invoice.value?.payment_details ? 'Bank Transfer' : 'Not specified')

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
  selectedStatus.value = status
  if (status === 'Partially Paid' && invoice.value) {
    tempAmountPaid.value = invoice.value.amount_paid || Number((invoice.value.total_amount / 2).toFixed(2))
  }
}

async function markStatusComplete() {
  if (!invoice.value) return
  isUpdatingStatus.value = true
  try {
    const updatedInvoice = { ...invoice.value }
    updatedInvoice.status = selectedStatus.value
    
    // Auto-adjust amount_paid based on target status
    if (selectedStatus.value === 'Paid') {
      updatedInvoice.amount_paid = invoice.value.total_amount
    } else if (selectedStatus.value === 'Partially Paid') {
      updatedInvoice.amount_paid = tempAmountPaid.value
    } else if (['Draft', 'Sent', 'Approved', 'Cancelled'].includes(selectedStatus.value)) {
      updatedInvoice.amount_paid = 0
    }
    
    // Call PUT endpoint
    await apiPut(`/api/finance/invoices/${props.id}`, updatedInvoice)
    
    // Refresh the loaded invoice
    const data = await apiGet(`/api/finance/invoices/${props.id}`)
    invoice.value = data.invoice
    selectedStatus.value = data.invoice.status
    tempAmountPaid.value = data.invoice.amount_paid || 0
    if (canGenerateReceipt.value) {
      showReceiptPrompt.value = true
    }
  } catch (err) {
    console.error("Failed to update status:", err)
    error.value = "Failed to update status: " + err.message
  } finally {
    isUpdatingStatus.value = false
  }
}

onMounted(async () => {
  try {
    const data = await apiGet(`/api/finance/invoices/${props.id}`)
    invoice.value = data.invoice
  } catch (err) {
    console.error('Failed to load invoice', err)
    error.value = err.message || 'Could not load invoice details.'
  }
})

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function clearReceiptPrintMode() {
  document.documentElement.classList.remove('receipt-print-mode')
  window.removeEventListener('afterprint', clearReceiptPrintMode)
}

function printInvoice() {
  const originalTitle = document.title
  clearReceiptPrintMode()
  document.title = ' ' // Remove title from print header
  window.print()
  document.title = originalTitle
}

async function printReceipt() {
  await nextTick()
  printStandaloneReceipt()
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function receiptField(label, value) {
  return `<div class="field"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`
}

function printStandaloneReceipt() {
  if (!invoice.value) return
  const inv = invoice.value
  const bank = inv.payment_details || null
  const bankHtml = bank ? `
    <section class="bank">
      <h2>Bank Details</h2>
      <p><strong>Bank:</strong> ${escapeHtml(bank.bank_name)}</p>
      <p><strong>Account Number:</strong> ${escapeHtml(bank.account_number)}</p>
      <p><strong>IFSC:</strong> ${escapeHtml(bank.ifsc_code)}</p>
      <p><strong>Payment Reference:</strong> ${escapeHtml(bank.payment_reference)}</p>
    </section>
  ` : ''
  const company = inv.company_info || {}
  const printWindow = window.open('', '_blank', 'width=900,height=1100')
  if (!printWindow) {
    alert('Please allow pop-ups to print the receipt.')
    return
  }
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Receipt ${escapeHtml(receiptNumber.value)}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 40px; font-family: Inter, Arial, sans-serif; color: #1f2937; background: #ffffff; }
          .receipt { max-width: 780px; margin: 0 auto; min-height: calc(100vh - 80px); display: flex; flex-direction: column; }
          .header { display: flex; justify-content: space-between; gap: 32px; align-items: flex-start; margin-bottom: 48px; }
          .logo { max-width: 180px; max-height: 60px; object-fit: contain; margin-bottom: 12px; }
          h1 { margin: 0 0 16px; color: #0f172a; font-size: 32px; letter-spacing: 0; }
          h2 { margin: 0 0 12px; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0; }
          .company h2 { color: #0f172a; font-size: 20px; text-transform: none; }
          .company p, .meta p, .bank p { margin: 3px 0; color: #475569; font-size: 13px; }
          .meta { text-align: right; min-width: 250px; }
          .meta-row { display: flex; justify-content: flex-end; gap: 12px; margin: 5px 0; font-size: 13px; }
          .meta-row span { color: #64748b; }
          .customer { padding: 22px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin-bottom: 28px; }
          .customer p { margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; }
          .customer h3 { margin: 0 0 8px; color: #0f172a; font-size: 24px; }
          .customer span { white-space: pre-wrap; color: #475569; font-size: 13px; }
          .amount { display: flex; justify-content: space-between; align-items: center; padding: 28px; border-radius: 8px; background: #ecfdf5; border: 1px solid #bbf7d0; margin-bottom: 28px; }
          .amount span { color: #166534; font-weight: 800; text-transform: uppercase; font-size: 12px; }
          .amount strong { color: #166534; font-size: 30px; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 28px; }
          .field { padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
          .field span, .field strong { display: block; }
          .field span { color: #64748b; font-size: 12px; margin-bottom: 6px; }
          .field strong { color: #0f172a; font-size: 14px; }
          .bank { border-top: 1px dashed #cbd5e1; padding-top: 20px; margin-top: 8px; }
          .note { margin-top: auto; padding-top: 44px; border-top: 1px dashed #cbd5e1; text-align: center; color: #64748b; font-size: 12px; font-style: italic; }
          @media print { body { padding: 0; } .receipt { max-width: 100%; min-height: 100vh; } }
        </style>
      </head>
      <body>
        <main class="receipt">
          <section class="header">
            <div class="company">
              <img class="logo" src="/logo.png" alt="Company Logo">
              <h2>${escapeHtml(company.company_name || 'Your Company Name')}</h2>
              ${company.company_address ? `<p style="white-space: pre-wrap;">${escapeHtml(company.company_address)}</p>` : ''}
              ${company.company_phone ? `<p>Phone: ${escapeHtml(company.company_phone)}</p>` : ''}
              ${company.company_email ? `<p>Email: ${escapeHtml(company.company_email)}</p>` : ''}
              ${company.tax_id ? `<p>Tax ID: ${escapeHtml(company.tax_id)}</p>` : ''}
            </div>
            <div class="meta">
              <h1>PAYMENT RECEIPT</h1>
              <div class="meta-row"><span>Receipt #</span><strong>${escapeHtml(receiptNumber.value)}</strong></div>
              <div class="meta-row"><span>Date</span><strong>${escapeHtml(receiptDate.value)}</strong></div>
              <div class="meta-row"><span>Invoice #</span><strong>${escapeHtml(inv.invoice_number)}</strong></div>
            </div>
          </section>
          <section class="customer">
            <p>Received from</p>
            <h3>${escapeHtml(inv.customer_name)}</h3>
            ${inv.billing_address ? `<span>${escapeHtml(inv.billing_address)}</span>` : ''}
          </section>
          <section class="amount"><span>Payment Received</span><strong>${escapeHtml(inv.currency)} ${amountPaid.value.toFixed(2)}</strong></section>
          <section class="grid">
            ${receiptField('Linked Invoice', inv.invoice_number)}
            ${receiptField('Invoice Total', `${inv.currency} ${Number(inv.total_amount || 0).toFixed(2)}`)}
            ${receiptField('Payment Mode', receiptPaymentMode.value)}
            ${receiptField('Payment Status', inv.status)}
            ${receiptField('Amount Allocated', `${inv.currency} ${amountPaid.value.toFixed(2)}`)}
            ${receiptField('Balance Outstanding', `${inv.currency} ${balanceDue.value.toFixed(2)}`)}
          </section>
          ${bankHtml}
          <p class="note">This is a system generated payment receipt. No signature required.</p>
        </main>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
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
  overflow-y: auto;
  padding: 40px;
  display: flex;
  justify-content: center;
  background: #f1f5f9;
}

.modal-a4-sheet {
  background: #ffffff;
  padding: 60px !important;
  border-radius: 6px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  width: 100%;
  max-width: 800px;
  height: max-content;
  min-height: 1050px;
  display: flex;
  flex-direction: column;
}

.invoice-logo {
  max-height: 55px;
  max-width: 200px;
  object-fit: contain;
  margin-top: -15px;
  margin-bottom: 12px;
  display: block;
}

/* TABLE COLUMN WIDTHS & ALIGNMENTS */
.line-items th:nth-child(1), .items-view-table th:nth-child(1) { width: 50%; }
.line-items th:nth-child(2), .items-view-table th:nth-child(2) { width: 10%; text-align: right !important; }
.line-items th:nth-child(3), .items-view-table th:nth-child(3) { width: 15%; text-align: right !important; }
.line-items th:nth-child(4), .items-view-table th:nth-child(4) { width: 10%; text-align: right !important; }
.line-items th:nth-child(5), .items-view-table th:nth-child(5) { width: 15%; text-align: right !important; }

.line-items td:nth-child(2), .items-view-table td:nth-child(2) { text-align: right !important; }
.line-items td:nth-child(3), .items-view-table td:nth-child(3) { text-align: right !important; }
.line-items td:nth-child(4), .items-view-table td:nth-child(4) { text-align: right !important; }
.line-items td:nth-child(5), .items-view-table td:nth-child(5) { text-align: right !important; }

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
.print-document-only,
.print-receipt-only {
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

.receipt-modal-content {
  max-width: 880px;
}

.receipt-preview-body {
  align-items: flex-start;
}

.receipt-document {
  width: 100%;
  max-width: 760px;
  min-height: 820px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  padding: 56px;
  border-radius: 6px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  align-items: flex-start;
  margin-bottom: 56px;
}

.receipt-ack {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8fafc;
}

.receipt-ack p {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.receipt-ack h3 {
  margin: 0 0 8px;
  color: var(--primary);
  font-size: 24px;
}

.receipt-ack span {
  display: block;
  color: var(--muted);
  white-space: pre-wrap;
}

.receipt-amount-panel {
  margin: 32px 0;
  padding: 28px;
  border-radius: 8px;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.receipt-amount-panel span {
  color: #166534;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 12px;
}

.receipt-amount-panel strong {
  color: #166534;
  font-size: 30px;
}

.receipt-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.receipt-grid div {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.receipt-grid span,
.receipt-grid strong {
  display: block;
}

.receipt-grid span {
  color: var(--muted);
  font-size: 12px;
  margin-bottom: 6px;
}

.receipt-note {
  margin-top: auto;
  padding-top: 36px;
  color: var(--muted);
  font-size: 13px;
  text-align: center;
}

.receipt-bank-details {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px dashed var(--line);
}

.receipt-bank-details p {
  margin: 4px 0;
  color: var(--muted);
  font-size: 13px;
}

/* PRINTING MEDIA INSTRUCTION OVERRIDES */
@media print {
  /* Hide all screen widgets, bars, sidebars, headers, and modal overlays */
  .no-print,
  .modal-overlay,
  .preview-modal-overlay,
  .record-layout,
  header,
  nav,
  .global-header,
  .top-bar,
  .actions {
    display: none !important;
  }
  
  body, #app, .invoice-container {
    background: #ffffff !important;
  }

  .invoice-container {
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
  }

  /* Show only the dedicated printable sheet */
  .print-document-only {
    display: flex !important;
    flex-direction: column;
    background: #ffffff !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .print-receipt-only {
    display: none !important;
  }

  :global(html.receipt-print-mode) .print-document-only {
    display: none !important;
  }

  :global(html.receipt-print-mode) .print-receipt-only {
    display: flex !important;
    flex-direction: column;
    background: #ffffff !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: auto !important;
  }

  /* Core invoice document layout rules within print */
  .invoice-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 50px;
    align-items: flex-start;
  }
  
  .company-info h2 { font-size: 20px; margin-bottom: 8px; }
  .company-info p { font-size: 14px; color: #444; margin: 2px 0; }
  
  .document-type { text-align: right; }
  .document-type h1 { font-size: 32px; color: var(--primary); margin-bottom: 16px; letter-spacing: -1px; }
  
  .meta-item { display: flex; justify-content: flex-end; gap: 12px; margin-bottom: 4px; font-size: 14px; }
  .meta-item span { color: #555; width: 80px; }

  .invoice-billing {
    margin-bottom: 50px;
  }
  
  .section-label {
    font-size: 11px;
    text-transform: uppercase;
    color: #555;
    font-weight: 800;
    margin-bottom: 8px;
  }
  
  .bill-to h3 { font-size: 24px; margin-bottom: 8px; color: var(--primary); }
  .bill-to p { margin: 4px 0; font-size: 14px; }
  .address-box { margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 4px solid var(--primary); }
  .contact-sub { margin-top: 16px; }

  .line-items {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 50px;
  }
  
  .line-items th {
    background: #f8fafc;
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    text-transform: uppercase;
    border-bottom: 2px solid var(--line);
  }
  
  .line-items td {
    padding: 16px;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
  }

  .invoice-footer {
    display: flex;
    justify-content: space-between;
    margin-top: auto;
  }
  
  .notes-section { flex: 1; padding-right: 40px; }
  .notes-content { font-size: 13px; color: #444; white-space: pre-wrap; line-height: 1.6; }
  
  .totals-table { width: 250px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
  .grand-total { border-top: 2px solid var(--primary); margin-top: 8px; padding-top: 16px; font-weight: 900; font-size: 20px; color: var(--primary); }
  
  .system-generated-note {
    margin-top: 50px;
    text-align: center;
    font-size: 12px;
    color: #555;
    font-style: italic;
    border-top: 1px dashed var(--line);
    padding-top: 16px;
    width: 100%;
  }
}

/* HIGH FIDELITY PRINTABLE SHEET CSS SPEC FOR SCREEN/MODAL RENDER */
.invoice-document {
  display: flex;
  flex-direction: column;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 60px;
  align-items: flex-start;
}

.company-info h2 { font-size: 20px; margin-bottom: 8px; }
.company-info p { font-size: 14px; color: var(--muted); margin: 2px 0; }

.document-type { text-align: right; }
.document-type h1 { font-size: 32px; color: var(--primary); margin-bottom: 16px; letter-spacing: -1px; }

.meta-item { display: flex; justify-content: flex-end; gap: 12px; margin-bottom: 4px; font-size: 14px; }
.meta-item span { color: var(--muted); width: 80px; }

.invoice-billing {
  margin-bottom: 60px;
}

.section-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 800;
  margin-bottom: 8px;
}

.bill-to h3 { font-size: 24px; margin-bottom: 8px; color: var(--primary); }
.bill-to p { margin: 4px 0; font-size: 14px; }
.address-box { margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 4px solid var(--primary); }

.contact-sub { margin-top: 16px; }

.line-items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 60px;
}

.line-items th {
  background: #f8fafc;
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  text-transform: uppercase;
  border-bottom: 2px solid var(--line);
}

.line-items td {
  padding: 16px;
  border-bottom: 1px solid var(--line);
  font-size: 14px;
}

.invoice-footer {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
}

.notes-section { flex: 1; padding-right: 40px; }
.notes-content { font-size: 13px; color: var(--muted); white-space: pre-wrap; line-height: 1.6; }

.payment-details-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px dashed var(--line);
}

.payment-line {
  font-size: 13px;
  color: var(--primary);
  line-height: 1.7;
  margin: 4px 0;
}

.totals-table { width: 250px; }
.total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
.grand-total { border-top: 2px solid var(--primary); margin-top: 8px; padding-top: 16px; font-weight: 900; font-size: 20px; color: var(--primary); }

.system-generated-note {
  margin-top: 50px;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
  font-style: italic;
  border-top: 1px dashed var(--line);
  padding-top: 16px;
  width: 100%;
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
