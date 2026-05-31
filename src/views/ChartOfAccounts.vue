<template>
  <div class="coa-page">
    <section class="page-header">
      <div>
        <p class="eyebrow">Finance</p>
        <h1>Chart of Accounts</h1>
        <p class="muted">Create and update ledger accounts used in transactions.</p>
      </div>
      <button class="button" type="button" @click="openAccountModal()">New Account</button>
    </section>

    <section class="record-card coa-shell">
      <div class="coa-toolbar">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input v-model="search" placeholder="Search GL code or name">
        </div>
      </div>

      <div v-if="loading" class="vue-state">Loading accounts...</div>
      <p v-else-if="error" class="flash warning">{{ error }}</p>

      <table v-else class="data-table coa-table">
        <thead>
          <tr>
            <th>GL Code</th>
            <th>Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Shown In</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="account in filteredAccounts" :key="account.id">
            <tr>
              <td>
                <button class="gl-link mono" type="button" @click="toggleTransactions(account)">
                  {{ account.gl_code || '-' }}
                </button>
              </td>
              <td><strong>{{ account.name }}</strong></td>
              <td><span class="pill">{{ account.type }}</span></td>
              <td><span class="pill" :class="account.is_active ? 'status-on' : 'status-off'">{{ account.is_active ? 'Active' : 'Blocked' }}</span></td>
              <td>
                <div class="shown-in">
                  <span v-if="account.show_in_income" class="pill visibility">Income</span>
                  <span v-if="account.show_in_expense" class="pill visibility">Expense</span>
                  <span v-if="!account.show_in_income && !account.show_in_expense" class="muted">Hidden</span>
                </div>
              </td>
              <td class="actions-cell">
                <button class="button secondary small" type="button" @click="openAccountModal(account)">Edit</button>
              </td>
            </tr>
            <tr v-if="selectedAccountId === account.id" class="transactions-row">
              <td colspan="6">
                <div class="transactions-panel">
                  <div class="transactions-header">
                    <div>
                      <span class="eyebrow">Transactions</span>
                      <h3>{{ account.gl_code }} - {{ account.name }}</h3>
                    </div>
                    <span class="muted">{{ accountTransactions.length }} records</span>
                  </div>

                  <div v-if="transactionsLoading" class="vue-state compact">Loading transactions...</div>
                  <p v-else-if="transactionsError" class="flash warning">{{ transactionsError }}</p>
                  <table v-else-if="accountTransactions.length" class="nested-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Party</th>
                        <th>Invoice</th>
                        <th>Description</th>
                        <th class="right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="transaction in accountTransactions" :key="transaction.id">
                        <td>{{ formatDate(transaction.transaction_date) }}</td>
                        <td class="mono">#{{ transaction.id }}</td>
                        <td><span class="pill" :class="transaction.status === 'Reversed' ? 'status-off' : 'visibility'">{{ transaction.status === 'Reversed' ? 'Reversed' : transaction.type }}</span></td>
                        <td>{{ partyLabel(transaction) }}</td>
                        <td>{{ transaction.invoice_number || '-' }}</td>
                        <td>{{ transaction.description || transaction.category || '-' }}</td>
                        <td class="right mono" :class="transaction.type === 'Income' ? 'amount-positive' : 'amount-negative'">
                          {{ transaction.type === 'Income' ? '+' : '-' }} {{ money(transaction.currency, transaction.total_amount || transaction.amount) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-else class="empty-row">No transactions found for this GL code.</div>
                </div>
              </td>
            </tr>
          </template>
          <tr v-if="filteredAccounts.length === 0">
            <td colspan="6" class="empty-row">No accounts match your search.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="showModal" class="modal-overlay" @click.self="closeAccountModal">
      <div class="modal-content account-modal">
        <header class="modal-header">
          <div>
            <p class="eyebrow">Ledger Account</p>
            <h2>{{ accountForm.id ? 'Edit Account' : 'New Account' }}</h2>
          </div>
          <button class="modal-close" type="button" @click="closeAccountModal">&times;</button>
        </header>

        <form class="form-grid account-form" @submit.prevent="saveAccount">
          <label>
            GL Code
            <input v-model.trim="accountForm.gl_code" placeholder="4010" required>
          </label>
          <label>
            Name
            <input v-model.trim="accountForm.name" placeholder="Subscription Revenue" required>
          </label>
          <label class="span-2">
            Type
            <select v-model="accountForm.type" required>
              <option v-for="type in accountTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </label>
          <label class="checkbox-row span-2">
            <input type="checkbox" v-model="accountForm.is_active">
            <span>Active for new transactions</span>
          </label>
          <div class="span-2 visibility-panel">
            <span class="visibility-title">Show This Account In</span>
            <label class="checkbox-row">
              <input type="checkbox" v-model="accountForm.show_in_income">
              <span>Income transactions</span>
            </label>
            <label class="checkbox-row">
              <input type="checkbox" v-model="accountForm.show_in_expense">
              <span>Expense transactions</span>
            </label>
          </div>
          <p v-if="formError" class="span-2 flash warning">{{ formError }}</p>
          <div class="span-2 form-actions">
            <button class="button secondary" type="button" @click="closeAccountModal">Cancel</button>
            <button class="button" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save Account' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiGet, apiPost, apiPut } from '../api/client'

const accounts = ref([])
const accountTypes = ref(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const formError = ref('')
const search = ref('')
const showModal = ref(false)
const selectedAccountId = ref(null)
const accountTransactions = ref([])
const transactionsLoading = ref(false)
const transactionsError = ref('')
const accountForm = reactive({
  id: null,
  gl_code: '',
  name: '',
  type: 'Revenue',
  is_active: true,
  show_in_income: true,
  show_in_expense: false
})

const filteredAccounts = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return accounts.value
  return accounts.value.filter((account) => {
    const state = account.is_active ? 'active' : 'blocked'
    const visibility = `${account.show_in_income ? 'income' : ''} ${account.show_in_expense ? 'expense' : ''}`
    return `${account.gl_code || ''} ${account.name || ''} ${account.type || ''} ${state} ${visibility}`.toLowerCase().includes(term)
  })
})

async function loadAccounts() {
  loading.value = true
  error.value = ''
  try {
    const data = await apiGet('/api/finance/accounts')
    accounts.value = data.accounts || []
    accountTypes.value = data.account_types || accountTypes.value
  } catch (err) {
    error.value = err.message || 'Unable to load chart of accounts.'
  } finally {
    loading.value = false
  }
}

async function toggleTransactions(account) {
  if (selectedAccountId.value === account.id) {
    selectedAccountId.value = null
    accountTransactions.value = []
    transactionsError.value = ''
    return
  }

  selectedAccountId.value = account.id
  accountTransactions.value = []
  transactionsError.value = ''
  transactionsLoading.value = true
  try {
    const data = await apiGet(`/api/finance/accounts/${account.id}/transactions`)
    accountTransactions.value = data.transactions || []
  } catch (err) {
    transactionsError.value = err.message || 'Unable to load transactions.'
  } finally {
    transactionsLoading.value = false
  }
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function partyLabel(transaction) {
  if (transaction.type === 'Income') {
    return transaction.customer_name || 'Generic Customer'
  }
  return transaction.vendor_name || 'General Vendor'
}

function money(currency, amount) {
  return `${currency || ''} ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`.trim()
}

function openAccountModal(account = null) {
  formError.value = ''
  if (account) {
    accountForm.id = account.id
    accountForm.gl_code = account.gl_code || ''
    accountForm.name = account.name || ''
    accountForm.type = account.type || 'Revenue'
    accountForm.is_active = account.is_active !== 0
    accountForm.show_in_income = account.show_in_income === 1 || account.show_in_income === true
    accountForm.show_in_expense = account.show_in_expense === 1 || account.show_in_expense === true
  } else {
    accountForm.id = null
    accountForm.gl_code = ''
    accountForm.name = ''
    accountForm.type = 'Revenue'
    accountForm.is_active = true
    accountForm.show_in_income = true
    accountForm.show_in_expense = false
  }
  showModal.value = true
}

function closeAccountModal() {
  showModal.value = false
  formError.value = ''
}

async function saveAccount() {
  saving.value = true
  formError.value = ''
  const payload = {
    gl_code: accountForm.gl_code,
    name: accountForm.name,
    type: accountForm.type,
    is_active: accountForm.is_active,
    show_in_income: accountForm.show_in_income,
    show_in_expense: accountForm.show_in_expense
  }
  try {
    if (accountForm.id) {
      await apiPut(`/api/finance/accounts/${accountForm.id}`, payload)
    } else {
      await apiPost('/api/finance/accounts', payload)
    }
    closeAccountModal()
    await loadAccounts()
  } catch (err) {
    formError.value = err.message || 'Unable to save account.'
  } finally {
    saving.value = false
  }
}

onMounted(loadAccounts)
</script>

<style scoped>
.coa-shell {
  padding: 0;
  overflow: hidden;
}

.coa-toolbar {
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  background: #ffffff;
}

.search-box {
  max-width: 360px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 18px;
}

.search-box input {
  width: 100%;
  padding-left: 36px;
}

.coa-table th,
.coa-table td {
  vertical-align: middle;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 800;
}

.gl-link {
  border: none;
  background: transparent;
  color: #1d4ed8;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.gl-link:hover {
  color: var(--primary);
}

.pill {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 800;
  color: var(--muted);
  background: #f8fafc;
}

.pill.status-on {
  border-color: #bbf7d0;
  background: #dcfce7;
  color: #166534;
}

.pill.status-off {
  border-color: #fecaca;
  background: #fee2e2;
  color: #991b1b;
}

.pill.visibility {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.shown-in {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.transactions-row td {
  background: #f8fafc;
  padding: 0;
}

.transactions-panel {
  padding: 18px 20px 22px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.transactions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.transactions-header h3 {
  margin: 2px 0 0;
  font-size: 16px;
}

.vue-state.compact {
  padding: 18px;
}

.nested-table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border: 1px solid var(--line);
}

.nested-table th,
.nested-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  font-size: 13px;
}

.nested-table th {
  color: var(--muted);
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 900;
  background: #ffffff;
}

.nested-table .right {
  text-align: right;
}

.amount-positive {
  color: #166534;
}

.amount-negative {
  color: #991b1b;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  color: var(--text);
}

.checkbox-row input {
  width: 16px;
  height: 16px;
}

.visibility-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
  display: grid;
  gap: 10px;
  background: #f8fafc;
}

.visibility-title {
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--muted);
}

.actions-cell {
  text-align: right;
  white-space: nowrap;
}

.empty-row,
.vue-state {
  padding: 28px;
  text-align: center;
  color: var(--muted);
}

.account-modal {
  max-width: 560px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px;
  border-bottom: 1px solid var(--line);
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  color: var(--muted);
}

.account-form {
  padding: 24px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
