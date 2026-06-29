<template>
  <RouterView v-if="route.name === 'login'" />

  <template v-else>
  <div v-if="isAppLoading" class="app-loader" aria-live="polite" aria-label="Loading">
    <div class="app-loader-track">
      <div class="app-loader-bar"></div>
    </div>
  </div>
  <header class="global-header">
    <div class="header-left">
      <button
        class="mobile-menu-button"
        type="button"
        :aria-expanded="mobileNavOpen"
        aria-controls="primary-sidebar"
        aria-label="Open navigation"
        @click="mobileNavOpen = true"
      >
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M4 7h16v2H4V7Zm0 4h16v2H4v-2Zm0 4h16v2H4v-2Z" fill="currentColor"/>
        </svg>
      </button>
      <div class="app-launcher">
        <details ref="launcherRef" class="launcher-dropdown">
          <summary title="App Launcher">
            <svg class="icon-9dots" viewBox="0 0 24 24" width="24" height="24">
              <circle cx="4" cy="4" r="2.5" fill="currentColor" />
              <circle cx="12" cy="4" r="2.5" fill="currentColor" />
              <circle cx="20" cy="4" r="2.5" fill="currentColor" />
              <circle cx="4" cy="12" r="2.5" fill="currentColor" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <circle cx="20" cy="12" r="2.5" fill="currentColor" />
              <circle cx="4" cy="20" r="2.5" fill="currentColor" />
              <circle cx="12" cy="20" r="2.5" fill="currentColor" />
              <circle cx="20" cy="20" r="2.5" fill="currentColor" />
            </svg>
          </summary>
          <div class="launcher-menu">
            <input v-model="launcherSearch" type="search" placeholder="Search apps and items...">
            <div class="launcher-list">
              <RouterLink
                v-for="item in filteredLauncherItems"
                :key="item.to"
                :to="item.to"
              >
                <strong>{{ item.label }}</strong>
                <span>{{ item.type }}</span>
              </RouterLink>
            </div>
          </div>
        </details>
      </div>
      <RouterLink class="brand" to="/">
        <img :src="organisationLogo" :alt="`${organisationName} Logo`" class="brand-logo" />
      </RouterLink>
    </div>
    <div ref="globalSearchRef" class="global-search">
      <div class="global-search-box">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
        </svg>
        <input
          v-model="globalSearch"
          type="search"
          placeholder="Search customers, invoices, transactions, ledger..."
          @focus="globalSearchOpen = true"
          @keydown.enter.prevent="openFirstSearchResult"
          @keydown.esc.prevent="closeGlobalSearch"
        >
      </div>
      <div v-if="globalSearchOpen && globalSearch.length >= 2" class="global-search-results">
        <div v-if="searchLoading" class="global-search-state">Searching...</div>
        <button
          v-for="result in globalSearchResults"
          v-else
          :key="`${result.type}-${result.url}`"
          class="global-search-result"
          type="button"
          @click="openSearchResult(result)"
        >
          <span class="result-type">{{ result.type }}</span>
          <strong>{{ result.label }}</strong>
          <small>{{ result.subtitle || result.meta }}</small>
        </button>
        <div v-if="!searchLoading && globalSearchResults.length === 0" class="global-search-state">No matching records</div>
      </div>
    </div>
    <div class="header-right">
      <button class="header-icon-button" type="button" aria-label="Notifications" title="Notifications">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5-6.7V3a2 2 0 1 0-4 0v1.3A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" fill="currentColor"/>
        </svg>
        <span class="notification-dot"></span>
      </button>
      <details v-if="user" ref="userDropdownRef" class="user-dropdown">
        <summary>
          <svg class="icon-user" viewBox="0 0 24 24" width="24" height="24">
            <circle cx="12" cy="8" r="4" fill="currentColor" />
            <path d="M20 20c0-4.4-3.6-8-8-8s-8 3.6-8 8" fill="currentColor" />
          </svg>
          {{ userName }}
        </summary>
        <div class="user-menu">
          <div class="user-menu-profile">
            <strong>{{ userName }}</strong>
            <span class="profile-pill">{{ userProfile }}</span>
            <small>{{ userEmail }}</small>
          </div>
          <div class="user-menu-actions">
            <RouterLink to="/profile">
              <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right: 8px;"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>
              My Profile
            </RouterLink>
            <button type="button" class="logout-link" @click="logout">
              <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right: 8px;"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/></svg>
              Logout
            </button>
          </div>
        </div>
      </details>
    </div>
  </header>

  <div
    v-if="mobileNavOpen"
    class="mobile-sidebar-backdrop"
    aria-hidden="true"
    @click="mobileNavOpen = false"
  ></div>
  <div class="app-shell" :class="{ 'sidebar-collapsed': sidebarCollapsed, 'mobile-nav-open': mobileNavOpen }">
    <aside id="primary-sidebar" class="enterprise-sidebar" aria-label="Primary navigation">
      <div class="sidebar-head">
        <div>
          <span class="sidebar-kicker">CRM Workspace</span>
          <strong>{{ organisationShortName }}</strong>
        </div>
        <button class="icon-button mobile-sidebar-close" type="button" aria-label="Close navigation" @click="mobileNavOpen = false">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5Zm12.6 1.4L6.4 19 5 17.6 17.6 5 19 6.4Z" fill="currentColor"/></svg>
        </button>
        <button class="icon-button sidebar-toggle" type="button" :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M15.5 19 8.5 12l7-7 1.4 1.4-5.6 5.6 5.6 5.6-1.4 1.4Z" fill="currentColor"/></svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in visibleNavItems"
          :key="item.to"
          :to="item.to"
          :class="{ active: isNavActive(item) }"
          :title="item.label"
        >
          <span class="nav-icon" aria-hidden="true" v-html="item.icon"></span>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 2.2 6 2.25V11c0 3.8-2.45 7.55-6 8.9-3.55-1.35-6-5.1-6-8.9V6.45l6-2.25Z" fill="currentColor"/></svg>
        </span>
        <span class="nav-label">Secure enterprise access</span>
      </div>
    </aside>

    <main class="main">
      <div class="top-bar">
        <nav class="breadcrumb-trail" aria-label="Breadcrumb">
          <RouterLink to="/">Home</RouterLink>
          <span v-for="crumb in breadcrumbs" :key="crumb.path">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="m9 18 6-6-6-6 1.4-1.4L17.8 12l-7.4 7.4L9 18Z" fill="currentColor"/></svg>
            <RouterLink v-if="crumb.path && crumb.path !== route.path" :to="crumb.path">{{ crumb.label }}</RouterLink>
            <strong v-else>{{ crumb.label }}</strong>
          </span>
        </nav>
        <button v-if="showBack" class="back-button" type="button" @click="goBack">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M20 11H7.8l5.6-5.6L12 4 4 12l8 8 1.4-1.4L7.8 13H20v-2Z" fill="currentColor"/></svg>
          Back
        </button>
      </div>
      <RouterView />
    </main>
  </div>
  </template>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost } from '../api/client'
