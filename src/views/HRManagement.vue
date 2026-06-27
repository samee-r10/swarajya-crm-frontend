<template>
  <div class="hr-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">HR Management</p>
        <h1>People, Payroll, and Salary Records</h1>
        <p class="muted">Manage employees, contract workers, interns, payroll processing, salary slips, and salary payments.</p>
      </div>
      <div class="header-actions">
        <button v-if="canManagePeople" class="button secondary" type="button" @click="openWorkerForm()">New Worker</button>
        <button v-if="canCreatePayroll" class="button" type="button" @click="activeTab = 'payroll'; showPayrollCreator = true">Create Payroll</button>
      </div>
    </header>

    <p v-if="statusMessage" class="flash success">{{ statusMessage }}</p>
    <p v-if="error" class="flash warning">{{ error }}</p>

    <section v-if="canViewHrSummary" class="metric-grid">
      <div class="metric-card"><span>Total Employees</span><strong>{{ dashboard.total }}</strong></div>
      <div class="metric-card"><span>Active Employees</span><strong>{{ dashboard.active }}</strong></div>
      <div class="metric-card"><span>Contract Employees</span><strong>{{ dashboard.contracts }}</strong></div>
      <div class="metric-card"><span>Interns</span><strong>{{ dashboard.interns }}</strong></div>
      <div v-if="canViewSalary" class="metric-card"><span>Monthly Salary Payable</span><strong>{{ money(dashboard.payable) }}</strong></div>
      <div v-if="canViewSalary" class="metric-card"><span>Salary Paid This Month</span><strong>{{ money(dashboard.paid) }}</strong></div>
      <div v-if="canViewSalary" class="metric-card"><span>Salary Pending</span><strong>{{ money(dashboard.pending) }}</strong></div>
      <div class="metric-card"><span>Upcoming Contract End Dates</span><strong>{{ dashboard.upcomingContracts }}</strong></div>
    </section>

    <nav class="tabs compact-tabs">
      <button v-for="tab in visibleTabs" :key="tab.id" type="button" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">{{ tab.label }}</button>
    </nav>

    <section v-if="activeTab === 'employees'" class="employee-master-panel">
      <div class="employee-master-header">
        <div>
          <p class="eyebrow">Employee Master</p>
          <h2>People Directory</h2>
        </div>
        <div class="employee-master-controls">
          <input v-model="workerSearch" type="search" placeholder="Search name, ID, email, department...">
          <select v-model="workerFilter">
            <option value="All">All Employment Types</option>
            <option>Permanent Employee</option>
            <option>Contract Employee</option>
            <option>Intern</option>
          </select>
        </div>
      </div>
      <div class="employee-master-stats">
        <div><span>Total</span><strong>{{ accessibleWorkers.length }}</strong></div>
        <div><span>Active</span><strong>{{ accessibleWorkers.filter(worker => worker.status === 'Active').length }}</strong></div>
        <div><span>Filtered</span><strong>{{ filteredWorkers.length }}</strong></div>
      </div>
      <table class="record-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>Department</th>
            <th>Manager</th>
            <th>Status</th>
            <th>Joining</th>
            <th class="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="worker in filteredWorkers" :key="worker.id">
            <td>
              <div class="employee-cell">
                <span class="employee-avatar">{{ initials(worker.full_name) }}</span>
                <span>
                  <strong>{{ worker.full_name }}</strong>
                  <span class="muted block">{{ worker.employee_id }} · {{ worker.email || '-' }}</span>
                </span>
              </div>
            </td>
            <td>{{ worker.employment_type }}</td>
            <td>{{ worker.department || '-' }}<span class="muted block">{{ worker.designation || '-' }}</span></td>
            <td>{{ worker.reporting_manager || '-' }}</td>
            <td><span :class="statusClass(worker.status)">{{ worker.status }}</span></td>
            <td>{{ formatDate(worker.date_of_joining) }}</td>
            <td class="right actions-cell">
              <button class="button secondary small" type="button" @click="viewWorker(worker)">View</button>
              <button v-if="canEditWorker(worker)" class="button small" type="button" @click="openWorkerForm(worker)">Edit</button>
            </td>
          </tr>
          <tr v-if="filteredWorkers.length === 0"><td colspan="7" class="empty-row">No employee records match this view.</td></tr>
        </tbody>
      </table>
    </section>

    <section v-if="activeTab === 'payroll'" class="work-grid">
      <div class="record-card">
        <div class="section-toolbar">
          <div>
            <p class="eyebrow">Payroll / Salary Processing</p>
            <h2>{{ payrollFilters.month }} {{ payrollFilters.year }}</h2>
          </div>
          <div class="toolbar-controls">
            <select v-model="payrollFilters.month"><option v-for="month in months" :key="month">{{ month }}</option></select>
            <input v-model.number="payrollFilters.year" type="number" min="2000" max="2100">
            <button v-if="canCreatePayroll" class="button secondary" type="button" @click="openPayrollCreator">Generate Sheet</button>
          </div>
        </div>

        <div v-if="showPayrollCreator" class="inline-panel">
          <div class="form-grid">
            <label>Salary Month<select v-model="payrollCreator.month"><option v-for="month in months" :key="month">{{ month }}</option></select></label>
            <label>Salary Year<input v-model.number="payrollCreator.year" type="number" min="2000" max="2100"></label>
            <label>Default Basic Salary<input v-model.number="payrollCreator.basic_salary" type="number" min="0" step="0.01"></label>
            <label>Default Allowances<input v-model.number="payrollCreator.allowances" type="number" min="0" step="0.01"></label>
            <label class="span-2">Include Types
              <div class="checkbox-grid">
                <label><input v-model="payrollCreator.types" type="checkbox" value="Permanent Employee"> Permanent</label>
                <label><input v-model="payrollCreator.types" type="checkbox" value="Contract Employee"> Contract</label>
                <label><input v-model="payrollCreator.types" type="checkbox" value="Intern"> Intern</label>
              </div>
            </label>
          </div>
          <div class="action-row">
            <button class="button secondary" type="button" @click="showPayrollCreator = false">Cancel</button>
            <button class="button" type="button" @click="generatePayroll">Create Salary Records</button>
          </div>
        </div>

        <div class="payroll-table-scroll">
        <table class="record-table payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th class="right">Earnings</th>
              <th class="right">Deductions</th>
              <th class="right">Net Payable</th>
              <th>Status</th>
              <th class="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in monthPayroll" :key="record.id">
              <td>
                <strong>{{ record.employee_name }}</strong>
                <span class="muted block">{{ record.employee_id }} · {{ record.employment_type }}</span>
              </td>
              <td class="right">{{ money(earnings(record)) }}</td>
              <td class="right">{{ money(deductions(record)) }}</td>
              <td class="right"><strong>{{ money(record.net_payable_salary) }}</strong></td>
              <td>
                <span :class="paymentClass(record.payment_status)">{{ record.payment_status }}</span>
                  <span class="muted block">{{ record.salary_payable_number || record.transaction_reference || '' }}</span>
              </td>
              <td class="right actions-cell payroll-actions">
                <button v-if="canEditPayroll(record)" class="button secondary small" type="button" @click="openPayrollForm(record)">Edit</button>
                <button v-if="canApprovePayroll && record.status !== 'Finalized'" class="button small" type="button" @click="finalizePayroll(record)">Finalize</button>
                  <button v-if="canPostSalary && record.status === 'Finalized' && record.payment_status !== 'Paid' && !record.ledger_transaction_id && !record.salary_payable_id" class="button small" type="button" @click="openSalaryPoster([record.id])">Post</button>
                <button v-if="canDeletePayroll(record)" class="button secondary danger small" type="button" @click="deletePayrollRecord(record)">Delete</button>
              </td>
            </tr>
            <tr v-if="monthPayroll.length === 0"><td colspan="6" class="empty-row">No salary records for this month.</td></tr>
          </tbody>
        </table>
        </div>
        <div class="action-row">
          <button v-if="canApprovePayroll && monthPayroll.some(r => r.status !== 'Finalized')" class="button secondary" type="button" @click="finalizeVisiblePayroll">Finalize Salary Sheet</button>
          <button v-if="canPostSalary && finalizedUnpaid.length" class="button" type="button" @click="openSalaryPoster(finalizedUnpaid.map(r => r.id))">Post Selected Month Salaries</button>
        </div>
      </div>

      <aside v-if="canPostSalary" class="record-card">
        <p class="eyebrow">Salary Payables</p>
        <h2>Posted Salary Batches</h2>
        <div v-for="tx in salaryTransactionsForMonth" :key="tx.id" class="payment-row">
          <strong>{{ tx.reference }}</strong>
          <span>{{ tx.salary_month }} {{ tx.salary_year }} · {{ money(tx.total_amount, tx.currency) }}</span>
          <small v-for="line in tx.employee_bifurcation" :key="line.payroll_record_id">{{ line.employee_name }}: {{ money(line.amount, tx.currency) }}</small>
        </div>
        <p v-if="salaryTransactionsForMonth.length === 0" class="muted">No salary payable posted for this month.</p>
      </aside>
    </section>

    <section v-if="activeTab === 'reports'" class="report-grid">
      <div v-for="report in reports" :key="report.title" class="record-card report-card">
        <span>{{ report.title }}</span>
        <strong>{{ report.value }}</strong>
        <small>{{ report.note }}</small>
      </div>
    </section>

    <section v-if="activeTab === 'settings'" class="record-card settings-card">
      <p class="eyebrow">HR Settings</p>
      <h2>Module Settings</h2>
      <form class="form-grid" @submit.prevent="saveSettings">
        <label>Company Name<input v-model="settings.company_name"></label>
        <div class="company-logo-setting span-2">
          <span>Company Logo</span>
          <div class="company-logo-setting-preview">
            <img v-if="effectiveCompanyLogo" :src="effectiveCompanyLogo" alt="Company Logo">
            <small v-else>No logo uploaded in Setup Company Information.</small>
          </div>
          <small>Upload or change the logo from Setup > Company Information.</small>
        </div>
        <label class="span-2">Company Address<textarea v-model="settings.company_address" rows="3"></textarea></label>
        <label>Default Currency<input v-model="settings.default_currency"></label>
        <label class="checkbox-label"><input v-model="settings.self_access_enabled" type="checkbox"> Enable employee self-access for own salary slips</label>
        <div class="span-2 action-row"><button class="button" type="submit">Save Settings</button></div>
      </form>
    </section>

    <div v-if="showWorkerModal" class="modal-overlay hr-modal-overlay" :class="{ 'hr-modal-overlay-top': selectedWorker }" @click.self="closeWorkerForm">
      <div class="modal-content wide-modal hr-modal-shell">
        <div class="hr-modal-header">
          <div>
            <p class="eyebrow">{{ workerForm.id ? 'Edit Employee' : 'Add Employee' }}</p>
            <h2>{{ workerForm.full_name || 'Employee Record' }}</h2>
          </div>
          <button class="modal-close" type="button" @click="closeWorkerForm">&times;</button>
        </div>
        <form class="hr-modal-form" @submit.prevent="saveWorker">
          <div class="hr-modal-body">
            <section class="form-section">
              <div class="form-section-title">
                <h3>Basic Information</h3>
                <span>Bank and salary details are managed after creation.</span>
              </div>
              <div class="form-grid">
                <label>Employee Name<input v-model="workerForm.full_name" required></label>
                <label>Email<input v-model="workerForm.email" type="email"></label>
                <label>Mobile<input v-model="workerForm.mobile"></label>
                <label>Employment Type<select v-model="workerForm.employment_type"><option>Permanent Employee</option><option>Contract Employee</option><option>Intern</option></select></label>
                <label>Department
                  <select v-model="workerForm.department">
                    <option value="">Select Department</option>
                    <option v-for="department in departments" :key="department" :value="department">{{ department }}</option>
                  </select>
                </label>
                <label>Designation<input v-model="workerForm.designation"></label>
                <label>Date of Joining<input v-model="workerForm.date_of_joining" type="date"></label>
                <label>Reporting Manager<input v-model="workerForm.reporting_manager"></label>
                <label>Status<select v-model="workerForm.status"><option>Active</option><option>Inactive</option><option>Exited</option></select></label>
                <label class="span-2">Address<textarea v-model="workerForm.address" rows="3"></textarea></label>
                <label class="span-2">Documents / Attachments<textarea v-model="workerForm.documents" rows="2" placeholder="Paste file links or document references"></textarea></label>
                <label class="span-2">Remarks<textarea v-model="workerForm.remarks" rows="2"></textarea></label>
              </div>
            </section>
            <p v-if="error" class="flash warning">{{ error }}</p>
          </div>
          <div class="hr-modal-footer">
            <button class="button secondary" type="button" @click="closeWorkerForm">Cancel</button>
            <button class="button" type="submit">{{ workerForm.id ? 'Update Employee' : 'Save Employee' }}</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="selectedWorker" class="modal-overlay hr-modal-overlay" @click.self="closeWorkerDetail">
      <div class="modal-content wide-modal hr-modal-shell employee-detail-modal">
        <div class="hr-modal-header employee-detail-header">
          <div>
            <p class="eyebrow">Employee Detail</p>
            <h2>{{ selectedWorker.full_name }}</h2>
            <span>{{ selectedWorker.employee_id }} · {{ selectedWorker.designation || 'No designation' }}</span>
          </div>
          <button class="modal-close" type="button" @click="closeWorkerDetail">&times;</button>
        </div>
        <div class="hr-modal-body">
          <nav class="detail-tabs">
            <button type="button" :class="{ active: selectedWorkerTab === 'records' }" @click="selectedWorkerTab = 'records'">Employee Records</button>
            <button type="button" :class="{ active: selectedWorkerTab === 'bank' }" @click="selectedWorkerTab = 'bank'">Bank Details</button>
            <button type="button" :class="{ active: selectedWorkerTab === 'salary' }" @click="selectedWorkerTab = 'salary'">Salary Structure</button>
            <button v-if="canViewWorkerSalarySlips(selectedWorker)" type="button" :class="{ active: selectedWorkerTab === 'slips' }" @click="selectedWorkerTab = 'slips'">Salary Slips</button>
          </nav>

          <section v-if="selectedWorkerTab === 'records'" class="detail-section">
            <div class="section-toolbar">
              <h3>Employee Records</h3>
              <button v-if="canEditWorker(selectedWorker)" class="button secondary small" type="button" @click="openWorkerForm(selectedWorker)">Edit Employee</button>
            </div>
            <dl class="detail-grid detail-grid-cards">
              <template v-for="field in workerRecordFields" :key="field.key">
                <div><dt>{{ field.label }}</dt><dd>{{ selectedWorker[field.key] || '-' }}</dd></div>
              </template>
            </dl>
          </section>

          <section v-if="selectedWorkerTab === 'bank'" class="detail-section">
            <div class="section-toolbar">
              <h3>Bank Details</h3>
              <button v-if="canEditWorker(selectedWorker)" class="button small" type="button" @click="openBankForm">Add / Edit Bank Details</button>
            </div>
            <dl v-if="selectedWorkerBank" class="detail-grid detail-grid-cards">
              <div><dt>Bank Name</dt><dd>{{ selectedWorkerBank.bank_name || '-' }}</dd></div>
              <div><dt>Account Holder Name</dt><dd>{{ selectedWorkerBank.account_holder_name || '-' }}</dd></div>
              <div><dt>Account Number</dt><dd>{{ selectedWorkerBank.account_number || '-' }}</dd></div>
              <div><dt>IFSC</dt><dd>{{ selectedWorkerBank.ifsc || '-' }}</dd></div>
              <div><dt>Branch</dt><dd>{{ selectedWorkerBank.branch || '-' }}</dd></div>
              <div><dt>UPI ID</dt><dd>{{ selectedWorkerBank.upi_id || '-' }}</dd></div>
              <div><dt>Payment Mode</dt><dd>{{ selectedWorkerBank.payment_mode || '-' }}</dd></div>
              <div><dt>Status</dt><dd><span :class="statusClass(selectedWorkerBank.status)">{{ selectedWorkerBank.status || 'Active' }}</span></dd></div>
            </dl>
            <div v-else class="empty-panel">No bank details added yet.</div>
          </section>

          <section v-if="selectedWorkerTab === 'salary'" class="detail-section">
            <div class="section-toolbar">
              <h3>Salary Structure</h3>
              <button v-if="canEditWorker(selectedWorker)" class="button small" type="button" @click="openSalaryStructureForm">Add / Edit Salary Structure</button>
            </div>
            <dl v-if="selectedWorkerSalaryStructure" class="detail-grid detail-grid-cards">
              <div><dt>Basic Salary</dt><dd>{{ money(selectedWorkerSalaryStructure.basic_salary) }}</dd></div>
              <div><dt>HRA</dt><dd>{{ money(selectedWorkerSalaryStructure.hra) }}</dd></div>
              <div><dt>Allowances</dt><dd>{{ money(selectedWorkerSalaryStructure.allowances) }}</dd></div>
              <div><dt>Bonus / Incentive</dt><dd>{{ money(selectedWorkerSalaryStructure.bonus) }}</dd></div>
              <div><dt>Deductions</dt><dd>{{ money(selectedWorkerSalaryStructure.deductions) }}</dd></div>
              <div><dt>TDS</dt><dd>{{ money(selectedWorkerSalaryStructure.tds) }}</dd></div>
              <div><dt>Net Payable</dt><dd><strong>{{ money(salaryStructureNetPayable) }}</strong></dd></div>
              <div><dt>Effective From</dt><dd>{{ formatDate(selectedWorkerSalaryStructure.effective_from) }}</dd></div>
              <div><dt>Status</dt><dd><span :class="statusClass(selectedWorkerSalaryStructure.status)">{{ selectedWorkerSalaryStructure.status || 'Active' }}</span></dd></div>
            </dl>
            <div v-else class="empty-panel">No salary structure added yet.</div>
          </section>

          <section v-if="selectedWorkerTab === 'slips'" class="detail-section">
            <div class="section-toolbar">
              <h3>Salary Slips</h3>
              <span class="muted">{{ selectedWorker.full_name }} · {{ selectedWorker.employee_id }}</span>
            </div>
            <table class="record-table">
              <thead><tr><th>Month</th><th class="right">Net Pay</th><th>Status</th><th class="right">Actions</th></tr></thead>
              <tbody>
                <tr v-for="record in visibleSalarySlips" :key="record.id">
                  <td>{{ record.salary_month }} {{ record.salary_year }}</td>
                  <td class="right">{{ money(record.net_payable_salary) }}</td>
                  <td><span :class="paymentClass(record.payment_status)">{{ record.payment_status }}</span></td>
                  <td class="right actions-cell">
                    <button class="button secondary small" type="button" @click="previewSlip(record)">Preview</button>
                    <button v-if="canDownloadSlip(record)" class="button small" type="button" @click="downloadSlip(record)">Download</button>
                    <button class="button secondary small" type="button" @click="printSlip(record)">Print</button>
                  </td>
                </tr>
                <tr v-if="visibleSalarySlips.length === 0"><td colspan="4" class="empty-row">No salary slips available for this employee.</td></tr>
              </tbody>
            </table>
          </section>
        </div>
        <div class="hr-modal-footer">
          <button class="button secondary" type="button" @click="closeWorkerDetail">Close</button>
        </div>
      </div>
    </div>

    <div v-if="showBankModal" class="modal-overlay hr-modal-overlay hr-modal-overlay-top" @click.self="showBankModal = false">
      <div class="modal-content wide-modal hr-modal-shell compact-hr-modal">
        <div class="hr-modal-header">
          <div><p class="eyebrow">Employee Bank Details</p><h2>{{ selectedWorker?.full_name }}</h2></div>
          <button class="modal-close" type="button" @click="showBankModal = false">&times;</button>
        </div>
        <form class="hr-modal-form" @submit.prevent="saveBankDetails">
          <div class="hr-modal-body">
            <section class="form-section">
              <div class="form-grid">
                <label>Bank Name<input v-model="bankForm.bank_name" required></label>
                <label>Account Holder Name<input v-model="bankForm.account_holder_name" required></label>
                <label>Account Number<input v-model="bankForm.account_number" required></label>
                <label>IFSC<input v-model="bankForm.ifsc"></label>
                <label>Branch<input v-model="bankForm.branch"></label>
                <label>UPI ID<input v-model="bankForm.upi_id"></label>
                <label>Payment Mode<select v-model="bankForm.payment_mode"><option>Bank Transfer</option><option>UPI</option><option>Cheque</option><option>Cash</option></select></label>
                <label>Status<select v-model="bankForm.status"><option>Active</option><option>Inactive</option></select></label>
              </div>
            </section>
          </div>
          <div class="hr-modal-footer">
            <button class="button secondary" type="button" @click="showBankModal = false">Cancel</button>
            <button class="button" type="submit">Save Bank Details</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showSalaryStructureModal" class="modal-overlay hr-modal-overlay hr-modal-overlay-top" @click.self="showSalaryStructureModal = false">
      <div class="modal-content wide-modal hr-modal-shell compact-hr-modal">
        <div class="hr-modal-header">
          <div><p class="eyebrow">Salary Structure</p><h2>{{ selectedWorker?.full_name }}</h2></div>
          <button class="modal-close" type="button" @click="showSalaryStructureModal = false">&times;</button>
        </div>
        <form class="hr-modal-form" @submit.prevent="saveSalaryStructure">
          <div class="hr-modal-body">
            <section class="form-section">
              <div class="form-grid">
                <label>Basic Salary<input v-model.number="salaryStructureForm.basic_salary" type="number" min="0" step="0.01"></label>
                <label>HRA<input v-model.number="salaryStructureForm.hra" type="number" min="0" step="0.01"></label>
                <label>Allowances<input v-model.number="salaryStructureForm.allowances" type="number" min="0" step="0.01"></label>
                <label>Bonus / Incentive<input v-model.number="salaryStructureForm.bonus" type="number" min="0" step="0.01"></label>
                <label>Deductions<input v-model.number="salaryStructureForm.deductions" type="number" min="0" step="0.01"></label>
                <label>TDS<input v-model.number="salaryStructureForm.tds" type="number" min="0" step="0.01"></label>
                <label>Effective From Date<input v-model="salaryStructureForm.effective_from" type="date"></label>
                <label>Status<select v-model="salaryStructureForm.status"><option>Active</option><option>Inactive</option></select></label>
                <div class="span-2 calculated-field"><span>Net Payable</span><strong>{{ money(salaryStructureFormNetPayable) }}</strong></div>
              </div>
            </section>
          </div>
          <div class="hr-modal-footer">
            <button class="button secondary" type="button" @click="showSalaryStructureModal = false">Cancel</button>
            <button class="button" type="submit">Save Salary Structure</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showPayrollModal" class="modal-overlay hr-modal-overlay" @click.self="showPayrollModal = false">
      <div class="modal-content wide-modal hr-modal-shell">
        <div class="hr-modal-header">
          <div><p class="eyebrow">Edit Payroll</p><h2>{{ payrollForm.employee_name }}</h2></div>
          <button class="modal-close" type="button" @click="showPayrollModal = false">&times;</button>
        </div>
        <form class="hr-modal-form" @submit.prevent="savePayrollRecord">
          <div class="hr-modal-body">
            <section class="form-section">
              <div class="form-grid">
                <label>Basic Salary<input v-model.number="payrollForm.basic_salary" type="number" min="0" step="0.01"></label>
                <label>HRA<input v-model.number="payrollForm.hra" type="number" min="0" step="0.01"></label>
                <label>Allowances<input v-model.number="payrollForm.allowances" type="number" min="0" step="0.01"></label>
                <label>Bonus / Incentive<input v-model.number="payrollForm.bonus" type="number" min="0" step="0.01"></label>
                <label>Reimbursement<input v-model.number="payrollForm.reimbursement" type="number" min="0" step="0.01"></label>
                <label>Deductions<input v-model.number="payrollForm.deductions" type="number" min="0" step="0.01"></label>
                <label>TDS / Tax Deduction<input v-model.number="payrollForm.tds" type="number" min="0" step="0.01"></label>
                <label>Advance Adjustment<input v-model.number="payrollForm.advance_adjustment" type="number" min="0" step="0.01"></label>
                <label>Payment Status<select v-model="payrollForm.payment_status"><option>Pending</option><option>Partially Paid</option><option>Paid</option></select></label>
                <label class="span-2">Remarks<textarea v-model="payrollForm.remarks" rows="2"></textarea></label>
              </div>
            </section>
          </div>
          <div class="hr-modal-footer">
            <button class="button secondary" type="button" @click="showPayrollModal = false">Cancel</button>
            <button class="button" type="submit">Update Payroll</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showPaymentModal" class="modal-overlay hr-modal-overlay" @click.self="showPaymentModal = false">
      <div class="modal-content wide-modal hr-modal-shell">
        <div class="hr-modal-header">
          <div><p class="eyebrow">Create Salary Payable</p><h2>{{ paymentForm.month }} {{ paymentForm.year }}</h2></div>
          <button class="modal-close" type="button" @click="showPaymentModal = false">&times;</button>
        </div>
        <div class="hr-modal-body">
          <div class="form-grid">
            <label>Salary Month<select v-model="paymentForm.month"><option v-for="month in months" :key="month">{{ month }}</option></select></label>
            <label>Salary Year<input v-model.number="paymentForm.year" type="number" min="2000" max="2100"></label>
            <label class="span-2">Payable Reference<input v-model="paymentForm.reference" placeholder="Optional. A reference will be generated if blank."></label>
          </div>
          <table class="record-table">
            <thead><tr><th><input v-model="selectAllPaymentRecords" type="checkbox"></th><th>Employee</th><th class="right">Net Payable</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="record in payableRecordsForPaymentModal" :key="record.id">
                <td><input v-model="paymentForm.record_ids" :value="record.id" type="checkbox"></td>
                <td>{{ record.employee_name }}<span class="muted block">{{ record.employee_id }}</span></td>
                <td class="right">{{ money(record.net_payable_salary) }}</td>
                <td>{{ record.payment_status }}</td>
              </tr>
              <tr v-if="payableRecordsForPaymentModal.length === 0"><td colspan="4" class="empty-row">No finalized unpaid salary records are available for this period.</td></tr>
            </tbody>
          </table>
          <p v-if="error" class="flash warning payment-error">{{ error }}</p>
          <div class="payment-total">
            <span>Total payable to create</span>
            <strong>{{ money(selectedPaymentTotal, settings.default_currency) }}</strong>
          </div>
        </div>
        <div class="hr-modal-footer">
            <button class="button secondary" type="button" @click="showPaymentModal = false">Cancel</button>
            <button class="button" type="button" @click="postSalaryPayment">Create Salary Payable</button>
        </div>
      </div>
    </div>

    <div v-if="salarySlipPreview" class="modal-overlay hr-modal-overlay" @click.self="salarySlipPreview = null">
      <div class="modal-content slip-modal hr-modal-shell">
        <div class="salary-slip" id="salary-slip-preview">
          <div class="slip-header">
            <div class="slip-company">
              <img v-if="effectiveCompanyLogo" :src="effectiveCompanyLogo" alt="Company Logo" class="slip-logo">
              <div>
                <h2>{{ settings.company_name }}</h2>
                <p v-if="settings.company_address">{{ settings.company_address }}</p>
              </div>
            </div>
            <div class="slip-period">
              <span>Salary Slip</span>
              <strong>{{ salarySlipPreview.salary_month }} {{ salarySlipPreview.salary_year }}</strong>
            </div>
          </div>
          <div class="slip-grid">
            <span>Employee Name</span><strong>{{ salarySlipPreview.employee_name }}</strong>
            <span>Employee ID</span><strong>{{ salarySlipPreview.employee_id }}</strong>
            <span>Designation</span><strong>{{ salarySlipPreview.designation || '-' }}</strong>
            <span>Department</span><strong>{{ salarySlipPreview.department || '-' }}</strong>
            <span>Salary Month/Year</span><strong>{{ salarySlipPreview.salary_month }} {{ salarySlipPreview.salary_year }}</strong>
            <span>Payment Status</span><strong>{{ salarySlipPreview.payment_status }}</strong>
            <span>Payment Date</span><strong>{{ formatDate(salarySlipPreview.payment_date) }}</strong>
          </div>
          <div class="slip-columns">
            <div>
              <h3>Earnings</h3>
              <p>Basic Salary <strong>{{ money(salarySlipPreview.basic_salary) }}</strong></p>
              <p>HRA <strong>{{ money(salarySlipPreview.hra) }}</strong></p>
              <p>Allowances <strong>{{ money(salarySlipPreview.allowances) }}</strong></p>
              <p>Bonus / Incentive <strong>{{ money(salarySlipPreview.bonus) }}</strong></p>
              <p>Reimbursement <strong>{{ money(salarySlipPreview.reimbursement) }}</strong></p>
            </div>
            <div>
              <h3>Deductions</h3>
              <p>Deductions <strong>{{ money(salarySlipPreview.deductions) }}</strong></p>
              <p>TDS / Tax <strong>{{ money(salarySlipPreview.tds) }}</strong></p>
              <p>Advance Adjustment <strong>{{ money(salarySlipPreview.advance_adjustment) }}</strong></p>
            </div>
          </div>
          <div class="slip-total"><span>Net Payable Salary</span><strong>{{ money(salarySlipPreview.net_payable_salary) }}</strong></div>
        </div>
        <div class="hr-modal-footer">
          <button class="button secondary" type="button" @click="salarySlipPreview = null">Close</button>
          <button class="button" type="button" @click="printSlip(salarySlipPreview)">Print</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client'
