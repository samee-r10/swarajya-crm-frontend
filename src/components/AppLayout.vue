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
        <img src="/logo.png" alt="Company Logo" class="brand-logo" />
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

  <main class="main">
    <div class="top-bar">
      <button v-if="showBack" class="back-button" type="button" @click="goBack">Back</button>
    </div>
    <RouterView />
  </main>
  </template>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost } from '../api/client'

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

onMounted(() => {
  document.addEventListener('click', handleOutsideClick, true)
  window.addEventListener('app-loading-start', startAppLoader)
  window.addEventListener('app-loading-stop', stopAppLoader)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick, true)
  window.removeEventListener('app-loading-start', startAppLoader)
  window.removeEventListener('app-loading-stop', stopAppLoader)
  if (searchTimer) clearTimeout(searchTimer)
  if (loaderDelayTimer) clearTimeout(loaderDelayTimer)
  if (routeLoaderTimer) clearTimeout(routeLoaderTimer)
})

const user = ref(window.localStorage.getItem('lms_user'))
watch(() => route.path, () => {
  user.value = window.localStorage.getItem('lms_user')
  // Auto-close the launcher whenever navigation occurs
  if (launcherRef.value) launcherRef.value.removeAttribute('open')
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
let searchTimer = null
const launcherItems = [
  { label: 'Dashboard', type: 'App', to: '/' },
  { label: 'Customers', type: 'Standard Object', to: '/customers' },
  { label: 'Opportunities', type: 'Standard Object', to: '/opportunities' },
  { label: 'Projects', type: 'Module', to: '/projects' },
  { label: 'Finance', type: 'Module', to: '/finance' },
  { label: 'Treasury', type: 'Module', to: '/treasury' },
  { label: 'Vault', type: 'Secure Module', to: '/vault' },
  { label: 'Vendors', type: 'Finance', to: '/finance/vendors' },
  { label: 'Transaction Ledger', type: 'Finance', to: '/finance/transactions' },
  { label: 'General Ledger Report', type: 'Finance', to: '/finance/reports/general-ledger' },
  { label: 'Setup', type: 'Admin', to: '/setup' },
  { label: 'Users', type: 'Setup', to: '/setup#users' },
  { label: 'Roles', type: 'Setup', to: '/setup#roles' },
  { label: 'Object Manager', type: 'Setup', to: '/setup#objects' }
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
  return items.filter((item) => `${item.label} ${item.type}`.toLowerCase().includes(term))
})

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
</style>
