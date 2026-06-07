<template>
  <div class="loans-page">
    <CrmPageHeader
      eyebrow="Treasury"
      title="Loan Management"
      description="Manage loan accounts, disbursements, repayment schedules, and repayment matching."
    >
      <template #actions>
      <button class="button" type="button" @click="openLoanModal()">New Loan Account</button>
      </template>
    </CrmPageHeader>

    <section class="metrics-grid">
      <CrmKpiCard label="Active Loans" :value="stats.active_loans || 0" meta="Currently active accounts" tone="green">
        <template #icon><svg viewBox="0 0 24 24"><path d="M12 2 3 6v2h18V6l-9-4ZM5 10v7H3v3h18v-3h-2v-7h-3v7h-2v-7h-4v7H8v-7H5Z" fill="currentColor"/></svg></template>
      </CrmKpiCard>
      <CrmKpiCard label="Total Loan Amount" :value="money(stats.total_loan_amount)" meta="Approved principal" tone="blue">
        <template #icon><svg viewBox="0 0 24 24"><path d="M4 4h16v5H4V4Zm0 7h16v9H4v-9Zm3 2v2h5v-2H7Zm0 4v1h10v-1H7Zm9-4v2h2v-2h-2Z" fill="currentColor"/></svg></template>
      </CrmKpiCard>
      <CrmKpiCard label="Total Disbursed" :value="money(stats.total_disbursed_amount)" meta="Posted disbursements" tone="violet">
        <template #icon><svg viewBox="0 0 24 24"><path d="M3 6h18v12H3V6Zm2 2v8h14V8H5Zm7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="currentColor"/></svg></template>
      </CrmKpiCard>
      <CrmKpiCard label="Outstanding" :value="money(stats.outstanding_loan_balance)" meta="Principal balance" tone="amber">
        <template #icon><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Zm1 1v9l6.4 6.4 1.4-1.4-5-5H22A9 9 0 0 0 13 3Z" fill="currentColor"/></svg></template>
      </CrmKpiCard>
    </section>

    <section class="filters-bar">
      <input v-model="search" placeholder="Search loan account, provider, purpose...">
      <select v-model="statusFilter">
        <option value="">All Statuses</option>
        <option v-for="status in loanStatuses" :key="status" :value="status">{{ status }}</option>
      </select>
    </section>

    <section v-if="loading" class="record-card empty-state">Loading loans...</section>
    <section v-else class="loan-grid">
      <article v-for="loan in filteredLoans" :key="loan.id" class="loan-card" @click="openLoanDetail(loan)">
        <div class="loan-card-head">
          <div>
            <p class="eyebrow">{{ loan.provider_type }}</p>
            <h2>{{ loan.loan_account_number }}</h2>
            <span class="muted">{{ loan.provider_name || 'No provider name' }}</span>
          </div>
          <span class="pill" :class="loan.status === 'Active' ? 'status-success' : 'status-muted'">{{ loan.status }}</span>
        </div>
        <div class="loan-values">
          <div><span>Total</span><strong>{{ money(loan.total_loan_amount) }}</strong></div>
          <div><span>Disbursed</span><strong>{{ money(loan.total_disbursed_amount) }}</strong></div>
          <div><span>Outstanding</span><strong>{{ money(loan.outstanding_balance) }}</strong></div>
        </div>
      </article>
      <CrmEmptyState v-if="filteredLoans.length === 0" title="No loan accounts found" description="Adjust your filters or create a new loan account." />
    </section>

    <div v-if="showLoanModal" class="modal-overlay" @click.self="showLoanModal = false">
      <div class="modal-content loan-modal">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Loan Account</p>
            <h2>{{ selectedLoan ? selectedLoan.loan_account_number : 'New Loan Account' }}</h2>
          </div>
          <button class="modal-close" type="button" @click="showLoanModal = false">&times;</button>
        </div>
        <form class="form-grid modal-form" @submit.prevent="saveLoan">
          <label>Loan Account #<input v-model="loanForm.loan_account_number" placeholder="Auto if blank"></label>
          <label>Provider Type<select v-model="loanForm.provider_type"><option v-for="v in providerTypes" :key="v">{{ v }}</option></select></label>
          <label>Provider Name<input v-model="loanForm.provider_name" required></label>
          <label>Total Loan Amount<input v-model.number="loanForm.total_loan_amount" type="number" min="0" step="0.01" required></label>
          <label>Interest Rate %<input v-model.number="loanForm.interest_rate" type="number" min="0" step="0.01"></label>
          <label>Interest Type<select v-model="loanForm.interest_type"><option>Fixed</option><option>Floating</option></select></label>
          <label>Tenure<input v-model.number="loanForm.tenure" type="number" min="0"></label>
          <label>Tenure Unit<select v-model="loanForm.tenure_unit"><option>Months</option><option>Years</option></select></label>
          <label>Start Date<input v-model="loanForm.start_date" type="date"></label>
          <label>End Date<input v-model="loanForm.end_date" type="date"></label>
          <label>Repayment Frequency<select v-model="loanForm.repayment_frequency"><option v-for="v in frequencies" :key="v">{{ v }}</option></select></label>
          <label>Company Bank Account<select v-model="loanForm.bank_account_id"><option value="">Select bank</option><option v-for="b in bankAccounts" :key="b.id" :value="b.id">{{ b.label }}</option></select></label>
          <label>Status<select v-model="loanForm.status"><option v-for="s in loanStatuses" :key="s">{{ s }}</option></select></label>
          <label class="span-2">Purpose<textarea v-model="loanForm.purpose" rows="2"></textarea></label>
          <label class="span-2">Remarks<textarea v-model="loanForm.remarks" rows="2"></textarea></label>
          <label class="span-2">Loan Agreement<input type="file" @change="handleAgreement"><a v-if="loanForm.agreement_attachment?.data_url" :href="loanForm.agreement_attachment.data_url" :download="loanForm.agreement_attachment.name">View Agreement</a></label>
          <p v-if="error" class="span-2 flash warning">{{ error }}</p>
          <div class="span-2 action-row"><button class="button secondary" type="button" @click="showLoanModal = false">Cancel</button><button class="button" type="submit">Save Loan</button></div>
        </form>
      </div>
    </div>

    <div v-if="selectedLoan && showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-content loan-detail-modal">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Loan Statement</p>
            <h2>{{ selectedLoan.loan_account_number }}</h2>
            <p class="muted">{{ selectedLoan.provider_name }} · Outstanding {{ money(selectedLoan.outstanding_balance) }}</p>
          </div>
          <button class="modal-close" type="button" @click="showDetailModal = false">&times;</button>
        </div>

        <section class="detail-actions">
          <button class="button secondary" type="button" @click="openLoanModal(selectedLoan)">Edit Loan</button>
          <button class="button" type="button" @click="toggleDisbursementForm">{{ showDisbursement ? 'Close Disbursement' : 'Add Disbursement' }}</button>
          <button class="button" type="button" @click="toggleScheduleForm">{{ showSchedule ? 'Close Schedule' : 'Add Schedule' }}</button>
        </section>

        <form v-if="showDisbursement" class="form-grid record-card loan-inline-form" @submit.prevent="addDisbursement">
          <div class="span-2 card-section-title">
            <div>
              <h2>Post Loan Disbursement</h2>
              <p class="muted">Record funds received for this loan and link the generated transaction.</p>
            </div>
          </div>
          <label>Date<input v-model="disbursementForm.disbursement_date" type="date" required></label>
          <label>Amount<input v-model.number="disbursementForm.amount" type="number" min="0" step="0.01" required></label>
          <label>Receiving Bank<select v-model="disbursementForm.bank_account_id"><option value="">Use loan bank account</option><option v-for="b in bankAccounts" :key="b.id" :value="b.id">{{ b.label }}</option></select></label>
          <label>Reference<input v-model="disbursementForm.reference"></label>
          <label class="span-2">Remarks<textarea v-model="disbursementForm.remarks" rows="2"></textarea></label>
          <p v-if="detailError" class="span-2 flash warning">{{ detailError }}</p>
          <div class="span-2 action-row">
            <button class="button secondary" type="button" @click="showDisbursement = false">Cancel</button>
            <button class="button" type="submit">Post Disbursement</button>
          </div>
        </form>

        <form v-if="showSchedule" class="form-grid record-card loan-inline-form" @submit.prevent="addSchedule">
          <div class="span-2 card-section-title">
            <div>
              <h2>Repayment Schedule</h2>
              <p class="muted">Add the next repayment installment for tracking and matching.</p>
            </div>
          </div>
          <label>Installment #<input v-model.number="scheduleForm.installment_number" type="number"></label>
          <label>Due Date<input v-model="scheduleForm.due_date" type="date" required></label>
          <label>Principal<input v-model.number="scheduleForm.principal_amount" type="number" min="0" step="0.01" required></label>
          <label>Interest<input v-model.number="scheduleForm.interest_amount" type="number" min="0" step="0.01"></label>
          <p v-if="detailError" class="span-2 flash warning">{{ detailError }}</p>
          <div class="span-2 action-row">
            <button class="button secondary" type="button" @click="showSchedule = false">Cancel</button>
            <button class="button" type="submit">Add Schedule Line</button>
          </div>
        </form>

        <section class="loan-detail-summary">
          <div>
            <span>Approved Amount</span>
            <strong>{{ money(selectedLoan.total_loan_amount) }}</strong>
          </div>
          <div>
            <span>Disbursed</span>
            <strong>{{ money(selectedLoan.total_disbursed_amount) }}</strong>
          </div>
          <div>
            <span>Outstanding</span>
            <strong>{{ money(selectedLoan.outstanding_balance) }}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{{ selectedLoan.status }}</strong>
          </div>
        </section>

        <section class="split-grid">
          <div class="loan-table-panel">
            <div class="loan-section-heading">
              <div>
                <h3>Disbursements</h3>
                <p class="muted">Posted loan receipts and linked transaction IDs.</p>
              </div>
              <span class="pill status-muted">{{ disbursements.length }} records</span>
            </div>
            <table v-if="disbursements.length" class="record-table compact loan-table">
              <thead><tr><th>Date</th><th>Amount</th><th>Txn</th></tr></thead>
              <tbody><tr v-for="d in disbursements" :key="d.id"><td>{{ d.disbursement_date }}</td><td>{{ money(d.amount) }}</td><td>#{{ d.transaction_id }}</td></tr></tbody>
            </table>
            <CrmEmptyState v-else title="No disbursements yet" description="Post a disbursement to start tracking this loan balance." />
          </div>
          <div class="loan-table-panel">
            <div class="loan-section-heading">
              <div>
                <h3>Repayment Schedule</h3>
                <p class="muted">Installments, due dates, and repayment transaction matching.</p>
              </div>
              <span class="pill status-muted">{{ schedules.length }} lines</span>
            </div>
            <table v-if="schedules.length" class="record-table compact loan-table repayment-table">
              <thead><tr><th>#</th><th>Due</th><th>Total</th><th>Status</th><th>Link Txn</th></tr></thead>
              <tbody>
                <tr v-for="s in schedules" :key="s.id">
                  <td>{{ s.installment_number }}</td>
                  <td>{{ s.due_date }}</td>
                  <td>{{ money(s.total_amount) }}</td>
                  <td><span class="pill" :class="scheduleStatusClass(s)">{{ effectiveScheduleStatus(s) }}</span></td>
                  <td class="schedule-action-cell">
                    <select v-model="scheduleTxn[s.id]">
                      <option value="">Select expense txn</option>
                      <option v-for="tx in repaymentTransactions" :key="tx.id" :value="tx.id">#{{ tx.id }} · {{ tx.transaction_date }} · {{ money(tx.total_amount || tx.amount) }}</option>
                    </select>
                    <div class="schedule-action-buttons">
                      <button class="button secondary small" type="button" @click="markSchedulePaid(s)">Mark Paid</button>
                      <button class="button secondary small" type="button" @click="markScheduleUnpaid(s)">Unpaid</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <CrmEmptyState v-else title="No repayment schedule" description="Add schedule lines to track upcoming repayments." />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiGet, apiPost, apiPut } from '../api/client'
