<template>
  <article class="invoice-sheet" aria-label="Invoice document">
    <div class="inv-header">
      <div class="inv-company">
        <img src="/logo.png" alt="Company logo" class="inv-logo">
        <template v-if="invoice.company_info">
          <h2>{{ invoice.company_info.company_name || 'Your Company Name' }}</h2>
          <p v-if="invoice.company_info.company_address" class="inv-multiline">{{ invoice.company_info.company_address }}</p>
          <p v-if="invoice.company_info.company_phone">Phone: {{ invoice.company_info.company_phone }}</p>
          <p v-if="invoice.company_info.company_email">{{ invoice.company_info.company_email }}</p>
          <p v-if="invoice.company_info.tax_id">Tax ID: {{ invoice.company_info.tax_id }}</p>
        </template>
        <template v-else>
          <h2>Company Information</h2>
          <p>Please configure your company profile in administrative settings.</p>
        </template>
      </div>
      <div class="inv-heading">
        <h1>{{ title }}</h1>
        <dl class="inv-meta">
          <div><dt>Invoice number</dt><dd>{{ invoice.invoice_number }}</dd></div>
          <div><dt>Issue date</dt><dd>{{ formatDate(invoice.invoice_date) }}</dd></div>
          <div><dt>Due date</dt><dd>{{ formatDate(invoice.due_date) }}</dd></div>
        </dl>
      </div>
    </div>

    <div class="inv-billing">
      <div class="inv-customer">
        <p class="inv-label">Bill to</p>
        <h3>{{ invoice.customer_name }}</h3>
        <p v-if="invoice.billing_address" class="inv-multiline">{{ invoice.billing_address }}</p>
        <p v-if="invoice.contact_name"><span class="inv-muted">Contact:</span> {{ invoice.contact_name }}</p>
        <p v-if="invoice.customer_email">{{ invoice.customer_email }}</p>
      </div>
      <div class="inv-overview">
        <p class="inv-label">Invoice total · {{ invoice.currency }}</p>
        <strong class="inv-overview-amount">{{ money(summary.total_amount) }}</strong>
        <p v-if="invoice.project_name"><span class="inv-muted">Project:</span> {{ invoice.project_name }}</p>
        <p v-if="invoice.account_name"><span class="inv-muted">Account:</span> {{ invoice.account_name }}</p>
      </div>
    </div>

    <table class="inv-items">
      <colgroup>
        <col style="width: 36%">
        <col style="width: 13%">
        <col style="width: 7%">
        <col style="width: 15%">
        <col style="width: 10%">
        <col style="width: 19%">
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Service / Description</th>
          <th scope="col">HSN/SAC</th>
          <th scope="col" class="inv-number">Qty</th>
          <th scope="col" class="inv-number">Rate</th>
          <th scope="col">Unit</th>
          <th scope="col" class="inv-number">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index">
          <td class="inv-description">{{ item.description }}</td>
          <td>{{ item.hsn_sac || '—' }}</td>
          <td class="inv-number">{{ item.qty }}</td>
          <td class="inv-number">{{ money(item.rate) }}</td>
          <td>{{ item.unit_of_measure || '—' }}</td>
          <td class="inv-number inv-line-total">{{ money(item.amount) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="inv-settlement">
      <div class="inv-details">
        <div class="inv-terms">
          <p class="inv-label">Notes & terms</p>
          <p class="inv-multiline">{{ invoice.notes || 'Please make payment by the due date. Thank you for your business!' }}</p>
        </div>
        <div v-if="invoice.payment_details" class="inv-payment">
          <p class="inv-label">Bank transfer · NEFT / RTGS</p>
          <dl class="inv-bank">
            <div v-if="invoice.payment_details.beneficiary_name"><dt>Beneficiary</dt><dd>{{ invoice.payment_details.beneficiary_name }}</dd></div>
            <div v-if="invoice.payment_details.bank_name"><dt>Bank</dt><dd>{{ invoice.payment_details.bank_name }}</dd></div>
            <div v-if="invoice.payment_details.account_number"><dt>Account no.</dt><dd>{{ invoice.payment_details.account_number }}</dd></div>
            <div v-if="invoice.payment_details.ifsc_code"><dt>IFSC</dt><dd>{{ invoice.payment_details.ifsc_code }}</dd></div>
            <div v-if="invoice.payment_details.payment_reference"><dt>Reference</dt><dd>{{ invoice.payment_details.payment_reference }}</dd></div>
          </dl>
        </div>
      </div>
      <div class="inv-totals">
        <dl>
          <div><dt>Subtotal</dt><dd>{{ money(summary.subtotal) }}</dd></div>
          <div><dt>CGST ({{ money(summary.cgst_percent) }}%)</dt><dd>{{ money(summary.cgst_amount) }}</dd></div>
          <div><dt>SGST ({{ money(summary.sgst_percent) }}%)</dt><dd>{{ money(summary.sgst_amount) }}</dd></div>
          <div><dt>IGST ({{ money(summary.igst_percent) }}%)</dt><dd>{{ money(summary.igst_amount) }}</dd></div>
          <div v-if="summary.legacy_tax_amount"><dt>Tax amount</dt><dd>{{ money(summary.legacy_tax_amount) }}</dd></div>
          <div class="inv-grand-total"><dt>Total amount</dt><dd>{{ invoice.currency }} {{ money(summary.total_amount) }}</dd></div>
        </dl>
        <p class="inv-words">{{ amountInWords }}</p>
      </div>
    </div>

    <div class="inv-document-footer">
      <span>Thank you for your business.</span>
      <p>This is a system generated invoice. No signature required.</p>
    </div>
  </article>
</template>

<script setup>
defineProps({
  invoice: { type: Object, required: true },
  items: { type: Array, required: true },
  summary: { type: Object, required: true },
  title: { type: String, required: true },
  amountInWords: { type: String, required: true }
})

function money(value) {
  return Number(value || 0).toFixed(2)
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.invoice-sheet {
  --inv-ink: #17253b;
  --inv-muted: #5e6b7d;
  --inv-accent: #1d4f91;
  --inv-line: #dce3ec;
  box-sizing: border-box;
  width: 210mm;
  min-height: 297mm;
  padding: 12mm;
  display: flex;
  flex-direction: column;
  background: #fff;
  color: var(--inv-ink);
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.invoice-sheet *, .invoice-sheet *::before, .invoice-sheet *::after { box-sizing: border-box; }
.invoice-sheet h1, .invoice-sheet h2, .invoice-sheet h3, .invoice-sheet p, .invoice-sheet dl, .invoice-sheet dd { margin: 0; }
.invoice-sheet h1, .invoice-sheet h2, .invoice-sheet h3 { color: var(--inv-ink); }
.invoice-sheet dt { font-weight: 400; }
.invoice-sheet dd { font-weight: 600; }
.invoice-sheet p + p { margin-top: 3px; }
.inv-muted { color: var(--inv-muted); }
.inv-multiline { white-space: pre-wrap; }

.inv-header {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--inv-accent);
}
.inv-logo { display: block; width: 145px; height: 48px; object-fit: contain; object-position: left center; margin-bottom: 10px; }
.inv-company h2 { font-size: 17px; line-height: 1.3; margin-bottom: 7px; letter-spacing: -0.3px; }
.inv-company p { color: var(--inv-muted); font-size: 10.5px; }
.inv-heading { text-align: right; }
.inv-heading h1 { color: var(--inv-accent); font-size: 26px; line-height: 1.2; font-weight: 700; letter-spacing: -0.8px; margin: 8px 0 20px; }
.inv-meta > div { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 10px; margin-top: 6px; }
.inv-meta dt { color: var(--inv-muted); }

.inv-billing { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 26px; padding: 18px 0; }
.invoice-sheet .inv-label { margin-bottom: 8px; color: var(--inv-muted); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
.inv-customer h3 { font-size: 17px; line-height: 1.35; margin-bottom: 7px; }
.inv-customer p { font-size: 11px; }
.inv-overview { align-self: start; padding: 14px 16px; border: 1px solid var(--inv-line); border-radius: 4px; background: #f5f8fc; }
.inv-overview-amount { display: block; font-size: 25px; line-height: 1.25; color: var(--inv-accent); margin-bottom: 6px; }
.inv-overview p { font-size: 10px; }

.inv-items { width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 0; margin: 0 0 20px; }
.inv-items th { position: static; letter-spacing: 0; padding: 10px 7px; background: #eef2f7; color: var(--inv-ink); border-top: 1px solid var(--inv-line); border-bottom: 1px solid var(--inv-line); text-align: left; font-size: 9px; font-weight: 700; line-height: 1.4; }
.inv-items td { padding: 10px 7px; color: var(--inv-ink); border-bottom: 1px solid var(--inv-line); vertical-align: top; font-size: 10.5px; line-height: 1.5; }
.inv-items th:first-child, .inv-items td:first-child { padding-left: 10px; }
.inv-items th:last-child, .inv-items td:last-child { padding-right: 10px; }
.inv-items .inv-number { text-align: right; }
.inv-description { white-space: pre-wrap; }
.inv-line-total { font-weight: 700; }

.inv-settlement { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 28px; align-items: start; }
.inv-details { font-size: 10.5px; }
.inv-terms { margin-bottom: 14px; }
.inv-payment { padding-top: 14px; border-top: 1px solid var(--inv-line); }
.inv-bank > div { display: grid; grid-template-columns: 82px minmax(0, 1fr); gap: 8px; margin-top: 5px; }
.inv-bank dt { color: var(--inv-muted); }
.inv-totals dl > div { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; padding: 6px 0; }
.inv-totals dt { color: var(--inv-muted); }
.inv-totals dd { text-align: right; }
.inv-totals dl > .inv-grand-total { grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); border-top: 2px solid var(--inv-accent); border-bottom: 1px solid var(--inv-line); margin-top: 8px; padding: 12px 0; font-size: 14px; }
.inv-grand-total dt, .inv-grand-total dd { color: var(--inv-accent); font-weight: 700; }
.inv-words { padding-top: 10px; font-size: 9.5px; line-height: 1.5; color: var(--inv-muted); }
.inv-document-footer { margin-top: auto; padding-top: 16px; text-align: center; color: var(--inv-muted); font-size: 9px; }
.inv-document-footer span { display: block; border-top: 1px solid var(--inv-line); padding-top: 10px; color: var(--inv-accent); font-size: 11px; font-weight: 700; margin-bottom: 4px; }

@media screen {
  .invoice-sheet { flex: 0 0 auto; box-shadow: 0 6px 24px #17253b14; }
}

@media print {
  .invoice-sheet { width: 100%; min-height: 296mm; padding: 12mm; box-decoration-break: clone; -webkit-box-decoration-break: clone; box-shadow: none; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .inv-header, .inv-billing, .inv-items tr, .inv-settlement, .inv-document-footer { break-inside: avoid; }
  .inv-items thead { display: table-header-group; }
}
</style>
