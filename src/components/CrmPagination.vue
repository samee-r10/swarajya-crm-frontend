<template>
  <nav class="crm-pagination" :aria-label="ariaLabel">
    <p class="crm-pagination__summary">
      Showing <strong>{{ rangeStart }}</strong>–<strong>{{ rangeEnd }}</strong>
      of <strong>{{ totalItems }}</strong> records
    </p>

    <div class="crm-pagination__controls">
      <button
        type="button"
        class="crm-pagination__button crm-pagination__button--nav"
        :disabled="safePage <= 1"
        aria-label="Go to previous page"
        @click="selectPage(safePage - 1)"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path d="m15.4 16.6-4.6-4.6 4.6-4.6L14 6l-6 6 6 6 1.4-1.4Z" fill="currentColor" />
        </svg>
        <span>Previous</span>
      </button>

      <div class="crm-pagination__pages" aria-label="Pagination pages">
        <template v-for="item in visiblePages" :key="item.key">
          <span v-if="item.type === 'ellipsis'" class="crm-pagination__ellipsis" aria-hidden="true">…</span>
          <button
            v-else
            type="button"
            class="crm-pagination__button crm-pagination__button--page"
            :class="{ active: item.page === safePage }"
            :aria-current="item.page === safePage ? 'page' : undefined"
            :aria-label="`Go to page ${item.page}`"
            @click="selectPage(item.page)"
          >
            {{ item.page }}
          </button>
        </template>
      </div>

      <button
        type="button"
        class="crm-pagination__button crm-pagination__button--nav"
        :disabled="safePage >= safeTotalPages"
        aria-label="Go to next page"
        @click="selectPage(safePage + 1)"
      >
        <span>Next</span>
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path d="m8.6 16.6 4.6-4.6-4.6-4.6L10 6l6 6-6 6-1.4-1.4Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  totalItems: { type: Number, default: 0 },
  pageSize: { type: Number, default: 10 },
  ariaLabel: { type: String, default: 'Table pagination' }
})

const emit = defineEmits(['update:page'])

const safeTotalPages = computed(() => Math.max(1, Number(props.totalPages) || 1))
const safePage = computed(() => Math.min(Math.max(1, Number(props.page) || 1), safeTotalPages.value))
const rangeStart = computed(() => props.totalItems ? ((safePage.value - 1) * props.pageSize) + 1 : 0)
const rangeEnd = computed(() => Math.min(safePage.value * props.pageSize, props.totalItems))

const visiblePages = computed(() => {
  const total = safeTotalPages.value
  const current = safePage.value
  if (total <= 7) return Array.from({ length: total }, (_, index) => ({ type: 'page', page: index + 1, key: `page-${index + 1}` }))

  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter(page => page > 0 && page <= total).sort((a, b) => a - b)
  const result = []
  sorted.forEach((page, index) => {
    if (index && page - sorted[index - 1] > 1) result.push({ type: 'ellipsis', key: `ellipsis-${page}` })
    result.push({ type: 'page', page, key: `page-${page}` })
  })
  return result
})

function selectPage(page) {
  if (page < 1 || page > safeTotalPages.value || page === safePage.value) return
  emit('update:page', page)
}
</script>

<style scoped>
.crm-pagination {
  align-items: center;
  background: #ffffff;
  border-top: 1px solid #e3e9f0;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  min-height: 56px;
  padding: 9px 14px;
}

.crm-pagination__summary {
  color: var(--muted);
  font-size: 11.5px;
  margin: 0;
  white-space: nowrap;
}

.crm-pagination__summary strong {
  color: var(--heading);
  font-variant-numeric: tabular-nums;
}

.crm-pagination__controls,
.crm-pagination__pages {
  align-items: center;
  display: flex;
  gap: 6px;
}

.crm-pagination__button {
  align-items: center;
  background: #ffffff;
  border: 1px solid #d5dde7;
  border-radius: 6px;
  color: var(--muted-strong);
  cursor: pointer;
  display: inline-flex;
  font-family: var(--font-sans);
  font-size: 11.5px;
  font-weight: 650;
  justify-content: center;
  min-height: 32px;
  transition: var(--transition-fast);
}

.crm-pagination__button:hover:not(:disabled) {
  background: #f3f7fb;
  border-color: #9db4ca;
  color: #b65309;
}

.crm-pagination__button:disabled {
  background: #f5f7fa;
  color: #a6b0bf;
  cursor: not-allowed;
}

.crm-pagination__button--nav {
  gap: 5px;
  padding: 0 11px;
}

.crm-pagination__button--page {
  min-width: 32px;
  padding: 0 8px;
}

.crm-pagination__button--page.active {
  background: #d9670e;
  border-color: #d9670e;
  box-shadow: none;
  color: #ffffff;
}

.crm-pagination__ellipsis {
  color: var(--muted);
  display: inline-flex;
  justify-content: center;
  min-width: 22px;
}

@media (max-width: 720px) {
  .crm-pagination {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .crm-pagination__summary {
    text-align: center;
  }

  .crm-pagination__controls {
    justify-content: space-between;
  }

  .crm-pagination__pages {
    display: none;
  }
}
</style>
