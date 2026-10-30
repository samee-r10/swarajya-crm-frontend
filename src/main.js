import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ModernSpinner from './components/ModernSpinner.vue'
import CrmPagination from './components/CrmPagination.vue'
import CrmPageHeader from './components/CrmPageHeader.vue'
import CrmModal from './components/CrmModal.vue'
import { installDataTableEnhancements } from './utils/dataTableEnhancer'
import './assets/styles.css'

const app = createApp(App)
app.component('ModernSpinner', ModernSpinner)
app.component('CrmPagination', CrmPagination)
app.component('CrmPageHeader', CrmPageHeader)
app.component('CrmModal', CrmModal)
app.use(router).mount('#app')
installDataTableEnhancements()
