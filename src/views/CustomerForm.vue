<template>
  <div class="customer-form-page">
    <section class="page-header">
      <div>
        <p class="eyebrow">Sales</p>
        <h1>{{ id ? 'Edit Customer' : 'New Customer' }}</h1>
        <p class="muted">Enter customer details to manage their account.</p>
      </div>
    </section>

    <form class="form-grid record-card" @submit.prevent="save">
      <template v-for="section in groupedFields" :key="section.title">
        <div class="span-2 card-section-title"><h2>{{ section.title }}</h2></div>
        <label 
          v-for="field in section.fields" 
          :key="field.api_name"
          :class="isSpan2(field) ? 'span-2' : ''"
        >
          {{ field.label }} <span v-if="field.is_required" style="color: #dc2626; margin-left: 2px;">*</span>
          
          <textarea v-if="field.field_type === 'Long Text'" v-model="form[field.api_name]" :required="field.is_required" rows="3" :placeholder="'Enter ' + field.label.toLowerCase() + '...'"></textarea>
          <select v-else-if="field.field_type === 'Dropdown'" v-model="form[field.api_name]" :required="field.is_required">
            <option value="">Select {{ field.label }}</option>
            <option v-for="opt in parseOptions(field.picklist_options)" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <input v-else-if="field.field_type === 'Checkbox'" type="checkbox" v-model="form[field.api_name]">
          <input v-else-if="field.field_type === 'Number'" type="number" v-model="form[field.api_name]" :required="field.is_required" :placeholder="'Enter ' + field.label.toLowerCase() + '...'">
          <input v-else-if="field.field_type === 'Date'" type="date" v-model="form[field.api_name]" :required="field.is_required">
          <input v-else type="text" v-model="form[field.api_name]" :required="field.is_required" :placeholder="'Enter ' + field.label.toLowerCase() + '...'">
        </label>
      </template>

      <p v-if="error" class="span-2 flash warning">{{ error }}</p>

      <div class="span-2 action-row">
        <button class="button secondary" type="button" @click="isModal ? emit('cancel') : router.back()">Cancel</button>
        <button class="button" type="submit">Save Customer</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api/client'

const props = defineProps({ id: String, isModal: Boolean })
const emit = defineEmits(['save-success', 'cancel'])
const router = useRouter()
const error = ref('')
const paymentTerms = ref([])
const paymentModes = ref([])
const form = reactive({
  company_name: '', contact_name: '', email: '', phone: '', industry: '', status: 'Lead', notes: '', billing_address: '',
  address_line_1: '', address_line_2: '', city: '', pincode: '', state: '', country: '',
  registration_type: 'Not Registered', payment_terms: '', payment_mode: ''
})

const defaultFields = [
  { label: 'Company Name', api_name: 'company_name', field_type: 'Text', is_required: true, section: 'Basic Details' },
  { label: 'Contact Name', api_name: 'contact_name', field_type: 'Text', is_required: true, section: 'Basic Details' },
  { label: 'Email', api_name: 'email', field_type: 'Text', is_required: false, section: 'Basic Details' },
  { label: 'Phone', api_name: 'phone', field_type: 'Text', is_required: false, section: 'Basic Details' },
  { label: 'Industry', api_name: 'industry', field_type: 'Text', is_required: false, section: 'Basic Details' },
  { label: 'Status', api_name: 'status', field_type: 'Dropdown', is_required: true, picklist_options: '["Lead","Active","Inactive"]', section: 'Basic Details' },
  { label: 'Address Line 1', api_name: 'address_line_1', field_type: 'Text', is_required: false, section: 'Address Details' },
  { label: 'Address Line 2', api_name: 'address_line_2', field_type: 'Text', is_required: false, section: 'Address Details' },
  { label: 'City', api_name: 'city', field_type: 'Text', is_required: false, section: 'Address Details' },
  { label: 'Pincode', api_name: 'pincode', field_type: 'Text', is_required: false, section: 'Address Details' },
  { label: 'State', api_name: 'state', field_type: 'Text', is_required: false, section: 'Address Details' },
  { label: 'Country', api_name: 'country', field_type: 'Text', is_required: false, section: 'Address Details' },
  { label: 'Billing Address', api_name: 'billing_address', field_type: 'Long Text', is_required: true, section: 'Address Details' },
  { label: 'Registration Type', api_name: 'registration_type', field_type: 'Dropdown', is_required: false, picklist_options: '["Registered","Not Registered"]', section: 'Registration Details' },
  { label: 'Payment Terms', api_name: 'payment_terms', field_type: 'Dropdown', is_required: false, picklist_options: '[]', section: 'Payment Details' },
  { label: 'Payment Mode', api_name: 'payment_mode', field_type: 'Dropdown', is_required: false, picklist_options: '[]', section: 'Payment Details' },
  { label: 'Notes', api_name: 'notes', field_type: 'Long Text', is_required: false, section: 'Basic Details' }
]
const customerFields = ref([...defaultFields])
const sectionOrder = ['Basic Details', 'Address Details', 'Registration Details', 'Payment Details']

