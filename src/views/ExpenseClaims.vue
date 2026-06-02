<template>
  <div class="claims-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Finance</p>
        <h1>Expense Claims</h1>
        <p class="muted">Submit, review, post, and settle employee expense claims.</p>
      </div>
      <button class="button" type="button" @click="openNewClaim">New Claim</button>
    </header>

    <section class="metrics-grid">
      <div class="metric-card"><span>Pending</span><strong>{{ stats.pending }}</strong></div>
      <div class="metric-card"><span>Posted</span><strong>{{ stats.posted }}</strong></div>
      <div class="metric-card"><span>Settled</span><strong>{{ stats.settled }}</strong></div>
    </section>

    <section class="filters-bar">
      <input v-model="search" placeholder="Search claim, employee, category...">
      <select v-model="statusFilter">
        <option value="">All Statuses</option>
        <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
      </select>
    </section>

    <section v-if="loading" class="record-card empty-state">Loading claims...</section>
    <section v-else class="table-container">
      <table class="record-table">
        <thead>
          <tr>
            <th>Claim #</th>
            <th>Employee</th>
            <th>Expense Date</th>
            <th>Category</th>
            <th class="right">Total</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="claim in filteredClaims" :key="claim.id" @click="selectClaim(claim)">
            <td><strong>{{ claim.claim_number }}</strong></td>
            <td>{{ claim.employee_name || '-' }}<span class="muted block">{{ claim.department || '' }}</span></td>
            <td>{{ formatDate(claim.expense_date) }}</td>
            <td>{{ claim.expense_category }}</td>
            <td class="right">{{ money(claim.total_claim_amount) }}</td>
            <td><span class="pill" :class="statusClass(claim.status)">{{ claim.status }}</span></td>
            <td class="right"><button class="button secondary small" type="button" @click.stop="selectClaim(claim)">Open</button></td>
          </tr>
          <tr v-if="filteredClaims.length === 0"><td colspan="7" class="empty-state">No claims found.</td></tr>
        </tbody>
      </table>
    </section>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content claim-modal">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Expense Claim</p>
            <h2>{{ selectedClaim ? selectedClaim.claim_number : 'New Claim' }}</h2>
          </div>
          <button class="modal-close" type="button" @click="closeModal">&times;</button>
        </div>

        <form class="form-grid modal-form" @submit.prevent="saveClaim">
          <div class="span-2 card-section-title"><h2>Basic Details</h2></div>
          <label>Employee Name<input v-model="form.employee_name" required :readonly="isLocked"></label>
          <label>Department<input v-model="form.department" :readonly="isLocked"></label>
          <label>Claim Date<input v-model="form.claim_date" type="date" required :readonly="isLocked"></label>
          <label>Expense Date<input v-model="form.expense_date" type="date" required :readonly="isLocked"></label>
          <label>Expense Category<input v-model="form.expense_category" required :readonly="isLocked"></label>
          <label>Payment Mode
            <select v-model="form.payment_mode" :disabled="isLocked">
              <option value="">Select Payment Mode</option>
              <option v-for="mode in paymentModes" :key="mode" :value="mode">{{ mode }}</option>
            </select>
          </label>

          <div class="span-2 card-section-title"><h2>Amount & Support</h2></div>
          <label>Amount<input v-model.number="form.amount" type="number" min="0" step="0.01" required :readonly="isLocked"></label>
          <label>GST / Tax Percentage<input v-model.number="form.gst_percent" type="number" min="0" step="0.01" :readonly="isLocked"></label>
          <label>Total Claim Amount<input :value="totalClaimAmount.toFixed(2)" readonly></label>
          <label class="span-2">Expense Description<textarea v-model="form.expense_description" rows="3" :readonly="isLocked"></textarea></label>
          <label class="span-2">Remarks<textarea v-model="form.remarks" rows="2" :readonly="isLocked"></textarea></label>
          <label class="span-2">Supporting Document
            <input v-if="!isLocked" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" :disabled="uploadingAttachment" @change="handleAttachment">
            <span v-if="uploadingAttachment" class="field-hint">Uploading document...</span>
          </label>
          <div v-if="form.attachment" class="span-2">
            <DocumentPreview
              :document="form.attachment"
              label="Supporting Document"
              access-note="Visible to finance users who can open claims and assigned claim approvers."
            />
          </div>

          <p v-if="error" class="span-2 flash warning">{{ error }}</p>
          <div class="span-2 action-row">
            <button type="button" class="button secondary" @click="closeModal">Close</button>
            <button v-if="isDraft" type="button" class="button secondary" @click="saveWithStatus('Draft')">Save Draft</button>
            <button v-if="isDraft" type="button" class="button" @click="saveWithStatus('Submitted')">Submit Claim</button>
            <button v-if="selectedClaim && selectedClaim.status === 'Approved'" type="button" class="button" @click="claimAction('post')">Post to Ledger</button>
            <button v-if="selectedClaim && selectedClaim.status === 'Posted'" type="button" class="button" @click="claimAction('settle')">Settle</button>
            <button v-if="isDraft" type="button" class="button secondary" @click="claimAction('cancel')">Cancel Claim</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiGet, apiPost, apiPut, apiUploadFile } from '../api/client'
import DocumentPreview from '../components/DocumentPreview.vue'