import {
  buildSalaryTransaction,
  calculateNetPay,
  hasHrPermission,
  loadHrSettings,
  payrollKey,
} from '../utils/hrStorage'
import { DEPARTMENTS } from '../utils/sharedOptions'

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const departments = DEPARTMENTS
const now = new Date()
const activeTab = ref('employees')
const workers = ref([])
const payroll = ref([])
const salaryTransactions = ref([])
const settings = reactive(loadHrSettings())
const statusMessage = ref('')
const error = ref('')
const workerFilter = ref('All')
const workerSearch = ref('')
const showWorkerModal = ref(false)
const selectedWorker = ref(null)
const selectedWorkerTab = ref('records')
const showBankModal = ref(false)
const showSalaryStructureModal = ref(false)
const showPayrollCreator = ref(false)
const showPayrollModal = ref(false)
const showPaymentModal = ref(false)
const salarySlipPreview = ref(null)
const payrollFilters = reactive({ month: months[now.getMonth()], year: now.getFullYear() })
const payrollCreator = reactive({ month: months[now.getMonth()], year: now.getFullYear(), basic_salary: 0, allowances: 0, types: ['Permanent Employee', 'Contract Employee', 'Intern'] })
const workerForm = reactive(defaultWorker())
const bankForm = reactive(defaultBankDetails())
const salaryStructureForm = reactive(defaultSalaryStructure())
const payrollForm = reactive(defaultPayroll())
const paymentForm = reactive({ month: months[now.getMonth()], year: now.getFullYear(), reference: '', record_ids: [] })

