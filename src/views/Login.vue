<template>
  <main class="login-page">
    <section class="intro-panel" aria-label="CRM Portal introduction">
      <div class="intro-content">
        <div class="portal-badge">
          <span class="portal-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"/>
              <path d="m8.5 10 3.5 2 3.5-2"/>
              <path d="M12 12v4"/>
            </svg>
          </span>
          <span>CRM Portal</span>
        </div>

        <div class="intro-copy">
          <p class="eyebrow">Enterprise workspace</p>
          <h1>Manage leads, customers, deals and business operations from one secure workspace.</h1>
          <p>Sign in once and your organisation workspace is selected automatically from your email domain.</p>
        </div>

        <p class="copyright">&copy; 2026 CRM Portal. All rights reserved.</p>
      </div>
    </section>

    <section class="form-panel">
      <form class="login-card" @submit.prevent="submit">
        <div class="card-topline">
          <span class="card-mark" aria-hidden="true">CP</span>
          <span>CRM Portal</span>
        </div>

        <div class="form-heading">
          <h2>Welcome Back</h2>
          <p>Sign in with your organisation email</p>
        </div>

        <label class="field">
          <span>Email address</span>
          <div class="input-shell">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"/>
              <path d="m22 6-10 7L2 6"/>
            </svg>
            <input
              v-model="form.email"
              type="email"
              autocomplete="username"
              placeholder="you@organisation.com"
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
          <span>{{ loading ? 'Signing in...' : 'Sign in to workspace' }}</span>
          <svg v-if="!loading" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M5 12h14"/>
            <path d="m13 6 6 6-6 6"/>
          </svg>
        </button>

        <div class="login-footer">
          <button class="forgot-link" type="button">Forgot password?</button>
          <p>Your workspace will be selected automatically based on your email domain.</p>
        </div>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.login-page {
  background:
    radial-gradient(circle at 18% 18%, rgba(96, 165, 250, 0.24), transparent 30%),
    radial-gradient(circle at 78% 12%, rgba(20, 184, 166, 0.18), transparent 28%),
    linear-gradient(135deg, #eef4ff 0%, #f7fafc 46%, #edf7f5 100%);
  display: grid;
  font-family: 'Inter', sans-serif;
  grid-template-columns: minmax(0, 1.08fr) minmax(460px, 0.92fr);
  min-height: 100svh;
  overflow: hidden;
}

.intro-panel {
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.88)),
    radial-gradient(circle at 18% 22%, rgba(59, 130, 246, 0.55), transparent 34%),
    radial-gradient(circle at 80% 72%, rgba(20, 184, 166, 0.34), transparent 30%);
  color: #f8fafc;
  display: flex;
  min-height: 100svh;
  overflow: hidden;
  padding: clamp(34px, 4.2vw, 56px);
  position: relative;
}

.intro-panel::before,
.intro-panel::after {
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 999px;
  content: "";
  position: absolute;
}

.intro-panel::before {
  height: 520px;
  left: -160px;
  top: -120px;
  width: 520px;
}

.intro-panel::after {
  bottom: -180px;
  height: 620px;
  right: -220px;
  width: 620px;
}

.intro-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 720px;
  min-height: 0;
  position: relative;
  width: 100%;
  z-index: 1;
}

.portal-badge,
.card-topline {
  align-items: center;
  display: inline-flex;
  gap: 10px;
}

.portal-badge {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  color: #dbeafe;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.2px;
  padding: 10px 14px 10px 10px;
  width: fit-content;
}

.portal-mark,
.card-mark {
  align-items: center;
  border-radius: 12px;
  display: inline-flex;
  flex-shrink: 0;
  height: 34px;
  justify-content: center;
  width: 34px;
}

.portal-mark {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
}

.intro-copy {
  margin-top: clamp(34px, 5.4vh, 58px);
}

.eyebrow {
  color: #93c5fd;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 14px;
  text-transform: uppercase;
}

.intro-copy h1 {
  font-size: clamp(36px, 4.2vw, 58px);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.05;
  margin: 0;
  max-width: 820px;
}

.intro-copy p:last-child {
  color: #cbd5e1;
  font-size: 17px;
  font-weight: 500;
  line-height: 1.58;
  margin: 22px 0 0;
  max-width: 620px;
}

.copyright {
  bottom: 0;
  color: #cbd5e1;
  font-size: 13px;
  left: 0;
  margin: 0;
  position: absolute;
}

.form-panel {
  align-items: center;
  background: rgba(255, 255, 255, 0.54);
  backdrop-filter: blur(22px);
  display: flex;
  justify-content: center;
  min-height: 100svh;
  padding: clamp(24px, 4vw, 44px);
}

.login-card {
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 24px;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.14), 0 8px 24px rgba(15, 23, 42, 0.08);
  padding: 32px;
  width: min(100%, 432px);
}

.card-topline {
  color: #334155;
  font-size: 14px;
  font-weight: 850;
  margin-bottom: 26px;
}

