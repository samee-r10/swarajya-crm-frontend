<template>
  <section v-if="project" class="page-header">
    <div><p class="eyebrow">Project</p><h1>{{ project.project_name }}</h1><p class="muted">{{ project.company_name }} · {{ project.status }}</p></div>
    <RouterLink class="button" :to="`/projects/${id}/edit`">Edit</RouterLink>
  </section>
  <section v-if="project" class="record-layout">
    <div class="form-grid record-card full-width-card">
      <div class="span-2 card-section-title"><h2>Project Details</h2></div>
      <label v-for="field in fields" :key="field.label" :class="field.long ? 'span-2' : ''">{{ field.label }}
        <textarea v-if="field.long" readonly rows="5" :value="field.value"></textarea><input v-else readonly :value="field.value">
      </label>
      <div class="span-2">
        <SystemInfo :record="project" />
      </div>
    </div>
  </section>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiGet } from '../api/client'
import SystemInfo from '../components/SystemInfo.vue'

const props = defineProps({ id: { type: String, required: true } })
const project = ref(null)
const projFields = ref([])

const fields = computed(() => {
  if (!project.value) return []
  if (projFields.value && projFields.value.length > 0) {
    return projFields.value.map(field => {
      let val = project.value[field.api_name]
      if (field.api_name === 'customer_id') {
        val = project.value.company_name
      } else if (field.api_name === 'opportunity_id') {
        val = project.value.opportunity_title
      } else if (field.field_type === 'Checkbox') {
        val = val ? 'Yes' : 'No'
      }
      return {
        label: field.label,
        value: val || '--',
        long: field.field_type === 'Long Text' || field.api_name === 'client_requirements' || field.api_name === 'last_update' || field.api_name === 'product_delivery_status'
      }
    })
  }
  
  // Fallback
  return [
    { label: 'Customer', value: project.value.company_name },
    { label: 'Opportunity', value: project.value.opportunity_title || '' },
    { label: 'Status', value: project.value.status },
    { label: 'Delivery Timeline', value: project.value.delivery_timeline || '' },
    { label: 'Product Delivery Status', value: project.value.product_delivery_status || '' },
    { label: 'Owner', value: project.value.owner || '' },
    { label: 'Client Requirements', value: project.value.client_requirements || '', long: true },
    { label: 'Latest Update', value: project.value.last_update || '', long: true }
  ]
})

onMounted(async () => {
  try {
    const data = await apiGet(`/api/projects/${props.id}`)
    project.value = data.project
    projFields.value = data.fields || []
  } catch (err) {
    console.error('Failed to load project details', err)
  }
})
</script>