import { hasHrPermission, loadHrSettings } from '../utils/hrStorage'

const route = useRoute()
const router = useRouter()

// Template refs for click-outside detection
const launcherRef = ref(null)
const userDropdownRef = ref(null)
const globalSearchRef = ref(null)
const isAppLoading = ref(false)
const activeLoaders = ref(0)
let loaderDelayTimer = null
let routeLoaderTimer = null

// Close both dropdowns when clicking outside them
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

function refreshUserBranding() {
  user.value = window.localStorage.getItem('lms_user')
  applyOrganisationBranding()
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick, true)
  window.addEventListener('app-loading-start', startAppLoader)
  window.addEventListener('app-loading-stop', stopAppLoader)
  window.addEventListener('organisation-branding-updated', refreshUserBranding)
  applyOrganisationBranding()
  loadCurrentProfile()
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick, true)
  window.removeEventListener('app-loading-start', startAppLoader)
  window.removeEventListener('app-loading-stop', stopAppLoader)
  window.removeEventListener('organisation-branding-updated', refreshUserBranding)
  if (searchTimer) clearTimeout(searchTimer)
  if (loaderDelayTimer) clearTimeout(loaderDelayTimer)
  if (routeLoaderTimer) clearTimeout(routeLoaderTimer)
})

