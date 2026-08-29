<template>
  <section v-if="opportunity" class="page-header">
    <div>
      <p class="eyebrow">Opportunity</p>
      <h1>{{ opportunity.title }}</h1>
      <p class="muted">{{ opportunity.company_name }} · {{ opportunity.stage }}</p>
    </div>
    <div class="header-actions">
      <button class="button secondary" type="button" @click="showUploadModal = true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        Upload Document
      </button>
      <button class="button btn-animate" type="button" @click="showEditModal = true">Edit</button>
    </div>
  </section>

  <!-- Edit Modal Overlay -->
  <transition name="fade">
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <header class="modal-header">
          <div>
            <p class="eyebrow">Sales Module</p>
            <h2>Edit Opportunity</h2>
          </div>
          <button type="button" class="close-btn" @click="showEditModal = false">×</button>
        </header>
        <main class="modal-body">
          <OpportunityForm :id="id" :is-modal="true" @save-success="handleSaveSuccess" @cancel="showEditModal = false" />
        </main>
      </div>
    </div>
  </transition>

  <!-- Upload Document Modal -->
  <transition name="fade">
    <div v-if="showUploadModal" class="modal-overlay" @click.self="closeUploadModal">
      <div class="modal-content doc-upload-modal">
        <header class="modal-header">
          <div>
            <p class="eyebrow">Opportunity Attachments</p>
            <h2>Upload Document</h2>
          </div>
          <button type="button" class="close-btn" @click="closeUploadModal">×</button>
        </header>
        <form class="modal-body doc-upload-form" @submit.prevent="submitUpload">
          <div class="form-group">
            <label>Document Category <span class="required">*</span></label>
            <select v-model="uploadForm.category" required>
              <option value="Quotation">Quotation / Pricing</option>
              <option value="Proposal">Proposal / Pitch Deck</option>
              <option value="Requirement / SOW">Requirement / Scope of Work</option>
              <option value="Contract / Agreement">Contract / Agreement</option>
              <option value="Client Document">Client Document / Data File</option>
              <option value="Other">Other Document</option>
            </select>
          </div>

          <div class="form-group">
            <label>Custom Document Title (Optional)</label>
            <input v-model="uploadForm.customName" type="text" placeholder="e.g. Manch Classes - Commercial Proposal v2" />
          </div>

          <div class="form-group">
            <label>Description / Notes (Optional)</label>
            <textarea v-model="uploadForm.description" rows="2" placeholder="Add any relevant notes regarding this file..."></textarea>
          </div>

          <div class="form-group">
            <label>Select File <span class="required">*</span></label>
            <div 
              class="dropzone-area" 
              :class="{ 'drag-over': isDragging, 'has-file': uploadForm.file }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleFileDrop"
              @click="triggerFileInput"
            >
              <input 
                ref="fileInputRef" 
                type="file" 
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" 
                style="display: none" 
                @change="handleFileSelect"
              />
              <div v-if="!uploadForm.file" class="dropzone-placeholder">
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" style="color: var(--primary);">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                <p><strong>Click to browse</strong> or drag &amp; drop file here</p>
                <small class="text-muted">PDF, Word, Excel, PowerPoint, Images, CSV, ZIP</small>
              </div>
              <div v-else class="dropzone-selected">
                <span class="file-badge">{{ fileExtension(uploadForm.file.name) }}</span>
                <div class="file-info">
                  <strong>{{ uploadForm.file.name }}</strong>
                  <small>{{ formatFileSize(uploadForm.file.size) }}</small>
                </div>
                <button type="button" class="remove-file-btn" @click.stop="uploadForm.file = null">×</button>
              </div>
            </div>
          </div>

          <div v-if="uploadError" class="alert-box error">{{ uploadError }}</div>
          
          <div v-if="isUploading" class="upload-progress-wrap">
            <div class="progress-bar"><div class="progress-fill"></div></div>
            <span>Uploading to cloud storage...</span>
          </div>

          <div class="modal-footer">
            <button class="button secondary" type="button" :disabled="isUploading" @click="closeUploadModal">Cancel</button>
            <button class="button primary" type="submit" :disabled="!uploadForm.file || isUploading">
              {{ isUploading ? 'Uploading...' : 'Upload & Attach' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>

  <section v-if="opportunity" class="record-layout">
    <div class="path-container">
      <div class="path-stages">
        <!-- Render 4 main stages -->
        <div 
          v-for="stg in mainStages" 
          :key="stg"
          class="path-stage"
          :class="{
            'completed': isCompleted(stg),
            'current': stg === opportunity.stage,
            'selected': stg === selectedStage
          }"
          @click="selectedStage = stg"
        >
          {{ stg }}
        </div>

        <!-- Render Close / Closed Stage -->
        <div 
          class="path-stage"
          :class="{
            'completed': isClosed(opportunity.stage),
            'closed-won': isClosed(opportunity.stage) && isClosedWon(opportunity.stage),
            'closed-lost': isClosed(opportunity.stage) && isClosedLost(opportunity.stage),
            'selected': isClosed(selectedStage)
          }"
          @click="selectClosedStage"
        >
          {{ isClosed(opportunity.stage) ? opportunity.stage : 'Close' }}
        </div>
      </div>
      
      <div class="path-actions">
        <!-- Selection dropdown for closed options -->
        <select 
          v-if="isClosed(selectedStage)" 
          v-model="selectedStage" 
          class="closed-select"
        >
          <option v-for="cStage in closedStages" :key="cStage" :value="cStage">
            {{ cStage }}
          </option>
        </select>

        <button 
          class="button primary" 
          @click="updateStage"
          :disabled="selectedStage === opportunity.stage"
          :class="{ 'orange-btn': isClosed(selectedStage) }"
        >
          {{ getButtonLabel() }}
        </button>
      </div>
    </div>

    <div class="form-grid record-card">
      <div class="span-2 card-section-title"><h2>Opportunity Details</h2></div>
      <label v-for="field in fields" :key="field.label" :class="field.long ? 'span-2' : ''">{{ field.label }}
        <textarea v-if="field.long" readonly rows="5" :value="field.value"></textarea><input v-else readonly :value="field.value">
      </label>
      <div class="span-2">
        <SystemInfo :record="opportunity" />
      </div>
    </div>

    <aside class="related-pane">
      <!-- Documents & Files Panel -->
      <div class="panel documents-panel">
        <div class="related-heading">
          <div class="heading-with-count">
            <span>Documents &amp; Proposals</span>
            <span class="count-badge" v-if="documents.length">{{ documents.length }}</span>
          </div>
          <button class="button secondary text-xs btn-upload" type="button" @click="showUploadModal = true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            Upload
          </button>
        </div>

        <div v-if="documents.length === 0" class="empty-docs">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #94a3b8;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <p>No documents attached yet.</p>
          <small class="text-muted">Upload quotations, proposals, SOWs, and agreements.</small>
          <button class="button secondary text-xs mt-8" type="button" @click="showUploadModal = true">Upload First Document</button>
        </div>

        <div v-else class="doc-cards-list">
          <div v-for="(doc, idx) in documents" :key="doc.id || doc.public_id || idx" class="doc-card">
            <div class="doc-icon-wrap" :class="docTypeClass(doc)">
              <span>{{ docTypeBadge(doc) }}</span>
            </div>
            <div class="doc-info" @click="previewDoc(idx)">
              <div class="doc-title-row">
                <strong class="doc-name" :title="doc.name">{{ doc.name }}</strong>
              </div>
              <div class="doc-category-row">
                <span v-if="doc.category" class="category-pill" :class="categoryClass(doc.category)">{{ doc.category }}</span>
                <span class="doc-size">{{ formatFileSize(doc.size) }}</span>
              </div>
              <div class="doc-meta">
                <span v-if="doc.uploaded_at">{{ formatDate(doc.uploaded_at) }}</span>
                <span v-if="doc.uploaded_by_name">by {{ doc.uploaded_by_name }}</span>
              </div>
              <p v-if="doc.description" class="doc-desc">{{ doc.description }}</p>
            </div>
            <div class="doc-actions">
              <button type="button" class="icon-action-btn" title="Preview document" @click="previewDoc(idx)">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              <a :href="documentDownloadUrl(doc)" download :title="`Download ${doc.name}`" class="icon-action-btn" target="_blank" @click.stop>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
              </a>
              <button type="button" class="icon-action-btn delete-btn" title="Delete document" @click.stop="deleteDoc(doc, idx)">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Projects Panel -->
      <div class="panel">
        <div class="related-heading"><span>Projects</span><RouterLink to="/projects/new">New</RouterLink></div>
        <div class="list compact">
          <RouterLink v-for="project in projects" :key="project.id" class="list-item" :to="`/projects/${project.id}`">
            <strong>{{ project.project_name }}</strong><span>{{ project.status }}</span>
          </RouterLink>
        </div>
      </div>
    </aside>

    <!-- In-App Document Viewer -->
    <DocumentViewer
      v-model="viewerOpen"
      :documents="documents"
      :initial-index="viewerIndex"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { API_BASE, apiDelete, apiGet, apiPost, apiPut, apiUploadFile } from '../api/client'
