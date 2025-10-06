import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LogRepository } from '~/composables/api/repositories/LogRepository'
import type {
  CreateLogRequest,
  CreateLogResponse
} from '~/shared/types/api/log'

vi.mock('~/composables/useApiEndpoints', () => ({
  useApiEndpoints: vi.fn(() => ({
    logsProcess: '/api/logs/process',
    logsContent: '/api/logs/content',
    logsCompany: '/api/logs/company',
    logsDevice: '/api/logs/device',
    logsCredits: '/api/logs/credits'
  }))
}))

const createMockAuthStore = () => ({
  token: 'test-token',
  isAuthenticated: true
})

const mockAuthStore = createMockAuthStore()
global.useAuthStore = vi.fn(() => mockAuthStore)

describe('LogRepository', () => {
  let repository: LogRepository

  beforeEach(() => {
    repository = new LogRepository()
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('createProcessLog with log_id field', () => {
    it('should handle log_id in creation response', async () => {
      const logData: CreateLogRequest = {
        log_type: 'process_started',
        message: 'Process started successfully',
        metadata: {
          process_name: 'breeding',
          started_by: 'user-123'
        }
      }

      const params = { space_id: 'space-456' }

      const mockResponse: CreateLogResponse = {
        status: 'Process log created',
        log_id: 'log-11111-22222-33333',
        _id: 'log-mongo-id-789'
      }

      vi.spyOn(repository as any, 'request').mockResolvedValue(mockResponse)

      const result = await repository.createProcessLog(logData, params)

      expect(result).toBeDefined()
      expect(result).toEqual(mockResponse)
      expect(result).toHaveProperty('log_id', 'log-11111-22222-33333')
    })

    it('should handle missing log_id gracefully', async () => {
      const logData: CreateLogRequest = {
        log_type: 'process_completed',
        message: 'Process completed'
      }

      const params = { space_id: 'space-legacy' }

      const mockResponse: CreateLogResponse = {
        status: 'Process log created',
        _id: 'log-legacy-id'
      }

      vi.spyOn(repository as any, 'request').mockResolvedValue(mockResponse)

      const result = await repository.createProcessLog(logData, params)

      expect(result).toBeDefined()
      expect(result).toEqual(mockResponse)
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Process log created with ID:'),
        expect.anything()
      )
    })

    it('should handle log_id as null', async () => {
      const logData: CreateLogRequest = {
        log_type: 'process_error',
        message: 'Process encountered error'
      }

      const params = { space_id: 'space-null' }

      const mockResponse: any = {
        status: 'Process log created',
        log_id: null,
        _id: 'log-null-id'
      }

      vi.spyOn(repository as any, 'request').mockResolvedValue(mockResponse)

      const result = await repository.createProcessLog(logData, params)

      expect(result).toBeDefined()
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Process log created with ID:'),
        expect.anything()
      )
    })

    it('should handle log_id as empty string', async () => {
      const logData: CreateLogRequest = {
        log_type: 'process_warning',
        message: 'Process warning'
      }

      const params = { space_id: 'space-empty' }

      const mockResponse: any = {
        status: 'Process log created',
        log_id: '',
        _id: 'log-empty-id'
      }

      vi.spyOn(repository as any, 'request').mockResolvedValue(mockResponse)

      const result = await repository.createProcessLog(logData, params)

      expect(result).toBeDefined()
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Process log created with ID:'),
        expect.anything()
      )
    })
  })

  describe('createContentLog', () => {
    it('should create content log without params', async () => {
      const logData: CreateLogRequest = {
        log_type: 'content_viewed',
        message: 'Content viewed by user'
      }

      const mockResponse: CreateLogResponse = {
        status: 'Content log created',
        _id: 'log-content-123'
      }

      vi.spyOn(repository as any, 'request').mockResolvedValue(mockResponse)

      const result = await repository.createContentLog(logData)

      expect(result).toBeDefined()
      expect(result).toEqual(mockResponse)
    })

    it('should create content log with params', async () => {
      const logData: CreateLogRequest = {
        log_type: 'content_downloaded',
        message: 'Content downloaded'
      }

      const params = {
        content_id: 'content-789',
        content_type: 'document'
      }

      const mockResponse: CreateLogResponse = {
        status: 'Content log created',
        _id: 'log-content-456'
      }

      vi.spyOn(repository as any, 'request').mockResolvedValue(mockResponse)

      const result = await repository.createContentLog(logData, params)

      expect(result).toBeDefined()
    })
  })
})
