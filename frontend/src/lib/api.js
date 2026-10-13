export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: 'include',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || 'The request could not be completed.')
    error.status = response.status
    error.fields = data.errors || {}
    throw error
  }
  return data
}