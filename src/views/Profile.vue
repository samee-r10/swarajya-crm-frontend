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
          <h2>Security & Access</h2>
          <p class="muted">Your access level is determined by your profile: <strong>{{ user?.role_name }}</strong></p>
          <div class="info-box">
            <p>If you need to change your password or update your role permissions, please contact your System Administrator.</p>
          </div>
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
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiPost } from '../api/client'

const router = useRouter()
const user = ref(null)

onMounted(() => {
  const storedUser = window.localStorage.getItem('lms_user')
  if (storedUser) {
    try {
      user.ref = JSON.parse(storedUser)
      // Actually ref is not used correctly here, let's fix
      user.value = JSON.parse(storedUser)
    } catch (e) {
      console.error('Failed to parse user data', e)
    }
  }
})

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
