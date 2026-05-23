<template>
  <div class="vault-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Secure Storage</p>
        <h1>Credential Vault</h1>
        <p class="muted">Store client IDs, company credentials, passwords, and sensitive notes with encrypted passwords.</p>
      </div>
      <button class="button" @click="openForm()">
        <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
        </svg>
        Add Credential
      </button>
    </header>

    <section class="vault-summary">
      <div class="summary-card">
        <span class="summary-label">Total Entries</span>
        <strong>{{ entries.length }}</strong>
      </div>
      <div
        v-for="cat in categories"
        :key="cat"
        class="summary-card clickable"
        :class="{ active: categoryFilter === cat }"
        @click="categoryFilter = cat"
      >
        <span class="summary-label">{{ cat }}</span>
        <strong>{{ categoryCounts[cat] || 0 }}</strong>
      </div>
    </section>

    <section class="filters-bar">
      <div class="filter-group search">
        <input v-model="search" placeholder="Search title, ID, username, notes, URL..." @input="debouncedLoad">
      </div>
      <select v-model="categoryFilter" @change="loadEntries">
        <option value="All">All categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </section>

    <div v-if="showAccessModal" class="modal-overlay">
      <div class="modal-content access-modal" @click.stop>
        <div class="modal-header">
          <h2>Vault Access Code</h2>
          <button class="modal-close" type="button" @click="closeAccessModal">&times;</button>
        </div>
        <form class="modal-form p-24" @submit.prevent="unlockVault">
          <p v-if="vaultCodeConfigured" class="muted access-copy">Enter your Vault access code to continue.</p>
          <p v-else class="muted access-copy">A Vault access code has not been set for your user. Ask a system administrator to set it in Setup &gt; Users.</p>
          <label>
            Access Code
            <input
              v-model="accessCode"
              type="password"
              required
              minlength="4"
              autocomplete="off"
              :disabled="!vaultCodeConfigured || unlocking"
              autofocus
            />
          </label>
          <p v-if="accessError" class="access-error">{{ accessError }}</p>
          <div class="form-actions">
            <button type="submit" class="button" :disabled="!vaultCodeConfigured || unlocking">
              {{ unlocking ? 'Unlocking...' : 'Unlock Vault' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <section class="table-container">
      <table class="record-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>ID / Username</th>
            <th>Password</th>
            <th>Linked To</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="empty-state">Loading...</td>
          </tr>
          <tr v-else-if="entries.length === 0">
            <td colspan="7" class="empty-state">No credentials stored yet.</td>
          </tr>
          <tr v-for="entry in entries" :key="entry.id">
            <td><strong>{{ entry.title }}</strong></td>
            <td><span class="pill category">{{ entry.category }}</span></td>
            <td class="mono">{{ entry.login_id || '—' }}</td>
            <td>
              <span v-if="entry.has_password" class="text-muted">••••••••</span>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="text-sm">
              <span v-if="entry.customer_name">{{ entry.customer_name }}</span>
              <span v-else-if="entry.project_name">{{ entry.project_name }}</span>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="text-sm text-muted">{{ formatDate(entry.updated_at) }}</td>
            <td class="actions-cell">
              <button class="link" type="button" @click="revealPassword(entry)">Reveal</button>
              <button class="link" type="button" @click="openForm(entry)">Edit</button>
              <button class="link danger" type="button" @click="removeEntry(entry)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Form Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeForm">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>{{ form.id ? 'Edit Credential' : 'Add Credential' }}</h2>
          <button class="modal-close" type="button" @click="closeForm">&times;</button>
        </div>
        <form class="form-grid modal-form" @submit.prevent="saveEntry">
          <label class="span-2">
            Title <span class="required">*</span>
            <input v-model="form.title" type="text" required placeholder="e.g. AWS Production, Client portal" />
          </label>
          <label>
            Category <span class="required">*</span>
            <select v-model="form.category" required>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </label>
          <label>
            ID / Username
            <input v-model="form.login_id" type="text" placeholder="client ID, email, or username" />
          </label>
          <label>
            Password
            <div class="password-row">
              <input v-model="form.password" :type="showFormPassword ? 'text' : 'password'" placeholder="Leave blank to keep unchanged when editing" />
              <button type="button" class="button secondary sm" @click="showFormPassword = !showFormPassword">
                {{ showFormPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
          </label>
          <label>
            URL (optional)
            <input v-model="form.url" type="url" placeholder="https://..." />
          </label>
          <label>
            Linked Customer
            <select v-model="form.customer_id">
              <option :value="null">— None —</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.company_name }}</option>
            </select>
          </label>
          <label>
            Linked Project
            <select v-model="form.project_id">
              <option :value="null">— None —</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.project_name }}</option>
            </select>
          </label>
          <label class="span-2">
            Notes
            <textarea v-model="form.notes" rows="3" placeholder="Recovery codes, 2FA notes, environment details..." />
          </label>
          <div class="span-2 form-actions">
            <button type="button" class="button secondary" @click="closeForm">Cancel</button>
            <button type="submit" class="button" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reveal Modal -->
    <div v-if="revealed" class="modal-overlay" @click="revealed = null">
      <div class="modal-content reveal-modal" @click.stop>
        <div class="modal-header reveal-header">
          <div>
            <p class="eyebrow">Credential Details</p>
            <h2>{{ revealed.title }}</h2>
          </div>
          <button class="modal-close" type="button" @click="revealed = null">&times;</button>
        </div>
        <div class="reveal-body p-24">
          <div class="reveal-meta">
            <span class="reveal-label">Category</span>
            <span class="pill category">{{ revealed.category }}</span>
          </div>
          <div class="credential-field" v-if="revealed.login_id">
            <div>
              <span class="reveal-label">ID / Username</span>
              <code class="reveal-value">{{ revealed.login_id }}</code>
            </div>
            <button type="button" class="button secondary sm copy-btn" @click="copyText(revealed.login_id)">Copy</button>
          </div>
          <div class="credential-field sensitive" v-if="revealed.password">
            <div>
              <span class="reveal-label">Password</span>
              <code class="reveal-value">{{ revealed.password }}</code>
            </div>
            <button type="button" class="button secondary sm copy-btn" @click="copyText(revealed.password)">Copy</button>
          </div>
          <div class="detail-line" v-if="revealed.url">
            <span class="reveal-label">URL</span>
            <a class="detail-link" :href="revealed.url" target="_blank" rel="noopener">{{ revealed.url }}</a>
          </div>
          <div class="detail-line notes-line" v-if="revealed.notes">
            <span class="reveal-label">Notes</span>
            <p class="reveal-notes">{{ revealed.notes }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client'

const router = useRouter()
const entries = ref([])
const categories = ref([])
const categoryCounts = ref({})
const customers = ref([])
const projects = ref([])
const search = ref('')
const categoryFilter = ref('All')
const loading = ref(false)
const saving = ref(false)
const unlocking = ref(false)
const vaultUnlocked = ref(false)
const vaultCodeConfigured = ref(true)
const showAccessModal = ref(true)
const accessCode = ref('')
const accessError = ref('')
const showModal = ref(false)
const showFormPassword = ref(false)
const revealed = ref(null)

const form = reactive({
  id: null,
  title: '',
  category: 'Company Credential',
  login_id: '',
  password: '',
  notes: '',
  url: '',
  customer_id: null,
  project_id: null,
})

let searchTimer = null

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function debouncedLoad() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadEntries, 300)
}

