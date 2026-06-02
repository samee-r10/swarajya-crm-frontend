<template>
  <div class="claim-approvals-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Approvals</p>
        <h1>Pending Claim Approvals</h1>
        <p class="muted">Review employee claims assigned to your approval sequence.</p>
      </div>
      <button class="button secondary" type="button" @click="loadApprovals">Refresh</button>
    </header>

    <section v-if="loading" class="record-card empty-state">Loading approvals...</section>
    <section v-else class="table-container">
      <table class="record-table">
        <thead>
          <tr>
            <th>Claim Number</th>
            <th>Employee Name</th>
            <th>Claim Date</th>
            <th>Expense Category</th>
            <th class="right">Claim Amount</th>
            <th>Sequence</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="approval in approvals" :key="approval.id">
            <td><strong>{{ approval.claim.claim_number }}</strong></td>
            <td>{{ approval.claim.employee_name || '-' }}</td>
            <td>{{ formatDate(approval.claim.claim_date) }}</td>
            <td>{{ approval.claim.expense_category }}</td>
            <td class="right">{{ money(approval.claim.total_claim_amount) }}</td>
            <td>{{ approval.approval_sequence }}</td>
            <td><span class="pill status-warning">{{ approval.claim.status }}</span></td>
            <td><button class="button secondary small" type="button" @click="openApproval(approval)">View</button></td>
          </tr>
          <tr v-if="approvals.length === 0"><td colspan="8" class="empty-state">No pending claim approvals.</td></tr>
        </tbody>
      </table>
    </section>

    <div v-if="selectedApproval" class="modal-overlay" @click.self="selectedApproval = null">
      <div class="modal-content approval-modal">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Claim Approval</p>
            <h2>{{ selectedApproval.claim.claim_number }}</h2>
          </div>
          <button class="modal-close" type="button" @click="selectedApproval = null">&times;</button>
        </div>

        <section class="detail-grid">
          <div><span>Employee</span><strong>{{ selectedApproval.claim.employee_name || '-' }}</strong></div>
          <div><span>Department</span><strong>{{ selectedApproval.claim.department || '-' }}</strong></div>
          <div><span>Claim Date</span><strong>{{ formatDate(selectedApproval.claim.claim_date) }}</strong></div>
          <div><span>Expense Date</span><strong>{{ formatDate(selectedApproval.claim.expense_date) }}</strong></div>
          <div><span>Category</span><strong>{{ selectedApproval.claim.expense_category }}</strong></div>
          <div><span>Amount</span><strong>{{ money(selectedApproval.claim.total_claim_amount) }}</strong></div>
        </section>

        <section class="approval-body">
          <label>Description<textarea :value="selectedApproval.claim.expense_description" rows="3" readonly></textarea></label>
          <label>Approval Remarks<textarea v-model="remarks" rows="3" placeholder="Add approval or rejection remarks"></textarea></label>
        </section>
        <DocumentPreview
          v-if="selectedApproval.claim.attachment"
          :document="selectedApproval.claim.attachment"
          label="Supporting Document"
          access-note="Visible to assigned approvers for review and finance users with claim access."
        />
        <p v-if="error" class="flash warning">{{ error }}</p>
        <div class="action-row">
          <button class="button secondary" type="button" @click="selectedApproval = null">Close</button>
          <button class="button secondary danger-text" type="button" @click="decide('reject')">Reject</button>
          <button class="button" type="button" @click="decide('approve')">Approve</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { apiGet, apiPost } from '../api/client'
import DocumentPreview from '../components/DocumentPreview.vue'

const approvals = ref([])
const selectedApproval = ref(null)
const loading = ref(false)
const remarks = ref('')
const error = ref('')

onMounted(loadApprovals)

async function loadApprovals() {
  loading.value = true
  try {
    const data = await apiGet('/api/claim-approvals/pending')
    approvals.value = data.approvals || []
  } finally {
    loading.value = false
  }
}

function openApproval(approval) {
  selectedApproval.value = approval
  remarks.value = ''
  error.value = ''
}

async function decide(action) {
  if (action === 'reject' && !confirm('Reject this claim?')) return
  error.value = ''
  try {
    await apiPost(`/api/claim-approvals/${selectedApproval.value.id}/action`, { action, remarks: remarks.value })
    selectedApproval.value = null
    await loadApprovals()
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
</script>

<style scoped>
.claim-approvals-page { max-width: 1400px; margin: 0 auto; }
.approval-modal { max-width: 900px; width: min(900px, calc(100vw - 32px)); max-height: 90vh; overflow: auto; }
.detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 18px; }
.detail-grid div { border: 1px solid var(--line); border-radius: 8px; padding: 12px; background: var(--surface); }
.detail-grid span { display: block; color: var(--muted); font-size: 12px; font-weight: 800; text-transform: uppercase; }
.approval-body { display: grid; gap: 14px; margin-bottom: 16px; padding: 0 24px; }
.approval-modal :deep(.document-preview) { margin: 0 24px 18px; }
.approval-modal .action-row { padding: 0 24px 24px; }
.danger-text { color: #b91c1c; }
</style>