const canViewSalary = computed(() => hasHrPermission('create_payroll') || hasHrPermission('edit_payroll') || hasHrPermission('approve_payroll') || hasHrPermission('post_salary_to_ledger'))
const canManagePeople = computed(() => hasHrPermission('manage_employee_master') || hasHrPermission('manage_contract_employees') || hasHrPermission('manage_interns'))
const canCreatePayroll = computed(() => hasHrPermission('create_payroll'))
const canApprovePayroll = computed(() => hasHrPermission('approve_payroll'))
const canPostSalary = computed(() => hasHrPermission('post_salary_to_ledger'))
const canDownloadSlips = computed(() => hasHrPermission('download_salary_slips'))
const canViewHrSummary = computed(() => canManagePeople.value || canViewSalary.value || hasHrPermission('view_hr_reports') || hasHrPermission('manage_hr_settings'))
const currentUser = computed(() => {
  try {
    return JSON.parse(window.localStorage.getItem('lms_user') || '{}')
  } catch {
    return {}
  }
})
const canViewAllEmployeeRecords = computed(() => canManagePeople.value || canViewSalary.value || hasHrPermission('view_hr_reports') || hasHrPermission('manage_hr_settings'))
const canViewAllSalarySlips = computed(() => hasHrPermission('view_salary_slips') && canViewAllEmployeeRecords.value)
const canViewOwnSalarySlips = computed(() => (settings.self_access_enabled || hasHrPermission('view_salary_slips')) && !!currentUser.value?.id)
const canViewEmployeeMaster = computed(() => canViewAllEmployeeRecords.value || canViewOwnSalarySlips.value)
const isAnyHrModalOpen = computed(() => {
  return showWorkerModal.value ||
    !!selectedWorker.value ||
    showBankModal.value ||
    showSalaryStructureModal.value ||
    showPayrollModal.value ||
    showPaymentModal.value ||
    !!salarySlipPreview.value
})

