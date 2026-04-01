const TOKEN_KEY = 'tce_token'
const USER_KEY = 'tce_user'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const getStoredUser = () => JSON.parse(localStorage.getItem(USER_KEY) || '{}')

export const setAuth = ({ token, user }) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }

  window.dispatchEvent(new Event('storage'))
}

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  window.dispatchEvent(new Event('storage'))
}

export const isAuthenticated = () => getToken() !== null

export const isAdminUser = () => {
  const userData = getStoredUser()
  return !!(userData && parseInt(userData.level || 0, 10) >= 10)
}

export const getAuthHeaders = (headers = {}) => {
  const token = getToken()
  return token
    ? {
        ...headers,
        Authorization: `Bearer ${token}`,
      }
    : headers
}
