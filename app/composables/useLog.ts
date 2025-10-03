import { LogService } from './api/services/LogService'
import type { PopulatedLog, LogFilters } from '../../shared/types/models/log'
import type { CreateLogResponse } from '../../shared/types/api/log'
import { useErrorHandler } from './errors/useErrorHandler'

/**
 * Composable for log management
 * Provides a reactive interface for creating, reading, and deleting logs
 */
export const useLog = () => {
  const logService = new LogService()
  const { handleError } = useErrorHandler()
  const { t } = useI18n()
  
  // Reactive state
  const logs = ref<PopulatedLog[]>([])
  const loading = ref(false)
  const error = ref<string>('')
  const requestErrors = ref<string[]>([])
  
  // Log filters state (shared across application)
  const logFilters = useState<LogFilters>('logFilters', () => ({}))

  /**
   * Get logs for the current company
   */
  const getLogs = async (
    startDate?: string,
    endDate?: string
  ): Promise<PopulatedLog[]> => {
    loading.value = true
    error.value = ''
    requestErrors.value = []
    
    try {
      // Build filters from state and parameters
      const params: LogFilters = {
        ...logFilters.value,
        start_datetime: startDate,
        end_datetime: endDate
      }
      
      const response = await logService.getCompanyLogs(params)
      logs.value = response
      return response
    } catch (err: unknown) {
      const e = err as Error & { data?: { detail?: string } }
      const errorMessage = e.data?.detail || e.message || t('errors.fetchLogs')
      error.value = errorMessage
      requestErrors.value = [errorMessage]
      handleError(err, { source: 'useLog.getLogs' })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a process log
   */
  const postLog = async (
    formData: {
      log_type: string
      content: Record<string, unknown>
      created_at?: string
    },
    spaceId: string
  ): Promise<CreateLogResponse> => {
    loading.value = true
    error.value = ''
    requestErrors.value = []
    
    try {
      const response = await logService.createProcessLog(
        spaceId,
        formData.log_type,
        formData.content
      )
      
      if (response.status === 'Log created') {
        return response
      } else {
        throw new Error(t('errors.log.unexpectedStatus'))
      }
    } catch (err: unknown) {
      const e = err as Error & { data?: { detail?: string } }
      const errorMessage = e.data?.detail || e.message || t('errors.createLog')
      error.value = errorMessage
      requestErrors.value = [errorMessage]
      handleError(err, { source: 'useLog.postLog' })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a log
   */
  const deleteLog = async (logId: string): Promise<CreateLogResponse> => {
    loading.value = true
    error.value = ''
    requestErrors.value = []
    
    try {
      const response = await logService.deleteLog(logId)
      
      // Remove from local state
      logs.value = logs.value.filter(log => log._id !== logId)
      
      return response
    } catch (err: unknown) {
      const e = err as Error & { data?: { detail?: string } }
      const errorMessage = e.data?.detail || e.message || t('errors.deleteLog')
      error.value = errorMessage
      requestErrors.value = [errorMessage]
      handleError(err, { source: 'useLog.deleteLog' })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get credit transaction logs
   */
  const getCreditLogs = async () => {
    loading.value = true
    error.value = ''
    requestErrors.value = []
    
    try {
      const response = await logService.getCreditLogs()
      return response
    } catch (err: unknown) {
      const e = err as Error & { data?: { detail?: string } }
      const errorMessage = e.data?.detail || e.message || t('errors.fetchCreditLogs')
      error.value = errorMessage
      requestErrors.value = [errorMessage]
      handleError(err, { source: 'useLog.getCreditLogs' })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Log a content view/completion
   */
  const logContentAction = async (
    contentId: string,
    contentType: 'video' | 'document' | 'tool' | 'playlist',
    action: 'viewed' | 'completed' | 'purchased',
    additionalData?: Record<string, unknown>,
    options?: { throwOnError?: boolean }
  ) => {
    try {
      await logService.createContentLog(
        contentId,
        contentType,
        action,
        additionalData
      )
    } catch (err: unknown) {
      if (options?.throwOnError) {
        throw err
      }
      // Content logs are often non-critical, so we just log the error
      console.error(t('errors.log.contentActionFailedLog'), err)
      handleError(err, { source: 'useLog.logContentAction' })
    }
  }

  /**
   * Log a user action
   */
  const logUserAction = async (
    action: string,
    target?: string,
    metadata?: Record<string, unknown>,
    options?: { throwOnError?: boolean }
  ) => {
    try {
      await logService.logUserAction(action, target, metadata)
    } catch (err: unknown) {
      if (options?.throwOnError) {
        throw err
      }
      // User action logs are often non-critical
      console.error(t('errors.log.userActionFailedLog'), err)
      handleError(err, { source: 'useLog.logUserAction' })
    }
  }

  /**
   * Set log filters
   */
  const setLogFilters = (filters: Partial<LogFilters>) => {
    logFilters.value = { ...logFilters.value, ...filters }
  }

  /**
   * Clear log filters
   */
  const clearLogFilters = () => {
    logFilters.value = {}
  }

  /**
   * Get date range helper
   */
  const getDateRange = (days: number = 30) => {
    return logService.getDateRange(days)
  }

  return {
    // State
    logs: readonly(logs),
    loading: readonly(loading),
    error: readonly(error),
    requestErrors: readonly(requestErrors),
    logFilters: readonly(logFilters),
    
    // Methods
    getLogs,
    postLog,
    deleteLog,
    getCreditLogs,
    logContentAction,
    logUserAction,
    setLogFilters,
    clearLogFilters,
    getDateRange
  }
}