import CrmEmptyState from '../components/CrmEmptyState.vue'
import CrmKpiCard from '../components/CrmKpiCard.vue'
import CrmPageHeader from '../components/CrmPageHeader.vue'

const loans = ref([])
const stats = ref({})
const loading = ref(false)
const search = ref('')
const statusFilter = ref('')
const bankAccounts = ref([])
const LOCAL_TREASURY_BANKS_KEY = 'crm_treasury_bank_accounts'
const transactions = ref([])
const showLoanModal = ref(false)
const showDetailModal = ref(false)
const showDisbursement = ref(false)
const showSchedule = ref(false)
const selectedLoan = ref(null)
const disbursements = ref([])
const schedules = ref([])
const error = ref('')
const detailError = ref('')
const loanStatuses = ['Draft', 'Active', 'Closed', 'Cancelled']
const providerTypes = ['Bank', 'Stakeholder', 'Third-Party Agency', 'Other']
const frequencies = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Custom']
const loanForm = reactive(defaultLoan())
const disbursementForm = reactive(defaultDisbursement())
const scheduleForm = reactive(defaultSchedule())
const scheduleTxn = reactive({})

const filteredLoans = computed(() => {
  const term = search.value.toLowerCase()
  return loans.value.filter(loan => {
    const matchesStatus = !statusFilter.value || loan.status === statusFilter.value
    const matchesSearch = !term || [loan.loan_account_number, loan.provider_name, loan.provider_type, loan.purpose].some(v => (v || '').toLowerCase().includes(term))
    return matchesStatus && matchesSearch
  })
})
const repaymentTransactions = computed(() => transactions.value.filter(tx => tx.type === 'Expense' && tx.status !== 'Reversed'))

