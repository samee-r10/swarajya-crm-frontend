<template>
  <div class="customers-page">
    <CrmPageHeader
      eyebrow="Sales"
      title="Customers"
      description="Manage accounts, contacts, statuses, and relationship health from one customer workspace."
    >
      <template #actions>
      <button class="button" @click="showNewModal = true">
        <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
        New Customer
      </button>
      </template>
    </CrmPageHeader>

    <section class="filters-bar">
      <div class="filter-group search">
        <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        <input v-model="search" placeholder="Search customers by name, contact, or email...">
      </div>
      <div class="filter-group">
        <label>Status:</label>
        <select v-model="status">
          <option value="">All Statuses</option>
          <option v-for="item in statuses" :key="item">{{ item }}</option>
        </select>
      </div>
    </section>

    <section v-if="selectedIds.length" class="bulk-action-bar">
      <strong>{{ selectedIds.length }} selected</strong>
      <span class="muted">Use row actions to open or review selected accounts.</span>
      <button class="button secondary small" type="button" @click="selectedIds = []">Clear selection</button>
    </section>

    <section class="table-container shadow-premium">
      <CrmTableSkeleton v-if="loading" :rows="7" :columns="7" />
      <table v-else class="record-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input class="table-checkbox" type="checkbox" :checked="allPageSelected" @change="togglePageSelection">
            </th>
            <th><button class="table-sort" type="button" @click="setSort('company_name')">Company Name <span>{{ sortIndicator('company_name') }}</span></button></th>
            <th><button class="table-sort" type="button" @click="setSort('contact_name')">Primary Contact <span>{{ sortIndicator('contact_name') }}</span></button></th>
            <th><button class="table-sort" type="button" @click="setSort('industry')">Industry <span>{{ sortIndicator('industry') }}</span></button></th>
            <th><button class="table-sort" type="button" @click="setSort('status')">Status <span>{{ sortIndicator('status') }}</span></button></th>
            <th>Billing Address</th>
            <th><button class="table-sort" type="button" @click="setSort('updated_at')">Last Updated <span>{{ sortIndicator('updated_at') }}</span></button></th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in paginatedCustomers" :key="customer.id" @click="goToDetail(customer.id)">
            <td class="checkbox-col" @click.stop>
              <input class="table-checkbox" type="checkbox" :value="customer.id" v-model="selectedIds">
            </td>
            <td>
              <div class="name-cell">
                <strong>{{ customer.company_name }}</strong>
                <span v-if="customer.industry" class="muted small">{{ customer.industry }}</span>
              </div>
            </td>
            <td>
              <div class="contact-info">
                <strong>{{ customer.contact_name }}</strong>
                <span class="muted small">{{ customer.email || 'No email' }}</span>
              </div>
            </td>
            <td>{{ customer.industry || '-' }}</td>
            <td><span class="pill status" :class="customer.status.toLowerCase()">{{ customer.status }}</span></td>
            <td><span class="muted small truncate">{{ customer.billing_address || '--' }}</span></td>
            <td class="date-col">{{ formatDate(customer.updated_at) }}</td>
            <td class="table-actions" @click.stop>
              <button class="button secondary small" type="button" @click="goToDetail(customer.id)">Open</button>
            </td>
          </tr>
          <tr v-if="!loading && filteredCustomers.length === 0">
            <td colspan="8">
              <CrmEmptyState title="No customers found" description="Adjust your search or filters, or create a new customer account." />
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="totalPages > 1" class="pagination-bar">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1" 
          @click="currentPage--"
        >
          Previous
        </button>
        <span class="pagination-info">Page {{ currentPage }} of {{ totalPages }} ({{ filteredCustomers.length }} records)</span>
        <button 
          class="pagination-btn" 
          :disabled="currentPage === totalPages" 
          @click="currentPage++"
        >
          Next
        </button>
      </div>
    </section>

    <!-- Modal -->
    <div v-if="showNewModal" class="modal-overlay" @click.self="showNewModal = false">
      <div class="modal-content shadow-premium" @click.stop>
        <div class="modal-header">
          <h2>New Customer</h2>
          <button class="modal-close" @click="showNewModal = false">&times;</button>
        </div>
        <form class="form-grid modal-form" @submit.prevent="saveNew">
          <label 
            v-for="field in customerFields" 
            :key="field.api_name"
            :class="isSpan2(field) ? 'span-2' : ''"
          >
            {{ field.label }} <span v-if="field.is_required" style="color: #dc2626; margin-left: 2px;">*</span>
            
            <!-- Long Text -->
            <textarea 
              v-if="field.field_type === 'Long Text'" 
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
          
          <div v-if="errorMessage" class="span-2 error-box">{{ errorMessage }}</div>
          
          <div class="span-2 action-row">
            <button class="button secondary" type="button" @click="showNewModal = false">Cancel</button>
            <button class="button" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save Customer' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost } from '../api/client'
