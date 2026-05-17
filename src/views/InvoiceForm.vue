<template>
  <div class="invoice-form-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Finance</p>
        <h1>{{ id ? 'Edit Invoice' : 'New Invoice' }}</h1>
        <p class="muted">Generate a new sales invoice for your customer.</p>
      </div>
    </header>

    <form class="invoice-form" @submit.prevent="save">
      <div class="form-grid record-card">
        <div class="span-2 card-section-title"><h2>Invoice Basic Info</h2></div>
        
        <label>Customer
          <select v-model="form.customer_id" required>
            <option value="">Select Customer</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.company_name }}</option>
          </select>
        </label>

        <label>Project
          <select v-model="form.project_id">
            <option value="">Select Project (Optional)</option>
            <option v-for="p in filteredProjects" :key="p.id" :value="p.id">{{ p.project_name }}</option>
          </select>
        </label>

        <label>Account *
          <select v-model="form.account_id" required>
            <option value="">Select Account</option>
            <option v-for="a in incomeAccounts" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </label>
        
        <label>Invoice # (Auto if empty)<input v-model="form.invoice_number" placeholder="INV-0001"></label>
        
        <label>Invoice Date<input v-model="form.invoice_date" type="date" required></label>
        <label>Due Date<input v-model="form.due_date" type="date"></label>
        
        <label>Currency
          <select v-model="form.currency">
            <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }}</option>
          </select>
        </label>
        
        <label>Status
          <select v-model="form.status">
            <option v-for="s in statuses" :key="s">{{ s }}</option>
          </select>
        </label>
        
        <label v-if="form.status === 'Partially Paid'">Amount Paid ({{ form.currency }})
          <input type="number" v-model.number="form.amount_paid" step="0.01" min="0" :max="form.total_amount" placeholder="0.00">
        </label>
      </div>

      <div class="record-card items-card">
        <div class="card-section-title"><h2>Line Items</h2></div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%;">Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Tax %</th>
              <th class="right">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in form.items" :key="index">
              <td><input v-model="item.description" placeholder="Service or product description" required></td>
              <td><input v-model.number="item.qty" type="number" min="1" @input="updateItemTotal(index)"></td>
              <td><input v-model.number="item.price" type="number" step="0.01" @input="updateItemTotal(index)"></td>
              <td><input v-model.number="item.tax_percent" type="number" step="0.1" @input="updateItemTotal(index)"></td>
              <td class="right"><strong>{{ (item.total || 0).toFixed(2) }}</strong></td>
              <td><button type="button" class="icon-button delete" @click="removeItem(index)">&times;</button></td>
            </tr>
          </tbody>
        </table>
        <button type="button" class="button secondary add-item" @click="addItem">+ Add Item</button>

        <div class="totals-section">
          <div class="total-row"><span>Subtotal</span><span>{{ form.subtotal.toFixed(2) }}</span></div>
          <div class="total-row"><span>Tax Amount</span><span>{{ form.tax_amount.toFixed(2) }}</span></div>
          <div class="total-row grand-total"><span>Grand Total</span><span>{{ form.currency }} {{ form.total_amount.toFixed(2) }}</span></div>
        </div>
      </div>

      <div class="record-card">
        <div class="card-section-title"><h2>Additional Details</h2></div>
        <label class="span-2">Notes & Terms<textarea v-model="form.notes" rows="4" placeholder="Payment terms, bank details, etc."></textarea></label>
      </div>

      <p v-if="error" class="flash warning">{{ error }}</p>

      <div class="action-row">
        <button type="button" class="button secondary" @click="router.back()">Cancel</button>
        <button type="submit" class="button">Save Invoice</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api/client'

const props = defineProps({ id: String })
const router = useRouter()
const customers = ref([])
const projects = ref([])
const accounts = ref([])
const currencies = ref([])
const statuses = ['Draft', 'Sent', 'Approved', 'Partially Paid', 'Paid', 'Cancelled']
const error = ref('')

