<template>
  <article class="crm-kpi-card bento-card" :class="toneClass">
    <div class="kpi-card-header">
      <div class="crm-kpi-card__icon" aria-hidden="true">
        <slot name="icon" />
      </div>
    </div>
    <div class="crm-kpi-card__body">
      <span class="kpi-label">{{ label }}</span>
      <strong class="kpi-value">{{ value }}</strong>
      <small v-if="meta" class="kpi-meta">{{ meta }}</small>
    </div>
    <div class="kpi-bottom-glow" aria-hidden="true"></div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  meta: { type: String, default: '' },
  tone: { type: String, default: 'primary' }
})

const toneClass = computed(() => `crm-kpi-card--${props.tone}`)
</script>

<style scoped>
.crm-kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 148px;
  padding: 20px 22px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), 0 6px 18px -4px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.crm-kpi-card:hover {
  transform: translateY(-3px);
  border-color: rgba(2, 132, 199, 0.35);
  box-shadow: 0 14px 30px -8px rgba(15, 23, 42, 0.1), 0 0 20px rgba(2, 132, 199, 0.08);
}

.kpi-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.crm-kpi-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.crm-kpi-card:hover .crm-kpi-card__icon {
  transform: scale(1.08);
}

.crm-kpi-card__icon :deep(svg) {
  width: 22px;
  height: 22px;
  display: block;
}

/* Tone Palettes (Vengence UI Vibrant Accents) */
.crm-kpi-card--blue .crm-kpi-card__icon,
.crm-kpi-card--primary .crm-kpi-card__icon {
  background: rgba(2, 132, 199, 0.1);
  color: #0284c7;
}

.crm-kpi-card--green .crm-kpi-card__icon {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.crm-kpi-card--amber .crm-kpi-card__icon {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.crm-kpi-card--violet .crm-kpi-card__icon {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.crm-kpi-card--red .crm-kpi-card__icon {
  background: rgba(244, 63, 94, 0.1);
  color: #f43f5e;
}

.crm-kpi-card__body {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-family: var(--font-sans, sans-serif);
  font-size: 11.5px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.kpi-value {
  font-family: var(--font-display, 'Outfit', sans-serif);
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.kpi-meta {
  font-family: var(--font-sans, sans-serif);
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  margin-top: 6px;
}

/* Bottom Glow line */
.kpi-bottom-glow {
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 3px;
  border-radius: 999px;
  opacity: 0.4;
  transition: opacity 0.28s ease;
}

.crm-kpi-card:hover .kpi-bottom-glow {
  opacity: 1;
}

.crm-kpi-card--blue .kpi-bottom-glow,
.crm-kpi-card--primary .kpi-bottom-glow {
  background: linear-gradient(90deg, #0284c7, #38bdf8);
}

.crm-kpi-card--green .kpi-bottom-glow {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.crm-kpi-card--amber .kpi-bottom-glow {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.crm-kpi-card--violet .kpi-bottom-glow {
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
}

.crm-kpi-card--red .kpi-bottom-glow {
  background: linear-gradient(90deg, #f43f5e, #fb7185);
}
</style>
