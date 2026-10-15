<template>
  <div class="setup-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Administration</p>
        <h1>Setup</h1>
        <p class="muted">Configure objects, fields, users, and company information.</p>
      </div>
    </header>

    <nav class="setup-tabs">
      <button :class="{ active: activeTab === 'objects' }" @click="activeTab = 'objects'">Object Manager</button>
      <button :class="{ active: activeTab === 'roles' }" @click="activeTab = 'roles'">Profiles (Roles)</button>
      <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">User Management</button>
      <button :class="{ active: activeTab === 'company' }" @click="activeTab = 'company'">Company Information</button>
      <button :class="{ active: activeTab === 'periods' }" @click="activeTab = 'periods'">Accounting Periods</button>
      <button :class="{ active: activeTab === 'masters' }" @click="activeTab = 'masters'">Master Data</button>
      <button :class="{ active: activeTab === 'rates' }" @click="activeTab = 'rates'">Exchange Rates</button>
      <button :class="{ active: activeTab === 'logs' }" @click="activeTab = 'logs'">Activity Logs</button>
    </nav>

    <main class="setup-content">
      <!-- Company Information Tab -->
      <section v-if="activeTab === 'company'" class="company-setup">
        <div class="record-card shadow-premium">
          <div class="card-section-title" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 16px; margin-bottom: 24px;">
            <div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: var(--primary);">Your Company Details</h2>
              <p class="muted small" style="margin: 4px 0 0 0;">These details appear in the header of your generated Sales Invoices.</p>
            </div>
            <button 
              v-if="!isEditing && company.company_name" 
              type="button" 
              class="button secondary small" 
              @click="startEdit"
            >
              Edit Details
            </button>
          </div>

          <!-- Read-Only View -->
          <div v-if="!isEditing && company.company_name" class="form-grid record-details" style="gap: 20px;">
            <div class="span-2 company-logo-row">
              <span class="detail-label" style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--muted); margin-bottom: 8px;">Company Logo</span>
              <div class="company-logo-preview">
                <img v-if="company.company_logo_url" :src="company.company_logo_url" alt="Company Logo">
                <span v-else>No logo uploaded</span>
              </div>
            </div>
            <div class="span-2">
              <span class="detail-label" style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--muted); margin-bottom: 4px;">Company Name</span>
              <strong style="font-size: 18px; color: var(--text);">{{ company.company_name }}</strong>
            </div>
            <div class="span-2">
              <span class="detail-label" style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--muted); margin-bottom: 4px;">Business Address</span>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">{{ company.company_address }}</p>
            </div>
            <div>
              <span class="detail-label" style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--muted); margin-bottom: 4px;">Business Email</span>
              <span style="font-size: 14px;">{{ company.company_email || '—' }}</span>
            </div>
            <div>
              <span class="detail-label" style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--muted); margin-bottom: 4px;">Business Phone</span>
              <span style="font-size: 14px;">{{ company.company_phone || '—' }}</span>
            </div>
            <div class="span-2">
              <span class="detail-label" style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--muted); margin-bottom: 4px;">Tax ID / GST Number</span>
              <span style="font-size: 14px; font-weight: 600;">{{ company.tax_id || '—' }}</span>
            </div>
          </div>

          <!-- Form Edit View -->
          <form v-else class="setup-form" @submit.prevent="saveCompany">
            <div class="form-grid">
              <label class="span-2">Company Name <span style="color: #dc2626;">*</span>
                <input v-model="companyFormState.company_name" placeholder="e.g. Acme Corp Solutions" required>
              </label>
              <label class="span-2">Business Address <span style="color: #dc2626;">*</span>
                <textarea v-model="companyFormState.company_address" rows="3" placeholder="Street, City, State, ZIP" required></textarea>
              </label>
              <label>Business Email
                <input v-model="companyFormState.company_email" type="email" placeholder="billing@acme.com">
              </label>
              <label>Business Phone
                <input v-model="companyFormState.company_phone" placeholder="+1 (555) 000-0000">
              </label>
              <label>Tax ID / GST Number
                <input v-model="companyFormState.tax_id" placeholder="e.g. VAT123456">
              </label>
              <label class="span-2">Company Logo
                <div class="company-logo-uploader">
                  <div class="company-logo-preview">
                    <img v-if="companyFormState.company_logo_url" :src="companyFormState.company_logo_url" alt="Company Logo">
                    <span v-else>No logo selected</span>
                  </div>
                  <div class="company-logo-controls">
                    <input v-model="companyFormState.company_logo_url" placeholder="Logo URL will appear here after upload">
                    <input type="file" accept="image/*" :disabled="uploadingCompanyLogo" @change="handleCompanyLogoUpload">
                    <span v-if="uploadingCompanyLogo" class="field-hint">Uploading logo...</span>
                    <span v-if="companyLogoError" class="field-hint text-danger">{{ companyLogoError }}</span>
                  </div>
                </div>
              </label>
            </div>
            <div class="form-actions mt-24">
              <span v-if="saved" class="save-status" style="color: #16a34a; font-weight: 700; margin-right: 16px;">Settings saved!</span>
              <button 
                v-if="company.company_name" 
                type="button" 
                class="button secondary" 
                @click="cancelEdit"
              >
                Cancel
              </button>
              <button type="submit" class="button">Save Company Information</button>
            </div>
          </form>
        </div>
      </section>

      <!-- Accounting Periods & Period Closing Tab -->
      <section v-if="activeTab === 'periods'" class="periods-setup">
        <div class="record-card shadow-premium periods-card">
          <div class="card-section-title periods-header">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0;">Financial Accounting Periods & Closing</h2>
                <span class="period-badge-sub">Fiscal Period Lock</span>
              </div>
              <p class="muted small" style="margin: 4px 0 0 0;">
                Set accounting periods (e.g. 1st Jan to 31st Dec). Locking an accounting period completely prevents new transactions, modifications, and reversals from posting to the Transaction Ledger and General Ledger.
              </p>
            </div>
            <div class="header-btns">
              <button type="button" class="button" @click="openNewPeriodModal">
                <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right: 6px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                Set New Period
              </button>
            </div>
          </div>

          <!-- Periods KPI Summary -->
          <div class="periods-summary-grid">
            <div class="p-summary-box">
              <span class="p-summary-label">Total Periods</span>
              <strong class="p-summary-val">{{ accountingPeriods.length }}</strong>
              <span class="p-summary-sub">Configured Fiscal Calendars</span>
            </div>
            <div class="p-summary-box open">
              <span class="p-summary-label">Open Periods</span>
              <strong class="p-summary-val text-success">{{ openPeriodsCount }}</strong>
              <span class="p-summary-sub">Accepting Ledger Postings</span>
            </div>
            <div class="p-summary-box locked">
              <span class="p-summary-label">Closed / Locked Periods</span>
              <strong class="p-summary-val text-danger">{{ lockedPeriodsCount }}</strong>
              <span class="p-summary-sub">Postings Strictly Blocked</span>
            </div>
          </div>

          <!-- Periods List Table -->
          <div v-if="loadingPeriods" class="state-box" style="padding: 40px; text-align: center;">
            <p>Loading accounting periods...</p>
          </div>
          <div v-else-if="accountingPeriods.length === 0" class="empty-state muted" style="padding: 32px; text-align: center;">
            No accounting periods found. Click "Set New Period" to configure fiscal periods.
          </div>
          <div v-else class="table-responsive" style="margin-top: 16px;">
            <table class="data-table periods-table">
              <thead>
                <tr>
                  <th style="width: 140px;">Period Name</th>
                  <th style="width: 100px;">Fiscal Year</th>
                  <th style="width: 230px;">Accounting Date Range</th>
                  <th style="width: 150px;">Status</th>
                  <th>Audit & Lock Details</th>
                  <th style="width: 220px;" class="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="period in accountingPeriods" :key="period.id" :class="{ 'row-locked': period.status === 'Locked' || period.status === 'Closed' }">
                  <td>
                    <strong style="font-size: 14px; color: #0f172a;">{{ period.name }}</strong>
                    <div v-if="period.notes" class="small muted">{{ period.notes }}</div>
                  </td>
                  <td>
                    <span class="fiscal-year-tag">{{ period.fiscal_year || '—' }}</span>
                  </td>
                  <td>
                    <div class="date-range-display">
                      <span class="mono">{{ formatDateStr(period.start_date) }}</span>
                      <span class="arrow-sep">→</span>
                      <span class="mono">{{ formatDateStr(period.end_date) }}</span>
                    </div>
                  </td>
                  <td>
                    <span 
                      class="period-status-pill" 
                      :class="period.status === 'Locked' || period.status === 'Closed' ? 'status-locked' : 'status-open'"
                    >
                      <svg v-if="period.status === 'Locked' || period.status === 'Closed'" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                      <svg v-else viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/></svg>
                      {{ period.status === 'Locked' || period.status === 'Closed' ? 'Locked / Closed' : 'Open' }}
                    </span>
                  </td>
                  <td>
                    <div v-if="period.status === 'Locked' || period.status === 'Closed'" class="lock-audit-meta">
                      <span class="locked-text">🔒 Posting Blocked</span>
                      <small class="muted" v-if="period.locked_by" style="display: block;">by {{ period.locked_by }} on {{ formatDateStr(period.locked_at) }}</small>
                    </div>
                    <div v-else class="open-audit-meta">
                      <span class="text-success small font-bold">✓ Active ledger entries permitted</span>
                    </div>
                  </td>
                  <td class="right actions-cell">
                    <div style="display: inline-flex; align-items: center; gap: 8px; justify-content: flex-end;">
                      <!-- Lock / Unlock Toggle Button -->
                      <button 
                        v-if="period.status === 'Open'" 
                        type="button" 
                        class="button danger small lock-btn" 
                        title="Close and lock period to prevent any posting"
                        @click="togglePeriodLock(period)"
                      >
                        🔒 Lock Period
                      </button>
                      <button 
                        v-else 
                        type="button" 
                        class="button secondary small unlock-btn" 
                        title="Reopen accounting period to permit posting"
                        @click="togglePeriodLock(period)"
                      >
                        🔓 Reopen
                      </button>

                      <button 
                        type="button" 
                        class="button secondary small" 
                        @click="openEditPeriodModal(period)"
                      >
                        Edit
                      </button>
                      <button 
                        type="button" 
                        class="button secondary small text-danger" 
                        @click="deletePeriod(period)"
                        title="Delete period"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Period Modal (Create / Edit) -->
        <div v-if="showPeriodModal" class="modal-overlay" @click.self="showPeriodModal = false">
          <div class="modal-content period-modal-shell">
            <div class="modal-header">
              <div>
                <p class="eyebrow">Finance Settings</p>
                <h2>{{ isEditingPeriod ? 'Edit Accounting Period' : 'Set Accounting Period' }}</h2>
              </div>
              <button type="button" class="modal-close" @click="showPeriodModal = false">&times;</button>
            </div>
            
            <form class="setup-form period-form" @submit.prevent="savePeriod">
              <div class="quick-presets-row" v-if="!isEditingPeriod">
                <span class="preset-label">Quick Presets:</span>
                <button type="button" class="preset-btn" @click="applyPeriodPreset('2026')">Calendar 2026 (1 Jan - 31 Dec)</button>
                <button type="button" class="preset-btn" @click="applyPeriodPreset('2025')">Calendar 2025 (1 Jan - 31 Dec)</button>
                <button type="button" class="preset-btn" @click="applyPeriodPreset('fy26')">Indian FY 2026-27 (1 Apr - 31 Mar)</button>
              </div>

              <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
                <label>Period Label / Name <span class="req">*</span>
                  <input v-model="periodForm.name" placeholder="e.g. FY 2026 or Calendar Year 2026" required>
                </label>
                <label>Fiscal Year Reference
                  <input v-model="periodForm.fiscal_year" placeholder="e.g. 2026">
                </label>
                <label>Period Start Date <span class="req">*</span>
                  <input type="date" v-model="periodForm.start_date" required>
                </label>
                <label>Period End Date <span class="req">*</span>
                  <input type="date" v-model="periodForm.end_date" required>
                </label>
                <label class="span-2">Period Status
                  <select v-model="periodForm.status">
                    <option value="Open">Open (Transactions can be posted)</option>
                    <option value="Locked">Locked / Closed (Transactions will be strictly blocked)</option>
                  </select>
                </label>
                <label class="span-2">Notes & Remarks
                  <textarea v-model="periodForm.notes" rows="2" placeholder="e.g. Calendar year 2026 fiscal closing period..."></textarea>
                </label>
              </div>

              <p v-if="periodError" class="flash warning" style="margin-top: 14px;">{{ periodError }}</p>

              <div class="form-actions mt-24" style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" class="button secondary" @click="showPeriodModal = false">Cancel</button>
                <button type="submit" class="button" :disabled="savingPeriod">
                  {{ savingPeriod ? 'Saving...' : 'Save Accounting Period' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'masters'" class="master-data-setup">
        <div class="master-grid">
          <div class="record-card shadow-premium master-card">
            <div class="card-section-title bank-accounts-header">
              <div>
                <h2>Payment Terms</h2>
                <p class="muted small">Active terms appear in customer and vendor profile dropdowns.</p>
              </div>
              <button type="button" class="button" @click="openMasterModal('payment-terms')">Add Term</button>
            </div>
            <div v-if="paymentTerms.length === 0" class="empty-state muted">No payment terms configured.</div>
            <table v-else class="data-table">
              <thead><tr><th>Name</th><th>Status</th><th></th></tr></thead>
              <tbody>
                <tr v-for="term in paymentTerms" :key="term.id">
                  <td><strong>{{ term.name }}</strong></td>
                  <td><span class="pill" :class="term.is_active ? 'status-success' : 'status-muted'">{{ term.is_active ? 'Active' : 'Inactive' }}</span></td>
                  <td class="actions-cell"><button type="button" class="button secondary small" @click="openMasterModal('payment-terms', term)">Edit</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="record-card shadow-premium master-card">
            <div class="card-section-title bank-accounts-header">
              <div>
                <h2>Payment Modes</h2>
                <p class="muted small">Active modes appear in customer and vendor profile dropdowns.</p>
              </div>
              <button type="button" class="button" @click="openMasterModal('payment-modes')">Add Mode</button>
            </div>
            <div v-if="paymentModes.length === 0" class="empty-state muted">No payment modes configured.</div>
            <table v-else class="data-table">
              <thead><tr><th>Name</th><th>Status</th><th></th></tr></thead>
              <tbody>
                <tr v-for="mode in paymentModes" :key="mode.id">
                  <td><strong>{{ mode.name }}</strong></td>
                  <td><span class="pill" :class="mode.is_active ? 'status-success' : 'status-muted'">{{ mode.is_active ? 'Active' : 'Inactive' }}</span></td>
                  <td class="actions-cell"><button type="button" class="button secondary small" @click="openMasterModal('payment-modes', mode)">Edit</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="showMasterModal" class="modal-overlay" @click.self="showMasterModal = false">
          <div class="modal-content bank-modal">
            <div class="bank-modal-header">
              <div>
                <p class="eyebrow">Master Data</p>
                <h2>{{ masterForm.id ? 'Edit' : 'New' }} {{ masterTypeLabel }}</h2>
              </div>
              <button type="button" class="modal-close" @click="showMasterModal = false">&times;</button>
            </div>
            <form class="setup-form bank-modal-form" @submit.prevent="saveMasterOption">
              <div class="bank-form-grid">
                <label class="span-2">Name
                  <input v-model="masterForm.name" placeholder="Enter option name" required>
                </label>
                <label class="checkbox-row bank-default-row span-2">
                  <input type="checkbox" v-model="masterForm.is_active">
                  <span>Active</span>
                </label>
              </div>
              <div class="form-actions bank-modal-actions">
                <button type="button" class="button secondary" @click="showMasterModal = false">Cancel</button>
                <button type="submit" class="button">Save</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <!-- Exchange Rates Tab -->
      <section v-if="activeTab === 'rates'" class="exchange-rates-setup">
        <div class="record-card shadow-premium" style="border-radius: 12px; border: 1px solid var(--line); background: var(--surface); box-shadow: 0 4px 20px -2px rgba(120, 113, 108, 0.05); padding: 24px; transition: all 0.3s ease;">
          <div class="card-section-title" style="display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid var(--line);">
            <h2 style="font-size: 15px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; margin: 0;">Currency Exchange Rates</h2>
            <p class="muted small" style="font-size: 12px; color: var(--muted); margin: 4px 0 0 0;">Configure exchange rates on a default and monthly basis. Base currency is USD (Default = 1.00).</p>
          </div>
          
          <div class="setup-form" style="margin-top: 16px;">
            <!-- Default Rates Card -->
            <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
              <label style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: var(--muted);">
                Default USD Rate
                <input type="number" value="1" disabled style="padding: 10px 14px; border: 1.5px solid var(--line); border-radius: 8px; font-size: 15px; background: #e2e8f0; opacity: 0.7; color: var(--primary);">
              </label>
              <label style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: var(--muted);">
                Default INR Rate (1 USD = X INR)
                <input type="number" v-model.number="ratesConfig.INR.default" step="0.01" min="1" required style="padding: 10px 14px; border: 1.5px solid var(--line); border-radius: 8px; font-size: 15px; background: #ffffff; color: var(--primary);">
              </label>
            </div>

            <!-- Monthly Overrides Section -->
            <div class="monthly-overrides-section">
              <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; background: none; border-bottom: 1.5px solid var(--line); margin-bottom: 16px;">
                <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: var(--muted); margin: 0;">Monthly Rates Overrides</h3>
                <button type="button" class="button secondary small" style="padding: 8px 16px; border: 1px solid var(--line); border-radius: 8px; background: none; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;" @click="addMonthlyRow">Add Monthly Override</button>
              </div>

              <div v-if="Object.keys(ratesConfig.INR.monthly).length === 0" class="empty-state" style="text-align: center; padding: 24px; background: #f8fafc; border-radius: 8px; color: var(--muted); font-style: italic;">
                No monthly overrides added yet. Default rates will apply.
              </div>
              
              <div v-else class="monthly-rows-container" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
                <div v-for="(rate, month) in ratesConfig.INR.monthly" :key="month" class="monthly-override-row" style="display: flex; align-items: center; gap: 16px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--line);">
                  <div style="flex: 1;">
                    <label style="font-size: 12px; color: var(--muted); font-weight: 700; display: block; margin-bottom: 4px;">Month</label>
                    <input type="month" :value="month" disabled style="width: 100%; padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; background: #e2e8f0; font-size: 14px; font-weight: 700;">
                  </div>
                  <div style="flex: 1;">
                    <label style="font-size: 12px; color: var(--muted); font-weight: 700; display: block; margin-bottom: 4px;">1 USD = X INR</label>
                    <input type="number" v-model.number="ratesConfig.INR.monthly[month]" step="0.01" min="1" style="width: 100%; padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; background: #ffffff; font-size: 14px; font-weight: 700; color: var(--primary);">
                  </div>
                  <button type="button" class="button secondary small" style="margin-top: 20px; color: #dc2626; border-color: #fca5a5; background: #fef2f2;" @click="deleteMonthlyRow(month)">Remove</button>
                </div>
              </div>
            </div>

            <!-- Add New Monthly Override Panel (inline) -->
            <div v-if="showAddMonthly" class="add-monthly-inline-panel" style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #b45309;">Add Monthly Rate Override</h4>
              <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 16px; align-items: flex-end;">
                <label style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: var(--muted);">
                  Target Month
                  <input type="month" v-model="newOverrideMonth" style="padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; background: #ffffff; font-size: 14px;">
                </label>
                <label style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: var(--muted);">
                  1 USD = X INR
                  <input type="number" v-model.number="newOverrideRate" step="0.01" min="1" placeholder="95.00" style="padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; background: #ffffff; font-size: 14px;">
                </label>
                <div style="display: flex; gap: 8px; margin-bottom: 4px;">
                  <button type="button" class="button" style="padding: 8px 16px; background: var(--primary); color: #ffffff; border-radius: 6px; border: none; font-weight: 700; cursor: pointer;" @click="saveNewMonthlyOverride">Add</button>
                  <button type="button" class="button secondary" style="padding: 8px 16px; background: none; border: 1px solid var(--line); border-radius: 6px; font-weight: 700; cursor: pointer;" @click="showAddMonthly = false">Cancel</button>
                </div>
              </div>
            </div>

            <div class="form-actions" style="margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: flex-end;">
              <span v-if="ratesSaved" class="save-status" style="color: #16a34a; font-weight: 700; margin-right: 16px;">Exchange rates saved!</span>
              <button type="button" class="button" style="padding: 10px 20px; background: var(--primary); color: #ffffff; border-radius: 8px; border: none; font-weight: 750; cursor: pointer;" @click="saveRates">Save Exchange Rates</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Object Manager Tab -->
      <section v-if="activeTab === 'objects'" class="object-manager">
        <div class="setup-grid">
          <div v-for="obj in objects" :key="obj.id" class="setup-tile" @click="editObject(obj.api_name)">
            <strong>{{ obj.label }}</strong>
            <span class="muted small">{{ obj.api_name }}</span>
            <p class="description">{{ obj.description || 'No description provided.' }}</p>
          </div>
        </div>
      </section>
      
      <!-- Roles / Profiles Tab -->
      <section v-if="activeTab === 'roles'" class="roles-manager">
        <div class="table-container shadow-premium">
          <div class="panel-header">
            <h2>Profiles</h2>
            <button class="button secondary" @click="showNewRoleModal = true">New Profile</button>
          </div>
          <table class="record-table">
            <thead>
              <tr>
                <th>Profile Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in roles" :key="role.id">
                <td><strong>{{ role.name }}</strong></td>
                <td>{{ role.description }}</td>
                <td class="table-actions">
                  <a href="#" @click.prevent="manageSecurity(role)">Manage Security</a>
                  <template v-if="role.name !== 'System Administrator'">
                    <a href="#" @click.prevent="editRole(role)">Edit</a>
                    <a href="#" class="text-danger" @click.prevent="deleteRole(role)">Delete</a>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- User Management Tab -->
      <section v-if="activeTab === 'users'" class="user-manager">
        <div class="table-container shadow-premium">
          <div class="panel-header">
            <h2>Users</h2>
            <button class="button secondary" @click="openNewUserModal">New User</button>
          </div>
          <table class="record-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Login Email</th>
                <th>Task Notification Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td><strong>{{ u.full_name }}</strong></td>
                <td>{{ u.email }}</td>
                <td>
                  <span v-if="u.notification_email" style="color: #2563eb; font-weight: 600;">{{ u.notification_email }}</span>
                  <span v-else class="muted small">Same as login</span>
                </td>
                <td>{{ u.role_name }}</td>
                <td><span class="pill" :class="u.is_active ? 'status-success' : 'status-muted'">{{ u.is_active ? 'Active' : 'Inactive' }}</span></td>
                <td class="table-actions">
                  <a href="#" @click.prevent="openEditUserModal(u)">Edit</a>
                  <a href="#" style="margin-left: 8px; color: var(--muted);" @click.prevent="openResetPasswordModal(u)">Reset Password</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Activity Logs Tab -->
      <section v-if="activeTab === 'logs'" class="activity-logs-setup">
        <div class="table-container shadow-premium">
          <div class="panel-header" style="display: flex; flex-direction: column; gap: 16px; align-items: stretch; background: #f8fafc;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h2 style="font-size: 18px; font-weight: 800; color: var(--primary);">System Activity Logs</h2>
              <button class="button secondary small" @click="resetFilters">Reset Filters</button>
            </div>
            <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 8px;">
              <label style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 700; color: var(--muted);">Module
                <select v-model="filters.module_name" @change="fetchLogs(0)" style="padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px; background: #ffffff;">
                  <option value="">All Modules</option>
                  <option value="Setup">Setup</option>
                  <option value="Finance">Finance</option>
                  <option value="Vault">Vault</option>
                </select>
              </label>
              <label style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 700; color: var(--muted);">Action
                <select v-model="filters.action_type" @change="fetchLogs(0)" style="padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px; background: #ffffff;">
                  <option value="">All Actions</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </label>
              <label style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 700; color: var(--muted);">User Name
                <input v-model="filters.user_name" @input="debounceFetchLogs" placeholder="Search user..." style="padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px; background: #ffffff;">
              </label>
              <label style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 700; color: var(--muted);">Record ID
                <input v-model.number="filters.record_id" type="number" @input="debounceFetchLogs" placeholder="ID..." style="padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px; background: #ffffff;">
              </label>
            </div>
          </div>
          
          <div v-if="logsLoading" class="empty-state">
            <p>Loading activity logs...</p>
          </div>
          <div v-else-if="activityLogs.length === 0" class="empty-state">
            No activity logs matched the specified filters.
          </div>
          <table v-else class="record-table compact">
            <thead>
              <tr>
                <th style="width: 70px;">ID</th>
                <th>Timestamp</th>
                <th>User</th>
                <th>Module</th>
                <th>Entity</th>
                <th style="width: 100px;">Record ID</th>
                <th style="width: 100px;">Action</th>
                <th>Reference</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in activityLogs" :key="log.id">
                <td><span class="muted small font-mono">#{{ log.id }}</span></td>
                <td style="white-space: nowrap;"><span class="small font-mono">{{ formatTimestamp(log.timestamp) }}</span></td>
                <td><strong>{{ log.user_name }}</strong></td>
                <td><span class="pill" :class="log.module_name === 'Setup' ? 'status-muted' : 'status-success'">{{ log.module_name }}</span></td>
                <td>{{ log.entity_name }}</td>
                <td><span class="pill font-mono" style="background: #f1f5f9; color: #475569;">#{{ log.record_id }}</span></td>
                <td>
                  <span class="pill font-bold small" :class="getActionClass(log.action_type)">
                    {{ log.action_type }}
                  </span>
                </td>
                <td><span v-if="log.reference_number" class="font-mono small">{{ log.reference_number }}</span><span v-else class="muted">-</span></td>
                <td class="table-actions">
                  <a href="#" @click.prevent="viewLogDetails(log)">Inspect Diff</a>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div v-if="activityLogs.length > 0" class="panel-header" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--line); border-bottom: none; background: #ffffff; padding: 12px 24px;">
            <span class="small muted">
              Showing {{ pagination.skip + 1 }} - {{ Math.min(pagination.skip + pagination.limit, pagination.total) }} of {{ pagination.total }} logs
            </span>
            <div style="display: flex; gap: 8px;">
              <button class="button secondary small" :disabled="pagination.skip === 0" @click="changePage(-1)">Previous</button>
              <button class="button secondary small" :disabled="pagination.skip + pagination.limit >= pagination.total" @click="changePage(1)">Next</button>
            </div>
          </div>
        </div>
      </section>

      <!-- FLS Security Modal (Object List) -->
      <div v-if="selectedRoleForSecurity" class="modal-overlay" @click="selectedRoleForSecurity = null">
        <div class="modal-content large" @click.stop>
          <div class="modal-header">
            <h2>Security for {{ selectedRoleForSecurity.name }}</h2>
            <button class="modal-close" @click="selectedRoleForSecurity = null">&times;</button>
          </div>
          <div class="modal-body p-24">
            <p class="muted mb-16">Select an object to configure Field Level Security (FLS) for this profile.</p>
            <div class="setup-grid">
              <div v-for="obj in objects" :key="obj.id" class="setup-tile" @click="configureFLS(selectedRoleForSecurity.id, obj)">
                <strong>{{ obj.label }}</strong>
                <span class="muted small">{{ obj.field_count }} fields</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FLS Field Config Modal -->
      <div v-if="flsConfig" class="modal-overlay" @click="flsConfig = null">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>FLS: {{ flsConfig.object.label }}</h2>
            <p class="muted small">Configuring for {{ flsConfig.roleName }}</p>
            <button class="modal-close" @click="flsConfig = null">&times;</button>
          </div>
          <div class="modal-body p-24">
            <table class="record-table compact">
              <thead>
                <tr>
                  <th>Field</th>
                  <th class="center">View</th>
                  <th class="center">Edit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in flsConfig.fields" :key="f.id">
                  <td><strong>{{ f.label }}</strong> <span class="muted small">{{ f.api_name }}</span></td>
                  <td class="center"><input type="checkbox" v-model="f.can_view"></td>
                  <td class="center"><input type="checkbox" v-model="f.can_edit"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer p-24 action-row">
             <button class="button secondary" @click="flsConfig = null">Cancel</button>
             <button class="button" @click="saveFLS">Save Permissions</button>
          </div>
        </div>
      </div>

      <!-- New Role Modal -->
      <div v-if="showNewRoleModal" class="modal-overlay" @click="showNewRoleModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ newRole.id ? 'Edit Profile' : 'New Profile' }}</h2>
            <button class="modal-close" @click="showNewRoleModal = false">&times;</button>
          </div>
          <form class="modal-form p-24" @submit.prevent="saveRole">
            <div class="form-grid single-column">
              <label>Profile Name <input v-model="newRole.name" required></label>
              <label>Description <textarea v-model="newRole.description" rows="3"></textarea></label>
            </div>
            <div class="form-actions mt-16">
              <button type="button" class="button secondary" @click="showNewRoleModal = false">Cancel</button>
              <button type="submit" class="button">{{ newRole.id ? 'Save Profile' : 'Create Profile' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- User Modal -->
      <div v-if="showUserModal" class="modal-overlay" @click="showUserModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ userForm.id ? 'Edit User' : 'New User' }}</h2>
            <button class="modal-close" @click="showUserModal = false">&times;</button>
          </div>
          <form class="modal-form p-24" @submit.prevent="saveUser">
            <div class="form-grid single-column">
              <label>Full Name<input v-model="userForm.full_name" required></label>
              <label>Login Email<input v-model="userForm.email" type="email" required></label>
              <label>Task Notification Email (Optional)
                <input v-model="userForm.notification_email" type="email" placeholder="e.g. personal@gmail.com - tasks/alerts will be sent here">
                <small class="muted" style="font-size: 11px; margin-top: 2px;">If set, task assignment emails will be sent here instead of login email.</small>
              </label>
              <label v-if="!userForm.id">Password<input v-model="userForm.password" type="password" required minlength="6"></label>
              <label>Role
                <select v-model="userForm.role_id">
                  <option value="">No role</option>
                  <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
                </select>
              </label>
              <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px;">
                <input v-model="userForm.is_active" type="checkbox"> Active
              </label>
              <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px;">
                <input v-model="userForm.has_treasury_access" type="checkbox"> Has Treasury Access
              </label>
              <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px;">
                <input v-model="userForm.has_finance_access" type="checkbox"> Has Finance Access
              </label>
              <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px;">
                <input v-model="userForm.has_hr_access" type="checkbox"> Has HR Management Access
              </label>
              <div v-if="userForm.has_hr_access" class="permission-panel">
                <p class="muted small">HR Management Permissions</p>
                <label v-for="permission in HR_PERMISSIONS" :key="permission.key" class="checkbox-label permission-item">
                  <input v-model="userForm.hr_permissions[permission.key]" type="checkbox">
                  {{ permission.label }}
                </label>
              </div>
              <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px;">
                <input v-model="userForm.has_vault_access" type="checkbox"> Has Vault Access
              </label>
              <label v-if="userForm.has_vault_access">Vault Access Code
                <input
                  v-model="userForm.vault_access_code"
                  type="password"
                  minlength="4"
                  :required="!userForm.id"
                  autocomplete="new-password"
                  :placeholder="vaultCodePlaceholder"
                >
              </label>
            </div>
            <div class="form-actions mt-16">
              <button type="button" class="button secondary" @click="showUserModal = false">Cancel</button>
              <button type="submit" class="button">Save User</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Reset Password Modal -->
      <div v-if="showResetPasswordModal" class="modal-overlay" @click="showResetPasswordModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Reset Password</h2>
            <button class="modal-close" @click="showResetPasswordModal = false">&times;</button>
          </div>
          <form class="modal-form p-24" @submit.prevent="submitResetPassword">
            <div class="form-grid single-column">
              <p class="muted" style="margin-bottom: 12px;">Resetting password for <strong>{{ resetUserForm.email }}</strong>. They will be forced to change it upon their next login.</p>
              <label>New Temporary Password
                <input v-model="resetUserForm.password" type="password" required minlength="8" style="padding: 10px 14px; border: 1.5px solid var(--line); border-radius: 8px; font-size: 15px; background: #ffffff; color: var(--primary);">
                <span class="password-hint">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char</span>
              </label>
              <label>Confirm Temporary Password
                <input v-model="resetUserForm.confirm_password" type="password" required style="padding: 10px 14px; border: 1.5px solid var(--line); border-radius: 8px; font-size: 15px; background: #ffffff; color: var(--primary);">
              </label>
            </div>
            <div v-if="resetError" class="flash warning" style="margin-top: 16px; background: #fee2e2; border: 1px solid #ef4444; color: #991b1b; padding: 12px; border-radius: 8px; font-size: 14px;">{{ resetError }}</div>
            <div v-if="resetSuccess" class="flash success" style="margin-top: 16px; background: #ecfdf5; border: 1px solid #10b981; color: #065f46; padding: 12px; border-radius: 8px; font-size: 14px;">{{ resetSuccess }}</div>
            <div class="form-actions mt-16" style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
              <button type="button" class="button secondary" @click="showResetPasswordModal = false">Cancel</button>
              <button type="submit" class="button" :disabled="resetLoading" style="padding: 10px 20px; background: var(--primary); color: #ffffff; border-radius: 8px; border: none; font-weight: 750; cursor: pointer;">
                {{ resetLoading ? 'Saving...' : 'Reset Password' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Log Details Diff Inspector Modal -->
      <div v-if="selectedLog" class="modal-overlay" @click="selectedLog = null">
        <div class="modal-content large" @click.stop style="max-width: 900px; border-radius: 12px; background: #ffffff;">
          <div class="modal-header" style="border-bottom: 1.5px solid var(--line); display: flex; justify-content: space-between; align-items: center; padding: 20px 24px;">
            <div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: var(--primary);">
                Inspect Diff: {{ selectedLog.entity_name }} #{{ selectedLog.record_id }}
              </h2>
              <p class="muted small" style="margin: 4px 0 0 0;">
                Logged by {{ selectedLog.user_name }} on {{ formatTimestamp(selectedLog.timestamp) }}
              </p>
            </div>
            <button class="modal-close" @click="selectedLog = null" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--muted);">&times;</button>
          </div>
          
          <div class="modal-body p-24" style="max-height: 60vh; overflow-y: auto;">
            <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid var(--line);">
              <div>
                <span style="font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; display: block; margin-bottom: 2px;">Action Type</span>
                <span class="pill font-bold" :class="getActionClass(selectedLog.action_type)">{{ selectedLog.action_type }}</span>
              </div>
              <div>
                <span style="font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; display: block; margin-bottom: 2px;">Source Screen/API</span>
                <span class="font-mono small" style="word-break: break-all;">{{ selectedLog.source_screen || '-' }}</span>
              </div>
              <div>
                <span style="font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; display: block; margin-bottom: 2px;">Reference/Doc Number</span>
                <span class="font-mono small">{{ selectedLog.reference_number || '-' }}</span>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <span style="font-size: 13px; font-weight: 800; color: var(--primary); display: block; margin-bottom: 8px;">
                Fields Changed ({{ selectedLog.fields_changed ? selectedLog.fields_changed.length : 0 }})
              </span>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                <span v-for="f in selectedLog.fields_changed" :key="f" class="pill" style="background: #e2e8f0; color: #1e293b; font-family: monospace; font-size: 12px;">
                  {{ f }}
                </span>
                <span v-if="!selectedLog.fields_changed || selectedLog.fields_changed.length === 0" class="muted small">None</span>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; font-size: 13px; font-weight: 700; color: #991b1b; text-align: center;">
                  OLD VALUE(S)
                </div>
                <pre class="font-mono" style="background: #fafafa; border: 1px solid var(--line); border-radius: 8px; padding: 16px; font-size: 12px; overflow-x: auto; margin: 0; min-height: 150px; color: #dc2626; text-align: left;">{{ formatJSON(selectedLog.old_values) }}</pre>
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; font-size: 13px; font-weight: 700; color: #166534; text-align: center;">
                  NEW VALUE(S)
                </div>
                <pre class="font-mono" style="background: #fafafa; border: 1px solid var(--line); border-radius: 8px; padding: 16px; font-size: 12px; overflow-x: auto; margin: 0; min-height: 150px; color: #16a34a; text-align: left;">{{ formatJSON(selectedLog.new_values) }}</pre>
              </div>
            </div>
          </div>
          
          <div class="modal-footer p-24" style="border-top: 1px solid var(--line); display: flex; justify-content: flex-end; padding: 16px 24px;">
            <button class="button secondary" @click="selectedLog = null">Close Details</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiDelete, apiGet, apiPost, apiPut, apiUploadFile } from '../api/client'
import { HR_PERMISSIONS } from '../utils/hrStorage'

const router = useRouter()
const activeTab = ref('objects')
const objects = ref([])
const roles = ref([])
const users = ref([])
const company = reactive({
  company_name: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  tax_id: '',
  company_logo_url: ''
})
const saved = ref(false)
const isEditing = ref(false)
const uploadingCompanyLogo = ref(false)
const companyLogoError = ref('')
const companyFormState = reactive({
  company_name: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  tax_id: '',
  company_logo_url: ''
})

const paymentTerms = ref([])
const paymentModes = ref([])
const showMasterModal = ref(false)
const masterOptionType = ref('payment-terms')
const masterForm = reactive({ id: null, name: '', is_active: true })
const masterTypeLabel = computed(() => masterOptionType.value === 'payment-terms' ? 'Payment Term' : 'Payment Mode')

// Exchange Rates config
const ratesConfig = reactive({
  INR: {
    default: 95.0,
    monthly: {}
  }
})
const ratesSaved = ref(false)
const showAddMonthly = ref(false)
const newOverrideMonth = ref('')
const newOverrideRate = ref(95.0)

// Accounting Periods state
const accountingPeriods = ref([])
const loadingPeriods = ref(false)
const showPeriodModal = ref(false)
const isEditingPeriod = ref(false)
const savingPeriod = ref(false)
const periodError = ref('')
const periodForm = reactive({
  id: null,
  name: '',
  fiscal_year: '',
  start_date: '',
  end_date: '',
  status: 'Open',
  notes: ''
})

const openPeriodsCount = computed(() => accountingPeriods.value.filter(p => p.status === 'Open').length)
const lockedPeriodsCount = computed(() => accountingPeriods.value.filter(p => p.status === 'Locked' || p.status === 'Closed').length)

// New Role
const showNewRoleModal = ref(false)
const newRole = reactive({ id: null, name: '', description: '' })

// User Modal
const showUserModal = ref(false)
const userForm = reactive({ id: null, full_name: '', email: '', notification_email: '', password: '', role_id: '', is_active: true, has_treasury_access: false, has_finance_access: false, has_hr_access: false, hr_permissions: defaultHrPermissions(), has_vault_access: false, has_vault_access_code: false, vault_access_code: '' })
const vaultCodePlaceholder = computed(() => {
  if (!userForm.id) return 'Set access code'
  return userForm.has_vault_access_code ? 'Leave blank to keep existing code' : 'Set access code'
})

function defaultHrPermissions(enabled = false) {
  return HR_PERMISSIONS.reduce((permissions, permission) => {
    permissions[permission.key] = enabled
    return permissions
  }, {})
}

function normalizeHrPermissions(value, fallbackEnabled = false) {
  let parsed = value
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value) } catch { parsed = {} }
  }
  return {
    ...defaultHrPermissions(fallbackEnabled),
    ...(parsed && typeof parsed === 'object' ? parsed : {})
  }
}

