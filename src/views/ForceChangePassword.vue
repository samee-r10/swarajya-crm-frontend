<template>
  <main class="login-wrapper">
    <!-- Left Pane: Elegant Marketing & Visual Showcase -->
    <section class="showcase-pane">
      <div class="showcase-glow"></div>
      <div class="showcase-content">
        <div class="logo-area">
          <img src="/logo.png" alt="Swarajya Logo" class="showcase-logo" />
          <span class="logo-text">Swarajya CRM</span>
        </div>
        
        <div class="illustration-container">
          <img src="/login_artwork.png" alt="CRM Analytics" class="visual-artwork" />
          <div class="glass-caption">
            <span class="badge" style="background: rgba(180, 83, 9, 0.15); color: #fb923c; border-color: rgba(180, 83, 9, 0.2);">Security Access</span>
            <h3>Protect Your Account</h3>
            <p>Ensure your operational data remains completely secure by setting a highly unique and strong password.</p>
          </div>
        </div>
        
        <div class="showcase-footer">
          <p>© 2026 Swarajya Consultancy. All rights reserved.</p>
        </div>
      </div>
    </section>

    <!-- Right Pane: Forced Password Reset Form -->
    <section class="form-pane">
      <div class="mobile-logo">
        <img src="/logo.png" alt="Swarajya Logo" class="mobile-logo-img" />
        <span class="mobile-logo-text">Swarajya CRM</span>
      </div>

      <div class="login-card-header">
        <span class="eyebrow-accent" style="color: #d97706;">Action Required</span>
        <h2>Change Your Password</h2>
        <p class="subtitle">To secure your account, you must change your password before proceeding to the system.</p>
      </div>

      <form class="premium-form" @submit.prevent="submit">
        <!-- Current Password Input -->
        <div class="input-group">
          <label for="current_password">Current Password</label>
          <div class="input-wrapper">
            <span class="input-icon">
              <!-- SVG lock icon -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </span>
            <input 
              id="current_password" 
              v-model="form.current_password" 
              :type="showCurrentPassword ? 'text' : 'password'" 
              placeholder="Enter current password"
              required 
              autofocus
            />
            <button 
              type="button" 
              class="password-toggle" 
              @click="showCurrentPassword = !showCurrentPassword"
              tabindex="-1"
            >
              <!-- SVG Eye / Eye-Slash -->
              <svg v-if="showCurrentPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- New Password Input -->
        <div class="input-group">
          <label for="new_password">New Password</label>
          <div class="input-wrapper">
            <span class="input-icon">
              <!-- SVG key icon -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
            </span>
            <input 
              id="new_password" 
              v-model="form.new_password" 
              :type="showNewPassword ? 'text' : 'password'" 
              placeholder="Enter strong password"
              required
            />
            <button 
              type="button" 
              class="password-toggle" 
              @click="showNewPassword = !showNewPassword"
              tabindex="-1"
            >
              <svg v-if="showNewPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </div>
          <span class="password-hint">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char</span>
        </div>

        <!-- Confirm New Password Input -->
        <div class="input-group">
          <label for="confirm_password">Confirm New Password</label>
          <div class="input-wrapper">
            <span class="input-icon">
              <!-- SVG check-circle icon -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </span>
            <input 
              id="confirm_password" 
              v-model="form.confirm_password" 
              :type="showConfirmPassword ? 'text' : 'password'" 
              placeholder="Confirm strong password"
              required
            />
            <button 
              type="button" 
              class="password-toggle" 
              @click="showConfirmPassword = !showConfirmPassword"
              tabindex="-1"
            >
              <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
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

        <transition name="slide-fade">
          <div v-if="success" class="login-alert success">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="alert-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
            <span class="alert-text">{{ success }}</span>
          </div>
        </transition>

        <!-- Submit Button -->
        <button class="login-submit-btn" type="submit" :disabled="loading" style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); box-shadow: 0 4px 14px rgba(180, 83, 9, 0.35);">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Saving...' : 'Update Password & Continue' }}</span>
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
const form = reactive({ current_password: '', new_password: '', confirm_password: '' })
const loading = ref(false)
const error = ref('')
const success = ref('')

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