const visibleTabs = computed(() => [
  { id: 'employees', label: 'Employee Master', visible: canViewEmployeeMaster.value },
  { id: 'payroll', label: 'Payroll', visible: canViewSalary.value },
  { id: 'reports', label: 'HR Reports', visible: hasHrPermission('view_hr_reports') },
  { id: 'settings', label: 'HR Settings', visible: hasHrPermission('manage_hr_settings') }
].filter(tab => tab.visible))

const accessibleWorkers = computed(() => {
  if (canViewAllEmployeeRecords.value) return workers.value
  if (canViewOwnSalarySlips.value) return workers.value.filter(isOwnWorkerRecord)
  return []
})
const filteredWorkers = computed(() => {
  const term = workerSearch.value.trim().toLowerCase()
  return accessibleWorkers.value.filter(worker => {
    const matchesType = workerFilter.value === 'All' || worker.employment_type === workerFilter.value
    if (!matchesType) return false
    if (!term) return true
    return [
      worker.full_name,
      worker.employee_id,
      worker.email,
      worker.mobile,
      worker.department,
      worker.designation,
      worker.reporting_manager,
      worker.employment_type,
      worker.status
    ].some(value => String(value || '').toLowerCase().includes(term))
  })
})
const effectiveCompanyLogo = computed(() => settings.company_logo_url || '')
const monthPayroll = computed(() => payroll.value.filter(record => record.salary_month === payrollFilters.month && Number(record.salary_year) === Number(payrollFilters.year)))
const finalizedUnpaid = computed(() => monthPayroll.value.filter(record => record.status === 'Finalized' && record.payment_status !== 'Paid' && !record.ledger_transaction_id && !record.salary_payable_id))
const salaryTransactionsForMonth = computed(() => salaryTransactions.value.filter(tx => tx.salary_month === payrollFilters.month && Number(tx.salary_year) === Number(payrollFilters.year)))
const selectedWorkerBank = computed(() => {
  if (!selectedWorker.value) return null
  if (selectedWorker.value.bank_details) return selectedWorker.value.bank_details
  if (selectedWorker.value.bank_account_details || selectedWorker.value.upi_id) {
    return {
      bank_name: '',
      account_holder_name: selectedWorker.value.full_name,
      account_number: selectedWorker.value.bank_account_details || '',
      ifsc: '',
      branch: '',
      upi_id: selectedWorker.value.upi_id || '',
      payment_mode: selectedWorker.value.upi_id ? 'UPI' : 'Bank Transfer',
      status: 'Active'
    }
  }
  return null
})
const selectedWorkerSalaryStructure = computed(() => selectedWorker.value?.salary_structure || null)
const salaryStructureNetPayable = computed(() => selectedWorkerSalaryStructure.value ? calculateSalaryStructureNet(selectedWorkerSalaryStructure.value) : 0)
const salaryStructureFormNetPayable = computed(() => calculateSalaryStructureNet(salaryStructureForm))
const payableRecordsForPaymentModal = computed(() => payroll.value.filter(record => record.salary_month === paymentForm.month && Number(record.salary_year) === Number(paymentForm.year) && record.status === 'Finalized' && record.payment_status !== 'Paid' && !record.ledger_transaction_id && !record.salary_payable_id))
const selectedPaymentRecords = computed(() => {
  const selectedIds = paymentForm.record_ids.map(id => String(id))
  return payableRecordsForPaymentModal.value.filter(record => selectedIds.includes(String(record.id)))
})
const selectedPaymentTotal = computed(() => selectedPaymentRecords.value.reduce((sum, record) => sum + Number(record.net_payable_salary || 0), 0))
const selectAllPaymentRecords = computed({
  get() {
    const selectedIds = paymentForm.record_ids.map(id => String(id))
    return payableRecordsForPaymentModal.value.length > 0 && payableRecordsForPaymentModal.value.every(record => selectedIds.includes(String(record.id)))
  },
  set(value) {
    paymentForm.record_ids = value ? payableRecordsForPaymentModal.value.map(record => record.id) : []
  }
})
const visibleSalarySlips = computed(() => {
  if (!selectedWorker.value) return []
  return payroll.value
    .filter(record => isPayrollForWorker(record, selectedWorker.value) && canAccessSalarySlip(record))
    .sort((a, b) => salaryPeriodDate(b) - salaryPeriodDate(a))
})
const dashboard = computed(() => {
  const active = workers.value.filter(worker => worker.status === 'Active')
  const monthRecords = monthPayroll.value
  return {
    total: workers.value.length,
    active: active.length,
    contracts: workers.value.filter(worker => worker.employment_type === 'Contract Employee').length,
    interns: workers.value.filter(worker => worker.employment_type === 'Intern').length,
    payable: monthRecords.reduce((sum, record) => sum + Number(record.net_payable_salary || 0), 0),
    paid: monthRecords.filter(record => record.payment_status === 'Paid').reduce((sum, record) => sum + Number(record.net_payable_salary || 0), 0),
    pending: monthRecords.filter(record => record.payment_status !== 'Paid').reduce((sum, record) => sum + Number(record.net_payable_salary || 0), 0),
    upcomingContracts: workers.value.filter(worker => worker.employment_type === 'Contract Employee' && isUpcoming(worker.date_of_exit)).length
  }
})
const reports = computed(() => [
  { title: 'Monthly salary report', value: money(dashboard.value.payable), note: `${payrollFilters.month} ${payrollFilters.year}` },
  { title: 'Employee-wise salary report', value: monthPayroll.value.length, note: 'Salary records generated' },
  { title: 'Department-wise salary report', value: new Set(monthPayroll.value.map(record => record.department).filter(Boolean)).size, note: 'Departments represented' },
  { title: 'Contract employee payment report', value: money(sumByType('Contract Employee')), note: 'Contract payable' },
  { title: 'Intern stipend report', value: money(sumByType('Intern')), note: 'Intern payable' },
  { title: 'Salary outstanding report', value: money(dashboard.value.pending), note: 'Pending or partial' },
  { title: 'Salary paid report', value: money(dashboard.value.paid), note: 'Paid this month' },
  { title: 'Salary bifurcation report', value: salaryTransactionsForMonth.value.length, note: 'Ledger postings' },
  { title: 'Payroll summary by month', value: monthPayroll.value.filter(record => record.status === 'Finalized').length, note: 'Finalized records' }
])
const workerRecordFields = [
  { key: 'employee_id', label: 'Employee ID' },
  { key: 'email', label: 'Email ID' },
  { key: 'mobile', label: 'Mobile Number' },
  { key: 'employment_type', label: 'Employment Type' },
  { key: 'department', label: 'Department' },
  { key: 'designation', label: 'Designation' },
  { key: 'date_of_joining', label: 'Date of Joining' },
  { key: 'date_of_exit', label: 'Date of Exit' },
  { key: 'reporting_manager', label: 'Reporting Manager' },
  { key: 'status', label: 'Status' },
  { key: 'address', label: 'Address' },
  { key: 'documents', label: 'Documents / Attachments' },
  { key: 'remarks', label: 'Remarks' }
]

