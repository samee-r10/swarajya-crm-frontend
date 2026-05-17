<template>
  <section v-if="opportunity" class="page-header">
    <div><p class="eyebrow">Opportunity</p><h1>{{ opportunity.title }}</h1><p class="muted">{{ opportunity.company_name }} · {{ opportunity.stage }}</p></div>
    <RouterLink class="button" :to="`/opportunities/${id}/edit`">Edit</RouterLink>
  </section>
  <section v-if="opportunity" class="record-layout">
    <div class="form-grid record-card">
      <div class="span-2 card-section-title"><h2>Opportunity Details</h2></div>
      <label v-for="field in fields" :key="field.label" :class="field.long ? 'span-2' : ''">{{ field.label }}
        <textarea v-if="field.long" readonly rows="5" :value="field.value"></textarea><input v-else readonly :value="field.value">
      </label>
      <div class="span-2">
        <SystemInfo :record="opportunity" />
      </div>
    </div>
    <aside class="related-pane"><div class="panel">
      <div class="related-heading"><span>Projects</span><RouterLink to="/projects/new">New</RouterLink></div>
      <div class="list compact"><RouterLink v-for="project in projects" :key="project.id" class="list-item" :to="`/projects/${project.id}`"><strong>{{ project.project_name }}</strong><span>{{ project.status }}</span></RouterLink></div>
    </div></aside>
  </section>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiGet } from '../api/client'
import SystemInfo from '../components/SystemInfo.vue'

const props = defineProps({ id: { type: String, required: true } })
const opportunity = ref(null)
const projects = ref([])
const oppFields = ref([])

const fields = computed(() => {
  if (!opportunity.value) return []
  if (oppFields.value && oppFields.value.length > 0) {
    return oppFields.value.map(field => {
      let val = opportunity.value[field.api_name]
      if (field.api_name === 'customer_id') {
        val = opportunity.value.company_name
      } else if (field.api_name === 'value') {
        val = `${opportunity.value.currency || 'INR'} ${Number(opportunity.value.value || 0).toLocaleString()}`
      } else if (field.field_type === 'Checkbox') {
        val = val ? 'Yes' : 'No'
      }
      return {
        label: field.label,
        value: val || '--',
        long: field.field_type === 'Long Text' || field.api_name === 'requirements' || field.api_name === 'next_action'
      }
    })
  }
  
  // Fallback
  return [
    { label: 'Customer', value: opportunity.value.company_name },
    { label: 'Country', value: opportunity.value.country || '' },
    { label: 'Opportunity Number', value: opportunity.value.opportunity_number || '' },
    { label: 'Value', value: `${opportunity.value.currency} ${Number(opportunity.value.value || 0).toLocaleString()}` },
    { label: 'Stage', value: opportunity.value.stage },
    { label: 'Expected Close', value: opportunity.value.expected_close || '' },
    { label: 'Requirements', value: opportunity.value.requirements || '', long: true },
    { label: 'Next Action', value: opportunity.value.next_action || '', long: true }
  ]
})

onMounted(async () => {
  try {
    const data = await apiGet(`/api/opportunities/${props.id}`)
    opportunity.value = data.opportunity
    projects.value = data.projects || []
    oppFields.value = data.fields || []
  } catch (err) {
    console.error('Failed to load opportunity details', err)
  }
})
</script>
