<template>
  <section class="page-header">
    <div>
      <p class="eyebrow">Finance Module</p>
      <h1>Transaction #{{ id }}</h1>
      <p v-if="transaction" class="muted">
        {{ transaction.transaction_date }} · {{ transaction.account_name }} · {{ transaction.type }}
      </p>
    </div>
    <div class="action-row" style="display: flex; gap: 12px; align-items: center;">
      <RouterLink v-if="isPosted" class="button btn-animate" to="/finance/transactions?new=1">New Transaction</RouterLink>
      <button v-if="transaction && transaction.status !== 'Reversed'" class="button danger btn-animate" type="button" @click="reverseTransaction" style="background: #ef4444; color: white;">Reverse Entry</button>
      <RouterLink class="button secondary" to="/finance/transactions">Back to Ledger</RouterLink>
    </div>
  </section>

  <!-- Success flash banner shown after posting -->
  <transition name="fade-slide">
    <div v-if="showSuccessMsg" class="post-success-banner">
      <span class="success-icon">✓</span>
      <span>Entry posted successfully.</span>
      <button type="button" class="dismiss-btn" @click="showSuccessMsg = false" aria-label="Dismiss">×</button>
    </div>
  </transition>

  <section v-if="loading" class="table-wrap vue-state">Loading transaction...</section>
  <section v-else-if="error" class="table-wrap vue-state">{{ error }}</section>
  <section v-else class="record-layout">
    <div class="form-grid record-card full-width-card">
      <div class="span-2 card-section-title">
        <h2>Entry Details</h2>
      </div>

      <label v-for="field in detailFields" :key="field.label" :class="field.long ? 'span-2' : ''">
        {{ field.label }}
        <textarea v-if="field.long" readonly rows="5" :value="field.value"></textarea>
        <input v-else readonly :value="field.value">
      </label>
      <div class="span-2">
        <SystemInfo :record="transaction" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet, apiPost } from '../api/client'
import SystemInfo from '../components/SystemInfo.vue'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const route = useRoute()
const transaction = ref(null)
const transactionFields = ref([])
const currencySymbols = ref({})
const loading = ref(true)
const error = ref('')
// Show success banner if navigated here from form posting
const showSuccessMsg = ref(route.query.posted === 'true')
const isPosted = ref(route.query.posted === 'true')

onMounted(async () => {
  try {
    const data = await apiGet(`/api/finance/transactions/${props.id}`)
    transaction.value = data.transaction
    transactionFields.value = data.fields || []
    currencySymbols.value = data.currency_symbols || {}
  } catch (err) {
    error.value = 'Unable to load this transaction.'
  } finally {
    loading.value = false
  }
})

async function reverseTransaction() {
  if (!confirm("Are you sure you want to reverse this transaction? This will negate this entry and remove any synced treasury revenue splits/payouts.")) {
    return
  }
  try {
    loading.value = true
    await apiPost(`/api/finance/transactions/${props.id}/reverse`)
    const data = await apiGet(`/api/finance/transactions/${props.id}`)
    transaction.value = data.transaction
  } catch (err) {
    alert(err.message || "Failed to reverse transaction.")
  } finally {
    loading.value = false
  }
}

const detailFields = computed(() => {
  if (!transaction.value) {
    return []
  }

  const t = transaction.value
  const baseFields = [
    { label: 'Record ID', value: `#${t.id}` },
    { label: 'Status', value: t.status || 'Completed' },
    { label: 'Transaction Date', value: t.transaction_date },
    { label: 'Type', value: t.type },
    { label: 'Account', value: t.account_name },
    { label: 'Party', value: partyLabel(t) },
    { label: 'Associated Project', value: t.project_name || 'None' },
    { label: 'Category', value: t.category || '' },
    { label: 'Currency', value: t.currency },
    { label: 'Base Amount', value: money(t.currency, t.amount) },
    { label: 'CGST Percent', value: `${Number(t.cgst_percent || 0).toFixed(2)}%` },
    { label: 'CGST Amount', value: money(t.currency, t.cgst_amount) },
    { label: 'IGST Percent', value: `${Number(t.igst_percent || 0).toFixed(2)}%` },
    { label: 'IGST Amount', value: money(t.currency, t.igst_amount) },
    { label: 'TDS Percent', value: `${Number(t.tds_percent || 0).toFixed(2)}%` },
    { label: 'TDS Amount', value: money(t.currency, t.tds_amount) },
    { label: 'Total Amount', value: `${t.type === 'Income' ? '+' : '-'}${money(t.currency, t.total_amount || t.amount)}` },
    { label: 'Created At', value: t.created_at || '' },
    { label: 'Description', value: t.description || '', long: true }
  ]

  const customFields = transactionFields.value
    .filter(field => !field.is_native)
    .map(field => ({
      label: field.label,
      value: formatCustomFieldValue(field, t[field.api_name]),
      long: field.field_type === 'Long Text'
    }))

  return [...baseFields, ...customFields]
})

function formatCustomFieldValue(field, value) {
  if (field.field_type === 'Checkbox') return value ? 'Yes' : 'No'
  if (value === undefined || value === null || value === '') return ''
  return value
}

function partyLabel(t) {
  if (t.type === 'Income') {
    return `Customer: ${t.customer_name || 'Unknown'}`
  }
  return `Vendor: ${t.vendor_name || 'Unknown'}`
}

function money(currency, amount) {
  const number = Number(amount || 0)
  return `${currencySymbols.value[currency] || '$'}${number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}
</script>

<style scoped>
.post-success-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 14px 20px;
  margin: 0 0 20px;
  font-weight: 600;
  font-size: 14px;
  animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
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
  transition: opacity 0.2s;
  padding: 0 4px;
}

.dismiss-btn:hover {
  opacity: 1;
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
