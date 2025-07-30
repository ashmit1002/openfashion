import { useState, useEffect } from "react"

/**
 * Detects if the current device is a mobile device
 * @returns boolean indicating if the device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  return isMobileDevice || isTouchDevice
}

/**
 * Hook to detect mobile device with state updates
 * @returns boolean indicating if the device is mobile
 */
export function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice())
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
} 