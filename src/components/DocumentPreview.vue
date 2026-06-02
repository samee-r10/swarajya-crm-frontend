<template>
  <section v-if="documentUrl" class="document-preview">
    <div class="document-preview__header">
      <div>
        <span>{{ label }}</span>
        <strong>{{ documentName }}</strong>
        <small>{{ documentMeta }}</small>
        <small v-if="accessNote" class="document-preview__access">{{ accessNote }}</small>
      </div>
      <div class="document-preview__actions">
        <button class="button secondary small" type="button" @click="previewOpen = !previewOpen">
          {{ previewOpen ? 'Hide Preview' : 'Preview' }}
        </button>
        <a class="button secondary small" :href="documentUrl" target="_blank" rel="noopener">Open</a>
      </div>
    </div>
    <div v-if="previewOpen" class="document-preview__frame">
      <img v-if="isImage" :src="documentUrl" :alt="documentName">
      <img v-else-if="isPdf && !previewFailed" :src="pdfPreviewUrl" :alt="`${documentName} preview`" @error="previewFailed = true">
      <iframe v-else-if="canEmbed && !previewFailed" :src="previewUrl" :title="documentName" @error="previewFailed = true"></iframe>
      <div v-else class="document-preview__fallback">
        <strong>Inline preview is not available for this file.</strong>
        <p>Open the document in a new tab to view or download it.</p>
        <a class="button secondary small" :href="documentUrl" target="_blank" rel="noopener">Open Document</a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  document: { type: Object, default: null },
  label: { type: String, default: 'Document' },
  accessNote: { type: String, default: '' }
})

const previewOpen = ref(false)
const previewFailed = ref(false)

const documentUrl = computed(() => props.document?.secure_url || props.document?.url || props.document?.data_url || '')
const documentName = computed(() => props.document?.name || props.document?.original_filename || props.document?.public_id || 'Uploaded document')
const fileType = computed(() => String(props.document?.type || '').toLowerCase())
const fileFormat = computed(() => String(props.document?.format || '').toLowerCase())
const fileName = computed(() => String(documentName.value || '').toLowerCase())
const isPdf = computed(() => fileType.value.includes('pdf') || fileFormat.value === 'pdf' || fileName.value.endsWith('.pdf') || documentUrl.value.toLowerCase().includes('.pdf'))
const isImage = computed(() => {
  const type = props.document?.type || ''
  const resourceType = props.document?.resource_type || ''
  return !isPdf.value && (type.startsWith('image/') || resourceType === 'image')
})
const canEmbed = computed(() => isPdf.value || fileType.value.startsWith('text/') || fileType.value.includes('html') || documentUrl.value.startsWith('data:'))
const previewUrl = computed(() => {
  if (!isPdf.value) return documentUrl.value
  return `${documentUrl.value}#toolbar=1&navpanes=0`
})
const pdfPreviewUrl = computed(() => {
  if (!isPdf.value) return documentUrl.value
  return cloudinaryPdfPreviewUrl(documentUrl.value)
})
const documentMeta = computed(() => {
  const parts = []
  if (props.document?.format) parts.push(String(props.document.format).toUpperCase())
  if (props.document?.type && !props.document?.format) parts.push(props.document.type)
  if (props.document?.size) parts.push(formatBytes(props.document.size))
  return parts.join(' · ') || 'Cloud document'
})

function formatBytes(value) {
  const bytes = Number(value || 0)
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function cloudinaryPdfPreviewUrl(url) {
  if (!url.includes('/upload/')) return url
  if (url.includes('/raw/upload/')) return url.replace('/raw/upload/', '/image/upload/f_auto,q_auto,pg_1/')
  if (url.includes('/image/upload/')) return url.replace('/image/upload/', '/image/upload/f_auto,q_auto,pg_1/')
  if (url.includes('/auto/upload/')) return url.replace('/auto/upload/', '/image/upload/f_auto,q_auto,pg_1/')
  return url
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

.document-preview__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.document-preview__frame {
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: 8px;
  min-height: 320px;
  overflow: hidden;
}

.document-preview__frame iframe,
.document-preview__frame img {
  border: 0;
  display: block;
  height: 420px;
  object-fit: contain;
  width: 100%;
}

.document-preview__frame img {
  background: #ffffff;
  padding: 12px;
}

.document-preview__fallback {
  align-content: center;
  display: grid;
  gap: 10px;
  justify-items: center;
  min-height: 320px;
  padding: 24px;
  text-align: center;
}

.document-preview__fallback p {
  color: var(--muted);
  margin: 0;
}

@media (max-width: 720px) {
  .document-preview__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