async function loadEntries() {
  if (!vaultUnlocked.value) return
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (categoryFilter.value && categoryFilter.value !== 'All') {
      params.set('category', categoryFilter.value)
    }
    if (search.value.trim()) {
      params.set('search', search.value.trim())
    }
    const qs = params.toString()
    const data = await apiGet(`/api/vault${qs ? `?${qs}` : ''}`)
    entries.value = data.entries || []
    categories.value = data.categories || []
    categoryCounts.value = data.category_counts || {}
  } catch (err) {
    alert(err.message || 'Failed to load vault entries')
  } finally {
    loading.value = false
  }
}

async function loadVaultStatus() {
  try {
    const data = await apiGet('/api/vault/status')
    vaultUnlocked.value = !!data.unlocked
    vaultCodeConfigured.value = !!data.code_configured
    showAccessModal.value = !vaultUnlocked.value
    if (vaultUnlocked.value) {
      await loadEntries()
    }
  } catch (err) {
    accessError.value = err.message || 'Failed to verify vault access'
  }
}

async function lockVault() {
  vaultUnlocked.value = false
  showAccessModal.value = true
  entries.value = []
  categoryCounts.value = {}
  revealed.value = null
  accessCode.value = ''
  try {
    await apiPost('/api/vault/lock')
  } catch (err) {
    console.warn('Could not lock vault', err)
  }
}

async function closeAccessModal() {
  await lockVault()
  router.push({ name: 'dashboard' })
}

async function unlockVault() {
  unlocking.value = true
  accessError.value = ''
  try {
    await apiPost('/api/vault/unlock', { access_code: accessCode.value })
    vaultUnlocked.value = true
    showAccessModal.value = false
    accessCode.value = ''
    await loadEntries()
  } catch (err) {
    accessError.value = err.message || 'Invalid vault access code'
  } finally {
    unlocking.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    id: null,
    title: '',
    category: 'Company Credential',
    login_id: '',
    password: '',
    notes: '',
    url: '',
    customer_id: null,
    project_id: null,
  })
  showFormPassword.value = false
}

