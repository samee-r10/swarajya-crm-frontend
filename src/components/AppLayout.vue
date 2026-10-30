<template>
  <a v-if="route.name !== 'login'" class="skip-link" href="#main-content">Skip to main content</a>

  <!-- Non-blocking Top Glowing Laser Bar (Active during Route Transitions & Loading) -->
  <transition name="laser-fade">
    <div v-if="isRouteNavigating || isAppLoading" class="app-loader-track" aria-hidden="true">
      <div class="app-loader-bar"></div>
      <div class="app-loader-glow"></div>
    </div>
  </transition>

  <!-- Heavy Operation Glassmorphism Loading Modal (ONLY for slow blocking API operations > 400ms) -->
  <transition name="app-loader-fade">
    <div v-if="isAppLoading" class="app-loader-backdrop" aria-live="polite" aria-label="Loading">
      <div class="app-loader-modal">
        <div class="app-spinner-box">
          <svg class="app-spinner-svg" viewBox="0 0 50 50">
            <defs>
              <linearGradient id="globalOrbitalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0284c7" />
                <stop offset="50%" stop-color="#6366f1" />
                <stop offset="100%" stop-color="#06b6d4" />
              </linearGradient>
            </defs>
            <circle class="app-spinner-track-bg" cx="25" cy="25" r="20" fill="none" stroke-width="4" />
            <circle class="app-spinner-ring-anim" cx="25" cy="25" r="20" fill="none" stroke="url(#globalOrbitalGrad)" stroke-width="4" stroke-linecap="round" />
          </svg>
          <div class="app-spinner-center-dot"></div>
        </div>
        <div class="app-loader-copy">
          <span class="app-loader-title">Loading...</span>
          <span class="app-loader-subtitle">Updating platform data</span>
        </div>
      </div>
    </div>
  </transition>

  <RouterView v-if="route.name === 'login'" v-slot="{ Component }">
    <motion.div
      :key="route.fullPath"
      class="auth-route-view"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :transition="{ duration: 0.24, ease: 'easeOut' }"
    >
      <component :is="Component" />
    </motion.div>
  </RouterView>

  <div v-else class="app-shell" :class="{ 'sidebar-collapsed': sidebarCollapsed, 'mobile-nav-open': mobileNavOpen }">
    <AppHeader
      :user-name="userName"
      :user-initial="userInitial"
      :user-email="userEmail"
      :user-profile="userProfile"
      @open-navigation="mobileNavOpen = true"
      @logout="logout"
    />

    <!-- Legacy header retained temporarily for safe rollback; it is not rendered. -->
    <header v-if="false" class="global-header">
    <div class="header-left">
      <button
        class="mobile-menu-button"
        type="button"
        :aria-expanded="mobileNavOpen"
        aria-controls="primary-sidebar"
        aria-label="Open navigation"
        @click="mobileNavOpen = true"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M4 7h16v2H4V7Zm0 4h16v2H4v-2Zm0 4h16v2H4v-2Z" fill="currentColor"/>
        </svg>
      </button>

      <!-- App Launcher (Kokonut UI Bento Menu) -->
      <div class="app-launcher">
        <details ref="launcherRef" class="launcher-dropdown">
          <summary class="launcher-summary" title="App Launcher">
            <svg class="icon-9dots" viewBox="0 0 24 24" width="20" height="20">
              <circle cx="4" cy="4" r="2.2" fill="currentColor" />
              <circle cx="12" cy="4" r="2.2" fill="currentColor" />
              <circle cx="20" cy="4" r="2.2" fill="currentColor" />
              <circle cx="4" cy="12" r="2.2" fill="currentColor" />
              <circle cx="12" cy="12" r="2.2" fill="currentColor" />
              <circle cx="20" cy="12" r="2.2" fill="currentColor" />
              <circle cx="4" cy="20" r="2.2" fill="currentColor" />
              <circle cx="12" cy="20" r="2.2" fill="currentColor" />
              <circle cx="20" cy="20" r="2.2" fill="currentColor" />
            </svg>
          </summary>
          <div class="launcher-menu bento-card">
            <div class="launcher-search-wrap">
              <svg viewBox="0 0 24 24" width="16" height="16" class="search-icon"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
              <input v-model="launcherSearch" type="search" placeholder="Search apps, workspaces...">
            </div>
            <div class="launcher-list">
              <RouterLink
                v-for="item in filteredLauncherItems"
                :key="item.to"
                :to="item.to"
                class="launcher-item"
              >
                <div class="launcher-item-content">
                  <strong>{{ item.label }}</strong>
                  <span class="launcher-item-tag">{{ item.type }}</span>
                </div>
              </RouterLink>
            </div>
          </div>
        </details>
      </div>

      <!-- Brand Identity -->
      <RouterLink class="brand" to="/">
        <img src="/logo.png" alt="Company Logo" class="brand-logo" />
        <span class="brand-badge-pill">
          <span class="brand-badge-dot"></span>
          CRM
        </span>
      </RouterLink>
    </div>

    <!-- Command Palette Style Global Search (Scrolltide & Kokonut UI) -->
    <div ref="globalSearchRef" class="global-search">
      <div class="global-search-box" :class="{ focused: globalSearchOpen }">
        <svg viewBox="0 0 24 24" width="16" height="16" class="search-lens">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
        </svg>
        <input
          ref="globalSearchInputRef"
          v-model="globalSearch"
          type="search"
          placeholder="Search customers, tasks, invoices, ledger... (Ctrl + K)"
          @focus="globalSearchOpen = true"
          @keydown.enter.prevent="openFirstSearchResult"
          @keydown.esc.prevent="closeGlobalSearch"
        >
        <div class="search-kbd-hint">
          <span class="kbd-pill">Ctrl</span>
          <span class="kbd-pill">K</span>
        </div>
      </div>

      <!-- Glassmorphic Search Results Popover -->
      <transition name="popover-fade">
        <div v-if="globalSearchOpen && globalSearch.length >= 2" class="global-search-results bento-card">
          <div v-if="searchLoading" class="global-search-state">
            <span class="search-mini-spinner"></span>
            Searching workspace records...
          </div>
          <button
            v-for="result in globalSearchResults"
            v-else
            :key="`${result.type}-${result.url}`"
            class="global-search-result"
            type="button"
            @click="openSearchResult(result)"
          >
            <span class="result-badge" :class="getResultBadgeClass(result.type)">{{ result.type }}</span>
            <div class="result-info">
              <strong>{{ result.label }}</strong>
              <small>{{ result.subtitle || result.meta }}</small>
            </div>
            <svg viewBox="0 0 24 24" width="14" height="14" class="result-arrow"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/></svg>
          </button>
          <div v-if="!searchLoading && globalSearchResults.length === 0" class="global-search-state empty">
            No matching records found
          </div>
        </div>
      </transition>
    </div>

    <!-- Header Actions & User Profile -->
    <div class="header-right">
      <button class="header-icon-button" type="button" aria-label="Notifications" title="Notifications">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="#475569" class="header-action-svg">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#475569"/>
        </svg>
        <span class="notification-dot-luminous"></span>
      </button>

      <!-- User Profile Dropdown Pill -->
      <details v-if="user" ref="userDropdownRef" class="user-dropdown">
        <summary class="user-summary btn-tactile">
          <div class="user-avatar-circle">
            {{ userInitial }}
            <span class="user-avatar-status"></span>
          </div>
          <div class="user-summary-text">
            <span class="user-name-label">{{ userName }}</span>
            <span class="user-role-micro">{{ userProfile }}</span>
          </div>
          <svg viewBox="0 0 24 24" width="14" height="14" class="chevron-icon"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill="currentColor"/></svg>
        </summary>

        <div class="user-menu bento-card">
          <div class="user-menu-profile">
            <div class="profile-header-avatar">{{ userInitial }}</div>
            <div class="profile-header-details">
              <strong>{{ userName }}</strong>
              <small>{{ userEmail }}</small>
              <span class="badge-luminous badge-luminous-blue mt-1">{{ userProfile }}</span>
            </div>
          </div>
          <div class="user-menu-actions">
            <RouterLink to="/profile" class="user-menu-item">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>
              Account Profile
            </RouterLink>
            <button type="button" class="user-menu-item logout" @click="logout">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/></svg>
              Sign Out
            </button>
          </div>
        </div>
      </details>
    </div>
  </header>

  <!-- Mobile Backdrop -->
    <div
      v-if="mobileNavOpen"
      class="mobile-sidebar-backdrop"
      aria-hidden="true"
      @click="mobileNavOpen = false"
    ></div>

    <!-- 2. Layout Body (Sidebar + Main Column) -->
    <div class="layout-body">
      <!-- Fixed Left Sidebar -->
      <aside id="primary-sidebar" class="enterprise-sidebar" aria-label="Primary navigation">
      <div class="sidebar-head">
        <div class="sidebar-branding">
          <span class="sidebar-kicker">CRM Workspace</span>
          <strong>Swarajya</strong>
        </div>
        <button class="icon-button mobile-sidebar-close" type="button" aria-label="Close navigation" @click="mobileNavOpen = false">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5Zm12.6 1.4L6.4 19 5 17.6 17.6 5 19 6.4Z" fill="currentColor"/></svg>
        </button>
        <button class="sidebar-toggle" type="button" :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#475569" class="toggle-arrow-svg" :class="{ rotated: sidebarCollapsed }">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="#475569"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in visibleNavItems"
          :key="item.to"
          :to="item.to"
          :class="{ active: isNavActive(item) }"
          :title="sidebarCollapsed ? item.label : undefined"
          class="sidebar-nav-item"
        >
          <span class="nav-active-pip"></span>
          <span class="nav-icon" aria-hidden="true" v-html="item.icon"></span>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-security-badge">
          <svg viewBox="0 0 24 24" width="15" height="15"><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 2.2 6 2.25V11c0 3.8-2.45 7.55-6 8.9-3.55-1.35-6-5.1-6-8.9V6.45l6-2.25Z" fill="currentColor"/></svg>
          <span v-if="!sidebarCollapsed" class="nav-label">256-Bit Encrypted</span>
        </div>
      </div>
    </aside>

      <!-- 3. Main Layout Container (Scrollable Content + Fixed Enterprise Footer) -->
      <div class="main-layout-container">
        <main id="main-content" class="main main-content-scrollable" tabindex="-1">
          <CrmBreadcrumbs />
          <RouterView v-slot="{ Component }">
            <motion.div
              :key="route.fullPath"
              class="route-view"
              :initial="{ opacity: 0, y: 8 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }"
            >
              <component :is="Component" />
            </motion.div>
          </RouterView>
        </main>

        <!-- 4. Fixed Enterprise Footer (Corevian Style) -->
        <footer class="app-footer" role="contentinfo" aria-label="Application Footer">
          <div class="footer-left">
            <span>&copy; {{ currentYear }} Swarajya Consultancy. All rights reserved.</span>
            <span class="footer-divider">•</span>
            <span class="footer-status-indicator">
              <span class="footer-status-dot"></span>
              Enterprise Systems Connected
            </span>
          </div>
          <div class="footer-right">
            <span class="footer-badge">v2.4 Enterprise</span>
            <span class="footer-product-label">Swarajya CRM Enterprise Edition</span>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { motion } from 'motion-v'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost } from '../api/client'
