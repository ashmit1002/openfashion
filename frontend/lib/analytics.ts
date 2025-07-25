// Google Analytics 4 Measurement ID
const GA_MEASUREMENT_ID = 'G-65LV693YXF'

// Type declaration for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

// Helper function to safely call gtag
const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args)
  }
}

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined') {
    gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    })
  }
}

// Track page views
export const trackPageView = (url: string, title?: string) => {
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title || document.title,
  })
}

// Track user registration
export const trackRegistration = (method: 'email' | 'google' | 'facebook') => {
  gtag('event', 'sign_up', {
    method: method,
    custom_parameter: 'fashion_app_registration'
  })
}

// Track user login
export const trackLogin = (method: 'email' | 'google' | 'facebook') => {
  gtag('event', 'login', {
    method: method,
    custom_parameter: 'fashion_app_login'
  })
}

// Track image upload
export const trackImageUpload = (category: string, isPremium: boolean) => {
  gtag('event', 'image_upload', {
    category: category,
    user_type: isPremium ? 'premium' : 'free',
    custom_parameter: 'fashion_analysis'
  })
}

// Track analysis completion
export const trackAnalysisComplete = (componentsCount: number, isPremium: boolean) => {
  gtag('event', 'analysis_complete', {
    components_analyzed: componentsCount,
    user_type: isPremium ? 'premium' : 'free',
    custom_parameter: 'fashion_analysis_success'
  })
}

// Track shopping results viewed
export const trackShoppingResults = (query: string, resultsCount: number) => {
  gtag('event', 'shopping_results_viewed', {
    search_query: query,
    results_count: resultsCount,
    custom_parameter: 'fashion_shopping'
  })
}

// Track wishlist actions
export const trackWishlistAction = (action: 'add' | 'remove', itemType: string) => {
  gtag('event', 'wishlist_action', {
    action: action,
    item_type: itemType,
    custom_parameter: 'fashion_wishlist'
  })
}

// Track chat interactions
export const trackChatInteraction = (messageType: string, isPremium: boolean) => {
  gtag('event', 'chat_interaction', {
    message_type: messageType,
    user_type: isPremium ? 'premium' : 'free',
    custom_parameter: 'fashion_chat'
  })
}

// Track premium subscription
export const trackPremiumSubscription = (plan: string, amount: number) => {
  gtag('event', 'purchase', {
    currency: 'USD',
    value: amount,
    items: [{
      item_id: plan,
      item_name: `OpenFashion ${plan}`,
      item_category: 'subscription',
      price: amount,
      quantity: 1
    }]
  })
}

// Track user engagement
export const trackEngagement = (action: string, details?: any) => {
  gtag('event', 'user_engagement', {
    action: action,
    ...details,
    custom_parameter: 'fashion_engagement'
  })
}

// Track conversion funnel
export const trackFunnelStep = (step: string, stepNumber: number) => {
  gtag('event', 'funnel_step', {
    step: step,
    step_number: stepNumber,
    custom_parameter: 'fashion_funnel'
  })
}

// Track social sharing
export const trackSocialShare = (platform: string, contentType: string) => {
  gtag('event', 'share', {
    method: platform,
    content_type: contentType,
    custom_parameter: 'fashion_social'
  })
}

// Track search usage
export const trackSearch = (query: string, resultsCount: number) => {
  gtag('event', 'search', {
    search_term: query,
    results_count: resultsCount,
    custom_parameter: 'fashion_search'
  })
}

// Track feature usage
export const trackFeatureUsage = (feature: string, isPremium: boolean) => {
  gtag('event', 'feature_usage', {
    feature: feature,
    user_type: isPremium ? 'premium' : 'free',
    custom_parameter: 'fashion_features'
  })
}

// Track errors
export const trackError = (errorType: string, errorMessage: string) => {
  gtag('event', 'exception', {
    description: errorMessage,
    fatal: false,
    custom_parameter: errorType
  })
}

// Track user properties
export const setUserProperties = (properties: {
  user_type?: 'free' | 'premium'
  subscription_tier?: string
  weekly_uploads_used?: number
  join_date?: string
}) => {
  gtag('set', 'user_properties', properties)
}

// Track custom events
export const trackCustomEvent = (eventName: string, parameters: any) => {
  gtag('event', eventName, {
    ...parameters,
    custom_parameter: 'fashion_custom'
  })
} 