onMounted(async () => {
  await Promise.all([loadLoans(), loadOptions(), loadTransactions()])
})

function defaultLoan() {
  return { loan_account_number: '', provider_type: 'Bank', provider_name: '', total_loan_amount: 0, interest_rate: 0, interest_type: 'Fixed', tenure: '', tenure_unit: 'Months', start_date: '', end_date: '', repayment_frequency: 'Monthly', bank_account_id: '', purpose: '', agreement_attachment: null, remarks: '', status: 'Draft' }
}
function defaultDisbursement() {
  return { disbursement_date: new Date().toISOString().slice(0, 10), amount: 0, bank_account_id: '', reference: '', remarks: '' }
}
function defaultSchedule() {
  return { installment_number: '', due_date: '', principal_amount: 0, interest_amount: 0 }
}
async function loadLoans() {
  loading.value = true
  try {
    const data = await apiGet('/api/treasury/loans')
    loans.value = data.loans || []
    stats.value = data.stats || {}
  } finally {
    loading.value = false
  }
}
async function loadOptions() {
  bankAccounts.value = await loadTreasuryBankAccounts()
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
async function loadTransactions() {
  const data = await apiGet('/api/finance/transactions')
  transactions.value = data.transactions || []
}
function openLoanModal(loan = null) {
  selectedLoan.value = loan
  Object.assign(loanForm, defaultLoan(), loan || {})
  error.value = ''
  showLoanModal.value = true
}
async function openLoanDetail(loan) {
  selectedLoan.value = loan
  detailError.value = ''
  showDisbursement.value = false
  showSchedule.value = false
  const data = await apiGet(`/api/treasury/loans/${loan.id}`)
  selectedLoan.value = data.loan
  disbursements.value = data.disbursements || []
  schedules.value = data.schedules || []
  Object.keys(scheduleTxn).forEach(key => delete scheduleTxn[key])
  schedules.value.forEach(s => { scheduleTxn[s.id] = s.transaction_id || '' })
  showDetailModal.value = true
}
async function saveLoan() {
  error.value = ''
  try {
    if (selectedLoan.value) await apiPut(`/api/treasury/loans/${selectedLoan.value.id}`, loanForm)
    else await apiPost('/api/treasury/loans', loanForm)
    showLoanModal.value = false
    await loadLoans()
  } catch (err) {
    error.value = err.message
  }
}
async function handleAgreement(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const dataUrl = await new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
  loanForm.agreement_attachment = { name: file.name, type: file.type, size: file.size, data_url: dataUrl }
}
async function addDisbursement() {
  detailError.value = ''
  try {
    await apiPost(`/api/treasury/loans/${selectedLoan.value.id}/disbursements`, disbursementForm)
    Object.assign(disbursementForm, defaultDisbursement())
    showDisbursement.value = false
    await refreshDetail()
  } catch (err) {
    detailError.value = err.message || 'Unable to post disbursement. Please check the details and try again.'
  }
}
async function addSchedule() {
  detailError.value = ''
  try {
    await apiPost(`/api/treasury/loans/${selectedLoan.value.id}/schedules`, {
      ...scheduleForm,
      total_amount: (Number(scheduleForm.principal_amount) || 0) + (Number(scheduleForm.interest_amount) || 0),
    })
    Object.assign(scheduleForm, defaultSchedule())
    showSchedule.value = false
    await refreshDetail()
  } catch (err) {
    detailError.value = err.message || 'Unable to add schedule line. Please check the details and try again.'
  }
}
async function markSchedulePaid(schedule) {
  const transactionId = scheduleTxn[schedule.id]
  if (!transactionId) {
    alert('Select a repayment transaction before marking paid.')
    return
  }
  await apiPut(`/api/treasury/loan-schedules/${schedule.id}/status`, { status: 'Paid', transaction_id: transactionId })
  await refreshDetail()
}
async function markScheduleUnpaid(schedule) {
  await apiPut(`/api/treasury/loan-schedules/${schedule.id}/status`, { status: 'Unpaid' })
  await refreshDetail()
}
async function refreshDetail() {
  await loadLoans()
  await loadTransactions()
  await openLoanDetail(selectedLoan.value)
}
function effectiveScheduleStatus(schedule) {
  if (schedule.status === 'Unpaid' && schedule.due_date && schedule.due_date < new Date().toISOString().slice(0, 10)) return 'Overdue'
  return schedule.status
}
function scheduleStatusClass(schedule) {
  const status = effectiveScheduleStatus(schedule)
  if (status === 'Paid') return 'status-success'
  if (status === 'Overdue') return 'status-danger'
  if (status === 'Partially Paid') return 'status-warning'
  return 'status-muted'
}
function money(value) {
  return `INR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function toggleDisbursementForm() {
  detailError.value = ''
  showDisbursement.value = !showDisbursement.value
  if (showDisbursement.value) showSchedule.value = false
}
function toggleScheduleForm() {
  detailError.value = ''
  showSchedule.value = !showSchedule.value
  if (showSchedule.value) showDisbursement.value = false
}
</script>

<style scoped>
.loans-page {
  margin: 0 auto;
  max-width: 1440px;
}

.metrics-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 20px;
}

.filters-bar {
  align-items: center;
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.filters-bar input {
  flex: 1;
}

.filters-bar select {
  max-width: 220px;
}

.loan-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.loan-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  padding: 18px;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
}

.loan-card:hover {
  border-color: rgba(29, 95, 209, 0.32);
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.loan-card-head {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  justify-content: space-between;
}

.loan-card h2 {
  margin: 0 0 4px;
}

.loan-values {
  background: var(--surface-soft);
  border-radius: 8px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 18px;
  padding: 14px;
}

.loan-values span,
.loan-detail-summary span {
  color: var(--muted);
  display: block;
  font-size: 11px;
  font-weight: 850;
  text-transform: uppercase;
}

.loan-values strong,
.loan-detail-summary strong {
  color: var(--heading);
  display: block;
  font-size: 15px;
  margin-top: 4px;
}

.loan-modal {
  max-height: 90vh;
  max-width: 980px;
  overflow: auto;
  width: min(980px, calc(100vw - 32px));
}

.loan-detail-modal {
  max-height: 90vh;
  max-width: 1280px;
  overflow: auto;
  width: min(1280px, calc(100vw - 32px));
}

.loan-detail-modal :deep(.modal-header),
.loan-modal :deep(.modal-header) {
  padding: 22px 28px;
}

.loan-detail-modal :deep(.modal-header h2) {
  font-size: 26px;
  margin-bottom: 4px;
}

.detail-actions {
  align-items: center;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 18px 28px;
}

.loan-detail-summary {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 22px 28px 8px;
}

.loan-detail-summary > div {
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
}

.loan-detail-modal .record-card {
  box-shadow: none;
  margin: 18px 28px 0;
  max-width: none;
}

.loan-inline-form {
  background: #fbfdff;
  border-color: rgba(29, 95, 209, 0.2);
  box-shadow: 0 12px 28px rgba(16, 24, 40, 0.07);
}

.loan-inline-form .card-section-title h2 {
  margin-bottom: 4px;
}

.loan-inline-form .card-section-title p {
  margin: 0;
}

.split-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(360px, 0.9fr) minmax(620px, 1.4fr);
  padding: 22px 28px 28px;
}

.loan-table-panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.loan-section-heading {
  align-items: flex-start;
  border-bottom: 1px solid var(--line);
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 18px 20px;
}

.loan-section-heading h3 {
  color: var(--heading);
  font-size: 18px;
  margin: 0 0 4px;
}

.loan-section-heading p {
  margin: 0;
}

.loan-table {
  table-layout: fixed;
}

.loan-table th,
.loan-table td {
  font-size: 13px;
  padding: 13px 14px;
}

.loan-table th {
  white-space: nowrap;
}

.loan-table td {
  vertical-align: top;
}

.repayment-table th:nth-child(1),
.repayment-table td:nth-child(1) {
  width: 44px;
}

.repayment-table th:nth-child(2),
.repayment-table td:nth-child(2) {
  width: 112px;
}

.repayment-table th:nth-child(3),
.repayment-table td:nth-child(3) {
  width: 132px;
}

.repayment-table th:nth-child(4),
.repayment-table td:nth-child(4) {
  width: 116px;
}

.schedule-action-cell {
  min-width: 280px;
}

.schedule-action-cell select {
  min-width: 260px;
}

.schedule-action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

@media (max-width: 1180px) {
  .metrics-grid,
  .loan-detail-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .split-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .metrics-grid,
  .loan-values,
  .loan-detail-summary {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .filters-bar select {
    max-width: none;
  }

  .detail-actions,
  .loan-detail-summary,
  .split-grid {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
