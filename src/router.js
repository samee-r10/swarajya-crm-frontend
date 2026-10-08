import { createRouter, createWebHistory } from 'vue-router'
import { hasHrPermission, loadHrSettings } from './utils/hrStorage'

const Dashboard = () => import('./views/Dashboard.vue')
const CustomerDetail = () => import('./views/CustomerDetail.vue')
const CustomerForm = () => import('./views/CustomerForm.vue')
const Customers = () => import('./views/Customers.vue')
const FinanceDashboard = () => import('./views/FinanceDashboard.vue')
const Login = () => import('./views/Login.vue')
const Opportunities = () => import('./views/Opportunities.vue')
const OpportunityDetail = () => import('./views/OpportunityDetail.vue')
const OpportunityForm = () => import('./views/OpportunityForm.vue')
const ProjectDetail = () => import('./views/ProjectDetail.vue')
const ProjectForm = () => import('./views/ProjectForm.vue')
const Projects = () => import('./views/Projects.vue')
const Products = () => import('./views/Products.vue')
const Setup = () => import('./views/Setup.vue')
const TransactionDetail = () => import('./views/TransactionDetail.vue')
const TransactionForm = () => import('./views/TransactionForm.vue')
const TransactionLedger = () => import('./views/TransactionLedger.vue')
const Profile = () => import('./views/Profile.vue')
const VendorDetail = () => import('./views/VendorDetail.vue')
const VendorForm = () => import('./views/VendorForm.vue')
const Vendors = () => import('./views/Vendors.vue')
const Invoices = () => import('./views/Invoices.vue')
const InvoiceForm = () => import('./views/InvoiceForm.vue')
const InvoiceDetail = () => import('./views/InvoiceDetail.vue')
const ObjectDetail = () => import('./views/ObjectDetail.vue')
const GLReport = () => import('./views/GLReport.vue')
const CustomerLedgerReport = () => import('./views/CustomerLedgerReport.vue')
const VendorLedgerReport = () => import('./views/VendorLedgerReport.vue')
const Treasury = () => import('./views/Treasury.vue')
const CompanyBankAccounts = () => import('./views/CompanyBankAccounts.vue')
const FundTransfers = () => import('./views/FundTransfers.vue')
const Vault = () => import('./views/Vault.vue')
const ForceChangePassword = () => import('./views/ForceChangePassword.vue')
const ChartOfAccounts = () => import('./views/ChartOfAccounts.vue')
const ExpenseClaims = () => import('./views/ExpenseClaims.vue')
const LoanManagement = () => import('./views/LoanManagement.vue')
const PendingClaimApprovals = () => import('./views/PendingClaimApprovals.vue')
const ApprovalCenter = () => import('./views/ApprovalCenter.vue')
const StakeholderPayouts = () => import('./views/StakeholderPayouts.vue')
const Payables = () => import('./views/Payables.vue')
const HRManagement = () => import('./views/HRManagement.vue')



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
  { path: '/products', redirect: '/treasury/products' },
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
  { path: '/claims', name: 'expense-claims', component: ExpenseClaims },
  { path: '/finance/claims', redirect: '/claims' },
  { path: '/approvals', name: 'approval-center', component: ApprovalCenter },
  { path: '/claims/approvals', name: 'claim-approvals', component: PendingClaimApprovals },
  { path: '/finance/accounts', name: 'chart-of-accounts', component: ChartOfAccounts },
  { path: '/finance/invoices', name: 'invoices', component: Invoices },
  { path: '/finance/invoices/new', name: 'invoice-new', component: InvoiceForm },
  { path: '/finance/invoices/:id', name: 'invoice-detail', component: InvoiceDetail, props: true },
  { path: '/finance/invoices/:id/edit', name: 'invoice-edit', component: InvoiceForm, props: true },
  { path: '/reports', redirect: '/finance/reports/general-ledger' },
  { path: '/finance/reports', redirect: '/finance/reports/general-ledger' },
  { path: '/finance/reports/general-ledger', name: 'gl-report', component: GLReport },
  { path: '/finance/reports/customer-ledger', name: 'customer-ledger-report', component: CustomerLedgerReport },
  { path: '/finance/reports/vendor-ledger', name: 'vendor-ledger-report', component: VendorLedgerReport },
  { path: '/treasury', name: 'treasury', component: Treasury },
  { path: '/treasury/bank-accounts', name: 'company-bank-accounts', component: CompanyBankAccounts },
  { path: '/treasury/fund-transfers', name: 'fund-transfers', component: FundTransfers },
  { path: '/treasury/products', name: 'products', component: Products },
  { path: '/treasury/payables', name: 'payables', component: Payables },
  { path: '/treasury/loans', name: 'loan-management', component: LoanManagement },
  { path: '/treasury/stakeholder-payouts', name: 'stakeholder-payouts', component: StakeholderPayouts },
  { path: '/treasury/stakeholder-payouts/approvals', name: 'stakeholder-payout-approvals', component: StakeholderPayouts },
  { path: '/hr', name: 'hr-management', component: HRManagement },
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
  if (to.path.startsWith('/finance') && to.path !== '/finance/claims' && user) {
    const isAdmin = user.role_name === 'System Administrator' || user.role_name === 'Admin'
    if (!isAdmin && !(user.has_finance_access === 1 || user.has_finance_access === true)) {
      return { name: 'dashboard' }
    }
  }
  if (to.path.startsWith('/hr') && user) {
    const isAdmin = user.role_name === 'System Administrator' || user.role_name === 'Admin'
    const canUseSelfServiceHr = loadHrSettings().self_access_enabled && !!user.id
    if (!isAdmin && !hasHrPermission('view_hr_module', user) && !canUseSelfServiceHr) {
      return { name: 'dashboard' }
    }
  }
  return true
})

export default router
