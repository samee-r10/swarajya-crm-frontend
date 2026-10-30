<template>
  <div class="crm-breadcrumb-bar">
    <nav aria-label="Breadcrumb">
      <ol>
        <li>
          <RouterLink to="/" aria-label="Dashboard">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4v-8.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /></svg>
            <span>Dashboard</span>
          </RouterLink>
        </li>
        <li v-for="crumb in breadcrumbs" :key="crumb.path">
          <svg class="crm-breadcrumb-bar__separator" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <RouterLink v-if="crumb.path !== route.path" :to="crumb.path">{{ crumb.label }}</RouterLink>
          <span v-else aria-current="page">{{ crumb.label }}</span>
        </li>
      </ol>
    </nav>

    <button v-if="canGoBack" type="button" @click="router.back()">
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="m15 18-6-6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
      Back
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({ showBack: { type: Boolean, default: true } })
const route = useRoute()
const router = useRouter()

const labels = {
  '/tasks': 'Tasks', '/customers': 'Customers', '/opportunities': 'Opportunities', '/projects': 'Projects',
  '/finance': 'Finance', '/finance/vendors': 'Vendors', '/finance/transactions': 'Transactions',
  '/finance/accounts': 'Chart of Accounts', '/finance/invoices': 'Invoices', '/finance/reports': 'Reports',
  '/finance/reports/general-ledger': 'General Ledger', '/finance/reports/customer-ledger': 'Customer Ledger',
  '/finance/reports/vendor-ledger': 'Vendor Ledger', '/claims': 'Claims', '/claims/approvals': 'Approvals',
  '/treasury': 'Treasury', '/treasury/products': 'Products', '/treasury/payables': 'Payables',
  '/treasury/expense-log': 'Expense Log', '/treasury/bank-accounts': 'Bank Accounts',
  '/treasury/fund-transfers': 'Fund Transfers', '/treasury/loans': 'Loans',
  '/treasury/stakeholder-payouts': 'Stakeholder Payouts', '/hr': 'HR', '/setup': 'Settings',
  '/vault': 'Vault', '/profile': 'Profile'
}

function titleize(segment, parent = '') {
  if (/^\d+$/.test(segment)) {
    const names = { customers: 'Customer', opportunities: 'Opportunity', projects: 'Project', vendors: 'Vendor', invoices: 'Invoice', transactions: 'Transaction', tasks: 'Task', products: 'Product', loans: 'Loan' }
    return `${names[parent] || 'Record'} #${segment}`
  }
  const transaction = segment.match(/^TXN(\d+)$/i)
  if (transaction) return `Transaction #${String(Number(transaction[1])).padStart(3, '0')}`
  return segment.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  return segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`
    return { path, label: labels[path] || titleize(segment, segments[index - 1]) }
  })
})

const canGoBack = computed(() => props.showBack && !['dashboard', 'login'].includes(route.name) && !route.path.startsWith('/setup'))
</script>

<style scoped>
.crm-breadcrumb-bar { align-items: center; display: flex; justify-content: space-between; margin-bottom: 18px; min-height: 28px; }
.crm-breadcrumb-bar ol { align-items: center; display: flex; flex-wrap: wrap; gap: 7px; list-style: none; margin: 0; padding: 0; }
.crm-breadcrumb-bar li,
.crm-breadcrumb-bar a { align-items: center; display: inline-flex; gap: 6px; }
.crm-breadcrumb-bar a { color: #64748b; font-size: 12px; font-weight: 550; text-decoration: none; }
.crm-breadcrumb-bar a:hover { color: #b65309; }
.crm-breadcrumb-bar li > span { color: #1e293b; font-size: 12px; font-weight: 650; }
.crm-breadcrumb-bar__separator { color: #a8b3c2; }
.crm-breadcrumb-bar button { align-items: center; background: transparent; border: 0; border-radius: 6px; color: #526174; cursor: pointer; display: inline-flex; font: 600 12px/1 var(--font-sans); gap: 4px; padding: 7px 8px; }
.crm-breadcrumb-bar button:hover { background: #edf2f7; color: #1e3a5f; }
@media (max-width: 640px) {
  .crm-breadcrumb-bar { margin-bottom: 14px; }
  .crm-breadcrumb-bar li:first-child span { display: none; }
}
</style>
