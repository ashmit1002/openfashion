// Email validation utility functions

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  // Basic email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  
  if (!email) {
    return { isValid: false, error: "Email is required" }
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" }
  }
  
  // Check for common invalid patterns
  if (email.includes('..')) {
    return { isValid: false, error: "Email cannot contain consecutive dots" }
  }
  
  if (email.startsWith('.') || email.endsWith('.')) {
    return { isValid: false, error: "Email cannot start or end with a dot" }
  }
  
  if (email.includes('@.') || email.includes('.@')) {
    return { isValid: false, error: "Invalid email format" }
  }
  
  // Check length
  if (email.length > 254) {
    return { isValid: false, error: "Email is too long" }
  }
  
  // Check for valid TLD (top-level domain)
  const parts = email.split('@')
  if (parts.length !== 2) {
    return { isValid: false, error: "Invalid email format" }
  }
  
  const domain = parts[1]
  if (domain.length < 3) {
    return { isValid: false, error: "Invalid domain" }
  }
  
  // Check for valid TLD length (2-6 characters)
  const tld = domain.split('.').pop()
  if (!tld || tld.length < 2 || tld.length > 6) {
    return { isValid: false, error: "Invalid domain extension" }
  }
  
  return { isValid: true }
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: "Password is required" }
  }
  
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long" }
  }
  
  if (password.length > 128) {
    return { isValid: false, error: "Password is too long" }
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter" }
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter" }
  }
  
  // Check for at least one digit
  if (!/\d/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number" }
  }
  
  return { isValid: true }
}

export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username) {
    return { isValid: false, error: "Username is required" }
  }
  
  if (username.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters long" }
  }
  
  if (username.length > 30) {
    return { isValid: false, error: "Username must be less than 30 characters" }
  }
  
  // Only allow alphanumeric characters and underscores
  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: "Username can only contain letters, numbers, and underscores" }
  }
  
  // Cannot start with a number
  if (/^\d/.test(username)) {
    return { isValid: false, error: "Username cannot start with a number" }
  }
  
  return { isValid: true }
} 