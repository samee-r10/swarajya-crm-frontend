<template>
  <div class="report-tabs-nav no-print">
    <RouterLink
      to="/finance/reports/general-ledger"
      class="report-tab"
      :class="{ active: activeTab === 'general' }"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M5 3h14v18H5V3Zm3 14h2v-6H8v6Zm3 0h2V7h-2v10Zm3 0h2v-4h-2v4Z"/>
      </svg>
      <span>General Ledger</span>
    </RouterLink>

    <RouterLink
      to="/finance/reports/customer-ledger"
      class="report-tab"
      :class="{ active: activeTab === 'customer' }"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
      <span>Customer Ledger</span>
    </RouterLink>

    <RouterLink
      to="/finance/reports/vendor-ledger"
      class="report-tab"
      :class="{ active: activeTab === 'vendor' }"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
      </svg>
      <span>Vendor Ledger</span>
    </RouterLink>
  </div>
</template>

<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true,
    validator: (v) => ['general', 'customer', 'vendor'].includes(v)
  }
})
</script>

<style scoped>
.report-tabs-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 5px;
  border-radius: 12px;
  margin-bottom: 24px;
  width: fit-content;
  border: 1px solid var(--line, #e2e8f0);
}

.report-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted, #64748b);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.report-tab:hover {
  color: var(--foreground, #0f172a);
  background: rgba(255, 255, 255, 0.6);
}

.report-tab.active {
  background: #ffffff;
  color: var(--primary, #f97316);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

@media (max-width: 640px) {
  .report-tabs-nav {
    width: 100%;
    overflow-x: auto;
    padding: 4px;
  }
  .report-tab {
    flex: 1;
    justify-content: center;
    padding: 8px 12px;
    font-size: 12px;
    white-space: nowrap;
  }
}
</style>
