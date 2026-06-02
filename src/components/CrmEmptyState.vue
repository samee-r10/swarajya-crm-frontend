<template>
  <div class="crm-empty-state">
    <div v-if="$slots.icon" class="crm-empty-state__icon" aria-hidden="true">
      <slot name="icon" />
    </div>
    <strong>{{ title }}</strong>
    <p v-if="description">{{ description }}</p>
    <div v-if="$slots.actions" class="crm-empty-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' }
})
</script>