function accessFlag(value) {
  return value ? 1 : 0
}

function syncStoredUserAccess(updatedUser) {
  try {
    const storedUser = JSON.parse(window.localStorage.getItem('lms_user') || 'null')
    if (!storedUser || Number(storedUser.id) !== Number(updatedUser.id)) return
    window.localStorage.setItem('lms_user', JSON.stringify({
      ...storedUser,
      has_treasury_access: updatedUser.has_treasury_access,
      has_finance_access: updatedUser.has_finance_access,
      has_hr_access: updatedUser.has_hr_access,
      hr_permissions: updatedUser.hr_permissions,
      has_vault_access: updatedUser.has_vault_access
    }))
  } catch (err) {
    console.error('Failed to sync stored user access', err)
  }
}

// Reset Password Modal
const showResetPasswordModal = ref(false)
const resetLoading = ref(false)
const resetError = ref('')
const resetSuccess = ref('')
const resetUserForm = reactive({ id: null, email: '', password: '', confirm_password: '' })

// FLS
const selectedRoleForSecurity = ref(null)
const flsConfig = ref(null)

// Activity Logs State
const activityLogs = ref([])
const logsLoading = ref(false)
const selectedLog = ref(null)
const filters = reactive({
  module_name: '',
  action_type: '',
  user_name: '',
  record_id: ''
})
const pagination = reactive({
  skip: 0,
  limit: 20,
  total: 0
})
let debounceTimer = null

