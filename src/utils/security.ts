/**
 * Security utilities for input validation and XSS prevention
 */

// Input sanitization for different data types
export const sanitizeInput = {
  /**
   * Sanitize text input to prevent XSS
   */
  text: (input: string): string => {
    if (!input) return ''
    
    return input
      .replace(/[<>'"&]/g, (match) => {
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        }
        return escapeMap[match] || match
      })
      .trim()
  },

  /**
   * Sanitize email input
   */
  email: (input: string): string => {
    if (!input) return ''
    
    const sanitized = sanitizeInput.text(input)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    return emailRegex.test(sanitized) ? sanitized : ''
  },

  /**
   * Sanitize phone number input
   */
  phone: (input: string): string => {
    if (!input) return ''
    
    return input.replace(/[^\d+\-\s()]/g, '').trim()
  },

  /**
   * Sanitize numeric input
   */
  number: (input: string | number): number => {
    if (typeof input === 'number') return input
    if (!input) return 0
    
    const parsed = parseFloat(input.toString().replace(/[^\d.-]/g, ''))
    return isNaN(parsed) ? 0 : parsed
  },

  /**
   * Sanitize wallet address
   */
  walletAddress: (input: string): string => {
    if (!input) return ''
    
    // Solana wallet addresses are base58 encoded, 32-44 characters
    const cleaned = input.replace(/[^A-Za-z0-9]/g, '')
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    
    return solanaAddressRegex.test(cleaned) ? cleaned : ''
  }
}

