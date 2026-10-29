<template>
  <div class="dashboard">
    <!-- Welcome Header -->
    <CrmPageHeader
      eyebrow="Performance Overview"
      :title="`Welcome back, ${userName}`"
      description="Track sales momentum, delivery work, approvals, and revenue focus from one command center."
    >
      <template #actions>
        <RouterLink class="btn-tactile btn-tactile-primary action-btn-add" to="/customers/new">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          New Customer
        </RouterLink>
      </template>
    </CrmPageHeader>

    <!-- Metrics Grid -->
    <section v-if="loading" class="dashboard-loading-card bento-card">
      <ModernSpinner size="lg" :show-core="true" label="Analyzing workspace data..." />
    </section>

    <template v-else>
      <!-- Quick Action Strip (Kokonut UI Tactile Bento Tiles) -->
      <section class="quick-action-strip" aria-label="Quick actions">
        <RouterLink to="/opportunities" class="quick-action bento-card">
          <div class="quick-action-icon blue">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
            </svg>
          </div>
          <div class="quick-action-text">
            <span>Pipeline</span>
            <strong>Review Deals</strong>
          </div>
          <svg viewBox="0 0 24 24" width="14" height="14" class="quick-action-arrow" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </RouterLink>

        <RouterLink to="/finance/invoices" class="quick-action bento-card">
          <div class="quick-action-icon emerald">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
          </div>
          <div class="quick-action-text">
            <span>Revenue</span>
            <strong>Invoices</strong>
          </div>
          <svg viewBox="0 0 24 24" width="14" height="14" class="quick-action-arrow" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </RouterLink>

        <RouterLink to="/approvals" class="quick-action bento-card">
          <div class="quick-action-icon amber">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
          </div>
          <div class="quick-action-text">
            <span>Approvals</span>
            <strong>Pending Reviews</strong>
          </div>
          <svg viewBox="0 0 24 24" width="14" height="14" class="quick-action-arrow" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </RouterLink>

        <RouterLink to="/treasury/payables" class="quick-action bento-card">
          <div class="quick-action-icon purple">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
          <div class="quick-action-text">
            <span>Treasury</span>
            <strong>Payables</strong>
          </div>
          <svg viewBox="0 0 24 24" width="14" height="14" class="quick-action-arrow" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </RouterLink>
      </section>

      <!-- Bento KPI Grid (Vengence / Kokonut UI) -->
      <section class="metrics-grid">
        <CrmKpiCard label="Total Customers" :value="data.metrics.customers" meta="Accounts under management" tone="blue">
          <template #icon>
            <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" fill="currentColor"/></svg>
          </template>
        </CrmKpiCard>
        <CrmKpiCard label="Open Opportunities" :value="data.metrics.open_opportunities" meta="Active sales motion" tone="green">
          <template #icon>
            <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Zm1 1v9l6.4 6.4 1.4-1.4-5-5H22A9 9 0 0 0 13 3Z" fill="currentColor"/></svg>
          </template>
        </CrmKpiCard>
        <CrmKpiCard label="Active Projects" :value="data.metrics.active_projects" meta="Delivery work in flight" tone="amber">
          <template #icon>
            <svg viewBox="0 0 24 24"><path d="M10 4h4v3h-4V4ZM4 9h16v11H4V9Zm2 2v7h12v-7H6Zm10-7h2a2 2 0 0 1 2 2v1h-2V6h-2V4ZM6 4h2v2H6v1H4V6a2 2 0 0 1 2-2Z" fill="currentColor"/></svg>
          </template>
        </CrmKpiCard>
        <CrmKpiCard label="Total Pipeline" :value="pipelineTotal" meta="Forecasted deal value" tone="violet">
          <template #icon>
            <svg viewBox="0 0 24 24"><path d="M3 6h18v12H3V6Zm2 2v8h14V8H5Zm7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6-5a2 2 0 0 0 2-2H6v2Zm10-2a2 2 0 0 0 2 2V8h-2Zm2 6a2 2 0 0 0-2 2h2v-2ZM6 16h2a2 2 0 0 0-2-2v2Z" fill="currentColor"/></svg>
          </template>
        </CrmKpiCard>
      </section>

      <!-- Executive Split Grid (Revenue & Pending Approvals) -->
      <section class="executive-summary-grid">
        <!-- Revenue Overview -->
        <article class="bento-card summary-panel">
          <div class="panel-header">
            <div class="panel-title-wrap">
              <div class="panel-icon-badge emerald">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                </svg>
              </div>
              <div>
                <h2 class="panel-title">Revenue Overview</h2>
                <p class="panel-subtitle">Pipeline value grouped by operational currency.</p>
              </div>
            </div>
          </div>
          <div class="summary-stack">
            <div v-for="item in data.metrics.pipeline_values" :key="item.currency" class="summary-row">
              <div class="currency-tag">
                <span class="currency-dot"></span>
                <strong>{{ item.currency }}</strong>
              </div>
              <strong class="currency-val">{{ Number(item.total || 0).toLocaleString() }}</strong>
            </div>
            <div v-if="!data.metrics.pipeline_values.length" class="summary-row empty">
              <span>No currency data recorded</span>
              <strong>0</strong>
            </div>
          </div>
        </article>

        <!-- Pending Approvals Card -->
        <RouterLink class="bento-card summary-panel approval-summary-card" to="/approvals">
          <div class="panel-header">
            <div class="panel-title-wrap">
              <div class="panel-icon-badge amber">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
                </svg>
              </div>
              <div>
                <h2 class="panel-title">Pending Approvals</h2>
                <p class="panel-subtitle">Assigned items awaiting your authorization.</p>
              </div>
            </div>
            <div class="approval-total-badge">
              <span>{{ pendingApprovals.total }}</span>
            </div>
          </div>

          <div class="approval-breakdown">
            <div class="approval-breakdown-row">
              <div class="breakdown-label">
                <span class="breakdown-dot claims"></span>
                <span>Expense Claims</span>
              </div>
              <strong class="breakdown-val">{{ pendingApprovals.breakdown.claims }}</strong>
            </div>
            <div class="approval-breakdown-row">
              <div class="breakdown-label">
                <span class="breakdown-dot stakeholder"></span>
                <span>Stakeholder Payouts</span>
              </div>
              <strong class="breakdown-val">{{ pendingApprovals.breakdown.stakeholder_payouts }}</strong>
            </div>
            <div class="approval-breakdown-row">
              <div class="breakdown-label">
                <span class="breakdown-dot cp"></span>
                <span>Channel Partner (CP) Payouts</span>
              </div>
              <strong class="breakdown-val">{{ pendingApprovals.breakdown.cp_payments }}</strong>
            </div>
          </div>

          <div class="approval-card-footer">
            <span>Open approval queue</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </div>
        </RouterLink>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { apiGet } from '../api/client'