onMounted(loadData)

onUnmounted(() => {
  document.body.classList.remove('hr-modal-open')
})

watch(() => [paymentForm.month, paymentForm.year], () => {
  paymentForm.record_ids = payableRecordsForPaymentModal.value.map(record => record.id)
})

watch(isAnyHrModalOpen, (isOpen) => {
  document.body.classList.toggle('hr-modal-open', isOpen)
}, { immediate: true })

watch(visibleTabs, (tabs) => {
  if (tabs.length && !tabs.some(tab => tab.id === activeTab.value)) {
    activeTab.value = tabs[0].id
  }
}, { immediate: true })

async function loadData() {
  await Promise.all([
    loadHrEmployees(),
    loadHrPayroll(),
    loadHrSalaryTransactions(),
    loadHrModuleSettings()
  ])
  await loadCompanySettings()
}

function normalizeMongoRecord(record) {
  if (!record || typeof record !== 'object') return record
  return { ...record, id: record.id || record._id }
}

function responseList(data, key) {
  const records = Array.isArray(data) ? data : (data?.[key] || data?.records || [])
  return Array.isArray(records) ? records.map(normalizeMongoRecord) : []
}

function responseRecord(data, key) {
  return normalizeMongoRecord(data?.[key] || data?.record || data)
}

function showApiWarning(message) {
  if (!statusMessage.value) statusMessage.value = message
}

async function loadHrEmployees() {
  try {
    const data = await apiGet('/api/hr/employees')
    const records = responseList(data, 'employees')
    workers.value = records
  } catch (err) {
    workers.value = []
    showApiWarning('HR employee API unavailable; employee records cannot be loaded.')
  }
}

async function loadHrPayroll() {
  try {
    const data = await apiGet('/api/hr/payroll')
    const records = responseList(data, 'payroll')
    payroll.value = records
  } catch (err) {
    payroll.value = []
    showApiWarning('HR payroll API unavailable; payroll records cannot be loaded.')
  }
}

async function loadHrSalaryTransactions() {
  try {
    const data = await apiGet('/api/hr/salary-transactions')
    const records = responseList(data, 'transactions')
    salaryTransactions.value = records
  } catch (err) {
    salaryTransactions.value = []
    showApiWarning('HR salary payable API unavailable; salary payables cannot be loaded.')
  }
}

async function loadHrModuleSettings() {
  try {
    const data = await apiGet('/api/hr/settings')
    Object.assign(settings, loadHrSettings(), responseRecord(data, 'settings') || {})
  } catch (err) {
    Object.assign(settings, loadHrSettings())
    showApiWarning('HR settings API unavailable; HR settings cannot be loaded.')
  }
}

function defaultWorker() {
  return { id: null, employee_id: '', full_name: '', email: '', mobile: '', employment_type: 'Permanent Employee', department: '', designation: '', date_of_joining: '', date_of_exit: '', reporting_manager: '', work_location: '', status: 'Active', pan: '', id_proof: '', emergency_contact: '', address: '', documents: '', remarks: '', bank_details: null, salary_structure: null }
}

function defaultBankDetails() {
  return { bank_name: '', account_holder_name: '', account_number: '', ifsc: '', branch: '', upi_id: '', payment_mode: 'Bank Transfer', status: 'Active' }
}

function defaultSalaryStructure() {
  return { basic_salary: 0, hra: 0, allowances: 0, bonus: 0, deductions: 0, tds: 0, effective_from: '', status: 'Active' }
}

function defaultPayroll() {
  return { id: null, employee_record_id: '', employee_id: '', employee_name: '', employee_email: '', employment_type: '', department: '', designation: '', salary_month: payrollFilters.month, salary_year: payrollFilters.year, basic_salary: 0, hra: 0, allowances: 0, bonus: 0, reimbursement: 0, deductions: 0, tds: 0, advance_adjustment: 0, net_payable_salary: 0, payment_status: 'Pending', payment_date: '', paid_from_bank_account_id: '', payment_mode: '', transaction_reference: '', remarks: '', status: 'Draft' }
}

function openWorkerForm(worker = null) {
  Object.assign(workerForm, defaultWorker(), worker || {})
  showWorkerModal.value = true
}

function closeWorkerForm() {
  showWorkerModal.value = false
  Object.assign(workerForm, defaultWorker())
}

async function saveWorker() {
  statusMessage.value = ''
  if (!canEditWorker(workerForm)) {
    error.value = 'You do not have permission to manage this employment type.'
    return
  }
  const payload = {
    ...workerForm,
    id: workerForm.id || `hr-worker-${Date.now()}`,
    employee_id: workerForm.employee_id || nextEmployeeId(),
    bank_details: workerForm.bank_details || null,
    salary_structure: workerForm.salary_structure || null
  }
  let savedWorker = payload
  try {
    const data = workerForm.id
      ? await apiPut(`/api/hr/employees/${workerForm.id}`, payload)
      : await apiPost('/api/hr/employees', payload)
    savedWorker = responseRecord(data, 'employee') || payload
  } catch (err) {
    error.value = err.message || 'HR employee API unavailable; employee was not saved.'
    return
  }
  const next = [...workers.value]
  const index = next.findIndex(worker => String(worker.id) === String(savedWorker.id))
  if (index >= 0) next.splice(index, 1, savedWorker)
  else next.unshift(savedWorker)
  workers.value = next
  if (String(selectedWorker.value?.id || '') === String(savedWorker.id || '')) selectedWorker.value = savedWorker
  statusMessage.value = 'HR record saved to database.'
  closeWorkerForm()
}

function viewWorker(worker) {
  selectedWorker.value = worker
  selectedWorkerTab.value = canViewWorkerSalarySlips(worker) && !canViewAllEmployeeRecords.value ? 'slips' : 'records'
}

function closeWorkerDetail() {
  selectedWorker.value = null
  selectedWorkerTab.value = 'records'
}

function openBankForm() {
  Object.assign(bankForm, defaultBankDetails(), selectedWorker.value?.bank_details || {})
  showBankModal.value = true
}

async function saveBankDetails() {
  await updateSelectedWorker({ bank_details: { ...bankForm } })
  showBankModal.value = false
  selectedWorkerTab.value = 'bank'
  if (!statusMessage.value.includes('locally')) statusMessage.value = 'Employee bank details saved to database.'
}

function openSalaryStructureForm() {
  Object.assign(salaryStructureForm, defaultSalaryStructure(), selectedWorker.value?.salary_structure || {})
  showSalaryStructureModal.value = true
}

async function saveSalaryStructure() {
  await updateSelectedWorker({
    salary_structure: {
      ...salaryStructureForm,
      net_payable: salaryStructureFormNetPayable.value
    }
  })
  showSalaryStructureModal.value = false
  selectedWorkerTab.value = 'salary'
  if (!statusMessage.value.includes('locally')) statusMessage.value = 'Employee salary structure saved to database.'
}

async function updateSelectedWorker(changes) {
  if (!selectedWorker.value) return
  statusMessage.value = ''
  const updated = { ...selectedWorker.value, ...changes }
  let savedWorker = updated
  try {
    const data = await apiPut(`/api/hr/employees/${updated.id}`, updated)
    savedWorker = responseRecord(data, 'employee') || updated
  } catch (err) {
    error.value = err.message || 'HR employee API unavailable; employee changes were not saved.'
    return
  }
  workers.value = workers.value.map(worker => String(worker.id) === String(savedWorker.id) ? savedWorker : worker)
  selectedWorker.value = savedWorker
}

async function loadCompanySettings() {
  try {
    const company = await apiGet('/api/settings/company')
    if (company?.company_name && (!settings.company_name || settings.company_name === 'Company')) settings.company_name = company.company_name
    if (company?.company_address && !settings.company_address) settings.company_address = company.company_address
    const logo = company?.company_logo_url || company?.logo_url || company?.company_logo || company?.logo
    settings.company_logo_url = logo || settings.company_logo_url || ''
  } catch {
    // HR settings remain the fallback when company settings are unavailable.
  }
}

function canEditWorker(worker) {
  if (worker.employment_type === 'Contract Employee') return hasHrPermission('manage_contract_employees')
  if (worker.employment_type === 'Intern') return hasHrPermission('manage_interns')
  return hasHrPermission('manage_employee_master')
}

function employeeForPayrollRecord(record) {
  return workers.value.find(worker =>
    String(worker.id || '') === String(record.employee_record_id || '') ||
    String(worker.employee_id || '') === String(record.employee_id || '')
  ) || null
}

function isPayrollForWorker(record, worker) {
  if (!record || !worker) return false
  return String(record.employee_record_id || '') === String(worker.id || '') ||
    String(record.employee_id || '') === String(worker.employee_id || '')
}

