import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import CustomerDetail from './views/CustomerDetail.vue'
import CustomerForm from './views/CustomerForm.vue'
import Customers from './views/Customers.vue'
import FinanceDashboard from './views/FinanceDashboard.vue'
import Login from './views/Login.vue'
import Opportunities from './views/Opportunities.vue'
import OpportunityDetail from './views/OpportunityDetail.vue'
import OpportunityForm from './views/OpportunityForm.vue'
import ProjectDetail from './views/ProjectDetail.vue'
import ProjectForm from './views/ProjectForm.vue'
import Projects from './views/Projects.vue'
import Setup from './views/Setup.vue'
import TransactionDetail from './views/TransactionDetail.vue'
import TransactionForm from './views/TransactionForm.vue'
import TransactionLedger from './views/TransactionLedger.vue'
import Profile from './views/Profile.vue'
import VendorDetail from './views/VendorDetail.vue'
import VendorForm from './views/VendorForm.vue'
import Vendors from './views/Vendors.vue'
import Invoices from './views/Invoices.vue'
import InvoiceForm from './views/InvoiceForm.vue'
import InvoiceDetail from './views/InvoiceDetail.vue'
import ObjectDetail from './views/ObjectDetail.vue'
import GLReport from './views/GLReport.vue'
import Treasury from './views/Treasury.vue'
import Vault from './views/Vault.vue'
import ForceChangePassword from './views/ForceChangePassword.vue'
import ChartOfAccounts from './views/ChartOfAccounts.vue'



const routes = [
  { path: '/login', name: 'login', component: Login },
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/customers', name: 'customers', component: Customers },
  { path: '/customers/new', name: 'customer-new', component: CustomerForm },
  { path: '/customers/:id', name: 'customer-detail', component: CustomerDetail, props: true },
  { path: '/customers/:id/edit', name: 'customer-edit', component: CustomerForm, props: true },
  { path: '/opportunities', name: 'opportunities', component: Opportunities },
  { path: '/opportunities/new', name: 'opportunity-new', component: OpportunityForm },
  { path: '/opportunities/:id', name: 'opportunity-detail', component: OpportunityDetail, props: true },
  { path: '/opportunities/:id/edit', name: 'opportunity-edit', component: OpportunityForm, props: true },
  { path: '/projects', name: 'projects', component: Projects },
  { path: '/projects/new', name: 'project-new', component: ProjectForm },
  { path: '/projects/:id', name: 'project-detail', component: ProjectDetail, props: true },
  { path: '/projects/:id/edit', name: 'project-edit', component: ProjectForm, props: true },
  { path: '/setup', name: 'setup', component: Setup },
  { path: '/setup/objects/:apiName', name: 'object-detail', component: ObjectDetail, props: true },
  { path: '/finance', name: 'finance-dashboard', component: FinanceDashboard },
  { path: '/finance/vendors', name: 'vendors', component: Vendors },
  { path: '/finance/vendors/new', name: 'vendor-new', component: VendorForm },
  { path: '/finance/vendors/:id', name: 'vendor-detail', component: VendorDetail, props: true },
  { path: '/finance/vendors/:id/edit', name: 'vendor-edit', component: VendorForm, props: true },
  { path: '/finance/transactions', name: 'transaction-ledger', component: TransactionLedger },
  { path: '/finance/transactions/new', name: 'transaction-new', component: TransactionForm },
  { path: '/finance/transactions/:id', name: 'transaction-detail', component: TransactionDetail, props: true },
  { path: '/finance/accounts', name: 'chart-of-accounts', component: ChartOfAccounts },
  { path: '/finance/invoices', name: 'invoices', component: Invoices },
  { path: '/finance/invoices/new', name: 'invoice-new', component: InvoiceForm },
  { path: '/finance/invoices/:id', name: 'invoice-detail', component: InvoiceDetail, props: true },
  { path: '/finance/invoices/:id/edit', name: 'invoice-edit', component: InvoiceForm, props: true },
  { path: '/finance/reports/general-ledger', name: 'gl-report', component: GLReport },
  { path: '/treasury', name: 'treasury', component: Treasury },
  { path: '/vault', name: 'vault', component: Vault },
  { path: '/profile', name: 'profile', component: Profile },
  { path: '/force-change-password', name: 'force-change-password', component: ForceChangePassword }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, top: 16 }
    }
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const userJson = window.localStorage.getItem('lms_user')
  let user = null
  if (userJson) {
    try {
      user = JSON.parse(userJson)
    } catch (e) {}
  }

  if (to.name !== 'login' && !user) {
    return { name: 'login' }
  }
  if (to.name === 'login' && user) {
    return { name: 'dashboard' }
  }

  // Force password change check
  if (user && user.requires_password_change) {
    if (to.name !== 'force-change-password' && to.name !== 'login') {
      return { name: 'force-change-password' }
    }
  } else {
    if (to.name === 'force-change-password') {
      return { name: 'dashboard' }
    }
  }

  if (to.path.startsWith('/setup') && user) {
    if (user.role_name !== 'System Administrator' && user.role_name !== 'Admin') {
      return { name: 'dashboard' }
    }
  }
  if (to.path.startsWith('/treasury') && user) {
    const isAdmin = user.role_name === 'System Administrator' || user.role_name === 'Admin'
    if (!isAdmin && !(user.has_treasury_access === 1 || user.has_treasury_access === true)) {
      return { name: 'dashboard' }
    }
  }
  if (to.path.startsWith('/finance') && user) {
    const isAdmin = user.role_name === 'System Administrator' || user.role_name === 'Admin'
    if (!isAdmin && !(user.has_finance_access === 1 || user.has_finance_access === true)) {
      return { name: 'dashboard' }
    }
  }
  return true
})

export default router
