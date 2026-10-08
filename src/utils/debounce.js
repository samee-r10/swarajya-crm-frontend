import { customRef } from 'vue'

export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

export function useDebouncedRef(initialValue, delay = 300) {
  let timeout = null
  let state = initialValue
  return customRef((track, trigger) => {
    return {
      get() {
        track()
        return state
      },
      set(newValue) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          state = newValue
          trigger()
        }, delay)
      }
    }
  })
}
