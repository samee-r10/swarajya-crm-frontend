<template>
  <header class="app-header">
    <div class="app-header__brand-group">
      <button
        class="app-header__menu"
        type="button"
        aria-label="Open navigation"
        @click="$emit('open-navigation')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>

      <RouterLink class="app-header__brand" to="/" aria-label="Swarajya CRM dashboard">
        <img src="/logo.png" alt="Swarajya Consultancy" />
        <span class="app-header__product">CRM</span>
      </RouterLink>
    </div>

    <div ref="searchRoot" class="app-header__search">
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
        <path d="m20 20-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
      <input
        ref="searchInput"
        v-model="query"
        type="search"
        autocomplete="off"
        aria-label="Search workspace"
        placeholder="Search customers, tasks, invoices..."
        @focus="searchOpen = true"
        @keydown.enter.prevent="openFirstResult"
        @keydown.esc.prevent="closeSearch"
      />
      <kbd>⌘ K</kbd>

      <div v-if="searchOpen && query.trim().length >= 2" class="app-header__results">
        <p v-if="loading" class="app-header__search-state">Searching…</p>
        <button
          v-for="result in results"
          v-else
          :key="`${result.type}-${result.url}`"
          type="button"
          class="app-header__result"
          @click="openResult(result)"
        >
          <span>{{ result.type }}</span>
          <div><strong>{{ result.label }}</strong><small>{{ result.subtitle || result.meta }}</small></div>
        </button>
        <p v-if="!loading && results.length === 0" class="app-header__search-state">No matching records</p>
      </div>
    </div>

    <div class="app-header__actions">
      <button class="app-header__icon" type="button" aria-label="Notifications" title="Notifications">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="app-header__notification"></span>
      </button>

      <details v-if="userName" ref="userMenu" class="app-header__user">
        <summary>
          <span class="app-header__avatar">{{ userInitial }}</span>
          <span class="app-header__identity"><strong>{{ userName }}</strong><small>{{ userProfile }}</small></span>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="m7 9 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </summary>
        <div class="app-header__user-menu">
          <div class="app-header__account"><strong>{{ userName }}</strong><small>{{ userEmail }}</small></div>
          <RouterLink to="/profile">Profile</RouterLink>
          <button type="button" @click="$emit('logout')">Sign out</button>
        </div>
      </details>
    </div>
  </header>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '../api/client'

defineProps({
  userName: { type: String, default: '' },
  userInitial: { type: String, default: 'U' },
  userEmail: { type: String, default: '' },
  userProfile: { type: String, default: '' }
})

defineEmits(['open-navigation', 'logout'])

const router = useRouter()
const searchRoot = ref(null)
const searchInput = ref(null)
const userMenu = ref(null)
const query = ref('')
const results = ref([])
const loading = ref(false)
const searchOpen = ref(false)
let searchTimer

function handleShortcut(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchInput.value?.focus()
    searchOpen.value = true
  }
}

function handleOutsideClick(event) {
  if (searchRoot.value && !searchRoot.value.contains(event.target)) closeSearch()
  if (userMenu.value && !userMenu.value.contains(event.target)) userMenu.value.removeAttribute('open')
}

function closeSearch() {
  searchOpen.value = false
}

function openResult(result) {
  query.value = ''
  results.value = []
  closeSearch()
  router.push(result.url)
}

function openFirstResult() {
  if (results.value[0]) openResult(results.value[0])
}

watch(query, (value) => {
  clearTimeout(searchTimer)
  const term = value.trim()
  if (term.length < 2) {
    results.value = []
    loading.value = false
    return
  }
  loading.value = true
  searchOpen.value = true
  searchTimer = setTimeout(async () => {
    try {
      const data = await apiGet(`/api/search?q=${encodeURIComponent(term)}`)
      results.value = data.results || []
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }, 220)
})

onMounted(() => {
  window.addEventListener('keydown', handleShortcut)
  document.addEventListener('click', handleOutsideClick, true)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleShortcut)
  document.removeEventListener('click', handleOutsideClick, true)
  clearTimeout(searchTimer)
})
</script>