const user = ref(window.localStorage.getItem('lms_user'))
watch(() => route.path, () => {
  user.value = window.localStorage.getItem('lms_user')
  applyOrganisationBranding()
  // Auto-close the launcher whenever navigation occurs
  if (launcherRef.value) launcherRef.value.removeAttribute('open')
  mobileNavOpen.value = false
  closeGlobalSearch()
  showRouteLoader()
})
const userName = computed(() => {
  if (!user.value) return ''
  try {
    const userData = JSON.parse(user.value)
    return userData.full_name
  } catch {
    return ''
  }
})
const currentUserData = computed(() => {
  if (!user.value) return null
  try {
    return JSON.parse(user.value)
  } catch {
    return null
  }
})
const organisation = computed(() => currentUserData.value?.organisation || {})
const organisationName = computed(() => organisation.value.organisationName || 'CRM')
const organisationShortName = computed(() => {
  const name = organisationName.value
  if (!name || name === 'CRM') return 'CRM'
  return name.split(/\s+/).slice(0, 2).join(' ')
})
const organisationLogo = computed(() => organisation.value.logo || '/logo.png')
const organisationThemeColor = computed(() => organisation.value.themeColor || '#f97316')
watch(organisationThemeColor, applyOrganisationBranding)
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
  if (!user.value) return 'No profile'
  try {
    return JSON.parse(user.value).role_name || 'No profile'
  } catch {
    return 'No profile'
  }
})
const isAdmin = computed(() => userProfile.value === 'System Administrator' || userProfile.value === 'Admin' || userProfile.value === 'Super Admin')
const isSuperAdmin = computed(() => userProfile.value === 'Super Admin' || currentUserData.value?.is_super_admin === true)
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
  { label: 'Organisations', type: 'Super Admin', to: '/setup/organisations', requires: 'super-admin' },
  { label: 'Users', type: 'Setup', to: '/setup#users' },
  { label: 'Roles', type: 'Setup', to: '/setup#roles' },
  { label: 'Object Manager', type: 'Setup', to: '/setup#objects' }
]
const navItems = [
  { label: 'Dashboard', to: '/', match: ['/'], icon: '<svg viewBox="0 0 24 24"><path d="M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z" fill="currentColor"/></svg>' },
  { label: 'Customers', to: '/customers', match: ['/customers'], icon: '<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" fill="currentColor"/></svg>' },
  { label: 'Opportunities', to: '/opportunities', match: ['/opportunities'], icon: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Zm1 1v9l6.4 6.4 1.4-1.4-5-5H22A9 9 0 0 0 13 3Z" fill="currentColor"/></svg>' },
  { label: 'Projects', to: '/projects', match: ['/projects'], icon: '<svg viewBox="0 0 24 24"><path d="M10 4h4v3h-4V4ZM4 9h16v11H4V9Zm2 2v7h12v-7H6Zm10-7h2a2 2 0 0 1 2 2v1h-2V6h-2V4ZM6 4h2v2H6v1H4V6a2 2 0 0 1 2-2Z" fill="currentColor"/></svg>' },
  { label: 'Claims', to: '/claims', match: ['/claims'], exact: true, icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Zm-5 4h8v2H8v-2Zm0 4h6v2H8v-2Zm0-8h3v2H8V9Z" fill="currentColor"/></svg>' },
  { label: 'Finance', to: '/finance', match: ['/finance'], requires: 'finance', icon: '<svg viewBox="0 0 24 24"><path d="M3 6h18v12H3V6Zm2 2v8h14V8H5Zm7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6-5a2 2 0 0 0 2-2H6v2Zm10-2a2 2 0 0 0 2 2V8h-2Zm2 6a2 2 0 0 0-2 2h2v-2ZM6 16h2a2 2 0 0 0-2-2v2Z" fill="currentColor"/></svg>' },
  { label: 'Invoices', to: '/finance/invoices', match: ['/finance/invoices'], requires: 'finance', icon: '<svg viewBox="0 0 24 24"><path d="M7 2h10a2 2 0 0 1 2 2v18l-3-2-2 2-2-2-2 2-2-2-3 2V4a2 2 0 0 1 2-2Zm2 5v2h6V7H9Zm0 4v2h6v-2H9Zm0 4v2h4v-2H9Z" fill="currentColor"/></svg>' },
  { label: 'Approvals', to: '/claims/approvals', match: ['/claims/approvals'], icon: '<svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" fill="currentColor"/></svg>' },
  { label: 'Accounts', to: '/finance/accounts', match: ['/finance/accounts'], requires: 'finance', icon: '<svg viewBox="0 0 24 24"><path d="M4 4h16v4H4V4Zm0 6h7v10H4V10Zm9 0h7v10h-7V10Zm-7 3v2h3v-2H6Zm9 0v2h3v-2h-3Z" fill="currentColor"/></svg>' },
  { label: 'Reports', to: '/finance/reports/general-ledger', match: ['/finance/reports'], requires: 'finance', icon: '<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5V3Zm3 14h2v-6H8v6Zm3 0h2V7h-2v10Zm3 0h2v-4h-2v4Z" fill="currentColor"/></svg>' },
  { label: 'Treasury', to: '/treasury', match: ['/treasury'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M12 2 3 6v2h18V6l-9-4ZM5 10v7H3v3h18v-3h-2v-7h-3v7h-2v-7h-4v7H8v-7H5Z" fill="currentColor"/></svg>' },
  { label: 'Products', to: '/treasury/products', match: ['/treasury/products'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M4 4h16v5H4V4Zm0 7h7v9H4v-9Zm9 0h7v9h-7v-9Zm-7-5v1h12V6H6Zm0 7v5h3v-5H6Zm9 0v5h3v-5h-3Z" fill="currentColor"/></svg>' },
  { label: 'Payables', to: '/treasury/payables', match: ['/treasury/payables'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5V3Zm3 4v2h8V7H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z" fill="currentColor"/></svg>' },
  { label: 'Bank Accounts', to: '/treasury/bank-accounts', match: ['/treasury/bank-accounts'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M12 2 3 6v2h18V6l-9-4ZM5 10h3v7H5v-7Zm5 0h4v7h-4v-7Zm6 0h3v7h-3v-7ZM3 19h18v3H3v-3Z" fill="currentColor"/></svg>' },
  { label: 'Fund Transfers', to: '/treasury/fund-transfers', match: ['/treasury/fund-transfers'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M7 7h10l-3-3 1.4-1.4L21.8 9l-6.4 6.4L14 14l3-3H7V7Zm10 10H7l3 3-1.4 1.4L2.2 15l6.4-6.4L10 10l-3 3h10v4Z" fill="currentColor"/></svg>' },
  { label: 'Loans', to: '/treasury/loans', match: ['/treasury/loans'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M4 4h16v5H4V4Zm0 7h16v9H4v-9Zm3 2v2h5v-2H7Zm0 4v1h10v-1H7Zm9-4v2h2v-2h-2Z" fill="currentColor"/></svg>' },
  { label: 'Stakeholder and CP Payouts', to: '/treasury/stakeholder-payouts', match: ['/treasury/stakeholder-payouts'], requires: 'treasury', icon: '<svg viewBox="0 0 24 24"><path d="M12 2 3 6v2h18V6l-9-4ZM5 10h14v9H5v-9Zm3 2v5h2v-5H8Zm4 0v5h2v-5h-2Z" fill="currentColor"/></svg>' },
  { label: 'HR Management', to: '/hr', match: ['/hr'], requires: 'hr', icon: '<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Zm8.5.25c1.92.72 3.5 1.9 3.5 3.75v2h4v-2c0-2.31-4.16-3.62-7.5-3.75Z" fill="currentColor"/></svg>' },
  { label: 'Vault', to: '/vault', match: ['/vault'], requires: 'vault', icon: '<svg viewBox="0 0 24 24"><path d="M17 8V6a5 5 0 0 0-10 0v2H5v14h14V8h-2ZM9 6a3 3 0 0 1 6 0v2H9V6Zm4 10.73V19h-2v-2.27A2 2 0 1 1 13 16.73Z" fill="currentColor"/></svg>' },
  { label: 'Organisations', to: '/setup/organisations', match: ['/setup/organisations'], requires: 'super-admin', icon: '<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" fill="currentColor"/></svg>' },
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
  if (!isSuperAdmin.value) {
    items = items.filter(item => item.requires !== 'super-admin')
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
  if (item.requires === 'super-admin' && !isSuperAdmin.value) return false
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
      label: breadcrumbLabels[path] || titleizeSegment(segment)
    }
  })
})

const breadcrumbLabels = {
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
  '/claims': 'Claims',
  '/claims/approvals': 'Approvals',
  '/treasury': 'Treasury',
  '/treasury/products': 'Products',
  '/treasury/payables': 'Payables',
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

function titleizeSegment(segment) {
  if (/^\d+$/.test(segment)) return `#TXN${String(Number(segment)).padStart(3, '0')}`
  const txMatch = segment.match(/^TXN(\d+)$/i)
  if (txMatch) return `#TXN${String(Number(txMatch[1])).padStart(3, '0')}`
  return segment
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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
  }, 120)
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
  isAppLoading.value = true
  if (routeLoaderTimer) clearTimeout(routeLoaderTimer)
  routeLoaderTimer = setTimeout(() => {
    if (activeLoaders.value === 0) {
      isAppLoading.value = false
    }
  }, 260)
}

function applyOrganisationBranding() {
  document.documentElement.style.setProperty('--primary', organisationThemeColor.value)
  document.title = organisation.value.dashboardTitle || `${organisationName.value} CRM`
  const favicon = organisation.value.favicon || organisationLogo.value
  let faviconEl = document.querySelector('link[rel="icon"]')
  if (!faviconEl) {
    faviconEl = document.createElement('link')
    faviconEl.rel = 'icon'
    document.head.appendChild(faviconEl)
  }
  faviconEl.href = favicon
}

async function loadCurrentProfile() {
  if (!window.localStorage.getItem('lms_user')) return
  try {
    const profile = await apiGet('/api/profile')
    if (profile.user) {
      window.localStorage.setItem('lms_user', JSON.stringify(profile.user))
      refreshUserBranding()
    }
  } catch (err) {
    // The API client handles unauthorized redirects.
  }
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
.user-menu {
  width: 260px;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--line);
  overflow: hidden;
  background: #ffffff;
  margin-top: 6px;
}

.app-loader {
  left: 0;
  pointer-events: none;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 10000;
}

.app-loader-track {
  background: rgba(249, 115, 22, 0.12);
  height: 3px;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.app-loader-bar {
  animation: appLoaderSlide 1.05s ease-in-out infinite;
  background: linear-gradient(90deg, transparent, var(--primary), #0ea5e9, transparent);
  height: 100%;
  left: -35%;
  position: absolute;
  top: 0;
  width: 35%;
}

@keyframes appLoaderSlide {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(390%);
  }
}

.user-menu-profile {
  padding: 18px 20px;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fafaf9;
}

.user-menu-profile strong {
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #1c1917;
  line-height: 1.2;
}

.profile-pill {
  display: inline-block;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  background: rgba(249, 115, 22, 0.08);
  color: var(--primary);
  border: 1px solid rgba(249, 115, 22, 0.2);
  padding: 4px 8px;
  border-radius: 6px;
  width: fit-content;
}

.user-menu-profile small {
  font-size: 12px;
  color: #78716c;
  word-break: break-all;
  line-height: 1.4;
}

.user-menu-actions {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-menu-actions a,
.logout-link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #44403c;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.user-menu-actions a:hover {
  background: var(--surface-soft);
  color: var(--primary);
}

.logout-link {
  color: #ef4444;
}

.logout-link:hover {
  background: #fef2f2;
  color: #dc2626;
}

.global-search {
  left: 50%;
  max-width: min(560px, calc(100vw - 420px));
  position: absolute;
  top: 11px;
  transform: translateX(-50%);
  width: 42vw;
  z-index: 101;
}

.global-search-box {
  align-items: center;
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 8px;
  display: flex;
  gap: 10px;
  height: 42px;
  padding: 0 12px;
}

.global-search-box svg {
  color: var(--muted);
  flex-shrink: 0;
}

.global-search-box input {
  background: transparent;
  border: 0;
  box-shadow: none;
  font-size: 14px;
  height: 100%;
  outline: none;
  padding: 0;
  width: 100%;
}

.global-search-results {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
  left: 0;
  margin-top: 0;
  max-height: 420px;
  overflow-y: auto;
  padding: 8px;
  position: absolute;
  right: 0;
  top: 50px;
}

.global-search-result {
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  gap: 3px;
  padding: 10px 12px;
  text-align: left;
  width: 100%;
}

.global-search-result:hover {
  background: var(--surface-soft);
}

.global-search-result strong {
  color: var(--text);
  font-size: 14px;
  line-height: 1.25;
}

.global-search-result small {
  color: var(--muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-type {
  color: var(--primary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.global-search-state {
  color: var(--muted);
  font-size: 13px;
  padding: 14px 12px;
  text-align: center;
}

@media (max-width: 980px) {
  .global-search {
    left: auto;
    margin: 0 12px;
    max-width: none;
    order: 2;
    position: static;
    transform: none;
    width: 100%;
  }
}

@media (max-width: 767px) {
  .global-search {
    grid-column: 1 / -1;
    margin: 0;
    position: relative;
    top: auto;
  }

  .global-search-results {
    max-height: min(56vh, 420px);
  }
}
</style>