import CrmEmptyState from '../components/CrmEmptyState.vue'
import CrmPageHeader from '../components/CrmPageHeader.vue'
import CrmTableSkeleton from '../components/CrmTableSkeleton.vue'

const router = useRouter()
const customers = ref([])
const statuses = ref([])
const loading = ref(true)
const search = ref('')
const status = ref('')
const sortKey = ref('updated_at')
const sortDir = ref('desc')
const selectedIds = ref([])
const showNewModal = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const newForm = reactive({ company_name: '', contact_name: '', email: '', phone: '', industry: '', status: 'Lead', notes: '', billing_address: '' })

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

const filteredCustomers = computed(() => {
  const filtered = customers.value.filter((customer) => {
    const text = `${customer.company_name} ${customer.contact_name} ${customer.email || ''}`.toLowerCase()
    return (!status.value || customer.status === status.value) && text.includes(search.value.toLowerCase())
  })
  return filtered.sort((a, b) => {
    const left = String(a[sortKey.value] || '').toLowerCase()
    const right = String(b[sortKey.value] || '').toLowerCase()
    if (left === right) return 0
    const result = left > right ? 1 : -1
    return sortDir.value === 'asc' ? result : -result
  })
})

const currentPage = ref(1)
const itemsPerPage = 10

const totalPages = computed(() => Math.ceil(filteredCustomers.value.length / itemsPerPage))

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredCustomers.value.slice(start, end)
})

watch([search, status], () => {
  currentPage.value = 1
})

const allPageSelected = computed(() => {
  if (!paginatedCustomers.value.length) return false
  return paginatedCustomers.value.every(customer => selectedIds.value.includes(customer.id))
})

onMounted(async () => {
  try {
    const data = await apiGet('/api/customers')
    customers.value = data.customers || []
    statuses.value = data.statuses || []
    if (data.fields && data.fields.length > 0) {
      customerFields.value = data.fields
      data.fields.forEach(field => {
        if (!(field.api_name in newForm)) {
          newForm[field.api_name] = field.field_type === 'Checkbox' ? false : ''
        }
      })
    }
  } catch (err) {
    console.error('Failed to load customers', err)
  } finally {
    loading.value = false
  }
})

async function saveNew() {
  saving.value = true
  errorMessage.value = ''
  try {
    const data = await apiPost('/api/customers', newForm)
    if (data.customer) {
      customers.value.unshift(data.customer)
      showNewModal.value = false
      
      // Reset form fields dynamically
      Object.assign(newForm, { company_name: '', contact_name: '', email: '', phone: '', industry: '', status: 'Lead', notes: '', billing_address: '' })
      customerFields.value.forEach(field => {
        if (field.api_name !== 'id' && field.api_name !== 'created_at') {
          newForm[field.api_name] = field.field_type === 'Checkbox' ? false : ''
        }
      })
    } else {
      errorMessage.value = 'Failed to create customer. Please try again.'
    }
  } catch (err) {
    console.error('Save failed', err)
    errorMessage.value = err.message || 'An error occurred while saving.'
  } finally {
    saving.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function goToDetail(id) {
  router.push(`/customers/${id}`)
}

function setSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function sortIndicator(key) {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? 'Asc' : 'Desc'
}

function togglePageSelection(event) {
  const pageIds = paginatedCustomers.value.map(customer => customer.id)
  if (event.target.checked) {
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...pageIds]))
  } else {
    selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
  }
}
</script>

<style scoped>
.customers-page {
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

.name-cell strong { display: block; font-size: 15px; color: var(--primary); }
.contact-info strong { display: block; font-size: 14px; }
.small { font-size: 12px; }
.date-col { font-size: 13px; color: var(--muted); }

.empty-state {
  text-align: center;
  padding: 48px !important;
  color: var(--muted);
  font-style: italic;
}

.error-box {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #fca5a5;
  margin-top: 8px;
}

.truncate {
  display: block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Pagination Bar styling */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #ffffff;
  border-top: 1px solid var(--line);
}

.pagination-btn {
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--surface-soft);
  color: var(--primary);
  border-color: var(--primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: var(--muted);
  font-weight: 500;
}
</style>