function isOwnWorkerRecord(worker) {
  const user = currentUser.value
  const userId = String(user.id || '')
  const userEmail = String(user.email || '').toLowerCase()
  const userEmployeeId = String(user.employee_id || user.employee_code || '').toLowerCase()
  const userName = String(user.full_name || '').toLowerCase()
  const workerUserId = String(worker.user_id || worker.employee_user_id || '')
  const workerEmail = String(worker.email || '').toLowerCase()
  const workerEmployeeId = String(worker.employee_id || '').toLowerCase()
  const workerName = String(worker.full_name || '').toLowerCase()
  return (userId && workerUserId === userId) ||
    (userEmail && workerEmail === userEmail) ||
    (userEmployeeId && workerEmployeeId === userEmployeeId) ||
    (userName && workerName === userName)
}

function isOwnSalarySlip(record) {
  const user = currentUser.value
  const worker = employeeForPayrollRecord(record)
  const userId = String(user.id || '')
  const userEmail = String(user.email || '').toLowerCase()
  const userEmployeeId = String(user.employee_id || user.employee_code || '').toLowerCase()
  const userName = String(user.full_name || '').toLowerCase()
  const recordEmail = String(record.employee_email || worker?.email || '').toLowerCase()
  const recordEmployeeId = String(record.employee_id || '').toLowerCase()
  const recordEmployeeName = String(record.employee_name || '').toLowerCase()
  return (userId && String(record.employee_user_id || worker?.user_id || '') === userId) ||
    (userEmail && recordEmail === userEmail) ||
    (userEmployeeId && recordEmployeeId === userEmployeeId) ||
    (userName && recordEmployeeName === userName)
}

function canAccessSalarySlip(record) {
  return canViewAllSalarySlips.value || (canViewOwnSalarySlips.value && isOwnSalarySlip(record))
}

function canDownloadSlip(record) {
  return (canDownloadSlips.value && canViewAllEmployeeRecords.value) || (canViewOwnSalarySlips.value && isOwnSalarySlip(record))
}

function canViewWorkerSalarySlips(worker) {
  if (!worker) return false
  if (canViewAllSalarySlips.value) return true
  return canViewOwnSalarySlips.value && isOwnWorkerRecord(worker)
}

function salaryPeriodDate(record) {
  const monthIndex = months.indexOf(record.salary_month)
  return new Date(Number(record.salary_year) || 0, Math.max(monthIndex, 0), 1)
}

async function generatePayroll() {
  if (!canCreatePayroll.value) return
  statusMessage.value = ''
  error.value = ''
  const eligible = workers.value.filter(worker => worker.status === 'Active' && payrollCreator.types.includes(worker.employment_type))
  if (!eligible.length) {
    error.value = 'No active employees match the selected employee types.'
    return
  }
  const existingKeys = new Set(payroll.value.map(payrollKey))
  const created = eligible
    .map(worker => ({
      ...defaultPayroll(),
      id: `payroll-${worker.id}-${payrollCreator.year}-${payrollCreator.month}`,
      employee_record_id: worker.id,
      employee_id: worker.employee_id,
      employee_name: worker.full_name,
      employee_email: worker.email,
      employment_type: worker.employment_type,
      department: worker.department,
      designation: worker.designation,
      salary_month: payrollCreator.month,
      salary_year: payrollCreator.year,
      basic_salary: Number(worker.salary_structure?.basic_salary ?? payrollCreator.basic_salary ?? 0),
      hra: Number(worker.salary_structure?.hra || 0),
      allowances: Number(worker.salary_structure?.allowances ?? payrollCreator.allowances ?? 0),
      bonus: Number(worker.salary_structure?.bonus || 0),
      deductions: Number(worker.salary_structure?.deductions || 0),
      tds: Number(worker.salary_structure?.tds || 0)
    }))
    .map(record => ({ ...record, net_payable_salary: calculateNetPay(record) }))
    .filter(record => !existingKeys.has(payrollKey(record)))
  let savedRecords = created
  if (created.length) {
    try {
      const data = await apiPost('/api/hr/payroll/bulk', { records: created })
      savedRecords = responseList(data, 'payroll')
      if (!savedRecords.length) savedRecords = created
    } catch (err) {
      error.value = err.message || 'HR payroll API unavailable; salary records were not saved.'
      return
    }
  }
  payroll.value = [...savedRecords, ...payroll.value]
  payrollFilters.month = payrollCreator.month
  payrollFilters.year = payrollCreator.year
  showPayrollCreator.value = false
  statusMessage.value = savedRecords.length ? `${savedRecords.length} salary records saved to database.` : 'No new salary records were created. Existing employee/month records were skipped.'
}

function openPayrollCreator() {
  payrollCreator.month = payrollFilters.month
  payrollCreator.year = payrollFilters.year
  showPayrollCreator.value = true
}

function openPayrollForm(record) {
  Object.assign(payrollForm, defaultPayroll(), record)
  showPayrollModal.value = true
}

async function savePayrollRecord() {
  statusMessage.value = ''
  if (!canEditPayroll(payrollForm)) {
    error.value = 'Finalized paid salary records cannot be edited without payroll edit permission.'
    return
  }
  const payload = { ...payrollForm, net_payable_salary: calculateNetPay(payrollForm) }
  let savedRecord = payload
  try {
    const data = await apiPut(`/api/hr/payroll/${payload.id}`, payload)
    savedRecord = responseRecord(data, 'payroll_record') || responseRecord(data, 'record') || payload
  } catch (err) {
    error.value = err.message || 'HR payroll API unavailable; payroll record was not saved.'
    return
  }
  payroll.value = payroll.value.map(record => String(record.id) === String(savedRecord.id) ? savedRecord : record)
  showPayrollModal.value = false
  statusMessage.value = 'Payroll record saved to database.'
}

function canEditPayroll(record) {
  return hasHrPermission('edit_payroll') && !(record.status === 'Finalized' && record.payment_status === 'Paid')
}

function canDeletePayroll(record) {
  return hasHrPermission('edit_payroll') && record.payment_status !== 'Paid'
}

async function deletePayrollRecord(record) {
  if (!canDeletePayroll(record)) {
    error.value = 'Paid payroll records cannot be deleted.'
    return
  }
  if (!confirm(`Delete payroll record for ${record.employee_name} (${record.salary_month} ${record.salary_year})?`)) return
  statusMessage.value = ''
  error.value = ''
  try {
    await apiDelete(`/api/hr/payroll/${record.id}`)
    statusMessage.value = 'Payroll record deleted from database.'
  } catch (err) {
    error.value = err.message || 'Unable to delete payroll record.'
    return
  }
  payroll.value = payroll.value.filter(item => String(item.id) !== String(record.id))
  paymentForm.record_ids = paymentForm.record_ids.filter(id => String(id) !== String(record.id))
}

async function finalizePayroll(record) {
  statusMessage.value = ''
  const payload = { ...record, status: 'Finalized' }
  let savedRecord = payload
  try {
    const data = await apiPut(`/api/hr/payroll/${record.id}`, payload)
    savedRecord = responseRecord(data, 'payroll_record') || responseRecord(data, 'record') || payload
  } catch (err) {
    error.value = err.message || 'HR payroll API unavailable; payroll was not finalized.'
    return
  }
  payroll.value = payroll.value.map(item => String(item.id) === String(savedRecord.id) ? savedRecord : item)
}

async function finalizeVisiblePayroll() {
  statusMessage.value = ''
  const finalizedRecords = monthPayroll.value.map(record => ({ ...record, status: 'Finalized' }))
  let savedRecords = finalizedRecords
  try {
    const data = await apiPost('/api/hr/payroll/finalize', {
      month: payrollFilters.month,
      year: payrollFilters.year,
      record_ids: monthPayroll.value.map(record => record.id)
    })
    savedRecords = responseList(data, 'payroll')
    if (!savedRecords.length) savedRecords = finalizedRecords
  } catch (err) {
    error.value = err.message || 'HR payroll API unavailable; salary sheet was not finalized.'
    return
  }
  const savedById = new Map(savedRecords.map(record => [String(record.id), record]))
  payroll.value = payroll.value.map(record => savedById.get(String(record.id)) || record)
  statusMessage.value = 'Salary sheet finalized in database.'
}

function openSalaryPoster(recordIds = []) {
  error.value = ''
  statusMessage.value = ''
  const targetIds = recordIds.map(id => String(id))
  const targetRecords = recordIds.length
    ? payroll.value.filter(record => targetIds.includes(String(record.id)))
    : finalizedUnpaid.value
  if (!targetRecords.length) {
    error.value = 'Finalize at least one unpaid payroll record before posting salary.'
    return
  }
  paymentForm.month = payrollFilters.month
  paymentForm.year = payrollFilters.year
  paymentForm.record_ids = targetRecords.map(record => record.id)
  paymentForm.reference = ''
  showPaymentModal.value = true
}

async function postSalaryPayment() {
  statusMessage.value = ''
  error.value = ''
  if (!selectedPaymentRecords.value.length) {
    error.value = 'Select at least one finalized unpaid salary record.'
    return
  }
  const duplicated = selectedPaymentRecords.value.find(record => salaryTransactions.value.some(tx => tx.hr_payroll_record_ids?.includes(record.id)))
  if (duplicated) {
    error.value = `Duplicate salary posting prevented for ${duplicated.employee_name} ${duplicated.salary_month} ${duplicated.salary_year}.`
    return
  }
  const tx = buildSalaryTransaction({
    records: selectedPaymentRecords.value,
    salaryMonth: paymentForm.month,
    salaryYear: paymentForm.year,
    reference: paymentForm.reference
  })
  const selectedIds = paymentForm.record_ids.map(id => String(id))
  const updatedPayroll = payroll.value.map(record => {
    if (!selectedIds.includes(String(record.id))) return record
    return {
      ...record,
      payment_status: record.payment_status || 'Pending',
      transaction_reference: tx.reference,
      ledger_transaction_id: tx.id,
      salary_payable_status: 'Pending'
    }
  })
  let savedTransaction = tx
  let savedPayroll = updatedPayroll
  try {
    const data = await apiPost('/api/hr/salary-payments', {
      transaction: tx,
      payroll_records: updatedPayroll.filter(record => selectedIds.includes(String(record.id)))
    })
    savedTransaction = responseRecord(data, 'transaction') || tx
    const responsePayroll = responseList(data, 'payroll')
    if (responsePayroll.length) {
      const responseById = new Map(responsePayroll.map(record => [String(record.id), record]))
      savedPayroll = payroll.value.map(record => responseById.get(String(record.id)) || record)
    }
  } catch (err) {
    error.value = err.message || 'HR salary payable API unavailable; salary payable was not created.'
    return
  }
  salaryTransactions.value = [savedTransaction, ...salaryTransactions.value]
  payroll.value = savedPayroll
  showPaymentModal.value = false
  statusMessage.value = 'Salary payable created. Settle it later from Treasury Payables.'
}

