<template>
  <header class="crm-page-header">
    <div class="crm-page-header__copy">
      <div v-if="eyebrow" class="eyebrow-pill">
        <span class="eyebrow-dot"></span>
        <span class="eyebrow-text">{{ eyebrow }}</span>
      </div>
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
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.crm-page-header__copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.eyebrow-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 3px 10px;
  background: rgba(2, 132, 199, 0.08);
  border: 1px solid rgba(2, 132, 199, 0.2);
  border-radius: 9999px;
  font-family: var(--font-sans, sans-serif);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #0284c7;
}

.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0284c7;
  box-shadow: 0 0 6px #0284c7;
}

.page-title {
  font-family: var(--font-display, 'Outfit', sans-serif);
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin: 0;
}

.page-description {
  font-family: var(--font-sans, sans-serif);
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
  max-width: 680px;
  line-height: 1.5;
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
  }
}
</style>
