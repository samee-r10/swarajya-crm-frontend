<template>
  <div class="setup-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Administration</p>
        <h1>Setup</h1>
        <p class="muted">Configure objects, fields, users, and company information.</p>
      </div>
    </header>

    <nav class="setup-tabs">
      <button :class="{ active: activeTab === 'objects' }" @click="activeTab = 'objects'">Object Manager</button>
      <button :class="{ active: activeTab === 'roles' }" @click="activeTab = 'roles'">Profiles (Roles)</button>
      <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">User Management</button>
      <button :class="{ active: activeTab === 'company' }" @click="activeTab = 'company'">Company Information</button>
      <button :class="{ active: activeTab === 'rates' }" @click="activeTab = 'rates'">Exchange Rates</button>
    </nav>

    <main class="setup-content">
      <!-- Company Information Tab -->
      <section v-if="activeTab === 'company'" class="company-setup">
        <div class="record-card shadow-premium">
          <div class="card-section-title">
            <h2>Your Company Details</h2>
            <p class="muted small">These details appear in the header of your generated Sales Invoices.</p>
          </div>
          <form class="setup-form" @submit.prevent="saveCompany">
            <div class="form-grid">
              <label class="span-2">Company Name
                <input v-model="company.company_name" placeholder="e.g. Acme Corp Solutions" required>
              </label>
              <label class="span-2">Business Address
                <textarea v-model="company.company_address" rows="3" placeholder="Street, City, State, ZIP" required></textarea>
              </label>
              <label>Business Email
                <input v-model="company.company_email" type="email" placeholder="billing@acme.com">
              </label>
              <label>Business Phone
                <input v-model="company.company_phone" placeholder="+1 (555) 000-0000">
              </label>
              <label>Tax ID / GST Number
                <input v-model="company.tax_id" placeholder="e.g. VAT123456">
              </label>
            </div>
            <div class="form-actions">
              <span v-if="saved" class="save-status">Settings saved!</span>
              <button type="submit" class="button">Save Company Information</button>
            </div>
          </form>
        </div>
      </section>

      <!-- Exchange Rates Tab -->
      <section v-if="activeTab === 'rates'" class="exchange-rates-setup">
        <div class="record-card shadow-premium" style="border-radius: 12px; border: 1px solid var(--line); background: var(--surface); box-shadow: 0 4px 20px -2px rgba(120, 113, 108, 0.05); padding: 24px; transition: all 0.3s ease;">
          <div class="card-section-title" style="display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid var(--line);">
            <h2 style="font-size: 15px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; margin: 0;">Currency Exchange Rates</h2>
            <p class="muted small" style="font-size: 12px; color: var(--muted); margin: 4px 0 0 0;">Configure exchange rates on a default and monthly basis. Base currency is USD (Default = 1.00).</p>
          </div>
          
          <div class="setup-form" style="margin-top: 16px;">
            <!-- Default Rates Card -->
            <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
              <label style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: var(--muted);">
                Default USD Rate
                <input type="number" value="1" disabled style="padding: 10px 14px; border: 1.5px solid var(--line); border-radius: 8px; font-size: 15px; background: #e2e8f0; opacity: 0.7; color: var(--primary);">
              </label>
              <label style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: var(--muted);">
                Default INR Rate (1 USD = X INR)
                <input type="number" v-model.number="ratesConfig.INR.default" step="0.01" min="1" required style="padding: 10px 14px; border: 1.5px solid var(--line); border-radius: 8px; font-size: 15px; background: #ffffff; color: var(--primary);">
              </label>
            </div>

            <!-- Monthly Overrides Section -->
            <div class="monthly-overrides-section">
              <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; background: none; border-bottom: 1.5px solid var(--line); margin-bottom: 16px;">
                <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: var(--muted); margin: 0;">Monthly Rates Overrides</h3>
                <button type="button" class="button secondary small" style="padding: 8px 16px; border: 1px solid var(--line); border-radius: 8px; background: none; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;" @click="addMonthlyRow">Add Monthly Override</button>
              </div>

              <div v-if="Object.keys(ratesConfig.INR.monthly).length === 0" class="empty-state" style="text-align: center; padding: 24px; background: #f8fafc; border-radius: 8px; color: var(--muted); font-style: italic;">
                No monthly overrides added yet. Default rates will apply.
              </div>
              
              <div v-else class="monthly-rows-container" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
                <div v-for="(rate, month) in ratesConfig.INR.monthly" :key="month" class="monthly-override-row" style="display: flex; align-items: center; gap: 16px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--line);">
                  <div style="flex: 1;">
                    <label style="font-size: 12px; color: var(--muted); font-weight: 700; display: block; margin-bottom: 4px;">Month</label>
                    <input type="month" :value="month" disabled style="width: 100%; padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; background: #e2e8f0; font-size: 14px; font-weight: 700;">
                  </div>
                  <div style="flex: 1;">
                    <label style="font-size: 12px; color: var(--muted); font-weight: 700; display: block; margin-bottom: 4px;">1 USD = X INR</label>
                    <input type="number" v-model.number="ratesConfig.INR.monthly[month]" step="0.01" min="1" style="width: 100%; padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; background: #ffffff; font-size: 14px; font-weight: 700; color: var(--primary);">
                  </div>
                  <button type="button" class="button secondary small" style="margin-top: 20px; color: #dc2626; border-color: #fca5a5; background: #fef2f2;" @click="deleteMonthlyRow(month)">Remove</button>
                </div>
              </div>
            </div>

            <!-- Add New Monthly Override Panel (inline) -->
            <div v-if="showAddMonthly" class="add-monthly-inline-panel" style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #b45309;">Add Monthly Rate Override</h4>
              <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 16px; align-items: flex-end;">
                <label style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: var(--muted);">
                  Target Month
                  <input type="month" v-model="newOverrideMonth" style="padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; background: #ffffff; font-size: 14px;">
                </label>
                <label style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: var(--muted);">
                  1 USD = X INR
                  <input type="number" v-model.number="newOverrideRate" step="0.01" min="1" placeholder="95.00" style="padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; background: #ffffff; font-size: 14px;">
                </label>
                <div style="display: flex; gap: 8px; margin-bottom: 4px;">
                  <button type="button" class="button" style="padding: 8px 16px; background: var(--primary); color: #ffffff; border-radius: 6px; border: none; font-weight: 700; cursor: pointer;" @click="saveNewMonthlyOverride">Add</button>
                  <button type="button" class="button secondary" style="padding: 8px 16px; background: none; border: 1px solid var(--line); border-radius: 6px; font-weight: 700; cursor: pointer;" @click="showAddMonthly = false">Cancel</button>
                </div>
              </div>
            </div>

            <div class="form-actions" style="margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: flex-end;">
              <span v-if="ratesSaved" class="save-status" style="color: #16a34a; font-weight: 700; margin-right: 16px;">Exchange rates saved!</span>
              <button type="button" class="button" style="padding: 10px 20px; background: var(--primary); color: #ffffff; border-radius: 8px; border: none; font-weight: 750; cursor: pointer;" @click="saveRates">Save Exchange Rates</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Object Manager Tab -->
      <section v-if="activeTab === 'objects'" class="object-manager">
        <div class="setup-grid">
          <div v-for="obj in objects" :key="obj.id" class="setup-tile" @click="editObject(obj.api_name)">
            <strong>{{ obj.label }}</strong>
            <span class="muted small">{{ obj.api_name }}</span>
            <p class="description">{{ obj.description || 'No description provided.' }}</p>
          </div>
        </div>
      </section>
      
      <!-- Roles / Profiles Tab -->
      <section v-if="activeTab === 'roles'" class="roles-manager">
        <div class="table-container shadow-premium">
          <div class="panel-header">
            <h2>Profiles</h2>
            <button class="button secondary" @click="showNewRoleModal = true">New Profile</button>
          </div>
          <table class="record-table">
            <thead>
              <tr>
                <th>Profile Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in roles" :key="role.id">
                <td><strong>{{ role.name }}</strong></td>
                <td>{{ role.description }}</td>
                <td class="table-actions">
                  <a href="#" @click.prevent="manageSecurity(role)">Manage Security</a>
                  <template v-if="role.name !== 'System Administrator'">
                    <a href="#" @click.prevent="editRole(role)">Edit</a>
                    <a href="#" class="text-danger" @click.prevent="deleteRole(role)">Delete</a>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- User Management Tab -->
      <section v-if="activeTab === 'users'" class="user-manager">
        <div class="table-container shadow-premium">
          <div class="panel-header">
            <h2>Users</h2>
            <button class="button secondary" @click="openNewUserModal">New User</button>
          </div>
          <table class="record-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td><strong>{{ u.full_name }}</strong></td>
                <td>{{ u.email }}</td>
                <td>{{ u.role_name }}</td>
                <td><span class="pill" :class="u.is_active ? 'status-success' : 'status-muted'">{{ u.is_active ? 'Active' : 'Inactive' }}</span></td>
                <td class="table-actions">
                  <a href="#" @click.prevent="openEditUserModal(u)">Edit</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- FLS Security Modal (Object List) -->
      <div v-if="selectedRoleForSecurity" class="modal-overlay" @click="selectedRoleForSecurity = null">
        <div class="modal-content large" @click.stop>
          <div class="modal-header">
            <h2>Security for {{ selectedRoleForSecurity.name }}</h2>
            <button class="modal-close" @click="selectedRoleForSecurity = null">&times;</button>
          </div>
          <div class="modal-body p-24">
            <p class="muted mb-16">Select an object to configure Field Level Security (FLS) for this profile.</p>
            <div class="setup-grid">
              <div v-for="obj in objects" :key="obj.id" class="setup-tile" @click="configureFLS(selectedRoleForSecurity.id, obj)">
                <strong>{{ obj.label }}</strong>
                <span class="muted small">{{ obj.field_count }} fields</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FLS Field Config Modal -->
      <div v-if="flsConfig" class="modal-overlay" @click="flsConfig = null">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>FLS: {{ flsConfig.object.label }}</h2>
            <p class="muted small">Configuring for {{ flsConfig.roleName }}</p>
            <button class="modal-close" @click="flsConfig = null">&times;</button>
          </div>
          <div class="modal-body p-24">
            <table class="record-table compact">
              <thead>
                <tr>
                  <th>Field</th>
                  <th class="center">View</th>
                  <th class="center">Edit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in flsConfig.fields" :key="f.id">
                  <td><strong>{{ f.label }}</strong> <span class="muted small">{{ f.api_name }}</span></td>
                  <td class="center"><input type="checkbox" v-model="f.can_view"></td>
                  <td class="center"><input type="checkbox" v-model="f.can_edit"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer p-24 action-row">
             <button class="button secondary" @click="flsConfig = null">Cancel</button>
             <button class="button" @click="saveFLS">Save Permissions</button>
          </div>
        </div>
      </div>

      <!-- New Role Modal -->
      <div v-if="showNewRoleModal" class="modal-overlay" @click="showNewRoleModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ newRole.id ? 'Edit Profile' : 'New Profile' }}</h2>
            <button class="modal-close" @click="showNewRoleModal = false">&times;</button>
          </div>
          <form class="modal-form p-24" @submit.prevent="saveRole">
            <div class="form-grid single-column">
              <label>Profile Name <input v-model="newRole.name" required></label>
              <label>Description <textarea v-model="newRole.description" rows="3"></textarea></label>
            </div>
            <div class="form-actions mt-16">
              <button type="button" class="button secondary" @click="showNewRoleModal = false">Cancel</button>
              <button type="submit" class="button">{{ newRole.id ? 'Save Profile' : 'Create Profile' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- User Modal -->
      <div v-if="showUserModal" class="modal-overlay" @click="showUserModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ userForm.id ? 'Edit User' : 'New User' }}</h2>
            <button class="modal-close" @click="showUserModal = false">&times;</button>
          </div>
          <form class="modal-form p-24" @submit.prevent="saveUser">
            <div class="form-grid single-column">
              <label>Full Name<input v-model="userForm.full_name" required></label>
              <label>Email<input v-model="userForm.email" type="email" required></label>
              <label v-if="!userForm.id">Password<input v-model="userForm.password" type="password" required minlength="6"></label>
              <label>Role
                <select v-model="userForm.role_id">
                  <option value="">No role</option>
                  <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
                </select>
              </label>
              <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px;">
                <input v-model="userForm.is_active" type="checkbox"> Active
              </label>
              <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px;">
                <input v-model="userForm.has_treasury_access" type="checkbox"> Has Treasury Access
              </label>
              <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px;">
                <input v-model="userForm.has_finance_access" type="checkbox"> Has Finance Access
              </label>
            </div>
            <div class="form-actions mt-16">
              <button type="button" class="button secondary" @click="showUserModal = false">Cancel</button>
              <button type="submit" class="button">Save User</button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client'

const router = useRouter()
const activeTab = ref('objects')
const objects = ref([])
const roles = ref([])
const users = ref([])
const company = reactive({
  company_name: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  tax_id: ''
})
const saved = ref(false)

// Exchange Rates config
const ratesConfig = reactive({
  INR: {
    default: 95.0,
    monthly: {}
  }
})
const ratesSaved = ref(false)
const showAddMonthly = ref(false)
const newOverrideMonth = ref('')
const newOverrideRate = ref(95.0)

// New Role
const showNewRoleModal = ref(false)
const newRole = reactive({ id: null, name: '', description: '' })

// User Modal
const showUserModal = ref(false)
const userForm = reactive({ id: null, full_name: '', email: '', password: '', role_id: '', is_active: true, has_treasury_access: false, has_finance_access: false })

// FLS
const selectedRoleForSecurity = ref(null)
const flsConfig = ref(null)

onMounted(async () => {
  loadData()
})

async function loadData() {
  // Load Objects
  const objData = await apiGet('/api/setup/objects')
  objects.value = objData.objects

  // Load Roles
  const rolesData = await apiGet('/api/setup/roles')
  roles.value = rolesData.roles

  // Load Users
  const usersData = await apiGet('/api/setup/users')
  users.value = usersData.users

  // Load Company Info
  const companyData = await apiGet('/api/settings/company')
  if (companyData.settings) {
    Object.assign(company, companyData.settings)
  }

  // Load Exchange Rates
  try {
    const ratesData = await apiGet('/api/settings/exchange-rates')
    if (ratesData && ratesData.INR) {
      ratesConfig.INR.default = ratesData.INR.default || 95.0
      ratesConfig.INR.monthly = ratesData.INR.monthly || {}
    }
  } catch (err) {
    console.error("Failed to load exchange rates", err)
  }
}

async function saveCompany() {
  await apiPost('/api/settings/company', company)
  saved.value = true
  setTimeout(() => { saved.value = false }, 3000)
}

async function saveRole() {
  if (newRole.id) {
    await apiPut(`/api/setup/roles/${newRole.id}`, newRole)
  } else {
    await apiPost('/api/setup/roles', newRole)
  }
  showNewRoleModal.value = false
  Object.assign(newRole, { id: null, name: '', description: '' })
  loadData()
}

function editRole(role) {
  Object.assign(newRole, role)
  showNewRoleModal.value = true
}

async function deleteRole(role) {
  if (confirm(`Are you sure you want to delete the profile "${role.name}"?`)) {
    try {
      await apiDelete(`/api/setup/roles/${role.id}`)
      loadData()
    } catch (e) {
      alert(e.message)
    }
  }
}

function openNewUserModal() {
  Object.assign(userForm, { id: null, full_name: '', email: '', password: '', role_id: '', is_active: true, has_treasury_access: false, has_finance_access: false })
  showUserModal.value = true
}

function openEditUserModal(user) {
  Object.assign(userForm, {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    password: '',
    role_id: user.role_id || '',
    is_active: !!user.is_active,
    has_treasury_access: !!user.has_treasury_access,
    has_finance_access: !!user.has_finance_access
  })
  showUserModal.value = true
}

async function saveUser() {
  const payload = { ...userForm }
  if (!userForm.id) {
    await apiPost('/api/setup/users', payload)
  } else {
    delete payload.password
    await apiPut(`/api/setup/users/${userForm.id}`, payload)
  }
  showUserModal.value = false
  loadData()
}

function manageSecurity(role) {
  selectedRoleForSecurity.value = role
}

async function configureFLS(roleId, obj) {
  const data = await apiGet(`/api/setup/roles/${roleId}/security/${obj.id}`)
  flsConfig.value = {
    roleId,
    roleName: selectedRoleForSecurity.value.name,
    object: obj,
    fields: data.fields.map(f => ({ ...f, can_view: !!f.can_view, can_edit: !!f.can_edit }))
  }
}

async function saveFLS() {
  await apiPost(`/api/setup/roles/${flsConfig.value.roleId}/security/${flsConfig.value.object.id}`, {
    fields: flsConfig.value.fields.map(f => ({
      id: f.id,
      can_view: f.can_view,
      can_edit: f.can_edit
    }))
  })
  flsConfig.value = null
  selectedRoleForSecurity.value = null
}

function editObject(apiName) {
  router.push(`/setup/objects/${apiName}`)
}

function addMonthlyRow() {
  newOverrideMonth.value = new Date().toISOString().substring(0, 7) // default YYYY-MM
  newOverrideRate.value = ratesConfig.INR.default
  showAddMonthly.value = true
}

function saveNewMonthlyOverride() {
  if (!newOverrideMonth.value) return
  ratesConfig.INR.monthly[newOverrideMonth.value] = newOverrideRate.value || ratesConfig.INR.default
  showAddMonthly.value = false
}

function deleteMonthlyRow(month) {
  delete ratesConfig.INR.monthly[month]
}

async function saveRates() {
  await apiPost('/api/settings/exchange-rates', ratesConfig)
  ratesSaved.value = true
  setTimeout(() => { ratesSaved.value = false }, 3000)
}
</script>

<style scoped>
.setup-page {
  max-width: 1200px;
  margin: 0 auto;
}

.setup-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 2px;
}

.setup-tabs button {
  background: none;
  border: none;
  padding: 12px 24px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  position: relative;
}

.setup-tabs button.active {
  color: var(--primary);
}

.setup-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--primary);
}

.setup-form {
  margin-top: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
  background: #f8fafc;
}

.panel-header h2 { margin: 0; font-size: 18px; }

.table-container {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}

.description {
  font-size: 13px;
  margin-top: 8px;
}

.save-status {
  color: #166534;
  font-weight: 700;
  margin-right: 16px;
}

.empty-state {
  text-align: center;
  padding: 48px;
  background: var(--surface-soft);
  border-radius: 12px;
  color: var(--muted);
}

.p-24 { padding: 24px; }
.mb-16 { margin-bottom: 16px; }
.mt-16 { margin-top: 16px; }
.center { text-align: center; }

.modal-content.large {
  max-width: 900px;
}

.compact td, .compact th {
  padding: 10px 16px;
}
</style>
