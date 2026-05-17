<template>
  <div class="object-detail-page">
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs">
      <RouterLink to="/setup">Setup</RouterLink>
      <span class="separator">/</span>
      <span class="current">Object Manager</span>
    </nav>

    <!-- Header Section -->
    <header class="page-header" v-if="objectInfo">
      <div>
        <div class="title-row">
          <h1>{{ objectInfo.label }}</h1>
          <span class="pill status-info">{{ objectInfo.api_name }}</span>
          <span v-if="objectInfo.is_standard" class="pill status-success">Standard Object</span>
          <span v-else class="pill status-warning">Custom Object</span>
        </div>
        <p class="muted">{{ objectInfo.description || 'No description provided for this object.' }}</p>
      </div>
      <div class="actions-group">
        <button type="button" class="button secondary" @click="goBack">
          Back to Setup
        </button>
        <button type="button" class="button" @click="openNewFieldModal">
          <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
          New Custom Field
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <section v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p class="muted">Loading object fields...</p>
    </section>

    <!-- Main Content -->
    <section v-else class="table-container shadow-premium">
      <div class="panel-header">
        <h2>Fields & Relationships</h2>
        <span class="muted small">{{ fields.length }} fields configured</span>
      </div>
      
      <table class="record-table">
        <thead>
          <tr>
            <th>Field Label</th>
            <th>API Name</th>
            <th>Data Type</th>
            <th>Requirement</th>
            <th>Source</th>
            <th class="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="field in fields" :key="field.id">
            <td>
              <strong>{{ field.label }}</strong>
            </td>
            <td>
              <code class="api-code">{{ field.api_name }}</code>
            </td>
            <td>
              <span class="type-badge">{{ field.field_type }}</span>
            </td>
            <td>
              <span class="pill" :class="field.is_required ? 'status-danger' : 'status-muted'">
                {{ field.is_required ? 'Required' : 'Optional' }}
              </span>
            </td>
            <td>
              <span class="pill" :class="field.is_native ? 'status-success' : 'status-warning'">
                {{ field.is_native ? 'Standard' : 'Custom' }}
              </span>
            </td>
            <td class="right table-actions">
              <button class="action-btn-link" @click="openEditFieldModal(field)">Edit</button>
              <button 
                v-if="!field.is_native" 
                class="action-btn-link delete" 
                @click="deleteField(field)"
              >
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="fields.length === 0">
            <td colspan="6" class="empty-state">No fields found for this object.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Glassmorphic Field Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Edit Custom Field' : 'New Custom Field' }}</h2>
          <p class="muted small" v-if="isEditMode">Editing field: {{ fieldForm.api_name }}</p>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        
        <form class="modal-form p-24" @submit.prevent="saveField">
          <div class="form-grid single-column">
            <!-- Field Label -->
            <label>
              Field Label <span class="required">*</span>
              <input 
                v-model="fieldForm.label" 
                placeholder="e.g. GST Registration Number" 
                required
                @input="handleLabelInput"
              >
            </label>

            <!-- API Name -->
            <label>
              Field Name (API Name) <span class="required">*</span>
              <input 
                v-model="fieldForm.api_name" 
                placeholder="e.g. gst_registration_number__c" 
                required
                :disabled="fieldForm.is_native"
              >
              <span class="help-text">Dynamic unique identifier inside CRM. Suffix '__c' is required for custom fields.</span>
            </label>

            <!-- Field Type Selection -->
            <label>
              Data Type <span class="required">*</span>
              <select v-model="fieldForm.field_type" :disabled="isEditMode">
                <option value="Text">Text (Single-line)</option>
                <option value="Long Text">Long Text (Multi-line)</option>
                <option value="Number">Number</option>
                <option value="Date">Date</option>
                <option value="Checkbox">Checkbox</option>
                <option value="Dropdown">Dropdown (Picklist)</option>
              </select>
            </label>

            <!-- Picklist Options Area (Only for Dropdown) -->
            <label v-if="fieldForm.field_type === 'Dropdown'">
              Dropdown Options <span class="required">*</span>
              <textarea 
                v-model="picklistInput" 
                rows="4" 
                placeholder="Enter each option on a new line&#10;e.g.&#10;Gold&#10;Silver&#10;Bronze"
                required
              ></textarea>
              <span class="help-text">Separate options with a line break (Enter key).</span>
            </label>

            <!-- Required Checkbox -->
            <label class="checkbox-label">
              <input type="checkbox" v-model="fieldForm.is_required">
              <span>Always require a value in this field in order to save a record</span>
            </label>
          </div>

          <div class="form-actions mt-24">
            <button type="button" class="button secondary" @click="closeModal">Cancel</button>
            <button type="submit" class="button" :disabled="savingField">
              {{ savingField ? 'Saving Field...' : (isEditMode ? 'Save Permissions & Changes' : 'Create Custom Field') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client'

const props = defineProps({
  apiName: {
    type: String,
    required: true
  }
})

const router = useRouter()
const objectInfo = ref(null)
const fields = ref([])
const loading = ref(true)

// Modal states
const showModal = ref(false)
const isEditMode = ref(false)
const savingField = ref(false)
const picklistInput = ref('')

const fieldForm = reactive({
  id: null,
  label: '',
  api_name: '',
  field_type: 'Text',
  is_required: false,
  is_native: false
})

onMounted(async () => {
  await fetchObjectData()
})

async function fetchObjectData() {
  loading.value = true
  try {
    const data = await apiGet(`/api/setup/objects/${props.apiName}`)
    objectInfo.value = data.object
    fields.value = data.fields || []
  } catch (err) {
    console.error("Failed to load object details:", err)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/setup')
}

// Auto generate API name from Label while typing in New Mode
function handleLabelInput() {
  if (isEditMode.value || fieldForm.is_native) return
  
  // Replace spaces/special chars with underscores, lowercase, append __c
  const slug = fieldForm.label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special characters
    .replace(/[\s-]+/g, '_')     // replace spaces/dashes with underscores
    .replace(/^_+|_+$/g, '')      // trim underscores
    
  fieldForm.api_name = slug ? `${slug}__c` : ''
}

function openNewFieldModal() {
  isEditMode.value = false
  fieldForm.id = null
  fieldForm.label = ''
  fieldForm.api_name = ''
  fieldForm.field_type = 'Text'
  fieldForm.is_required = false
  fieldForm.is_native = false
  picklistInput.value = ''
  showModal.value = true
}

function openEditFieldModal(field) {
  isEditMode.value = true
  fieldForm.id = field.id
  fieldForm.label = field.label
  fieldForm.api_name = field.api_name
  fieldForm.field_type = field.field_type
  fieldForm.is_required = !!field.is_required
  fieldForm.is_native = !!field.is_native
  
  // Dropdown list parsing
  if (field.field_type === 'Dropdown' && field.picklist_options) {
    try {
      const parsed = JSON.parse(field.picklist_options)
      picklistInput.value = Array.isArray(parsed) ? parsed.join('\n') : ''
    } catch (e) {
      picklistInput.value = field.picklist_options.replace(/,/g, '\n')
    }
  } else {
    picklistInput.value = ''
  }
  
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveField() {
  savingField.value = true
  
  // Format Dropdown values as JSON array string
  let picklistOptions = null
  if (fieldForm.field_type === 'Dropdown') {
    const list = picklistInput.value
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)
    picklistOptions = JSON.stringify(list)
  }

  const payload = {
    label: fieldForm.label,
    api_name: fieldForm.api_name,
    field_type: fieldForm.field_type,
    is_required: fieldForm.is_required,
    picklist_options: picklistOptions
  }

  try {
    if (isEditMode.value) {
      // PUT Request
      await apiPut(`/api/setup/fields/${fieldForm.id}`, payload)
    } else {
      // POST Request
      await apiPost(`/api/setup/objects/${objectInfo.value.id}/fields`, payload)
    }
    
    closeModal()
    await fetchObjectData() // Reload
  } catch (err) {
    console.error("Failed to save custom field:", err)
    alert(err.error || "Failed to save field. Please verify parameters.")
  } finally {
    savingField.value = false
  }
}

async function deleteField(field) {
  if (field.is_native) {
    alert("Standard native fields cannot be deleted.")
    return
  }
  
  if (!confirm(`Are you sure you want to delete the custom field "${field.label}" (${field.api_name})?\nAll stored values for this field will be permanently erased.`)) {
    return
  }

  try {
    await apiDelete(`/api/setup/fields/${field.id}`)
    await fetchObjectData() // Reload
  } catch (err) {
    console.error("Failed to delete custom field:", err)
    alert("Failed to delete field.")
  }
}
</script>

<style scoped>
.object-detail-page {
  max-width: 1200px;
  margin: 0 auto;
}

/* Breadcrumbs navigation style */
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 16px;
}

.breadcrumbs a {
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumbs a:hover {
  color: var(--primary);
}

.breadcrumbs .separator {
  color: var(--line);
}

.breadcrumbs .current {
  color: var(--primary);
}

/* Page Header layout */
.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.title-row h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.actions-group {
  display: flex;
  gap: 12px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--line);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Table Card Panel */
.table-container {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
  background: #f8fafc;
}

.panel-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 850;
  color: var(--primary);
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
  font-size: 14px;
}

.record-table tr:last-child td {
  border-bottom: none;
}

.api-code {
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  color: #0f172a;
}

.type-badge {
  background: #f0fdf4;
  color: #166534;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 800;
  display: inline-block;
}

.table-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}

.action-btn-link {
  background: none;
  border: none;
  color: #1e40af;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  font-size: 13px;
}

.action-btn-link:hover {
  text-decoration: underline;
}

.action-btn-link.delete {
  color: #dc2626;
}

.empty-state {
  text-align: center;
  padding: 48px !important;
  color: var(--muted);
  font-style: italic;
}

/* Modal Form Styles */
.required {
  color: #dc2626;
  margin-left: 2px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin-top: 8px;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label span {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.help-text {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
  display: block;
}

.p-24 { padding: 24px; }
.mt-24 { margin-top: 24px; }
.right { text-align: right; }
</style>
