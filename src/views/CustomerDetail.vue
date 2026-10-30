<template>
  <div class="customer-detail-page">
  <CrmRecordHeader
    v-if="customer"
    record-type="Customer"
    variant="customer"
    :title="customer.company_name"
    :fields="headerFields"
  >
    <template #actions>
      <button class="button" type="button" @click="showEditModal = true">Edit</button>
    </template>
  </CrmRecordHeader>

  <CrmModal
    v-model="showEditModal"
    title="Edit customer"
    description="Update account, contact, address, and commercial information."
    size="lg"
  >
    <CustomerForm :id="id" :is-modal="true" @save-success="handleSaveSuccess" @cancel="showEditModal = false" />
  </CrmModal>

  <CustomerServiceCard v-if="customer" :customer="customer" @saved="customer = $event" />

  <section v-if="customer" class="customer-workspace">
    <article class="customer-profile-card">
      <header class="customer-section-header">
        <div><p>Account profile</p><h2>Customer information</h2></div>
        <span class="customer-record-status">{{ customer.status || 'Lead' }}</span>
      </header>
      <dl class="customer-information-grid">
        <div v-for="field in fields" :key="field.label" :class="{ 'customer-field--wide': field.long }">
          <dt>{{ field.label }}</dt>
          <dd :class="{ 'customer-field--multiline': field.long }">{{ field.value || '—' }}</dd>
        </div>
      </dl>
      <div class="customer-system-info"><SystemInfo :record="customer" /></div>
    </article>
    <aside class="related-pane">
      <div class="panel related-section">
        <div class="related-heading"><div><span>Opportunities</span><small>{{ opportunities.length }} linked records</small></div><RouterLink :to="{ name: 'opportunity-new', query: { customer_id: id }}">New</RouterLink></div>
        <div class="list compact">
          <RouterLink v-for="opp in opportunities" :key="opp.id" class="list-item" :to="`/opportunities/${opp.id}`"><strong>{{ opp.title }}</strong><span>{{ opp.stage }}</span></RouterLink>
          <p v-if="!opportunities.length" class="related-empty">No opportunities linked yet.</p>
        </div>
      </div>
      <div class="panel related-section">
        <div class="related-heading"><div><span>Projects</span><small>{{ projects.length }} linked records</small></div><RouterLink to="/projects/new">New</RouterLink></div>
        <div class="list compact">
          <RouterLink v-for="project in projects" :key="project.id" class="list-item" :to="`/projects/${project.id}`"><strong>{{ project.project_name }}</strong><span>{{ project.status }}</span></RouterLink>
          <p v-if="!projects.length" class="related-empty">No projects linked yet.</p>
        </div>
      </div>
      <div class="panel related-section">
        <div class="related-heading"><span>Documents</span><RouterLink to="/finance/invoices">Open</RouterLink></div>
        <div class="list compact">
          <div class="list-item"><strong>Agreements and invoices</strong><span>Linked finance documents appear here as they are created.</span></div>
        </div>
      </div>
      <div class="panel related-section">
        <div class="related-heading"><span>WhatsApp Log</span><RouterLink to="/customers">View CRM</RouterLink></div>
        <div class="list compact">
          <div class="list-item"><strong>Communication history</strong><span>Track follow-ups, confirmations, and client notes.</span></div>
        </div>
      </div>
    </aside>
  </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiGet } from '../api/client'
import SystemInfo from '../components/SystemInfo.vue'
import CustomerForm from './CustomerForm.vue'
import CustomerServiceCard from '../components/CustomerServiceCard.vue'
import CrmRecordHeader from '../components/CrmRecordHeader.vue'

const props = defineProps({ id: { type: String, required: true } })
const customer = ref(null)
const opportunities = ref([])
const projects = ref([])
const customerFields = ref([])
const showEditModal = ref(false)
const headerFields = computed(() => {
  const record = customer.value || {}
  return [
    { label: 'Contact', value: record.contact_name },
    { label: 'Email', value: record.email, href: record.email ? `mailto:${record.email}` : undefined },
    { label: 'Phone', value: record.phone, href: record.phone ? `tel:${record.phone}` : undefined },
    { label: 'Status', value: record.status || 'Lead' },
    { label: 'Opportunities', value: opportunities.value.length },
    { label: 'Projects', value: projects.value.length }
  ]
})

