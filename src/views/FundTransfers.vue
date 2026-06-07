<template>
  <div class="transfer-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Treasury</p>
        <h1>Internal Fund Transfers</h1>
        <p class="muted">Move funds between company bank accounts without changing net company cash.</p>
      </div>
      <RouterLink class="button secondary" to="/treasury/bank-accounts">Bank Accounts</RouterLink>
    </header>

    <section class="transfer-grid">
      <form class="record-card form-grid" @submit.prevent="executeTransfer">
        <label>Transfer Number<input v-model="form.transfer_number" placeholder="Auto if empty"></label>
        <label>Transfer Date<input v-model="form.transfer_date" type="date" required></label>
        <label>From Bank Account
          <select v-model="form.from_bank_account_id" required>
            <option value="">Select source</option>
            <option v-for="account in activeBankAccounts" :key="account.id" :value="account.id">{{ bankLabel(account) }}</option>
          </select>
        </label>
        <label>To Bank Account
          <select v-model="form.to_bank_account_id" required>
            <option value="">Select destination</option>
            <option v-for="account in activeBankAccounts" :key="account.id" :value="account.id">{{ bankLabel(account) }}</option>
          </select>
        </label>
        <label>Transfer Amount<input v-model.number="form.transfer_amount" type="number" min="0.01" step="0.01" required></label>
        <label>Transaction Reference<input v-model="form.transaction_reference"></label>
        <label class="span-2">Remarks<textarea v-model="form.remarks" rows="3"></textarea></label>
        <label class="span-2">Attachment<input type="file" @change="handleAttachment"></label>
        <p v-if="selectedFromAccount" class="span-2 field-hint">Available in source: {{ money(selectedFromAccount.current_balance ?? selectedFromAccount.balance ?? selectedFromAccount.opening_balance, selectedFromAccount.currency) }}</p>
        <p v-if="error" class="span-2 flash warning">{{ error }}</p>
        <div class="span-2 action-row">
          <button class="button secondary" type="button" @click="resetForm">Reset</button>
          <button class="button" type="submit">Execute Transfer</button>
        </div>
      </form>

      <section class="record-card">
        <h2>Transfer Rules</h2>
        <div class="rules-list">
          <div><span>Source</span><strong>Debited after posting</strong></div>
          <div><span>Destination</span><strong>Credited after posting</strong></div>
          <div><span>Company Balance</span><strong>Net unchanged</strong></div>
          <div><span>Audit Trail</span><strong>Stored in treasury statement</strong></div>
        </div>
      </section>
    </section>

    <section class="record-card">
      <h2>Transfer History</h2>
      <table class="record-table">
        <thead><tr><th>Transfer #</th><th>Date</th><th>From</th><th>To</th><th>Reference</th><th class="right">Amount</th><th>Remarks</th></tr></thead>
        <tbody>
          <tr v-for="transfer in transfers" :key="transfer.id || transfer.transfer_number">
            <td><strong>{{ transfer.transfer_number }}</strong></td>
            <td>{{ formatDate(transfer.transfer_date) }}</td>
            <td>{{ transfer.from_bank_account_name || transfer.from_account_name }}</td>
            <td>{{ transfer.to_bank_account_name || transfer.to_account_name }}</td>
            <td>{{ transfer.transaction_reference || transfer.reference || '-' }}</td>
            <td class="right">{{ money(transfer.transfer_amount || transfer.amount, transfer.currency) }}</td>
            <td>{{ transfer.remarks || '-' }}</td>
          </tr>
          <tr v-if="transfers.length === 0"><td colspan="7" class="empty-row">No internal transfers posted yet.</td></tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiGet, apiPost } from '../api/client'

const bankAccounts = ref([])
const transfers = ref([])
const error = ref('')
const LOCAL_TREASURY_BANKS_KEY = 'crm_treasury_bank_accounts'
const form = reactive(defaultTransfer())

onMounted(loadData)

function defaultTransfer() {
  return { transfer_number: '', transfer_date: new Date().toISOString().slice(0, 10), from_bank_account_id: '', to_bank_account_id: '', transfer_amount: 0, transaction_reference: '', remarks: '', attachment: null }
}

const activeBankAccounts = computed(() => bankAccounts.value.filter(account => (account.status || 'Active') === 'Active'))
const selectedFromAccount = computed(() => bankAccounts.value.find(account => Number(account.id) === Number(form.from_bank_account_id)) || null)

async function loadData() {
  const safe = async (fn) => {
    try { return await fn() } catch { return null }
  }
  const data = await safe(() => apiGet('/api/treasury/fund-transfers'))
  const treasuryBankData = await safe(() => apiGet('/api/treasury/bank-accounts'))
  bankAccounts.value = mergeBankAccounts(treasuryBankData?.bank_accounts || treasuryBankData?.accounts || data?.bank_accounts || [], loadLocalBankAccounts())
  transfers.value = data?.transfers || []
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
  return merged
}

function validateTransfer() {
  if (!form.from_bank_account_id || !form.to_bank_account_id || !form.transfer_amount) {
    error.value = 'Select source, destination, and amount before executing transfer.'
    return false
  }
  if (Number(form.from_bank_account_id) === Number(form.to_bank_account_id)) {
    error.value = 'Source and destination bank accounts must be different.'
    return false
  }
  const available = Number(selectedFromAccount.value?.current_balance ?? selectedFromAccount.value?.balance ?? selectedFromAccount.value?.opening_balance ?? 0)
  if (Number(form.transfer_amount) > available) {
    error.value = 'Transfer amount exceeds available source balance.'
    return false
  }
  return true
}

async function executeTransfer() {
  error.value = ''
  if (!validateTransfer()) return
  try {
    await apiPost('/api/treasury/fund-transfers', form)
    resetForm()
    await loadData()
  } catch (err) {
    error.value = err.message || 'Unable to execute transfer.'
  }
}

function resetForm() {
  Object.assign(form, defaultTransfer())
}

function handleAttachment(event) {
  form.attachment = event.target.files?.[0]?.name || null
}

function bankLabel(account) {
  return account.label || `${account.account_name || account.bank_name} · ${account.account_number || ''}`
}

function money(value, currency = 'INR') {
  return `${currency || 'INR'} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-'
}
</script>

<style scoped>
.transfer-page { max-width: 1400px; margin: 0 auto; }
.transfer-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; margin-bottom: 20px; }
.record-card h2 { font-size: 18px; margin-top: 0; }
.rules-list { display: grid; gap: 12px; }
.rules-list div { border: 1px solid var(--line); border-radius: 8px; padding: 14px; }
.rules-list span { display: block; color: var(--muted); font-size: 12px; font-weight: 800; text-transform: uppercase; }
.field-hint { color: var(--muted); font-size: 12px; margin: 0; }
@media (max-width: 900px) {
  .transfer-grid { grid-template-columns: 1fr; }
}
</style>