import CrmKpiCard from '../components/CrmKpiCard.vue'
import CrmPageHeader from '../components/CrmPageHeader.vue'

const loading = ref(true)
let refreshTimer = null
const data = reactive({
  metrics: { customers: 0, open_opportunities: 0, active_projects: 0, pipeline_values: [] },
  pending_approvals: { total: 0, breakdown: { claims: 0, stakeholder_payouts: 0, cp_payments: 0 } }
})

const userName = computed(() => {
  const user = window.localStorage.getItem('lms_user')
  if (!user) return ''
  try {
    return JSON.parse(user).full_name.split(' ')[0]
  } catch {
    return ''
  }
})

const pipelineTotal = computed(() => {
  if (!data.metrics.pipeline_values.length) return '0'
  return data.metrics.pipeline_values.map((item) => `${item.currency} ${Number(item.total || 0).toLocaleString()}`).join(', ')
})

const pendingApprovals = computed(() => ({
  total: Number(data.pending_approvals?.total || 0),
  breakdown: {
    claims: Number(data.pending_approvals?.breakdown?.claims || 0),
    stakeholder_payouts: Number(data.pending_approvals?.breakdown?.stakeholder_payouts || 0),
    cp_payments: Number(data.pending_approvals?.breakdown?.cp_payments || 0)
  }
}))

let lastLoadedTime = 0

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && Date.now() - lastLoadedTime > 45000) {
    loadDashboard()
  }
}

onMounted(() => {
  loadDashboard()
  refreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadDashboard()
    }
  }, 60000)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

