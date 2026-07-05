<template>
  <div class="approval-center-page">
    <CrmPageHeader
      eyebrow="Approval Center"
      title="Pending Approvals"
      description="Review every approval currently assigned to you."
    />

    <section v-if="loading" class="record-card empty-state">Loading approvals...</section>
    <section v-else class="approval-layout">
      <div class="approval-metrics">
        <div><span>Total Pending</span><strong>{{ rows.length }}</strong></div>
        <div><span>Claims</span><strong>{{ counts.claims }}</strong></div>
        <div><span>Stakeholder Payouts</span><strong>{{ counts.stakeholder_payouts }}</strong></div>
        <div><span>CP Payments</span><strong>{{ counts.cp_payments }}</strong></div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Reference</th>
              <th>Party</th>
              <th class="right">Amount</th>
              <th>Sequence</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key">
              <td><span class="type-pill">{{ row.type }}</span></td>
              <td><strong>{{ row.reference }}</strong></td>
              <td>{{ row.party || '-' }}</td>
              <td class="right">{{ money(row.amount) }}</td>
              <td>{{ row.sequence || '-' }}</td>
              <td><span class="pill status-warning">{{ row.status }}</span></td>
              <td><RouterLink class="button secondary small" :to="row.to">Review</RouterLink></td>
            </tr>
            <tr v-if="rows.length === 0"><td colspan="7" class="empty-state">No approvals are pending for you.</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiGet } from '../api/client'
import CrmPageHeader from '../components/CrmPageHeader.vue'

const loading = ref(true)
const rows = ref([])

const counts = computed(() => rows.value.reduce((acc, row) => {
  if (row.kind === 'claim') acc.claims += 1
  if (row.kind === 'stakeholder_payout') acc.stakeholder_payouts += 1
  if (row.kind === 'cp_payment') acc.cp_payments += 1
  return acc
}, { claims: 0, stakeholder_payouts: 0, cp_payments: 0 }))

onMounted(loadApprovals)

async function loadApprovals() {
  loading.value = true
  try {
    const data = await apiGet('/api/approvals/pending')
    rows.value = data.approvals || []
  } finally {
    loading.value = false
  }
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
}
</script>

<style scoped>
.approval-center-page { max-width: 1400px; margin: 0 auto; }
.approval-layout { display: grid; gap: 18px; }
.approval-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.approval-metrics div { background: #ffffff; border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow-sm); display: grid; gap: 4px; padding: 16px; }
.approval-metrics span { color: var(--muted); font-size: 12px; font-weight: 850; text-transform: uppercase; }
.approval-metrics strong { color: var(--heading); font-size: 28px; }
.type-pill { background: var(--primary-soft); border-radius: 999px; color: var(--primary); display: inline-flex; font-size: 12px; font-weight: 850; padding: 5px 9px; }
@media (max-width: 760px) { .approval-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
