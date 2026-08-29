<template>
  <Teleport to="body">
    <div v-if="modelValue" class="viewer-overlay" @click.self="close">
      <section class="viewer-shell" :class="{ fullscreen: isFullscreen }" ref="viewerShell">
        
        <!-- Premium Dark Toolbar -->
        <header class="viewer-toolbar">
          <!-- File Metadata -->
          <div class="viewer-file-info">
            <div class="file-icon-badge" :class="`badge-${currentType.kind}`">
              <span>{{ currentTypeLabel }}</span>
            </div>
            <div class="file-text-meta">
              <strong :title="currentName">{{ currentName }}</strong>
              <small>
                <span class="file-tag">{{ currentTypeLabel }}</span>
                <span v-if="documents.length > 1" class="attachment-counter">
                  · Attachment {{ activeIndex + 1 }} of {{ documents.length }}
                </span>
                <span v-if="isPdf && pdfPageList.length > 0" class="attachment-counter">
                  · {{ pdfPageList.length }} Page{{ pdfPageList.length > 1 ? 's' : '' }} (Vertical Scroll)
                </span>
              </small>
            </div>
          </div>

          <!-- Grouped Action Toolbar -->
          <div class="viewer-toolbar-actions">
            
            <!-- Attachment Switcher (for multi-attachment) -->
            <div v-if="documents.length > 1" class="control-group">
              <button type="button" class="btn-icon-pill" :disabled="activeIndex === 0" title="Previous document" @click="previousDocument">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span class="pill-label">{{ activeIndex + 1 }} / {{ documents.length }}</span>
              <button type="button" class="btn-icon-pill" :disabled="activeIndex === documents.length - 1" title="Next document" @click="nextDocument">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            <div v-if="documents.length > 1" class="divider"></div>

            <!-- Zoom Controls -->
            <div v-if="canZoom" class="control-group">
              <button type="button" class="btn-icon-pill" title="Zoom out" @click="zoomOut">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
              <button type="button" class="btn-icon-pill" title="Zoom in" @click="zoomIn">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <button type="button" class="btn-text-pill" :class="{ active: fitMode === 'page-width' }" title="Fit to width" @click="fitToWidth">
                Fit Width
              </button>
              <button type="button" class="btn-text-pill" :class="{ active: fitMode === 'page-fit' }" title="Fit to page" @click="fitToPage">
                Fit Page
              </button>
            </div>

            <div v-if="canZoom" class="divider"></div>

            <!-- View Options: Rotate & Fullscreen -->
            <div class="control-group">
              <button v-if="canRotate" type="button" class="btn-icon-pill" title="Rotate document" @click="rotate">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              </button>
              <button type="button" class="btn-icon-pill" :class="{ active: isFullscreen }" title="Toggle Fullscreen" @click="toggleFullscreen">
                <svg v-if="!isFullscreen" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              </button>
            </div>

            <div class="divider"></div>

            <!-- Primary Actions: Download, Print, Open -->
            <div class="control-group actions-group">
              <a :href="currentUrl" :download="currentName" class="btn-action primary" title="Download Document">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                <span>Download</span>
              </a>
              <button v-if="canPrint" type="button" class="btn-icon-pill" title="Print document" @click="printDocument">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              </button>
              <a :href="currentUrl" target="_blank" rel="noopener" class="btn-icon-pill" title="Open in new browser tab">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
              </a>
            </div>

            <!-- Close Button -->
            <button type="button" class="btn-close" title="Close preview (Esc)" @click="close">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

          </div>
        </header>

        <!-- Canvas Stage Area (Vertical Trackpad / Mouse Scrollable) -->
        <div class="viewer-stage" @pointerdown="startPan" @pointermove="pan" @pointerup="endPan" @pointercancel="endPan" @pointerleave="endPan">
          <div class="viewer-canvas-wrap">
            
            <!-- Continuous Vertical PDF Page Stack -->
            <div v-if="isPdf" class="pdf-vertical-stack">
              <div 
                v-for="pg in pdfPageList" 
                :key="pg" 
                class="pdf-page-card"
                :class="{ 'fit-width': fitMode === 'page-width' }"
                :style="pdfTransformStyle"
              >
                <img 
                  :src="pdfPageUrl(pg)" 
                  :alt="`${currentName} - Page ${pg}`" 
                  class="pdf-page-img"
                  loading="lazy"
                  @error="handlePageLoadError(pg)"
                />
                <div class="page-number-badge">Page {{ pg }} of {{ pdfPageList.length }}</div>
              </div>
            </div>

            <!-- Single Image View -->
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
              <div class="fallback-card">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #94a3b8; margin-bottom: 8px;">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <h3>Preview not available for this file type</h3>
                <p>You can download or open this document directly in a new browser tab.</p>
                <div class="fallback-actions">
                  <a class="button primary" :href="currentUrl" :download="currentName">Download Document</a>
                  <a class="button secondary" :href="currentUrl" target="_blank" rel="noopener">Open in New Tab</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Attachment Thumbnails Footer (if > 1 document) -->
        <footer v-if="documents.length > 1" class="viewer-thumbnails">
          <button
            v-for="(doc, index) in documents"
            :key="documentKey(doc, index)"
            type="button"
            class="thumb-item"
            :class="{ active: index === activeIndex }"
            @click="setActive(index)"
          >
            <span class="thumb-num">{{ index + 1 }}</span>
            <strong class="thumb-title">{{ documentName(doc) }}</strong>
          </button>
        </footer>

      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { API_BASE } from '../api/client'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  documents: { type: Array, default: () => [] },
  initialIndex: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue'])

