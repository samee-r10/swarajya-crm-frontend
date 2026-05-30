<template>
  <main class="login-page">
    <section class="brand-panel">
      <div class="brand-content">
        <div class="brand-logo-wrap">
          <img src="/logo.png" alt="Swarajya Logo" class="brand-logo" />
        </div>

        <div class="brand-copy">
          <h1>Your Vision. Our Code.</h1>
          <p>A focused CRM workspace for opportunities, projects, finance, and treasury operations.</p>
        </div>

        <div class="feature-pills">
          <span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
            </svg>
            Secure
          </span>
          <span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m13 2-9 13h8l-1 7 9-13h-8l1-7Z"/>
            </svg>
            Fast
          </span>
          <span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>
            </svg>
            Unified
          </span>
        </div>

        <p class="copyright">&copy; 2026 Swarajya CRM. All rights reserved.</p>
      </div>
    </section>

    <section class="form-panel">
      <form class="login-card" @submit.prevent="submit">
        <div class="mobile-brand">
          <img src="/logo.png" alt="Swarajya Logo" />
        </div>

        <div class="form-heading">
          <h2>Sign In</h2>
          <p>Welcome back! Please enter your details.</p>
        </div>

        <label class="field">
          <span>Email Address</span>
          <div class="input-shell">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"/>
              <path d="m22 6-10 7L2 6"/>
            </svg>
            <input
              v-model="form.email"
              type="email"
              autocomplete="username"
              placeholder="admin@swarajya.com"
              required
              autofocus
            >
          </div>
        </label>

        <label class="field">
          <span>Password</span>
          <div class="input-shell">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Password"
              required
            >
            <button type="button" class="password-toggle" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </label>

        <transition name="fade">
          <div v-if="error" class="login-alert">{{ error }}</div>
        </transition>

        <button class="submit-button" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Signing In...' : 'Sign In to CRM' }}</span>
          <svg v-if="!loading" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M5 12h14"/>
            <path d="m13 6 6 6-6 6"/>
          </svg>
        </button>

        <button class="forgot-link" type="button">Forgot password?</button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiPost } from '../api/client'

const router = useRouter()
const form = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.login-page {
  background: #f8fafc;
  display: grid;
  font-family: 'Inter', sans-serif;
  grid-template-columns: 1.18fr 0.82fr;
  min-height: 100vh;
}

.brand-panel {
  background:
    linear-gradient(135deg, rgba(238, 242, 247, 0.97), rgba(226, 232, 240, 0.96)),
    radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.72), transparent 36%);
  color: #0f172a;
  display: flex;
  min-height: 100vh;
  padding: 84px 72px;
}

.brand-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 760px;
  position: relative;
  width: 100%;
}

.brand-logo-wrap {
  align-items: center;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(203, 213, 225, 0.9);
  border-radius: 18px;
  display: inline-flex;
  justify-content: center;
  margin-bottom: 88px;
  padding: 18px 22px;
  width: fit-content;
}

.brand-logo {
  display: block;
  height: 72px;
  object-fit: contain;
  width: auto;
}

.brand-copy h1 {
  font-size: clamp(46px, 5.2vw, 78px);
  font-weight: 900;
  letter-spacing: -2px;
  line-height: 1.08;
  margin: 0;
  max-width: 820px;
}

.brand-copy p {
  color: #64748b;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.65;
  margin: 36px 0 0;
  max-width: 620px;
}

.feature-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 56px;
}

.feature-pills span {
  align-items: center;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(203, 213, 225, 0.9);
  border-radius: 999px;
  color: #334155;
  display: inline-flex;
  font-size: 15px;
  font-weight: 700;
  gap: 9px;
  padding: 11px 18px;
}

.copyright {
  bottom: -42px;
  color: #64748b;
  font-size: 14px;
  left: 0;
  margin: 0;
  position: absolute;
}

.form-panel {
  align-items: center;
  background: #f8fafc;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 48px;
}

.login-card {
  width: min(100%, 430px);
}

.mobile-brand {
  display: none;
  margin-bottom: 42px;
}

.mobile-brand img {
  height: 56px;
  object-fit: contain;
  width: auto;
}

.form-heading {
  margin-bottom: 42px;
}

.form-heading h2 {
  color: #0f172a;
  font-size: 42px;
  font-weight: 850;
  letter-spacing: -1px;
  line-height: 1;
  margin: 0 0 18px;
}

.form-heading p {
  color: #64748b;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.field {
  display: block;
  margin-bottom: 26px;
}

.field > span {
  color: #111827;
  display: block;
  font-size: 15px;
  font-weight: 800;
  margin-bottom: 12px;
}

.input-shell {
  align-items: center;
  background: #ffffff;
  border: 1.5px solid #dbe3ef;
  border-radius: 13px;
  display: flex;
  gap: 14px;
  min-height: 58px;
  padding: 0 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-shell:focus-within {
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08);
}

.input-shell svg {
  color: #64748b;
  flex-shrink: 0;
}

.input-shell input {
  background: transparent;
  border: 0;
  color: #111827;
  flex: 1;
  font-size: 17px;
  font-weight: 500;
  min-width: 0;
  outline: 0;
  padding: 0;
}

.input-shell input::placeholder {
  color: #777e8a;
}

.password-toggle {
  background: transparent;
  border: 0;
  color: #4f46e5;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  padding: 4px;
}

.login-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #991b1b;
  font-size: 14px;
  font-weight: 700;
  margin: -4px 0 22px;
  padding: 13px 15px;
}

.submit-button {
  align-items: center;
  background: #5548e8;
  border: 0;
  border-radius: 13px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  font-size: 17px;
  font-weight: 850;
  gap: 12px;
  justify-content: center;
  min-height: 64px;
  width: 100%;
}

.submit-button:hover:not(:disabled) {
  background: #4638d8;
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.forgot-link {
  background: transparent;
  border: 0;
  color: #4f46e5;
  cursor: pointer;
  display: block;
  font-size: 16px;
  font-weight: 750;
  margin: 30px auto 0;
}

.spinner {
  animation: spin 0.8s linear infinite;
  border: 2.5px solid rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  border-top-color: #ffffff;
  height: 18px;
  width: 18px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 980px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    display: none;
  }

  .form-panel {
    padding: 28px;
  }

  .mobile-brand {
    display: block;
  }
}

@media (max-width: 480px) {
  .form-panel {
    padding: 22px;
  }

  .form-heading h2 {
    font-size: 34px;
  }

  .input-shell {
    min-height: 54px;
  }
}
</style>
