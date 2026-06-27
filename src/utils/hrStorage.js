export const TREASURY_BANKS_KEY = 'crm_treasury_bank_accounts'

export const HR_PERMISSIONS = [
  { key: 'view_hr_module', label: 'View HR Module' },
  { key: 'manage_employee_master', label: 'Manage Employee Master' },
  { key: 'manage_contract_employees', label: 'Manage Contract Employees' },
  { key: 'manage_interns', label: 'Manage Interns' },
  { key: 'create_payroll', label: 'Create Payroll' },
  { key: 'edit_payroll', label: 'Edit Payroll' },
  { key: 'approve_payroll', label: 'Approve Payroll' },
  { key: 'post_salary_to_ledger', label: 'Post Salary to Ledger' },
  { key: 'view_salary_slips', label: 'View Salary Slips' },
  { key: 'download_salary_slips', label: 'Download Salary Slips' },
  { key: 'view_hr_reports', label: 'View HR Reports' },
  { key: 'manage_hr_settings', label: 'Manage HR Settings' }
]

export function loadJson(key, fallback = []) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback))
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function saveJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function loadEmployees() {
  return []
}

export function saveEmployees(records) {
  return records
}

export function loadPayroll() {
  return []
}

export function savePayroll(records) {
  return records
}

export function loadSalaryLedgerTransactions() {
  return []
}

export function saveSalaryLedgerTransactions(records) {
  return records
}

export function loadHrSettings() {
  return {
    company_name: 'Company',
    company_address: '',
    company_logo_url: '',
    self_access_enabled: false,
    default_currency: 'INR'
  }
}

export function saveHrSettings(settings) {
  return settings
}

export function loadLocalBankAccounts() {
  const records = loadJson(TREASURY_BANKS_KEY, [])
  return Array.isArray(records) ? records : []
}

export function saveLocalBankAccounts(records) {
  saveJson(TREASURY_BANKS_KEY, records)
}

export function getHrPermissions(user = null) {
  const currentUser = user || getCurrentUser()
  const isAdmin = currentUser?.role_name === 'System Administrator' || currentUser?.role_name === 'Admin'
  if (isAdmin) {
    return HR_PERMISSIONS.reduce((acc, permission) => ({ ...acc, [permission.key]: true }), {})
  }
  const raw = currentUser?.hr_permissions
  if (raw && typeof raw === 'object') return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch {}
  }
  return {}
}

export function hasHrPermission(permissionKey, user = null) {
  const currentUser = user || getCurrentUser()
  const isAdmin = currentUser?.role_name === 'System Administrator' || currentUser?.role_name === 'Admin'
  if (isAdmin) return true
  if (permissionKey === 'view_hr_module' && (currentUser?.has_hr_access === 1 || currentUser?.has_hr_access === true)) return true
  return !!getHrPermissions(currentUser)[permissionKey]
}

export function getCurrentUser() {
  try {
    return JSON.parse(window.localStorage.getItem('lms_user') || 'null')
  } catch {
    return null
  }
}

export function payrollKey(record) {
  return `${record.employee_id || record.employee_record_id}-${record.salary_year}-${record.salary_month}`
}

export function calculateNetPay(record) {
  const earnings = Number(record.basic_salary || 0) + Number(record.hra || 0) + Number(record.allowances || 0) + Number(record.bonus || 0) + Number(record.reimbursement || 0)
  const deductions = Number(record.deductions || 0) + Number(record.tds || 0) + Number(record.advance_adjustment || 0)
  return Math.max(0, earnings - deductions)
}

export function buildSalaryTransaction({ records, salaryMonth, salaryYear, reference = '', bankAccount = null, glAccount = null, paymentMode = 'Payable', includeEmployeeDetails = false } = {}) {
  const total = records.reduce((sum, record) => sum + Number(record.net_payable_salary || 0), 0)
  const postedAt = new Date().toISOString()
  const isBankPayment = !!bankAccount
  const generatedReference = reference || `${isBankPayment ? 'SAL-PAY' : 'SAL-PAYABLE'}-${salaryYear}-${String(salaryMonth).slice(0, 3).toUpperCase()}-${Date.now()}`
  const id = `${isBankPayment ? 'salary-ledger' : 'salary-payable'}-${salaryYear}-${salaryMonth}-${Date.now()}`
  const salaryPeriod = `${salaryMonth} ${salaryYear}`
  return {
    id,
    type: 'Expense',
    transaction_type: isBankPayment ? 'Salary Payment' : 'Salary Payable',
    category: isBankPayment ? 'Payroll / Salary Payment' : 'Payroll / Salary Payable',
    account_id: !isBankPayment && glAccount?.id ? glAccount.id : undefined,
    account_name: isBankPayment ? (bankAccount.account_name || bankAccount.label || 'Company Bank') : (glAccount?.name || 'Salary Payable'),
    gl_code: !isBankPayment ? (glAccount?.gl_code || '') : '',
    bank_account_id: bankAccount?.id || '',
    bank_account_name: bankAccount ? (bankAccount.label || bankAccount.account_name || '') : '',
    amount: total,
    total_amount: total,
    currency: bankAccount?.currency || 'INR',
    transaction_date: postedAt,
    date: postedAt,
    description: isBankPayment ? `Salary for ${salaryPeriod} total amount posted` : `Salary payable for ${salaryPeriod}`,
    party_name: `Salary for ${salaryPeriod}`,
    salary_month: salaryMonth,
    salary_year: salaryYear,
    hr_payroll_record_ids: records.map(record => record.id),
    salary_record_count: records.length,
    employee_bifurcation: includeEmployeeDetails ? records.map(record => ({
      payroll_record_id: record.id,
      employee_record_id: record.employee_record_id,
      employee_id: record.employee_id,
      employee_name: record.employee_name,
      amount: Number(record.net_payable_salary || 0)
    })) : [],
    payment_mode: paymentMode,
    transaction_reference: generatedReference,
    reference: generatedReference,
    outflow: isBankPayment ? total : 0,
    debit: total,
    status: isBankPayment ? 'Paid' : 'Pending Payable'
  }
}

export function getBankBalance(account, salaryTransactions = loadSalaryLedgerTransactions()) {
  const opening = Number(account?.current_balance ?? account?.balance ?? account?.opening_balance ?? 0)
  const salaryOutflow = salaryTransactions
    .filter(entry => String(entry.bank_account_id || '') === String(account?.id || ''))
    .reduce((sum, entry) => sum + Number(entry.total_amount || entry.amount || 0), 0)
  return opening - salaryOutflow
}
