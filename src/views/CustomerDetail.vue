<template>
  <section v-if="customer" class="page-header">
    <div>
      <p class="eyebrow">Customer</p>
      <h1>{{ customer.company_name }}</h1>
      <p class="muted">{{ customer.contact_name }} · {{ customer.email || 'No email' }} · {{ customer.phone || 'No phone' }}</p>
    </div>
    <RouterLink class="button" :to="`/customers/${id}/edit`">Edit</RouterLink>
  </section>
  <section v-if="customer" class="record-layout">
    <div class="form-grid record-card">
      <div class="span-2 card-section-title"><h2>Customer Details</h2></div>
      <label v-for="field in fields" :key="field.label" :class="field.long ? 'span-2' : ''">{{ field.label }}
        <textarea v-if="field.long" readonly rows="5" :value="field.value"></textarea>
        <input v-else readonly :value="field.value">
      </label>
      <div class="span-2">
        <SystemInfo :record="customer" />
      </div>
    </div>
    <aside class="related-pane">
      <div class="panel related-section">
        <div class="related-heading"><span>Opportunities</span><RouterLink :to="{ name: 'opportunity-new', query: { customer_id: id }}">New</RouterLink></div>
        <div class="list compact">
          <RouterLink v-for="opp in opportunities" :key="opp.id" class="list-item" :to="`/opportunities/${opp.id}`"><strong>{{ opp.title }}</strong><span>{{ opp.stage }}</span></RouterLink>
        </div>
      </div>
      <div class="panel related-section">
        <div class="related-heading"><span>Projects</span><RouterLink to="/projects/new">New</RouterLink></div>
        <div class="list compact">
          <RouterLink v-for="project in projects" :key="project.id" class="list-item" :to="`/projects/${project.id}`"><strong>{{ project.project_name }}</strong><span>{{ project.status }}</span></RouterLink>
        </div>
      </div>
    </aside>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiGet } from '../api/client'
import SystemInfo from '../components/SystemInfo.vue'

const props = defineProps({ id: { type: String, required: true } })
const customer = ref(null)
const opportunities = ref([])
const projects = ref([])
const customerFields = ref([])

const fields = computed(() => {
  if (!customer.value) return []
  if (customerFields.value && customerFields.value.length > 0) {
    return customerFields.value.map(field => {
      let val = customer.value[field.api_name]
      if (field.field_type === 'Checkbox') {
        val = val ? 'Yes' : 'No'
      }
      return {
        label: field.label,
        value: val || '--',
        long: field.field_type === 'Long Text' || field.api_name === 'billing_address' || field.api_name === 'notes'
      }
    })
  }
  
  // Fallback
  return [
    { label: 'Company Name', value: customer.value.company_name },
    { label: 'Contact Name', value: customer.value.contact_name },
    { label: 'Email', value: customer.value.email || '' },
    { label: 'Phone', value: customer.value.phone || '' },
    { label: 'Industry', value: customer.value.industry || '' },
    { label: 'Status', value: customer.value.status },
    { label: 'Billing Address', value: customer.value.billing_address || '', long: true },
    { label: 'Notes', value: customer.value.notes || '', long: true }
  ]
})

onMounted(async () => {
  try {
    const data = await apiGet(`/api/customers/${props.id}`)
    customer.value = data.customer
    opportunities.value = data.opportunities || []
    projects.value = data.projects || []
    customerFields.value = data.fields || []
  } catch (err) {
    console.error('Failed to load customer details', err)
  }
})
</script>