const groupedFields = computed(() => sectionOrder.map(title => ({
  title,
  fields: customerFields.value.filter(field => (field.section || sectionForField(field.api_name)) === title)
})).filter(section => section.fields.length > 0))

function normalizeCustomerFields(fields) {
  const byApi = new Map(fields.map(field => [field.api_name, { ...field, section: sectionForField(field.api_name) }]))
  defaultFields.forEach(field => {
    byApi.set(field.api_name, { ...field, ...(byApi.get(field.api_name) || {}) })
  })
  const normalized = Array.from(byApi.values()).map(field => {
    if (field.api_name === 'payment_terms') return { ...field, field_type: 'Dropdown', picklist_options: JSON.stringify(paymentTerms.value) }
    if (field.api_name === 'payment_mode') return { ...field, field_type: 'Dropdown', picklist_options: JSON.stringify(paymentModes.value) }
    if (field.api_name === 'registration_type') return { ...field, field_type: 'Dropdown', picklist_options: '["Registered","Not Registered"]' }
    return field
  })
  return normalized.sort((a, b) => sectionOrder.indexOf(a.section || sectionForField(a.api_name)) - sectionOrder.indexOf(b.section || sectionForField(b.api_name)))
}

function sectionForField(apiName) {
  if (['address_line_1', 'address_line_2', 'city', 'pincode', 'state', 'country', 'billing_address'].includes(apiName)) return 'Address Details'
  if (['registration_type'].includes(apiName)) return 'Registration Details'
  if (['payment_terms', 'payment_mode'].includes(apiName)) return 'Payment Details'
  return 'Basic Details'
}

function isSpan2(field) {
  return field.field_type === 'Long Text' || field.api_name === 'billing_address' || field.api_name === 'notes'
}

function parseOptions(options) {
  if (!options) return []
  try {
    const parsed = JSON.parse(options)
    return Array.isArray(parsed) ? parsed : [options]
  } catch (e) {
    return options.split(',').map(s => s.trim())
  }
}

onMounted(async () => {
  try {
    const options = await apiGet('/api/options')
    paymentTerms.value = options.payment_terms || []
    paymentModes.value = options.payment_modes || []
    customerFields.value = normalizeCustomerFields(customerFields.value)
    if (props.id) {
      const data = await apiGet(`/api/customers/${props.id}`)
      if (data.fields && data.fields.length > 0) {
        customerFields.value = normalizeCustomerFields(data.fields)
        data.fields.forEach(field => {
          if (!(field.api_name in form)) {
            form[field.api_name] = field.field_type === 'Checkbox' ? false : ''
          }
        })
      }
      Object.assign(form, data.customer)
    } else {
      const data = await apiGet('/api/customers')
      if (data.fields && data.fields.length > 0) {
        customerFields.value = normalizeCustomerFields(data.fields)
        data.fields.forEach(field => {
          if (!(field.api_name in form)) {
            form[field.api_name] = field.field_type === 'Checkbox' ? false : ''
          }
        })
      }
    }
  } catch (err) {
    console.error('Failed to load customer configuration', err)
  }
})

async function save() {
  error.value = ''
  try {
    if (props.id) {
      await apiPut(`/api/customers/${props.id}`, form)
      if (props.isModal) {
        emit('save-success')
      } else {
        router.replace(`/customers/${props.id}`)
      }
    } else {
      const data = await apiPost('/api/customers', form)
      if (props.isModal) {
        emit('save-success')
      } else {
        router.replace(`/customers/${data.customer.id}`)
      }
    }
  } catch (err) {
    error.value = err.message || 'An error occurred while saving.'
  }
}
</script>

<style scoped>
.customer-form-page {
  max-width: 1000px;
  margin: 0 auto;
}

.card-section-title {
  margin: 24px 0 8px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 8px;
}

.card-section-title h2 {
  font-size: 16px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.flash.warning {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  color: #92400e;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}
</style>
