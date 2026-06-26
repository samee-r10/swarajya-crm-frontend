<template>
  <div class="treasury-container p-24">
    <!-- Header -->
    <div class="header-section treasury-hero mb-24">
      <div class="header-titles">
        <span class="module-pill">Finance Center</span>
        <h1>Treasury & Payouts</h1>
        <p class="subtitle text-muted">Settle ledger transactions into reserve, owner, and partner splits — entries sync from the transaction ledger.</p>
      </div>
      <div class="hero-summary">
        <span>Reserve balance</span>
        <strong>₹{{ formatCurrency(dashboardData.reserve_available) }}</strong>
      </div>
      <div class="hero-actions">
        <RouterLink class="button secondary" to="/treasury/products">Products</RouterLink>
        <RouterLink class="button secondary" to="/treasury/bank-accounts">Bank Accounts</RouterLink>
        <RouterLink class="button secondary" to="/treasury/fund-transfers">Fund Transfer</RouterLink>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="treasury-tabs-wrapper mb-24">
      <div class="treasury-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon" v-html="tab.icon"></span>
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Dashboard Tab -->
    <div v-if="activeTab === 'dashboard'" class="dashboard-tab">
      <!-- KPI Grid -->
      <div class="kpi-grid mb-24">
        <div class="kpi-card reserve-card">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M12 2v9M8 5h8"/>
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Company Reserve Fund</span>
            <h3>₹{{ formatCurrency(dashboardData.reserve_available) }}</h3>
            <p class="kpi-sub">Available balance (settled reserve only)</p>
          </div>
        </div>

        <div class="kpi-card revenue-card">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total Shared Revenue</span>
            <h3>₹{{ formatCurrency(dashboardData.shared_revenue) }}</h3>
            <p class="kpi-sub">Stakeholder &amp; channel partner payouts from settled revenue</p>
          </div>
        </div>

        <div class="kpi-card stakeholder-card">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Owner Earnings Paid</span>
            <h3>₹{{ formatCurrency(dashboardData.stakeholder_paid) }}</h3>
            <p class="kpi-sub text-warning">₹{{ formatCurrency(dashboardData.stakeholder_pending) }} pending · see Payment Dashboard for contributions</p>
          </div>
        </div>

        <div class="kpi-card partner-card">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Partner Commissions</span>
            <h3>₹{{ formatCurrency(dashboardData.partner_paid) }}</h3>
            <p class="kpi-sub text-warning">₹{{ formatCurrency(dashboardData.partner_pending) }} Pending</p>
          </div>
        </div>
      </div>

      <!-- Quick Summary Tables -->
      <div class="grid-2col">
        <!-- Company owner equity split -->
        <div class="dashboard-block">
          <div class="block-header">
            <div>
              <h4 class="m-0">Company Owners — Equity Split</h4>
              <small class="text-muted">Active stakeholders and their ownership share of the company</small>
            </div>
            <button class="link-btn" @click="activeTab = 'stakeholders'">Manage</button>
          </div>
          <div class="block-body">
            <div v-if="activeStakeholders.length === 0" class="empty-state-small">
              <p>No company owners configured yet.</p>
            </div>
            <div v-else class="ratio-list">
              <div class="ownership-summary">
                <span class="ownership-count">
                  {{ activeStakeholders.length }} owner{{ activeStakeholders.length === 1 ? '' : 's' }}
                </span>
                <span class="ownership-split text-muted">{{ equitySplitSummary }}</span>
              </div>
              <div v-for="stk in activeStakeholders" :key="stk.id" class="ratio-item">
                <div class="ratio-info">
                  <strong>{{ stk.name }}</strong>
                  <span class="percentage-badge">{{ stk.payout_percentage }}% equity</span>
                </div>
                <div class="ratio-bar-bg">
                  <div class="ratio-bar-fill" :style="{ width: stk.payout_percentage + '%' }"></div>
                </div>
              </div>
              <div class="total-bar">
                <span>Total company equity:</span>
                <strong :class="activeStakeholderSum === 100 ? 'text-success' : 'text-danger'">
                  {{ activeStakeholderSum }}%
                  <small v-if="activeStakeholderSum !== 100"> (must equal 100%)</small>
                </strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity Ledger -->
        <div class="dashboard-block">
          <div class="block-header">
            <h4>Recent Split Allocations</h4>
            <button class="link-btn" @click="activeTab = 'ledger'">View All</button>
          </div>
          <div class="block-body">
            <div v-if="dashboardData.recent_payouts.length === 0" class="empty-state-small">
              <p>No recent payouts recorded.</p>
            </div>
            <table v-else class="simple-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in dashboardData.recent_payouts" :key="p.id">
                  <td>
                    <span v-if="p.payout_type === 'Reserve Fund'">Company Reserve</span>
                    <span v-else-if="['Channel Partner', 'Channel Partner Payout'].includes(p.payout_type)">{{ p.partner_name || 'Channel Partner' }}</span>
                    <span v-else-if="p.payout_type === 'Stakeholder Contribution'">{{ p.stakeholder_name || 'Owner' }} (paid in)</span>
                    <span v-else>{{ p.stakeholder_name || 'Owner' }}</span>
                  </td>
                  <td><span class="type-pill text-xs">{{ p.payout_type }}</span></td>
                  <td><strong>₹{{ formatCurrency(p.amount) }}</strong></td>
                  <td>
                    <span class="status-pill text-xs" :class="p.status.toLowerCase()">{{ p.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <!-- Payment Dashboard Tab -->
    <div v-if="activeTab === 'payment_dashboard'" class="payment-dashboard-tab">

      <!-- Top Balance Cards -->
      <div class="pay-kpi-grid mb-28">
        <!-- Company Reserve Balance -->
        <div class="pay-kpi-card pay-fund-card">
          <div class="pay-kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
              <circle cx="12" cy="16" r="2" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div class="pay-kpi-content">
            <span class="pay-kpi-label">Available Fund Balance</span>
            <h2 class="pay-kpi-value text-success">₹{{ formatCurrency(dashboardData.reserve_available) }}</h2>
            <div class="pay-kpi-sub-row">
              <span class="pay-kpi-chip green">Accumulated ₹{{ formatCurrency(dashboardData.reserve_accumulated) }}</span>
              <span class="pay-kpi-chip red">Spent ₹{{ formatCurrency(dashboardData.reserve_spent) }}</span>
            </div>
          </div>
        </div>

        <!-- Stakeholder Payouts Summary -->
        <div class="pay-kpi-card pay-stakeholder-card">
          <div class="pay-kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="pay-kpi-content">
            <span class="pay-kpi-label">Stakeholder Payouts</span>
            <h2 class="pay-kpi-value">₹{{ formatCurrency(dashboardData.stakeholder_paid) }}</h2>
            <div class="pay-kpi-sub-row">
              <span class="pay-kpi-chip green">Paid</span>
              <span class="pay-kpi-chip orange" v-if="dashboardData.stakeholder_pending > 0">₹{{ formatCurrency(dashboardData.stakeholder_pending) }} Pending</span>
              <span class="pay-kpi-chip green" v-else>All Settled</span>
            </div>
          </div>
        </div>

        <!-- Partner Commissions Summary -->
        <div class="pay-kpi-card pay-partner-card">
          <div class="pay-kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="pay-kpi-content">
            <span class="pay-kpi-label">Channel Partner Commissions</span>
            <h2 class="pay-kpi-value">₹{{ formatCurrency(dashboardData.partner_paid) }}</h2>
            <div class="pay-kpi-sub-row">
              <span class="pay-kpi-chip green">Paid</span>
              <span class="pay-kpi-chip orange" v-if="dashboardData.partner_pending > 0">₹{{ formatCurrency(dashboardData.partner_pending) }} Pending</span>
              <span class="pay-kpi-chip green" v-else>All Settled</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stakeholder Settlement Hub -->
      <div class="pay-section card p-0 mb-24">
        <div class="card-header p-20 border-bottom d-flex justify-between align-center">
          <div>
            <h4 class="m-0">Owner Settlement Hub</h4>
            <small class="text-muted">Track what owners paid into the company vs earnings still owed</small>
          </div>
        </div>
        <div class="table-responsive">
          <table class="grid-table">
            <thead>
              <tr>
                <th>Owner Name</th>
                <th>Equity %</th>
                <th>Status</th>
                <th>Paid to Company</th>
                <th>Earned from Company</th>
                <th>Pending Earnings</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paymentStats.stakeholders.length === 0">
                <td colspan="7" class="text-center py-24 text-muted">No company owners configured yet.</td>
              </tr>
              <tr v-for="stk in paginatedPaymentStakeholders" :key="stk.id">
                <td>
                  <div class="d-flex align-center gap-8">
                    <div class="avatar-small">{{ stk.name.charAt(0).toUpperCase() }}</div>
                    <button class="name-link" type="button" @click="openStakeholderHistory(stk)">{{ stk.name }}</button>
                  </div>
                </td>
                <td>
                  <span class="percentage-badge">{{ stk.payout_percentage }}%</span>
                </td>
                <td>
                  <span class="status-pill" :class="stk.is_active ? 'active' : 'inactive'">
                    {{ stk.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-semibold text-primary">₹{{ formatCurrency(stk.contributed_amount || 0) }}</td>
                <td class="text-semibold text-success">₹{{ formatCurrency(stk.earned_from_company || stk.paid_amount || 0) }}</td>
                <td>
                  <span v-if="parseFloat(stk.pending_amount) > 0" class="text-semibold text-warning">
                    ₹{{ formatCurrency(stk.pending_amount) }}
                  </span>
                  <span v-else class="text-muted text-xs">—</span>
                </td>
                <td>
                  <button
                    v-if="parseFloat(stk.pending_amount) > 0"
                    class="button primary text-xs"
                    @click="settleStakeholder(stk)"
                  >
                    ✓ Pay earnings ₹{{ formatCurrency(stk.pending_amount) }}
                  </button>
                  <span v-else class="text-muted text-xs">No pending earnings</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="paymentStakeholderTotalPages > 1" class="pagination-bar">
          <button
            class="pagination-btn"
            type="button"
            :disabled="paymentStakeholderPage === 1"
            @click="paymentStakeholderPage--"
          >
            Previous
          </button>
          <span class="pagination-info">Page {{ paymentStakeholderPage }} of {{ paymentStakeholderTotalPages }} ({{ paymentStats.stakeholders.length }} records)</span>
          <button
            class="pagination-btn"
            type="button"
            :disabled="paymentStakeholderPage === paymentStakeholderTotalPages"
            @click="paymentStakeholderPage++"
          >
            Next
          </button>
        </div>
      </div>

      <!-- Channel Partner Settlement Hub -->
      <div class="pay-section card p-0 mb-24">
        <div class="card-header p-20 border-bottom d-flex justify-between align-center">
          <div>
            <h4 class="m-0">Channel Partner Settlement Hub</h4>
            <small class="text-muted">Settle pending commissions per partner</small>
          </div>
        </div>
        <div class="table-responsive">
          <table class="grid-table">
            <thead>
              <tr>
                <th>Partner Name</th>
                <th>Commission Structure</th>
                <th>Status</th>
                <th>Total Paid</th>
                <th>Pending Commission</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paymentStats.partners.length === 0">
                <td colspan="6" class="text-center py-24 text-muted">No channel partners configured yet.</td>
              </tr>
              <tr v-for="cp in paginatedPaymentPartners" :key="cp.id">
              <td><button class="name-link" type="button" @click="openPartnerHistory(cp)">{{ cp.name }}</button></td>
                <td>
                  <span v-if="cp.commission_type === 'Percentage'">{{ cp.commission_value }}% of Revenue</span>
                  <span v-else>₹{{ formatCurrency(cp.commission_value) }} Flat Rate</span>
                </td>
                <td>
                  <span class="status-pill" :class="cp.is_active ? 'active' : 'inactive'">
                    {{ cp.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-semibold text-success">₹{{ formatCurrency(cp.paid_amount) }}</td>
                <td>
                  <span v-if="parseFloat(cp.pending_amount) > 0" class="text-semibold text-warning">
                    ₹{{ formatCurrency(cp.pending_amount) }}
                  </span>
                  <span v-else class="text-muted text-xs">—</span>
                </td>
                <td>
                  <button
                    v-if="parseFloat(cp.pending_amount) > 0"
                    class="button primary text-xs"
                    @click="settlePartner(cp)"
                  >
                    ✓ Settle ₹{{ formatCurrency(cp.pending_amount) }}
                  </button>
                  <span v-else class="text-muted text-xs">All settled</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="paymentPartnerTotalPages > 1" class="pagination-bar">
          <button
            class="pagination-btn"
            type="button"
            :disabled="paymentPartnerPage === 1"
            @click="paymentPartnerPage--"
          >
            Previous
          </button>
          <span class="pagination-info">Page {{ paymentPartnerPage }} of {{ paymentPartnerTotalPages }} ({{ paymentStats.partners.length }} records)</span>
          <button
            class="pagination-btn"
            type="button"
            :disabled="paymentPartnerPage === paymentPartnerTotalPages"
            @click="paymentPartnerPage++"
          >
            Next
          </button>
        </div>
      </div>

      <!-- Reserve Fund Ledger -->
      <div class="pay-section card p-0">
        <div class="card-header p-20 border-bottom">
          <h4 class="m-0">Reserve Fund Ledger</h4>
          <small class="text-muted">Reserve allocations from settled revenue and ledger expenses</small>
        </div>
        <div class="table-responsive">
          <table class="grid-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Revenue Ref</th>
                <th>Amount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paymentStats.reserve_ledger.length === 0">
                <td colspan="5" class="text-center py-24 text-muted">No reserve fund transactions yet.</td>
              </tr>
              <tr v-for="entry in paginatedPaymentReserveLedger" :key="entry.id">
                <td>{{ formatDate(entry.payout_date) }}</td>
                <td>
                  <span
                    class="badge"
                    :style="entry.payout_type === 'Reserve Fund'
                      ? 'background:#d1fae5;color:#065f46;padding:3px 8px;border-radius:4px;font-size:12px;'
                      : 'background:#fee2e2;color:#991b1b;padding:3px 8px;border-radius:4px;font-size:12px;'"
                  >
                    {{ entry.payout_type === 'Reserve Fund' ? '↑ Deposit' : '↓ Expense' }}
                  </span>
                </td>
                <td>
                  <span v-if="entry.associated_revenue_id" class="badge" style="font-family:monospace;background:#e0f2fe;color:#0284c7;padding:3px 8px;border-radius:4px;font-size:12px;">
                    {{ entry.associated_revenue_id }}
                  </span>
                  <span v-else class="text-muted text-xs">Manual Entry</span>
                </td>
                <td>
                  <strong :class="entry.payout_type === 'Reserve Fund' ? 'text-success' : 'text-danger'">
                    {{ entry.payout_type === 'Reserve Fund' ? '+' : '-' }}₹{{ formatCurrency(entry.amount) }}
                  </strong>
                </td>
                <td class="text-muted text-xs" style="max-width:200px;">{{ entry.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="paymentReserveTotalPages > 1" class="pagination-bar">
          <button
            class="pagination-btn"
            type="button"
            :disabled="paymentReservePage === 1"
            @click="paymentReservePage--"
          >
            Previous
          </button>
          <span class="pagination-info">Page {{ paymentReservePage }} of {{ paymentReserveTotalPages }} ({{ paymentStats.reserve_ledger.length }} records)</span>
          <button
            class="pagination-btn"
            type="button"
            :disabled="paymentReservePage === paymentReserveTotalPages"
            @click="paymentReservePage++"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Revenue List Tab -->
    <div v-if="activeTab === 'revenue'" class="revenue-tab card p-0">
      <div class="card-header p-24 border-bottom">
        <h3 class="m-0">Shared Revenue Log</h3>
        <small class="text-muted">Ledger transactions awaiting or completed settlement</small>
      </div>
      <div class="revenue-log-summary p-24 border-bottom">
        <div class="revenue-summary-grid">
          <div class="revenue-summary-card settled">
            <span class="revenue-summary-label">Transactions Settled</span>
            <strong class="revenue-summary-value">{{ revenueSettlementStats.settledCount }}</strong>
            <small class="text-muted">of {{ revenueSettlementStats.totalCount }} total</small>
          </div>
          <div class="revenue-summary-card pending">
            <span class="revenue-summary-label">Pending Settlement</span>
            <strong class="revenue-summary-value">{{ revenueSettlementStats.pendingCount }}</strong>
            <small class="text-muted">awaiting split confirmation</small>
          </div>
          <div class="revenue-summary-card amount-settled">
            <span class="revenue-summary-label">Settled Amount</span>
            <strong class="revenue-summary-value text-success">₹{{ formatCurrency(revenueSettlementStats.settledAmount) }}</strong>
            <small class="text-muted">transaction value settled</small>
          </div>
          <div class="revenue-summary-card amount-pending">
            <span class="revenue-summary-label">Pending Settlement Amount</span>
            <strong class="revenue-summary-value text-warning">₹{{ formatCurrency(revenueSettlementStats.pendingAmount) }}</strong>
            <small class="text-muted">still to be allocated</small>
          </div>
        </div>
      </div>
      <div class="revenue-filter-bar p-20 border-bottom">
        <div class="revenue-search-wrap">
          <svg class="revenue-search-icon" viewBox="0 0 24 24" width="18" height="18">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
          </svg>
          <input
            v-model="revenueSearch"
            type="search"
            placeholder="Search revenue ID, transaction ID, project, type, description, status..."
          >
        </div>
        <span class="text-muted text-sm">
          Showing {{ filteredRevenueEntries.length }} of {{ revenueEntries.length }} records
        </span>
      </div>
      <div class="table-responsive">
        <table class="grid-table">
          <thead>
            <tr>
              <th>Revenue ID</th>
              <th>Entry Date</th>
              <th>Source / Project</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Reserve Split</th>
              <th>Partner Split</th>
              <th>Owner Share</th>
              <th>Tx ID</th>
              <th>Description</th>
              <th>Settlement</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRevenueEntries.length === 0">
              <td colspan="12" class="text-center py-24 text-muted">{{ revenueEntries.length === 0 ? 'No revenue splits recorded yet.' : 'No revenue entries match your search.' }}</td>
            </tr>
            <tr v-for="entry in paginatedRevenueEntries" :key="entry.id">
              <td>
                <span class="badge" style="font-family: monospace; font-weight: bold; background-color: var(--primary-light, #e0f2fe); color: var(--primary, #0284c7); padding: 4px 8px; border-radius: 4px;">
                  {{ entry.revenue_id || '-' }}
                </span>
              </td>
              <td>{{ formatDate(entry.entry_date) }}</td>
              <td>
                <div class="project-info">
                  <strong>{{ entry.project_name || 'Direct Source' }}</strong>
                  <small class="text-muted" v-if="entry.project_id">Project Link</small>
                </div>
              </td>
              <td><span class="revenue-type-tag">{{ entry.revenue_type }}</span></td>
              <td class="text-semibold text-primary">₹{{ formatCurrency(entry.amount) }}</td>
              <td>
                <div class="split-detail">
                  <strong>₹{{ formatCurrency(entry.reserve_amount) }}</strong>
                  <small class="text-muted">({{ entry.reserve_percentage }}%)</small>
                </div>
              </td>
              <td><strong>₹{{ formatCurrency(entry.partner_commission) }}</strong></td>
              <td>
                <strong>₹{{ formatCurrency(entry.stakeholder_total) }}</strong>
                <small class="text-muted block">{{ isCompanyExpense(entry) ? 'Owner contribution' : 'Owner earnings pool' }}</small>
              </td>
              <td>
                <span v-if="entry.transaction_id" class="badge" style="font-family: monospace; background-color: #f3f4f6; color: #4b5563; padding: 2px 6px; border-radius: 4px;">
                  #{{ entry.transaction_id }}
                </span>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="text-muted text-xs text-truncate" style="max-width: 150px;">{{ entry.description || '-' }}</td>
              <td>
                <span v-if="isCompanyExpense(entry)" class="status-pill" :class="expenseSettlementClass(entry)">{{ expenseSettlementLabel(entry) }}</span>
                <span v-else-if="isRevenueSettled(entry)" class="status-pill active">Settled</span>
                <span v-else class="status-pill inactive">Pending</span>
              </td>
              <td>
                <button
                  v-if="isCompanyExpense(entry)"
                  class="button secondary text-xs"
                  @click="goToPayables"
                >
                  View Payable
                </button>
                <button
                  v-else-if="!isRevenueSettled(entry)"
                  class="button secondary text-xs"
                  @click="openEditSplitModal(entry)"
                >
                  Settlement
                </button>
                <span v-else class="text-muted text-xs">Locked</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="revenueTotalPages > 1" class="pagination-bar" style="border-top: 1px solid var(--line); padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; background: #ffffff;">
        <button 
          class="pagination-btn" 
          type="button"
          :disabled="revenuePage === 1" 
          @click="revenuePage--"
        >
          Previous
        </button>
        <span class="pagination-info">Page {{ revenuePage }} of {{ revenueTotalPages }} ({{ filteredRevenueEntries.length }} records)</span>
        <button 
          class="pagination-btn" 
          type="button"
          :disabled="revenuePage === revenueTotalPages" 
          @click="revenuePage++"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Stakeholders Tab -->
    <div v-if="activeTab === 'stakeholders'" class="stakeholders-tab card p-0">
      <div class="card-header p-24 border-bottom d-flex justify-between align-center">
        <div>
          <h3 class="m-0">Company Owners</h3>
          <small class="text-muted">Stakeholders represent company ownership; equity % must total 100%</small>
        </div>
        <button class="button secondary" @click="openStakeholderModal()">Add Owner</button>
      </div>
      <div class="table-responsive">
        <table class="grid-table">
          <thead>
            <tr>
              <th>Owner Name</th>
              <th>Email</th>
              <th>Linked User</th>
              <th>Approval Sequence</th>
              <th>Equity Share (%)</th>
              <th>Bank/Payment Details</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="stakeholders.length === 0">
              <td colspan="8" class="text-center py-24 text-muted">No company owners registered.</td>
            </tr>
            <tr v-for="stk in stakeholders" :key="stk.id">
              <td><button class="name-link text-semibold" type="button" @click="openStakeholderHistory(stk)">{{ stk.name }}</button></td>
              <td>{{ stk.email || '-' }}</td>
              <td>{{ stk.linked_user_name || 'Not linked' }}</td>
              <td>{{ stk.approval_sequence || '-' }}</td>
              <td>
                <span class="percentage-pill">{{ stk.payout_percentage }}%</span>
              </td>
              <td class="text-muted pre-wrap">{{ stk.payment_details || 'No payment details' }}</td>
              <td>
                <span class="status-pill" :class="stk.is_active ? 'active' : 'inactive'">
                  {{ stk.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="button secondary text-xs" @click="openStakeholderModal(stk)">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-footer p-16 bg-soft text-sm text-center border-top">
        <span v-if="activeStakeholders.length">{{ activeStakeholders.length }} active owner{{ activeStakeholders.length === 1 ? '' : 's' }} · {{ equitySplitSummary }}</span>
        <span v-else class="text-muted">No active owners</span>
        <span class="mx-8">|</span>
        Total equity:
        <strong :class="activeStakeholderSum === 100 ? 'text-success' : 'text-danger'">
          {{ activeStakeholderSum }}%
        </strong>
        <span class="text-muted ml-8">(must equal 100% for revenue settlement)</span>
      </div>
    </div>

    <!-- Channel Partners Tab -->
    <div v-if="activeTab === 'partners'" class="partners-tab card p-0">
      <div class="card-header p-24 border-bottom d-flex justify-between align-center">
        <h3 class="m-0">Channel Partners</h3>
        <button class="button secondary" @click="openPartnerModal()">Add Channel Partner</button>
      </div>
      <div class="table-responsive">
        <table class="grid-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Commission Model</th>
              <th>Commission Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="partners.length === 0">
              <td colspan="5" class="text-center py-24 text-muted">No channel partners registered.</td>
            </tr>
            <tr v-for="cp in partners" :key="cp.id">
              <td><button class="name-link text-semibold" type="button" @click="openPartnerHistory(cp)">{{ cp.name }}</button></td>
              <td><span class="commission-pill">{{ cp.commission_type }}</span></td>
              <td>
                <strong v-if="cp.commission_type === 'Percentage'">{{ cp.commission_value }}% of Revenue</strong>
                <strong v-else>₹{{ formatCurrency(cp.commission_value) }} flat rate</strong>
              </td>
              <td>
                <span class="status-pill" :class="cp.is_active ? 'active' : 'inactive'">
                  {{ cp.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="button secondary text-xs" @click="openPartnerModal(cp)">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Ledger & Payouts Tab -->
    <div v-if="activeTab === 'ledger'" class="ledger-tab card p-0">
      <div class="card-header p-24 border-bottom">
        <h3 class="m-0">Corporate Payout Ledger</h3>
        <p class="text-sm text-muted m-0 mt-8">Owner contributions (expenses) and owner earnings (income) from settled revenue</p>
      </div>
      <div class="table-responsive">
        <table class="grid-table">
          <thead>
            <tr>
              <th>Revenue ID</th>
              <th>Date</th>
              <th>Recipient</th>
              <th>Type</th>
              <th>Associated Project</th>
              <th>Split Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="payoutLedger.length === 0">
              <td colspan="8" class="text-center py-24 text-muted">
                No payout ledger entries yet. Settle a revenue log entry to generate payouts.
              </td>
            </tr>
            <tr v-for="p in paginatedPayoutLedger" :key="p.id">
              <td>
                <span class="badge" style="font-family: monospace; font-weight: bold; background-color: var(--primary-light, #e0f2fe); color: var(--primary, #0284c7); padding: 4px 8px; border-radius: 4px;">
                  {{ p.revenue_id || '-' }}
                </span>
              </td>
              <td>{{ formatDate(p.payout_date) }}</td>
              <td>
                <div class="recipient-details">
                  <span v-if="p.payout_type === 'Reserve Fund'" class="text-semibold text-primary">Company Reserve Fund</span>
                  <span v-else-if="['Channel Partner', 'Channel Partner Payout'].includes(p.payout_type)" class="text-semibold">{{ p.partner_name || 'Channel Partner' }}</span>
                  <span v-else class="text-semibold">{{ p.stakeholder_name || 'Owner' }}</span>
                  <small class="text-muted" v-if="p.payout_type === 'Stakeholder'">Earning from company</small>
                  <small class="text-muted" v-if="p.payout_type === 'Stakeholder Contribution'">Paid to company</small>
                  <small class="text-muted" v-if="['Channel Partner', 'Channel Partner Payout'].includes(p.payout_type)">Partner</small>
                </div>
              </td>
              <td>
                <span class="type-pill" :class="p.payout_type.toLowerCase().replace(' ', '-')">
                  {{ p.payout_type }}
                </span>
              </td>
              <td>
                <div class="project-info-ledger">
                  <strong>{{ p.project_name || 'Direct Source' }}</strong>
                </div>
              </td>
              <td class="text-semibold" :class="p.payout_type === 'Stakeholder Contribution' ? 'text-primary' : ''">
                <span v-if="p.payout_type === 'Stakeholder Contribution'">+₹{{ formatCurrency(p.amount) }}</span>
                <span v-else>₹{{ formatCurrency(p.amount) }}</span>
              </td>
              <td>
                <span class="status-pill" :class="p.status.toLowerCase()">{{ p.status }}</span>
              </td>
              <td>
                <button 
                  v-if="p.payout_type === 'Stakeholder'"
                  class="button text-xs" 
                  :class="p.status === 'Pending' ? 'primary' : 'secondary'"
                  @click="togglePayoutStatus(p)"
                >
                  Mark as {{ p.status === 'Pending' ? 'Paid' : 'Pending' }}
                </button>
                <span v-else-if="p.payout_type === 'Stakeholder Contribution'" class="text-muted text-xs">Contribution recorded</span>
                <span v-else class="text-muted text-xs">Auto-settled</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="payoutTotalPages > 1" class="pagination-bar" style="border-top: 1px solid var(--line); padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; background: #ffffff;">
        <button 
          class="pagination-btn" 
          type="button"
          :disabled="payoutPage === 1" 
          @click="payoutPage--"
        >
          Previous
        </button>
        <span class="pagination-info">Page {{ payoutPage }} of {{ payoutTotalPages }} ({{ payoutLedger.length }} records)</span>
        <button 
          class="pagination-btn" 
          type="button"
          :disabled="payoutPage === payoutTotalPages" 
          @click="payoutPage++"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Audit Logs Tab -->
    <div v-if="activeTab === 'logs'" class="logs-tab card p-0">
      <div class="card-header p-24 border-bottom">
        <h3 class="m-0">Treasury Audit Trail</h3>
      </div>
      <div class="table-responsive">
        <table class="grid-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Performed By</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="auditLogs.length === 0">
              <td colspan="4" class="text-center py-24 text-muted">No audit logs available.</td>
            </tr>
            <tr v-for="log in paginatedAuditLogs" :key="log.id">
              <td>{{ formatTimestamp(log.created_at) }}</td>
              <td><strong>{{ log.user_name }}</strong></td>
              <td><span class="action-tag">{{ log.action }}</span></td>
              <td class="text-muted text-sm pre-wrap">{{ log.details }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="logsTotalPages > 1" class="pagination-bar" style="border-top: 1px solid var(--line); padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; background: #ffffff;">
        <button 
          class="pagination-btn" 
          type="button"
          :disabled="logsPage === 1" 
          @click="logsPage--"
        >
          Previous
        </button>
        <span class="pagination-info">Page {{ logsPage }} of {{ logsTotalPages }} ({{ auditLogs.length }} records)</span>
        <button 
          class="pagination-btn" 
          type="button"
          :disabled="logsPage === logsTotalPages" 
          @click="logsPage++"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Stakeholder Modal -->
    <div v-if="showStakeholderModal" class="modal-overlay" @click="showStakeholderModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ stakeholderForm.id ? 'Edit Company Owner' : 'Add Company Owner' }}</h2>
          <button class="modal-close" @click="showStakeholderModal = false">&times;</button>
        </div>
        <form class="modal-form p-24" @submit.prevent="saveStakeholder">
          <div class="form-grid single-column">
            <div class="form-group">
              <label>Owner Name <span class="required">*</span></label>
              <input v-model="stakeholderForm.name" type="text" required placeholder="e.g. John Doe" />
            </div>

            <div class="form-group">
              <label>Email ID <span class="required">*</span></label>
              <input v-model="stakeholderForm.email" type="email" required placeholder="owner@example.com" />
            </div>

            <div class="form-group">
              <label>Linked User Account <span class="required">*</span></label>
              <select v-model="stakeholderForm.linked_user_id" required>
                <option value="">Select active user</option>
                <option v-for="user in activeUsers" :key="user.id" :value="user.id">{{ user.full_name }} - {{ user.email }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Approval Sequence <span class="required">*</span></label>
              <input v-model.number="stakeholderForm.approval_sequence" type="number" min="1" step="1" required placeholder="e.g. 1" />
            </div>

            <div class="form-group">
              <label>Equity Ownership (%) <span class="required">*</span></label>
              <input v-model.number="stakeholderForm.payout_percentage" type="number" step="0.01" min="0.01" max="100" required placeholder="e.g. 50.00" />
              <small class="text-muted block mt-4">Share of company ownership (all active owners must total 100%)</small>
            </div>

            <div class="form-group">
              <label>Payment / Bank details</label>
              <textarea v-model="stakeholderForm.payment_details" placeholder="Include bank account number, IFC code, or UPI details..."></textarea>
            </div>

            <div class="form-group">
              <label>Remarks</label>
              <textarea v-model="stakeholderForm.remarks" placeholder="Internal notes for this owner..."></textarea>
            </div>

            <div class="form-group checkbox-group" style="display: flex; align-items: center; gap: 8px;">
              <input v-model="stakeholderForm.is_active" type="checkbox" id="stk_is_active" />
              <label for="stk_is_active" style="margin: 0;">Active owner (included in equity split)</label>
            </div>
          </div>

          <div class="form-actions mt-24">
            <button type="button" class="button secondary" @click="showStakeholderModal = false">Cancel</button>
            <button type="submit" class="button primary">Save Stakeholder</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Partner Modal -->
    <div v-if="showPartnerModal" class="modal-overlay" @click="showPartnerModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ partnerForm.id ? 'Edit Channel Partner' : 'Add New Channel Partner' }}</h2>
          <button class="modal-close" @click="showPartnerModal = false">&times;</button>
        </div>
        <form class="modal-form p-24" @submit.prevent="savePartner">
          <div class="form-grid single-column">
            <div class="form-group">
              <label>Partner Name <span class="required">*</span></label>
              <input v-model="partnerForm.name" type="text" required placeholder="e.g. LeadSource Inc." />
            </div>

            <div class="form-group">
              <label>Commission Type <span class="required">*</span></label>
              <select v-model="partnerForm.commission_type" required>
                <option value="Percentage">Percentage of Revenue (%)</option>
                <option value="Fixed">Fixed Amount per Lead (₹)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Commission Value <span class="required">*</span></label>
              <input v-model.number="partnerForm.commission_value" type="number" step="0.01" min="0" required placeholder="0.00" />
            </div>

            <div class="form-group checkbox-group" style="display: flex; align-items: center; gap: 8px;">
              <input v-model="partnerForm.is_active" type="checkbox" id="partner_is_active" />
              <label for="partner_is_active" style="margin: 0;">Active Partner</label>
            </div>
          </div>

          <div class="form-actions mt-24">
            <button type="button" class="button secondary" @click="showPartnerModal = false">Cancel</button>
            <button type="submit" class="button primary">Save Partner</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Revenue Settlement Modal -->
    <div v-if="showEditSplitModal" class="modal-overlay" @click="showEditSplitModal = false">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>Revenue Settlement</h2>
          <button class="modal-close" @click="showEditSplitModal = false">&times;</button>
        </div>
        <form class="modal-form p-24" @submit.prevent="openRevenueSettlementConfirm">
          <p class="text-sm text-muted mb-16">
            Allocate 100% of this revenue to the company fund. Once confirmed, this entry is settled and cannot be edited.
          </p>
          <div class="form-grid">
            <div class="form-group span-2 bg-soft p-16 rounded mb-12 d-flex justify-between align-center">
              <div>
                <span class="text-xs text-muted block">TOTAL REVENUE AMOUNT</span>
                <strong class="text-xl text-primary">₹{{ formatCurrency(editSplitForm.amount) }}</strong>
              </div>
              <div class="text-right">
                <span class="text-xs text-muted block">SETTLEMENT</span>
                <span class="status-pill inactive">Pending</span>
              </div>
            </div>

            <!-- Reserve Revenue Split -->
            <div class="form-group span-2">
              <label>Company Fund Allocation (%)</label>
              <input v-model.number="editSplitForm.reserve_percentage" type="number" readonly />
              <small class="text-muted block mt-4">Company fund receives: <strong>₹{{ formatCurrency(editSplitReserveAmount) }}</strong></small>
            </div>

            <div class="form-group span-2">
              <label>Received In Bank Account</label>
              <select v-model="editSplitForm.bank_account_id" required>
                <option value="">Select bank account</option>
                <option v-for="account in activeBankAccounts" :key="account.id" :value="account.id">{{ account.label }}</option>
              </select>
            </div>

            <div class="form-group span-2 border-top pt-16">
              <h4 class="m-0 mb-12">Settlement Rule</h4>
              <p class="text-xs text-muted mb-16">Channel partner and stakeholder allocation are skipped at revenue settlement. The full amount is first moved into company fund.</p>
              <div class="p-12 bg-soft border rounded text-semibold text-success">Total Settlement Percentage: 100%</div>
            </div>
          </div>

          <div class="form-actions mt-24">
            <button type="button" class="button secondary" @click="showEditSplitModal = false">Cancel</button>
            <button type="submit" class="button primary" :disabled="isSaveEditSplitDisabled">
              Confirm Settlement
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showRevenueSettlementConfirmModal" class="modal-overlay confirm-overlay" @click.self="closeRevenueSettlementConfirm">
      <div class="modal-content confirm-modal" @click.stop>
        <div class="confirm-modal-header">
          <div class="confirm-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <button class="modal-close confirm-close" type="button" @click="closeRevenueSettlementConfirm">&times;</button>
        </div>
        <div class="confirm-body">
          <p class="confirm-kicker">Confirm settlement</p>
          <h2 class="confirm-title">Settle this revenue entry?</h2>
          <p class="confirm-copy">
            The full transaction value will move into the company fund and this revenue entry will be locked.
          </p>

          <div class="settlement-amount-card">
            <span>Settlement amount</span>
            <strong>₹{{ formatCurrency(editSplitForm.amount) }}</strong>
          </div>

          <div class="confirm-summary">
            <div class="confirm-summary-row">
              <span>Allocation</span>
              <strong>100% to company fund</strong>
            </div>
            <div class="confirm-summary-row">
              <span>Received in</span>
              <strong class="confirm-bank-label">{{ selectedSettlementBankLabel }}</strong>
            </div>
            <div class="confirm-summary-row">
              <span>Entry status</span>
              <strong>Locked after settlement</strong>
            </div>
          </div>

          <div class="confirm-warning">
            <span aria-hidden="true">!</span>
            <p>Review the bank account before confirming. This settlement cannot be edited after it is posted.</p>
          </div>

          <div class="confirm-actions">
            <button type="button" class="button secondary confirm-cancel" :disabled="isSavingRevenueSettlement" @click="closeRevenueSettlementConfirm">Cancel</button>
            <button type="button" class="button primary confirm-submit" :disabled="isSavingRevenueSettlement" @click="saveEditSplit">
              {{ isSavingRevenueSettlement ? 'Settling...' : 'Confirm Settlement' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="historyModal.visible" class="modal-overlay" @click.self="closeHistoryModal">
      <div class="modal-content history-modal" @click.stop>
        <div class="modal-header history-modal-header">
          <div>
            <p class="eyebrow">{{ historyModal.kind === 'stakeholder' ? 'Company Owner' : 'Channel Partner' }}</p>
            <h2>{{ historyModal.name }} Transactions</h2>
          </div>
          <button class="modal-close" type="button" @click="closeHistoryModal">&times;</button>
        </div>
        <div class="history-modal-body">
          <div class="history-summary-grid">
            <div>
              <span>{{ historyModal.kind === 'stakeholder' ? 'Paid to Company' : 'Paid In' }}</span>
              <strong>₹{{ formatCurrency(historyModal.totals.pay_in || 0) }}</strong>
            </div>
            <div>
              <span>Paid Out</span>
              <strong>₹{{ formatCurrency(historyModal.totals.pay_out || 0) }}</strong>
            </div>
            <div>
              <span>Pending</span>
              <strong>₹{{ formatCurrency(historyModal.totals.pending_out || 0) }}</strong>
            </div>
          </div>
          <div v-if="historyModal.loading" class="text-center py-24 text-muted">Loading transactions...</div>
          <div v-else-if="historyModal.error" class="flash warning">{{ historyModal.error }}</div>
          <div v-else class="history-table-wrap">
            <table class="grid-table history-table">
              <colgroup>
                <col class="history-col-date">
                <col class="history-col-type">
                <col class="history-col-reference">
                <col class="history-col-transaction">
                <col class="history-col-description">
                <col class="history-col-status">
                <col class="history-col-amount">
              </colgroup>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Transaction</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="historyModal.transactions.length === 0">
                  <td colspan="7" class="text-center py-24 text-muted">No pay-in or payout transactions found.</td>
                </tr>
                <tr v-for="entry in historyModal.transactions" :key="`${entry.entry_type}-${entry.id}`">
                  <td class="history-date">{{ formatDate(entry.date) }}</td>
                  <td><span class="type-pill history-type-pill">{{ entry.entry_type }}</span></td>
                  <td class="history-muted-cell">{{ entry.reference || '-' }}</td>
                  <td class="history-muted-cell">{{ entry.transaction_id ? `#${entry.transaction_id}` : '-' }}</td>
                  <td class="history-description">{{ entry.description || '-' }}</td>
                  <td><span class="status-pill" :class="String(entry.status || '').toLowerCase()">{{ entry.status || '-' }}</span></td>
                  <td class="history-amount" :class="entry.direction === 'in' ? 'text-primary' : 'text-success'">
                    {{ entry.direction === 'in' ? '+' : '-' }}₹{{ formatCurrency(entry.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api/client'

const router = useRouter()

// Tabs
const activeTab = ref('dashboard')
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>' },
  { id: 'payment_dashboard', label: 'Payment Dashboard', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>' },
  { id: 'revenue', label: 'Revenue Log', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  { id: 'stakeholders', label: 'Company Owners', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { id: 'partners', label: 'Channel Partners', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { id: 'ledger', label: 'Payout Ledger', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
  { id: 'logs', label: 'Audit Logs', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' }
]

// Data states
const dashboardData = ref({
  shared_revenue: 0,
  reserve_accumulated: 0,
  reserve_spent: 0,
  reserve_available: 0,
  partner_pending: 0,
  partner_paid: 0,
  stakeholder_pending: 0,
  stakeholder_paid: 0,
  recent_payouts: []
})
const revenueEntries = ref([])
const revenueSearch = ref('')
const stakeholders = ref([])
const users = ref([])
const partners = ref([])
const payoutLedger = ref([])
const auditLogs = ref([])
const bankAccounts = ref([])

// Payment Dashboard states
const paymentStats = ref({
  stakeholders: [],
  partners: [],
  reserve_ledger: []
})

// Form states
const showEditSplitModal = ref(false)
const showRevenueSettlementConfirmModal = ref(false)
const isSavingRevenueSettlement = ref(false)
const editSplitForm = reactive({
  revenue_id: null,
  amount: 0,
  reserve_percentage: 100.00,
  bank_account_id: '',
  channel_partner_id: null,
  partner_commission_percentage: 0.00,
  stakeholders: []
})

const showStakeholderModal = ref(false)
const stakeholderForm = reactive({
  id: null,
  name: '',
  email: '',
  linked_user_id: '',
  approval_sequence: 1,
  payout_percentage: 0,
  payment_details: '',
  remarks: '',
  is_active: true
})

const showPartnerModal = ref(false)
const partnerForm = reactive({
  id: null,
  name: '',
  commission_type: 'Percentage',
  commission_value: 0,
  is_active: true
})

const historyModal = reactive({
  visible: false,
  kind: '',
  name: '',
  loading: false,
  error: '',
  transactions: [],
  totals: { pay_in: 0, pay_out: 0, pending_out: 0 }
})

// Computeds
const activeStakeholders = computed(() => {
  return stakeholders.value.filter(s => s.is_active)
})

const activeUsers = computed(() => {
  return users.value.filter(user => user.is_active === 1 || user.is_active === true)
})

const activeStakeholderSum = computed(() => {
  return Math.round(activeStakeholders.value.reduce((sum, s) => sum + parseFloat(s.payout_percentage), 0) * 100) / 100
})

const equitySplitSummary = computed(() => {
  if (activeStakeholders.value.length === 0) return ''
  return activeStakeholders.value.map(s => `${s.payout_percentage}%`).join(' + ')
})

function isRevenueSettled(entry) {
  return entry.is_settled === true || entry.is_settled === 1
}

function expenseSettlementLabel(entry) {
  if (isRevenueSettled(entry) || entry.payable_status === 'Paid') return 'Settled'
  if (entry.payable_status === 'Partially Paid') return 'Partially Paid'
  return 'Moved to Payables'
}

function expenseSettlementClass(entry) {
  if (isRevenueSettled(entry) || entry.payable_status === 'Paid') return 'active'
  if (entry.payable_status === 'Partially Paid') return 'pending'
  return 'inactive'
}

function isCompanyExpense(entry) {
  return parseFloat(entry.amount) < 0
}

function goToPayables() {
  router.push('/treasury/payables')
}

const revenueSettlementStats = computed(() => {
  const settlementEntries = revenueEntries.value.filter((e) => !isCompanyExpense(e))
  const settled = settlementEntries.filter((e) => isRevenueSettled(e))
  const pending = settlementEntries.filter((e) => !isRevenueSettled(e))
  const sumAbs = (list) =>
    Math.round(list.reduce((sum, e) => sum + Math.abs(parseFloat(e.amount) || 0), 0) * 100) / 100
  return {
    settledCount: settled.length,
    pendingCount: pending.length,
    totalCount: settlementEntries.length,
    settledAmount: sumAbs(settled),
    pendingAmount: sumAbs(pending),
  }
})

const activePartners = computed(() => {
  return partners.value.filter(p => p.is_active)
})

// Edit Split Modal Computeds
const editSplitReserveAmount = computed(() => {
  return Math.round(editSplitForm.amount * (editSplitForm.reserve_percentage / 100) * 100) / 100
})

const activeBankAccounts = computed(() => {
  return bankAccounts.value.filter(account => (account.status || 'Active') === 'Active')
})

const selectedSettlementBankLabel = computed(() => {
  const account = activeBankAccounts.value.find((item) => String(item.id) === String(editSplitForm.bank_account_id))
  return account?.label || 'Selected bank account'
})

const editSplitPartnerCommission = computed(() => {
  if (!editSplitForm.channel_partner_id) return 0
  return Math.round(editSplitForm.amount * (editSplitForm.partner_commission_percentage / 100) * 100) / 100
})

const editSplitStakeholderPool = computed(() => {
  const remaining = editSplitForm.amount - editSplitReserveAmount.value - editSplitPartnerCommission.value
  return Math.max(0, Math.round(remaining * 100) / 100)
})

const editSplitStakeholderShare = (percentage) => {
  return Math.round(editSplitForm.amount * ((percentage || 0) / 100) * 100) / 100
}

const editSplitTotalPercentageSum = computed(() => {
  const reserve = parseFloat(editSplitForm.reserve_percentage) || 0
  const partner = editSplitForm.channel_partner_id ? (parseFloat(editSplitForm.partner_commission_percentage) || 0) : 0
  const stks = editSplitForm.stakeholders.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0)
  return Math.round((reserve + partner + stks) * 100) / 100
})

const isSaveEditSplitDisabled = computed(() => {
  return editSplitTotalPercentageSum.value !== 100 || editSplitStakeholderPool.value < 0 || !editSplitForm.bank_account_id
})

// Pagination states
const revenuePage = ref(1)
const revenueItemsPerPage = 10
const filteredRevenueEntries = computed(() => {
  const term = revenueSearch.value.trim().toLowerCase().replace(/^#/, '')
  if (!term) return revenueEntries.value
  return revenueEntries.value.filter((entry) => {
    const settlement = isRevenueSettled(entry) ? 'settled' : 'pending'
    const searchable = [
      entry.revenue_id,
      entry.transaction_id,
      entry.project_name,
      entry.revenue_type,
      entry.description,
      entry.entry_date,
      settlement,
      entry.amount,
      entry.reserve_amount,
      entry.partner_commission,
      entry.stakeholder_total,
    ].map(value => String(value ?? '').toLowerCase()).join(' ')
    return searchable.includes(term)
  })
})
const revenueTotalPages = computed(() => Math.ceil(filteredRevenueEntries.value.length / revenueItemsPerPage))
const paginatedRevenueEntries = computed(() => {
  const start = (revenuePage.value - 1) * revenueItemsPerPage
  const end = start + revenueItemsPerPage
  return filteredRevenueEntries.value.slice(start, end)
})

const payoutPage = ref(1)
const payoutItemsPerPage = 10
const payoutTotalPages = computed(() => Math.ceil(payoutLedger.value.length / payoutItemsPerPage))
const paginatedPayoutLedger = computed(() => {
  const start = (payoutPage.value - 1) * payoutItemsPerPage
  const end = start + payoutItemsPerPage
  return payoutLedger.value.slice(start, end)
})

const logsPage = ref(1)
const logsItemsPerPage = 10
const logsTotalPages = computed(() => Math.ceil(auditLogs.value.length / logsItemsPerPage))
const paginatedAuditLogs = computed(() => {
  const start = (logsPage.value - 1) * logsItemsPerPage
  const end = start + logsItemsPerPage
  return auditLogs.value.slice(start, end)
})

const paymentItemsPerPage = 10
const paymentStakeholderPage = ref(1)
const paymentStakeholderTotalPages = computed(() => Math.ceil(paymentStats.value.stakeholders.length / paymentItemsPerPage))
const paginatedPaymentStakeholders = computed(() => {
  const start = (paymentStakeholderPage.value - 1) * paymentItemsPerPage
  return paymentStats.value.stakeholders.slice(start, start + paymentItemsPerPage)
})

const paymentPartnerPage = ref(1)
const paymentPartnerTotalPages = computed(() => Math.ceil(paymentStats.value.partners.length / paymentItemsPerPage))
const paginatedPaymentPartners = computed(() => {
  const start = (paymentPartnerPage.value - 1) * paymentItemsPerPage
  return paymentStats.value.partners.slice(start, start + paymentItemsPerPage)
})

const paymentReservePage = ref(1)
const paymentReserveTotalPages = computed(() => Math.ceil(paymentStats.value.reserve_ledger.length / paymentItemsPerPage))
const paginatedPaymentReserveLedger = computed(() => {
  const start = (paymentReservePage.value - 1) * paymentItemsPerPage
  return paymentStats.value.reserve_ledger.slice(start, start + paymentItemsPerPage)
})

// Reset pages on active tab changes
watch(activeTab, () => {
  revenuePage.value = 1
  payoutPage.value = 1
  logsPage.value = 1
  paymentStakeholderPage.value = 1
  paymentPartnerPage.value = 1
  paymentReservePage.value = 1
})

watch(revenueSearch, () => {
  revenuePage.value = 1
})

// Actions
onMounted(() => {
  loadAllData()
})

async function loadAllData() {
  const safe = async (fn, label) => {
    try { return await fn() } catch (e) { console.warn(`Treasury: ${label} failed –`, e.message) }
  }

  const dash = await safe(() => apiGet('/api/treasury/dashboard'), 'dashboard')
  if (dash) dashboardData.value = dash

  const revs = await safe(() => apiGet('/api/treasury/revenue'), 'revenue')
  if (revs?.revenue) revenueEntries.value = revs.revenue

  const stks = await safe(() => apiGet('/api/treasury/stakeholders'), 'stakeholders')
  if (stks?.stakeholders) stakeholders.value = stks.stakeholders
  const userData = await safe(() => apiGet('/api/setup/users'), 'users')
  if (userData?.users) users.value = userData.users

  const pts = await safe(() => apiGet('/api/treasury/channel-partners'), 'channel-partners')
  if (pts?.partners) partners.value = pts.partners

  const ledger = await safe(() => apiGet('/api/treasury/payouts'), 'payouts')
  if (ledger?.payouts) payoutLedger.value = ledger.payouts

  const logs = await safe(() => apiGet('/api/treasury/logs'), 'logs')
  if (logs?.logs) auditLogs.value = logs.logs

  const payStats = await safe(() => apiGet('/api/treasury/payment-stats'), 'payment-stats')
  if (payStats) paymentStats.value = payStats

  const bankData = await safe(() => apiGet('/api/treasury/bank-accounts'), 'bank accounts')
  if (bankData?.bank_accounts) bankAccounts.value = bankData.bank_accounts
}

async function settleStakeholder(stakeholder) {
  if (!confirm(`Mark pending earnings of ₹${formatCurrency(stakeholder.pending_amount)} as Paid to ${stakeholder.name}? (This does not include amounts they paid into the company.)`)) {
    return
  }
  try {
    await apiPost(`/api/treasury/stakeholders/${stakeholder.id}/settle`)
    await loadAllData()
  } catch (err) {
    alert(err.message || "Failed to settle stakeholder payouts")
  }
}

async function settlePartner(partner) {
  if (!confirm(`Are you sure you want to mark all pending commissions (₹${formatCurrency(partner.pending_amount)}) for ${partner.name} as Paid?`)) {
    return
  }
  try {
    await apiPost(`/api/treasury/partners/${partner.id}/settle`)
    await loadAllData()
  } catch (err) {
    alert(err.message || "Failed to settle partner payouts")
  }
}

async function openStakeholderHistory(stakeholder) {
  await openHistoryModal('stakeholder', stakeholder.name, `/api/treasury/stakeholders/${stakeholder.id}/transactions`)
}

async function openPartnerHistory(partner) {
  await openHistoryModal('partner', partner.name, `/api/treasury/channel-partners/${partner.id}/transactions`)
}

async function openHistoryModal(kind, name, endpoint) {
  historyModal.visible = true
  historyModal.kind = kind
  historyModal.name = name
  historyModal.loading = true
  historyModal.error = ''
  historyModal.transactions = []
  historyModal.totals = { pay_in: 0, pay_out: 0, pending_out: 0 }
  try {
    const data = await apiGet(endpoint)
    historyModal.transactions = data.transactions || []
    historyModal.totals = data.totals || { pay_in: 0, pay_out: 0, pending_out: 0 }
  } catch (err) {
    historyModal.error = err.message || 'Unable to load transactions.'
  } finally {
    historyModal.loading = false
  }
}

function closeHistoryModal() {
  historyModal.visible = false
}

function openEditSplitModal(entry) {
  if (isCompanyExpense(entry)) {
    goToPayables()
    return
  }
  if (isRevenueSettled(entry)) {
    alert('This revenue entry is already settled and cannot be edited.')
    return
  }
  editSplitForm.revenue_id = entry.id
  editSplitForm.amount = parseFloat(entry.amount)
  editSplitForm.reserve_percentage = 100
  editSplitForm.bank_account_id = entry.bank_account_id || ''
  editSplitForm.channel_partner_id = null
  editSplitForm.partner_commission_percentage = 0
  editSplitForm.stakeholders = []

  showEditSplitModal.value = true
}

function openRevenueSettlementConfirm() {
  if (isSaveEditSplitDisabled.value) return
  showRevenueSettlementConfirmModal.value = true
}

function closeRevenueSettlementConfirm() {
  if (isSavingRevenueSettlement.value) return
  showRevenueSettlementConfirmModal.value = false
}

async function saveEditSplit() {
  if (isSavingRevenueSettlement.value) return
  isSavingRevenueSettlement.value = true
  try {
    const payload = {
      reserve_percentage: 100,
      bank_account_id: editSplitForm.bank_account_id,
      channel_partner_id: null,
      partner_commission_percentage: 0,
      stakeholders: []
    }
    await apiPut(`/api/treasury/revenue/${editSplitForm.revenue_id}`, payload)
    showRevenueSettlementConfirmModal.value = false
    showEditSplitModal.value = false
    await loadAllData()
  } catch (err) {
    alert(err.message || "Failed to settle revenue entry")
  } finally {
    isSavingRevenueSettlement.value = false
  }
}

function openStakeholderModal(stk = null) {
  if (stk) {
    Object.assign(stakeholderForm, {
      id: stk.id,
      name: stk.name,
      email: stk.email || '',
      linked_user_id: stk.linked_user_id || '',
      approval_sequence: stk.approval_sequence || 1,
      payout_percentage: stk.payout_percentage,
      payment_details: stk.payment_details,
      remarks: stk.remarks || '',
      is_active: !!stk.is_active
    })
  } else {
    Object.assign(stakeholderForm, {
      id: null,
      name: '',
      email: '',
      linked_user_id: '',
      approval_sequence: 1,
      payout_percentage: 0,
      payment_details: '',
      remarks: '',
      is_active: true
    })
  }
  showStakeholderModal.value = true
}

async function saveStakeholder() {
  try {
    if (stakeholderForm.id) {
      await apiPut(`/api/treasury/stakeholders/${stakeholderForm.id}`, stakeholderForm)
    } else {
      await apiPost('/api/treasury/stakeholders', stakeholderForm)
    }
    showStakeholderModal.value = false
    loadAllData()
  } catch (err) {
    alert(err.message || "Failed to save stakeholder")
  }
}

function openPartnerModal(cp = null) {
  if (cp) {
    Object.assign(partnerForm, {
      id: cp.id,
      name: cp.name,
      commission_type: cp.commission_type,
      commission_value: cp.commission_value,
      is_active: !!cp.is_active
    })
  } else {
    Object.assign(partnerForm, {
      id: null,
      name: '',
      commission_type: 'Percentage',
      commission_value: 0,
      is_active: true
    })
  }
  showPartnerModal.value = true
}

async function savePartner() {
  try {
    if (partnerForm.id) {
      await apiPut(`/api/treasury/channel-partners/${partnerForm.id}`, partnerForm)
    } else {
      await apiPost('/api/treasury/channel-partners', partnerForm)
    }
    showPartnerModal.value = false
    loadAllData()
  } catch (err) {
    alert(err.message || "Failed to save channel partner")
  }
}

async function togglePayoutStatus(payout) {
  try {
    const nextStatus = payout.status === 'Pending' ? 'Paid' : 'Pending'
    await apiPut(`/api/treasury/payouts/${payout.id}/status`, { status: nextStatus })
    loadAllData()
  } catch (err) {
    alert(err.message || "Failed to update payout status")
  }
}

// Helpers
function formatCurrency(val) {
  if (!val && val !== 0) return '0.00'
  const isNeg = parseFloat(val) < 0
  const formatted = Math.abs(parseFloat(val)).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return isNeg ? `-${formatted}` : formatted
}

function formatDate(val) {
  if (!val) return ''
  return new Date(val).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatTimestamp(val) {
  if (!val) return ''
  return new Date(val).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.treasury-container {
  max-width: 1440px;
  margin: 0 auto;
  font-family: inherit;
  padding: 32px !important;
  color: #111827;
  background:
    linear-gradient(180deg, #f8fafc 0%, #ffffff 240px);
  min-height: calc(100vh - 72px);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.treasury-hero {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96)),
    radial-gradient(circle at 10% 0%, rgba(14, 165, 233, 0.12), transparent 32%);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
  padding: 28px 30px;
}

.module-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  background: #e0f2fe;
  color: #0369a1;
  padding: 6px 12px;
  border-radius: 999px;
  margin-bottom: 12px;
  letter-spacing: 0.08em;
}

.header-titles h1 {
  margin: 0;
  font-size: 42px;
  font-weight: 850;
  letter-spacing: 0;
  color: #0f172a;
}

.subtitle {
  margin: 10px 0 0 0;
  max-width: 780px;
  font-size: 15px;
  line-height: 1.65;
}

.hero-summary {
  background: #0f172a;
  border-radius: 12px;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.16);
  color: #ffffff;
  display: grid;
  gap: 6px;
  min-width: 230px;
  padding: 20px 22px;
}

.hero-summary span {
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-summary strong {
  font-size: 26px;
  font-weight: 850;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* Tabs */
.treasury-tabs-wrapper {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  padding: 8px;
  position: sticky;
  top: 76px;
  z-index: 20;
}

.treasury-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
}

.tab-btn {
  background: transparent;
  border: none;
  border-radius: 9px;
  padding: 11px 15px;
  font-weight: 750;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  background: #f8fafc;
  color: #0f172a;
}

.tab-btn.active {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.14);
}

.tab-icon {
  display: inline-flex;
  align-items: center;
}

.dashboard-tab,
.payment-dashboard-tab {
  display: grid;
  gap: 26px;
}

.revenue-tab,
.stakeholders-tab,
.partners-tab,
.ledger-tab,
.logs-tab,
.pay-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.card-header {
  background:
    linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.card-header h3,
.card-header h4 {
  color: #0f172a;
  font-weight: 800;
}

/* Revenue log settlement summary */
.revenue-log-summary {
  background:
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.revenue-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.revenue-summary-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.045);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.revenue-summary-card.settled {
  border-left: 3px solid #059669;
}

.revenue-summary-card.pending {
  border-left: 3px solid #d97706;
}

.revenue-summary-card.amount-settled {
  border-left: 3px solid #0284c7;
}

.revenue-summary-card.amount-pending {
  border-left: 3px solid #ea580c;
}

.revenue-summary-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.revenue-summary-value {
  font-size: 26px;
  line-height: 1.2;
  font-weight: 850;
}

.revenue-filter-bar {
  align-items: center;
  background: #ffffff;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.revenue-search-wrap {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  display: flex;
  flex: 1;
  gap: 10px;
  max-width: 560px;
  padding: 0 12px;
}

.revenue-search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.revenue-search-wrap input {
  background: transparent;
  border: 0;
  box-shadow: none;
  height: 40px;
  outline: none;
  padding: 0;
  width: 100%;
}

/* KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.kpi-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 28px;
  display: flex;
  align-items: flex-start;
  gap: 18px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
}

.kpi-icon {
  width: 54px;
  height: 54px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reserve-card .kpi-icon {
  background: var(--primary-soft);
  color: var(--primary);
}

.revenue-card .kpi-icon {
  background: #e0f2fe;
  color: #0284c7;
}

.stakeholder-card .kpi-icon {
  background: #ecfdf5;
  color: #10b981;
}

.partner-card .kpi-icon {
  background: #fdf2f8;
  color: #db2777;
}

.kpi-content {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.kpi-content h3 {
  margin: 8px 0 8px;
  font-size: 30px;
  font-weight: 850;
  color: #0f172a;
}

.kpi-sub {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}

/* Grid Layouts */
.grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

.dashboard-block {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.055);
  overflow: hidden;
}

.block-header {
  padding: 22px 26px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fbfdff;
}

.block-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.block-body {
  padding: 28px;
}

.ownership-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--surface-soft);
  border-radius: 8px;
  font-size: 14px;
}

.ownership-count {
  font-weight: 600;
}

.ownership-split {
  font-size: 13px;
}

.ratio-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ratio-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ratio-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.percentage-badge {
  font-weight: 700;
  color: var(--primary);
}

.ratio-bar-bg {
  background: var(--surface-soft);
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.ratio-bar-fill {
  background: var(--primary);
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.total-bar {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

/* Tables */
.simple-table {
  width: 100%;
  border-collapse: collapse;
}

.simple-table th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
}

.simple-table td {
  padding: 12px;
  font-size: 13px;
  border-bottom: 1px solid var(--line);
}

.simple-table tr:last-child td {
  border-bottom: none;
}

.grid-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.grid-table th {
  text-align: left;
  background: #f7f9fc;
  font-weight: 800;
  font-size: 12px;
  color: #64748b;
  padding: 17px 22px;
  border-bottom: 1px solid #e2e8f0;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.grid-table td {
  padding: 20px 22px;
  font-size: 14px;
  border-bottom: 1px solid #eef2f7;
  vertical-align: middle;
}

.grid-table tr:hover td {
  background: #fbfdff;
}

.table-responsive {
  overflow-x: auto;
}

.table-responsive::-webkit-scrollbar {
  height: 8px;
}

.table-responsive::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Badges / Tag pills */
.type-pill {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  background: var(--surface-soft);
}

.type-pill.reserve-fund {
  background: var(--primary-soft);
  color: var(--primary);
}

.type-pill.channel-partner {
  background: #fdf2f8;
  color: #db2777;
}

.type-pill.stakeholder-contribution {
  background: #dbeafe;
  color: #1d4ed8;
}

.type-pill.stakeholder {
  background: #ecfdf5;
  color: #10b981;
}

.status-pill {
  display: inline-block;
  padding: 5px 11px;
  border-radius: 50px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-pill.paid,
.status-pill.active {
  background: #d1fae5;
  color: #065f46;
}

.status-pill.pending,
.status-pill.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.revenue-type-tag {
  background: #eef2ff;
  color: #3730a3;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
}

/* Preview Split details */
.preview-panel {
  background: #fcfcfd;
}

.preview-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.preview-card {
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-card-lbl {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
}

.preview-card strong {
  font-size: 18px;
}

.preview-stk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.preview-stk-row {
  display: flex;
  justify-content: space-between;
  background: var(--surface);
  border: 1px solid var(--line);
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
}

.preview-stk-row strong {
  color: var(--primary);
}

.span-2 {
  grid-column: span 2;
}

.modal-content.large {
  max-width: 750px;
}

.confirm-overlay {
  z-index: 1200;
}

.confirm-modal {
  border: 1px solid #e5edf6;
  border-radius: 12px;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.28);
  max-width: 520px;
  overflow: hidden;
}

.confirm-modal-header {
  align-items: center;
  background:
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-bottom: 1px solid #e5edf6;
  display: flex;
  justify-content: space-between;
  padding: 20px 24px;
}

.confirm-icon {
  align-items: center;
  background: #e8f4ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1d4ed8;
  display: inline-flex;
  height: 44px;
  justify-content: center;
  width: 44px;
}

.confirm-close {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  height: 34px;
  position: static;
  width: 34px;
}

.confirm-body {
  padding: 24px;
}

.confirm-kicker {
  color: #2563eb;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.08em;
  margin: 0 0 8px;
  text-transform: uppercase;
}

.confirm-title {
  color: #0f172a;
  font-size: 24px;
  font-weight: 850;
  line-height: 1.2;
  margin: 0;
}

.confirm-copy {
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
  margin: 10px 0 18px;
}

.settlement-amount-card {
  background: #0f172a;
  border-radius: 10px;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 14px;
  padding: 18px 20px;
}

.settlement-amount-card span {
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.settlement-amount-card strong {
  font-size: 24px;
  font-weight: 850;
  white-space: nowrap;
}

.confirm-summary {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  display: grid;
  overflow: hidden;
}

.confirm-summary-row {
  align-items: center;
  display: flex;
  gap: 18px;
  justify-content: space-between;
  padding: 14px 16px;
}

.confirm-summary-row + .confirm-summary-row {
  border-top: 1px solid #eef2f7;
}

.confirm-summary span {
  color: #64748b;
  flex: 0 0 112px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.confirm-summary strong {
  color: #0f172a;
  font-size: 14px;
  line-height: 1.4;
  text-align: right;
}

.confirm-bank-label {
  max-width: 280px;
}

.confirm-warning {
  align-items: flex-start;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 10px;
  color: #9a3412;
  display: flex;
  gap: 10px;
  margin-top: 14px;
  padding: 12px 14px;
}

.confirm-warning span {
  align-items: center;
  background: #fed7aa;
  border-radius: 999px;
  display: inline-flex;
  flex: 0 0 20px;
  font-size: 12px;
  font-weight: 900;
  height: 20px;
  justify-content: center;
  margin-top: 1px;
}

.confirm-warning p {
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 22px;
}

.confirm-actions .button {
  min-height: 44px;
  padding-inline: 18px;
}

.confirm-submit {
  min-width: 180px;
}

@media (max-width: 560px) {
  .confirm-modal {
    margin: 16px;
    max-width: calc(100vw - 32px);
  }

  .settlement-amount-card,
  .confirm-summary-row,
  .confirm-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .confirm-summary span {
    flex-basis: auto;
  }

  .confirm-summary strong,
  .confirm-bank-label {
    max-width: none;
    text-align: left;
  }

  .confirm-actions .button {
    width: 100%;
  }
}

.pre-wrap {
  white-space: pre-wrap;
}

.action-tag {
  background: var(--primary-soft);
  color: var(--primary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
}

/* ===================== Payment Dashboard ===================== */
.payment-dashboard-tab {
  padding: 0;
}

.pay-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.pay-kpi-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 28px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.pay-kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  border-radius: 12px 12px 0 0;
}

.pay-fund-card::before    { background: linear-gradient(90deg, #10b981, #059669); }
.pay-stakeholder-card::before { background: linear-gradient(90deg, #6366f1, #4f46e5); }
.pay-partner-card::before { background: linear-gradient(90deg, #f59e0b, #d97706); }

.pay-kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 42px rgba(15, 23, 42, 0.1);
}

.pay-kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pay-fund-card .pay-kpi-icon    { background: #d1fae5; color: #059669; }
.pay-stakeholder-card .pay-kpi-icon { background: #e0e7ff; color: #4f46e5; }
.pay-partner-card .pay-kpi-icon { background: #fef3c7; color: #d97706; }

.pay-kpi-content {
  flex: 1;
  min-width: 0;
}

.pay-kpi-label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  margin-bottom: 8px;
}

.pay-kpi-value {
  font-size: 30px;
  font-weight: 850;
  margin: 0 0 14px 0;
  line-height: 1.1;
  color: #0f172a;
}

.pay-kpi-sub-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pay-kpi-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 20px;
}

.pay-kpi-chip.green  { background: #d1fae5; color: #065f46; }
.pay-kpi-chip.red    { background: #fee2e2; color: #991b1b; }
.pay-kpi-chip.orange { background: #fef3c7; color: #92400e; }

.pay-section {
  background: #ffffff;
}

.pay-section + .pay-section {
  margin-top: 4px;
}

.pay-section .card-header {
  min-height: 78px;
}

.avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #0f172a;
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.button.sm {
  padding: 6px 14px;
  font-size: 12px;
}

.mt-auto { margin-top: auto; }
.gap-8   { gap: 8px; }
.mb-28   { margin-bottom: 28px; }

/* Pagination controls consistent styling */
.pagination-bar {
  align-items: center;
  background: #fbfdff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 18px 24px;
}

.pagination-btn {
  padding: 8px 15px;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  color: var(--text-primary, #0f172a);
  font-weight: 750;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--surface-soft, #f8fafc);
  color: var(--primary, #f97316);
  border-color: var(--primary, #f97316);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 13px;
  color: var(--text-muted, #64748b);
  font-weight: 600;
  text-align: center;
}

.name-link {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--primary, #2563eb);
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  padding: 0;
  text-align: left;
}

.name-link:hover {
  text-decoration: underline;
}

.history-modal {
  max-width: 1080px;
  overflow: hidden;
  width: min(1080px, calc(100vw - 48px));
}

.history-modal-header {
  padding: 24px 32px;
}

.history-modal-header h2 {
  font-size: 26px;
  line-height: 1.15;
  margin: 0;
}

.history-modal-body {
  display: grid;
  gap: 18px;
  padding: 20px 24px 24px;
}

.history-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.history-summary-grid > div {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8fafc;
  padding: 16px 18px;
}

.history-summary-grid span {
  display: block;
  color: var(--text-muted, #64748b);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.history-summary-grid strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: 24px;
  line-height: 1.15;
  white-space: nowrap;
}

.history-table-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: auto;
}

.history-table {
  table-layout: fixed;
  min-width: 920px;
}

.history-table th {
  padding: 13px 16px;
}

.history-table td {
  padding: 15px 16px;
}

.history-col-date { width: 96px; }
.history-col-type { width: 118px; }
.history-col-reference { width: 150px; }
.history-col-transaction { width: 122px; }
.history-col-description { width: auto; }
.history-col-status { width: 124px; }
.history-col-amount { width: 150px; }

.history-date {
  color: #334155;
  font-weight: 700;
}

.history-muted-cell {
  color: #475569;
  overflow-wrap: anywhere;
}

.history-description {
  color: #334155;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.history-type-pill {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}

.history-amount {
  font-weight: 850;
  text-align: right;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .grid-2col {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .treasury-container {
    padding: 18px !important;
  }

  .history-modal {
    width: calc(100vw - 28px);
  }

  .history-modal-header,
  .history-modal-body {
    padding-inline: 18px;
  }

  .history-summary-grid {
    grid-template-columns: 1fr;
  }

  .header-section {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-titles h1 {
    font-size: 32px;
  }

  .hero-summary {
    min-width: 0;
    width: 100%;
  }

  .treasury-tabs-wrapper {
    top: 64px;
  }

  .pay-kpi-grid,
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .pay-kpi-card {
    grid-template-columns: 1fr;
  }

  .revenue-filter-bar,
  .pagination-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .revenue-search-wrap {
    max-width: none;
  }
}
</style>
