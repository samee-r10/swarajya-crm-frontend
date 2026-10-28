<template>
  <div class="service-summary">
    <span class="service-badge" :class="serviceState(terms)">{{ serviceLabel(terms) }}</span>
    <strong v-if="terms?.name">{{ terms.name }}</strong>
    <span v-if="terms?.type === 'Paid'" class="service-rate">{{ serviceRate(terms) }}</span>
    <span v-if="terms?.start_date" class="muted service-dates">
      {{ serviceDate(terms.start_date) }} – {{ serviceDate(terms.end_date) }}
    </span>
  </div>
</template>

<script setup>
import { serviceDate, serviceLabel, serviceRate, serviceState } from '../utils/customerService'
defineProps({ terms: { type: Object, default: null } })
</script>

<style scoped>
.service-summary { display: grid; gap: 6px; justify-items: start; min-width: 180px; }
.service-summary strong, .service-rate { font-size: 13px; overflow-wrap: anywhere; }
.service-dates { font-size: 12px; }
.service-badge { border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 750; background: #f1f5f9; color: #475569; }
.service-badge.free { background: #dcfce7; color: #166534; }
.service-badge.paid { background: #dbeafe; color: #1e40af; }
.service-badge.expired { background: #fee2e2; color: #991b1b; }
.service-badge.scheduled { background: #fef3c7; color: #92400e; }
</style>