const profileFieldFallbacks = [
  { label: 'Address Line 1', api_name: 'address_line_1', field_type: 'Text' },
  { label: 'Address Line 2', api_name: 'address_line_2', field_type: 'Text' },
  { label: 'City', api_name: 'city', field_type: 'Text' },
  { label: 'Pincode', api_name: 'pincode', field_type: 'Text' },
  { label: 'State', api_name: 'state', field_type: 'Text' },
  { label: 'Country', api_name: 'country', field_type: 'Text' },
  { label: 'Registration Type', api_name: 'registration_type', field_type: 'Text' },
  { label: 'Payment Terms', api_name: 'payment_terms', field_type: 'Text' },
  { label: 'Payment Mode', api_name: 'payment_mode', field_type: 'Text' },
]

const fetchData = async () => {
  try {
    const data = await apiGet(`/api/customers/${props.id}`)
    customer.value = data.customer
    opportunities.value = data.opportunities || []
    projects.value = data.projects || []
    customerFields.value = mergeProfileFields(data.fields || [])
  } catch (err) {
    console.error('Failed to load customer details', err)
  }
}

onMounted(fetchData)

function handleSaveSuccess() {
  showEditModal.value = false
  fetchData()
}

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

function mergeProfileFields(fields) {
  const byApi = new Map(fields.map(field => [field.api_name, field]))
  profileFieldFallbacks.forEach(field => {
    if (!byApi.has(field.api_name)) byApi.set(field.api_name, field)
  })
  return Array.from(byApi.values())
}
</script>

<style scoped>
.customer-detail-page { margin: 0 auto; max-width: 1440px; }
.customer-workspace { align-items: start; display: grid; gap: 18px; grid-template-columns: minmax(0, 1fr) 340px; }
.customer-profile-card, .related-section { background: #fff; border: 1px solid #ded8d1; border-radius: 9px; box-shadow: 0 1px 2px rgba(36,31,27,.04); }
.customer-section-header { align-items: center; border-bottom: 1px solid #ebe7e2; display: flex; justify-content: space-between; padding: 16px 18px; }
.customer-section-header p { color: #8d4a16; font-size: 10px; font-weight: 800; letter-spacing: .07em; margin: 0 0 3px; text-transform: uppercase; }
.customer-section-header h2 { color: #241f1b; font-size: 16px; margin: 0; }
.customer-record-status { background: #fff3e4; border: 1px solid #f0c99f; border-radius: 999px; color: #984408; font-size: 11px; font-weight: 750; padding: 5px 9px; }
.customer-information-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); margin: 0; padding: 5px 18px 18px; }
.customer-information-grid > div { border-bottom: 1px solid #f0ece8; min-width: 0; padding: 14px 4px; }
.customer-information-grid > div:nth-child(odd) { padding-right: 22px; }
.customer-field--wide { grid-column: 1 / -1; }
.customer-information-grid dt { color: #7a726b; font-size: 10.5px; font-weight: 700; margin-bottom: 5px; text-transform: uppercase; }
.customer-information-grid dd { color: #302a25; font-size: 13px; font-weight: 600; margin: 0; overflow-wrap: anywhere; }
.customer-field--multiline { font-weight: 500 !important; line-height: 1.6; white-space: pre-wrap; }
.customer-system-info { padding: 0 18px 18px; }
.related-pane { display: grid; gap: 12px; }
.related-section { overflow: hidden; padding: 0; }
.related-heading { align-items: center; border-bottom: 1px solid #ebe7e2; display: flex; justify-content: space-between; padding: 13px 14px; }
.related-heading div { display: grid; gap: 2px; }
.related-heading span { color: #302a25; font-size: 12.5px; font-weight: 750; }
.related-heading small { color: #857c74; font-size: 10px; }
.related-heading a { color: #a94f0a; font-size: 11px; font-weight: 750; text-decoration: none; }
.related-section .list-item { border-bottom: 1px solid #f0ece8; padding: 11px 14px; }
.related-section .list-item:last-child { border-bottom: 0; }
.related-empty { color: #8a8179; font-size: 11.5px; margin: 0; padding: 18px 14px; }
@media (max-width: 1000px) { .customer-workspace { grid-template-columns: 1fr; } .related-pane { grid-template-columns: repeat(2, minmax(0,1fr)); } }
@media (max-width: 640px) { .customer-information-grid { grid-template-columns: 1fr; } .customer-field--wide { grid-column: auto; } .related-pane { grid-template-columns: 1fr; } }

</style>
