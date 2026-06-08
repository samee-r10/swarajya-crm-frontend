<template>
  <div class="dashboard">
    <!-- Welcome Header -->
    <CrmPageHeader
      eyebrow="Performance Overview"
      :title="`Welcome back, ${userName}`"
      description="Track sales momentum, delivery work, reminders, and revenue focus from one command center."
    >
      <template #actions>
        <RouterLink class="button" to="/customers/new">
          <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
          New Customer
        </RouterLink>
      </template>
    </CrmPageHeader>

    <!-- Metrics Grid -->
    <section v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Analyzing your data...</p>
    </section>

    <template v-else>
      <section class="quick-action-strip" aria-label="Quick actions">
        <RouterLink to="/opportunities" class="quick-action">
          <span>Pipeline</span>
          <strong>Review deals</strong>
        </RouterLink>
        <RouterLink to="/finance/invoices" class="quick-action">
          <span>Revenue</span>
          <strong>Invoices</strong>
        </RouterLink>
        <RouterLink to="/claims/approvals" class="quick-action">
          <span>Approvals</span>
          <strong>Pending claims</strong>
        </RouterLink>
        <RouterLink to="/treasury/payables" class="quick-action">
          <span>Treasury</span>
          <strong>Payables</strong>
        </RouterLink>
      </section>

      <section class="metrics-grid">
        <CrmKpiCard label="Total Customers" :value="data.metrics.customers" meta="Accounts under management" tone="blue">
          <template #icon><svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" fill="currentColor"/></svg></template>
        </CrmKpiCard>
        <CrmKpiCard label="Open Opportunities" :value="data.metrics.open_opportunities" meta="Active sales motion" tone="green">
          <template #icon><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Zm1 1v9l6.4 6.4 1.4-1.4-5-5H22A9 9 0 0 0 13 3Z" fill="currentColor"/></svg></template>
        </CrmKpiCard>
        <CrmKpiCard label="Active Projects" :value="data.metrics.active_projects" meta="Delivery work in flight" tone="amber">
          <template #icon><svg viewBox="0 0 24 24"><path d="M10 4h4v3h-4V4ZM4 9h16v11H4V9Zm2 2v7h12v-7H6Zm10-7h2a2 2 0 0 1 2 2v1h-2V6h-2V4ZM6 4h2v2H6v1H4V6a2 2 0 0 1 2-2Z" fill="currentColor"/></svg></template>
        </CrmKpiCard>
        <CrmKpiCard label="Total Pipeline" :value="pipelineTotal" meta="Forecasted deal value" tone="violet">
          <template #icon><svg viewBox="0 0 24 24"><path d="M3 6h18v12H3V6Zm2 2v8h14V8H5Zm7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6-5a2 2 0 0 0 2-2H6v2Zm10-2a2 2 0 0 0 2 2V8h-2Zm2 6a2 2 0 0 0-2 2h2v-2ZM6 16h2a2 2 0 0 0-2-2v2Z" fill="currentColor"/></svg></template>
        </CrmKpiCard>
      </section>

      <section class="pipeline-panel panel">
        <div class="panel-header">
          <div>
            <h2>Sales Pipeline</h2>
            <p class="muted">Deal flow by current stage from your latest opportunities.</p>
          </div>
          <span class="pill stage">{{ primaryPipeline }}</span>
        </div>
        <div class="pipeline-bars">
          <div v-for="stage in stageSummary" :key="stage.name" class="pipeline-row">
            <div class="pipeline-row-label">
              <strong>{{ stage.name }}</strong>
              <span>{{ stage.count }} deals</span>
            </div>
            <div class="pipeline-track">
              <span :style="{ width: `${stage.percent}%` }"></span>
            </div>
          </div>
        </div>
      </section>

      <section class="executive-summary-grid">
        <article class="panel summary-panel">
          <div class="panel-header">
            <div>
              <h2>Revenue Overview</h2>
              <p class="muted">Pipeline value grouped by currency.</p>
            </div>
          </div>
          <div class="summary-stack">
            <div v-for="item in data.metrics.pipeline_values" :key="item.currency" class="summary-row">
              <span>{{ item.currency }}</span>
              <strong>{{ Number(item.total || 0).toLocaleString() }}</strong>
            </div>
            <div v-if="!data.metrics.pipeline_values.length" class="summary-row">
              <span>Pipeline</span>
              <strong>0</strong>
            </div>
          </div>
        </article>

        <article class="panel summary-panel">
          <div class="panel-header">
            <div>
              <h2>Pending Approvals</h2>
              <p class="muted">Mobile-ready action queues for stakeholders and finance users.</p>
            </div>
          </div>
          <div class="approval-links">
            <RouterLink to="/claims/approvals">Claim approvals</RouterLink>
            <RouterLink to="/treasury/stakeholder-payouts/approvals">Payout approvals</RouterLink>
            <RouterLink to="/treasury/payables">Payable settlements</RouterLink>
          </div>
        </article>

        <article class="panel summary-panel">
          <div class="panel-header">
            <div>
              <h2>Recent Activities</h2>
              <p class="muted">A compact view of customer, opportunity, and project movement.</p>
            </div>
          </div>
          <div class="activity-feed">
            <div><span></span><strong>{{ data.recent_opportunities.length }}</strong> recent opportunity updates</div>
            <div><span></span><strong>{{ data.upcoming_projects.length }}</strong> project milestones to track</div>
            <div><span></span><strong>{{ data.metrics.customers }}</strong> customer records available</div>
          </div>
        </article>
      </section>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Recent Opportunities -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Recent Opportunities</h2>
              <p class="muted">The latest deals added to your pipeline.</p>
            </div>
            <RouterLink to="/opportunities" class="button-link">View All</RouterLink>
          </div>
          <div class="list">
            <RouterLink 
              v-for="opp in data.recent_opportunities" 
              :key="opp.id" 
              class="dashboard-item" 
              :to="`/opportunities/${opp.id}`"
            >
              <div class="item-content">
                <strong>{{ opp.title }}</strong>
                <span class="muted">{{ opp.company_name }}</span>
              </div>
              <div class="item-meta">
                <span class="pill stage">{{ opp.stage }}</span>
              </div>
            </RouterLink>
            <CrmEmptyState v-if="!data.recent_opportunities.length" title="No recent opportunities" description="New deals will appear here as your team adds them." />
          </div>
        </div>

        <!-- Upcoming Projects -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Upcoming Projects</h2>
              <p class="muted">Delivery milestones in the next 30 days.</p>
            </div>
            <RouterLink to="/projects" class="button-link">View All</RouterLink>
          </div>
          <div class="list">
            <RouterLink 
              v-for="project in data.upcoming_projects" 
              :key="project.id" 
              class="dashboard-item" 
              :to="`/projects/${project.id}`"
            >
              <div class="item-content">
                <strong>{{ project.project_name }}</strong>
                <span class="muted">{{ project.company_name }}</span>
              </div>
              <div class="item-meta">
                <span class="date">{{ formatDate(project.delivery_timeline) }}</span>
              </div>
            </RouterLink>
            <CrmEmptyState v-if="!data.upcoming_projects.length" title="No upcoming projects" description="Delivery milestones will appear here when project dates are available." />
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Follow-up Reminders</h2>
              <p class="muted">Suggested focus items based on active records.</p>
            </div>
          </div>
          <div class="reminder-list">
            <div class="reminder-item">
              <span class="reminder-dot urgent"></span>
              <div><strong>{{ data.metrics.open_opportunities }} opportunities need movement</strong><span class="muted">Review stage, next step, and owner notes.</span></div>
            </div>
            <div class="reminder-item">
              <span class="reminder-dot"></span>
              <div><strong>{{ data.upcoming_projects.length }} upcoming project milestones</strong><span class="muted">Confirm timelines before client follow-ups.</span></div>
            </div>
            <div class="reminder-item">
              <span class="reminder-dot success"></span>
              <div><strong>Keep customer records complete</strong><span class="muted">Validate contact details and billing addresses.</span></div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiGet } from '../api/client'
