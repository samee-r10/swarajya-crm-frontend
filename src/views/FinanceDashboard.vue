<template>
  <div class="finance-dashboard">
    <section class="page-header">
      <div>
        <p class="eyebrow">Financial Overview</p>
        <h1>Finance Dashboard</h1>
        <p class="muted">Monitor your revenue, expenses, and invoices.</p>
      </div>
      <div class="action-row">
        <!-- Currency View Toggle Selection -->
        <div class="currency-toggle-wrap" style="display: flex; align-items: center; background: white; border: 1px solid var(--line); padding: 4px 12px; border-radius: 30px; margin-right: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
          <span class="muted small" style="font-weight: 700; margin-right: 8px; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Currency:</span>
          <div class="toggle-buttons" style="display: flex; background: #f1f5f9; padding: 2px; border-radius: 20px;">
            <button 
              type="button" 
              class="toggle-btn" 
              :class="{ active: viewCurrency === 'USD' }" 
              @click="viewCurrency = 'USD'"
              style="border: none; background: none; padding: 6px 16px; font-size: 11px; font-weight: 800; cursor: pointer; border-radius: 18px; transition: all 0.2s;"
            >
              USD
            </button>
            <button 
              type="button" 
              class="toggle-btn" 
              :class="{ active: viewCurrency === 'INR' }" 
              @click="viewCurrency = 'INR'"
              style="border: none; background: none; padding: 6px 16px; font-size: 11px; font-weight: 800; cursor: pointer; border-radius: 18px; transition: all 0.2s;"
            >
              INR
            </button>
          </div>
        </div>

        <RouterLink class="button" to="/finance/invoices/new">Generate Invoice</RouterLink>
        <RouterLink class="button secondary" to="/finance/transactions?new=1">New Transaction</RouterLink>
      </div>
    </section>

    <section v-if="metrics" class="metric-grid">
      <div class="metric-card">
        <span class="label">Total Revenue</span>
        <strong class="value">
          {{ viewCurrency === 'USD' ? money(metrics.total_revenue, 'USD') : money(metrics.total_revenue_inr, 'INR') }}
        </strong>
        <span class="sub-value">
          {{ viewCurrency === 'USD' ? money(metrics.total_revenue_inr, 'INR') : money(metrics.total_revenue, 'USD') }}
        </span>
        <span class="trend pos">↑ 12% vs last month</span>
      </div>
      <div class="metric-card">
        <span class="label">Total Expenses</span>
        <strong class="value">
          {{ viewCurrency === 'USD' ? money(metrics.total_expenses, 'USD') : money(metrics.total_expenses_inr, 'INR') }}
        </strong>
        <span class="sub-value">
          {{ viewCurrency === 'USD' ? money(metrics.total_expenses_inr, 'INR') : money(metrics.total_expenses, 'USD') }}
        </span>
        <span class="trend neg">↓ 5% vs last month</span>
      </div>
      <div class="metric-card">
        <span class="label">Bank Balance</span>
        <strong class="value">
          {{ viewCurrency === 'USD' ? money(metrics.bank_balance, 'USD') : money(metrics.bank_balance_inr, 'INR') }}
        </strong>
        <span class="sub-value">
          {{ viewCurrency === 'USD' ? money(metrics.bank_balance_inr, 'INR') : money(metrics.bank_balance, 'USD') }}
        </span>
        <span class="muted small font-semibold">Across all accounts</span>
      </div>
      <div class="metric-card highlight">
        <span class="label">Cash On Hand</span>
        <strong class="value">
          {{ viewCurrency === 'USD' ? money(metrics.cash_on_hand, 'USD') : money(metrics.cash_on_hand_inr, 'INR') }}
        </strong>
        <span class="sub-value">
          {{ viewCurrency === 'USD' ? money(metrics.cash_on_hand_inr, 'INR') : money(metrics.cash_on_hand, 'USD') }}
        </span>
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

      <RouterLink class="module-tile" to="/finance/accounts">
        <div class="icon-wrap accounts"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 4h16v4H4V4Zm0 6h7v10H4V10Zm9 0h7v10h-7V10Zm-7 3v2h3v-2H6Zm9 0v2h3v-2h-3Z" fill="currentColor"/></svg></div>
        <div class="content">
          <strong>Chart of Accounts</strong>
          <span>Create and edit GL codes and account names.</span>
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

    <!-- Fixed Assets Section -->
    <section class="fixed-assets-section" v-if="fixedAssets.length > 0">
      <div class="section-header">
        <div>
          <p class="eyebrow">Balance Sheet</p>
          <h2>Fixed Assets Register</h2>
        </div>
        <div class="asset-summary-pills">
          <div class="pill">
            <span>Total Cost</span>
            <strong>{{ money(fixedAssetsSummary.total_cost, viewCurrency) }}</strong>
          </div>
          <div class="pill highlight">
            <span>Current Book Value</span>
            <strong>{{ money(fixedAssetsSummary.total_current_value, viewCurrency) }}</strong>
          </div>
        </div>
      </div>
      <div class="assets-table-wrap">
        <table class="assets-table">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Description</th>
              <th>Vendor</th>
              <th>Date</th>
              <th class="right">Purchase Cost</th>
              <th class="right">Current Value</th>
              <th class="right">Depreciation</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asset in fixedAssets" :key="asset.id">
              <td class="mono">{{ asset.id }}</td>
              <td class="asset-desc">{{ asset.description || '—' }}</td>
              <td>{{ asset.vendor_name || '—' }}</td>
              <td class="mono">{{ asset.transaction_date }}</td>
              <td class="right mono">{{ money(asset.amount, asset.currency) }}</td>
              <td class="right mono" :class="{ 'value-lower': (asset.depreciation_value || asset.amount) < asset.amount }">
                {{ money(asset.depreciation_value != null ? asset.depreciation_value : asset.amount, asset.currency) }}
              </td>
              <td class="right mono depreciation-col">
                <span v-if="asset.depreciation_value != null && asset.depreciation_value < asset.amount">
                  ↓ {{ money(asset.amount - asset.depreciation_value, asset.currency) }}
                </span>
                <span v-else class="muted-text">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="empty-assets" v-else-if="assetsLoaded">
      <div class="empty-icon">🏗️</div>
      <p>No fixed assets recorded yet.</p>
      <RouterLink class="button secondary" to="/finance/transactions?new=1">Add First Asset</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { apiGet } from '../api/client'

