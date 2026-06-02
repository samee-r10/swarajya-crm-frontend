<template>
  <section class="page-header"><div><p class="eyebrow">Vendor</p><h1>{{ id ? 'Edit Vendor' : 'New Vendor' }}</h1></div></section>
  <form class="form-grid record-card" @submit.prevent="save">
    <template v-for="section in groupedFields" :key="section.title">
      <div class="span-2 card-section-title"><h2>{{ section.title }}</h2></div>
      <label v-for="field in section.fields" :key="field.api_name" :class="isSpan2(field) ? 'span-2' : ''">
        {{ field.label }} <span v-if="field.is_required" style="color: #dc2626; margin-left: 2px;">*</span>
        <textarea v-if="field.field_type === 'Long Text'" v-model="form[field.api_name]" :required="field.is_required" rows="4" :placeholder="'Enter ' + field.label.toLowerCase() + '...'"></textarea>
        <select v-else-if="field.field_type === 'Dropdown'" v-model="form[field.api_name]" :required="field.is_required">
          <option value="">Select {{ field.label }}</option>
          <option v-for="opt in parseOptions(field.picklist_options)" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <input v-else-if="field.field_type === 'Checkbox'" type="checkbox" v-model="form[field.api_name]">
        <input v-else-if="field.field_type === 'Number'" type="number" step="any" v-model="form[field.api_name]" :required="field.is_required" :placeholder="'Enter ' + field.label.toLowerCase() + '...'">
        <input v-else-if="field.field_type === 'Date'" type="date" v-model="form[field.api_name]" :required="field.is_required">
        <input v-else type="text" v-model="form[field.api_name]" :required="field.is_required" :placeholder="'Enter ' + field.label.toLowerCase() + '...'">
      </label>
    </template>
    <div class="span-2 action-row"><button class="button" type="submit">Save</button></div>
  </form>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api/client'

const props = defineProps({ id: String })
const router = useRouter()
const vendorCategoryOptions = ['Supply', 'Service', 'Both']
const paymentTerms = ref([])
const paymentModes = ref([])
const form = reactive({
  name: '', contact_person: '', email: '', phone: '', category: 'Both', notes: '',
  address_line_1: '', address_line_2: '', city: '', pincode: '', state: '', country: '',
  registration_type: 'Not Registered', supplier_category: 'Non-MSME', payment_terms: '', payment_mode: ''
})

const defaultFields = [
  { label: 'Vendor Name', api_name: 'name', field_type: 'Text', is_required: true, section: 'Basic Details' },
  { label: 'Contact Person', api_name: 'contact_person', field_type: 'Text', is_required: false, section: 'Basic Details' },
  { label: 'Email', api_name: 'email', field_type: 'Text', is_required: false, section: 'Basic Details' },
  { label: 'Phone', api_name: 'phone', field_type: 'Text', is_required: false, section: 'Basic Details' },
  { label: 'Category', api_name: 'category', field_type: 'Dropdown', is_required: false, picklist_options: JSON.stringify(vendorCategoryOptions), section: 'Basic Details' },
  { label: 'Address Line 1', api_name: 'address_line_1', field_type: 'Text', is_required: false, section: 'Address Details' },
  { label: 'Address Line 2', api_name: 'address_line_2', field_type: 'Text', is_required: false, section: 'Address Details' },
  { label: 'City', api_name: 'city', field_type: 'Text', is_required: false, section: 'Address Details' },
  { label: 'Pincode', api_name: 'pincode', field_type: 'Text', is_required: false, section: 'Address Details' },
  { label: 'State', api_name: 'state', field_type: 'Text', is_required: false, section: 'Address Details' },
  { label: 'Country', api_name: 'country', field_type: 'Text', is_required: false, section: 'Address Details' },
  { label: 'Registration Type', api_name: 'registration_type', field_type: 'Dropdown', is_required: false, picklist_options: '["Registered","Not Registered"]', section: 'Registration Details' },
  { label: 'Supplier Category', api_name: 'supplier_category', field_type: 'Dropdown', is_required: false, picklist_options: '["MSME","Non-MSME"]', section: 'Registration Details' },
  { label: 'Payment Terms', api_name: 'payment_terms', field_type: 'Dropdown', is_required: false, picklist_options: '[]', section: 'Payment Details' },
  { label: 'Payment Mode', api_name: 'payment_mode', field_type: 'Dropdown', is_required: false, picklist_options: '[]', section: 'Payment Details' },
  { label: 'Notes', api_name: 'notes', field_type: 'Long Text', is_required: false, section: 'Basic Details' }
]
const vendorFields = ref([...defaultFields])
const sectionOrder = ['Basic Details', 'Address Details', 'Registration Details', 'Payment Details']

