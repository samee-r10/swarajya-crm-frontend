<template>
  <article class="receipt-sheet" aria-label="Payment receipt" data-receipt-document>
    <header class="rcpt-header">
      <div class="rcpt-company">
        <img src="/logo.png" alt="Company logo" class="rcpt-logo">
        <h2 v-if="company.company_name">{{ company.company_name }}</h2>
        <p v-if="company.company_address" class="rcpt-multiline">{{ company.company_address }}</p>
        <p v-if="company.company_phone">{{ company.company_phone }}</p>
        <p v-if="company.company_email">{{ company.company_email }}</p>
        <p v-if="company.tax_id">Tax ID: {{ company.tax_id }}</p>
      </div>
      <div class="rcpt-heading">
        <p class="rcpt-label">Payment acknowledgement</p>
        <h1>PAYMENT<br>RECEIPT</h1>
        <dl class="rcpt-meta">
          <div><dt>Receipt no.</dt><dd>{{ receiptNumber }}</dd></div>
          <div><dt>Receipt date</dt><dd>{{ receiptDate }}</dd></div>
          <div><dt>Invoice no.</dt><dd>{{ invoice.invoice_number }}</dd></div>
        </dl>
      </div>
    </header>

    <section class="rcpt-recipient">
      <p class="rcpt-label">Received from</p>
      <h2>{{ invoice.customer_name }}</h2>
      <p v-if="invoice.billing_address" class="rcpt-multiline">{{ invoice.billing_address }}</p>
      <p v-if="invoice.contact_name">Contact: {{ invoice.contact_name }}</p>
      <p v-if="invoice.customer_email">{{ invoice.customer_email }}</p>
    </section>

    <section class="rcpt-payment">
      <div class="rcpt-amount">
        <div>
          <p class="rcpt-label">Amount received</p>
          <p class="rcpt-payment-caption">{{ balanceDue > 0 ? 'Part payment received' : 'Invoice paid in full' }}</p>
        </div>
        <strong><span>{{ invoice.currency }}</span> {{ money(amountPaid) }}</strong>
      </div>
      <p class="rcpt-words"><span>In words:</span> {{ amountInWords }}</p>
    </section>

    <section class="rcpt-details" aria-label="Payment details">
      <div><p class="rcpt-label">Payment mode</p><strong>{{ paymentMode }}</strong></div>
      <div v-if="invoice.project_name"><p class="rcpt-label">Project</p><strong>{{ invoice.project_name }}</strong></div>
      <div v-if="invoice.payment_details?.payment_reference"><p class="rcpt-label">Payment reference</p><strong>{{ invoice.payment_details.payment_reference }}</strong></div>
    </section>

    <section class="rcpt-summary" aria-label="Invoice payment summary">
      <h3 class="rcpt-label">Payment summary</h3>
      <table>
        <thead><tr><th scope="col">Invoice total</th><th scope="col">Total received</th><th scope="col">Balance due</th></tr></thead>
        <tbody><tr>
          <td>{{ invoice.currency }} {{ money(invoice.total_amount) }}</td>
          <td>{{ invoice.currency }} {{ money(amountPaid) }}</td>
          <td>{{ invoice.currency }} {{ money(balanceDue) }}</td>
        </tr></tbody>
      </table>
      <p class="rcpt-summary-note">Amounts reflect cumulative payments received against this invoice.</p>
    </section>

    <section v-if="invoice.payment_details" class="rcpt-bank">
      <h3 class="rcpt-label">Beneficiary bank details</h3>
      <dl>
        <div v-if="invoice.payment_details.bank_name"><dt>Bank</dt><dd>{{ invoice.payment_details.bank_name }}</dd></div>
        <div v-if="invoice.payment_details.beneficiary_name"><dt>Beneficiary</dt><dd>{{ invoice.payment_details.beneficiary_name }}</dd></div>
        <div v-if="invoice.payment_details.account_number"><dt>Account no.</dt><dd>{{ invoice.payment_details.account_number }}</dd></div>
        <div v-if="invoice.payment_details.ifsc_code"><dt>IFSC</dt><dd>{{ invoice.payment_details.ifsc_code }}</dd></div>
      </dl>
    </section>

    <footer class="rcpt-footer">
      <strong>Thank you for your business.</strong>
      <p>Payment acknowledged against invoice {{ invoice.invoice_number }}.</p>
      <p>This is a system generated receipt. No signature is required.</p>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  invoice: { type: Object, required: true },
  receiptNumber: { type: String, required: true },
  receiptDate: { type: String, required: true },
  amountPaid: { type: Number, required: true },
  balanceDue: { type: Number, required: true },
  paymentMode: { type: String, required: true },
  amountInWords: { type: String, required: true }
})

const company = computed(() => props.invoice.company_info || {})

function money(value) {
  return Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style src="../assets/payment-receipt.css"></style>