import SystemInfo from '../components/SystemInfo.vue'
import DocumentViewer from '../components/DocumentViewer.vue'
import OpportunityForm from './OpportunityForm.vue'

const props = defineProps({ id: { type: String, required: true } })
const opportunity = ref(null)
const projects = ref([])
const oppFields = ref([])
const stages = ref([])
const selectedStage = ref(null)
const showEditModal = ref(false)

// Documents State
const showUploadModal = ref(false)
const isUploading = ref(false)
const isDragging = ref(false)
const uploadError = ref('')
const fileInputRef = ref(null)
const viewerOpen = ref(false)
const viewerIndex = ref(0)

const uploadForm = reactive({
  category: 'Quotation',
  customName: '',
  description: '',
  file: null
})

const documents = computed(() => {
  if (!opportunity.value) return []
  return Array.isArray(opportunity.value.documents) ? opportunity.value.documents : []
})

const mainStages = ['Draft', 'Discussion', 'Commercial negotiation', 'Contractual negotiation']
const closedStages = ['DA Signed', 'Lost to competitor', 'Rejected by SC', 'Lost']

function isClosedWon(stage) {
  return stage === 'DA Signed'
}

function isClosedLost(stage) {
  return ['Lost to competitor', 'Rejected by SC', 'Lost'].includes(stage)
}