import { hasHrPermission, loadHrSettings } from '../utils/hrStorage'
import AppHeader from './AppHeader.vue'
import CrmBreadcrumbs from './CrmBreadcrumbs.vue'

const route = useRoute()
const router = useRouter()

// Template refs
const launcherRef = ref(null)
const userDropdownRef = ref(null)
const globalSearchRef = ref(null)
const globalSearchInputRef = ref(null)
const isRouteNavigating = ref(false)
const isAppLoading = ref(false)
const currentYear = computed(() => new Date().getFullYear())
const activeLoaders = ref(0)
let loaderDelayTimer = null
let routeLoaderTimer = null

// Close dropdowns on outside click
function handleOutsideClick(e) {
  if (launcherRef.value && !launcherRef.value.contains(e.target)) {
    launcherRef.value.removeAttribute('open')
  }
  if (userDropdownRef.value && !userDropdownRef.value.contains(e.target)) {
    userDropdownRef.value.removeAttribute('open')
  }
  if (globalSearchRef.value && !globalSearchRef.value.contains(e.target)) {
    closeGlobalSearch()
  }
}

// Global Keyboard Shortcut: Ctrl+K / Cmd+K
function handleGlobalKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    globalSearchInputRef.value?.focus()
    globalSearchOpen.value = true
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick, true)
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('app-loading-start', startAppLoader)
  window.addEventListener('app-loading-stop', stopAppLoader)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick, true)
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('app-loading-start', startAppLoader)
  window.removeEventListener('app-loading-stop', stopAppLoader)
  if (searchTimer) clearTimeout(searchTimer)
  if (loaderDelayTimer) clearTimeout(loaderDelayTimer)
  if (routeLoaderTimer) clearTimeout(routeLoaderTimer)
})

