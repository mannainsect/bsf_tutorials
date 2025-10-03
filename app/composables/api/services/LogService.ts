import { LogRepository } from '../repositories/LogRepository'
import type {
  CreateLogRequest,
  CreateLogResponse,
  GetLogsParams,
  GetCreditLogsResponse
} from '../../../../shared/types/api/log'
import type { PopulatedLog } from '../../../../shared/types/models/log'
import { LogType } from '../../../../shared/types/models/log'

export class LogService {
  private logRepository: LogRepository

  constructor() {
    this.logRepository = new LogRepository()
  }

  /**
   * Get the auth store for accessing company info
   */
  private get authStore() {
    return useAuthStore()
  }

  /**
   * Create a generic log entry
   */
  private createLogEntry(
    logType: string,
    content: Record<string, unknown>,
    createdAt?: string
  ): CreateLogRequest {
    return {
      log_type: logType,
      content,
      created_at: createdAt || new Date().toISOString()
    }
  }

  /**
   * Get logs for the current company
   */
  async getCompanyLogs(params?: GetLogsParams): Promise<PopulatedLog[]> {
    const companyId = this.authStore.companyId
    if (!companyId || typeof companyId !== 'string') {
      throw new Error(`No active company found. User authenticated: ${this.authStore.isAuthenticated}`)
    }
    
    return this.logRepository.getCompanyLogs(companyId, params)
  }

  /**
   * Create a process log
   */
  async createProcessLog(
    spaceId: string,
    logType: string,
    content: Record<string, unknown>
  ): Promise<CreateLogResponse> {
    // Validate log type
    if (!this.isValidLogType(logType)) {
      console.warn(`Non-standard log type used: ${logType}`)
    }
    
    const log = this.createLogEntry(logType, content)
    return this.logRepository.createProcessLog(log, { space_id: spaceId })
  }

  /**
   * Create a content log (for learning content)
   */
  async createContentLog(
    contentId: string,
    contentType: string,
    action: 'viewed' | 'completed' | 'purchased',
    additionalData?: Record<string, unknown>
  ): Promise<CreateLogResponse> {
    const content = {
      content_id: contentId,
      content_type: contentType,
      action,
      ...additionalData
    }
    
    const log = this.createLogEntry('content_' + action, content)
    return this.logRepository.createContentLog(log, {
      content_id: contentId,
      content_type: contentType
    })
  }

  /**
   * Log a user action
   */
  async logUserAction(
    action: string,
    target?: string,
    metadata?: Record<string, unknown>
  ): Promise<CreateLogResponse> {
    const content = {
      action,
      target,
      metadata,
      timestamp: new Date().toISOString()
    }
    
    // User actions are typically not tied to a specific space
    const log = this.createLogEntry(LogType.USER_ACTION, content)
    return this.logRepository.createContentLog(log)
  }

  /**
   * Delete a log
   */
  async deleteLog(logId: string): Promise<CreateLogResponse> {
    return this.logRepository.deleteLog(logId)
  }

  /**
   * Get credit transaction logs for the current user
   */
  async getCreditLogs(): Promise<GetCreditLogsResponse> {
    const userId = this.authStore.userId
    if (!userId || typeof userId !== 'string') {
      throw new Error('User not authenticated')
    }
    
    return this.logRepository.getCreditLogs(userId)
  }

  /**
   * Get device logs
   */
  async getDeviceLogs(
    deviceId: string,
    startDate?: string,
    endDate?: string
  ): Promise<PopulatedLog[]> {
    return this.logRepository.getDeviceLogs(deviceId, startDate, endDate)
  }

  /**
   * Helper to calculate date range for logs
   */
  getDateRange(days: number = 30): { start: string; end: string } {
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    }
  }

  /**
   * Validate log type (can be extended based on domain requirements)
   */
  isValidLogType(logType: string): boolean {
    const validTypes = Object.values(LogType)
    return validTypes.includes(logType as LogType) || logType.startsWith('custom_')
  }
}