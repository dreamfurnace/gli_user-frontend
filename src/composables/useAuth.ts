import { ref, computed } from 'vue'

// Global auth state
const isLoggedIn = ref(false)
const showLoginModal = ref(false)

export const useAuth = () => {
  // Check if user is logged in (you can replace this with actual auth logic)
  const checkAuth = () => {
    // For now, simulate authentication check
    // You can replace this with actual token verification
    const token = localStorage.getItem('access_token')
    isLoggedIn.value = !!token
    return isLoggedIn.value
  }

  const login = () => {
    isLoggedIn.value = true
  }

  const logout = () => {
    isLoggedIn.value = false
    localStorage.removeItem('access_token')
  }

  const requireAuth = () => {
    if (!checkAuth()) {
      showLoginModal.value = true
      return false
    }
    return true
  }

  const closeLoginModal = () => {
    showLoginModal.value = false
  }

  return {
    isLoggedIn: computed(() => isLoggedIn.value),
    showLoginModal: computed(() => showLoginModal.value),
    checkAuth,
    login,
    logout,
    requireAuth,
    closeLoginModal
  }
}