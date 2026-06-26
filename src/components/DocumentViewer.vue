<template>
  <Teleport to="body">
    <div v-if="modelValue" class="viewer-overlay" @click.self="close">
      <section class="viewer-shell" :class="{ fullscreen: isFullscreen }" ref="viewerShell">
        <header class="viewer-toolbar">
          <div class="viewer-file">
            <strong>{{ currentName }}</strong>
            <span>{{ currentTypeLabel }}<template v-if="documents.length > 1"> · Attachment {{ activeIndex + 1 }} of {{ documents.length }}</template></span>
          </div>

          <div class="viewer-controls" aria-label="Document controls">
            <button v-if="documents.length > 1" type="button" class="viewer-btn" :disabled="activeIndex === 0" title="Previous attachment" @click="previousDocument">Prev</button>
            <button v-if="documents.length > 1" type="button" class="viewer-btn" :disabled="activeIndex === documents.length - 1" title="Next attachment" @click="nextDocument">Next</button>
            <button v-if="isPdf" type="button" class="viewer-btn" title="Previous page" :disabled="pageNumber <= 1" @click="previousPage">Page -</button>
            <span v-if="isPdf" class="viewer-page">Page {{ pageNumber }}</span>
            <button v-if="isPdf" type="button" class="viewer-btn" title="Next page" @click="nextPage">Page +</button>
            <button v-if="canZoom" type="button" class="viewer-btn" title="Zoom out" @click="zoomOut">-</button>
            <button v-if="canZoom" type="button" class="viewer-btn" title="Fit to width" @click="fitToWidth">Fit Width</button>
            <button v-if="canZoom" type="button" class="viewer-btn" title="Fit to page" @click="fitToPage">Fit Page</button>
            <button v-if="canZoom" type="button" class="viewer-btn" title="Zoom in" @click="zoomIn">+</button>
            <button v-if="canRotate" type="button" class="viewer-btn" title="Rotate" @click="rotate">Rotate</button>
            <button type="button" class="viewer-btn" title="Full screen" @click="toggleFullscreen">Full Screen</button>
            <a class="viewer-btn" :href="currentUrl" :download="currentName" title="Download">Download</a>
            <button type="button" class="viewer-btn" title="Print" :disabled="!canPrint" @click="printDocument">Print</button>
            <a class="viewer-btn" :href="currentUrl" target="_blank" rel="noopener" title="Open in new tab">Open</a>
            <button type="button" class="viewer-close" title="Close" @click="close">&times;</button>
          </div>
        </header>

        <div class="viewer-stage" @pointerdown="startPan" @pointermove="pan" @pointerup="endPan" @pointercancel="endPan" @pointerleave="endPan">
          <iframe
            v-if="isPdf"
            class="viewer-pdf"
            :src="pdfViewerUrl"
            :title="currentName"
            :style="pdfTransform"
            loading="lazy"
            referrerpolicy="no-referrer"
          ></iframe>

          <div v-else-if="isImage" class="viewer-image-wrap">
            <img
              :src="currentUrl"
              :alt="currentName"
              class="viewer-image"
              :style="imageTransform"
              draggable="false"
            >
          </div>

          <iframe
            v-else-if="canEmbed"
            class="viewer-office"
            :src="currentUrl"
            :title="currentName"
            loading="lazy"
            referrerpolicy="no-referrer"
          ></iframe>

          <div v-else class="viewer-fallback">
            <strong>Preview not available for this file type.</strong>
            <p>This file can still be downloaded or opened in a new tab if your browser supports it.</p>
            <div>
              <a class="button secondary small" :href="currentUrl" :download="currentName">Download</a>
              <a class="button secondary small" :href="currentUrl" target="_blank" rel="noopener">Open in New Tab</a>
            </div>
          </div>
        </div>

        <footer v-if="documents.length > 1" class="viewer-thumbnails">
          <button
            v-for="(doc, index) in documents"
            :key="documentKey(doc, index)"
            type="button"
            :class="{ active: index === activeIndex }"
            @click="setActive(index)"
          >
            <span>{{ index + 1 }}</span>
            <strong>{{ documentName(doc) }}</strong>
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  documents: { type: Array, default: () => [] },
  initialIndex: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue'])

const activeIndex = ref(0)
const zoom = ref(1)
const rotation = ref(0)
const pageNumber = ref(1)
const fitMode = ref('page-width')
const isFullscreen = ref(false)
const viewerShell = ref(null)
const panOffset = ref({ x: 0, y: 0 })
const panStart = ref(null)