watch(activeTab, (newTab) => {
  if (newTab === 'logs') {
    fetchLogs(0)
  }
})

async function fetchLogs(skip = 0) {
  logsLoading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.module_name) params.append('module_name', filters.module_name)
    if (filters.action_type) params.append('action_type', filters.action_type)
    if (filters.user_name) params.append('user_name', filters.user_name)
    if (filters.record_id !== null && filters.record_id !== undefined && filters.record_id !== '') {
      params.append('record_id', filters.record_id.toString())
    }
    params.append('skip', skip.toString())
    params.append('limit', pagination.limit.toString())

    const res = await apiGet(`/api/setup/activity-logs?${params.toString()}`)
    activityLogs.value = res.logs || []
    pagination.total = res.total || 0
    pagination.skip = res.skip || 0
  } catch (err) {
    console.error('Failed to load activity logs', err)
  } finally {
    logsLoading.value = false
  }
}

function debounceFetchLogs() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchLogs(0)
  }, 300)
}

function resetFilters() {
  Object.assign(filters, { module_name: '', action_type: '', user_name: '', record_id: '' })
  fetchLogs(0)
}

function changePage(direction) {
  const newSkip = pagination.skip + direction * pagination.limit
  if (newSkip >= 0 && newSkip < pagination.total) {
    fetchLogs(newSkip)
  }
}