const groupedFields = computed(() => sectionOrder.map(title => ({
  title,
  fields: vendorFields.value.filter(field => (field.section || sectionForField(field.api_name)) === title)
})).filter(section => section.fields.length > 0))

function normalizeVendorFields(fields) {
  const byApi = new Map(fields.map(field => [field.api_name, { ...field, section: sectionForField(field.api_name) }]))
  defaultFields.forEach(field => {
    byApi.set(field.api_name, { ...field, ...(byApi.get(field.api_name) || {}) })
  })
  return Array.from(byApi.values()).map(field => {
    if (field.api_name === 'category') {
      return {
        ...field,
        field_type: 'Dropdown',
        picklist_options: JSON.stringify(vendorCategoryOptions)
      }
    }
    if (field.api_name === 'payment_terms') return { ...field, field_type: 'Dropdown', picklist_options: JSON.stringify(paymentTerms.value) }
    if (field.api_name === 'payment_mode') return { ...field, field_type: 'Dropdown', picklist_options: JSON.stringify(paymentModes.value) }
    if (field.api_name === 'registration_type') return { ...field, field_type: 'Dropdown', picklist_options: '["Registered","Not Registered"]' }
    if (field.api_name === 'supplier_category') return { ...field, field_type: 'Dropdown', picklist_options: '["MSME","Non-MSME"]' }
    return field
  }).sort((a, b) => sectionOrder.indexOf(a.section || sectionForField(a.api_name)) - sectionOrder.indexOf(b.section || sectionForField(b.api_name)))
}

function sectionForField(apiName) {
  if (['address_line_1', 'address_line_2', 'city', 'pincode', 'state', 'country'].includes(apiName)) return 'Address Details'
  if (['registration_type', 'supplier_category'].includes(apiName)) return 'Registration Details'
  if (['payment_terms', 'payment_mode'].includes(apiName)) return 'Payment Details'
  return 'Basic Details'
}

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
    const options = await apiGet('/api/options')
    paymentTerms.value = options.payment_terms || []
    paymentModes.value = options.payment_modes || []
    vendorFields.value = normalizeVendorFields(vendorFields.value)
    if (props.id) {
      const detail = await apiGet(`/api/finance/vendors/${props.id}`)
      if (detail.fields && detail.fields.length > 0) {
        vendorFields.value = normalizeVendorFields(detail.fields)
        detail.fields.forEach(field => {
          if (!(field.api_name in form)) {
            form[field.api_name] = field.field_type === 'Checkbox' ? false : ''
          }
        })
      }
      Object.assign(form, detail.vendor)
      if (!vendorCategoryOptions.includes(form.category)) form.category = 'Both'
    } else {
      const listData = await apiGet('/api/finance/vendors')
      if (listData.fields && listData.fields.length > 0) {
        vendorFields.value = normalizeVendorFields(listData.fields)
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
    router.replace(`/finance/vendors/${props.id}`)
  } else {
    const data = await apiPost('/api/finance/vendors', form)
    router.replace(`/finance/vendors/${data.vendor.id}`)
  }
}
</script>
