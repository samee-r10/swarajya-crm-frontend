<template>
  <div class="treasury-container p-24">
    <!-- Header -->
    <div class="header-section mb-24">
      <div class="header-titles">
        <span class="module-pill">Finance Center</span>
        <h1>Treasury & Payouts</h1>
        <p class="subtitle text-muted">Settle ledger transactions into reserve, owner, and partner splits — entries sync from the transaction ledger.</p>
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
                    <span v-else-if="p.payout_type === 'Channel Partner'">{{ p.partner_name || 'Channel Partner' }}</span>
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
              <tr v-for="stk in paymentStats.stakeholders" :key="stk.id">
                <td>
                  <div class="d-flex align-center gap-8">
                    <div class="avatar-small">{{ stk.name.charAt(0).toUpperCase() }}</div>
                    <strong>{{ stk.name }}</strong>
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
              <tr v-for="cp in paymentStats.partners" :key="cp.id">
                <td><strong>{{ cp.name }}</strong></td>
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
              <tr v-for="entry in paymentStats.reserve_ledger" :key="entry.id">
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
            <tr v-if="revenueEntries.length === 0">
              <td colspan="12" class="text-center py-24 text-muted">No revenue splits recorded yet.</td>
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
                <span v-if="isRevenueSettled(entry)" class="status-pill active">Settled</span>
                <span v-else class="status-pill inactive">Pending</span>
              </td>
              <td>
                <button
                  v-if="!isRevenueSettled(entry)"
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
        <span class="pagination-info">Page {{ revenuePage }} of {{ revenueTotalPages }} ({{ revenueEntries.length }} records)</span>
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
              <th>Equity Share (%)</th>
              <th>Bank/Payment Details</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="stakeholders.length === 0">
              <td colspan="5" class="text-center py-24 text-muted">No company owners registered.</td>
            </tr>
            <tr v-for="stk in stakeholders" :key="stk.id">
              <td class="text-semibold">{{ stk.name }}</td>
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
              <td class="text-semibold">{{ cp.name }}</td>
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
                  <span v-else-if="p.payout_type === 'Channel Partner'" class="text-semibold">{{ p.partner_name || 'Channel Partner' }}</span>
                  <span v-else class="text-semibold">{{ p.stakeholder_name || 'Owner' }}</span>
                  <small class="text-muted" v-if="p.payout_type === 'Stakeholder'">Earning from company</small>
                  <small class="text-muted" v-if="p.payout_type === 'Stakeholder Contribution'">Paid to company</small>
                  <small class="text-muted" v-if="p.payout_type === 'Channel Partner'">Partner</small>
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
              <label>Equity Ownership (%) <span class="required">*</span></label>
              <input v-model.number="stakeholderForm.payout_percentage" type="number" step="0.01" min="0.01" max="100" required placeholder="e.g. 50.00" />
              <small class="text-muted block mt-4">Share of company ownership (all active owners must total 100%)</small>
            </div>

            <div class="form-group">
              <label>Payment / Bank details</label>
              <textarea v-model="stakeholderForm.payment_details" placeholder="Include bank account number, IFC code, or UPI details..."></textarea>
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
        <form class="modal-form p-24" @submit.prevent="saveEditSplit">
          <p class="text-sm text-muted mb-16">
            Allocate 100% of this revenue across reserve, partners, and stakeholders. Once confirmed, this entry is settled and cannot be edited.
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
            <div class="form-group">
              <label>Reserve Fund Percentage (%) <span class="required">*</span></label>
              <input v-model.number="editSplitForm.reserve_percentage" type="number" step="0.1" min="0" max="100" required />
              <small class="text-muted block mt-4">Allocated: <strong>₹{{ formatCurrency(editSplitReserveAmount) }}</strong></small>
            </div>

            <!-- Channel Partner split -->
            <div class="form-group">
              <label>Channel Partner</label>
              <select v-model="editSplitForm.channel_partner_id">
                <option :value="null">-- No Commission Applied --</option>
                <option v-for="cp in activePartners" :key="cp.id" :value="cp.id">
                  {{ cp.name }}
                </option>
              </select>
            </div>

            <div class="form-group" v-if="editSplitForm.channel_partner_id">
              <label>Partner Commission Percentage (%) <span class="required">*</span></label>
              <input v-model.number="editSplitForm.partner_commission_percentage" type="number" step="0.1" min="0" max="100" required />
              <small class="text-muted block mt-4">Allocated: <strong>₹{{ formatCurrency(editSplitPartnerCommission) }}</strong></small>
            </div>

            <div class="form-group" :class="{ 'span-2': !editSplitForm.channel_partner_id }">
              <label>Stakeholders Pool (Remaining)</label>
              <div class="p-12 bg-soft border rounded text-semibold text-success">
                ₹{{ formatCurrency(editSplitStakeholderPool) }}
              </div>
            </div>

            <!-- Stakeholders Custom Splits -->
            <div class="form-group span-2 border-top pt-16">
              <h4 class="m-0 mb-12">
                {{ editSplitForm.amount < 0 ? 'Owner contribution to company (% of expense)' : 'Owner earnings split (% of revenue)' }}
              </h4>
              <p class="text-xs text-muted mb-16" v-if="editSplitForm.amount < 0">
                Each owner's share of this company expense — money owners fund into the business
                (not a payout). Defaults use equity split ({{ equitySplitSummary || 'configure owners first' }}).
              </p>
              <p class="text-xs text-muted mb-16" v-else>
                Each owner's share of income the company pays out. Defaults use equity split
                ({{ equitySplitSummary || 'configure owners first' }}).
              </p>
              
              <div class="grid-2col border rounded p-16">
                <div v-for="stk in editSplitForm.stakeholders" :key="stk.id" class="form-group">
                  <label>{{ stk.name }} Split (%)</label>
                  <input v-model.number="stk.percentage" type="number" step="0.01" min="0" max="100" placeholder="0.00" />
                  <small class="text-muted block mt-4">Receives: <strong>₹{{ formatCurrency(editSplitStakeholderShare(stk.percentage)) }}</strong></small>
                </div>
              </div>

              <div class="d-flex justify-between align-center mt-12 px-8">
                <span>Total Split Percentage (Reserve + Partner + Stakeholders):</span>
                <strong :class="editSplitTotalPercentageSum === 100 ? 'text-success' : 'text-danger'">
                  {{ editSplitTotalPercentageSum }}%
                  <small v-if="editSplitTotalPercentageSum !== 100"> (Must sum to exactly 100%)</small>
                </strong>
              </div>
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

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { apiGet, apiPost, apiPut } from '../api/client'

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
const stakeholders = ref([])
const partners = ref([])
const payoutLedger = ref([])
const auditLogs = ref([])