function formatTimestamp(isoString) {
  if (!isoString) return '-'
  const dateObj = new Date(isoString)
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function getActionClass(action) {
  if (action === 'CREATE') return 'status-success'
  if (action === 'UPDATE') return 'status-warning'
  if (action === 'DELETE') return 'status-danger'
  return 'status-muted'
}

function viewLogDetails(log) {
  selectedLog.value = log
}

function formatJSON(val) {
  if (!val) return '{}'
  try {
    return JSON.stringify(val, null, 2)
  } catch (e) {
    return String(val)
  }
}

async function loadAccountingPeriods() {
  loadingPeriods.value = true
  try {
    const data = await apiGet('/api/settings/accounting-periods')
    accountingPeriods.value = data.periods || []
  } catch (err) {
    console.error('Failed to load accounting periods:', err)
  } finally {
    loadingPeriods.value = false
  }
}

function openNewPeriodModal() {
  isEditingPeriod.value = false
  periodError.value = ''
  periodForm.id = null
  periodForm.name = 'FY 2026'
  periodForm.fiscal_year = '2026'
  periodForm.start_date = '2026-01-01'
  periodForm.end_date = '2026-12-31'
  periodForm.status = 'Open'
  periodForm.notes = ''
  showPeriodModal.value = true
}

function openEditPeriodModal(period) {
  isEditingPeriod.value = true
  periodError.value = ''
  periodForm.id = period.id
  periodForm.name = period.name
  periodForm.fiscal_year = period.fiscal_year
  periodForm.start_date = period.start_date
  periodForm.end_date = period.end_date
  periodForm.status = period.status
  periodForm.notes = period.notes || ''
  showPeriodModal.value = true
}

function applyPeriodPreset(preset) {
  if (preset === '2026') {
    periodForm.name = 'FY 2026'
    periodForm.fiscal_year = '2026'
    periodForm.start_date = '2026-01-01'
    periodForm.end_date = '2026-12-31'
  } else if (preset === '2025') {
    periodForm.name = 'FY 2025'
    periodForm.fiscal_year = '2025'
    periodForm.start_date = '2025-01-01'
    periodForm.end_date = '2025-12-31'
  } else if (preset === 'fy26') {
    periodForm.name = 'FY 2026-27'
    periodForm.fiscal_year = '2026-2027'
    periodForm.start_date = '2026-04-01'
    periodForm.end_date = '2027-03-31'
  }
}

async function savePeriod() {
  periodError.value = ''
  if (!periodForm.name || !periodForm.start_date || !periodForm.end_date) {
    periodError.value = 'Name, start date, and end date are required.'
    return
  }
  if (periodForm.start_date > periodForm.end_date) {
    periodError.value = 'Start date cannot be after end date.'
    return
  }
  savingPeriod.value = true
  try {
    if (isEditingPeriod.value) {
      await apiPut(`/api/settings/accounting-periods/${periodForm.id}`, periodForm)
    } else {
      await apiPost('/api/settings/accounting-periods', periodForm)
    }
    showPeriodModal.value = false
    await loadAccountingPeriods()
  } catch (err) {
    periodError.value = err.message || 'Failed to save accounting period.'
  } finally {
    savingPeriod.value = false
  }
}

async function togglePeriodLock(period) {
  const isClosing = period.status === 'Open'
  const actionText = isClosing ? 'lock & close' : 'reopen'
  const confirmMsg = isClosing 
    ? `Are you sure you want to lock the '${period.name}' period (${period.start_date} to ${period.end_date})?\n\nOnce locked, NO transactions or journals can be posted, modified, or reversed in this date range.`
    : `Are you sure you want to reopen '${period.name}'?\n\nLedger postings will once again be permitted for this date range.`
  
  if (!confirm(confirmMsg)) return

  try {
    await apiPost(`/api/settings/accounting-periods/${period.id}/toggle-lock`)
    await loadAccountingPeriods()
  } catch (err) {
    alert(err.message || `Failed to ${actionText} accounting period.`)
  }
}

async function deletePeriod(period) {
  if (!confirm(`Are you sure you want to delete period '${period.name}'?`)) return
  try {
    await apiDelete(`/api/settings/accounting-periods/${period.id}`)
    await loadAccountingPeriods()
  } catch (err) {
    alert(err.message || 'Failed to delete accounting period.')
  }
}

function formatDateStr(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

onMounted(async () => {
  loadData()
})

watch(activeTab, (tab) => {
  if (tab === 'periods') {
    loadAccountingPeriods()
  }
})

async function loadData() {
  // Load Objects
  const objData = await apiGet('/api/setup/objects')
  objects.value = objData.objects

  // Load Roles
  const rolesData = await apiGet('/api/setup/roles')
  roles.value = rolesData.roles

  // Load Users
  const usersData = await apiGet('/api/setup/users')
  users.value = usersData.users

  // Load Company Info
  const companyData = await apiGet('/api/settings/company')
  if (companyData && companyData.company_name) {
    Object.assign(company, companyData)
    isEditing.value = false
  } else {
    isEditing.value = true
  }

  // Load Exchange Rates
  try {
    const ratesData = await apiGet('/api/settings/exchange-rates')
    if (ratesData && ratesData.INR) {
      ratesConfig.INR.default = ratesData.INR.default || 95.0
      ratesConfig.INR.monthly = ratesData.INR.monthly || {}
    }
  } catch (err) {
    console.error("Failed to load exchange rates", err)
  }

  await loadAccountingPeriods()
  await loadMasterOptions()
}

async function loadMasterOptions() {
  const terms = await apiGet('/api/settings/master-options/payment-terms')
  paymentTerms.value = terms.payment_terms || []
  const modes = await apiGet('/api/settings/master-options/payment-modes')
  paymentModes.value = modes.payment_modes || []
}

function openMasterModal(type, option = null) {
  masterOptionType.value = type
  Object.assign(masterForm, {
    id: option?.id || null,
    name: option?.name || '',
    is_active: option ? !!option.is_active : true,
  })
  showMasterModal.value = true
}

async function saveMasterOption() {
  const payload = { name: masterForm.name, is_active: masterForm.is_active }
  if (masterForm.id) {
    await apiPut(`/api/settings/master-options/${masterOptionType.value}/${masterForm.id}`, payload)
  } else {
    await apiPost(`/api/settings/master-options/${masterOptionType.value}`, payload)
  }
  showMasterModal.value = false
  await loadMasterOptions()
}

function startEdit() {
  Object.assign(companyFormState, company)
  companyLogoError.value = ''
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  companyLogoError.value = ''
}

async function saveCompany() {
  await apiPost('/api/settings/company', companyFormState)
  Object.assign(company, companyFormState)
  saved.value = true
  isEditing.value = false
  setTimeout(() => { saved.value = false }, 3000)
}

async function handleCompanyLogoUpload(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  companyLogoError.value = ''
  uploadingCompanyLogo.value = true
  try {
    const data = await apiUploadFile('/api/uploads/cloudinary', file, { folder: 'company' })
    const logoUrl = data.document?.secure_url || data.document?.url || ''
    if (!logoUrl) throw new Error('Upload finished but no logo URL was returned.')
    companyFormState.company_logo_url = logoUrl
  } catch (err) {
    companyLogoError.value = err.message || 'Unable to upload company logo.'
  } finally {
    uploadingCompanyLogo.value = false
  }
}

async function saveRole() {
  if (newRole.id) {
    await apiPut(`/api/setup/roles/${newRole.id}`, newRole)
  } else {
    await apiPost('/api/setup/roles', newRole)
  }
  showNewRoleModal.value = false
  Object.assign(newRole, { id: null, name: '', description: '' })
  loadData()
}

function editRole(role) {
  Object.assign(newRole, role)
  showNewRoleModal.value = true
}

async function deleteRole(role) {
  if (confirm(`Are you sure you want to delete the profile "${role.name}"?`)) {
    try {
      await apiDelete(`/api/setup/roles/${role.id}`)
      loadData()
    } catch (e) {
      swal(e.message)
    }
  }
}

function openNewUserModal() {
  Object.assign(userForm, { id: null, full_name: '', email: '', notification_email: '', password: '', role_id: '', is_active: true, has_treasury_access: false, has_finance_access: false, has_hr_access: false, hr_permissions: defaultHrPermissions(), has_vault_access: false, has_vault_access_code: false, vault_access_code: '' })
  showUserModal.value = true
}

function openEditUserModal(user) {
  Object.assign(userForm, {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    notification_email: user.notification_email || '',
    password: '',
    role_id: user.role_id || '',
    is_active: !!user.is_active,
    has_treasury_access: !!user.has_treasury_access,
    has_finance_access: !!user.has_finance_access,
    has_hr_access: !!user.has_hr_access || !!normalizeHrPermissions(user.hr_permissions).view_hr_module,
    hr_permissions: normalizeHrPermissions(user.hr_permissions, !!user.has_hr_access),
    has_vault_access: !!user.has_vault_access,
    has_vault_access_code: !!user.has_vault_access_code,
    vault_access_code: ''
  })
  showUserModal.value = true
}

async function saveUser() {
  const hrPermissions = userForm.has_hr_access
    ? normalizeHrPermissions(userForm.hr_permissions, true)
    : defaultHrPermissions(false)
  if (userForm.has_hr_access) hrPermissions.view_hr_module = true
  const payload = {
    id: userForm.id,
    full_name: userForm.full_name,
    email: userForm.email,
    notification_email: (userForm.notification_email || '').trim(),
    password: userForm.password,
    role_id: userForm.role_id,
    is_active: accessFlag(userForm.is_active),
    has_treasury_access: accessFlag(userForm.has_treasury_access),
    has_finance_access: accessFlag(userForm.has_finance_access),
    has_hr_access: accessFlag(userForm.has_hr_access),
    hr_permissions: hrPermissions,
    has_vault_access: accessFlag(userForm.has_vault_access),
    has_vault_access_code: userForm.has_vault_access_code,
    vault_access_code: userForm.vault_access_code
  }
  if (!userForm.id) {
    await apiPost('/api/setup/users', payload)
  } else {
    delete payload.password
    await apiPut(`/api/setup/users/${userForm.id}`, payload)
  }
  syncStoredUserAccess(payload)
  showUserModal.value = false
  loadData()
}

function openResetPasswordModal(user) {
  resetError.value = ''
  resetSuccess.value = ''
  Object.assign(resetUserForm, { id: user.id, email: user.email, password: '', confirm_password: '' })
  showResetPasswordModal.value = true
}

function validateResetLocal() {
  if (resetUserForm.password !== resetUserForm.confirm_password) {
    return "Passwords do not match."
  }
  if (resetUserForm.password.length < 8) {
    return "Password must be at least 8 characters long."
  }
  if (!/[A-Z]/.test(resetUserForm.password)) {
    return "Password must contain at least one uppercase letter."
  }
  if (!/[a-z]/.test(resetUserForm.password)) {
    return "Password must contain at least one lowercase letter."
  }
  if (!/\d/.test(resetUserForm.password)) {
    return "Password must contain at least one number."
  }
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(resetUserForm.password)) {
    return "Password must contain at least one special character."
  }
  return null
}

async function submitResetPassword() {
  resetError.value = ''
  resetSuccess.value = ''
  
  const localError = validateResetLocal()
  if (localError) {
    resetError.value = localError
    return
  }
  
  resetLoading.value = true
  try {
    await apiPost(`/api/setup/users/${resetUserForm.id}/reset-password`, {
      password: resetUserForm.password
    })
    resetSuccess.value = 'Password reset successfully! User will be forced to change it on next login.'
    setTimeout(() => {
      showResetPasswordModal.value = false
    }, 2000)
  } catch (err) {
    resetError.value = err.message
  } finally {
    resetLoading.value = false
  }
}

function manageSecurity(role) {
  selectedRoleForSecurity.value = role
}

async function configureFLS(roleId, obj) {
  const data = await apiGet(`/api/setup/roles/${roleId}/security/${obj.id}`)
  flsConfig.value = {
    roleId,
    roleName: selectedRoleForSecurity.value.name,
    object: obj,
    fields: data.fields.map(f => ({ ...f, can_view: !!f.can_view, can_edit: !!f.can_edit }))
  }
}

async function saveFLS() {
  await apiPost(`/api/setup/roles/${flsConfig.value.roleId}/security/${flsConfig.value.object.id}`, {
    fields: flsConfig.value.fields.map(f => ({
      id: f.id,
      can_view: f.can_view,
      can_edit: f.can_edit
    }))
  })
  flsConfig.value = null
  selectedRoleForSecurity.value = null
}

function editObject(apiName) {
  router.push(`/setup/objects/${apiName}`)
}

function addMonthlyRow() {
  newOverrideMonth.value = new Date().toISOString().substring(0, 7) // default YYYY-MM
  newOverrideRate.value = ratesConfig.INR.default
  showAddMonthly.value = true
}

function saveNewMonthlyOverride() {
  if (!newOverrideMonth.value) return
  ratesConfig.INR.monthly[newOverrideMonth.value] = newOverrideRate.value || ratesConfig.INR.default
  showAddMonthly.value = false
}

function deleteMonthlyRow(month) {
  delete ratesConfig.INR.monthly[month]
}

async function saveRates() {
  await apiPost('/api/settings/exchange-rates', ratesConfig)
  ratesSaved.value = true
  setTimeout(() => { ratesSaved.value = false }, 3000)
}
</script>

<style scoped>
.setup-page {
  max-width: 1200px;
  margin: 0 auto;
}

.setup-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 2px;
}

