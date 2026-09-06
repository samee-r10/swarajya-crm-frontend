<template>
  <main class="login-page" :class="{ 'festive-active': isFestiveEnabled }">
    <!-- LEFT PANEL: Brand & Festive Showcase -->
    <section class="brand-panel" :class="{ 'festive-brand-panel': isFestiveEnabled }">
      <div class="brand-content">
        <!-- Logo Wrap -->
        <div class="brand-logo-wrap" :class="{ 'festive-logo-wrap': isFestiveEnabled }">
          <img src="/logo.png" alt="Swarajya Consultancy Logo" class="brand-logo" />
        </div>

        <!-- Festive Mode Left Content -->
        <div v-if="isFestiveEnabled" class="festive-showcase">
          <div class="festive-badge">
            <span class="badge-sparkle">✨</span>
            <span class="badge-text">Festive Celebration</span>
            <span class="badge-dot"></span>
            <span class="badge-occasion">Ganesh Utsav</span>
          </div>

          <!-- Ganesh Utsav Vector Visual Component -->
          <GaneshUtsavVisual />

          <div class="festive-copy">
            <h1 class="festive-title">
              Happy Ganesh Utsav <span class="hibiscus-accent">🌺</span>
            </h1>
            <p class="festive-subhead">from Swarajya Consultancy</p>
            <div class="festive-quote-card">
              <p class="festive-quote-text">“May Lord Ganesha remove all obstacles and bestow wisdom, prosperity, and success upon your endeavors.”</p>
            </div>
          </div>
        </div>

        <!-- Standard Corporate Left Content (fallback when festive is disabled) -->
        <div v-else class="brand-copy">
          <h1>Your Vision. Our Code.</h1>
          <p>A focused CRM workspace for opportunities, projects, finance, and treasury operations.</p>
        </div>

        <p class="copyright">&copy; 2026 Swarajya Consultancy. All rights reserved.</p>
      </div>
    </section>

    <!-- RIGHT PANEL: Login Form -->
    <section class="form-panel">
      <form class="login-card" @submit.prevent="submit">
        <!-- Mobile Brand & Festive Banner -->
        <div class="mobile-brand-container">
          <div class="mobile-brand">
            <img src="/logo.png" alt="Swarajya Consultancy Logo" />
          </div>

          <!-- Mobile Compact Festive Greetings Header -->
          <div v-if="isFestiveEnabled" class="mobile-festive-banner">
            <div class="mobile-festive-chip">
              <span>✨ Happy Ganesh Utsav 🌺</span>
            </div>
            <p class="mobile-festive-sub">from <strong>Swarajya Consultancy</strong></p>
            <p class="mobile-festive-quote">“May Lord Ganesha remove all obstacles and bestow wisdom, prosperity, and success upon your endeavors.”</p>
          </div>
        </div>

        <!-- Form Heading -->
        <div class="form-heading">
          <div v-if="isFestiveEnabled" class="form-festive-kicker">
            <span class="kicker-pill">CRM Portal Access</span>
          </div>
          <h2>Sign In</h2>
          <p>Welcome back! Please enter your credentials to continue.</p>
        </div>

        <!-- Email Field -->
        <label class="field">
          <span>Email Address</span>
          <div class="input-shell">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"/>
              <path d="m22 6-10 7L2 6"/>
            </svg>
            <input
              v-model="form.email"
              type="email"
              autocomplete="username"
              placeholder="admin@swarajyaconsultancy.in"
              required
              autofocus
            >
          </div>
        </label>

        <!-- Password Field -->
        <label class="field">
          <div class="field-label-row">
            <span>Password</span>
          </div>
          <div class="input-shell">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••••••"
              required
            >
            <button type="button" class="password-toggle" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </label>

        <!-- Error Alert -->
        <transition name="fade">
          <div v-if="error" class="login-alert">{{ error }}</div>
        </transition>

        <!-- Submit Button -->
        <button class="submit-button" :class="{ 'festive-submit': isFestiveEnabled }" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Signing In...' : 'Sign In to CRM' }}</span>
          <svg v-if="!loading" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M5 12h14"/>
            <path d="m13 6 6 6-6 6"/>
          </svg>
        </button>

        <!-- Forgot Password -->
        <button class="forgot-link" type="button">Forgot password?</button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiPost } from '../api/client'
import GaneshUtsavVisual from '../components/GaneshUtsavVisual.vue'

// Temporary Festive Theme Feature Flag
// Set to `false` anytime to immediately revert to standard corporate theme
const isFestiveEnabled = ref(true)

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
    error.value = err.message || 'Login failed. Please verify your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');

.login-page {
  background: #f8fafc;
  display: grid;
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  grid-template-columns: 1.22fr 0.78fr;
  min-height: 100vh;
}

/* =========================================================
   BRAND PANEL (LEFT)
   ========================================================= */