const safeDocuments = computed(() => props.documents.filter(documentUrl))
const documents = computed(() => safeDocuments.value.length ? safeDocuments.value : [])
const currentDocument = computed(() => documents.value[activeIndex.value] || null)
const currentUrl = computed(() => documentUrl(currentDocument.value))
const currentName = computed(() => documentName(currentDocument.value))
const currentType = computed(() => detectType(currentDocument.value))
const currentTypeLabel = computed(() => currentType.value.label)
const isPdf = computed(() => currentType.value.kind === 'pdf')
const isImage = computed(() => currentType.value.kind === 'image')
const isOffice = computed(() => currentType.value.kind === 'office')
const canEmbed = computed(() => currentType.value.kind === 'text' || currentUrl.value.startsWith('data:text/'))
const canZoom = computed(() => isPdf.value || isImage.value)
const canRotate = computed(() => isPdf.value || isImage.value)
const canPrint = computed(() => isPdf.value || isImage.value || canEmbed.value)
const imageTransform = computed(() => ({
  transform: `translate(${panOffset.value.x}px, ${panOffset.value.y}px) scale(${zoom.value}) rotate(${rotation.value}deg)`
}))
const pdfTransform = computed(() => ({
  transform: `rotate(${rotation.value}deg)`
}))
const pdfViewerUrl = computed(() => {
  const zoomValue = fitMode.value || Math.round(zoom.value * 100)
  const hash = `page=${pageNumber.value}&zoom=${zoomValue}&toolbar=1&navpanes=1`
  return `${currentUrl.value}#${hash}`
})

watch(() => props.modelValue, (open) => {
  if (!open) return
  activeIndex.value = clampIndex(props.initialIndex)
  resetView()
})

watch(() => props.initialIndex, (index) => {
  if (!props.modelValue) return
  activeIndex.value = clampIndex(index)
  resetView()
})

watch(activeIndex, resetView)

function close() {
  emit('update:modelValue', false)
}

function clampIndex(index) {
  const max = Math.max(0, documents.value.length - 1)
  return Math.min(Math.max(Number(index) || 0, 0), max)
}

function setActive(index) {
  activeIndex.value = clampIndex(index)
}

function previousDocument() {
  setActive(activeIndex.value - 1)
}

function nextDocument() {
  setActive(activeIndex.value + 1)
}

function previousPage() {
  pageNumber.value = Math.max(1, pageNumber.value - 1)
}

function nextPage() {
  pageNumber.value += 1
}

function zoomIn() {
  fitMode.value = ''
  zoom.value = Math.min(4, Number((zoom.value + 0.2).toFixed(2)))
}

function zoomOut() {
  fitMode.value = ''
  zoom.value = Math.max(0.4, Number((zoom.value - 0.2).toFixed(2)))
}

function fitToWidth() {
  fitMode.value = 'page-width'
  zoom.value = 1
  panOffset.value = { x: 0, y: 0 }
}

function fitToPage() {
  fitMode.value = 'page-fit'
  zoom.value = 1
  panOffset.value = { x: 0, y: 0 }
}

function rotate() {
  rotation.value = (rotation.value + 90) % 360
}

async function toggleFullscreen() {
  if (!document.fullscreenElement && viewerShell.value?.requestFullscreen) {
    await viewerShell.value.requestFullscreen()
    isFullscreen.value = true
    return
  }
  if (document.exitFullscreen) await document.exitFullscreen()
  isFullscreen.value = false
}

function printDocument() {
  const printWindow = window.open(currentUrl.value, '_blank')
  if (!printWindow) return
  printWindow.addEventListener('load', () => {
    try {
      printWindow.print()
    } catch {
      // Browser security can block printing cross-origin documents.
    }
  }, { once: true })
}

function startPan(event) {
  if (!isImage.value || zoom.value <= 1) return
  event.currentTarget.setPointerCapture?.(event.pointerId)
  panStart.value = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    offsetX: panOffset.value.x,
    offsetY: panOffset.value.y
  }
}

function pan(event) {
  if (!panStart.value || panStart.value.pointerId !== event.pointerId) return
  panOffset.value = {
    x: panStart.value.offsetX + event.clientX - panStart.value.x,
    y: panStart.value.offsetY + event.clientY - panStart.value.y
  }
}

function endPan(event) {
  if (panStart.value?.pointerId === event.pointerId) panStart.value = null
}

