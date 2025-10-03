import { MetricsService } from './api/services/MetricsService'
import { MetricCategory } from '../../shared/types/models/metrics'
import type { MetricData } from '../../shared/types/models/metrics'

// NetworkInformation API type (experimental browser API)
interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
  downlink?: number
  rtt?: number
  saveData?: boolean
}

/**
 * Composable for metrics tracking
 * Provides a lightweight, non-blocking way to send metrics to the backend
 */
export const useMetrics = () => {
  // Use Nuxt's built-in state management for SSR safety
  const metricsService = useState<MetricsService>('metricsService', () => {
    return new MetricsService()
  })
  
  const authStore = useAuthStore()
  const config = useRuntimeConfig()
  
  /**
   * Enrich metric data with user and session context
   */
  const enrichMetricWithContext = (metricData: MetricData): MetricData => {
    return {
      ...metricData,
      extra_info: {
        ...metricData.extra_info,
        user_id: authStore.userId,
        company_id: authStore.companyId,
        timestamp: new Date().toISOString()
      }
    }
  }
  
  /**
   * Send a metric to the backend
   * Uses fire-and-forget pattern to avoid blocking the user experience
   */
  const sendMetric = async (metricData: MetricData): Promise<boolean> => {
    // Skip if offline
    if (import.meta.client && !navigator.onLine) {
      // Skipping - device offline
      return false
    }
    
    // Skip metrics in development unless explicitly enabled
    if (import.meta.dev && !config.public.enableDevMetrics) {
      // Would send metric in development
      return true
    }
    
    try {
      // Determine timeout based on connection quality
      let timeoutDuration = 3000 // Default 3s
      if (import.meta.client && 'connection' in navigator) {
        const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
        if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
          timeoutDuration = 2000 // 2s for slow connections
        }
      }
      
      // Create an AbortController for proper cancellation
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration)
      
      try {
        // Enrich metric with context before sending
        const enrichedMetric = enrichMetricWithContext(metricData)
        
        // Note: We need to update the repository to support abort signal
        const response = await metricsService.value.sendMetric(enrichedMetric)
        clearTimeout(timeoutId)
        return response.success ?? true
      } catch (error: unknown) {
        clearTimeout(timeoutId)
        if ((error as Error).name === 'AbortError') {
          throw new Error('Metric timeout')
        }
        throw error
      }
    } catch (error) {
      // Metrics are non-critical, so we just log the error with context
      console.error(`Error sending ${metricData.category} metric:`, error)
      return false
    }
  }
  
  /**
   * Track a user login event
   */
  const trackLogin = async (method: 'password' | 'token' = 'password') => {
    const metricData: MetricData = {
      category: MetricCategory.USER_LOGIN,
      extra_info: {
        method
      }
    }
    
    // Fire and forget
    sendMetric(metricData)
  }
  
  /**
   * Track a page view
   */
  const trackPageView = async (page: string, additionalInfo?: Record<string, unknown>) => {
    const metricData: MetricData = {
      category: MetricCategory.PAGE_VIEW,
      extra_info: {
        page,
        ...additionalInfo
      }
    }
    
    // Fire and forget
    sendMetric(metricData)
  }
  
  /**
   * Track a button click
   */
  const trackButtonClick = async (buttonName: string, additionalInfo?: Record<string, unknown>) => {
    const metricData: MetricData = {
      category: MetricCategory.CLICK_BUTTON,
      extra_info: {
        button: buttonName,
        ...additionalInfo
      }
    }
    
    // Fire and forget
    sendMetric(metricData)
  }
  
  /**
   * Track a feature usage
   */
  const trackFeatureUsage = async (feature: string, additionalInfo?: Record<string, unknown>) => {
    const metricData: MetricData = {
      category: MetricCategory.FEATURE_USED,
      extra_info: {
        feature,
        ...additionalInfo
      }
    }
    
    // Fire and forget
    sendMetric(metricData)
  }
  
  /**
   * Track an error occurrence
   */
  const trackError = async (error: Error | string, context: string) => {
    const metricData: MetricData = {
      category: MetricCategory.ERROR_OCCURRED,
      extra_info: {
        error_message: error instanceof Error ? error.message : error,
        error_stack: error instanceof Error ? error.stack : undefined,
        context
      }
    }
    
    // Fire and forget
    sendMetric(metricData)
  }
  
  /**
   * Track session activity
   */
  const trackSessionActivity = async () => {
    const metricData: MetricData = {
      category: MetricCategory.ACTIVE_SESSION,
      extra_info: {}
    }
    
    // Fire and forget
    sendMetric(metricData)
  }
  
  return {
    sendMetric,
    trackLogin,
    trackPageView,
    trackButtonClick,
    trackFeatureUsage,
    trackError,
    trackSessionActivity
  }
}