const user = ref(window.localStorage.getItem('lms_user'))
watch(() => route.path, () => {
  user.value = window.localStorage.getItem('lms_user')
  if (launcherRef.value) launcherRef.value.removeAttribute('open')
  mobileNavOpen.value = false
  closeGlobalSearch()
  showRouteLoader()
})

const userName = computed(() => {
  if (!user.value) return ''
  try {
    const userData = JSON.parse(user.value)
    return userData.full_name || 'User'
  } catch {
    return 'User'
  }
})

const userInitial = computed(() => {
  const name = userName.value.trim()
  return name ? name.charAt(0).toUpperCase() : 'U'
})

const userId = computed(() => {
  if (!user.value) return ''
  try {
    return JSON.parse(user.value).id
  } catch {
    return ''
  }
})

const userEmail = computed(() => {
  if (!user.value) return ''
  try {
    return JSON.parse(user.value).email || ''
  } catch {
    return ''
  }
})

const userProfile = computed(() => {
  if (!user.value) return 'Standard'
  try {
    return JSON.parse(user.value).role_name || 'Standard'
  } catch {
    return 'Standard'
  }
})

const isAdmin = computed(() => userProfile.value === 'System Administrator' || userProfile.value === 'Admin')
const hasTreasuryAccess = computed(() => {
  if (isAdmin.value) return true
  if (!user.value) return false
  try {
    const userData = JSON.parse(user.value)
    return userData.has_treasury_access === 1 || userData.has_treasury_access === true
  } catch {
    return false
  }
})

const hasFinanceAccess = computed(() => {
  if (isAdmin.value) return true
  if (!user.value) return false
  try {
    const userData = JSON.parse(user.value)
    return userData.has_finance_access === 1 || userData.has_finance_access === true
  } catch {
    return false
  }
})

const hasHrAccess = computed(() => {
  if (isAdmin.value) return true
  if (!user.value) return false
  try {
    const userData = JSON.parse(user.value)
    return hasHrPermission('view_hr_module', userData) || (loadHrSettings().self_access_enabled && !!userData.id)
  } catch {
    return false
  }
})

const hasVaultAccess = computed(() => {
  if (isAdmin.value) return true
  if (!user.value) return false
  try {
    const userData = JSON.parse(user.value)
    return userData.has_vault_access === 1 || userData.has_vault_access === true
  } catch {
    return false
  }
})

const launcherSearch = ref('')
const globalSearch = ref('')
const globalSearchOpen = ref(false)
const globalSearchResults = ref([])
const searchLoading = ref(false)
const sidebarCollapsed = ref(false)
const mobileNavOpen = ref(false)
let searchTimer = null