.setup-tabs button {
  background: none;
  border: none;
  padding: 12px 24px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  position: relative;
}

.setup-tabs button.active {
  color: var(--primary);
}

.setup-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--primary);
}

.setup-form {
  margin-top: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
  background: #f8fafc;
}

.panel-header h2 { margin: 0; font-size: 18px; }

.table-container {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}

.description {
  font-size: 13px;
  margin-top: 8px;
}

.save-status {
  color: #166534;
  font-weight: 700;
  margin-right: 16px;
}

.empty-state {
  text-align: center;
  padding: 48px;
  background: var(--surface-soft);
  border-radius: 12px;
  color: var(--muted);
}

.p-24 { padding: 24px; }
.mb-16 { margin-bottom: 16px; }
.mt-16 { margin-top: 16px; }
.center { text-align: center; }

.modal-content.large {
  max-width: 900px;
}

.compact td, .compact th {
  padding: 10px 16px;
}

.password-hint {
  display: block;
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
  line-height: 1.4;
  font-weight: 500;
}

.status-warning {
  background-color: #fef3c7 !important;
  color: #b45309 !important;
}

.status-danger {
  background-color: #fee2e2 !important;
  color: #b91c1c !important;
}

.font-mono {
  font-family: monospace;
}

.font-bold {
  font-weight: 700;
}

