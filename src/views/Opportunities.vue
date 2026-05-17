<template>
  <div class="opportunities-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Sales</p>
        <h1>Opportunities</h1>
        <p class="muted">Track potential deals and sales pipeline.</p>
      </div>
      <button class="button" @click="showNewModal = true">
        <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
        New Opportunity
      </button>
    </header>

    <section class="filters-bar">
      <div class="filter-group search">
        <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        <input v-model="search" placeholder="Search opportunities by title or customer...">
      </div>
      <div class="filter-group">
        <label>Stage:</label>
        <select v-model="stage">
          <option value="">All Stages</option>
          <option v-for="item in stages" :key="item">{{ item }}</option>
        </select>
      </div>
    </section>

    <section class="table-container">
      <table class="record-table">
        <thead>
          <tr>
            <th>Opportunity</th>
            <th>Customer</th>
            <th>Stage</th>
            <th class="right">Value</th>
            <th>Expected Close</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="opp in filtered" :key="opp.id" @click="goToDetail(opp.id)">
            <td>
              <div class="name-cell">
                <strong>{{ opp.title }}</strong>
                <span class="muted small">{{ opp.opportunity_number || '#' + opp.id }}</span>
              </div>
            </td>
            <td>
              <RouterLink :to="`/customers/${opp.customer_id}`" class="link" @click.stop>{{ opp.company_name }}</RouterLink>
            </td>
            <td><span class="pill stage">{{ opp.stage }}</span></td>
            <td class="right money-cell">
              {{ opp.currency }} {{ Number(opp.value || 0).toLocaleString() }}
            </td>
            <td class="date-col">{{ formatDate(opp.expected_close) }}</td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="empty-state">No opportunities found.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Modal -->
    <div v-if="showNewModal" class="modal-overlay" @click="showNewModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>New Opportunity</h2>
          <button class="modal-close" @click="showNewModal = false">&times;</button>
        </div>
        <form class="form-grid modal-form" @submit.prevent="saveNew">
          <label 
            v-for="field in oppFields" 
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
            
            <!-- Currency selection -->
            <select 
              v-else-if="field.api_name === 'currency'"
              v-model="newForm.currency" 
              required
            >
              <option v-for="currency in currencies" :key="currency.code" :value="currency.code">{{ currency.code }}</option>
            </select>
            
            <!-- Stage selection -->
            <select 
              v-else-if="field.api_name === 'stage'"
              v-model="newForm.stage" 
              required
            >
              <option v-for="item in stages" :key="item">{{ item }}</option>
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
const opportunities = ref([])
const stages = ref([])
const customers = ref([])
const currencies = ref([])
const stage = ref('')
const search = ref('')
const showNewModal = ref(false)
const newForm = reactive({ customer_id: '', country: '', title: '', opportunity_number: '', value: 0, currency: 'INR', stage: 'Draft', expected_close: '', requirements: '', next_action: '' })

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

const filtered = computed(() => opportunities.value.filter((opp) => {
  const matchesStage = !stage.value || opp.stage === stage.value
  const matchesSearch = !search.value || 
    opp.title.toLowerCase().includes(search.value.toLowerCase()) || 
    opp.company_name.toLowerCase().includes(search.value.toLowerCase())
  return matchesStage && matchesSearch
}))

onMounted(async () => {
  try {
    const data = await apiGet('/api/opportunities')
    opportunities.value = data.opportunities || []
    stages.value = data.stages || []
    currencies.value = data.currencies || []
    if (data.fields && data.fields.length > 0) {
      oppFields.value = data.fields
      data.fields.forEach(field => {
        if (!(field.api_name in newForm)) {
          newForm[field.api_name] = field.field_type === 'Checkbox' ? false : ''
        }
      })
    }
    const options = await apiGet('/api/options')
    customers.value = options.customers || []
  } catch (err) {
    console.error('Failed to load opportunities configuration', err)
  }
})

async function saveNew() {
  try {
    const data = await apiPost('/api/opportunities', newForm)
    opportunities.value.unshift(data.opportunity)
    showNewModal.value = false
    
    // Clear and reset form dynamically
    Object.assign(newForm, { customer_id: '', country: '', title: '', opportunity_number: '', value: 0, currency: 'INR', stage: 'Draft', expected_close: '', requirements: '', next_action: '' })
    oppFields.value.forEach(field => {
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
  router.push(`/opportunities/${id}`)
}
</script>

<style scoped>
.opportunities-page {
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
.record-table th.right, .record-table td.right { text-align: right; }
.money-cell { font-weight: 700; }
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
