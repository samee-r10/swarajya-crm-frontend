<template>
  <div class="vendors-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Finance</p>
        <h1>Vendors</h1>
        <p class="muted">Manage your suppliers and business partners.</p>
      </div>
      <button class="button" @click="showNewModal = true">
        <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
        New Vendor
      </button>
    </header>

    <section class="filters-bar">
      <div class="filter-group search">
        <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        <input v-model="search" placeholder="Search vendors by name, contact, or category...">
      </div>
    </section>

    <section class="table-container">
      <table class="record-table">
        <thead>
          <tr>
            <th>Vendor Name</th>
            <th>Contact Person</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="vendor in paginatedVendors" :key="vendor.id" @click="goToDetail(vendor.id)">
            <td><strong>{{ vendor.name }}</strong></td>
            <td>{{ vendor.contact_person || '-' }}</td>
            <td>{{ vendor.email || '-' }}</td>
            <td>{{ vendor.phone || '-' }}</td>
            <td><span class="pill status">{{ vendor.category || 'General' }}</span></td>
            <td>
              <RouterLink :to="`/finance/vendors/${vendor.id}/edit`" class="link" @click.stop>Edit</RouterLink>
            </td>
          </tr>
          <tr v-if="filteredVendors.length === 0">
            <td colspan="6" class="empty-state">No vendors found.</td>
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
        <span class="pagination-info">Page {{ currentPage }} of {{ totalPages }} ({{ filteredVendors.length }} records)</span>
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
    <div v-if="showNewModal" class="modal-overlay" @click="showNewModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>New Vendor</h2>
          <button class="modal-close" @click="showNewModal = false">&times;</button>
        </div>
        <form class="form-grid modal-form" @submit.prevent="saveNew">
          <label 
            v-for="field in vendorFields" 
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost } from '../api/client'

const router = useRouter()
const vendors = ref([])
const search = ref('')
const showNewModal = ref(false)
const newForm = reactive({ name: '', contact_person: '', email: '', phone: '', category: '', notes: '' })

const defaultFields = [
  { label: 'Vendor Name', api_name: 'name', field_type: 'Text', is_required: true },
  { label: 'Contact Person', api_name: 'contact_person', field_type: 'Text', is_required: false },
  { label: 'Email', api_name: 'email', field_type: 'Text', is_required: false },
  { label: 'Phone', api_name: 'phone', field_type: 'Text', is_required: false },
  { label: 'Category', api_name: 'category', field_type: 'Text', is_required: false },
  { label: 'Notes', api_name: 'notes', field_type: 'Long Text', is_required: false }
]
const vendorFields = ref([...defaultFields])

function isSpan2(field) {
  return field.field_type === 'Long Text' || field.api_name === 'notes'
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

const filteredVendors = computed(() => vendors.value.filter((vendor) => {
  const term = search.value.toLowerCase()
  return !term || 
    vendor.name.toLowerCase().includes(term) || 
    (vendor.contact_person || '').toLowerCase().includes(term) ||
    (vendor.email || '').toLowerCase().includes(term) ||
    (vendor.category || '').toLowerCase().includes(term)
}))

const currentPage = ref(1)
const itemsPerPage = 10

const totalPages = computed(() => Math.ceil(filteredVendors.value.length / itemsPerPage))

const paginatedVendors = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredVendors.value.slice(start, end)
})

watch(search, () => {
  currentPage.value = 1
})

onMounted(async () => {
  try {
    const data = await apiGet('/api/finance/vendors')
    vendors.value = data.vendors || []
    if (data.fields && data.fields.length > 0) {
      vendorFields.value = data.fields
      data.fields.forEach(field => {
        if (!(field.api_name in newForm)) {
          newForm[field.api_name] = field.field_type === 'Checkbox' ? false : ''
        }
      })
    }
  } catch (err) {
    console.error('Failed to load vendors configuration', err)
  }
})

async function saveNew() {
  try {
    const data = await apiPost('/api/finance/vendors', newForm)
    vendors.value.unshift(data.vendor)
    showNewModal.value = false
    
    // Clear and reset form dynamically
    Object.assign(newForm, { name: '', contact_person: '', email: '', phone: '', category: '', notes: '' })
    vendorFields.value.forEach(field => {
      if (field.api_name !== 'id' && field.api_name !== 'created_at') {
        newForm[field.api_name] = field.field_type === 'Checkbox' ? false : ''
      }
    })
  } catch (err) {
    console.error('Save failed', err)
  }
}

function goToDetail(id) {
  router.push(`/finance/vendors/${id}`)
}
</script>

<style scoped>
.vendors-page {
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