const launcherItems = [
  { label: 'Dashboard', type: 'App', to: '/' },
  { label: 'Task Management', type: 'Module', to: '/tasks' },
  { label: 'Customers', type: 'Standard Object', to: '/customers' },
  { label: 'Opportunities', type: 'Standard Object', to: '/opportunities' },
  { label: 'Projects', type: 'Module', to: '/projects' },
  { label: 'Finance', type: 'Module', to: '/finance' },
  { label: 'Treasury', type: 'Module', to: '/treasury' },
  { label: 'HR Management', type: 'Module', to: '/hr' },
  { label: 'Vault', type: 'Secure Module', to: '/vault' },
  { label: 'Vendors', type: 'Finance', to: '/finance/vendors' },
  { label: 'Transaction Ledger', type: 'Finance', to: '/finance/transactions' },
  { label: 'Claims', type: 'Employee Workspace', to: '/claims' },
  { label: 'Claim Approvals', type: 'Approvals', to: '/claims/approvals' },
  { label: 'Chart of Accounts', type: 'Finance', to: '/finance/accounts' },
  { label: 'General Ledger Report', type: 'Finance', to: '/finance/reports/general-ledger' },
  { label: 'Customer Ledger Report', type: 'Finance', to: '/finance/reports/customer-ledger' },
  { label: 'Vendor Ledger Report', type: 'Finance', to: '/finance/reports/vendor-ledger' },
  { label: 'Products', type: 'Treasury', to: '/treasury/products' },
  { label: 'Payables', type: 'Treasury', to: '/treasury/payables' },
  { label: 'Company Bank Accounts', type: 'Treasury', to: '/treasury/bank-accounts' },
  { label: 'Fund Transfers', type: 'Treasury', to: '/treasury/fund-transfers' },
  { label: 'Loan Management', type: 'Treasury', to: '/treasury/loans' },
  { label: 'Stakeholder and CP Payouts', type: 'Treasury', to: '/treasury/stakeholder-payouts' },
  { label: 'Employee Master', type: 'HR Management', to: '/hr' },
  { label: 'Payroll', type: 'HR Management', to: '/hr' },
  { label: 'Salary Slips', type: 'HR Management', to: '/hr' },
  { label: 'Setup', type: 'Admin', to: '/setup' },
  { label: 'Users', type: 'Setup', to: '/setup#users' },
  { label: 'Roles', type: 'Setup', to: '/setup#roles' },
  { label: 'Object Manager', type: 'Setup', to: '/setup#objects' }
]