function isClosed(stage) {
  return closedStages.includes(stage)
}

function isCompleted(stage) {
  if (!opportunity.value) return false
  if (isClosed(opportunity.value.stage)) {
    return mainStages.includes(stage)
  }
  const currIdx = mainStages.indexOf(opportunity.value.stage)
  const stgIdx = mainStages.indexOf(stage)
  if (currIdx === -1 || stgIdx === -1) return false
  return stgIdx < currIdx
}

function selectClosedStage() {
  if (isClosed(opportunity.value.stage)) {
    selectedStage.value = opportunity.value.stage
  } else {
    selectedStage.value = 'DA Signed'
  }
}

function getButtonLabel() {
  if (!opportunity.value || !selectedStage.value) return 'Mark Stage'
  if (isClosed(selectedStage.value)) {
    return 'Change Closed Stage'
  }
  if (selectedStage.value === opportunity.value.stage) {
    return 'Current Stage'
  }
  return 'Mark as Current Stage'
}

async function updateStage() {
  if (!opportunity.value || !selectedStage.value || selectedStage.value === opportunity.value.stage) return
  
  try {
    const updatedOpp = { ...opportunity.value, stage: selectedStage.value }
    await apiPut(`/api/opportunities/${props.id}`, updatedOpp)
    opportunity.value.stage = selectedStage.value
  } catch (err) {
    console.error('Failed to update stage', err)
  }
}

const fields = computed(() => {
  if (!opportunity.value) return []
  if (oppFields.value && oppFields.value.length > 0) {
    return oppFields.value.map(field => {
      let val = opportunity.value[field.api_name]
      if (field.api_name === 'customer_id') {
        val = opportunity.value.company_name
      } else if (field.api_name === 'value') {
        val = `${opportunity.value.currency || 'INR'} ${Number(opportunity.value.value || 0).toLocaleString()}`
      } else if (field.field_type === 'Checkbox') {
        val = val ? 'Yes' : 'No'
      }
      return {
        label: field.label,
        value: val || '--',
        long: field.field_type === 'Long Text' || field.api_name === 'requirements' || field.api_name === 'next_action'
      }
    })
  }
  
  // Fallback
  return [
    { label: 'Customer', value: opportunity.value.company_name },
    { label: 'Country', value: opportunity.value.country || '' },
    { label: 'Opportunity Number', value: opportunity.value.opportunity_number || '' },
    { label: 'Value', value: `${opportunity.value.currency} ${Number(opportunity.value.value || 0).toLocaleString()}` },
    { label: 'Stage', value: opportunity.value.stage },
    { label: 'Expected Close', value: opportunity.value.expected_close || '' },
    { label: 'Requirements', value: opportunity.value.requirements || '', long: true },
    { label: 'Next Action', value: opportunity.value.next_action || '', long: true }
  ]
})

