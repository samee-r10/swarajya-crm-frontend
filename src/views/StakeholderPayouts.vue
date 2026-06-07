<template>
  <div class="stakeholder-payouts-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Treasury</p>
        <h1>Stakeholder and CP Payouts</h1>
        <p class="muted">Create stakeholder or channel partner payout receipts, route approvals, and pay from company fund.</p>
      </div>
      <button class="button" type="button" @click="openPayoutModal()">New Payout Receipt</button>
    </header>

    <section class="metrics-grid">
      <div class="metric-card"><span>Company Fund</span><strong>{{ money(companyFundAvailable) }}</strong></div>
      <div class="metric-card"><span>Pending Approval</span><strong>{{ pendingApprovalCount }}</strong></div>
      <div class="metric-card"><span>Approved / Payable</span><strong>{{ approvedCount }}</strong></div>
      <div class="metric-card"><span>Paid</span><strong>{{ paidCount }}</strong></div>
    </section>

    <section class="tabs-row">
      <button :class="{ active: activeTab === 'payouts' }" type="button" @click="activeTab = 'payouts'">Payout Receipts</button>
      <button :class="{ active: activeTab === 'approvals' }" type="button" @click="activeTab = 'approvals'">Approvals</button>
    </section>
    <p v-if="loadError" class="flash warning">{{ loadError }}</p>

    <section v-if="activeTab === 'payouts'" class="table-container">
      <table class="record-table">
        <thead>
          <tr>
            <th>Payout #</th>
            <th>Recipient</th>
            <th>Category</th>
            <th>Date</th>
            <th>Type</th>
            <th class="right">Amount</th>
            <th class="right">Paid</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payout in payouts" :key="payout.id" @click="openPayoutModal(payout)">
            <td><strong>{{ payout.payout_number }}</strong></td>
            <td>{{ recipientName(payout) }}</td>
            <td><span class="type-pill">{{ payout.recipient_type || 'Stakeholder' }}</span></td>
            <td>{{ formatDate(payout.payout_date) }}</td>
            <td>{{ payout.payout_type }}</td>
            <td class="right">{{ money(payout.amount) }}</td>
            <td class="right">{{ money(payout.paid_amount) }}</td>
            <td><span class="pill" :class="statusClass(payout.status)">{{ payout.status }}</span></td>
            <td class="right"><button class="button secondary small" type="button" @click.stop="openPayoutModal(payout)">Open</button></td>
          </tr>
          <tr v-if="payouts.length === 0"><td colspan="9" class="empty-state">No payout receipts yet.</td></tr>
        </tbody>
      </table>
    </section>

    <section v-if="activeTab === 'approvals'" class="table-container">
      <table class="record-table">
        <thead>
          <tr>
            <th>Payout #</th>
            <th>Recipient</th>
            <th>Category</th>
            <th>Type</th>
            <th class="right">Amount</th>
            <th>Sequence</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="approval in approvals" :key="approval.id">
            <td><strong>{{ approval.payout.payout_number }}</strong></td>
            <td>{{ recipientName(approval.payout) }}</td>
            <td><span class="type-pill">{{ approval.payout.recipient_type || 'Stakeholder' }}</span></td>
            <td>{{ approval.payout.payout_type }}</td>
            <td class="right">{{ money(approval.payout.amount) }}</td>
            <td>{{ approval.approval_sequence }}</td>
            <td><span class="pill status-warning">{{ approval.payout.status }}</span></td>
            <td>
              <button v-if="approval.can_act" class="button secondary small" type="button" @click="openApproval(approval)">Review</button>
              <span v-else class="muted text-xs">Assigned to {{ approval.stakeholder_name || 'approver' }}</span>
            </td>
          </tr>
          <tr v-if="approvals.length === 0"><td colspan="8" class="empty-state">No payout approvals pending for you.</td></tr>
        </tbody>
      </table>
    </section>

    <div v-if="showPayoutModal" class="modal-overlay" @click.self="closePayoutModal">
      <div class="modal-content payout-modal">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Payout Receipt</p>
            <h2>{{ selectedPayout ? selectedPayout.payout_number : 'New Payout' }}</h2>
          </div>
          <button class="modal-close" type="button" @click="closePayoutModal">&times;</button>
        </div>

        <form class="form-grid modal-form" @submit.prevent="savePayout">
          <label>Recipient Type
            <select v-model="form.recipient_type" required :disabled="isLocked" @change="handleRecipientTypeChange">
              <option>Stakeholder</option>
              <option>Channel Partner</option>
            </select>
          </label>
          <label v-if="form.recipient_type === 'Stakeholder'">Stakeholder
            <select v-model="form.stakeholder_id" required :disabled="isLocked">
              <option value="">Select stakeholder</option>
              <option v-for="stakeholder in stakeholders" :key="stakeholder.id" :value="stakeholder.id">{{ stakeholder.name }}</option>
            </select>
          </label>
          <label v-else>Channel Partner
            <select v-model="form.partner_id" required :disabled="isLocked">
              <option value="">Select channel partner</option>
              <option v-for="partner in partners" :key="partner.id" :value="partner.id">{{ partner.name || partner.partner_name }}</option>
            </select>
          </label>
          <label>Payout Date<input v-model="form.payout_date" type="date" required :readonly="isLocked"></label>
          <label>Payout Type
            <select v-model="form.payout_type" required :disabled="isLocked">
              <option v-for="type in payoutTypes" :key="type">{{ type }}</option>
            </select>
          </label>
          <label>Amount<input v-model.number="form.amount" type="number" min="0" step="0.01" required :readonly="isLocked"></label>
          <label>Payment Mode
            <select v-model="form.payment_mode" :disabled="isLocked">
              <option value="">Select mode</option>
              <option v-for="mode in paymentModes" :key="mode" :value="mode">{{ mode }}</option>
            </select>
          </label>
          <label>Company Bank Account
            <select v-model="form.bank_account_id" :disabled="isLocked">
              <option value="">Select account</option>
              <option v-for="account in bankAccounts" :key="account.id" :value="account.id">{{ account.label }}</option>
            </select>
          </label>
          <label>Reference<input v-model="form.reference" :readonly="isLocked"></label>
          <label class="span-2">{{ form.recipient_type === 'Channel Partner' ? 'Channel Partner Account / Payment Details' : 'Stakeholder Account' }}<textarea v-model="form.stakeholder_account" rows="2" :readonly="isLocked"></textarea></label>
          <label class="span-2">Remarks<textarea v-model="form.remarks" rows="2" :readonly="isLocked"></textarea></label>
          <label class="span-2">Attachment<input v-if="!isLocked" type="file" @change="handleAttachment"><a v-if="form.attachment?.data_url" :href="form.attachment.data_url" :download="form.attachment.name">View Attachment</a></label>

          <section v-if="selectedPayout && ['Approved','Pending Payment','Partially Paid'].includes(selectedPayout.status)" class="span-2 payment-box">
            <h3>Payable Created</h3>
            <p class="muted">Settle this payout from Treasury Payables. Payment will update this payout receipt automatically.</p>
            <router-link class="button" to="/treasury/payables">Go to Payables</router-link>
          </section>

          <p v-if="error" class="span-2 flash warning">{{ error }}</p>
          <div class="span-2 action-row">
            <button class="button secondary" type="button" @click="closePayoutModal">Close</button>
            <button v-if="isDraft" class="button secondary" type="button" @click="saveWithStatus('Draft')">Save Draft</button>
            <button v-if="isDraft" class="button" type="button" @click="saveWithStatus('Submitted')">Submit for Approval</button>
            <button v-if="selectedPayout && selectedPayout.status === 'Draft'" class="button secondary" type="button" @click="payoutAction('cancel')">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="selectedApproval" class="modal-overlay" @click.self="selectedApproval = null">
      <div class="modal-content approval-modal">
        <div class="modal-header">
          <h2>{{ selectedApproval.payout.payout_number }}</h2>
          <button class="modal-close" type="button" @click="selectedApproval = null">&times;</button>
        </div>
        <section class="detail-grid">
          <div><span>Recipient</span><strong>{{ recipientName(selectedApproval.payout) }}</strong></div>
          <div><span>Category</span><strong>{{ selectedApproval.payout.recipient_type || 'Stakeholder' }}</strong></div>
          <div><span>Type</span><strong>{{ selectedApproval.payout.payout_type }}</strong></div>
          <div><span>Amount</span><strong>{{ money(selectedApproval.payout.amount) }}</strong></div>
          <div><span>Date</span><strong>{{ formatDate(selectedApproval.payout.payout_date) }}</strong></div>
        </section>
        <p v-if="!selectedApproval.can_act" class="flash warning">This approval is assigned to {{ selectedApproval.stakeholder_name || 'another approver' }}.</p>
        <label v-else>Approval Remarks<textarea v-model="approvalRemarks" rows="3"></textarea></label>
        <div class="action-row">
          <button class="button secondary" type="button" @click="selectedApproval = null">Close</button>
          <button v-if="selectedApproval.can_act" class="button secondary danger-text" type="button" @click="decideApproval('reject')">Reject</button>
          <button v-if="selectedApproval.can_act" class="button" type="button" @click="decideApproval('approve')">Approve</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api/client'

