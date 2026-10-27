const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
const API_BASE_URL = (configuredApiUrl || (import.meta.env.DEV ? '/api' : '')).replace(/\/+$/, '')

export async function api(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('The production API is not configured. Set VITE_API_URL in Vercel to your deployed backend URL ending in /api, then redeploy.')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Unable to reach the CodeMentor API. Check that VITE_API_URL points to your deployed backend and that its CLIENT_ORIGIN allows this site.')
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`The API returned a non-JSON response (HTTP ${response.status}). Verify that VITE_API_URL points to your backend API and ends in /api.`)
  }

  const data = await response.json()
  if (!response.ok) {
    const error = new Error(data.message || 'The request could not be completed.')
    error.status = response.status
    throw error
  }
  return data
}
