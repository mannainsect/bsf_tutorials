/**
 * Example usage of the logging system
 * This file demonstrates how to integrate logs into your application
 */

import { LogType } from '../../../shared/types/models/log'
import { useLog } from '../useLog'

/**
 * Example: Logging user activities
 */
export const useActivityLogger = () => {
  const { logUserAction, logContentAction } = useLog()
  
  /**
   * Log page views
   */
  const logPageView = async (pageName: string, metadata?: Record<string, unknown>) => {
    await logUserAction('page_view', pageName, {
      ...metadata,
      timestamp: new Date().toISOString()
    })
  }
  
  /**
   * Log button clicks
   */
  const logButtonClick = async (buttonName: string, context?: string) => {
    await logUserAction('button_click', buttonName, {
      context,
      timestamp: new Date().toISOString()
    })
  }
  
  /**
   * Log video watch progress
   */
  const logVideoProgress = async (
    videoId: string,
    progressPercentage: number,
    durationSeconds: number
  ) => {
    await logContentAction(videoId, 'video', 'viewed', {
      progress_percentage: progressPercentage,
      duration_seconds: durationSeconds
    })
    
    // If video is completed
    if (progressPercentage >= 95) {
      await logContentAction(videoId, 'video', 'completed', {
        duration_seconds: durationSeconds
      })
    }
  }
  
  return {
    logPageView,
    logButtonClick,
    logVideoProgress
  }
}

/**
 * Example: Process logging for operations
 */
export const useProcessLogger = () => {
  const { postLog } = useLog()
  
  /**
   * Log a task completion
   */
  const logTaskComplete = async (
    spaceId: string,
    taskName: string,
    results: Record<string, unknown>
  ) => {
    const logData = {
      log_type: LogType.TASK_COMPLETE,
      content: {
        task_name: taskName,
        result: results,
        completed_at: new Date().toISOString()
      }
    }
    
    try {
      const response = await postLog(logData, spaceId)
      // Task logged successfully
      return response
    } catch (error) {
      console.error('Failed to log task:', error)
      throw error
    }
  }
  
  /**
   * Log a process start
   */
  const logProcessStart = async (
    spaceId: string,
    processName: string,
    metadata?: Record<string, unknown>
  ) => {
    const logData = {
      log_type: LogType.PROCESS_START,
      content: {
        process_name: processName,
        status: 'started',
        metadata,
        started_at: new Date().toISOString()
      }
    }
    
    return postLog(logData, spaceId)
  }
  
  return {
    logTaskComplete,
    logProcessStart
  }
}

/**
 * Example: Viewing logs with filters
 */
export const useLogViewer = () => {
  const { getLogs, setLogFilters, clearLogFilters, logs, loading, error } = useLog()
  
  /**
   * Get logs for today
   */
  const getTodaysLogs = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    await getLogs(today.toISOString(), tomorrow.toISOString())
  }
  
  /**
   * Get logs for a specific space
   */
  const getSpaceLogs = async (spaceId: string, days = 7) => {
    setLogFilters({ spaceId })
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    await getLogs(startDate.toISOString(), endDate.toISOString())
  }
  
  /**
   * Get logs by type
   */
  const getLogsByType = async (logType: string, days = 30) => {
    setLogFilters({ log_type: logType })
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    await getLogs(startDate.toISOString(), endDate.toISOString())
  }
  
  return {
    logs,
    loading,
    error,
    getTodaysLogs,
    getSpaceLogs,
    getLogsByType,
    clearFilters: clearLogFilters
  }
}