<template>
  <section class="page-header"><div><p class="eyebrow">Project</p><h1>{{ id ? 'Edit Project' : 'New Project' }}</h1></div></section>
  <form class="form-grid record-card" @submit.prevent="save">
    <label 
      v-for="field in projFields" 
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
      
      <!-- Opportunity selection -->
      <select 
        v-else-if="field.api_name === 'opportunity_id'"
        v-model="form.opportunity_id" 
        required
      >
        <option value="">Select Opportunity</option>
        <option v-for="opp in filteredOpportunities" :key="opp.id" :value="opp.id">{{ opp.company_name }} - {{ opp.title }}</option>
      </select>
      
      <!-- Status selection -->
      <select 
        v-else-if="field.api_name === 'status'"
        v-model="form.status" 
        required
      >
        <option v-for="item in statuses" :key="item">{{ item }}</option>
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
    <p v-if="error" class="span-2 flash warning">{{ error }}</p>
    <div class="span-2 action-row"><button class="button" type="submit">Save</button></div>
  </form>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api/client'

const props = defineProps({ id: String })
const router = useRouter()
const customers = ref([])
const opportunities = ref([])
const statuses = ref([])
const error = ref('')
const form = reactive({ customer_id: '', opportunity_id: '', project_name: '', status: 'Planning', client_requirements: '', delivery_timeline: '', product_delivery_status: '', owner: '', last_update: '' })

const defaultFields = [
  { label: 'Customer', api_name: 'customer_id', field_type: 'Dropdown', is_required: true },
  { label: 'Opportunity', api_name: 'opportunity_id', field_type: 'Dropdown', is_required: true },
  { label: 'Project Name', api_name: 'project_name', field_type: 'Text', is_required: true },
  { label: 'Status', api_name: 'status', field_type: 'Dropdown', is_required: true },
  { label: 'Delivery Timeline', api_name: 'delivery_timeline', field_type: 'Date', is_required: false },
  { label: 'Owner', api_name: 'owner', field_type: 'Text', is_required: false },
  { label: 'Product Delivery Status', api_name: 'product_delivery_status', field_type: 'Text', is_required: false },
  { label: 'Client Requirements', api_name: 'client_requirements', field_type: 'Long Text', is_required: false },
  { label: 'Latest Update', api_name: 'last_update', field_type: 'Long Text', is_required: false }
]
const projFields = ref([...defaultFields])

function isSpan2(field) {
  return field.field_type === 'Long Text' || field.api_name === 'client_requirements' || field.api_name === 'last_update' || field.api_name === 'product_delivery_status'
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

const filteredOpportunities = computed(() => {
  return opportunities.value.filter((opp) => {
    if (form.customer_id && Number(opp.customer_id) !== Number(form.customer_id)) {
      return false
    }
    if (opp.stage === 'DA Signed') {
      return true
    }
    if (form.opportunity_id && Number(opp.id) === Number(form.opportunity_id)) {
      return true
    }
    return false
  })
})

onMounted(async () => {
  try {
    const options = await apiGet('/api/options')
    customers.value = options.customers || []
    opportunities.value = options.opportunities || []
    statuses.value = options.project_statuses || []
    
    if (props.id) {
      const detail = await apiGet(`/api/projects/${props.id}`)
      if (detail.fields && detail.fields.length > 0) {
        projFields.value = detail.fields
        detail.fields.forEach(field => {
          if (!(field.api_name in form)) {
            form[field.api_name] = field.field_type === 'Checkbox' ? false : ''
          }
        })
      }
      Object.assign(form, detail.project)
    } else {
      const listData = await apiGet('/api/projects')
      if (listData.fields && listData.fields.length > 0) {
        projFields.value = listData.fields
        listData.fields.forEach(field => {
          if (!(field.api_name in form)) {
            form[field.api_name] = field.field_type === 'Checkbox' ? false : ''
          }
        })
      }
    }
  } catch (err) {
    console.error('Failed to load project form configuration', err)
  }
})

async function save() {
  error.value = ''
  try {
    if (props.id) {
      await apiPut(`/api/projects/${props.id}`, form)
      router.push(`/projects/${props.id}`)
    } else {
      const data = await apiPost('/api/projects', form)
      router.push(`/projects/${data.project.id}`)
    }
  } catch (err) {
    error.value = err.message
  }
}
</script>
