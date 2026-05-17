<template>
  <main class="vue-auth-page">
    <section class="vue-auth-card">
      <div class="vue-auth-brand">
        <img src="/logo.png" alt="Company Logo" class="brand-logo vue-auth-mark" />
        <div>
          <p>Sales, projects, and finance in one workspace.</p>
        </div>
      </div>
      <div class="vue-auth-copy">
        <p class="eyebrow">Secure Access</p>
        <h2>Welcome Back</h2>
        <p class="muted">Sign in to continue to your CRM dashboard.</p>
      </div>
      <form class="auth-form" @submit.prevent="submit">
        <label>Email
          <input v-model="form.email" type="email" autocomplete="email" required autofocus>
        </label>
        <label>Password
          <input v-model="form.password" type="password" autocomplete="current-password" required>
        </label>
        <button class="button" type="submit" :disabled="loading">{{ loading ? 'Signing in...' : 'Sign In' }}</button>
        <p v-if="error" class="flash warning">{{ error }}</p>
      </form>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiPost } from '../api/client'

const router = useRouter()
const form = reactive({ email: 'admin@example.com', password: 'admin123' })
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const data = await apiPost('/api/auth/login', form)
    window.localStorage.setItem('lms_user', JSON.stringify(data.user))
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>
