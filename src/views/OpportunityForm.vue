<template>
  <section class="page-header"><div><p class="eyebrow">Opportunity</p><h1>{{ id ? 'Edit Opportunity' : 'New Opportunity' }}</h1></div></section>
  <form class="form-grid record-card" @submit.prevent="save">
    <label 
      v-for="field in oppFields" 
      :key="field.api_name"
      :class="isSpan2(field) ? 'span-2' : ''"
    >
      {{ field.label }} <span v-if="field.is_required" style="color: #dc2626; margin-left: 2px;">*</span>
      
      <!-- Customer selection -->
      <select 
        v-if="field.api_name === 'customer_id'"
        v-model="form.customer_id" 
        required
      >
        <option value="">Select Customer</option>
        <option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.company_name }}</option>
      </select>
      
      <!-- Currency selection -->
      <select 
        v-else-if="field.api_name === 'currency'"
        v-model="form.currency" 
        required
      >
        <option v-for="currency in currencies" :key="currency.code" :value="currency.code">{{ currency.code }}</option>
      </select>
      
      <!-- Stage selection -->
      <select 
        v-else-if="field.api_name === 'stage'"
        v-model="form.stage" 
        required
      >
        <option v-for="item in stages" :key="item">{{ item }}</option>
      </select>

      <!-- Long Text -->
      <textarea 
        v-else-if="field.field_type === 'Long Text'" 
        v-model="form[field.api_name]" 
        :required="field.is_required"
        rows="4"
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
        step="any"
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
    <div class="span-2 action-row"><button class="button" type="submit">Save</button></div>
  </form>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api/client'

const props = defineProps({ id: String })
const route = useRoute()
const router = useRouter()
const customers = ref([])
const stages = ref([])
const currencies = ref([])
const form = reactive({ customer_id: route.query.customer_id ? Number(route.query.customer_id) : '', country: '', title: '', opportunity_number: '', value: 0, currency: 'INR', stage: 'Draft', expected_close: '', requirements: '', next_action: '' })

const defaultFields = [
  { label: 'Customer', api_name: 'customer_id', field_type: 'Dropdown', is_required: true },
  { label: 'Title', api_name: 'title', field_type: 'Text', is_required: true },
  { label: 'Country', api_name: 'country', field_type: 'Text', is_required: false },
  { label: 'Opportunity Number', api_name: 'opportunity_number', field_type: 'Text', is_required: false },
  { label: 'Value', api_name: 'value', field_type: 'Number', is_required: false },
  { label: 'Currency', api_name: 'currency', field_type: 'Dropdown', is_required: true },
  { label: 'Stage', api_name: 'stage', field_type: 'Dropdown', is_required: true },
  { label: 'Expected Close', api_name: 'expected_close', field_type: 'Date', is_required: false },
  { label: 'Requirements', api_name: 'requirements', field_type: 'Long Text', is_required: false },
  { label: 'Next Action', api_name: 'next_action', field_type: 'Text', is_required: false }
]
const oppFields = ref([...defaultFields])

function isSpan2(field) {
  return field.field_type === 'Long Text' || field.api_name === 'requirements' || field.api_name === 'next_action'
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
    customers.value = options.customers || []
    stages.value = options.opportunity_stages || []
    currencies.value = options.currencies || []
    
    if (props.id) {
      const detail = await apiGet(`/api/opportunities/${props.id}`)
      if (detail.fields && detail.fields.length > 0) {
        oppFields.value = detail.fields
        detail.fields.forEach(field => {
          if (!(field.api_name in form)) {
            form[field.api_name] = field.field_type === 'Checkbox' ? false : ''
          }
        })
      }
      Object.assign(form, detail.opportunity)
    } else {
      const listData = await apiGet('/api/opportunities')
      if (listData.fields && listData.fields.length > 0) {
        oppFields.value = listData.fields
        listData.fields.forEach(field => {
          if (!(field.api_name in form)) {
            form[field.api_name] = field.field_type === 'Checkbox' ? false : ''
          }
        })
      }
    }
  } catch (err) {
    console.error('Failed to load opportunity form configuration', err)
  }
})

async function save() {
  if (props.id) {
    await apiPut(`/api/opportunities/${props.id}`, form)
    router.push(`/opportunities/${props.id}`)
  } else {
    const data = await apiPost('/api/opportunities', form)
    router.push(`/opportunities/${data.opportunity.id}`)
  }
}
</script>