function previewSlip(record) {
  if (!canAccessSalarySlip(record)) {
    error.value = 'You can only view salary slips linked to your employee id or email.'
    return
  }
  salarySlipPreview.value = record
}

function downloadSlip(record) {
  if (!canDownloadSlip(record)) {
    error.value = 'You do not have permission to download this salary slip.'
    return
  }
  const content = salarySlipHtml(record)
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${record.employee_id}-${record.salary_month}-${record.salary_year}-salary-slip.html`
  link.click()
  URL.revokeObjectURL(url)
}

async function printSlip(record) {
  if (!canAccessSalarySlip(record)) {
    error.value = 'You can only print salary slips linked to your employee id or email.'
    return
  }
  salarySlipPreview.value = record
  await waitForSalarySlipAssets()
  window.print()
}

function waitForSalarySlipAssets() {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      const images = Array.from(document.querySelectorAll('#salary-slip-preview img'))
      if (!images.length) {
        resolve()
        return
      }
      let pending = images.length
      const done = () => {
        pending -= 1
        if (pending <= 0) resolve()
      }
      images.forEach(image => {
        if (image.complete) done()
        else {
          image.addEventListener('load', done, { once: true })
          image.addEventListener('error', done, { once: true })
        }
      })
      setTimeout(resolve, 1500)
    })
  })
}

async function saveSettings() {
  statusMessage.value = ''
  const payload = { ...settings }
  try {
    const data = await apiPut('/api/hr/settings', payload)
    Object.assign(settings, payload, responseRecord(data, 'settings') || {})
    statusMessage.value = 'HR settings saved to database.'
  } catch (err) {
    error.value = err.message || 'HR settings API unavailable; settings were not saved.'
    return
  }
}

function calculateSalaryStructureNet(structure) {
  const earnings = Number(structure.basic_salary || 0) + Number(structure.hra || 0) + Number(structure.allowances || 0) + Number(structure.bonus || 0)
  const deductionTotal = Number(structure.deductions || 0) + Number(structure.tds || 0)
  return Math.max(0, earnings - deductionTotal)
}

function nextEmployeeId() {
  const nextNumber = workers.value.length + 1
  return `EMP-${String(nextNumber).padStart(4, '0')}`
}

function earnings(record) {
  return Number(record.basic_salary || 0) + Number(record.hra || 0) + Number(record.allowances || 0) + Number(record.bonus || 0) + Number(record.reimbursement || 0)
}

function deductions(record) {
  return Number(record.deductions || 0) + Number(record.tds || 0) + Number(record.advance_adjustment || 0)
}

function sumByType(type) {
  return monthPayroll.value.filter(record => record.employment_type === type).reduce((sum, record) => sum + Number(record.net_payable_salary || 0), 0)
}

function money(value, currency = settings.default_currency || 'INR') {
  return `${currency || 'INR'} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-'
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] || 'E') + (parts[1]?.[0] || '')
}

function isUpcoming(value) {
  if (!value) return false
  const date = new Date(value)
  const today = new Date()
  const future = new Date()
  future.setDate(today.getDate() + 45)
  return date >= today && date <= future
}

function statusClass(status) {
  if (status === 'Active') return 'status-pill active'
  if (status === 'Exited') return 'status-pill danger'
  return 'status-pill inactive'
}

function paymentClass(status) {
  if (status === 'Paid') return 'status-pill active'
  if (status === 'Partially Paid') return 'status-pill warning'
  return 'status-pill inactive'
}

function salarySlipText(record) {
  return [
    `${settings.company_name} - Salary Slip`,
    `${record.salary_month} ${record.salary_year}`,
    `Employee: ${record.employee_name} (${record.employee_id})`,
    `Designation: ${record.designation || '-'}`,
    `Department: ${record.department || '-'}`,
    `Basic Salary: ${money(record.basic_salary)}`,
    `HRA: ${money(record.hra)}`,
    `Allowances: ${money(record.allowances)}`,
    `Bonus / Incentive: ${money(record.bonus)}`,
    `Reimbursement: ${money(record.reimbursement)}`,
    `Deductions: ${money(deductions(record))}`,
    `Net Payable Salary: ${money(record.net_payable_salary)}`,
    `Payment Status: ${record.payment_status}`,
    `Payment Date: ${formatDate(record.payment_date)}`
  ].join('\n')
}

