<template>
  <section v-if="opportunity" class="page-header">
    <div><p class="eyebrow">Opportunity</p><h1>{{ opportunity.title }}</h1><p class="muted">{{ opportunity.company_name }} · {{ opportunity.stage }}</p></div>
    <RouterLink class="button" :to="`/opportunities/${id}/edit`">Edit</RouterLink>
  </section>
  <section v-if="opportunity" class="record-layout">
    <div class="path-container">
      <div class="path-stages">
        <!-- Render 4 main stages -->
        <div 
          v-for="stg in mainStages" 
          :key="stg"
          class="path-stage"
          :class="{
            'completed': isCompleted(stg),
            'current': stg === opportunity.stage,
            'selected': stg === selectedStage
          }"
          @click="selectedStage = stg"
        >
          {{ stg }}
        </div>

        <!-- Render Close / Closed Stage -->
        <div 
          class="path-stage"
          :class="{
            'completed': isClosed(opportunity.stage),
            'closed-won': isClosed(opportunity.stage) && isClosedWon(opportunity.stage),
            'closed-lost': isClosed(opportunity.stage) && isClosedLost(opportunity.stage),
            'selected': isClosed(selectedStage)
          }"
          @click="selectClosedStage"
        >
          {{ isClosed(opportunity.stage) ? opportunity.stage : 'Close' }}
        </div>
      </div>
      
      <div class="path-actions">
        <!-- Selection dropdown for closed options -->
        <select 
          v-if="isClosed(selectedStage)" 
          v-model="selectedStage" 
          class="closed-select"
        >
          <option v-for="cStage in closedStages" :key="cStage" :value="cStage">
            {{ cStage }}
          </option>
        </select>

        <button 
          class="button primary" 
          @click="updateStage"
          :disabled="selectedStage === opportunity.stage"
          :class="{ 'orange-btn': isClosed(selectedStage) }"
        >
          {{ getButtonLabel() }}
        </button>
      </div>
    </div>

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
import { apiGet, apiPut } from '../api/client'
import SystemInfo from '../components/SystemInfo.vue'

const props = defineProps({ id: { type: String, required: true } })
const opportunity = ref(null)
const projects = ref([])
const oppFields = ref([])
const stages = ref([])
const selectedStage = ref(null)

const mainStages = ['Draft', 'Discussion', 'Commercial negotiation', 'Contractual negotiation']
const closedStages = ['DA Signed', 'Lost to competitor', 'Rejected by SC', 'Lost']

function isClosedWon(stage) {
  return stage === 'DA Signed'
}

function isClosedLost(stage) {
  return ['Lost to competitor', 'Rejected by SC', 'Lost'].includes(stage)
}

function isClosed(stage) {
  return closedStages.includes(stage)
}

function isCompleted(stage) {
  if (!opportunity.value) return false
  if (isClosed(opportunity.value.stage)) {
    return mainStages.includes(stage)
  }
  const currIdx = mainStages.indexOf(opportunity.value.stage)
  const stgIdx = mainStages.indexOf(stage)
  if (currIdx === -1 || stgIdx === -1) return false
  return stgIdx < currIdx
}

function selectClosedStage() {
  if (isClosed(opportunity.value.stage)) {
    selectedStage.value = opportunity.value.stage
  } else {
    selectedStage.value = 'DA Signed'
  }
}

function getButtonLabel() {
  if (!opportunity.value || !selectedStage.value) return 'Mark Stage'
  if (isClosed(selectedStage.value)) {
    return 'Change Closed Stage'
  }
  if (selectedStage.value === opportunity.value.stage) {
    return 'Current Stage'
  }
  return 'Mark as Current Stage'
}

async function updateStage() {
  if (!opportunity.value || !selectedStage.value || selectedStage.value === opportunity.value.stage) return
  
  try {
    const updatedOpp = { ...opportunity.value, stage: selectedStage.value }
    await apiPut(`/api/opportunities/${props.id}`, updatedOpp)
    opportunity.value.stage = selectedStage.value
  } catch (err) {
    console.error('Failed to update stage', err)
  }
}

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
    selectedStage.value = opportunity.value.stage

    const options = await apiGet('/api/options')
    stages.value = options.opportunity_stages || []
  } catch (err) {
    console.error('Failed to load opportunity details', err)
  }
})
</script>

<style scoped>
.path-container {
  display: flex;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 24px;
  align-items: stretch;
  gap: 16px;
  grid-column: span 2;
}
.path-stages {
  display: flex;
  flex: 1;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}
.path-stage {
  flex: 1;
  text-align: center;
  padding: 8px 16px 8px 24px;
  background: #f3f4f6;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%);
  margin-left: -12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.path-stage:first-child {
  padding-left: 16px;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%);
  margin-left: 0;
}
.path-stage:last-child {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%);
}
.path-stage.completed {
  background: #10b981;
  color: white;
}
.path-stage.current {
  background: #2563eb;
  color: white;
}
.path-stage.closed-won {
  background: #10b981;
  color: white;
}
.path-stage.closed-lost {
  background: #ef4444;
  color: white;
}
.path-stage.selected {
  font-weight: 700;
  box-shadow: inset 0 0 0 2px rgba(0,0,0,0.1);
}
.path-actions {
  display: flex;
  align-items: center;
}
.closed-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  margin-right: 12px;
  background-color: white;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s;
  cursor: pointer;
}
.closed-select:focus {
  border-color: #2563eb;
}
.orange-btn {
  background-color: #f97316 !important;
  border-color: #f97316 !important;
  color: white !important;
}
.orange-btn:hover {
  background-color: #ea580c !important;
}
</style>