const fetchData = async () => {
  try {
    const data = await apiGet(`/api/opportunities/${props.id}`)
    opportunity.value = data.opportunity
    projects.value = data.projects || []
    oppFields.value = data.fields || []
    selectedStage.value = opportunity.value.stage
  } catch (err) {
    console.error('Failed to load opportunity details', err)
  }
}

onMounted(async () => {
  try {
    await fetchData()
    const options = await apiGet('/api/options')
    stages.value = options.opportunity_stages || []
  } catch (err) {
    console.error('Failed to load opportunity details', err)
  }
})

function handleSaveSuccess() {
  showEditModal.value = false
  fetchData()
}

// ── Document Handlers ──────────────────────────────────────────────
function triggerFileInput() {
  if (fileInputRef.value) fileInputRef.value.click()
}

function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) {
    uploadForm.file = file
    uploadError.value = ''
  }
}

function handleFileDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    uploadForm.file = file
    uploadError.value = ''
  }
}

function closeUploadModal() {
  showUploadModal.value = false
  uploadError.value = ''
  uploadForm.file = null
  uploadForm.customName = ''
  uploadForm.description = ''
  uploadForm.category = 'Quotation'
}

async function submitUpload() {
  if (!uploadForm.file) return
  isUploading.value = true
  uploadError.value = ''

  try {
    // 1. Upload to Cloudinary
    const uploadRes = await apiUploadFile('/api/uploads/cloudinary', uploadForm.file, { folder: 'opportunities' })
    const docData = uploadRes.document || uploadRes

    // 2. Attach to Opportunity via backend endpoint
    const payload = {
      name: uploadForm.customName.trim() || uploadForm.file.name,
      url: docData.secure_url || docData.url,
      secure_url: docData.secure_url || docData.url,
      public_id: docData.public_id,
      size: docData.size || uploadForm.file.size,
      format: docData.format || fileExtension(uploadForm.file.name).toLowerCase(),
      type: docData.resource_type || 'file',
      category: uploadForm.category,
      description: uploadForm.description.trim()
    }

    const res = await apiPost(`/api/opportunities/${props.id}/documents`, payload)
    if (res.documents) {
      opportunity.value.documents = res.documents
    } else {
      await fetchData()
    }

    closeUploadModal()
  } catch (err) {
    console.error('Document upload failed:', err)
    uploadError.value = err.message || 'Failed to upload document. Please try again.'
  } finally {
    isUploading.value = false
  }
}

async function deleteDoc(doc, idx) {
  const confirmed = confirm(`Are you sure you want to remove "${doc.name}"?`)
  if (!confirmed) return

  try {
    const docId = doc.id || doc.public_id || doc.name
    const res = await apiDelete(`/api/opportunities/${props.id}/documents/${encodeURIComponent(docId)}`)
    if (res.documents) {
      opportunity.value.documents = res.documents
    } else {
      await fetchData()
    }
  } catch (err) {
    console.error('Failed to delete document:', err)
    alert(err.message || 'Failed to delete document.')
  }
}

function previewDoc(index) {
  viewerIndex.value = index
  viewerOpen.value = true
}

function documentDownloadUrl(doc) {
  const rawUrl = doc?.secure_url || doc?.url || doc?.preview_url || ''
  if (!rawUrl) return '#'
  if (rawUrl.startsWith('/api/') && API_BASE) return `${API_BASE}${rawUrl}`
  return rawUrl
}

function fileExtension(filename) {
  if (!filename) return 'FILE'
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE'
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  const b = Number(bytes)
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  })
}

function docTypeBadge(doc) {
  const ext = fileExtension(doc?.name || doc?.format || '').toLowerCase()
  if (['pdf'].includes(ext)) return 'PDF'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'XLS'
  if (['doc', 'docx'].includes(ext)) return 'DOC'
  if (['ppt', 'pptx'].includes(ext)) return 'PPT'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'IMG'
  if (['zip', 'rar', '7z'].includes(ext)) return 'ZIP'
  return 'FILE'
}

function docTypeClass(doc) {
  const badge = docTypeBadge(doc).toLowerCase()
  return `type-${badge}`
}