async function loadDashboard() {
  try {
    const dashboardData = await apiGet('/api/dashboard', { bypassCache: true })
    Object.assign(data, dashboardData)
    lastLoadedTime = Date.now()
  } catch (error) {
    console.error('Failed to load dashboard', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dashboard {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-btn-add {
  padding: 8px 18px;
  font-size: 13.5px;
  font-weight: 600;
  border-radius: 10px;
}

/* Loading Card */
.dashboard-loading-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 380px;
  background: #ffffff;
  border-radius: 18px;
}

/* =========================================================
   QUICK ACTION STRIP (Kokonut Bento Micro-Pills)
   ========================================================= */
.quick-action-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 14px;
  text-decoration: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 4px 12px rgba(15, 23, 42, 0.03);
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.quick-action:hover {
  transform: translateY(-2px);
  border-color: rgba(2, 132, 199, 0.35);
  box-shadow: 0 10px 24px -4px rgba(15, 23, 42, 0.08), 0 0 16px rgba(2, 132, 199, 0.06);
}

.quick-action-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.22s ease;
}

.quick-action:hover .quick-action-icon {
  transform: scale(1.08);
}

.quick-action-icon.blue {
  background: rgba(2, 132, 199, 0.1);
  color: #0284c7;
}

.quick-action-icon.emerald {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.quick-action-icon.amber {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.quick-action-icon.purple {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.quick-action-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.quick-action-text span {
  font-family: var(--font-sans, sans-serif);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
}

.quick-action-text strong {
  font-family: var(--font-display, 'Outfit', sans-serif);
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-action-arrow {
  color: #cbd5e1;
  flex-shrink: 0;
  transition: transform 0.2s ease, color 0.2s ease;
}

.quick-action:hover .quick-action-arrow {
  color: #0284c7;
  transform: translateX(3px);
}

/* =========================================================
   METRICS GRID
   ========================================================= */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* =========================================================
   PANELS & BENTO CARDS
   ========================================================= */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.panel-icon-badge.emerald {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.panel-icon-badge.amber {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.panel-title {
  font-family: var(--font-display, 'Outfit', sans-serif);
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
  margin: 0;
}

.panel-subtitle {
  font-family: var(--font-sans, sans-serif);
  font-size: 12.5px;
  color: #64748b;
  margin: 2px 0 0 0;
}

/* =========================================================
   EXECUTIVE SPLIT GRID
   ========================================================= */
.executive-summary-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(340px, 1fr);
  gap: 18px;
}

.summary-panel {
  padding: 24px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 6px 20px -4px rgba(15, 23, 42, 0.04);
}

.summary-stack,
.approval-breakdown {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  background: #fafcff;
  transition: all 0.2s ease;
}

.summary-row:hover {
  background: #ffffff;
  border-color: rgba(2, 132, 199, 0.3);
  box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.05);
}

.currency-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.currency-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

.currency-tag strong {
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.currency-val {
  font-family: var(--font-display, 'Outfit', sans-serif);
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

/* Approval Card */
.approval-summary-card {
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.26s cubic-bezier(0.16, 1, 0.3, 1);
}

.approval-summary-card:hover {
  transform: translateY(-2px);
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.08), 0 0 20px rgba(245, 158, 11, 0.08);
}

.approval-total-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 38px;
  padding: 0 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  font-family: var(--font-display, 'Outfit', sans-serif);
  font-size: 20px;
  font-weight: 800;
  color: #d97706;
}

.approval-breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  background: #ffffff;
  transition: all 0.18s ease;
}

.approval-breakdown-row:hover {
  background: #fdfefe;
  border-color: rgba(2, 132, 199, 0.25);
}

.breakdown-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.breakdown-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.breakdown-dot.claims {
  background: #f59e0b;
}

.breakdown-dot.stakeholder {
  background: #0284c7;
}

.breakdown-dot.cp {
  background: #8b5cf6;
}

.breakdown-val {
  font-family: var(--font-mono, monospace);
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.approval-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  margin-top: 8px;
  border-top: 1px solid rgba(241, 245, 249, 1);
  font-size: 12px;
  font-weight: 600;
  color: #0284c7;
}

.approval-card-footer svg {
  transition: transform 0.2s ease;
}

.approval-summary-card:hover .approval-card-footer svg {
  transform: translateX(4px);
}

/* =========================================================
   RESPONSIVENESS
   ========================================================= */
@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .quick-action-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .executive-summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .metrics-grid,
  .quick-action-strip {
    grid-template-columns: 1fr;
  }
}
</style>