const form = reactive({
  customer_id: '',
  project_id: '',
  account_id: '',
  invoice_number: '',
  invoice_date: new Date().toISOString().split('T')[0],
  due_date: '',
  currency: 'INR',
  status: 'Draft',
  notes: '',
  items: [
    { description: '', qty: 1, price: 0, tax_percent: 0, total: 0 }
  ],
  subtotal: 0,
  tax_amount: 0,
  total_amount: 0,
  amount_paid: 0
})

const incomeAccounts = computed(() => {
  return accounts.value.filter(a => a.type === 'Revenue')
})

const filteredProjects = computed(() => {
  if (!form.customer_id) return projects.value
  return projects.value.filter(p => Number(p.customer_id) === Number(form.customer_id))
})

watch(() => form.customer_id, (newCust) => {
  if (newCust && form.project_id) {
    const proj = projects.value.find(p => Number(p.id) === Number(form.project_id))
    if (proj && Number(proj.customer_id) !== Number(newCust)) {
      form.project_id = ''
    }
  }
})

onMounted(async () => {
  const options = await apiGet('/api/options')
  customers.value = options.customers || []
  projects.value = options.projects || []
  accounts.value = options.accounts || []
  currencies.value = options.currencies || []

  if (!props.id) {
    const salesRev = accounts.value.find(a => a.name === 'Sales Revenue')
    if (salesRev) form.account_id = salesRev.id
  }

  if (props.id) {
    const data = await apiGet(`/api/finance/invoices/${props.id}`)
    Object.assign(form, data.invoice)
    // Recalculate just in case
    calculateTotals()
  }
})

function addItem() {
  form.items.push({ description: '', qty: 1, price: 0, tax_percent: 0, total: 0 })
}

function removeItem(index) {
  if (form.items.length > 1) {
    form.items.splice(index, 1)
    calculateTotals()
  }
}

function updateItemTotal(index) {
  const item = form.items[index]
  const base = (item.qty || 0) * (item.price || 0)
  item.total = base + (base * (item.tax_percent || 0) / 100)
  calculateTotals()
}

function calculateTotals() {
  let sub = 0
  let tax = 0
  form.items.forEach(item => {
    const base = (item.qty || 0) * (item.price || 0)
    sub += base
    tax += (base * (item.tax_percent || 0) / 100)
  })
  form.subtotal = sub
  form.tax_amount = tax
  form.total_amount = sub + tax
}

async function save() {
  error.value = ''
  try {
    if (form.status === 'Paid') {
      form.amount_paid = form.total_amount
    } else if (form.status !== 'Partially Paid') {
      form.amount_paid = 0
    }
    
    if (props.id) {
      await apiPut(`/api/finance/invoices/${props.id}`, form)
      router.push(`/finance/invoices/${props.id}`)
    } else {
      const res = await apiPost('/api/finance/invoices', form)
      router.push(`/finance/invoices/${res.id}`)
    }
  } catch (err) {
    error.value = err.message
  }
}
</script>

<style scoped>
.invoice-form-page {
  max-width: 1000px;
  margin: 0 auto;
}

.card-section-title {
  margin-bottom: 24px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 8px;
}

.card-section-title h2 {
  font-size: 14px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.items-card {
  margin-top: 24px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th {
  text-align: left;
  padding: 12px 8px;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.items-table td {
  padding: 8px;
}

.items-table input {
  width: 100%;
  padding: 8px;
}

.right { text-align: right; }

.icon-button.delete {
  background: #fee2e2;
  color: #991b1b;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: none;
  cursor: pointer;
}

.add-item {
  margin-top: 16px;
}

.totals-section {
  margin-top: 32px;
  width: 300px;
  margin-left: auto;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.grand-total {
  border-top: 2px solid var(--line);
  margin-top: 8px;
  padding-top: 16px;
  font-weight: 800;
  font-size: 18px;
  color: var(--primary);
}

.action-row {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}
</style>