function categoryClass(category) {
  switch (category) {
    case 'Quotation': return 'cat-quotation'
    case 'Proposal': return 'cat-proposal'
    case 'Requirement / SOW': return 'cat-sow'
    case 'Contract / Agreement': return 'cat-contract'
    case 'Client Document': return 'cat-client'
    default: return 'cat-other'
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.path-container {
  display: flex;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 24px;
  align-items: center;
  gap: 12px;
  grid-column: span 2;
  min-height: 66px;
}
.path-stages {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  height: 42px;
}
.path-stage {
  flex: 1;
  text-align: center;
  padding: 0 14px 0 24px;
  background: #f3f4f6;
  color: #374151;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.15;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%);
  margin-left: -12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.path-stage:first-child {
  padding-left: 14px;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%);
  margin-left: 0;
}
.path-stage:last-child {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%);
}
.path-stage.completed {
  background: #10b981;
  color: white;
}
.path-stage.current {
  background: #2563eb;
  color: white;
}
.path-stage.closed-won {
  background: #10b981;
  color: white;
}
.path-stage.closed-lost {
  background: #ef4444;
  color: white;
}
.path-stage.selected {
  font-weight: 700;
  box-shadow: inset 0 0 0 2px rgba(0,0,0,0.1);
}
.path-actions {
  display: flex;
  flex: 0 0 360px;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.closed-select {
  height: 38px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  padding: 0 10px;
  font-size: 13px;
  background: white;
}
.orange-btn {
  background-color: #f97316 !important;
  border-color: #f97316 !important;
  color: white !important;
}

/* ── Related Pane & Documents Panel ── */
.related-pane {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.documents-panel {
  background: #ffffff;
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 12px;
  padding: 16px;
}

.heading-with-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
}

.empty-docs {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 12px;
  color: var(--muted, #64748b);
  gap: 6px;
}

.empty-docs p {
  margin: 4px 0 0 0;
  font-weight: 700;
  color: #334155;
  font-size: 13px;
}

.empty-docs small {
  font-size: 11px;
}

.doc-cards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.doc-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.doc-card:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.doc-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.type-pdf { background: #fee2e2; color: #dc2626; }
.type-xls { background: #dcfce7; color: #16a34a; }
.type-doc { background: #dbeafe; color: #2563eb; }
.type-ppt { background: #ffedd5; color: #ea580c; }
.type-img { background: #f3e8ff; color: #9333ea; }
.type-zip { background: #fef9c3; color: #ca8a04; }
.type-file { background: #e2e8f0; color: #475569; }

.doc-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.doc-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.doc-name {
  font-size: 13px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}

.doc-category-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
}

.category-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.cat-quotation { background: #e0f2fe; color: #0284c7; }
.cat-proposal { background: #fae8ff; color: #a21caf; }
.cat-sow { background: #fef3c7; color: #b45309; }
.cat-contract { background: #dcfce7; color: #15803d; }
.cat-client { background: #f1f5f9; color: #475569; }
.cat-other { background: #f3f4f6; color: #6b7280; }

.doc-size {
  font-size: 11px;
  color: #64748b;
}

.doc-meta {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.doc-desc {
  font-size: 11px;
  color: #475569;
  margin: 4px 0 0 0;
}

.doc-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.icon-action-btn {
  background: none;
  border: 1px solid transparent;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.icon-action-btn:hover {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #0f172a;
}

.icon-action-btn.delete-btn:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

/* ── Upload Modal Form ── */
.doc-upload-modal {
  max-width: 520px;
  width: 90%;
  border-radius: 12px;
}

.doc-upload-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.form-group input[type="text"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  background: #ffffff;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary, #f97316);
}

.dropzone-area {
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  background: #f8fafc;
  transition: all 0.2s;
}

.dropzone-area:hover,
.dropzone-area.drag-over {
  border-color: var(--primary, #f97316);
  background: #fff7ed;
}

.dropzone-area.has-file {
  border-style: solid;
  border-color: #86efac;
  background: #f0fdf4;
  padding: 14px;
}

.dropzone-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.dropzone-placeholder p {
  margin: 0;
  font-size: 13px;
  color: #334155;
}

.dropzone-placeholder small {
  font-size: 11px;
}

.dropzone-selected {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.file-badge {
  background: #10b981;
  color: white;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 6px;
  border-radius: 4px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-info strong {
  display: block;
  font-size: 13px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-info small {
  font-size: 11px;
  color: #64748b;
}

.remove-file-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
}

.remove-file-btn:hover {
  color: #ef4444;
}

.upload-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--primary, #f97316);
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #fed7aa;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  width: 100%;
  height: 100%;
  background: var(--primary, #f97316);
  animation: progress-indeterminate 1.2s infinite ease-in-out;
}

@keyframes progress-indeterminate {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0); }
  100% { transform: translateX(100%); }
}

.alert-box {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.alert-box.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.mt-8 { margin-top: 8px; }
.required { color: #dc2626; }
</style>
