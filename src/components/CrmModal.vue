<template>
  <Teleport to="body">
    <Transition name="crm-modal-fade">
      <div v-if="modelValue" class="crm-modal-overlay" @mousedown.self="handleBackdrop">
        <section
          ref="dialogRef"
          class="crm-modal-dialog"
          :class="`crm-modal-dialog--${size}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
        >
          <header class="crm-modal-header">
            <div class="crm-modal-heading">
              <slot name="heading">
                <h2 :id="titleId">{{ title }}</h2>
                <p v-if="description" :id="descriptionId">{{ description }}</p>
              </slot>
            </div>
            <button class="crm-modal-close" type="button" aria-label="Close dialog" @click="close">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
            </button>
          </header>

          <div class="crm-modal-body"><slot /></div>
          <footer v-if="$slots.footer" class="crm-modal-footer"><slot name="footer" /></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  size: { type: String, default: 'md', validator: value => ['sm', 'md', 'lg', 'xl'].includes(value) },
  closeOnBackdrop: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'close'])
const dialogRef = ref(null)
const modalId = `crm-modal-${Math.random().toString(36).slice(2, 9)}`
const titleId = computed(() => `${modalId}-title`)
const descriptionId = computed(() => `${modalId}-description`)
let previousOverflow = ''
let previouslyFocusedElement = null

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function handleBackdrop() {
  if (props.closeOnBackdrop) close()
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    close()
    return
  }

  if (event.key !== 'Tab' || !dialogRef.value) return
  const focusable = [...dialogRef.value.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter(element => !element.hasAttribute('hidden'))

  if (!focusable.length) {
    event.preventDefault()
    dialogRef.value.focus()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(() => props.modelValue, async open => {
  if (open) {
    previouslyFocusedElement = document.activeElement
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeydown)
    await nextTick()
    dialogRef.value?.focus()
  } else {
    document.body.style.overflow = previousOverflow
    window.removeEventListener('keydown', handleKeydown)
    await nextTick()
    previouslyFocusedElement?.focus?.()
    previouslyFocusedElement = null
  }
}, { immediate: true })

onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.crm-modal-overlay {
  align-items: center;
  background: rgba(36, 31, 27, .56);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 24px;
  position: fixed;
  z-index: 5000;
}

.crm-modal-dialog {
  background: #fff;
  border: 1px solid #ded8d1;
  border-radius: 12px;
  box-shadow: 0 24px 64px rgba(36, 31, 27, .24);
  display: flex;
  flex-direction: column;
  max-height: min(88vh, 900px);
  outline: none;
  overflow: hidden;
  width: min(100%, 680px);
}
.crm-modal-dialog--sm { width: min(100%, 480px); }
.crm-modal-dialog--lg { width: min(100%, 880px); }
.crm-modal-dialog--xl { width: min(100%, 1080px); }

.crm-modal-header {
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #ebe7e2;
  display: flex;
  flex: 0 0 auto;
  justify-content: space-between;
  min-height: 64px;
  padding: 14px 20px 14px 24px;
}
.crm-modal-heading { display: grid; gap: 3px; min-width: 0; }
.crm-modal-heading h2 { color: #241f1b; font-size: 17px; font-weight: 750; letter-spacing: -.015em; margin: 0; }
.crm-modal-heading p { color: #736b64; font-size: 11.5px; line-height: 1.4; margin: 0; }
.crm-modal-close { align-items: center; background: transparent; border: 0; border-radius: 6px; color: #817870; cursor: pointer; display: inline-flex; height: 34px; justify-content: center; padding: 0; width: 34px; }
.crm-modal-close:hover { background: #fff4e5; color: #a94f0a; }
.crm-modal-body { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 22px 24px 24px; }
.crm-modal-footer { align-items: center; background: #faf9f7; border-top: 1px solid #ebe7e2; display: flex; flex: 0 0 auto; gap: 8px; justify-content: flex-end; min-height: 64px; padding: 12px 24px; }
.crm-modal-fade-enter-active, .crm-modal-fade-leave-active { transition: opacity 160ms ease; }
.crm-modal-fade-enter-active .crm-modal-dialog, .crm-modal-fade-leave-active .crm-modal-dialog { transition: transform 180ms ease, opacity 160ms ease; }
.crm-modal-fade-enter-from, .crm-modal-fade-leave-to { opacity: 0; }
.crm-modal-fade-enter-from .crm-modal-dialog, .crm-modal-fade-leave-to .crm-modal-dialog { opacity: 0; transform: translateY(8px) scale(.99); }

@media (max-width: 640px) {
  .crm-modal-overlay { align-items: flex-end; padding: 0; }
  .crm-modal-dialog, .crm-modal-dialog--sm, .crm-modal-dialog--lg, .crm-modal-dialog--xl { border-radius: 12px 12px 0 0; max-height: 94vh; width: 100%; }
  .crm-modal-header { padding-inline: 18px 14px; }
  .crm-modal-body { padding: 18px; }
  .crm-modal-footer { padding-inline: 18px; }
}
</style>
