<template>
  <main class="login-wrapper">
    <!-- Left Pane: Elegant Marketing & Visual Showcase -->
    <section class="showcase-pane">
      <div class="showcase-glow-1"></div>
      <div class="showcase-glow-2"></div>
      <div class="showcase-glow-3"></div>
      <div class="showcase-content">
        <div class="logo-area">
          <img src="/logo.png" alt="Swarajya Logo" class="showcase-logo" />
          <div class="logo-text-wrapper">
            <span class="logo-text">Swarajya CRM</span>
            <span class="logo-tagline">Your Vision. Our Code.</span>
          </div>
        </div>
        
        <div class="illustration-container">
          <img src="/login_artwork.png" alt="CRM Analytics" class="visual-artwork" />
          <div class="glass-caption">
            <span class="badge">Your Vision. Our Code.</span>
            <h3>Unified Business Operations</h3>
            <p>Directly manage your sales pipelines, project lifecycles, and treasury ledgers within a single, highly integrated Workspace.</p>
          </div>
        </div>
        
        <div class="showcase-footer">
          <p>© 2026 Swarajya Consultancy. All rights reserved.</p>
        </div>
      </div>
    </section>

    <!-- Right Pane: Minimalist, Premium Login Form -->
    <section class="form-pane">
      <div class="mobile-logo">
        <img src="/logo.png" alt="Swarajya Logo" class="mobile-logo-img" />
        <div class="logo-text-wrapper">
          <span class="mobile-logo-text">Swarajya CRM</span>
          <span class="mobile-logo-tagline">Your Vision. Our Code.</span>
        </div>
      </div>

      <div class="login-card-header">
        <span class="eyebrow-accent">Secure Portal Access</span>
        <h2>Welcome Back</h2>
        <p class="subtitle">Enter your credentials to manage your business operations.</p>
      </div>

      <form class="premium-form" @submit.prevent="submit">
        <!-- Email Input -->
        <div class="input-group">
          <label for="email">Email Address</label>
          <div class="input-wrapper">
            <span class="input-icon">
              <!-- SVG envelope icon -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </span>
            <input 
              id="email" 
              v-model="form.email" 
              type="email" 
              autocomplete="off" 
              placeholder="name@swarajyaconsultancy.in"
              required 
              autofocus
            />
          </div>
        </div>

        <!-- Password Input -->
        <div class="input-group">
          <div class="label-row">
            <label for="password">Password</label>
          </div>
          <div class="input-wrapper">
            <span class="input-icon">
              <!-- SVG lock icon -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </span>
            <input 
              id="password" 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'" 
              autocomplete="off" 
              placeholder="••••••••••••"
              required
            />
            <button 
              type="button" 
              class="password-toggle" 
              @click="showPassword = !showPassword"
              tabindex="-1"
              title="Toggle password visibility"
            >
              <!-- SVG Eye / Eye-Slash -->
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Feedback Messages -->
        <transition name="slide-fade">
          <div v-if="error" class="login-alert warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="alert-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span class="alert-text">{{ error }}</span>
          </div>
        </transition>

        <!-- Submit Button -->
        <button class="login-submit-btn" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Authenticating...' : 'Sign In to Workspace' }}</span>
          <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="btn-arrow">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </form>
      
      <div class="mobile-footer">
        <p>© 2026 Swarajya Consultancy. All rights reserved.</p>
      </div>
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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

/* Main Wrapper with custom fonts styling */
.login-wrapper {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  overflow: hidden;
}

/* Left Pane Styling (Showcase) */
.showcase-pane {
  position: relative;
  background: radial-gradient(circle at 10% 20%, #fcfdfd 0%, #f3f5f8 100%);
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
}

.showcase-glow-1 {
  position: absolute;
  top: 10%;
  left: 10%;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0) 70%);
  filter: blur(50px);
  pointer-events: none;
  animation: float-blob-1 18s infinite alternate ease-in-out;
}

.showcase-glow-2 {
  position: absolute;
  bottom: 10%;
  right: 10%;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 70%);
  filter: blur(60px);
  pointer-events: none;
  animation: float-blob-2 22s infinite alternate ease-in-out;
}

.showcase-glow-3 {
  position: absolute;
  top: 40%;
  left: 30%;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(14, 165, 233, 0) 70%);
  filter: blur(40px);
  pointer-events: none;
  animation: float-blob-3 15s infinite alternate ease-in-out;
}

@keyframes float-blob-1 {
  0% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(30px, -40px) scale(1.08); }
  100% { transform: translate(-15px, 15px) scale(0.96); }
}

@keyframes float-blob-2 {
  0% { transform: translate(0px, 0px) scale(1.05); }
  50% { transform: translate(-40px, 30px) scale(0.92); }
  100% { transform: translate(25px, -20px) scale(1.08); }
}