import CrmEmptyState from '../components/CrmEmptyState.vue'
import CrmKpiCard from '../components/CrmKpiCard.vue'
import CrmPageHeader from '../components/CrmPageHeader.vue'

const loading = ref(true)
const data = reactive({
  metrics: { customers: 0, open_opportunities: 0, active_projects: 0, pipeline_values: [] },
  recent_opportunities: [],
  upcoming_projects: []
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
const primaryPipeline = computed(() => {
  const first = data.metrics.pipeline_values[0]
  if (!first) return 'No value yet'
  return `${first.currency} ${Number(first.total || 0).toLocaleString()}`
})
const stageSummary = computed(() => {
  const counts = data.recent_opportunities.reduce((acc, opp) => {
    const stage = opp.stage || 'Unqualified'
    acc[stage] = (acc[stage] || 0) + 1
    return acc
  }, {})
  const entries = Object.entries(counts)
  if (!entries.length) {
    return [
      { name: 'Discussion', count: 0, percent: 12 },
      { name: 'Commercial negotiation', count: 0, percent: 12 },
      { name: 'Contractual negotiation', count: 0, percent: 12 }
    ]
  }
  const max = Math.max(...entries.map(([, count]) => count), 1)
  return entries.map(([name, count]) => ({ name, count, percent: Math.max(12, Math.round((count / max) * 100)) }))
})

onMounted(async () => {
  try {
    const dashboardData = await apiGet('/api/dashboard')
    Object.assign(data, dashboardData)
  } catch (error) {
    console.error('Failed to load dashboard', error)
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr) {
  if (!dateStr) return 'No date'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.welcome-section h1 {
  font-size: 34px;
  margin: 8px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 22px;
}

.quick-action-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.quick-action {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  display: grid;
  gap: 2px;
  padding: 14px 16px;
}

.quick-action:hover {
  border-color: rgba(29, 95, 209, 0.28);
  background: #f6faff;
}

.quick-action span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 850;
  text-transform: uppercase;
}

.quick-action strong {
  color: var(--heading);
}

.metric-card {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 20px;
  display: grid;
  gap: 14px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
  display: grid;
  place-items: center;
  background: var(--primary-soft);
  color: var(--primary);
}

.card-icon svg {
  height: 22px;
  width: 22px;
}

.card-info span {
  display: block;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 4px;
}

.card-info strong {
  color: var(--heading);
  font-size: 27px;
  font-weight: 800;
}

.card-trend {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.card-trend.positive {
  color: #16a34a;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.executive-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 18px;
}

.summary-panel {
  min-height: 210px;
}

.summary-stack,
.approval-links,
.activity-feed {
  display: grid;
  gap: 10px;
}

.summary-row {
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  padding: 12px;
}

.summary-row span,
.activity-feed div {
  color: var(--muted);
}

.summary-row strong {
  color: var(--heading);
}

.approval-links a {
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--primary);
  font-weight: 850;
  padding: 12px;
}

.approval-links a:hover {
  background: var(--primary-soft);
}

.activity-feed div {
  align-items: center;
  display: flex;
  gap: 10px;
}

.activity-feed span {
  background: var(--accent);
  border-radius: 999px;
  height: 8px;
  width: 8px;
}

.activity-feed strong {
  color: var(--heading);
}

.panel {
  padding: 22px;
  border-radius: var(--radius);
}

.panel-header {
  margin-bottom: 18px;
}

.panel-header h2 {
  font-size: 20px;
  margin-bottom: 4px;
}

.dashboard-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  text-decoration: none;
  transition: background 0.2s;
}

.dashboard-item:hover {
  background: #f8fafc;
}

.item-content strong {
  display: block;
  font-size: 15px;
  color: var(--text);
}

.item-meta .date {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}

.button-link {
  color: var(--primary);
  font-weight: 800;
  text-decoration: none;
  font-size: 14px;
}

.button-link:hover {
  text-decoration: none;
}

.pipeline-panel {
  margin-bottom: 18px;
}

.pipeline-bars {
  display: grid;
  gap: 14px;
}

.pipeline-row {
  align-items: center;
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(180px, 260px) minmax(0, 1fr);
}

.pipeline-row-label {
  display: grid;
  gap: 2px;
}

.pipeline-row-label strong {
  color: var(--heading);
}

.pipeline-row-label span {
  color: var(--muted);
  font-size: 12px;
}

.pipeline-track {
  background: #eef3f8;
  border-radius: 999px;
  height: 10px;
  overflow: hidden;
}

.pipeline-track span {
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: inherit;
  display: block;
  height: 100%;
}

.reminder-list {
  display: grid;
  gap: 14px;
}

.reminder-item {
  align-items: flex-start;
  display: flex;
  gap: 12px;
}

.reminder-item strong,
.reminder-item span {
  display: block;
}

.reminder-dot {
  background: var(--primary);
  border-radius: 999px;
  box-shadow: 0 0 0 5px var(--primary-soft);
  flex: 0 0 9px;
  height: 9px;
  margin-top: 7px;
  width: 9px;
}

.reminder-dot.urgent {
  background: #d97706;
  box-shadow: 0 0 0 5px var(--warning-bg);
}

.reminder-dot.success {
  background: #16a34a;
  box-shadow: 0 0 0 5px var(--success-bg);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: var(--muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--surface-soft);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1100px) {
  .metrics-grid,
  .quick-action-strip,
  .executive-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .dashboard-header,
  .pipeline-row {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .metrics-grid,
  .quick-action-strip,
  .executive-summary-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    flex-direction: column;
  }
}
</style>
