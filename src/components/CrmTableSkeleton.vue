<template>
  <div class="crm-table-skeleton" aria-label="Loading records">
    <div v-for="row in rows" :key="row" class="crm-table-skeleton__row">
      <span v-for="column in columns" :key="column"></span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 6 },
  columns: { type: Number, default: 5 }
})
</script>