// Input validation rules
export const validateInput = {
  /**
   * Validate required field
   */
  required: (value: any, fieldName: string): string | null => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName}은(는) 필수 입력 항목입니다.`
    }
    return null
  },

  /**
   * Validate email format
   */
  email: (email: string): string | null => {
    const sanitized = sanitizeInput.email(email)
    if (!sanitized) {
      return '올바른 이메일 형식이 아닙니다.'
    }
    
    if (sanitized.length > 254) {
      return '이메일이 너무 깁니다.'
    }
    
    return null
  },

  /**
   * Validate password strength
   */
  password: (password: string): string | null => {
    if (!password) {
      return '비밀번호를 입력해주세요.'
    }
    
    if (password.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다.'
    }
    
    if (password.length > 128) {
      return '비밀번호가 너무 깁니다.'
    }
    
    // Check for common weak patterns
    const weakPatterns = [
      /^(.)\1+$/, // All same character
      /^12345678/, // Sequential numbers
      /^password/i, // Contains "password"
      /^admin/i // Contains "admin"
    ]
    
    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        return '보안상 안전하지 않은 비밀번호입니다.'
      }
    }
    
    return null
  },

  /**
   * Validate GLI-B/GLI-L token amount
   */
  tokenAmount: (amount: string | number): string | null => {
    const numericAmount = sanitizeInput.number(amount)
    
    if (numericAmount <= 0) {
      return '금액은 0보다 커야 합니다.'
    }
    
    if (numericAmount > 1000000) {
      return '금액이 너무 큽니다.'
    }
    
    // Check for reasonable decimal places (max 8 for tokens)
    const amountStr = numericAmount.toString()
    const decimalPlaces = amountStr.includes('.') ? amountStr.split('.')[1].length : 0
    
    if (decimalPlaces > 8) {
      return '소수점 이하 8자리까지만 입력 가능합니다.'
    }
    
    return null
  },

  /**
   * Validate Solana wallet address
   */
  walletAddress: (address: string): string | null => {
    const sanitized = sanitizeInput.walletAddress(address)
    
    if (!sanitized) {
      return '올바른 솔라나 지갑 주소가 아닙니다.'
    }
    
    return null
  }
}

// CSRF protection utilities
export const csrfProtection = {
  /**
   * Generate CSRF token
   */
  generateToken: (): string => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  },

  /**
   * Store CSRF token in session storage
   */
  storeToken: (token: string): void => {
    try {
      sessionStorage.setItem('csrf_token', token)
    } catch (error) {
      console.warn('Failed to store CSRF token:', error)
    }
  },

  /**
   * Get CSRF token from session storage
   */
  getToken: (): string | null => {
    try {
      return sessionStorage.getItem('csrf_token')
    } catch (error) {
      console.warn('Failed to get CSRF token:', error)
      return null
    }
  },

  /**
   * Clear CSRF token
   */
  clearToken: (): void => {
    try {
      sessionStorage.removeItem('csrf_token')
    } catch (error) {
      console.warn('Failed to clear CSRF token:', error)
    }
  }
}

// Rate limiting for client-side actions
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}

  /**
   * Check if action is rate limited
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(identifier) || []
    
    // Filter out old attempts
    const recentAttempts = attempts.filter(time => now - time < this.windowMs)
    
    if (recentAttempts.length >= this.maxAttempts) {
      return true
    }
    
    // Record this attempt
    recentAttempts.push(now)
    this.attempts.set(identifier, recentAttempts)
    
    return false
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

// Login attempt rate limiter
export const loginRateLimiter = new RateLimiter(3, 300000) // 3 attempts per 5 minutes

// API request rate limiter
export const apiRateLimiter = new RateLimiter(100, 60000) // 100 requests per minute

// Secure storage utilities
export const secureStorage = {
  /**
   * Encrypt and store sensitive data
   */
  setItem: (key: string, value: string): void => {
    try {
      // In production, implement proper encryption
      // For now, use base64 encoding as basic obfuscation
      const encoded = btoa(value)
      localStorage.setItem(`sec_${key}`, encoded)
    } catch (error) {
      console.warn('Failed to store secure item:', error)
    }
  },

  /**
   * Decrypt and retrieve sensitive data
   */
  getItem: (key: string): string | null => {
    try {
      const encoded = localStorage.getItem(`sec_${key}`)
      if (!encoded) return null
      
      return atob(encoded)
    } catch (error) {
      console.warn('Failed to retrieve secure item:', error)
      return null
    }
  },

  /**
   * Remove sensitive data
   */
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(`sec_${key}`)
    } catch (error) {
      console.warn('Failed to remove secure item:', error)
    }
  },

  /**
   * Clear all secure storage
   */
  clear: (): void => {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('sec_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to clear secure storage:', error)
    }
  }
}

// Data masking utilities
export const dataMasking = {
  /**
   * Mask email address
   */
  email: (email: string): string => {
    if (!email || !email.includes('@')) return email
    
    const [localPart, domain] = email.split('@')
    if (localPart.length <= 2) return email
    
    const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
    return `${maskedLocal}@${domain}`
  },

  /**
   * Mask phone number
   */
  phone: (phone: string): string => {
    if (!phone || phone.length < 4) return phone
    
    return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3)
  },

  /**
   * Mask wallet address
   */
  walletAddress: (address: string): string => {
    if (!address || address.length < 8) return address
    
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  },

  /**
   * Mask token amount (for privacy)
   */
  tokenAmount: (amount: number): string => {
    if (amount === 0) return '0'
    
    return '***'
  }
}

// Security event logging
export const securityLogger = {
  /**
   * Log security event
   */
  log: (event: string, details?: any): void => {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    // In production, send to security monitoring service
    console.warn('[SECURITY]', logEntry)
  },

  /**
   * Log failed login attempt
   */
  logFailedLogin: (identifier: string): void => {
    securityLogger.log('FAILED_LOGIN', { identifier })
  },

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity: (activity: string, details?: any): void => {
    securityLogger.log('SUSPICIOUS_ACTIVITY', { activity, details })
  },

  /**
   * Log data access
   */
  logDataAccess: (resource: string, action: string): void => {
    securityLogger.log('DATA_ACCESS', { resource, action })
  }
}