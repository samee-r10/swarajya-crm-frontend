<template>
  <section v-if="customer" class="page-header">
    <div>
      <p class="eyebrow">Customer</p>
      <h1>{{ customer.company_name }}</h1>
      <p class="muted">{{ customer.contact_name }} · {{ customer.email || 'No email' }} · {{ customer.phone || 'No phone' }}</p>
    </div>
    <button class="button btn-animate" type="button" @click="showEditModal = true">Edit</button>
  </section>

  <!-- Edit Modal Overlay -->
  <transition name="fade">
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <header class="modal-header">
          <div>
            <p class="eyebrow">Sales Module</p>
            <h2>Edit Customer</h2>
          </div>
          <button type="button" class="close-btn" @click="showEditModal = false">×</button>
        </header>
        <main class="modal-body">
          <CustomerForm :id="id" :is-modal="true" @save-success="handleSaveSuccess" @cancel="showEditModal = false" />
        </main>
      </div>
    </div>
  </transition>

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
import CustomerForm from './CustomerForm.vue'

const props = defineProps({ id: { type: String, required: true } })
const customer = ref(null)
const opportunities = ref([])
const projects = ref([])
const customerFields = ref([])
const showEditModal = ref(false)

const fetchData = async () => {
  try {
    const data = await apiGet(`/api/customers/${props.id}`)
    customer.value = data.customer
    opportunities.value = data.opportunities || []
    projects.value = data.projects || []
    customerFields.value = data.fields || []
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
</script>

<style scoped>
/* Glassmorphic Modal Overlay styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}

.modal-content {
  background: var(--surface, #ffffff);
  border-radius: 16px;
  border: 1px solid var(--line, #e2e8f0);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line, #e2e8f0);
  background: var(--surface-soft, #f8fafc);
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 800;
  margin: 4px 0 0;
  color: var(--text, #0f172a);
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--muted, #64748b);
  transition: color 0.2s;
  line-height: 1;
}

.close-btn:hover {
  color: var(--primary, #ea580c);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.btn-animate {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-animate:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
