<template>
  <div class="projects-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Delivery</p>
        <h1>Projects</h1>
        <p class="muted">Manage and monitor project delivery and execution.</p>
      </div>
      <button class="button" @click="showNewModal = true">
        <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
        New Project
      </button>
    </header>

    <section class="filters-bar">
      <div class="filter-group search">
        <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        <input v-model="search" placeholder="Search projects by name, customer, or owner...">
      </div>
      <div class="filter-group">
        <label>Status:</label>
        <select v-model="status">
          <option value="">All Statuses</option>
          <option v-for="item in statuses" :key="item">{{ item }}</option>
        </select>
      </div>
    </section>

    <section class="table-container">
      <table class="record-table">
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Customer</th>
            <th>Opportunity</th>
            <th>Status</th>
            <th>Delivery Timeline</th>
            <th>Owner</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in filtered" :key="project.id" @click="goToDetail(project.id)">
            <td><strong>{{ project.project_name }}</strong></td>
            <td>
              <RouterLink :to="`/customers/${project.customer_id}`" class="link" @click.stop>{{ project.company_name }}</RouterLink>
            </td>
            <td>{{ project.opportunity_title || '-' }}</td>
            <td><span class="pill status">{{ project.status }}</span></td>
            <td class="date-col">{{ formatDate(project.delivery_timeline) }}</td>
            <td>{{ project.owner || '-' }}</td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="6" class="empty-state">No projects found matching your filters.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Modal -->
    <div v-if="showNewModal" class="modal-overlay" @click="showNewModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>New Project</h2>
          <button class="modal-close" @click="showNewModal = false">&times;</button>
        </div>
        <form class="form-grid modal-form" @submit.prevent="saveNew">
          <label 
            v-for="field in projFields" 
            :key="field.api_name"
            :class="isSpan2(field) ? 'span-2' : ''"
          >
            {{ field.label }} <span v-if="field.is_required" style="color: #dc2626; margin-left: 2px;">*</span>
            
            <!-- Customer selection -->
            <select 
              v-if="field.api_name === 'customer_id'"
              v-model="newForm.customer_id" 
              required
            >
              <option value="">Select Customer</option>
              <option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.company_name }}</option>
            </select>
            
            <!-- Opportunity selection -->
            <select 
              v-else-if="field.api_name === 'opportunity_id'"
              v-model="newForm.opportunity_id" 
              required
            >
              <option value="">Select Opportunity</option>
              <option v-for="opp in filteredOpportunities" :key="opp.id" :value="opp.id">{{ opp.company_name }} - {{ opp.title }}</option>
            </select>
            
            <!-- Status selection -->
            <select 
              v-else-if="field.api_name === 'status'"
              v-model="newForm.status" 
              required
            >
              <option v-for="item in statuses" :key="item">{{ item }}</option>
            </select>

            <!-- Long Text -->
            <textarea 
              v-else-if="field.field_type === 'Long Text'" 
              v-model="newForm[field.api_name]" 
              :required="field.is_required"
              rows="2"
              :placeholder="'Enter ' + field.label.toLowerCase() + '...'"
            ></textarea>
            
            <!-- Dropdown -->
            <select 
              v-else-if="field.field_type === 'Dropdown'" 
              v-model="newForm[field.api_name]" 
              :required="field.is_required"
            >
              <option v-for="opt in parseOptions(field.picklist_options)" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            
            <!-- Checkbox -->
            <input 
              v-else-if="field.field_type === 'Checkbox'" 
              type="checkbox" 
              v-model="newForm[field.api_name]"
            >
            
            <!-- Number -->
            <input 
              v-else-if="field.field_type === 'Number'" 
              type="number" 
              step="any"
              v-model="newForm[field.api_name]" 
              :required="field.is_required"
              :placeholder="'Enter ' + field.label.toLowerCase() + '...'"
            >
            
            <!-- Date -->
            <input 
              v-else-if="field.field_type === 'Date'" 
              type="date" 
              v-model="newForm[field.api_name]" 
              :required="field.is_required"
            >
            
            <!-- Default Text -->
            <input 
              v-else 
              type="text" 
              v-model="newForm[field.api_name]" 
              :required="field.is_required"
              :placeholder="'Enter ' + field.label.toLowerCase() + '...'"
            >
          </label>
          <div class="span-2 action-row"><button class="button" type="submit">Save</button></div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost } from '../api/client'

const router = useRouter()
const projects = ref([])
const statuses = ref([])
const customers = ref([])
const opportunities = ref([])
const status = ref('')
const search = ref('')
const showNewModal = ref(false)
const newForm = reactive({ customer_id: '', opportunity_id: '', project_name: '', status: 'Planning', client_requirements: '', delivery_timeline: '', product_delivery_status: '', owner: '', last_update: '' })

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

const filtered = computed(() => projects.value.filter((project) => {
  const matchesStatus = !status.value || project.status === status.value
  const matchesSearch = !search.value || 
    project.project_name.toLowerCase().includes(search.value.toLowerCase()) || 
    project.company_name.toLowerCase().includes(search.value.toLowerCase()) ||
    (project.owner || '').toLowerCase().includes(search.value.toLowerCase())
  return matchesStatus && matchesSearch
}))

const filteredOpportunities = computed(() => opportunities.value.filter((opp) => !newForm.customer_id || Number(opp.customer_id) === Number(newForm.customer_id)))

onMounted(async () => {
  try {
    const data = await apiGet('/api/projects')
    projects.value = data.projects || []
    statuses.value = data.statuses || []
    if (data.fields && data.fields.length > 0) {
      projFields.value = data.fields
      data.fields.forEach(field => {
        if (!(field.api_name in newForm)) {
          newForm[field.api_name] = field.field_type === 'Checkbox' ? false : ''
        }
      })
    }
    const options = await apiGet('/api/options')
    customers.value = options.customers || []
    opportunities.value = options.opportunities || []
  } catch (err) {
    console.error('Failed to load projects configuration', err)
  }
})

async function saveNew() {
  try {
    const data = await apiPost('/api/projects', newForm)
    projects.value.unshift(data.project)
    showNewModal.value = false
    
    // Clear and reset form dynamically
    Object.assign(newForm, { customer_id: '', opportunity_id: '', project_name: '', status: 'Planning', client_requirements: '', delivery_timeline: '', product_delivery_status: '', owner: '', last_update: '' })
    projFields.value.forEach(field => {
      if (field.api_name !== 'id' && field.api_name !== 'created_at') {
        newForm[field.api_name] = field.field_type === 'Checkbox' ? false : ''
      }
    })
  } catch (err) {
    console.error('Save failed', err)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function goToDetail(id) {
  router.push(`/projects/${id}`)
}
</script>

<style scoped>
.projects-page {
  max-width: 1400px;
  margin: 0 auto;
}

.filters-bar {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  align-items: center;
}

.filter-group.search {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
}

.filter-group.search input {
  padding-left: 40px;
  background: #f8fafc;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
  white-space: nowrap;
}

.table-container {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}

.record-table {
  width: 100%;
  border-collapse: collapse;
}

.record-table th {
  background: #f8fafc;
  padding: 16px 24px;
  text-align: left;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
}

.record-table td {
  padding: 16px 24px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background 0.2s;
}

.record-table tr:hover td {
  background: #f1f5f9;
}

.record-table tr:last-child td {
  border-bottom: none;
}

.record-table strong { font-size: 15px; color: var(--primary); }
.date-col { font-size: 13px; color: var(--muted); }

.link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}

.empty-state {
  text-align: center;
  padding: 48px !important;
  color: var(--muted);
  font-style: italic;
}
</style>
