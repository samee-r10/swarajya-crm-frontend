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
      <div class="span-2 card-section-title"><h2>Customer Information</h2></div>

      <label 
        v-for="field in customerFields" 
        :key="field.api_name"
        :class="isSpan2(field) ? 'span-2' : ''"
      >
        {{ field.label }} <span v-if="field.is_required" style="color: #dc2626; margin-left: 2px;">*</span>
        
        <!-- Long Text -->
        <textarea 
          v-if="field.field_type === 'Long Text'" 
          v-model="form[field.api_name]" 
          :required="field.is_required"
          rows="3"
          :placeholder="'Enter ' + field.label.toLowerCase() + '...'"
        ></textarea>
        
        <!-- Dropdown -->
        <select 
          v-else-if="field.field_type === 'Dropdown'" 
          v-model="form[field.api_name]" 
          :required="field.is_required"
        >
          <option v-for="opt in parseOptions(field.picklist_options)" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        
        <!-- Checkbox -->
        <input 
          v-else-if="field.field_type === 'Checkbox'" 
          type="checkbox" 
          v-model="form[field.api_name]"
        >
        
        <!-- Number -->
        <input 
          v-else-if="field.field_type === 'Number'" 
          type="number" 
          v-model="form[field.api_name]" 
          :required="field.is_required"
          :placeholder="'Enter ' + field.label.toLowerCase() + '...'"
        >
        
        <!-- Date -->
        <input 
          v-else-if="field.field_type === 'Date'" 
          type="date" 
          v-model="form[field.api_name]" 
          :required="field.is_required"
        >
        
        <!-- Default Text -->
        <input 
          v-else 
          type="text" 
          v-model="form[field.api_name]" 
          :required="field.is_required"
          :placeholder="'Enter ' + field.label.toLowerCase() + '...'"
        >
      </label>

      <p v-if="error" class="span-2 flash warning">{{ error }}</p>

      <div class="span-2 action-row">
        <button class="button secondary" type="button" @click="router.back()">Cancel</button>
        <button class="button" type="submit">Save Customer</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api/client'

const props = defineProps({ id: String })
const router = useRouter()
const error = ref('')
const form = reactive({ company_name: '', contact_name: '', email: '', phone: '', industry: '', status: 'Lead', notes: '', billing_address: '' })

const defaultFields = [
  { label: 'Company Name', api_name: 'company_name', field_type: 'Text', is_required: true },
  { label: 'Contact Name', api_name: 'contact_name', field_type: 'Text', is_required: true },
  { label: 'Email', api_name: 'email', field_type: 'Text', is_required: false },
  { label: 'Phone', api_name: 'phone', field_type: 'Text', is_required: false },
  { label: 'Industry', api_name: 'industry', field_type: 'Text', is_required: false },
  { label: 'Status', api_name: 'status', field_type: 'Dropdown', is_required: true, picklist_options: '["Lead","Active","Inactive"]' },
  { label: 'Billing Address', api_name: 'billing_address', field_type: 'Long Text', is_required: true },
  { label: 'Notes', api_name: 'notes', field_type: 'Long Text', is_required: false }
]
const customerFields = ref([...defaultFields])

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
    if (props.id) {
      const data = await apiGet(`/api/customers/${props.id}`)
      if (data.fields && data.fields.length > 0) {
        customerFields.value = data.fields
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
        customerFields.value = data.fields
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
      router.push(`/customers/${props.id}`)
    } else {
      const data = await apiPost('/api/customers', form)
      router.push(`/customers/${data.customer.id}`)
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
