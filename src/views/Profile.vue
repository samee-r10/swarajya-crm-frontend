<template>
  <div class="profile-page">
    <section class="page-header">
      <div>
        <p class="eyebrow">My Account</p>
        <h1>Profile Settings</h1>
        <p class="muted">Manage your personal information and account preferences.</p>
      </div>
    </section>

    <div class="profile-grid">
      <section class="profile-main">
        <div class="panel">
          <div class="panel-header">
            <h2>Personal Information</h2>
            <RouterLink v-if="user?.id" :to="`/setup/users/${user.id}/edit`" class="button secondary">Edit Details</RouterLink>
          </div>
          <div class="detail-list">
            <div class="detail-item">
              <label>Full Name</label>
              <p>{{ user?.full_name || 'Not provided' }}</p>
            </div>
            <div class="detail-item">
              <label>Email Address</label>
              <p>{{ user?.email || 'Not provided' }}</p>
            </div>
            <div class="detail-item">
              <label>Role / Profile</label>
              <p><span class="pill">{{ user?.role_name || 'No role assigned' }}</span></p>
            </div>
            <div class="detail-item">
              <label>Account Status</label>
              <p>
                <span class="pill status" :style="user?.is_active ? '' : 'background: #fee2e2; color: #991b1b;'">
                  {{ user?.is_active ? 'Active' : 'Inactive' }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div class="panel security-panel">
          <h2>Change Password</h2>
          <p class="muted" style="margin-bottom: 16px;">Update your account password. Ensure it follows security requirements.</p>
          <form class="change-password-form" @submit.prevent="changePassword">
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <label style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: var(--muted);">
                Current Password
                <input v-model="passForm.current_password" type="password" required style="padding: 10px 14px; border: 1.5px solid var(--line); border-radius: 8px; font-size: 15px; background: #ffffff; color: var(--primary);">
              </label>
              <label style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: var(--muted);">
                New Password
                <input v-model="passForm.new_password" type="password" required style="padding: 10px 14px; border: 1.5px solid var(--line); border-radius: 8px; font-size: 15px; background: #ffffff; color: var(--primary);">
                <span class="password-hint">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char</span>
              </label>
              <label style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: var(--muted);">
                Confirm New Password
                <input v-model="passForm.confirm_password" type="password" required style="padding: 10px 14px; border: 1.5px solid var(--line); border-radius: 8px; font-size: 15px; background: #ffffff; color: var(--primary);">
              </label>
            </div>
            <div class="form-actions mt-16" style="display: flex; align-items: center; justify-content: flex-end; gap: 16px; margin-top: 24px;">
              <span v-if="passSuccess" class="save-status" style="color: #16a34a; font-weight: 700;">{{ passSuccess }}</span>
              <span v-if="passError" class="save-status" style="color: #dc2626; font-weight: 700;">{{ passError }}</span>
              <button type="submit" class="button" :disabled="passLoading" style="padding: 10px 20px; background: var(--primary); color: #ffffff; border-radius: 8px; border: none; font-weight: 750; cursor: pointer;">
                {{ passLoading ? 'Updating...' : 'Update Password' }}
              </button>
            </div>
          </form>
        </div>
      </section>

      <aside class="profile-sidebar">
        <div class="panel logout-panel">
          <h3>Session</h3>
          <p class="muted">Currently logged in as <strong>{{ user?.email }}</strong></p>
          <button class="button danger" @click="handleLogout">Logout from System</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { apiPost } from '../api/client'

const router = useRouter()
const user = ref(null)

onMounted(() => {
  const storedUser = window.localStorage.getItem('lms_user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch (e) {
      console.error('Failed to parse user data', e)
    }
  }
})

const passForm = reactive({ current_password: '', new_password: '', confirm_password: '' })
const passLoading = ref(false)
const passSuccess = ref('')
const passError = ref('')

function validateLocal() {
  if (passForm.new_password !== passForm.confirm_password) {
    return "New passwords do not match."
  }
  if (passForm.new_password.length < 8) {
    return "Password must be at least 8 characters long."
  }
  if (!/[A-Z]/.test(passForm.new_password)) {
    return "Password must contain at least one uppercase letter."
  }
  if (!/[a-z]/.test(passForm.new_password)) {
    return "Password must contain at least one lowercase letter."
  }
  if (!/\d/.test(passForm.new_password)) {
    return "Password must contain at least one number."
  }
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(passForm.new_password)) {
    return "Password must contain at least one special character."
  }
  return null
}

async function changePassword() {
  passError.value = ''
  passSuccess.value = ''
  
  const localError = validateLocal()
  if (localError) {
    passError.value = localError
    return
  }
  
  passLoading.value = true
  try {
    await apiPost('/api/auth/change-password', {
      current_password: passForm.current_password,
      new_password: passForm.new_password
    })
    passSuccess.value = 'Password updated successfully!'
    Object.assign(passForm, { current_password: '', new_password: '', confirm_password: '' })
    setTimeout(() => { passSuccess.value = '' }, 3000)
  } catch (err) {
    passError.value = err.message
  } finally {
    passLoading.value = false
  }
}

async function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    await apiPost('/api/auth/logout')
    window.localStorage.removeItem('lms_user')
    router.push({ name: 'login' })
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  align-items: start;
}

.detail-list {
  display: grid;
  gap: 24px;
  padding: 8px 0;
}

.detail-item label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 6px;
}

.detail-item p {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.security-panel {
  margin-top: 24px;
}

.info-box {
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  font-size: 14px;
  color: var(--muted);
}

.logout-panel {
  display: grid;
  gap: 16px;
}

.password-hint {
  display: block;
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
  line-height: 1.4;
  font-weight: 500;
}

.button.danger {
  background: #ef4444;
  border-color: #ef4444;
}

.button.danger:hover {
  background: #dc2626;
}

@media (max-width: 900px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
