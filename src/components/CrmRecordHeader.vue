<template>
  <section class="crm-record-header" :class="`crm-record-header--${variant}`" :aria-label="`${recordType} record header`">
    <div class="crm-record-header__top">
      <div class="crm-record-header__identity">
        <div class="crm-record-header__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <template v-if="variant === 'customer'">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87"/>
              <circle cx="9" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </template>
            <template v-else-if="variant === 'opportunity'">
              <path d="m3 8 4-5h10l4 5-9 13L3 8ZM3 8h18M7 3l5 18 5-18M7 3l5 5 5-5"/>
            </template>
            <template v-else>
              <rect x="3" y="7" width="18" height="14" rx="2"/>
              <path d="M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 12a23 23 0 0 0 18 0M10 12v3h4v-3"/>
            </template>
          </svg>
        </div>
        <div class="crm-record-header__heading">
          <p class="crm-record-header__type">{{ recordType }}</p>
          <h1 class="crm-record-header__title">{{ title }}</h1>
        </div>
      </div>
      <div v-if="$slots.actions" class="crm-record-header__actions">
        <slot name="actions" />
      </div>
    </div>

    <dl v-if="fields.length" class="crm-record-header__summary">
      <div v-for="field in fields" :key="field.label" class="crm-record-header__field">
        <dt>{{ field.label }}</dt>
        <dd>
          <RouterLink v-if="field.to" :to="field.to">{{ displayValue(field) }}</RouterLink>
          <a v-else-if="field.href" :href="field.href">{{ displayValue(field) }}</a>
          <span v-else>{{ displayValue(field) }}</span>
        </dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
defineProps({
  recordType: { type: String, required: true },
  title: { type: String, required: true },
  variant: { type: String, default: 'project' },
  fields: { type: Array, default: () => [] }
})

function displayValue(field) {
  if (field.value === undefined || field.value === null || field.value === '') return '—'
  if (field.type === 'date') {
    const date = new Date(field.value)
    if (Number.isFinite(date.getTime())) {
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
    }
  }
  return field.value
}
</script>

<style scoped>
.crm-record-header {
  --record-icon-color: #168a8b;
  container-type: inline-size;
  border: 1px solid #d8e0eb;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 1px 3px #172b4608;
  margin-bottom: 22px;
  min-width: 0;
}
.crm-record-header--customer { --record-icon-color: #168ac1; }
.crm-record-header--opportunity { --record-icon-color: #8584ed; }
.crm-record-header__top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px 24px;
  padding: 17px 20px;
  border-bottom: 1px solid #e5e9ef;
  border-radius: 6px 6px 0 0;
  background: #f5f6f8;
}
.crm-record-header__identity { display: flex; align-items: center; gap: 12px; flex: 1 1 280px; min-width: 0; }
.crm-record-header__icon { display: flex; align-items: center; justify-content: center; flex: 0 0 40px; height: 40px; border-radius: 5px; color: #fff; background: var(--record-icon-color); }
.crm-record-header__heading { min-width: 0; }
.crm-record-header__type { margin: 0 0 2px; color: #596579; font-size: 12px; font-weight: 500; line-height: 1.4; }
.crm-record-header__title { margin: 0; color: #182333; font-family: var(--font-sans, sans-serif); font-size: 20px; font-weight: 700; letter-spacing: -0.35px; line-height: 1.35; overflow-wrap: anywhere; }
.crm-record-header__actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px; margin-left: auto; }
.crm-record-header__actions :slotted(.button) { min-height: 34px; padding: 7px 14px; border-radius: 4px; box-shadow: none; font-size: 13px; font-weight: 600; white-space: nowrap; }
.crm-record-header__actions :slotted(.button:hover) { transform: none; }
.crm-record-header__summary { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px 26px; margin: 0; padding: 17px 20px 19px; }
.crm-record-header__field { min-width: 0; }
.crm-record-header__field dt { color: #647084; font-size: 12px; font-weight: 500; line-height: 1.4; margin-bottom: 5px; }
.crm-record-header__field dd { margin: 0; color: #243247; font-size: 13px; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
.crm-record-header__field a { color: #1766bd; text-decoration: none; }
.crm-record-header__field a:hover { text-decoration: underline; }

@container (max-width: 1000px) {
  .crm-record-header__summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@container (max-width: 560px) {
  .crm-record-header__top { padding: 15px; }
  .crm-record-header__summary { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 15px; gap: 16px; }
  .crm-record-header__title { font-size: 18px; }
}
@container (max-width: 320px) {
  .crm-record-header__summary { grid-template-columns: minmax(0, 1fr); }
}
</style>