.card-mark {
  background: linear-gradient(135deg, #2563eb, #14b8a6);
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
}

.form-heading {
  margin-bottom: 26px;
}

.form-heading h2 {
  color: #0f172a;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1;
  margin: 0 0 12px;
}

.form-heading p {
  color: #64748b;
  font-size: 15px;
  font-weight: 500;
  margin: 0;
}

.field {
  display: block;
  margin-bottom: 18px;
}

.field > span {
  color: #1e293b;
  display: block;
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 10px;
}

.input-shell {
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #d9e2ef;
  border-radius: 16px;
  display: flex;
  gap: 12px;
  min-height: 54px;
  padding: 0 17px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.input-shell:focus-within {
  background: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
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
  font-size: 16px;
  font-weight: 500;
  min-width: 0;
  outline: 0;
  padding: 0;
}

.input-shell input::placeholder {
  color: #94a3b8;
}

.password-toggle {
  background: transparent;
  border: 0;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  padding: 4px;
}

.login-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 14px;
  color: #991b1b;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  margin: -2px 0 20px;
  padding: 12px 14px;
}

.submit-button {
  align-items: center;
  background: linear-gradient(135deg, #2563eb, #0f766e);
  border: 0;
  border-radius: 16px;
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.24);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  font-size: 16px;
  font-weight: 850;
  gap: 12px;
  justify-content: center;
  min-height: 56px;
  transition: box-shadow 0.2s ease, transform 0.2s ease, filter 0.2s ease;
  width: 100%;
}

.submit-button:hover:not(:disabled) {
  box-shadow: 0 20px 38px rgba(37, 99, 235, 0.3);
  filter: saturate(1.08);
  transform: translateY(-1px);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.forgot-link {
  background: transparent;
  border: 0;
  color: #2563eb;
  cursor: pointer;
  display: block;
  font-size: 14px;
  font-weight: 800;
  margin: 0 auto 12px;
}

.login-footer {
  color: #64748b;
  font-size: 13px;
  font-weight: 550;
  line-height: 1.55;
  margin-top: 20px;
  text-align: center;
}

.login-footer p {
  margin: 0 auto;
  max-width: 330px;
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
    min-height: 100svh;
    overflow: auto;
  }

  .intro-panel {
    min-height: auto;
    padding: 34px 28px 22px;
  }

  .intro-content {
    max-width: none;
  }

  .intro-copy {
    margin-top: 32px;
  }

  .intro-copy h1 {
    font-size: 34px;
    max-width: 720px;
  }

  .intro-copy p:last-child {
    font-size: 16px;
    margin-top: 18px;
  }

  .copyright {
    margin-top: 26px;
    position: static;
  }

  .form-panel {
    background: transparent;
    min-height: auto;
    padding: 26px 28px 34px;
  }
}

@media (min-width: 981px) and (max-height: 760px) {
  .intro-panel {
    padding: 30px 44px;
  }

  .portal-badge {
    padding: 8px 12px 8px 8px;
  }

  .intro-copy {
    margin-top: 28px;
  }

  .intro-copy h1 {
    font-size: clamp(32px, 3.6vw, 46px);
    max-width: 680px;
  }

  .intro-copy p:last-child {
    font-size: 15px;
    margin-top: 16px;
  }

  .login-card {
    padding: 28px;
  }

  .card-topline,
  .form-heading {
    margin-bottom: 22px;
  }

  .form-heading h2 {
    font-size: 30px;
  }

  .input-shell {
    min-height: 50px;
  }

  .submit-button {
    min-height: 52px;
  }

  .login-footer {
    margin-top: 16px;
  }
}

@media (prefers-color-scheme: dark) {
  .login-page {
    background:
      radial-gradient(circle at 18% 18%, rgba(37, 99, 235, 0.24), transparent 30%),
      radial-gradient(circle at 78% 12%, rgba(20, 184, 166, 0.16), transparent 28%),
      linear-gradient(135deg, #020617 0%, #0f172a 52%, #082f2d 100%);
  }

  .form-panel {
    background: rgba(2, 6, 23, 0.22);
  }

  .login-card {
    background: rgba(15, 23, 42, 0.82);
    border-color: rgba(148, 163, 184, 0.22);
    box-shadow: 0 28px 70px rgba(0, 0, 0, 0.34);
  }

  .card-topline,
  .field > span,
  .form-heading h2 {
    color: #f8fafc;
  }

  .form-heading p,
  .login-footer {
    color: #cbd5e1;
  }

  .input-shell {
    background: rgba(15, 23, 42, 0.72);
    border-color: rgba(148, 163, 184, 0.26);
  }

  .input-shell:focus-within {
    background: rgba(15, 23, 42, 0.95);
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.16);
  }

  .input-shell input {
    color: #f8fafc;
  }
}

@media (max-width: 480px) {
  .intro-panel {
    padding: 26px 22px 18px;
  }

  .intro-copy h1 {
    font-size: 28px;
  }

  .form-panel {
    padding: 22px;
  }

  .login-card {
    border-radius: 22px;
    padding: 28px 22px;
  }

  .form-heading h2 {
    font-size: 30px;
  }

  .input-shell {
    min-height: 54px;
  }
}
</style>
