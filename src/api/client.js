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

async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
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
}