.brand-panel {
  background:
    linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.96)),
    radial-gradient(circle at 25% 20%, rgba(255, 255, 255, 0.85), transparent 45%);
  color: #0f172a;
  display: flex;
  min-height: 100vh;
  padding: 64px 64px;
  position: relative;
  overflow: hidden;
}

/* Festive Left Panel Theme */
.brand-panel.festive-brand-panel {
  background:
    radial-gradient(circle at 10% 15%, rgba(249, 115, 22, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 90% 85%, rgba(251, 191, 36, 0.14) 0%, transparent 45%),
    radial-gradient(circle at 80% 20%, rgba(220, 38, 38, 0.1) 0%, transparent 40%),
    linear-gradient(145deg, #fff7ed 0%, #ffedd5 45%, #fef3c7 100%);
  border-right: 1px solid rgba(226, 232, 240, 0.7);
}

.brand-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  max-width: 680px;
  position: relative;
  width: 100%;
  z-index: 1;
}

.brand-logo-wrap {
  align-items: center;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(203, 213, 225, 0.8);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  display: inline-flex;
  justify-content: center;
  margin-bottom: 24px;
  padding: 14px 20px;
  width: fit-content;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.brand-logo-wrap.festive-logo-wrap {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(249, 115, 22, 0.4);
  box-shadow: 0 6px 24px rgba(234, 88, 12, 0.1);
}

.brand-logo {
  display: block;
  height: 52px;
  object-fit: contain;
  width: auto;
}

/* =========================================================
   FESTIVE SHOWCASE CONTENT
   ========================================================= */
.festive-showcase {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: auto 0;
  padding: 8px 0;
}

.festive-badge {
  align-items: center;
  background: linear-gradient(135deg, rgba(255, 237, 213, 0.95) 0%, rgba(254, 243, 199, 0.9) 100%);
  border: 1px solid rgba(249, 115, 22, 0.35);
  border-radius: 999px;
  box-shadow: 0 2px 12px rgba(234, 88, 12, 0.12);
  color: #c2410c;
  display: inline-flex;
  font-size: 13px;
  font-weight: 700;
  gap: 8px;
  letter-spacing: 0.2px;
  padding: 6px 16px;
  margin-bottom: 8px;
}

.badge-sparkle {
  font-size: 14px;
}

.badge-dot {
  background: #ea580c;
  border-radius: 50%;
  height: 4px;
  width: 4px;
}

.badge-occasion {
  color: #c2410c;
  font-weight: 800;
}

.festive-copy {
  margin-top: 6px;
  width: 100%;
}

.festive-title {
  color: #7c2d12;
  font-size: clamp(32px, 3.6vw, 46px);
  font-weight: 900;
  letter-spacing: -1.2px;
  line-height: 1.15;
  margin: 0 0 6px;
  background: linear-gradient(135deg, #7c2d12 0%, #ea580c 45%, #b91c1c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hibiscus-accent {
  -webkit-text-fill-color: initial;
  display: inline-block;
  font-size: 0.9em;
  animation: pulseFlower 2.5s ease-in-out infinite alternate;
}

@keyframes pulseFlower {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.12) rotate(6deg); }
  100% { transform: scale(1) rotate(-4deg); }
}

.festive-subhead {
  color: #c2410c;
  font-size: clamp(17px, 1.8vw, 22px);
  font-weight: 700;
  letter-spacing: -0.3px;
  margin: 0 0 20px;
}

.festive-quote-card {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(234, 88, 12, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  margin: 0 auto;
  max-width: 540px;
  padding: 16px 24px;
  position: relative;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.festive-quote-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 36px rgba(234, 88, 12, 0.14);
}

.quote-symbol {
  color: #f43f5e;
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  opacity: 0.4;
  margin-bottom: -10px;
}

.festive-quote-text {
  color: #475569;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 600;
  font-style: italic;
  line-height: 1.55;
  margin: 0;
}

/* =========================================================
   STANDARD BRAND COPY (WHEN FESTIVE OFF)
   ========================================================= */
.brand-copy h1 {
  color: #0f172a;
  font-size: clamp(40px, 4.5vw, 68px);
  font-weight: 900;
  letter-spacing: -2px;
  line-height: 1.1;
  margin: 0;
}

.brand-copy p {
  color: #64748b;
  font-size: 19px;
  font-weight: 500;
  line-height: 1.6;
  margin: 28px 0 0;
  max-width: 540px;
}

.copyright {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  margin: 24px 0 0;
}

/* =========================================================
   FORM PANEL (RIGHT)
   ========================================================= */
.form-panel {
  align-items: center;
  background: #ffffff;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 48px;
  box-shadow: -10px 0 35px rgba(0, 0, 0, 0.02);
}

.login-card {
  width: min(100%, 420px);
}

.mobile-brand-container {
  display: none;
}

.form-heading {
  margin-bottom: 34px;
}

.form-festive-kicker {
  margin-bottom: 10px;
}

.kicker-pill {
  background: #f1f5f9;
  border-radius: 6px;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.6px;
  padding: 3px 8px;
  text-transform: uppercase;
}

.form-heading h2 {
  color: #0f172a;
  font-size: 36px;
  font-weight: 850;
  letter-spacing: -0.8px;
  line-height: 1.1;
  margin: 0 0 10px;
}

.form-heading p {
  color: #64748b;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.45;
  margin: 0;
}

/* =========================================================
   INPUT FIELDS
   ========================================================= */
.field {
  display: block;
  margin-bottom: 22px;
}

.field-label-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 9px;
}

.field > span,
.field-label-row span {
  color: #1e293b;
  display: block;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.1px;
  margin-bottom: 9px;
}

.input-shell {
  align-items: center;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  min-height: 52px;
  padding: 0 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-shell:focus-within {
  background: #ffffff;
  border-color: #7c3aed;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
}

.input-shell svg {
  color: #94a3b8;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.input-shell:focus-within svg {
  color: #7c3aed;
}

.input-shell input {
  background: transparent;
  border: 0;
  color: #0f172a;
  flex: 1;
  font-family: inherit;
  font-size: 15px;
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
  color: #7c3aed;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.password-toggle:hover {
  background: #f3e8ff;
}

/* =========================================================
   ALERTS & BUTTONS
   ========================================================= */
.login-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 600;
  margin: -4px 0 20px;
  padding: 12px 14px;
}

.submit-button {
  align-items: center;
  background: #4f46e5;
  border: 0;
  border-radius: 12px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  gap: 10px;
  justify-content: center;
  min-height: 54px;
  width: 100%;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.submit-button.festive-submit {
  background: linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #d97706 100%);
  box-shadow: 0 6px 20px rgba(234, 88, 12, 0.28);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.submit-button.festive-submit:hover:not(:disabled) {
  box-shadow: 0 8px 24px rgba(192, 38, 211, 0.36);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.forgot-link {
  background: transparent;
  border: 0;
  color: #64748b;
  cursor: pointer;
  display: block;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  margin: 24px auto 0;
  transition: color 0.15s ease;
}

.forgot-link:hover {
  color: #7c3aed;
}

.spinner {
  animation: spin 0.8s linear infinite;
  border: 2px solid rgba(255, 255, 255, 0.3);
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

/* =========================================================
   RESPONSIVE DESIGN (TABLETS & MOBILE)
   ========================================================= */
@media (max-width: 1040px) {
  .brand-panel {
    padding: 48px 36px;
  }
  .form-panel {
    padding: 36px 28px;
  }
}

@media (max-width: 880px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    display: none;
  }

  .form-panel {
    background:
      radial-gradient(circle at 10% 5%, rgba(251, 191, 36, 0.08) 0%, transparent 40%),
      radial-gradient(circle at 90% 95%, rgba(225, 29, 72, 0.06) 0%, transparent 45%),
      #ffffff;
    min-height: 100vh;
    padding: 32px 20px 48px;
    align-items: flex-start;
  }

  .login-card {
    margin: 0 auto;
    max-width: 420px;
    padding-top: 10px;
  }

  .mobile-brand-container {
    display: block;
    margin-bottom: 28px;
    text-align: center;
  }

  .mobile-brand {
    align-items: center;
    background: #ffffff;
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 14px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    display: inline-flex;
    justify-content: center;
    margin-bottom: 16px;
    padding: 10px 18px;
  }

  .mobile-brand img {
    height: 40px;
    object-fit: contain;
    width: auto;
  }

  .mobile-festive-banner {
    background: linear-gradient(145deg, #fff7ed 0%, #fef3c7 50%, #fee2e2 100%);
    border: 1px solid rgba(249, 115, 22, 0.4);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(234, 88, 12, 0.1);
    padding: 16px 18px;
  }

  .mobile-festive-chip {
    background: #ffffff;
    border: 1px solid rgba(249, 115, 22, 0.35);
    border-radius: 999px;
    color: #c2410c;
    display: inline-block;
    font-size: 12px;
    font-weight: 800;
    margin-bottom: 8px;
    padding: 4px 12px;
  }

  .mobile-festive-sub {
    color: #ea580c;
    font-size: 14px;
    margin: 0 0 6px;
  }

  .mobile-festive-sub strong {
    color: #7c2d12;
    font-weight: 800;
  }

  .mobile-festive-quote {
    color: #64748b;
    font-size: 12px;
    font-style: italic;
    line-height: 1.45;
    margin: 0;
  }

  .form-heading {
    text-align: center;
    margin-bottom: 26px;
  }

  .form-heading h2 {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .form-panel {
    padding: 24px 16px 40px;
  }

  .form-heading h2 {
    font-size: 26px;
  }

  .input-shell {
    min-height: 50px;
  }

  .submit-button {
    min-height: 50px;
    font-size: 15px;
  }
}
</style>