const navItems = [
  { label: 'Dashboard', to: '/', match: ['/'], icon: '<svg viewBox="0 0 24 24"><path d="M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z" fill="currentColor"/></svg>' },
  { label: 'Task Management', to: '/tasks', match: ['/tasks'], icon: '<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/></svg>' },
  { label: 'Customers', to: '/customers', match: ['/customers'], icon: '<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" fill="currentColor"/></svg>' },
  { label: 'Opportunities', to: '/opportunities', match: ['/opportunities'], icon: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Zm1 1v9l6.4 6.4 1.4-1.4-5-5H22A9 9 0 0 0 13 3Z" fill="currentColor"/></svg>' },
  { label: 'Projects', to: '/projects', match: ['/projects'], icon: '<svg viewBox="0 0 24 24"><path d="M10 4h4v3h-4V4ZM4 9h16v11H4V9Zm2 2v7h12v-7H6Zm10-7h2a2 2 0 0 1 2 2v1h-2V6h-2V4ZM6 4h2v2H6v1H4V6a2 2 0 0 1 2-2Z" fill="currentColor"/></svg>' },
  { label: 'Claims', to: '/claims', match: ['/claims'], exact: true, icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Zm-5 4h8v2H8v-2Zm0 4h6v2H8v-2Zm0-8h3v2H8V9Z" fill="currentColor"/></svg>' },
  { label: 'Finance', to: '/finance', match: ['/finance'], requires: 'finance', icon: '<svg viewBox="0 0 24 24"><path d="M3 6h18v12H3V6Zm2 2v8h14V8H5Zm7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6-5a2 2 0 0 0 2-2H6v2Zm10-2a2 2 0 0 0 2 2V8h-2Zm2 6a2 2 0 0 0-2 2h2v-2ZM6 16h2a2 2 0 0 0-2-2v2Z" fill="currentColor"/></svg>' },
  { label: 'Invoices', to: '/finance/invoices', match: ['/finance/invoices'], requires: 'finance', icon: '<svg viewBox="0 0 24 24"><path d="M7 2h10a2 2 0 0 1 2 2v18l-3-2-2 2-2-2-2 2-2-2-3 2V4a2 2 0 0 1 2-2Zm2 5v2h6V7H9Zm0 4v2h6v-2H9Zm0 4v2h4v-2H9Z" fill="currentColor"/></svg>' },
  { label: 'Approvals', to: '/claims/approvals', match: ['/claims/approvals'], icon: '<svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" fill="currentColor"/></svg>' },
  { label: 'Accounts', to: '/finance/accounts', match: ['/finance/accounts'], requires: 'finance', icon: '<svg viewBox="0 0 24 24"><path d="M4 4h16v4H4V4Zm0 6h7v10H4V10Zm9 0h7v10h-7V10Zm-7 3v2h3v-2H6Zm9 0v2h3v-2h-3Z" fill="currentColor"/></svg>' },
  { label: 'Reports', to: '/finance/reports/general-ledger', match: ['/finance/reports'], requires: 'finance', icon: '<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5V3Zm3 14h2v-6H8v6Zm3 0h2V7h-2v10Zm3 0h2v-4h-2v4Z" fill="currentColor"/></svg>' },
  { label: 'Treasury', to: '/treasury', match: ['/treasury'], exact: true, requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M12 2 3 6v2h18V6l-9-4ZM5 10v7H3v3h18v-3h-2v-7h-3v7h-2v-7h-4v7H8v-7H5Z" fill="currentColor"/></svg>' },
  { label: 'Products', to: '/treasury/products', match: ['/treasury/products'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M4 4h16v5H4V4Zm0 7h7v9H4v-9Zm9 0h7v9h-7v-9Zm-7-5v1h12V6H6Zm0 7v5h3v-5H6Zm9 0v5h3v-5h-3Z" fill="currentColor"/></svg>' },
  { label: 'Payables', to: '/treasury/payables', match: ['/treasury/payables'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5V3Zm3 4v2h8V7H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z" fill="currentColor"/></svg>' },
  { label: 'Bank Accounts', to: '/treasury/bank-accounts', match: ['/treasury/bank-accounts'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M12 2 3 6v2h18V6l-9-4ZM5 10h3v7H5v-7Zm5 0h4v7h-4v-7Zm6 0h3v7h-3v-7ZM3 19h18v3H3v-3Z" fill="currentColor"/></svg>' },
  { label: 'Fund Transfers', to: '/treasury/fund-transfers', match: ['/treasury/fund-transfers'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M7 7h10l-3-3 1.4-1.4L21.8 9l-6.4 6.4L14 14l3-3H7V7Zm10 10H7l3 3-1.4 1.4L2.2 15l6.4-6.4L10 10l-3 3h10v4Z" fill="currentColor"/></svg>' },
  { label: 'Loans', to: '/treasury/loans', match: ['/treasury/loans'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M4 4h16v5H4V4Zm0 7h16v9H4v-9Zm3 2v2h5v-2H7Zm0 4v1h10v-1H7Zm9-4v2h2v-2h-2Z" fill="currentColor"/></svg>' },
  { label: 'Stakeholder and CP Payouts', to: '/treasury/stakeholder-payouts', match: ['/treasury/stakeholder-payouts'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M12 2 3 6v2h18V6l-9-4ZM5 10h14v9H5v-9Zm3 2v5h2v-5H8Zm4 0v5h2v-5h-2Z" fill="currentColor"/></svg>' },
  { label: 'HR Management', to: '/hr', match: ['/hr'], requires: 'hr', icon: '<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8.5.25c1.92.72 3.5 1.9 3.5 3.75v2h4v-2c0-2.31-4.16-3.62-7.5-3.75Z" fill="currentColor"/></svg>' },
  { label: 'Vault', to: '/vault', match: ['/vault'], requires: 'vault', icon: '<svg viewBox="0 0 24 24"><path d="M17 8V6a5 5 0 0 0-10 0v2H5v14h14V8h-2ZM9 6a3 3 0 0 1 6 0v2H9V6Zm4 10.73V19h-2v-2.27A2 2 0 1 1 13 16.73Z" fill="currentColor"/></svg>' },
  { label: 'Settings', to: '/setup', match: ['/setup'], requires: 'admin', icon: '<svg viewBox="0 0 24 24"><path d="m19.43 12.98.04-.98-.04-.98 2.11-1.65-2-3.46-2.49 1a7.1 7.1 0 0 0-1.69-.98L15 3h-4l-.36 2.93c-.6.24-1.17.56-1.69.98l-2.49-1-2 3.46 2.11 1.65-.04.98.04.98-2.11 1.65 2 3.46 2.49-1c.52.42 1.09.74 1.69.98L11 21h4l.36-2.93c.6-.24 1.17-.56 1.69-.98l2.49 1 2-3.46-2.11-1.65ZM13 15.5A3.5 3.5 0 1 1 13 8a3.5 3.5 0 0 1 0 7.5Z" fill="currentColor"/></svg>' }
]

const showBack = computed(() => {
  return !['dashboard', 'login'].includes(route.name) && !route.path.startsWith('/setup')
})

const filteredLauncherItems = computed(() => {
  const term = launcherSearch.value.toLowerCase()
  let items = launcherItems
  if (!isAdmin.value) {
    items = items.filter(item => !item.to.startsWith('/setup'))
  }
  if (!hasTreasuryAccess.value) {
    items = items.filter(item => !item.to.startsWith('/treasury'))
  }
  if (!hasFinanceAccess.value) {
    items = items.filter(item => !item.to.startsWith('/finance'))
  }
  if (!hasHrAccess.value) {
    items = items.filter(item => !item.to.startsWith('/hr'))
  }
  return items.filter((item) => `${item.label} ${item.type}`.toLowerCase().includes(term))
})

const visibleNavItems = computed(() => navItems.filter((item) => {
  if (item.requires === 'admin' && !isAdmin.value) return false
  if (item.requires === 'finance' && !hasFinanceAccess.value) return false
  if (item.requires === 'treasury' && !hasTreasuryAccess.value) return false
  if (item.requires === 'hr' && !hasHrAccess.value) return false
  if (item.requires === 'vault' && !hasVaultAccess.value) return false
  return true
}))

const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  if (!segments.length) return []
  return segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`
    return {
      path,
      label: breadcrumbLabels[path] || titleizeSegment(segment, segments[index - 1])
    }
  })
})

const breadcrumbLabels = {
  '/tasks': 'Task Management',
  '/customers': 'Customers',
  '/opportunities': 'Opportunities',
  '/projects': 'Projects',
  '/finance': 'Finance',
  '/finance/vendors': 'Vendors',
  '/finance/transactions': 'Transactions',
  '/finance/accounts': 'Chart of Accounts',
  '/finance/invoices': 'Invoices',
  '/finance/reports': 'Reports',
  '/finance/reports/general-ledger': 'General Ledger',
  '/finance/reports/customer-ledger': 'Customer Ledger',
  '/finance/reports/vendor-ledger': 'Vendor Ledger',
  '/claims': 'Claims',
  '/claims/approvals': 'Approvals',
  '/treasury': 'Treasury',
  '/treasury/products': 'Products',
  '/treasury/payables': 'Payables',
  '/treasury/expense-log': 'Expense Log',
  '/treasury/bank-accounts': 'Bank Accounts',
  '/treasury/fund-transfers': 'Fund Transfers',
  '/treasury/loans': 'Loans',
  '/treasury/stakeholder-payouts': 'Stakeholder Payouts',
  '/hr': 'HR Management',
  '/setup': 'Settings',
  '/vault': 'Vault',
  '/profile': 'Profile'
}

function isNavActive(item) {
  if (item.to === '/') return route.path === '/'
  if (item.exact) return item.match.includes(route.path)
  return item.match.some((prefix) => route.path.startsWith(prefix))
}

function titleizeSegment(segment, parentSegment = '') {
  if (/^\d+$/.test(segment)) {
    const recordLabels = {
      customers: 'Customer',
      opportunities: 'Opportunity',
      projects: 'Project',
      vendors: 'Vendor',
      invoices: 'Invoice',
      transactions: 'Transaction',
      tasks: 'Task',
      products: 'Product',
      loans: 'Loan'
    }
    return `${recordLabels[parentSegment] || 'Record'} #${segment}`
  }
  const txMatch = segment.match(/^TXN(\d+)$/i)
  if (txMatch) return `Transaction #${String(Number(txMatch[1])).padStart(3, '0')}`
  return segment
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getResultBadgeClass(type) {
  switch (type?.toLowerCase()) {
    case 'customer': return 'badge-luminous-blue'
    case 'invoice': return 'badge-luminous-green'
    case 'task': return 'badge-luminous-purple'
    case 'transaction': return 'badge-luminous-amber'
    default: return 'badge-luminous-blue'
  }
}

watch(globalSearch, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  const term = value.trim()
  if (term.length < 2) {
    globalSearchResults.value = []
    searchLoading.value = false
    return
  }
  globalSearchOpen.value = true
  searchLoading.value = true
  searchTimer = setTimeout(async () => {
    try {
      const data = await apiGet(`/api/search?q=${encodeURIComponent(term)}`)
      globalSearchResults.value = data.results || []
    } catch (err) {
      globalSearchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }, 220)
})

function closeGlobalSearch() {
  globalSearchOpen.value = false
}

function openSearchResult(result) {
  globalSearch.value = ''
  globalSearchResults.value = []
  closeGlobalSearch()
  router.push(result.url)
}

function openFirstSearchResult() {
  if (globalSearchResults.value.length > 0) {
    openSearchResult(globalSearchResults.value[0])
  }
}

function startAppLoader() {
  activeLoaders.value += 1
  if (loaderDelayTimer) clearTimeout(loaderDelayTimer)
  loaderDelayTimer = setTimeout(() => {
    if (activeLoaders.value > 0) {
      isAppLoading.value = true
    }
  }, 400)
}

function stopAppLoader() {
  activeLoaders.value = Math.max(0, activeLoaders.value - 1)
  if (activeLoaders.value === 0) {
    if (loaderDelayTimer) clearTimeout(loaderDelayTimer)
    setTimeout(() => {
      if (activeLoaders.value === 0) {
        isAppLoading.value = false
      }
    }, 180)
  }
}

function showRouteLoader() {
  // Only shows top laser progress bar, NOT the full screen backdrop!
  isRouteNavigating.value = true
  if (routeLoaderTimer) clearTimeout(routeLoaderTimer)
  routeLoaderTimer = setTimeout(() => {
    isRouteNavigating.value = false
  }, 280)
}

function goBack() {
  router.back()
}

async function logout() {
  await apiPost('/api/auth/logout')
  window.localStorage.removeItem('lms_user')
  router.push({ name: 'login' })
}
</script>

<style scoped>
/* =========================================================
   TOP NON-BLOCKING LASER PROGRESS BAR
   ========================================================= */
.app-loader-track {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100vw;
  height: 3px;
  z-index: 99999;
  background: rgba(2, 132, 199, 0.15);
  overflow: hidden;
  pointer-events: none;
}

.app-loader-bar {
  height: 100%;
  width: 45%;
  background: linear-gradient(90deg, #0284c7, #6366f1, #06b6d4);
  box-shadow: 0 0 10px rgba(2, 132, 199, 0.8);
  animation: appLaserSlide 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.app-loader-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: radial-gradient(circle, rgba(2, 132, 199, 0.4) 0%, transparent 70%);
  filter: blur(3px);
  pointer-events: none;
}

@keyframes appLaserSlide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}

.laser-fade-enter-active,
.laser-fade-leave-active {
  transition: opacity 0.2s ease;
}

.laser-fade-enter-from,
.laser-fade-leave-to {
  opacity: 0;
}

/* =========================================================
   SLOW OPERATION BACKDROP MODAL (> 400ms)
   ========================================================= */
.app-loader-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.32);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.app-loader-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 18px;
  box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.2);
}

.app-spinner-box {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-spinner-svg {
  width: 100%;
  height: 100%;
  animation: modernSpin 1.1s linear infinite;
}

.app-spinner-track-bg {
  stroke: rgba(2, 132, 199, 0.12);
}

.app-spinner-ring-anim {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  transform-origin: center;
  animation: modernDash 1.4s ease-in-out infinite;
}

.app-spinner-center-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0284c7;
  box-shadow: 0 0 10px #0284c7;
  animation: modernPulse 1.4s ease-in-out infinite;
}

.app-loader-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.app-loader-title {
  font-family: var(--font-display, 'Outfit', sans-serif);
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.app-loader-subtitle {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

@keyframes modernSpin {
  100% { transform: rotate(360deg); }
}

@keyframes modernDash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}

@keyframes modernPulse {
  0%, 100% { transform: scale(0.85); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
}

.app-loader-fade-enter-active,
.app-loader-fade-leave-active {
  transition: opacity 0.22s ease;
}

.app-loader-fade-enter-from,
.app-loader-fade-leave-to {
  opacity: 0;
}

/* =========================================================
   SCROLLTIDE FROSTED GLOBAL HEADER
   ========================================================= */
.global-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 64px;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* App Launcher */
.launcher-dropdown {
  position: relative;
}

.launcher-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: #475569;
  cursor: pointer;
  list-style: none;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.launcher-summary:hover {
  background: #f1f5f9;
  border-color: rgba(203, 213, 225, 0.6);
  color: #0284c7;
}

.launcher-summary::-webkit-details-marker {
  display: none;
}

.launcher-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  width: 320px;
  max-height: 440px;
  padding: 14px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.launcher-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.launcher-search-wrap .search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
}

.launcher-search-wrap input {
  width: 100%;
  padding: 8px 12px 8px 34px;
  font-size: 13px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  outline: none;
  transition: all 0.2s ease;
}

.launcher-search-wrap input:focus {
  background: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}

.launcher-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
  overflow-y: auto;
  max-height: 340px;
}

.launcher-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: #1e293b;
  transition: all 0.15s ease;
}

.launcher-item:hover {
  background: #f1f5f9;
  transform: translateX(2px);
}

.launcher-item strong {
  font-size: 13px;
  font-weight: 600;
}

.launcher-item-tag {
  font-size: 11px;
  color: #64748b;
  background: #e2e8f0;
  padding: 2px 7px;
  border-radius: 6px;
  font-weight: 500;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-logo {
  height: 32px;
  width: auto;
  object-fit: contain;
}

.brand-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  background: rgba(2, 132, 199, 0.08);
  border: 1px solid rgba(2, 132, 199, 0.2);
  border-radius: 9999px;
  font-family: var(--font-sans);
  font-size: 10.5px;
  font-weight: 700;
  color: #0284c7;
  letter-spacing: 0.04em;
}

.brand-badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

/* =========================================================
   COMMAND PALETTE GLOBAL SEARCH
   ========================================================= */
.global-search {
  flex: 1;
  max-width: 540px;
  position: relative;
}

.global-search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.global-search-box.focused,
.global-search-box:focus-within {
  background: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15), 0 4px 12px rgba(0, 0, 0, 0.04);
}

.search-lens {
  color: #64748b;
  flex-shrink: 0;
}

.global-search-box input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-family: var(--font-sans);
  font-size: 13.5px;
  color: #0f172a;
}

.global-search-box input::placeholder {
  color: #94a3b8;
  font-size: 13px;
}

.search-kbd-hint {
  display: flex;
  align-items: center;
  gap: 4px;
}

.global-search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  padding: 8px;
  z-index: 1200;
  max-height: 400px;
  overflow-y: auto;
}

.global-search-result {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.global-search-result:hover {
  background: #f1f5f9;
}

.result-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2.5px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.result-info strong {
  font-size: 13px;
  color: #0f172a;
}

.result-info small {
  font-size: 11.5px;
  color: #64748b;
}

.result-arrow {
  color: #cbd5e1;
  transition: transform 0.15s ease;
}

.global-search-result:hover .result-arrow {
  color: #0284c7;
  transform: translateX(2px);
}

.global-search-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  font-size: 13px;
  color: #64748b;
}

.search-mini-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  border-top-color: #0284c7;
  animation: modernSpin 0.7s linear infinite;
}

/* =========================================================
   HEADER RIGHT & PROFILE
   ========================================================= */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-button {
  position: relative;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 38px !important;
  height: 38px !important;
  min-width: 38px;
  min-height: 38px;
  padding: 0 !important;
  border-radius: 10px;
  background: #ffffff !important;
  border: 1px solid rgba(226, 232, 240, 0.9) !important;
  color: #475569 !important;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.header-icon-button:hover {
  background: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #0284c7 !important;
}

.header-action-svg {
  width: 20px !important;
  height: 20px !important;
  fill: currentColor !important;
  color: inherit !important;
  display: block;
}

.notification-dot-luminous {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
}

/* User Profile Pill */
.user-dropdown {
  position: relative;
}

.user-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 4px 5px;
  border-radius: 9999px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  cursor: pointer;
  list-style: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.user-summary::-webkit-details-marker {
  display: none;
}

.user-summary:hover {
  border-color: rgba(2, 132, 199, 0.4);
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.08);
}

.user-avatar-circle {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
}

.user-avatar-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  border: 1.5px solid #ffffff;
  box-shadow: 0 0 6px #10b981;
}

.user-summary-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.user-name-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.user-role-micro {
  font-size: 10.5px;
  color: #64748b;
  line-height: 1.2;
}

.chevron-icon {
  color: #94a3b8;
  margin-left: 2px;
}

.user-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 250px;
  padding: 10px;
  z-index: 1200;
}

.user-menu-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 6px;
}

.profile-header-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
}

.profile-header-details {
  display: flex;
  flex-direction: column;
}

.profile-header-details strong {
  font-size: 13.5px;
  color: #0f172a;
}

.profile-header-details small {
  font-size: 11.5px;
  color: #64748b;
}

.user-menu-actions {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  text-decoration: none;
  background: transparent;
  border: none;
  width: 100%;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.user-menu-item:hover {
  background: #f1f5f9;
  color: #0284c7;
}

.user-menu-item.logout {
  color: #ef4444;
}

.user-menu-item.logout:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

/* =========================================================
   ENTERPRISE SIDEBAR & SHELL
   ========================================================= */
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #f8fafc;
  position: relative;
}

.layout-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

.enterprise-sidebar {
  width: 260px;
  min-width: 260px;
  max-width: 260px;
  flex-shrink: 0;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 2px 0 10px rgba(15, 23, 42, 0.02);
  z-index: 40;
  padding: 14px 12px;
  transition: width 0.24s cubic-bezier(0.16, 1, 0.3, 1),
              min-width 0.24s cubic-bezier(0.16, 1, 0.3, 1),
              max-width 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.app-shell.sidebar-collapsed .enterprise-sidebar {
  width: 72px;
  min-width: 72px;
  max-width: 72px;
}

.main-layout-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
  position: relative;
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 16px 6px;
  border-bottom: 1px solid rgba(241, 245, 249, 1);
  margin-bottom: 12px;
}

.sidebar-collapsed .sidebar-branding {
  display: none;
}

.sidebar-branding {
  display: flex;
  flex-direction: column;
}

.sidebar-kicker {
  font-size: 10.5px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sidebar-branding strong {
  font-family: var(--font-display);
  font-size: 15px;
  color: #0f172a;
}

.sidebar-toggle {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 30px !important;
  height: 30px !important;
  min-width: 30px;
  min-height: 30px;
  padding: 0 !important;
  border-radius: 8px;
  border: 1px solid rgba(226, 232, 240, 0.9) !important;
  background: #ffffff !important;
  color: #475569 !important;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.sidebar-toggle:hover {
  background: #f8fafc !important;
  color: #0284c7 !important;
  border-color: #cbd5e1 !important;
}

.toggle-arrow-svg {
  width: 18px !important;
  height: 18px !important;
  fill: currentColor !important;
  color: inherit !important;
  display: block;
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.toggle-arrow-svg.rotated {
  transform: rotate(180deg);
}

.mobile-menu-button {
  display: none !important;
}

.mobile-sidebar-close {
  display: none;
}

/* Sidebar Nav Items (Kokonut UI Sliding Pill) */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  overflow-y: auto;
  padding-right: 2px;
}

.sidebar-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 10px;
  color: #475569;
  text-decoration: none;
  font-family: var(--font-sans);
  font-size: 13.5px;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-nav-item:hover {
  color: #0284c7;
  background: rgba(2, 132, 199, 0.05);
  transform: translateX(2px);
}

.sidebar-nav-item .nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #64748b;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.sidebar-nav-item:hover .nav-icon {
  color: #0284c7;
}

.sidebar-nav-item .nav-active-pip {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3.5px;
  height: 18px;
  border-radius: 0 4px 4px 0;
  background: var(--primary-gradient);
  box-shadow: 0 0 8px #0284c7;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-nav-item.active {
  color: #0284c7;
  background: linear-gradient(90deg, rgba(2, 132, 199, 0.1) 0%, rgba(99, 102, 241, 0.04) 100%);
  font-weight: 700;
}

.sidebar-nav-item.active .nav-icon {
  color: #0284c7;
}

.sidebar-nav-item.active .nav-active-pip {
  transform: translateY(-50%) scaleY(1);
}

.sidebar-collapsed .nav-label {
  display: none;
}

.sidebar-collapsed .sidebar-nav-item {
  justify-content: center;
  padding: 10px;
}

.sidebar-footer {
  padding-top: 14px;
  border-top: 1px solid rgba(241, 245, 249, 1);
}

.sidebar-security-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}