<style scoped>
.app-header {
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(220px, 1fr) minmax(320px, 620px) minmax(220px, 1fr);
  height: 60px;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.app-header__brand-group,
.app-header__actions,
.app-header__brand,
.app-header__user summary {
  align-items: center;
  display: flex;
}

.app-header__brand-group { gap: 12px; }
.app-header__actions { gap: 8px; justify-content: flex-end; }
.app-header__brand { color: #0f172a; gap: 12px; text-decoration: none; }
.app-header__brand img { display: block; height: 32px; max-width: 142px; object-fit: contain; }
.app-header__product { border-left: 1px solid #d7d1ca; color: #c45c0d; font-size: 12px; font-weight: 750; letter-spacing: .08em; padding-left: 12px; }

.app-header__menu,
.app-header__icon {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 7px;
  color: #526174;
  cursor: pointer;
  display: none;
  height: 36px;
  justify-content: center;
  padding: 0;
  width: 36px;
}
.app-header__icon { display: inline-flex; position: relative; }
.app-header__menu:hover,
.app-header__icon:hover { background: #f1f5f9; color: #1e3a5f; }
.app-header__notification { background: #dc4c4c; border: 2px solid #fff; border-radius: 50%; height: 7px; position: absolute; right: 8px; top: 7px; width: 7px; }

.app-header__search { align-items: center; background: #f8fafc; border: 1px solid #dbe3ec; border-radius: 8px; color: #718096; display: flex; height: 38px; padding: 0 11px; position: relative; }
.app-header__search:focus-within { background: #fff; border-color: #e28a3b; box-shadow: 0 0 0 3px rgba(242, 138, 26, .12); }
.app-header__search input { background: transparent; border: 0; box-shadow: none; color: #1e293b; flex: 1; font-size: 13px; height: 100%; outline: 0; padding: 0 10px; }
.app-header__search kbd { background: #fff; border: 1px solid #dbe3ec; border-radius: 4px; color: #7b8796; font: 600 10px/1 var(--font-sans); padding: 4px 6px; }
.app-header__results { background: #fff; border: 1px solid #dbe3ec; border-radius: 8px; box-shadow: 0 12px 30px rgba(15, 23, 42, .13); left: 0; max-height: 360px; overflow: auto; padding: 6px; position: absolute; right: 0; top: calc(100% + 8px); }
.app-header__result { align-items: center; background: transparent; border: 0; border-radius: 6px; color: #1e293b; cursor: pointer; display: grid; gap: 12px; grid-template-columns: 72px 1fr; padding: 9px 10px; text-align: left; width: 100%; }
.app-header__result:hover { background: #f1f5f9; }
.app-header__result > span { color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; }
.app-header__result div { display: grid; gap: 2px; }
.app-header__result strong { font-size: 12.5px; }
.app-header__result small,
.app-header__search-state { color: #718096; font-size: 11.5px; }
.app-header__search-state { margin: 0; padding: 14px; text-align: center; }

.app-header__user { position: relative; }
.app-header__user summary { border-radius: 7px; cursor: pointer; gap: 9px; list-style: none; padding: 4px 6px; }
.app-header__user summary:hover { background: #f8fafc; }
.app-header__user summary::-webkit-details-marker { display: none; }
.app-header__avatar { align-items: center; background: #d9670e; border-radius: 50%; color: #fff; display: inline-flex; font-size: 12px; font-weight: 700; height: 32px; justify-content: center; width: 32px; }
.app-header__identity { display: grid; line-height: 1.2; min-width: 118px; }
.app-header__identity strong { color: #172033; font-size: 12.5px; font-weight: 700; }
.app-header__identity small { color: #718096; font-size: 10.5px; margin-top: 2px; }
.app-header__user-menu { background: #fff; border: 1px solid #dbe3ec; border-radius: 8px; box-shadow: 0 12px 30px rgba(15, 23, 42, .13); display: grid; min-width: 220px; padding: 6px; position: absolute; right: 0; top: calc(100% + 8px); }
.app-header__account { border-bottom: 1px solid #edf1f5; display: grid; gap: 2px; margin-bottom: 4px; padding: 9px 10px 11px; }
.app-header__account strong { color: #172033; font-size: 12.5px; }
.app-header__account small { color: #718096; font-size: 11px; }
.app-header__user-menu a,
.app-header__user-menu button { background: transparent; border: 0; border-radius: 5px; color: #334155; cursor: pointer; font: 600 12px/1.2 var(--font-sans); padding: 9px 10px; text-align: left; text-decoration: none; }
.app-header__user-menu a:hover,
.app-header__user-menu button:hover { background: #f1f5f9; }

@media (max-width: 900px) {
  .app-header { grid-template-columns: 1fr auto; padding: 0 14px; }
  .app-header__menu { display: inline-flex; }
  .app-header__search { display: none; }
  .app-header__identity { display: none; }
}
</style>
