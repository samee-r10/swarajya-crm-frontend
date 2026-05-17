<template>
  <div class="finance-dashboard">
    <section class="page-header">
      <div>
        <p class="eyebrow">Financial Overview</p>
        <h1>Finance Dashboard</h1>
        <p class="muted">Monitor your revenue, expenses, and invoices.</p>
      </div>
      <div class="action-row">
        <RouterLink class="button" to="/finance/invoices/new">Generate Invoice</RouterLink>
        <RouterLink class="button secondary" to="/finance/transactions/new">New Transaction</RouterLink>
      </div>
    </section>

    <section v-if="metrics" class="metric-grid">
      <div class="metric-card">
        <span class="label">Total Revenue</span>
        <strong class="value">{{ money(metrics.total_revenue) }}</strong>
        <span class="trend pos">↑ 12% vs last month</span>
      </div>
      <div class="metric-card">
        <span class="label">Total Expenses</span>
        <strong class="value">{{ money(metrics.total_expenses) }}</strong>
        <span class="trend neg">↓ 5% vs last month</span>
      </div>
      <div class="metric-card">
        <span class="label">Bank Balance</span>
        <strong class="value">{{ money(metrics.bank_balance) }}</strong>
        <span class="muted small">Across all accounts</span>
      </div>
      <div class="metric-card highlight">
        <span class="label">Cash On Hand</span>
        <strong class="value">{{ money(metrics.cash_on_hand) }}</strong>
      </div>
    </section>

    <section class="modules-grid">
      <RouterLink class="module-tile" to="/finance/invoices">
        <div class="icon-wrap inv"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/></svg></div>
        <div class="content">
          <strong>Invoices</strong>
          <span>Manage sales invoices and receivables.</span>
        </div>
      </RouterLink>

      <RouterLink class="module-tile" to="/finance/transactions">
        <div class="icon-wrap ledger"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" fill="currentColor"/></svg></div>
        <div class="content">
          <strong>Transaction Ledger</strong>
          <span>View income and expense records.</span>
        </div>
      </RouterLink>

      <RouterLink class="module-tile" to="/finance/vendors">
        <div class="icon-wrap vendor"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/></svg></div>
        <div class="content">
          <strong>Vendors</strong>
          <span>Manage supplier details and payouts.</span>
        </div>
      </RouterLink>

      <RouterLink class="module-tile" to="/finance/reports/general-ledger">
        <div class="icon-wrap gl"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/></svg></div>
        <div class="content">
          <strong>General Ledger Report</strong>
          <span>Full journal entry register with balances.</span>
        </div>
      </RouterLink>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { apiGet } from '../api/client'

const metrics = ref(null)

onMounted(async () => {
  try {
    const data = await apiGet('/api/finance')
    metrics.value = data.metrics
  } catch (e) {
    console.error('Failed to load finance metrics')
  }
})

function money(amount) {
  return `$${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
</script>

<style scoped>
.finance-dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.metric-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1);
}

.metric-card .label {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.metric-card .value {
  font-size: 28px;
  font-weight: 900;
  color: var(--primary);
  margin-bottom: 8px;
}

.trend { font-size: 12px; font-weight: 700; }
.trend.pos { color: #166534; }
.trend.neg { color: #991b1b; }

.metric-card.highlight {
  background: var(--primary);
  border-color: var(--primary);
}
.metric-card.highlight .label, .metric-card.highlight .value { color: white; }

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.module-tile {
  background: white;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 20px;
  text-decoration: none;
  transition: all 0.2s;
}

.module-tile:hover {
  border-color: var(--primary);
  background: #f8fafc;
}

.icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.icon-wrap.inv { background: #6366f1; }
.icon-wrap.ledger { background: #10b981; }
.icon-wrap.vendor { background: #f59e0b; }
.icon-wrap.gl { background: #e11d48; }

.content strong { display: block; font-size: 18px; color: var(--primary); margin-bottom: 4px; }
.content span { font-size: 14px; color: var(--muted); }
</style>
