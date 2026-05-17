<template>
  <div class="dashboard">
    <!-- Welcome Header -->
    <header class="dashboard-header">
      <div class="welcome-section">
        <p class="eyebrow">Performance Overview</p>
        <h1>Welcome back, {{ userName }}</h1>
        <p class="muted">Here's what's happening with your sales pipeline today.</p>
      </div>
      <div class="header-actions">
        <RouterLink class="button" to="/customers/new">
          <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
          New Customer
        </RouterLink>
      </div>
    </header>

    <!-- Metrics Grid -->
    <section v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Analyzing your data...</p>
    </section>

    <template v-else>
      <section class="metrics-grid">
        <div class="metric-card customers">
          <div class="card-icon">👥</div>
          <div class="card-info">
            <span>Total Customers</span>
            <strong>{{ data.metrics.customers }}</strong>
          </div>
          <div class="card-trend positive">↑ 12% vs last month</div>
        </div>
        <div class="metric-card opportunities">
          <div class="card-icon">🎯</div>
          <div class="card-info">
            <span>Open Opportunities</span>
            <strong>{{ data.metrics.open_opportunities }}</strong>
          </div>
          <div class="card-trend">Ongoing discussions</div>
        </div>
        <div class="metric-card projects">
          <div class="card-icon">🏗️</div>
          <div class="card-info">
            <span>Active Projects</span>
            <strong>{{ data.metrics.active_projects }}</strong>
          </div>
          <div class="card-trend">4 nearing delivery</div>
        </div>
        <div class="metric-card revenue">
          <div class="card-icon">💰</div>
          <div class="card-info">
            <span>Total Pipeline</span>
            <strong>{{ pipelineTotal }}</strong>
          </div>
          <div class="card-trend positive">Strong growth</div>
        </div>
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
            <div v-if="!data.recent_opportunities.length" class="empty-state">
              No recent opportunities.
            </div>
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
            <div v-if="!data.upcoming_projects.length" class="empty-state">
              No upcoming projects.
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
  margin-bottom: 40px;
}

.welcome-section h1 {
  font-size: 42px;
  margin: 8px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}

.metric-card {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 24px;
  display: grid;
  gap: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 28px;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #f8fafc;
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
  font-size: 32px;
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
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.panel {
  padding: 32px;
  border-radius: 16px;
}

.panel-header {
  margin-bottom: 24px;
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
  border-bottom: 1px solid var(--line);
  text-decoration: none;
  transition: background 0.2s;
}

.dashboard-item:last-child {
  border-bottom: none;
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
  text-decoration: underline;
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
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
