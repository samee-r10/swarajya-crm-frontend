<template>
  <div class="setup-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Super Admin</p>
        <h1>Organisations</h1>
        <p class="muted">Manage tenant domains, branding, and activation status.</p>
      </div>
      <button class="button" type="button" @click="startCreate">New Organisation</button>
    </header>

    <section class="record-card shadow-premium">
      <table class="data-table">
        <thead>
          <tr>
            <th>Organisation</th>
            <th>Domain</th>
            <th>Theme</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="org in organisations" :key="org.orgId">
            <td>
              <div class="org-cell">
                <img :src="org.logo || '/logo.png'" :alt="`${org.organisationName} logo`">
                <strong>{{ org.organisationName }}</strong>
              </div>
            </td>
            <td>{{ org.domain }}</td>
            <td><span class="theme-chip" :style="{ backgroundColor: org.themeColor || '#f97316' }"></span>{{ org.themeColor }}</td>
            <td><span class="pill" :class="org.status === 'active' ? 'status-success' : 'status-muted'">{{ org.status }}</span></td>
            <td class="actions-cell"><button class="button secondary small" type="button" @click="startEdit(org)">Edit</button></td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="editing" class="modal-overlay" @click.self="editing = false">
      <div class="modal-content org-modal">
        <div class="bank-modal-header">
          <div>
            <p class="eyebrow">Organisation</p>
            <h2>{{ form.orgId ? 'Edit' : 'Create' }} Organisation</h2>
          </div>
          <button type="button" class="modal-close" @click="editing = false">&times;</button>
        </div>
        <form class="setup-form" @submit.prevent="save">
          <div class="form-grid">
            <label>Organisation Name
              <input v-model="form.organisationName" required>
            </label>
            <label>Domain
              <input v-model="form.domain" required placeholder="example.com">
            </label>
            <label>Logo URL
              <input v-model="form.logo" placeholder="/logo.png">
            </label>
            <label>Favicon URL
              <input v-model="form.favicon" placeholder="/logo.png">
            </label>
            <label>Theme Color
              <input v-model="form.themeColor" type="color">
            </label>
            <label>Status
              <select v-model="form.status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label>Footer Name
              <input v-model="form.footerName">
            </label>
            <label>Dashboard Title
              <input v-model="form.dashboardTitle">
            </label>
          </div>
          <p v-if="error" class="text-danger">{{ error }}</p>
          <div class="form-actions mt-24">
            <button type="button" class="button secondary" @click="editing = false">Cancel</button>
            <button type="submit" class="button" :disabled="saving">{{ saving ? 'Saving...' : 'Save Organisation' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { apiGet, apiPost, apiPut } from '../api/client'

const organisations = ref([])
const editing = ref(false)
const saving = ref(false)
const error = ref('')
const form = reactive(emptyForm())

onMounted(loadOrganisations)

function emptyForm() {
  return {
    orgId: '',
    organisationName: '',
    domain: '',
    logo: '/logo.png',
    favicon: '/logo.png',
    themeColor: '#f97316',
    footerName: '',
    dashboardTitle: '',
    status: 'active'
  }
}

function setForm(values) {
  Object.assign(form, emptyForm(), values)
}

async function loadOrganisations() {
  const data = await apiGet('/api/super-admin/organisations')
  organisations.value = data.organisations || []
}

function startCreate() {
  setForm({})
  error.value = ''
  editing.value = true
}

function startEdit(org) {
  setForm(org)
  error.value = ''
  editing.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (form.orgId) {
      await apiPut(`/api/super-admin/organisations/${encodeURIComponent(form.orgId)}`, form)
    } else {
      await apiPost('/api/super-admin/organisations', form)
    }
    editing.value = false
    await loadOrganisations()
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.org-cell {
  align-items: center;
  display: flex;
  gap: 10px;
}

.org-cell img {
  border: 1px solid var(--line);
  border-radius: 6px;
  height: 34px;
  object-fit: contain;
  width: 42px;
}

.theme-chip {
  border: 1px solid var(--line);
  border-radius: 999px;
  display: inline-block;
  height: 16px;
  margin-right: 8px;
  vertical-align: middle;
  width: 16px;
}

.org-modal {
  max-width: 760px;
}
</style>
