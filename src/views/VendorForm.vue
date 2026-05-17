<template>
  <section class="page-header"><div><p class="eyebrow">Vendor</p><h1>{{ id ? 'Edit Vendor' : 'New Vendor' }}</h1></div></section>
  <form class="form-grid record-card" @submit.prevent="save">
    <label 
      v-for="field in vendorFields" 
      :key="field.api_name"
      :class="isSpan2(field) ? 'span-2' : ''"
    >
      {{ field.label }} <span v-if="field.is_required" style="color: #dc2626; margin-left: 2px;">*</span>
      
      <!-- Long Text -->
      <textarea 
        v-if="field.field_type === 'Long Text'" 
        v-model="form[field.api_name]" 
        :required="field.is_required"
        rows="4"
        :placeholder="'Enter ' + field.label.toLowerCase() + '...'"
      ></textarea>
      
      <!-- Dropdown -->
      <select 
        v-else-if="field.field_type === 'Dropdown'" 
        v-model="form[field.api_name]" 
        :required="field.is_required"
      >
        <option v-for="opt in parseOptions(field.picklist_options)" :key="opt" :value="opt">{{ opt }}</option>
      </select>
      
      <!-- Checkbox -->
      <input 
        v-else-if="field.field_type === 'Checkbox'" 
        type="checkbox" 
        v-model="form[field.api_name]"
      >
      
      <!-- Number -->
      <input 
        v-else-if="field.field_type === 'Number'" 
        type="number" 
        step="any"
        v-model="form[field.api_name]" 
        :required="field.is_required"
        :placeholder="'Enter ' + field.label.toLowerCase() + '...'"
      >
      
      <!-- Date -->
      <input 
        v-else-if="field.field_type === 'Date'" 
        type="date" 
        v-model="form[field.api_name]" 
        :required="field.is_required"
      >
      
      <!-- Default Text -->
      <input 
        v-else 
        type="text" 
        v-model="form[field.api_name]" 
        :required="field.is_required"
        :placeholder="'Enter ' + field.label.toLowerCase() + '...'"
      >
    </label>
    <div class="span-2 action-row"><button class="button" type="submit">Save</button></div>
  </form>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api/client'

const props = defineProps({ id: String })
const router = useRouter()
const form = reactive({ name: '', contact_person: '', email: '', phone: '', category: '', notes: '' })

const defaultFields = [
  { label: 'Vendor Name', api_name: 'name', field_type: 'Text', is_required: true },
  { label: 'Contact Person', api_name: 'contact_person', field_type: 'Text', is_required: false },
  { label: 'Email', api_name: 'email', field_type: 'Text', is_required: false },
  { label: 'Phone', api_name: 'phone', field_type: 'Text', is_required: false },
  { label: 'Category', api_name: 'category', field_type: 'Text', is_required: false },
  { label: 'Notes', api_name: 'notes', field_type: 'Long Text', is_required: false }
]
const vendorFields = ref([...defaultFields])

function isSpan2(field) {
  return field.field_type === 'Long Text' || field.api_name === 'notes'
}

function parseOptions(options) {
  if (!options) return []
  try {
    const parsed = JSON.parse(options)
    return Array.isArray(parsed) ? parsed : [options]
  } catch (e) {
    return options.split(',').map(s => s.trim())
  }
}

onMounted(async () => {
  try {
    if (props.id) {
      const detail = await apiGet(`/api/finance/vendors/${props.id}`)
      if (detail.fields && detail.fields.length > 0) {
        vendorFields.value = detail.fields
        detail.fields.forEach(field => {
          if (!(field.api_name in form)) {
            form[field.api_name] = field.field_type === 'Checkbox' ? false : ''
          }
        })
      }
      Object.assign(form, detail.vendor)
    } else {
      const listData = await apiGet('/api/finance/vendors')
      if (listData.fields && listData.fields.length > 0) {
        vendorFields.value = listData.fields
        listData.fields.forEach(field => {
          if (!(field.api_name in form)) {
            form[field.api_name] = field.field_type === 'Checkbox' ? false : ''
          }
        })
      }
    }
  } catch (err) {
    console.error('Failed to load vendor form configuration', err)
  }
})

async function save() {
  if (props.id) {
    await apiPut(`/api/finance/vendors/${props.id}`, form)
    router.push(`/finance/vendors/${props.id}`)
  } else {
    const data = await apiPost('/api/finance/vendors', form)
    router.push(`/finance/vendors/${data.vendor.id}`)
  }
}
</script>
