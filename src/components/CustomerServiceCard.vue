<template>
  <section id="customer-service" class="panel service-card">
    <div class="panel-header service-header">
      <div>
        <h2>Customer Service</h2>
        <p class="muted">Free service coverage and paid support terms.</p>
      </div>
      <button v-if="!editing" class="button secondary" type="button" @click="startEditing">
        {{ customer.service_terms ? 'Edit Service' : 'Add Service' }}
      </button>
    </div>

    <template v-if="!editing">
      <CustomerServiceSummary :terms="customer.service_terms" />
      <p v-if="!customer.service_terms" class="muted">Add a free service period or paid hourly support for this customer.</p>
      <p v-if="serviceState(customer.service_terms) === 'expired'" class="service-expired">
        This service period has ended. Edit the service to renew coverage or set paid terms.
      </p>
      <p v-if="customer.service_terms?.notes" class="service-notes">{{ customer.service_terms.notes }}</p>
      <p v-if="saved" role="status" class="service-success">Service details saved.</p>
    </template>

    <form v-else class="form-grid service-form" @submit.prevent="save">
      <label>Service type
        <select v-model="form.type" :disabled="saving">
          <option value="">No service</option>
          <option value="Free">Free service</option>
          <option value="Paid">Paid service</option>
        </select>
      </label>
      <template v-if="form.type">
        <label>Service name
          <input v-model="form.name" maxlength="160" placeholder="e.g. Implementation support">
        </label>
        <label>Start date <span aria-hidden="true">*</span>
          <input v-model="form.start_date" type="date" required>
        </label>
        <label v-if="form.type === 'Free'">Free service duration
          <select v-model="duration">
            <option value="6">6 months</option>
            <option value="12">1 year</option>
            <option value="custom">Custom dates</option>
          </select>
        </label>
        <label>End date {{ form.type === 'Free' ? '*' : '(optional)' }}
          <input v-model="form.end_date" type="date" :required="form.type === 'Free'" :min="form.start_date" @input="duration = 'custom'">
          <small class="muted">Coverage includes this date.</small>
        </label>
        <template v-if="form.type === 'Paid'">
          <label>Hourly rate <span aria-hidden="true">*</span>
            <input v-model="form.hourly_rate" type="number" min="0.01" max="999999999.99" step="0.01" required placeholder="e.g. 1500">
          </label>
          <label>Currency <span aria-hidden="true">*</span>
            <input v-model="form.currency" maxlength="3" pattern="[A-Za-z]{3}" required placeholder="INR" @input="form.currency = form.currency.toUpperCase()">
          </label>
        </template>
        <label class="span-2">Coverage and other details
          <textarea v-model="form.notes" rows="3" maxlength="5000" placeholder="Included services, support hours, exclusions, or agreed billing terms..."></textarea>
        </label>
      </template>
      <p v-else class="span-2 muted">Saving will remove the current service terms.</p>
      <p v-if="error" role="alert" class="span-2 service-error">{{ error }}</p>
      <div class="span-2 action-row">
        <button class="button secondary" type="button" :disabled="saving" @click="editing = false">Cancel</button>
        <button class="button" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save Service' }}</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { apiPut } from '../api/client'
import { freeServiceEnd, serviceState, serviceToday } from '../utils/customerService'
import CustomerServiceSummary from './CustomerServiceSummary.vue'

const props = defineProps({ customer: { type: Object, required: true } })
const emit = defineEmits(['saved'])
const editing = ref(false)
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const duration = ref('custom')
const form = reactive({})

function startEditing() {
  const terms = props.customer.service_terms
  Object.assign(form, {
    type: terms?.type || 'Free', name: terms?.name || '',
    start_date: terms?.start_date || serviceToday(), end_date: terms?.end_date || '',
    hourly_rate: terms?.hourly_rate ?? '', currency: terms?.currency || 'INR', notes: terms?.notes || ''
  })
  duration.value = terms ? 'custom' : '6'
  if (!terms) form.end_date = freeServiceEnd(form.start_date, 6)
  error.value = ''
  saved.value = false
  editing.value = true
}

watch([() => form.start_date, () => form.type, duration], () => {
  if (form.type === 'Free' && duration.value !== 'custom') {
    form.end_date = freeServiceEnd(form.start_date, duration.value)
  }
})

async function save() {
  if (saving.value) return
  saving.value = true
  error.value = ''
  try {
    const serviceTerms = form.type ? {
      ...form, end_date: form.end_date || null,
      hourly_rate: form.type === 'Paid' ? Number(form.hourly_rate) : null
    } : null
    const data = await apiPut(`/api/customers/${props.customer.id}/service`, { service_terms: serviceTerms })
    emit('saved', data.customer)
    editing.value = false
    saved.value = true
  } catch (err) {
    error.value = err.message || 'Unable to save service details.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.service-card { margin-bottom: 20px; scroll-margin-top: 20px; }
.service-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.service-header h2 { margin: 0; }
.service-header p { margin: 6px 0 0; }
.service-form { margin-top: 20px; box-shadow: none; padding: 0; border: 0; }
.service-form small { font-weight: 400; }
.service-notes { white-space: pre-wrap; overflow-wrap: anywhere; margin-bottom: 0; }
.service-expired { color: #991b1b; }
.service-success { color: #166534; }
.service-error { background: #fef2f2; color: #991b1b; padding: 12px; border-radius: 8px; }
</style>
