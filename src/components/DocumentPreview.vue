<template>
  <section v-if="normalizedDocuments.length" class="document-preview">
    <div class="document-preview__header">
      <div>
        <span>{{ label }}</span>
        <strong>{{ normalizedDocuments.length === 1 ? documentName(normalizedDocuments[0]) : `${normalizedDocuments.length} attachments` }}</strong>
        <small>{{ normalizedDocuments.length === 1 ? documentMeta(normalizedDocuments[0]) : 'Click any attachment to preview' }}</small>
        <small v-if="accessNote" class="document-preview__access">{{ accessNote }}</small>
      </div>
    </div>

    <div class="document-preview__list">
      <button
        v-for="(doc, index) in normalizedDocuments"
        :key="documentKey(doc, index)"
        class="document-card"
        type="button"
        @click="openViewer(index)"
      >
        <span class="document-card__icon">{{ fileType(doc).short }}</span>
        <span class="document-card__copy">
          <strong>{{ documentName(doc) }}</strong>
          <small>{{ documentMeta(doc) }}</small>
        </span>
        <span class="document-card__action">Preview</span>
      </button>
    </div>

    <DocumentViewer
      v-model="viewerOpen"
      :documents="normalizedDocuments"
      :initial-index="viewerIndex"
    />
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import DocumentViewer from './DocumentViewer.vue'

const props = defineProps({
  document: { type: Object, default: null },
  documents: { type: Array, default: null },
  label: { type: String, default: 'Document' },
  accessNote: { type: String, default: '' }
})

const viewerOpen = ref(false)
const viewerIndex = ref(0)

const normalizedDocuments = computed(() => {
  const list = Array.isArray(props.documents) && props.documents.length ? props.documents : (props.document ? [props.document] : [])
  return list.filter(documentUrl)
})

function openViewer(index) {
  viewerIndex.value = index
  viewerOpen.value = true
}

function documentKey(doc, index) {
  return doc?.public_id || doc?.secure_url || doc?.url || doc?.data_url || doc?.name || index
}

function documentUrl(doc) {
  return doc?.secure_url || doc?.url || doc?.data_url || doc?.href || ''
}

function documentName(doc) {
  return doc?.name || doc?.original_filename || doc?.filename || doc?.public_id || 'Uploaded document'
}

function fileType(doc) {
  const url = documentUrl(doc).toLowerCase()
  const type = String(doc?.type || doc?.mime_type || '').toLowerCase()
  const format = String(doc?.format || '').toLowerCase()
  const name = documentName(doc).toLowerCase()
  const extension = [format, name.split('.').pop(), url.split('?')[0].split('.').pop()].find(Boolean) || ''
  if (type.includes('pdf') || extension === 'pdf') return { short: 'PDF', label: 'PDF' }
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(extension) || doc?.resource_type === 'image') return { short: 'IMG', label: extension ? extension.toUpperCase() : 'Image' }
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return { short: extension.toUpperCase(), label: extension.toUpperCase() }
  if (type.startsWith('text/') || ['txt', 'csv', 'json', 'xml'].includes(extension)) return { short: 'TXT', label: extension ? extension.toUpperCase() : 'Text' }
  return { short: 'FILE', label: extension ? extension.toUpperCase() : 'File' }
}

function documentMeta(doc) {
  const parts = []
  parts.push(fileType(doc).label)
  if (doc?.size) parts.push(formatBytes(doc.size))
  return parts.filter(Boolean).join(' · ')
}

function formatBytes(value) {
  const bytes = Number(value || 0)
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<style scoped>
.document-preview {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 8px;
  display: grid;
  gap: 12px;
  padding: 14px;
}

.document-preview__header {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.document-preview__header span,
.document-preview__header small {
  color: var(--muted);
  display: block;
  font-size: 12px;
  font-weight: 750;
}

.document-preview__access {
  color: var(--accent) !important;
  margin-top: 4px;
}

.document-preview__header strong {
  color: var(--heading);
  display: block;
  margin-top: 2px;
}

.document-preview__list {
  display: grid;
  gap: 8px;
}

.document-card {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  gap: 12px;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  padding: 10px 12px;
  text-align: left;
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
}

.document-card:hover {
  background: #ffffff;
  border-color: rgba(37, 99, 235, 0.42);
  box-shadow: var(--shadow-sm);
}

.document-card__icon {
  align-items: center;
  background: var(--primary-soft);
  border-radius: 7px;
  color: var(--primary);
  display: inline-flex;
  font-size: 11px;
  font-weight: 900;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.document-card__copy {
  min-width: 0;
}

.document-card__copy strong,
.document-card__copy small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-card__copy strong {
  color: var(--heading);
  font-size: 14px;
}

.document-card__copy small {
  color: var(--muted);
  font-size: 12px;
  font-weight: 750;
  margin-top: 2px;
}

.document-card__action {
  color: var(--primary);
  font-size: 12px;
  font-weight: 850;
}

@media (max-width: 640px) {
  .document-card {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .document-card__action {
    grid-column: 2;
  }
}
</style>