const activeIndex = ref(0)
const zoom = ref(1)
const rotation = ref(0)
const fitMode = ref('page-fit')
const isFullscreen = ref(false)
const viewerShell = ref(null)
const panOffset = ref({ x: 0, y: 0 })
const panStart = ref(null)

// Vertical PDF pages stack
const pdfPageList = ref([1, 2, 3, 4, 5])

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

const pdfTransformStyle = computed(() => {
  const baseWidth = fitMode.value === 'page-width' ? 1080 : 820
  const width = Math.round(baseWidth * zoom.value)
  return {
    width: `${width}px`,
    maxWidth: '98%',
    transform: `rotate(${rotation.value}deg)`
  }
})

function pdfPageUrl(page) {
  const raw = currentUrl.value
  if (!raw) return ''
  if (raw.includes('/api/uploads/preview')) {
    const separator = raw.includes('?') ? '&' : '?'
    return `${raw}${separator}page=${page}`
  }
  return raw
}

function handlePageLoadError(page) {
  if (page > 1 && pdfPageList.value.includes(page)) {
    pdfPageList.value = pdfPageList.value.filter(p => p < page)
  }
}

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

function zoomIn() {
  fitMode.value = ''
  zoom.value = Math.min(3, Number((zoom.value + 0.15).toFixed(2)))
}

function zoomOut() {
  fitMode.value = ''
  zoom.value = Math.max(0.5, Number((zoom.value - 0.15).toFixed(2)))
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
  fitMode.value = 'page-fit'
  panOffset.value = { x: 0, y: 0 }
  panStart.value = null
  pdfPageList.value = [1, 2, 3, 4, 5]
  nextTick(() => {
    isFullscreen.value = Boolean(document.fullscreenElement)
  })
}

function documentKey(doc, index) {
  return doc?.public_id || doc?.preview_url || doc?.secure_url || doc?.url || doc?.data_url || doc?.name || index
}

function documentUrl(doc) {
  if (!doc) return ''
  if (doc.preview_url) return normalizeDocumentUrl(doc.preview_url)
  const rawUrl = doc.secure_url || doc.url || doc.data_url || doc.href || ''
  if (shouldProxyDocument(doc, rawUrl)) return normalizeDocumentUrl(documentPreviewUrl(doc, rawUrl))
  return normalizeDocumentUrl(rawUrl)
}

function documentName(doc) {
  return doc?.name || doc?.original_filename || doc?.filename || doc?.public_id || 'Uploaded document'
}

function normalizeDocumentUrl(url) {
  if (!url) return ''
  if (url.startsWith('/api/') && API_BASE) return `${API_BASE}${url}`
  return url
}

function shouldProxyDocument(doc, rawUrl) {
  if (!rawUrl || rawUrl.startsWith('data:')) return false
  const type = String(doc?.type || doc?.mime_type || '').toLowerCase()
  const name = documentName(doc).toLowerCase()
  const path = rawUrl.split('?')[0].toLowerCase()
  const isPdf = type.includes('pdf') || name.endsWith('.pdf') || path.endsWith('.pdf')
  return isPdf && rawUrl.includes('cloudinary.com')
}

function documentPreviewUrl(doc, rawUrl) {
  const params = new URLSearchParams({ url: rawUrl })
  const name = documentName(doc)
  if (name) params.set('name', name)
  const type = doc?.type || doc?.mime_type
  if (type) params.set('type', type)
  return `/api/uploads/preview?${params.toString()}`
}

function detectType(doc) {
  const url = documentUrl(doc).toLowerCase()
  const type = String(doc?.type || doc?.mime_type || '').toLowerCase()
  const format = String(doc?.format || '').toLowerCase()
  const name = documentName(doc).toLowerCase()
  const path = url.split('?')[0].toLowerCase()
  const extension = [format, name.split('.').pop(), path.split('.').pop()].find(Boolean) || ''
  
  if (type.includes('pdf') || extension === 'pdf' || name.endsWith('.pdf') || path.endsWith('.pdf') || url.includes('.pdf')) {
    return { kind: 'pdf', label: 'PDF' }
  }
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(extension) || (doc?.resource_type === 'image' && extension !== 'pdf')) {
    return { kind: 'image', label: extension ? extension.toUpperCase() : 'Image' }
  }
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return { kind: 'office', label: extension.toUpperCase() }
  if (type.startsWith('text/') || ['txt', 'csv', 'json', 'xml'].includes(extension)) return { kind: 'text', label: extension ? extension.toUpperCase() : 'Text' }
  return { kind: 'unknown', label: extension ? extension.toUpperCase() : 'File' }
}
</script>

