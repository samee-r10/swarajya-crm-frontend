// In development this is '' (empty) so Vite's proxy forwards /api/* to localhost:5001.
// In production this is set in .env.production to the Vercel backend URL.
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function apiGet(path) {
  return apiRequest(path)
}

export async function apiPost(path, body = {}) {
  return apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function apiPut(path, body = {}) {
  return apiRequest(path, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export async function apiDelete(path) {
  return apiRequest(path, {
    method: 'DELETE'
  })
}

export async function apiUploadFile(path, file, extraFields = {}) {
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
