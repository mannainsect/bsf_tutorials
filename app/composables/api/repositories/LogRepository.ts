import { BaseRepository } from './BaseRepository'
import type {
  CreateLogRequest,
  CreateLogResponse,
  GetCreditLogsResponse,
  DeleteLogResponse,
  GetLogsParams,
  CreateProcessLogParams,
  CreateContentLogParams
} from '../../../../shared/types/api/log'
import type { PopulatedLog } from '../../../../shared/types/models/log'

export class LogRepository extends BaseRepository {
  /**
   * Get logs for a company with optional filters
   */
  async getCompanyLogs(
    companyId: string,
    params?: GetLogsParams
  ): Promise<PopulatedLog[]> {
    const endpoints = useApiEndpoints()
    const query: Record<
      string, string | number | boolean | string[] | number[]
    > = {}
    
    if (params?.start_datetime) query.start_datetime = params.start_datetime
    if (params?.end_datetime) query.end_datetime = params.end_datetime
    if (params?.spaceId) query.space_id = params.spaceId
    if (params?.userId) query.user_id = params.userId
    if (params?.deviceId) query.device_id = params.deviceId
    if (params?.log_type) query.log_type = params.log_type

    return this.get<PopulatedLog[]>(
      `${endpoints.logsCompany}/${companyId}`,
      query
    )
  }

  /**
   * Create a process log
   */
  async createProcessLog(
    log: CreateLogRequest,
    params: CreateProcessLogParams
  ): Promise<CreateLogResponse> {
    const endpoints = useApiEndpoints()
    return await this.post<CreateLogResponse>(
      endpoints.logsProcess,
      log,
      { space_id: params.space_id }
    )
  }

  /**
   * Create a content log
   */
  async createContentLog(
    log: CreateLogRequest,
    params?: CreateContentLogParams
  ): Promise<CreateLogResponse> {
    const endpoints = useApiEndpoints()
    const query: Record<
      string, string | number | boolean | string[] | number[]
    > = {}
    
    if (params?.content_id) query.content_id = params.content_id
    if (params?.content_type) query.content_type = params.content_type
    
    return this.post<CreateLogResponse>(
      endpoints.logsContent,
      log,
      query
    )
  }

  /**
   * Delete a log by ID
   */
  async deleteLog(logId: string): Promise<DeleteLogResponse> {
    const endpoints = useApiEndpoints()
    return this.delete<DeleteLogResponse>(`${endpoints.logsCompany}/${logId}`)
  }

  /**
   * Get credit transaction logs for a user
   */
  async getCreditLogs(userId: string): Promise<GetCreditLogsResponse> {
    const endpoints = useApiEndpoints()
    return this.get<GetCreditLogsResponse>(
      `${endpoints.logsCredits}/${userId}`
    )
  }

  /**
   * Get device logs
   */
  async getDeviceLogs(
    deviceId: string,
    startDate?: string,
    endDate?: string
  ): Promise<PopulatedLog[]> {
    const endpoints = useApiEndpoints()
    const query: Record<
      string, string | number | boolean | string[] | number[]
    > = { device_id: deviceId }
    
    if (startDate) query.start_datetime = startDate
    if (endDate) query.end_datetime = endDate
    
    return this.get<PopulatedLog[]>(endpoints.logsDevice, query)
  }

  /**
   * Override post method to handle query parameters with improved type safety
   */
  protected override async post<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    query?: Record<string, string | number | boolean | string[] | number[]>
  ): Promise<TResponse> {
    return this.request<TResponse>(endpoint, { method: 'POST', body, query })
  }
}