const metrics = ref(null)
const viewCurrency = ref('USD')
const fixedAssets = ref([])
const fixedAssetsSummary = ref({ total_cost: 0, total_current_value: 0 })
const assetsLoaded = ref(false)

onMounted(async () => {
  try {
    const data = await apiGet('/api/finance')
    metrics.value = data.metrics
  } catch (e) {
    console.error('Failed to load finance metrics')
  }
  try {
    const fa = await apiGet('/api/finance/fixed-assets')
    fixedAssets.value = fa.assets || []
    fixedAssetsSummary.value = { total_cost: fa.total_cost || 0, total_current_value: fa.total_current_value || 0 }
  } catch (e) {
    console.error('Failed to load fixed assets')
  } finally {
    assetsLoaded.value = true
  }
})

function money(amount, currency) {
  const sym = currency === 'INR' ? '₹' : (currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : '$'))
  return `${sym}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
  margin-bottom: 2px;
}

.sub-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
  margin-bottom: 12px;
}

.metric-card.highlight .sub-value {
  color: rgba(255, 255, 255, 0.85);
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
.icon-wrap.accounts { background: #0f766e; }
.icon-wrap.gl { background: #e11d48; }

.content strong { display: block; font-size: 18px; color: var(--primary); margin-bottom: 4px; }
.content span { font-size: 14px; color: var(--muted); }

.toggle-btn {
  color: var(--muted);
}
.toggle-btn:not(.active):hover {
  color: var(--primary);
}
.toggle-btn.active {
  background: var(--primary) !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.2);
}

/* ── Fixed Assets Section ─────────────────────────────── */
.fixed-assets-section {
  margin-top: 48px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-header h2 {
  font-size: 22px;
  font-weight: 900;
  color: var(--text);
  margin: 4px 0 0;
}

.asset-summary-pills {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.pill {
  background: white;
  border: 1px solid var(--line);
  border-radius: 30px;
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.pill span {
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pill strong {
  font-size: 17px;
  font-weight: 900;
  color: var(--text);
}

.pill.highlight {
  background: linear-gradient(135deg, var(--primary) 0%, #f97316 100%);
  border-color: transparent;
}

.pill.highlight span,
.pill.highlight strong {
  color: white;
}

.assets-table-wrap {
  background: white;
  border-radius: 16px;
  border: 1px solid var(--line);
  overflow: hidden;
  box-shadow: 0 4px 16px -4px rgba(0,0,0,0.06);
}

.assets-table {
  width: 100%;
  border-collapse: collapse;
}

.assets-table thead {
  background: var(--surface-soft, #f8fafc);
}

.assets-table th {
  padding: 14px 16px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: var(--muted);
  border-bottom: 2px solid var(--line);
  text-align: left;
  white-space: nowrap;
}

.assets-table td {
  padding: 14px 16px;
  font-size: 13.5px;
  border-bottom: 1px solid var(--line);
  color: var(--text);
  vertical-align: middle;
}

.assets-table tbody tr:last-child td {
  border-bottom: none;
}

.assets-table tbody tr {
  transition: background 0.15s;
}

.assets-table tbody tr:hover {
  background: #fafbff;
}

.assets-table .right { text-align: right; }

.assets-table .mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
}

.asset-desc {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.value-lower {
  color: #b45309 !important;
  font-weight: 700;
}

.depreciation-col span:not(.muted-text) {
  color: #dc2626;
  font-weight: 700;
}

.muted-text {
  color: var(--muted);
}

/* Empty state */
.empty-assets {
  margin-top: 48px;
  background: white;
  border: 1.5px dashed var(--line);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.empty-assets p {
  color: var(--muted);
  font-size: 15px;
  margin-bottom: 20px;
}
</style>