.bank-accounts-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.bank-accounts-setup .data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.bank-accounts-setup .data-table th,
.bank-accounts-setup .data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}

.master-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.master-card {
  min-height: 260px;
}

.actions-cell {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.danger-text {
  color: #b91c1c !important;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.checkbox-row input[type="checkbox"] {
  width: auto;
}

.bank-modal {
  border: 1px solid var(--line);
  border-radius: 8px;
  max-width: 720px;
  overflow: hidden;
  padding: 0;
  width: min(720px, calc(100vw - 32px));
}

.bank-modal-header {
  align-items: center;
  background: #f8fafc;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
}

.bank-modal-header h2 {
  color: var(--heading);
  font-size: 20px;
  margin: 4px 0 0;
}

.bank-modal-form {
  margin: 0;
  padding: 24px;
}

.bank-form-grid {
  display: grid;
  gap: 18px 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.bank-form-grid label {
  color: var(--muted-strong);
  display: grid;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
}

.bank-form-grid input {
  min-height: 42px;
}

.bank-default-row {
  align-items: center;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text) !important;
  display: flex !important;
  gap: 10px !important;
  min-height: 46px;
  padding: 12px 14px;
}

.bank-default-row input {
  flex: 0 0 auto;
  height: 18px;
  min-height: 18px;
  width: 18px !important;
}

.bank-default-row span {
  font-size: 14px;
  font-weight: 750;
}

.bank-modal-actions {
  border-top: 1px solid var(--line);
  justify-content: flex-end;
  margin: 24px -24px -24px;
  padding: 16px 24px;
}

.permission-panel {
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: 8px;
  display: grid;
  gap: 10px;
  padding: 14px;
}

.permission-panel p {
  margin: 0;
}

.permission-item {
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
}

.company-logo-row {
  border-bottom: 1px solid var(--line);
  padding-bottom: 16px;
}

.company-logo-uploader {
  align-items: stretch;
  display: grid;
  gap: 14px;
  grid-template-columns: 180px minmax(0, 1fr);
}

.company-logo-preview {
  align-items: center;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: var(--muted);
  display: flex;
  font-size: 13px;
  font-weight: 800;
  justify-content: center;
  min-height: 88px;
  padding: 12px;
}

.company-logo-preview img {
  max-height: 70px;
  max-width: 150px;
  object-fit: contain;
}

.company-logo-controls {
  display: grid;
  gap: 10px;
}

.field-hint {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.text-danger {
  color: #dc2626;
}

@media (max-width: 640px) {
  .bank-form-grid {
    grid-template-columns: 1fr;
  }

  .bank-form-grid .span-2 {
    grid-column: span 1;
  }

  .bank-modal-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  .company-logo-uploader {
    grid-template-columns: 1fr;
  }
}

/* ── Accounting Periods Setup ── */
.periods-card {
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #ffffff;
  padding: 24px;
}

.periods-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--line);
  padding-bottom: 18px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.period-badge-sub {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 999px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.periods-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 800px) {
  .periods-summary-grid {
    grid-template-columns: 1fr;
  }
}

.p-summary-box {
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.p-summary-box.open {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.p-summary-box.locked {
  background: #fef2f2;
  border-color: #fecaca;
}

.p-summary-label {
  font-size: 11.5px;
  font-weight: 750;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.p-summary-val {
  font-size: 26px;
  font-weight: 850;
  color: #0f172a;
}

.p-summary-sub {
  font-size: 12px;
  color: #64748b;
}

.periods-table {
  width: 100%;
  border-collapse: collapse;
}

.periods-table th {
  background: #f8fafc;
  padding: 14px 16px;
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
}

.periods-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
}

.row-locked {
  background: #fffafa;
}

.fiscal-year-tag {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
  color: #334155;
  font-family: 'JetBrains Mono', monospace;
}

.date-range-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: #1e293b;
}

.arrow-sep {
  color: var(--muted);
}

.period-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
  letter-spacing: 0.4px;
}

.period-status-pill.status-open {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.period-status-pill.status-locked {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.lock-audit-meta .locked-text {
  font-size: 12px;
  font-weight: 750;
  color: #dc2626;
  display: block;
}

.lock-btn {
  background: #dc2626 !important;
  color: #ffffff !important;
  border-color: #b91c1c !important;
}

.lock-btn:hover {
  background: #b91c1c !important;
}

.unlock-btn {
  background: #f0fdf4 !important;
  color: #15803d !important;
  border-color: #86efac !important;
}

.unlock-btn:hover {
  background: #dcfce7 !important;
}

.period-modal-shell {
  max-width: 620px;
  width: min(620px, calc(100vw - 32px));
  padding: 24px;
}

.quick-presets-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 14px;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 12px;
  font-weight: 750;
  color: var(--muted);
  text-transform: uppercase;
}

.preset-btn {
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.15s;
}

.preset-btn:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}
</style>
