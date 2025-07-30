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
 * Detects if the current device is running iOS
 * @returns boolean indicating if the device is iOS
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
}

/**
 * Debug function to log device detection information
 * Useful for troubleshooting mobile/iOS detection issues
 */
export function debugDeviceDetection(): void {
  if (typeof window === 'undefined') {
    console.log('Device detection: Server-side rendering')
    return
  }
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  const isMobile = isMobileDevice()
  const isIOS = isIOSDevice()
  
  console.log('Device Detection Debug:', {
    userAgent,
    isMobile,
    isIOS,
    hasTouch: 'ontouchstart' in window,
    maxTouchPoints: navigator.maxTouchPoints
  })
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

/**
 * Hook to detect iOS device with state updates
 * @returns boolean indicating if the device is iOS
 */
export function useIOSDetection(): boolean {
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const checkIOS = () => {
      setIsIOS(isIOSDevice())
    }
    
    checkIOS()
    window.addEventListener('resize', checkIOS)
    return () => window.removeEventListener('resize', checkIOS)
  }, [])

  return isIOS
} 