@keyframes float-blob-3 {
  0% { transform: translate(0px, 0px) scale(0.95); }
  50% { transform: translate(25px, 25px) scale(1.05); }
  100% { transform: translate(-30px, -15px) scale(0.95); }
}

.showcase-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.showcase-logo {
  height: 42px;
  width: auto;
  opacity: 0.95;
  transition: transform 0.3s ease;
}

.showcase-logo:hover {
  transform: rotate(6deg) scale(1.05);
}

.logo-text-wrapper {
  display: flex;
  flex-direction: column;
}

.logo-text {
  font-family: 'Outfit', sans-serif;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #0f172a;
  line-height: 1.1;
}

.logo-tagline {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #ea580c;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.illustration-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  max-width: 580px;
  margin: 0 auto;
  gap: 32px;
}

.visual-artwork {
  width: 100%;
  max-height: 360px;
  object-fit: contain;
  border-radius: 24px;
  box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08),
              0 0 0 1px rgba(255, 255, 255, 0.6);
  border: 4px solid #ffffff;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.visual-artwork:hover {
  transform: translateY(-6px) scale(1.01);
}

.glass-caption {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  padding: 26px;
  text-align: left;
  box-shadow: 0 20px 45px -15px rgba(15, 23, 42, 0.06), 
              0 0 0 1px rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.glass-caption:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.1),
              0 0 0 1px rgba(255, 255, 255, 0.8);
}

.badge {
  display: inline-block;
  background: rgba(249, 115, 22, 0.08);
  color: #ea580c;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 12px;
  border: 1px solid rgba(249, 115, 22, 0.15);
}

.glass-caption h3 {
  font-family: 'Outfit', sans-serif;
  color: #0f172a;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.3px;
}

.glass-caption p {
  color: #475569;
  font-size: 13.5px;
  line-height: 1.5;
  margin: 0;
}

.showcase-footer p {
  color: #64748b;
  font-size: 12px;
  margin: 0;
}

/* Right Pane Styling (Form) */
.form-pane {
  background-color: #ffffff;
  padding: 64px 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  box-shadow: -20px 0 40px rgba(15, 23, 42, 0.015);
}

.mobile-logo {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}

.mobile-logo-img {
  height: 38px;
  width: auto;
}

.mobile-logo-tagline {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: #ea580c;
  letter-spacing: 0.5px;
}

.mobile-logo-text {
  font-family: 'Outfit', sans-serif;
  font-size: 19px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
}

.login-card-header {
  margin-bottom: 36px;
}

.eyebrow-accent {
  display: inline-block;
  color: #ea580c;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 8px;
}

.login-card-header h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 34px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px 0;
  letter-spacing: -0.8px;
}

.subtitle {
  color: #475569;
  font-size: 15px;
  line-height: 1.5;
  margin: 0;
}

.premium-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 400px;
  width: 100%;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.input-icon svg {
  width: 20px;
  height: 20px;
}

.input-wrapper input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  font-size: 15px;
  color: #0f172a;
  background-color: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.input-wrapper input::placeholder {
  color: #94a3b8;
}

.input-wrapper input:focus {
  outline: none;
  background-color: #ffffff;
  border-color: #f97316;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.08);
}

.password-toggle {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: #ea580c;
}

.password-toggle svg {
  width: 20px;
  height: 20px;
}

/* Alert Banner Styling */
.login-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 4px;
}

.login-alert.warning {
  background-color: #fef2f2;
  border: 1.5px solid #fecaca;
  color: #991b1b;
}

.alert-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.alert-text {
  flex-grow: 1;
}

/* Submit Button */
.login-submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 52px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 750;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 18px rgba(249, 115, 22, 0.3);
  margin-top: 8px;
  position: relative;
  overflow: hidden;
}

.login-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
  background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
}

.login-submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-arrow {
  width: 18px;
  height: 18px;
  transition: transform 0.25s ease;
}

.login-submit-btn:hover .btn-arrow {
  transform: translateX(4px);
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.mobile-footer {
  display: none;
  margin-top: 40px;
  text-align: center;
}

.mobile-footer p {
  color: #94a3b8;
  font-size: 11px;
}

/* Slide fade animation */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}

/* Responsiveness Settings */
@media (max-width: 1024px) {
  .login-wrapper {
    grid-template-columns: 1fr;
  }
  
  .showcase-pane {
    display: none;
  }
  
  .form-pane {
    padding: 48px 32px;
    align-items: center;
  }
  
  .mobile-logo {
    display: flex;
  }
  
  .premium-form {
    max-width: 440px;
  }
  
  .mobile-footer {
    display: block;
  }
}

@media (max-width: 480px) {
  .form-pane {
    padding: 32px 20px;
  }
  
  .login-card-header h2 {
    font-size: 26px;
  }
}
</style>