const route = useRoute()
const payouts = ref([])
const approvals = ref([])
const stakeholders = ref([])
const partners = ref([])
const paymentModes = ref([])
const bankAccounts = ref([])
const LOCAL_TREASURY_BANKS_KEY = 'crm_treasury_bank_accounts'
const companyFundAvailable = ref(0)
const activeTab = ref(route.path.includes('/approvals') ? 'approvals' : 'payouts')
const showPayoutModal = ref(false)
const selectedPayout = ref(null)
const selectedApproval = ref(null)
const approvalRemarks = ref('')
const error = ref('')
const loadError = ref('')
const form = reactive(defaultForm())

const pendingApprovalCount = computed(() => payouts.value.filter(p => String(p.status || '').startsWith('Pending Approval')).length)
const approvedCount = computed(() => payouts.value.filter(p => ['Approved', 'Pending Payment', 'Partially Paid'].includes(p.status)).length)
const paidCount = computed(() => payouts.value.filter(p => p.status === 'Paid').length)
const isDraft = computed(() => !selectedPayout.value || selectedPayout.value.status === 'Draft')
const isLocked = computed(() => selectedPayout.value && selectedPayout.value.status !== 'Draft')
const payoutTypes = computed(() => {
  if (form.recipient_type === 'Channel Partner') return ['Channel Partner Payout', 'Channel Partner Commission', 'Custom']
  return ['Profit Distribution', 'Dividend', 'Capital Return', 'Custom']
})

