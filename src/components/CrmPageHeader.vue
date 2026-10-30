<template>
  <header class="crm-page-header">
    <div class="crm-page-header__copy">
      <span v-if="eyebrow" class="crm-page-header__eyebrow">{{ eyebrow }}</span>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="description" class="page-description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="crm-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' }
})
</script>

<style scoped>
.crm-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  min-height: 68px;
}

.crm-page-header__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.crm-page-header__eyebrow {
  color: #a9581d;
  font-size: 10.5px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.09em;
}

.page-title {
  font-family: var(--font-display, sans-serif);
  font-size: clamp(24px, 2.3vw, 30px);
  font-weight: 720;
  color: var(--heading);
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin: 0;
}

.page-description {
  font-family: var(--font-sans, sans-serif);
  font-size: 13px;
  color: var(--muted);
  margin: 0;
  max-width: 680px;
  line-height: 1.45;
}

.crm-page-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .crm-page-header {
    flex-direction: column;
    align-items: flex-start;
    min-height: 0;
  }

  .crm-page-header__actions { width: 100%; }
}
</style>
