<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '../config/constant.js'

const router = useRouter()
const username = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  errorMsg.value = ''
  isLoading.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    })
    
    const data = await response.json()
    
    if (data.status === 'success' && data.token) {
      localStorage.setItem('tce_token', data.token)
      localStorage.setItem('tce_user', JSON.stringify(data.user))
      router.push('/dashboard')
    } else {
      errorMsg.value = data.message || 'Login failed. Please verify credentials.'
    }
  } catch (err) {
    console.error(err)
    errorMsg.value = 'A network error occurred connecting to the API.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo">
        <div class="logo-icon">TC</div>
        <h2>TCExam</h2>
      </div>
      
      <p class="subtitle">Welcome back! Please login to your account.</p>

      <div v-if="errorMsg" class="error-banner">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="Enter your username"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="input-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="••••••••"
            required
            :disabled="isLoading"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="!isLoading">Login</span>
          <span v-else class="loader"></span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  font-family: 'Inter', sans-serif;
}

.login-card {
  background: white;
  width: 100%;
  max-width: 420px;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.05);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  margin-bottom: 12px;
}

.logo-icon {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.logo h2 {
  font-size: 26px;
  font-weight: 800;
  color: #111827;
  margin: 0;
  letter-spacing: -0.5px;
}

.subtitle {
  text-align: center;
  color: #6b7280;
  font-size: 15px;
  margin-bottom: 32px;
}

.error-banner {
  background-color: #fef2f2;
  color: #b91c1c;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 24px;
  border-left: 4px solid #ef4444;
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.input-group input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
  font-size: 15px;
  color: #111827;
  transition: all 0.2s;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: #4f46e5;
  background-color: white;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  color: white;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