onMounted(loadAll)

watch(
  () => route.path,
  (path) => {
    activeTab.value = path.includes('/approvals') ? 'approvals' : 'payouts'
    loadAll()
  },
)

function defaultForm() {
  return { recipient_type: 'Stakeholder', stakeholder_id: '', partner_id: '', payout_date: new Date().toISOString().slice(0, 10), payout_type: 'Profit Distribution', amount: 0, payment_mode: '', bank_account_id: '', reference: '', stakeholder_account: '', remarks: '', attachment: null, status: 'Draft' }
}

async function loadAll() {
  loadError.value = ''
  try {
    const [payoutData, approvalData, stakeholderData, partnerData, options] = await Promise.all([
      apiGet('/api/treasury/stakeholder-payouts'),
      apiGet('/api/treasury/stakeholder-payout-approvals/pending'),
      apiGet('/api/treasury/stakeholders'),
      apiGet('/api/treasury/channel-partners'),
      apiGet('/api/options'),
    ])
    payouts.value = payoutData.payouts || []
    companyFundAvailable.value = payoutData.company_fund_available || 0
    const currentUser = JSON.parse(window.localStorage.getItem('lms_user') || '{}')
    approvals.value = (approvalData.approvals || []).map(approval => ({
      ...approval,
      can_act: approval.can_act ?? approval.linked_user_id === currentUser.id,
    }))
    if (approvals.value.length === 0) {
      approvals.value = await pendingApprovalsFromPayoutDetails(payouts.value)
    }
    stakeholders.value = (stakeholderData.stakeholders || []).filter(s => s.is_active)
    partners.value = (partnerData.partners || []).filter(p => p.is_active !== false)
    paymentModes.value = options.payment_modes || []
    bankAccounts.value = await loadTreasuryBankAccounts()
  } catch (err) {
    loadError.value = err.message || 'Unable to load payout approvals.'
  }
}

async function loadTreasuryBankAccounts() {
  let treasuryAccounts = []
  try {
    const data = await apiGet('/api/treasury/bank-accounts')
    treasuryAccounts = data.bank_accounts || data.accounts || []
  } catch {
    treasuryAccounts = []
  }
  return mergeBankAccounts(treasuryAccounts, loadLocalBankAccounts())
}

function loadLocalBankAccounts() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_TREASURY_BANKS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function mergeBankAccounts(primary, fallback) {
  const merged = []
  const seen = new Set()
  ;[...primary, ...fallback].forEach(bank => {
    const accountName = bank.account_name || bank.beneficiary_name || bank.label || ''
    const normalized = {
      ...bank,
      account_name: accountName,
      label: bank.label || [accountName, bank.bank_name, bank.account_number ? `••${String(bank.account_number).slice(-4)}` : ''].filter(Boolean).join(' · '),
      status: bank.status || 'Active',
    }
    const key = String(normalized.account_number || normalized.id || '')
    if (!key || seen.has(key)) return
    seen.add(key)
    merged.push(normalized)
  })
  return merged.filter(bank => (bank.status || 'Active') === 'Active')
}

