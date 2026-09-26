import axios from 'axios'

export function createApiClient(baseURL: string, token: string | null) {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }
  )

  return client
}