function openForm(entry = null) {
  resetForm()
  if (entry) {
    Object.assign(form, {
      id: entry.id,
      title: entry.title,
      category: entry.category,
      login_id: entry.login_id || '',
      password: '',
      notes: entry.notes || '',
      url: entry.url || '',
      customer_id: entry.customer_id || null,
      project_id: entry.project_id || null,
    })
  }
  showModal.value = true
}

function closeForm() {
  showModal.value = false
  resetForm()
}

async function saveEntry() {
  saving.value = true
  try {
    const payload = {
      title: form.title,
      category: form.category,
      login_id: form.login_id,
      notes: form.notes,
      url: form.url,
      customer_id: form.customer_id,
      project_id: form.project_id,
    }
    if (form.password) {
      payload.password = form.password
    }
    if (form.id) {
      await apiPut(`/api/vault/${form.id}`, payload)
    } else {
      if (!form.password && !form.login_id) {
        // allow empty password for notes-only entries
      }
      payload.password = form.password || ''
      await apiPost('/api/vault', payload)
    }
    closeForm()
    await loadEntries()
  } catch (err) {
    alert(err.message || 'Failed to save credential')
  } finally {
    saving.value = false
  }
}

async function revealPassword(entry) {
  try {
    const data = await apiGet(`/api/vault/${entry.id}?reveal=1`)
    revealed.value = data.entry
  } catch (err) {
    alert(err.message || 'Failed to reveal credential')
  }
}

async function removeEntry(entry) {
  if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return
  try {
    await apiDelete(`/api/vault/${entry.id}`)
    await loadEntries()
  } catch (err) {
    alert(err.message || 'Failed to delete credential')
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    alert('Could not copy to clipboard')
  }
}

watch(categoryFilter, () => {
  loadEntries()
})

onMounted(async () => {
  await lockVault()
  try {
    const opts = await apiGet('/api/options')
    customers.value = opts.customers || []
    projects.value = opts.projects || []
  } catch (e) {
    console.warn('Could not load link options', e)
  }
  await loadVaultStatus()
})

onBeforeRouteLeave(async () => {
  await lockVault()
  return true
})
</script>

<style scoped>
.vault-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.eyebrow {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary);
  margin: 0 0 4px;
}

.muted {
  color: var(--text-muted);
  margin: 8px 0 0;
}

.vault-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.summary-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px 16px;
  min-width: 140px;
}

.summary-card.clickable {
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.summary-card.clickable:hover,
.summary-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}

.summary-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.summary-card strong {
  font-size: 1.25rem;
}

.filters-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filters-bar .search {
  flex: 1;
  min-width: 220px;
}

.filters-bar input,
.filters-bar select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.table-container {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}

.record-table {
  width: 100%;
  border-collapse: collapse;
}

.record-table th,
.record-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--line);
}

.record-table th {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--text-muted);
  background: var(--surface-soft, #f8fafc);
}

.mono {
  font-family: ui-monospace, monospace;
  font-size: 13px;
}

.pill.category {
  background: #e0e7ff;
  color: #3730a3;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.link.danger {
  color: #dc2626;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  padding: 32px;
}

.password-row {
  display: flex;
  gap: 8px;
}

.password-row input {
  flex: 1;
}

.reveal-modal {
  width: min(720px, calc(100vw - 32px));
  overflow: hidden;
}

.reveal-header {
  align-items: center;
  background: #fff;
  border-bottom: 1px solid var(--line);
}

.reveal-header .eyebrow {
  margin-bottom: 6px;
}

.reveal-header h2 {
  margin: 0;
  line-height: 1.2;
}

.reveal-body {
  display: grid;
  gap: 14px;
  background: #f8fafc;
}

.reveal-meta,
.detail-line {
  display: grid;
  gap: 8px;
}

.credential-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
  padding: 14px;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.credential-field.sensitive {
  border-color: #fed7aa;
  background: #fff7ed;
}

.reveal-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.reveal-value {
  display: block;
  width: 100%;
  box-sizing: border-box;
  background: #f1f5f9;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 15px;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.copy-btn {
  min-width: 84px;
  height: 42px;
}

.detail-link {
  overflow-wrap: anywhere;
}

.reveal-notes {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.access-modal {
  max-width: 420px;
}

.access-copy {
  margin: 0 0 16px;
}

.access-error {
  color: #dc2626;
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 640px) {
  .credential-field {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .copy-btn {
    width: 100%;
  }
}
</style>