function salarySlipHtml(record) {
  const logoMarkup = effectiveCompanyLogo.value
    ? `<img class="logo" src="${escapeHtml(effectiveCompanyLogo.value)}" alt="Company Logo">`
    : ''
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(record.employee_id)} ${escapeHtml(record.salary_month)} ${record.salary_year} Salary Slip</title>
  <style>
    body { color: #111827; font-family: Arial, sans-serif; margin: 0; padding: 32px; }
    .salary-slip { border: 1px solid #dbe5f0; margin: 0 auto; max-width: 860px; padding: 32px; }
    .header { align-items: flex-start; border-bottom: 2px solid #111827; display: flex; justify-content: space-between; gap: 24px; padding-bottom: 18px; }
    .company { align-items: flex-start; display: flex; gap: 16px; }
    .logo { max-height: 64px; max-width: 150px; object-fit: contain; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 24px; }
    .address { color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 6px; white-space: pre-wrap; }
    .period { text-align: right; }
    .period span { color: #64748b; display: block; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .period strong { display: block; font-size: 18px; margin-top: 6px; }
    .grid { display: grid; gap: 10px 18px; grid-template-columns: 180px 1fr; margin: 24px 0; }
    .grid span { color: #64748b; font-weight: 700; }
    .columns { display: grid; gap: 18px; grid-template-columns: 1fr 1fr; }
    .box { border: 1px solid #dbe5f0; border-radius: 8px; padding: 16px; }
    .box h3 { margin-bottom: 12px; }
    .line { display: flex; justify-content: space-between; padding: 7px 0; }
    .total { align-items: center; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; display: flex; justify-content: space-between; margin-top: 18px; padding: 16px; }
    .total strong { font-size: 24px; }
    @media print { body { padding: 0; } .salary-slip { border: 0; } }
  </style>
</head>
<body>
  <main class="salary-slip">
    <section class="header">
      <div class="company">
        ${logoMarkup}
        <div>
          <h1>${escapeHtml(settings.company_name)}</h1>
          ${settings.company_address ? `<p class="address">${escapeHtml(settings.company_address)}</p>` : ''}
        </div>
      </div>
      <div class="period"><span>Salary Slip</span><strong>${escapeHtml(record.salary_month)} ${record.salary_year}</strong></div>
    </section>
    <section class="grid">
      <span>Employee Name</span><strong>${escapeHtml(record.employee_name)}</strong>
      <span>Employee ID</span><strong>${escapeHtml(record.employee_id)}</strong>
      <span>Designation</span><strong>${escapeHtml(record.designation || '-')}</strong>
      <span>Department</span><strong>${escapeHtml(record.department || '-')}</strong>
      <span>Payment Status</span><strong>${escapeHtml(record.payment_status || '-')}</strong>
      <span>Payment Date</span><strong>${escapeHtml(formatDate(record.payment_date))}</strong>
    </section>
    <section class="columns">
      <div class="box">
        <h3>Earnings</h3>
        <div class="line"><span>Basic Salary</span><strong>${money(record.basic_salary)}</strong></div>
        <div class="line"><span>HRA</span><strong>${money(record.hra)}</strong></div>
        <div class="line"><span>Allowances</span><strong>${money(record.allowances)}</strong></div>
        <div class="line"><span>Bonus / Incentive</span><strong>${money(record.bonus)}</strong></div>
        <div class="line"><span>Reimbursement</span><strong>${money(record.reimbursement)}</strong></div>
      </div>
      <div class="box">
        <h3>Deductions</h3>
        <div class="line"><span>Deductions</span><strong>${money(record.deductions)}</strong></div>
        <div class="line"><span>TDS / Tax</span><strong>${money(record.tds)}</strong></div>
        <div class="line"><span>Advance Adjustment</span><strong>${money(record.advance_adjustment)}</strong></div>
      </div>
    </section>
    <section class="total"><span>Net Payable Salary</span><strong>${money(record.net_payable_salary)}</strong></section>
  </main>
</body>
</html>`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
</script>

<style scoped>
.hr-page { max-width: 1440px; margin: 0 auto; }
.header-actions, .section-toolbar, .toolbar-controls, .action-row, .actions-cell { align-items: center; display: flex; gap: 10px; }
.section-toolbar { justify-content: space-between; margin-bottom: 16px; }
.section-toolbar h2 { margin: 0; }
.metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px; }
.metric-card, .record-card, .inline-panel { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; min-width: 0; padding: 16px; }
.metric-card span, .report-card span { color: var(--muted); display: block; font-size: 11px; font-weight: 850; letter-spacing: 0.04em; text-transform: uppercase; }
.metric-card strong { display: block; font-size: 24px; margin-top: 6px; }
.employee-master-panel { background: #fff; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.employee-master-header { align-items: center; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; gap: 16px; padding: 18px 20px; }
.employee-master-header h2 { margin: 2px 0 0; }
.employee-master-controls { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }
.employee-master-controls input { min-width: 280px; }
.employee-master-controls input,
.employee-master-controls select { background: #fff; border: 1px solid var(--line); border-radius: 8px; color: var(--ink); font-weight: 700; min-height: 40px; padding: 9px 11px; }
.employee-master-stats { background: #f8fafc; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.employee-master-stats div { border-right: 1px solid var(--line); padding: 12px 20px; }
.employee-master-stats div:last-child { border-right: 0; }
.employee-master-stats span { color: var(--muted); display: block; font-size: 11px; font-weight: 850; letter-spacing: .04em; text-transform: uppercase; }
.employee-master-stats strong { display: block; font-size: 20px; margin-top: 3px; }
.employee-cell { align-items: center; display: flex; gap: 12px; min-width: 240px; }
.employee-avatar { align-items: center; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 999px; color: #075985; display: inline-flex; flex: 0 0 38px; font-size: 13px; font-weight: 900; height: 38px; justify-content: center; text-transform: uppercase; width: 38px; }
.company-logo-setting { display: flex; flex-direction: column; gap: 8px; }
.company-logo-setting > span { color: #334155; font-size: 13px; font-weight: 800; }
.company-logo-setting-preview { align-items: center; border: 1px dashed #cbd5e1; border-radius: 8px; display: flex; min-height: 56px; padding: 10px; }
.company-logo-setting-preview img { max-height: 48px; max-width: 160px; object-fit: contain; }
.company-logo-setting small { color: var(--muted); }
.compact-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.compact-tabs button { background: #f8fafc; border: 1px solid var(--line); border-radius: 8px; color: #334155; cursor: pointer; font-weight: 800; padding: 10px 14px; }
.compact-tabs button.active { background: #0f172a; border-color: #0f172a; color: #fff; }
.block { display: block; }
.right { text-align: right; }
.work-grid { align-items: start; display: grid; gap: 18px; grid-template-columns: minmax(0, 1fr) minmax(320px, 420px); }
.toolbar-controls input, .toolbar-controls select { min-width: 120px; }
.inline-panel { margin-bottom: 16px; }
.payroll-table-scroll {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow-x: auto;
}
.payroll-table {
  min-width: 880px;
}
.payroll-table th,
.payroll-table td {
  vertical-align: middle;
}
.payroll-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  min-width: 210px;
}
.button.secondary.danger {
  border-color: #fecaca;
  color: #b91c1c;
}
.button.secondary.danger:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}
.checkbox-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
.checkbox-grid label, .checkbox-label { align-items: center; display: flex; gap: 8px; }
.payment-row { border-bottom: 1px solid var(--line); display: grid; gap: 4px; padding: 12px 0; }
.payment-row:first-of-type { padding-top: 0; }
.payment-row span, .payment-row small { color: var(--muted); }
.payment-error { margin-top: 14px; }
.report-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
.report-card strong { display: block; font-size: 22px; margin: 8px 0 4px; }
.report-card small { color: var(--muted); }
.wide-modal { max-width: 980px; width: min(980px, calc(100vw - 32px)); }
:global(body.hr-modal-open) {
  overflow: hidden;
}
.hr-modal-overlay {
  align-items: center;
  bottom: 0;
  display: flex;
  height: 100dvh;
  justify-content: center;
  left: 0;
  overflow: auto;
  padding: 24px;
  position: fixed;
  right: 0;
  top: 0;
  width: 100vw;
  z-index: 6000;
}
.hr-modal-overlay-top {
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(3px);
  z-index: 7000;
}
.hr-modal-shell {
  border: 1px solid #dbe5f0;
  border-radius: 12px;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.22);
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: calc(100vh - 48px);
  overflow: hidden;
  position: relative;
  z-index: 1;
}
.compact-hr-modal { max-width: 820px; }
.hr-modal-header {
  align-items: flex-start;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 26px;
}
.hr-modal-header h2 {
  color: #0f172a;
  font-size: 22px;
  line-height: 1.2;
  margin: 4px 0 0;
}
.hr-modal-header span {
  color: #64748b;
  display: block;
  font-size: 13px;
  margin-top: 6px;
}
.hr-modal-form {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}
.hr-modal-body {
  background: #f8fafc;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 22px 26px;
}
.hr-modal-footer {
  align-items: center;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
  justify-content: flex-end;
  padding: 16px 26px;
}
.form-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px;
}
.form-section + .form-section { margin-top: 16px; }
.form-section-title {
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 18px;
  padding-bottom: 14px;
}
.form-section-title h3 {
  color: #0f172a;
  font-size: 16px;
  margin: 0 0 4px;
}
.form-section-title span {
  color: #64748b;
  font-size: 13px;
}
.hr-modal-shell .form-grid label {
  color: #475569;
  font-size: 12px;
  font-weight: 850;
  gap: 7px;
  text-transform: none;
}
.hr-modal-shell input,
.hr-modal-shell select,
.hr-modal-shell textarea {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #0f172a;
  min-height: 42px;
}
.hr-modal-shell textarea { resize: vertical; }
.employee-detail-modal { max-width: 1040px; }
.employee-detail-header {
  background: #0f172a;
  color: #ffffff;
}
.employee-detail-header h2 { color: #ffffff; }
.employee-detail-header span { color: #cbd5e1; }
.employee-detail-header .eyebrow { color: #67e8f9; }
.employee-detail-header .modal-close {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}
.detail-tabs {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  padding: 6px;
}
.detail-tabs button {
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
  font-weight: 850;
  padding: 10px 14px;
}
.detail-tabs button.active {
  background: #0f172a;
  color: #ffffff;
}
.detail-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px;
}
.detail-section h3 {
  color: #0f172a;
  font-size: 17px;
  margin: 0;
}
.detail-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.detail-grid-cards div {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
}
.detail-grid dt { color: #64748b; font-size: 11px; font-weight: 850; letter-spacing: 0.04em; text-transform: uppercase; }
.detail-grid dd { color: #0f172a; margin: 5px 0 0; overflow-wrap: anywhere; }
.empty-panel {
  align-items: center;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  color: #64748b;
  display: flex;
  font-weight: 750;
  justify-content: center;
  min-height: 120px;
}
.calculated-field {
  align-items: center;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
}
.calculated-field span {
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
}
.calculated-field strong {
  color: #0f172a;
  font-size: 20px;
}
.status-pill { border-radius: 999px; display: inline-flex; font-size: 11px; font-weight: 850; padding: 4px 10px; }
.status-pill.active { background: #dcfce7; color: #166534; }
.status-pill.inactive { background: #f1f5f9; color: #475569; }
.status-pill.warning { background: #fef3c7; color: #92400e; }
.status-pill.danger { background: #fee2e2; color: #991b1b; }
.payment-total { align-items: center; background: #f8fafc; border: 1px solid var(--line); border-radius: 8px; display: flex; justify-content: space-between; margin-top: 14px; padding: 14px 16px; }
.payment-total span { color: var(--muted); font-size: 12px; font-weight: 850; text-transform: uppercase; }
.payment-total strong { font-size: 22px; }
.slip-modal { max-width: 860px; width: min(860px, calc(100vw - 32px)); }
.salary-slip { background: #fff; color: #111827; padding: 32px; }
.slip-header { align-items: flex-start; border-bottom: 2px solid #111827; display: flex; gap: 24px; justify-content: space-between; margin-bottom: 24px; padding-bottom: 18px; }
.slip-company { align-items: flex-start; display: flex; gap: 16px; min-width: 0; }
.slip-logo { max-height: 64px; max-width: 150px; object-fit: contain; }
.slip-header h2 { margin: 0; }
.slip-header p { color: #64748b; font-size: 12px; line-height: 1.5; margin: 6px 0 0; white-space: pre-wrap; }
.slip-period { flex: 0 0 auto; text-align: right; }
.slip-period span { color: #64748b; display: block; font-size: 11px; font-weight: 850; letter-spacing: 0.08em; text-transform: uppercase; }
.slip-period strong { display: block; font-size: 18px; margin-top: 6px; }
.slip-grid { display: grid; gap: 10px 16px; grid-template-columns: 180px 1fr; margin-bottom: 24px; }
.slip-grid span { color: #64748b; font-weight: 800; }
.slip-columns { display: grid; gap: 18px; grid-template-columns: 1fr 1fr; }
.slip-columns div { border: 1px solid #dbe5f0; border-radius: 8px; padding: 16px; }
.slip-columns h3 { margin-top: 0; }
.slip-columns p { display: flex; justify-content: space-between; }
.slip-total { align-items: center; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; display: flex; justify-content: space-between; margin-top: 18px; padding: 16px; }
.slip-total strong { font-size: 24px; }
@media (max-width: 980px) {
  .work-grid, .slip-columns { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .hr-modal-overlay {
    align-items: flex-start;
    padding: 10px;
  }
  .hr-modal-shell {
    max-height: calc(100vh - 20px);
    width: calc(100vw - 20px);
  }
  .hr-modal-header,
  .hr-modal-body,
  .hr-modal-footer {
    padding-left: 18px;
    padding-right: 18px;
  }
  .hr-modal-footer {
    align-items: stretch;
    flex-direction: column-reverse;
  }
  .hr-modal-footer .button {
    width: 100%;
  }
  .detail-tabs {
    overflow-x: auto;
  }
  .detail-tabs button {
    white-space: nowrap;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .slip-header {
    flex-direction: column;
  }
  .slip-period {
    text-align: left;
  }
}
@media print {
  body * { visibility: hidden; }
  #salary-slip-preview, #salary-slip-preview * { visibility: visible; }
  #salary-slip-preview { left: 0; position: absolute; top: 0; width: 100%; }
}
</style>