function validateLocal() {
  if (form.new_password !== form.confirm_password) {
    return "New passwords do not match."
  }
  if (form.new_password.length < 8) {
    return "Password must be at least 8 characters long."
  }
  if (!/[A-Z]/.test(form.new_password)) {
    return "Password must contain at least one uppercase letter."
  }
  if (!/[a-z]/.test(form.new_password)) {
    return "Password must contain at least one lowercase letter."
  }
  if (!/\d/.test(form.new_password)) {
    return "Password must contain at least one number."
  }
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(form.new_password)) {
    return "Password must contain at least one special character."
  }
  return null
}

async function submit() {
  error.value = ''
  success.value = ''
  
  const localError = validateLocal()
  if (localError) {
    error.value = localError
    return
  }
  
  loading.value = true
  try {
    await apiPost('/api/auth/change-password', {
      current_password: form.current_password,
      new_password: form.new_password
    })
    
    success.value = 'Password changed successfully! Redirecting...'
    
    // Update local storage user record
    const userJson = window.localStorage.getItem('lms_user')
    if (userJson) {
      const user = JSON.parse(userJson)
      user.requires_password_change = false
      window.localStorage.setItem('lms_user', JSON.stringify(user))
    }
    
    setTimeout(() => {
      router.push({ name: 'dashboard' })
    }, 1500)
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
  grid-template-columns: 1.1fr 0.9fr;
  min-height: 100vh;
  background-color: #0f172a;
  font-family: 'Plus Jakarta Sans', sans-serif;
  overflow: hidden;
}

/* Left Pane Styling (Showcase) */
.showcase-pane {
  position: relative;
  background: radial-gradient(circle at 10% 20%, #1e1b4b 0%, #0f172a 90%);
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.showcase-glow {
  position: absolute;
  top: 15%;
  left: 10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0) 70%);
  filter: blur(40px);
  pointer-events: none;
  z-index: 1;
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
  height: 40px;
  width: auto;
  filter: brightness(0) invert(1);
  opacity: 0.95;
  transition: opacity 0.2s ease;
}

.showcase-logo:hover {
  opacity: 1;
}

.logo-text {
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #ffffff;
}

.illustration-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  max-width: 580px;
  margin: 0 auto;
  gap: 36px;
}

.visual-artwork {
  width: 100%;
  max-height: 380px;
  object-fit: contain;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 
              0 0 40px rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.visual-artwork:hover {
  transform: translateY(-8px) scale(1.02);
}

.glass-caption {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  text-align: left;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  border: 1px solid rgba(249, 115, 22, 0.2);
}

.glass-caption h3 {
  font-family: 'Outfit', sans-serif;
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.3px;
}

.glass-caption p {
  color: #94a3b8;
  font-size: 13.5px;
  line-height: 1.5;
  margin: 0;
}

.showcase-footer p {
  color: #475569;
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
}

.mobile-logo {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}

.mobile-logo-img {
  height: 36px;
  width: auto;
}

.mobile-logo-text {
  font-family: 'Outfit', sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.login-card-header {
  margin-bottom: 36px;
}

.eyebrow-accent {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 8px;
}

.login-card-header h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px 0;
  letter-spacing: -0.8px;
}

.subtitle {
  color: #64748b;
  font-size: 15px;
  line-height: 1.5;
  margin: 0;
}

.premium-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 420px;
  width: 100%;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.password-hint {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
  line-height: 1.4;
  font-weight: 500;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
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
  padding: 12px 16px 12px 46px;
  font-size: 15px;
  color: #0f172a;
  background-color: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.25s ease;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.input-wrapper input::placeholder {
  color: #94a3b8;
}

.input-wrapper input:focus {
  outline: none;
  background-color: #ffffff;
  border-color: #d97706;
  box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.1);
}

.password-toggle {
  position: absolute;
  right: 14px;
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
  color: #b45309;
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
  border-radius: 10px;
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

.login-alert.success {
  background-color: #ecfdf5;
  border: 1.5px solid #a7f3d0;
  color: #065f46;
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
  min-height: 48px;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 750;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
}

.login-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%);
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