<style scoped>
.viewer-overlay {
  align-items: center;
  background: rgba(11, 15, 25, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 24px;
  position: fixed;
  z-index: 3500;
}

.viewer-shell {
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.6);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: min(94vh, 980px);
  overflow: hidden;
  width: min(1280px, calc(100vw - 40px));
}

.viewer-shell.fullscreen {
  border-radius: 0;
  height: 100vh;
  width: 100vw;
}

/* ── Dark Premium Header Toolbar ── */
.viewer-toolbar {
  align-items: center;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 16px;
  justify-content: space-between;
  min-height: 64px;
  padding: 10px 20px;
}

.viewer-file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.file-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.badge-pdf { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
.badge-image { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
.badge-office { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
.badge-text { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
.badge-unknown { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.3); }

.file-text-meta strong {
  color: #f8fafc;
  display: block;
  font-size: 14px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
}

.file-text-meta small {
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  margin-top: 2px;
}

.file-tag {
  text-transform: uppercase;
  font-weight: 700;
  color: #cbd5e1;
}

.attachment-counter {
  color: #94a3b8;
}

/* ── Grouped Controls ── */
.viewer-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.actions-group {
  background: transparent;
  border: none;
  padding: 0;
}

.divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0 2px;
}

.btn-icon-pill {
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #cbd5e1;
  padding: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  text-decoration: none;
}

.btn-icon-pill:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.btn-icon-pill.active {
  background: var(--primary, #f97316);
  color: #ffffff;
}

.btn-icon-pill:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pill-label,
.zoom-value {
  color: #f1f5f9;
  font-size: 12px;
  font-weight: 700;
  padding: 0 6px;
  min-width: 48px;
  text-align: center;
  user-select: none;
}

.btn-text-pill {
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #cbd5e1;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-text-pill:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.btn-text-pill.active {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.btn-action.primary {
  background: var(--primary, #f97316);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  padding: 7px 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  border: none;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.35);
}

.btn-action.primary:hover {
  background: #ea580c;
  transform: translateY(-1px);
}

.btn-close {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  color: #cbd5e1;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  margin-left: 6px;
}

.btn-close:hover {
  background: rgba(239, 68, 68, 0.25);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}

/* ── Canvas Stage Area ── */
.viewer-stage {
  background: #090d16;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 24px;
}

.viewer-canvas-wrap {
  width: 100%;
  min-height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

/* ── Vertical Continuous PDF Stack ── */
.pdf-vertical-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  padding-bottom: 40px;
}

.pdf-page-card {
  position: relative;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
  overflow: hidden;
  transition: transform 0.15s ease, width 0.15s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pdf-page-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

.page-number-badge {
  position: absolute;
  bottom: 12px;
  right: 14px;
  background: rgba(15, 23, 42, 0.8);
  color: #f8fafc;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  pointer-events: none;
}

.viewer-office {
  background: #ffffff;
  border: 0;
  border-radius: 8px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  display: block;
  height: 100%;
  width: 100%;
}

.viewer-image-wrap {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 100%;
  overflow: hidden;
  padding: 20px;
}

.viewer-image {
  max-height: calc(92vh - 150px);
  max-width: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  transform-origin: center center;
  transition: transform 0.12s ease;
  user-select: none;
}

.viewer-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.fallback-card {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  max-width: 440px;
  color: #ffffff;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.fallback-card h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #f8fafc;
}

.fallback-card p {
  margin: 0 0 20px 0;
  font-size: 13px;
  color: #94a3b8;
}

.fallback-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.viewer-thumbnails {
  background: #0f172a;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 10px 16px;
}

.thumb-item {
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex: 0 0 200px;
  gap: 10px;
  min-width: 0;
  padding: 8px 12px;
  text-align: left;
  transition: all 0.15s ease;
}

.thumb-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.thumb-item.active {
  background: rgba(249, 115, 22, 0.15);
  border-color: var(--primary, #f97316);
}

.thumb-num {
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #f8fafc;
  display: inline-flex;
  flex: 0 0 26px;
  font-size: 11px;
  font-weight: 800;
  height: 26px;
  justify-content: center;
}

.thumb-item.active .thumb-num {
  background: var(--primary, #f97316);
  color: #ffffff;
}

.thumb-title {
  color: #cbd5e1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 840px) {
  .viewer-overlay {
    padding: 0;
  }
  .viewer-shell {
    border-radius: 0;
    height: 100vh;
    width: 100vw;
  }
  .viewer-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .file-text-meta strong {
    max-width: 200px;
  }
  .viewer-toolbar-actions {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 4px;
  }
}
</style>