// Payment Dashboard states
const paymentStats = ref({
  stakeholders: [],
  partners: [],
  reserve_ledger: []
})

// Form states
const showEditSplitModal = ref(false)
const editSplitForm = reactive({
  revenue_id: null,
  amount: 0,
  reserve_percentage: 20.00,
  channel_partner_id: null,
  partner_commission_percentage: 0.00,
  stakeholders: []
})

const showStakeholderModal = ref(false)
const stakeholderForm = reactive({
  id: null,
  name: '',
  payout_percentage: 0,
  payment_details: '',
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

// Computeds
const activeStakeholders = computed(() => {
  return stakeholders.value.filter(s => s.is_active)
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

function isCompanyExpense(entry) {
  return parseFloat(entry.amount) < 0
}

const revenueSettlementStats = computed(() => {
  const settled = revenueEntries.value.filter((e) => isRevenueSettled(e))
  const pending = revenueEntries.value.filter((e) => !isRevenueSettled(e))
  const sumAbs = (list) =>
    Math.round(list.reduce((sum, e) => sum + Math.abs(parseFloat(e.amount) || 0), 0) * 100) / 100
  return {
    settledCount: settled.length,
    pendingCount: pending.length,
    totalCount: revenueEntries.value.length,
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
  return editSplitTotalPercentageSum.value !== 100 || editSplitStakeholderPool.value < 0
})

// Pagination states
const revenuePage = ref(1)
const revenueItemsPerPage = 10
const revenueTotalPages = computed(() => Math.ceil(revenueEntries.value.length / revenueItemsPerPage))
const paginatedRevenueEntries = computed(() => {
  const start = (revenuePage.value - 1) * revenueItemsPerPage
  const end = start + revenueItemsPerPage
  return revenueEntries.value.slice(start, end)
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

// Reset pages on active tab changes
watch(activeTab, () => {
  revenuePage.value = 1
  payoutPage.value = 1
  logsPage.value = 1
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

  const pts = await safe(() => apiGet('/api/treasury/channel-partners'), 'channel-partners')
  if (pts?.partners) partners.value = pts.partners

  const ledger = await safe(() => apiGet('/api/treasury/payouts'), 'payouts')
  if (ledger?.payouts) payoutLedger.value = ledger.payouts

  const logs = await safe(() => apiGet('/api/treasury/logs'), 'logs')
  if (logs?.logs) auditLogs.value = logs.logs

  const payStats = await safe(() => apiGet('/api/treasury/payment-stats'), 'payment-stats')
  if (payStats) paymentStats.value = payStats
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

function openEditSplitModal(entry) {
  if (isRevenueSettled(entry)) {
    alert('This revenue entry is already settled and cannot be edited.')
    return
  }
  editSplitForm.revenue_id = entry.id
  editSplitForm.amount = parseFloat(entry.amount)
  editSplitForm.reserve_percentage = parseFloat(entry.reserve_percentage || 20.00)
  editSplitForm.channel_partner_id = entry.channel_partner_id || null
  
  if (entry.channel_partner_id && entry.partner_commission) {
    editSplitForm.partner_commission_percentage = Math.round((parseFloat(entry.partner_commission) / parseFloat(entry.amount)) * 10000) / 100
  } else {
    editSplitForm.partner_commission_percentage = 0.00
  }

  const existingPayouts = payoutLedger.value.filter(p => p.revenue_id === entry.id && p.payout_type === 'Stakeholder')
  const amtAbs = Math.abs(parseFloat(entry.amount)) || 0
  const reservePct = parseFloat(entry.reserve_percentage || 20)
  const partnerPct = editSplitForm.channel_partner_id ? (parseFloat(editSplitForm.partner_commission_percentage) || 0) : 0
  const stakeholderPoolPct = Math.max(0, 100 - reservePct - partnerPct)

  editSplitForm.stakeholders = activeStakeholders.value.map(stk => {
    const existing = existingPayouts.find(p => p.stakeholder_id === stk.id)
    let percentage
    if (existing && amtAbs > 0) {
      percentage = Math.round((parseFloat(existing.amount) / amtAbs) * 10000) / 100
    } else {
      percentage = Math.round(stakeholderPoolPct * (parseFloat(stk.payout_percentage) || 0) / 100 * 100) / 100
    }
    return {
      id: stk.id,
      name: stk.name,
      percentage
    }
  })

  showEditSplitModal.value = true
}

async function saveEditSplit() {
  if (editSplitTotalPercentageSum.value !== 100) {
    alert('Split percentages must sum to exactly 100% before settlement.')
    return
  }
  if (!confirm('Confirm 100% settlement? This revenue entry will be locked and cannot be edited later.')) {
    return
  }
  try {
    const payload = {
      reserve_percentage: editSplitForm.reserve_percentage,
      channel_partner_id: editSplitForm.channel_partner_id,
      partner_commission_percentage: editSplitForm.partner_commission_percentage,
      stakeholders: editSplitForm.stakeholders.map(s => ({
        id: s.id,
        percentage: parseFloat(s.percentage || 0)
      }))
    }
    await apiPut(`/api/treasury/revenue/${editSplitForm.revenue_id}`, payload)
    showEditSplitModal.value = false
    await loadAllData()
  } catch (err) {
    alert(err.message || "Failed to settle revenue entry")
  }
}

function openStakeholderModal(stk = null) {
  if (stk) {
    Object.assign(stakeholderForm, {
      id: stk.id,
      name: stk.name,
      payout_percentage: stk.payout_percentage,
      payment_details: stk.payment_details,
      is_active: !!stk.is_active
    })
  } else {
    Object.assign(stakeholderForm, {
      id: null,
      name: '',
      payout_percentage: 0,
      payment_details: '',
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
  max-width: 1300px;
  margin: 0 auto;
  font-family: inherit;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.module-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  background: var(--primary-soft);
  color: var(--primary);
  padding: 3px 10px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.header-titles h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
}

.subtitle {
  margin: 4px 0 0 0;
}

/* Tabs */
.treasury-tabs-wrapper {
  border-bottom: 1px solid var(--line);
}

.treasury-tabs {
  display: flex;
  gap: 12px;
}

.tab-btn {
  background: none;
  border: none;
  padding: 12px 18px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--primary);
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.tab-icon {
  display: inline-flex;
  align-items: center;
}

/* Revenue log settlement summary */
.revenue-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.revenue-summary-card {
  background: var(--surface-soft, #f8fafc);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.revenue-summary-value {
  font-size: 1.5rem;
  line-height: 1.2;
  font-weight: 700;
}

/* KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
}

.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-content h3 {
  margin: 4px 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
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
  gap: 24px;
}

@media (max-width: 768px) {
  .grid-2col {
    grid-template-columns: 1fr;
  }
}

.dashboard-block {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.block-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.block-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.block-body {
  padding: 24px;
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
  border-collapse: collapse;
}

.grid-table th {
  text-align: left;
  background: var(--surface-soft);
  font-weight: 600;
  font-size: 13px;
  color: var(--text-muted);
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
}

.grid-table td {
  padding: 16px 20px;
  font-size: 14px;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
}

.grid-table tr:hover td {
  background: rgba(0,0,0,0.01);
}

/* Badges / Tag pills */
.type-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
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
  padding: 4px 10px;
  border-radius: 50px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
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
  background: var(--surface-soft);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.pay-kpi-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.pay-kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  border-radius: 16px 16px 0 0;
}

.pay-fund-card::before    { background: linear-gradient(90deg, #10b981, #059669); }
.pay-stakeholder-card::before { background: linear-gradient(90deg, #6366f1, #4f46e5); }
.pay-partner-card::before { background: linear-gradient(90deg, #f59e0b, #d97706); }

.pay-kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.pay-kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
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
}

.pay-kpi-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.pay-kpi-value {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 10px 0;
  line-height: 1.1;
  color: var(--text-primary);
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
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.pay-kpi-chip.green  { background: #d1fae5; color: #065f46; }
.pay-kpi-chip.red    { background: #fee2e2; color: #991b1b; }
.pay-kpi-chip.orange { background: #fef3c7; color: #92400e; }

.pay-section {
  background: var(--surface);
}

.avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
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
.pagination-btn {
  padding: 6px 14px;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-primary, #0f172a);
  font-weight: 600;
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
  font-weight: 500;
}
</style>