const claims = ref([])
const loading = ref(false)
const showModal = ref(false)
const selectedClaim = ref(null)
const error = ref('')
const uploadingAttachment = ref(false)
const search = ref('')
const statusFilter = ref('')
const paymentModes = ref([])
const statuses = ['Draft', 'Submitted', 'Pending Stakeholder Approval', 'Pending Approval Sequence 1', 'Pending Approval Sequence 2', 'Pending Approval Sequence 3', 'Under Review', 'Approved', 'Rejected', 'Posted', 'Settled', 'Cancelled']
const form = reactive(defaultForm())

const gstAmount = computed(() => {
  const amount = Number(form.amount) || 0
  const percent = Number(form.gst_percent) || 0
  return Number((amount * (percent / 100)).toFixed(2))
})
const totalClaimAmount = computed(() => (Number(form.amount) || 0) + gstAmount.value)
const isDraft = computed(() => !selectedClaim.value || selectedClaim.value.status === 'Draft')
const isLocked = computed(() => selectedClaim.value && selectedClaim.value.status !== 'Draft')
const stats = computed(() => ({
  pending: claims.value.filter(c => ['Submitted', 'Under Review', 'Approved'].includes(c.status) || String(c.status || '').startsWith('Pending')).length,
  posted: claims.value.filter(c => c.status === 'Posted').length,
  settled: claims.value.filter(c => c.status === 'Settled').length,
}))
const filteredClaims = computed(() => {
  const term = search.value.toLowerCase()
  return claims.value.filter(claim => {
    const matchesStatus = !statusFilter.value || claim.status === statusFilter.value
    const matchesSearch = !term || [claim.claim_number, claim.employee_name, claim.department, claim.expense_category].some(v => (v || '').toLowerCase().includes(term))
    return matchesStatus && matchesSearch
  })
})

onMounted(async () => {
  await Promise.all([loadClaims(), loadOptions()])
})

function defaultForm() {
  const today = new Date().toISOString().slice(0, 10)
  return { employee_name: '', department: '', claim_date: today, expense_date: today, expense_category: '', expense_description: '', amount: 0, gst_percent: 0, gst_amount: 0, total_claim_amount: 0, payment_mode: '', attachment: null, remarks: '', status: 'Draft' }
}

async function loadOptions() {
  const options = await apiGet('/api/options')
  paymentModes.value = options.payment_modes || []
}

async function loadClaims() {
  loading.value = true
  try {
    const data = await apiGet('/api/finance/expense-claims')
    claims.value = data.claims || []
  } finally {
    loading.value = false
  }
}

function openNewClaim() {
  selectedClaim.value = null
  Object.assign(form, defaultForm())
  error.value = ''
  showModal.value = true
}

function selectClaim(claim) {
  selectedClaim.value = claim
  Object.assign(form, defaultForm(), claim)
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleAttachment(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploadingAttachment.value = true
  error.value = ''
  try {
    const data = await apiUploadFile('/api/uploads/cloudinary', file, { folder: 'expense-claims' })
    form.attachment = data.document
  } catch (err) {
    error.value = err.message || 'Unable to upload supporting document.'
  } finally {
    uploadingAttachment.value = false
    event.target.value = ''
  }
}

async function saveWithStatus(status) {
  form.status = status
  await saveClaim()
}

async function saveClaim() {
  error.value = ''
  try {
    const payload = { ...form, gst_amount: gstAmount.value, total_claim_amount: totalClaimAmount.value }
    if (selectedClaim.value) {
      await apiPut(`/api/finance/expense-claims/${selectedClaim.value.id}`, payload)
    } else {
      await apiPost('/api/finance/expense-claims', payload)
    }
    showModal.value = false
    await loadClaims()
  } catch (err) {
    error.value = err.message
  }
}

async function claimAction(action) {
  if (['post', 'settle', 'reject', 'cancel'].includes(action) && !confirm(`Confirm ${action} action for this claim?`)) return
  error.value = ''
  try {
    await apiPost(`/api/finance/expense-claims/${selectedClaim.value.id}/action`, {
      action,
    })
    showModal.value = false
    await loadClaims()
  } catch (err) {
    error.value = err.message
  }
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

function money(value) {
  return `INR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusClass(status) {
  if (['Approved', 'Posted', 'Settled'].includes(status)) return 'status-success'
  if (['Rejected', 'Cancelled'].includes(status)) return 'status-danger'
  if (['Submitted', 'Under Review'].includes(status) || String(status || '').startsWith('Pending')) return 'status-warning'
  return 'status-muted'
}
</script>

<style scoped>
.claims-page { max-width: 1400px; margin: 0 auto; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px; }
.metric-card { border: 1px solid var(--line); background: var(--surface); border-radius: 8px; padding: 18px; }
.metric-card span { display: block; color: var(--muted); font-size: 12px; text-transform: uppercase; font-weight: 800; }
.metric-card strong { font-size: 28px; }
.filters-bar { display: flex; gap: 12px; margin-bottom: 18px; }
.filters-bar input { flex: 1; }
.block { display: block; }
.claim-modal { max-width: 980px; width: min(980px, calc(100vw - 32px)); max-height: 90vh; overflow: auto; }
.danger-text { color: #b91c1c; }
</style>
