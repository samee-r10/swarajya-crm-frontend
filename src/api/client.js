// In development this is '' (empty) so Vite's proxy forwards /api/* to localhost:5001.
// In production this is set in .env.production to the Vercel backend URL.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

// In-flight GET request deduplication map: path -> Promise
const inFlightRequests = new Map()

// Short TTL memory cache for static / master lookup endpoints
const memoryCache = new Map()

// Paths safe for short-lived client caching (e.g. 60 seconds)
const CACHEABLE_PREFIXES = [
  '/api/options',
  '/api/settings/',
  '/api/setup/objects',
  '/api/setup/fields',
  '/api/company',
  '/api/approvals/eligible-delegates'
]

function isCacheable(path) {
  return CACHEABLE_PREFIXES.some(prefix => path.startsWith(prefix))
}

export function clearApiCache() {
  memoryCache.clear()
}

export async function apiGet(path, options = {}) {
  const bypassCache = options.bypassCache === true
  const now = Date.now()

  if (!bypassCache && isCacheable(path)) {
    const cached = memoryCache.get(path)
    if (cached && cached.expiry > now) {
      return JSON.parse(JSON.stringify(cached.data))
    }
  }

  // Deduplicate identical in-flight GET requests
  if (inFlightRequests.has(path)) {
    return inFlightRequests.get(path)
  }

  const reqPromise = (async () => {
    try {
      const data = await apiRequest(path, options)
      if (isCacheable(path)) {
        memoryCache.set(path, {
          data,
          expiry: Date.now() + 60000 // 60 seconds TTL
        })
      }
      return data
    } finally {
      inFlightRequests.delete(path)
    }
  })()

  inFlightRequests.set(path, reqPromise)
  return reqPromise
}

export async function apiPost(path, body = {}) {
  clearApiCache()
  return apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function apiPut(path, body = {}) {
  clearApiCache()
  return apiRequest(path, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export async function apiDelete(path) {
  clearApiCache()
  return apiRequest(path, {
    method: 'DELETE'
  })
}

export async function apiUploadFile(path, file, extraFields = {}) {
  clearApiCache()
  const formData = new FormData()
  formData.append('file', file)
  Object.entries(extraFields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value)
  })
  return apiRequest(path, {
    method: 'POST',
    body: formData,
    headers: {}
  }, { multipart: true })
}

async function apiRequest(path, options = {}, requestOptions = {}) {
  const url = `${API_BASE}${path}`
  window.dispatchEvent(new CustomEvent('app-loading-start'))
  try {
    const headers = requestOptions.multipart
      ? { Accept: 'application/json', ...(options.headers || {}) }
      : {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
    const response = await fetch(url, {
      credentials: 'include',
      headers,
      ...options
    })

    if (!response.ok) {
      let message = `Request failed: ${response.status}`
      try {
        const data = await response.json()
        message = data.error || message
      } catch (error) {
        message = `Request failed: ${response.status}`
      }
      if (response.status === 401) {
        window.localStorage.removeItem('lms_user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
      throw new Error(message)
    }

    return response.json()
  } finally {
    window.dispatchEvent(new CustomEvent('app-loading-stop'))
  }
}
