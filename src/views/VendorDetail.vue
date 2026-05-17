<template>
  <section v-if="vendor" class="page-header"><div><p class="eyebrow">Vendor</p><h1>{{ vendor.name }}</h1><p class="muted">{{ vendor.contact_person || 'No contact' }} · {{ vendor.email || 'No email' }}</p></div><RouterLink class="button" :to="`/finance/vendors/${id}/edit`">Edit</RouterLink></section>
  <section v-if="vendor" class="record-layout">
    <div class="form-grid record-card full-width-card">
      <div class="span-2 card-section-title"><h2>Vendor Details</h2></div>
      <label v-for="field in fields" :key="field.label" :class="field.long ? 'span-2' : ''">{{ field.label }}
        <textarea v-if="field.long" readonly rows="5" :value="field.value"></textarea>
        <input v-else readonly :value="field.value">
      </label>
      <div class="span-2">
        <SystemInfo :record="vendor" />
      </div>
    </div>
  </section>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiGet } from '../api/client'
import SystemInfo from '../components/SystemInfo.vue'

const props = defineProps({ id: { type: String, required: true } })
const vendor = ref(null)
const vendorFields = ref([])

const fields = computed(() => {
  if (!vendor.value) return []
  if (vendorFields.value && vendorFields.value.length > 0) {
    return vendorFields.value.map(field => {
      let val = vendor.value[field.api_name]
      if (field.field_type === 'Checkbox') {
        val = val ? 'Yes' : 'No'
      }
      return {
        label: field.label,
        value: val || '--',
        long: field.field_type === 'Long Text' || field.api_name === 'notes'
      }
    })
  }
  
  // Fallback
  return [
    { label: 'Vendor Name', value: vendor.value.name },
    { label: 'Contact Person', value: vendor.value.contact_person || '' },
    { label: 'Email', value: vendor.value.email || '' },
    { label: 'Phone', value: vendor.value.phone || '' },
    { label: 'Category', value: vendor.value.category || '' },
    { label: 'Notes', value: vendor.value.notes || '', long: true }
  ]
})

onMounted(async () => {
  try {
    const data = await apiGet(`/api/finance/vendors/${props.id}`)
    vendor.value = data.vendor
    vendorFields.value = data.fields || []
  } catch (err) {
    console.error('Failed to load vendor details', err)
  }
})
</script>
