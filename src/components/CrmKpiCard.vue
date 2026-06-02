<template>
  <article class="crm-kpi-card" :class="toneClass">
    <div class="crm-kpi-card__icon" aria-hidden="true">
      <slot name="icon" />
    </div>
    <div class="crm-kpi-card__body">
      <span>{{ label }}</span>
      <strong>{{ value }}</strong>
      <small v-if="meta">{{ meta }}</small>
    </div>
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