async function pendingApprovalsFromPayoutDetails(payoutRows) {
  const pendingRows = payoutRows.filter(payout => String(payout.status || '').startsWith('Pending'))
  if (pendingRows.length === 0) return []
  const currentUser = JSON.parse(window.localStorage.getItem('lms_user') || '{}')
  const details = await Promise.all(pendingRows.map(payout => apiGet(`/api/treasury/stakeholder-payouts/${payout.id}`)))
  return details.flatMap((detail) => {
    const payout = detail.payout
    return (detail.approvals || [])
      .filter(approval => approval.status === 'Pending')
      .map(approval => ({ ...approval, can_act: approval.linked_user_id === currentUser.id, payout }))
  })
}

function openPayoutModal(payout = null) {
  selectedPayout.value = payout
  Object.assign(form, defaultForm(), normalizePayoutForm(payout))
  error.value = ''
  showPayoutModal.value = true
}

function normalizePayoutForm(payout) {
  if (!payout) return {}
  const recipientType = payout.recipient_type || (payout.partner_id ? 'Channel Partner' : 'Stakeholder')
  return {
    ...payout,
    recipient_type: recipientType,
    stakeholder_id: recipientType === 'Stakeholder' ? payout.stakeholder_id : '',
    partner_id: recipientType === 'Channel Partner' ? payout.partner_id : '',
  }
}

function handleRecipientTypeChange() {
  form.stakeholder_id = ''
  form.partner_id = ''
  form.stakeholder_account = ''
  form.payout_type = form.recipient_type === 'Channel Partner' ? 'Channel Partner Payout' : 'Profit Distribution'
}

function closePayoutModal() {
  showPayoutModal.value = false
}

async function handleAttachment(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const dataUrl = await new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
  form.attachment = { name: file.name, type: file.type, size: file.size, data_url: dataUrl }
}

async function saveWithStatus(status) {
  form.status = status
  await savePayout()
}

async function savePayout() {
  error.value = ''
  try {
    const payload = { ...form }
    if (payload.recipient_type === 'Channel Partner') payload.stakeholder_id = ''
    else payload.partner_id = ''
    if (selectedPayout.value) await apiPut(`/api/treasury/stakeholder-payouts/${selectedPayout.value.id}`, payload)
    else await apiPost('/api/treasury/stakeholder-payouts', payload)
    showPayoutModal.value = false
    await loadAll()
  } catch (err) {
    error.value = err.message
  }
}

async function payoutAction(action) {
  await apiPost(`/api/treasury/stakeholder-payouts/${selectedPayout.value.id}/action`, { action })
  showPayoutModal.value = false
  await loadAll()
}

function openApproval(approval) {
  selectedApproval.value = approval
  approvalRemarks.value = ''
}

async function decideApproval(action) {
  if (action === 'reject' && !confirm('Reject this payout?')) return
  await apiPost(`/api/treasury/stakeholder-payout-approvals/${selectedApproval.value.id}/action`, { action, remarks: approvalRemarks.value })
  selectedApproval.value = null
  await loadAll()
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

function money(value) {
  return `INR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function recipientName(payout) {
  return payout?.recipient_name || payout?.partner_name || payout?.stakeholder_name || '-'
}

function statusClass(status) {
  if (['Approved', 'Paid'].includes(status)) return 'status-success'
  if (['Rejected', 'Cancelled'].includes(status)) return 'status-danger'
  if (String(status || '').startsWith('Pending') || status === 'Partially Paid') return 'status-warning'
  return 'status-muted'
}
</script>

<style scoped>
.stakeholder-payouts-page { max-width: 1400px; margin: 0 auto; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px; }
.metric-card { border: 1px solid var(--line); background: var(--surface); border-radius: 8px; padding: 18px; }
.metric-card span { display: block; color: var(--muted); font-size: 12px; text-transform: uppercase; font-weight: 800; }
.metric-card strong { font-size: 24px; }
.tabs-row { display: flex; gap: 8px; margin-bottom: 16px; }
.tabs-row button { border: 1px solid var(--line); background: var(--surface); border-radius: 8px; padding: 10px 14px; font-weight: 800; }
.tabs-row button.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.payout-modal, .approval-modal { max-width: 980px; width: min(980px, calc(100vw - 32px)); max-height: 90vh; overflow: auto; }
.payment-box { border: 1px solid var(--line); border-radius: 8px; padding: 16px; background: #f8fafc; }
.detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
.detail-grid div { border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
.detail-grid span { display: block; color: var(--muted); font-size: 12px; font-weight: 800; text-transform: uppercase; }
.danger-text { color: #b91c1c; }
</style>