.sidebar-collapsed .sidebar-security-badge {
  justify-content: center;
  padding: 8px;
}

/* =========================================================
   TOP BAR & BREADCRUMBS
   ========================================================= */
.main.main-content-scrollable {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 28px 24px;
  scroll-behavior: smooth;
  background: #f8fafc;
  min-height: 0;
}

/* =========================================================
   ENTERPRISE FIXED FOOTER (Corevian Style)
   ========================================================= */
.app-footer {
  flex-shrink: 0;
  height: 38px;
  border-top: 1px solid rgba(226, 232, 240, 0.85);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  font-size: 11.5px;
  color: #64748b;
  font-weight: 500;
  z-index: 20;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-divider {
  color: #cbd5e1;
}

.footer-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #059669;
  font-weight: 600;
}

.footer-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
  animation: footerDotPulse 2s infinite ease-in-out;
}

@keyframes footerDotPulse {
  0%, 100% {
    transform: scale(0.9);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.15);
    opacity: 1;
  }
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  background: rgba(2, 132, 199, 0.08);
  border: 1px solid rgba(2, 132, 199, 0.2);
  border-radius: 4px;
  color: #0284c7;
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  font-weight: 600;
}

.footer-product-label {
  font-size: 11px;
  color: #94a3b8;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}

.breadcrumb-home {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #64748b;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.15s ease;
}

.breadcrumb-home:hover {
  color: #0284c7;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.breadcrumb-sep {
  color: #cbd5e1;
}

.breadcrumb-item a {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
}

.breadcrumb-item a:hover {
  color: #0284c7;
}

.breadcrumb-active {
  font-weight: 700;
  color: #0f172a;
}

.back-button {
  padding: 7px 14px;
  font-size: 12.5px;
}

.back-arrow {
  transition: transform 0.18s ease;
}

.back-button:hover .back-arrow {
  transform: translateX(-3px);
}

/* Popover Animation */
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Mobile Responsiveness */
@media (max-width: 900px) {
  .global-header {
    padding: 0 16px;
  }
  .global-search {
    display: none;
  }
  .app-shell {
    grid-template-columns: 1fr;
  }
  .enterprise-sidebar {
    position: fixed;
    top: 0;
    left: -280px;
    width: 280px;
    height: 100vh;
    z-index: 2000;
    transition: left 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .mobile-menu-button,
  .mobile-sidebar-close {
    display: flex;
  }
  .app-shell.mobile-nav-open .enterprise-sidebar {
    left: 0;
  }
  .mobile-sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
    z-index: 1999;
  }
}
</style>
