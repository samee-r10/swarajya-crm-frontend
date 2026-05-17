<template>
  <div class="system-info-panel" v-if="record">
    <button class="system-info-toggle" @click="expanded = !expanded">
      <span class="toggle-icon">{{ expanded ? '∨' : '›' }}</span>
      System Information
    </button>
    <div v-if="expanded" class="system-info-body">
      <div class="sysinfo-row">
        <!-- Created By -->
        <div class="sysinfo-field">
          <span class="sysinfo-label">Created By</span>
          <div class="sysinfo-user">
            <div class="user-avatar" :style="{ background: avatarColor(record.created_by_name) }">
              {{ initials(record.created_by_name) }}
            </div>
            <div class="sysinfo-user-info">
              <span class="sysinfo-user-name">{{ record.created_by_name || '—' }}</span>
              <span class="sysinfo-user-date">{{ formatDate(record.created_at) }}</span>
            </div>
          </div>
        </div>
        <!-- Last Modified By -->
        <div class="sysinfo-field">
          <span class="sysinfo-label">Last Modified By</span>
          <div class="sysinfo-user">
            <div class="user-avatar modifier" :style="{ background: avatarColor(record.modified_by_name) }">
              {{ initials(record.modified_by_name) }}
            </div>
            <div class="sysinfo-user-info">
              <span class="sysinfo-user-name">{{ record.modified_by_name || '—' }}</span>
              <span class="sysinfo-user-date">{{ formatDate(record.updated_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  record: { type: Object, default: null }
})

const expanded = ref(true)

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const PALETTE = [
  '#4f46e5', '#0891b2', '#059669', '#dc2626',
  '#d97706', '#7c3aed', '#db2777', '#0284c7'
]
function avatarColor(name) {
  if (!name) return '#6b7280'
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function formatDate(val) {
  if (!val) return '—'
  try {
    const d = new Date(val)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    }) + ', ' + d.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  } catch {
    return String(val)
  }
}
</script>

<style scoped>
.system-info-panel {
  margin-top: 1.5rem;
  border-top: 1px solid var(--border, #e5e7eb);
}

.system-info-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  background: none;
  border: none;
  padding: 0.85rem 1.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted, #6b7280);
  letter-spacing: 0.03em;
  text-transform: uppercase;
  cursor: pointer;
  text-align: left;
  transition: color 0.15s;
}
.system-info-toggle:hover { color: var(--text, #111827); }

.toggle-icon {
  font-size: 1rem;
  width: 14px;
  display: inline-block;
  color: var(--accent, #4f46e5);
}

.system-info-body {
  padding: 0.75rem 1.25rem 1.25rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.sysinfo-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
@media (max-width: 600px) {
  .sysinfo-row { grid-template-columns: 1fr; }
}

.sysinfo-field {}
.sysinfo-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #6b7280);
  margin-bottom: 0.5rem;
}

.sysinfo-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  letter-spacing: 0.03em;
}

.user-avatar.modifier {
  border-radius: 8px;
}

.sysinfo-user-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.sysinfo-user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--accent, #4f46e5);
}

.sysinfo-user-date {
  font-size: 0.775rem;
  color: var(--text-muted, #6b7280);
}
</style>
