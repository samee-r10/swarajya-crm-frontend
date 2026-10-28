import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ModernSpinner from './components/ModernSpinner.vue'
import './assets/styles.css'

const app = createApp(App)
app.component('ModernSpinner', ModernSpinner)
app.use(router).mount('#app')