function resetView() {
  zoom.value = 1
  rotation.value = 0
  pageNumber.value = 1
  fitMode.value = 'page-width'
  panOffset.value = { x: 0, y: 0 }
  panStart.value = null
  nextTick(() => {
    isFullscreen.value = Boolean(document.fullscreenElement)
  })
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

function detectType(doc) {
  const url = documentUrl(doc).toLowerCase()
  const type = String(doc?.type || doc?.mime_type || '').toLowerCase()
  const format = String(doc?.format || '').toLowerCase()
  const name = documentName(doc).toLowerCase()
  const extension = [format, name.split('.').pop(), url.split('?')[0].split('.').pop()].find(Boolean) || ''
  if (type.includes('pdf') || extension === 'pdf') return { kind: 'pdf', label: 'PDF' }
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(extension) || doc?.resource_type === 'image') return { kind: 'image', label: extension ? extension.toUpperCase() : 'Image' }
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return { kind: 'office', label: extension.toUpperCase() }
  if (type.startsWith('text/') || ['txt', 'csv', 'json', 'xml'].includes(extension)) return { kind: 'text', label: extension ? extension.toUpperCase() : 'Text' }
  return { kind: 'unknown', label: extension ? extension.toUpperCase() : 'File' }
}
</script>

<style scoped>
.viewer-overlay {
  align-items: center;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(8px);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 20px;
  position: fixed;
  z-index: 3000;
}

.viewer-shell {
  background: #0f172a;
  border: 1px solid rgba(226, 232, 240, 0.18);
  border-radius: 8px;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.36);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: min(92vh, 980px);
  overflow: hidden;
  width: min(1180px, calc(100vw - 40px));
}

.viewer-shell.fullscreen {
  border-radius: 0;
  height: 100vh;
  width: 100vw;
}

.viewer-toolbar {
  align-items: center;
  background: #ffffff;
  border-bottom: 1px solid #dbe3ef;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  min-height: 64px;
  padding: 10px 14px 10px 18px;
}

.viewer-file {
  min-width: 0;
}

.viewer-file strong {
  color: #0f172a;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.viewer-file span {
  color: #64748b;
  display: block;
  font-size: 12px;
  font-weight: 750;
  margin-top: 2px;
}

.viewer-controls {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.viewer-btn,
.viewer-close {
  align-items: center;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #1f2937;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  justify-content: center;
  min-height: 34px;
  padding: 7px 10px;
  text-decoration: none;
}

.viewer-btn:hover,
.viewer-close:hover {
  background: #f8fafc;
  border-color: #2563eb;
  color: #2563eb;
}

.viewer-btn:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.viewer-close {
  color: #64748b;
  font-size: 22px;
  line-height: 1;
  min-width: 36px;
  padding: 3px 9px 6px;
}

.viewer-page {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  padding-inline: 4px;
}

.viewer-stage {
  background: #111827;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  touch-action: pan-x pan-y pinch-zoom;
}

.viewer-pdf,
.viewer-office {
  background: #ffffff;
  border: 0;
  display: block;
  height: 100%;
  transform-origin: center center;
  transition: transform 0.12s ease;
  width: 100%;
}

.viewer-image-wrap {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 100%;
  overflow: hidden;
  padding: 30px;
}

.viewer-image {
  max-height: calc(92vh - 150px);
  max-width: 100%;
  object-fit: contain;
  transform-origin: center center;
  transition: transform 0.12s ease;
  user-select: none;
}

.viewer-fallback {
  align-content: center;
  color: #ffffff;
  display: grid;
  gap: 12px;
  justify-items: center;
  min-height: 100%;
  padding: 32px;
  text-align: center;
}

.viewer-fallback strong {
  font-size: 20px;
}

.viewer-fallback p {
  color: #cbd5e1;
  margin: 0;
}

.viewer-fallback div {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.viewer-thumbnails {
  background: #ffffff;
  border-top: 1px solid #dbe3ef;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 10px 14px;
}

.viewer-thumbnails button {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  flex: 0 0 180px;
  gap: 8px;
  min-width: 0;
  padding: 8px;
  text-align: left;
}

.viewer-thumbnails button.active {
  background: #e8f0ff;
  border-color: #2563eb;
}

.viewer-thumbnails span {
  align-items: center;
  background: #ffffff;
  border-radius: 4px;
  color: #2563eb;
  display: inline-flex;
  flex: 0 0 28px;
  font-size: 12px;
  font-weight: 900;
  height: 28px;
  justify-content: center;
}

.viewer-thumbnails strong {
  color: #0f172a;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .viewer-overlay {
    padding: 0;
  }

  .viewer-shell {
    border-radius: 0;
    height: 100vh;
    width: 100vw;
  }

  .viewer-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .viewer-controls {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .viewer-btn {
    white-space: nowrap;
  }
}
</style>
