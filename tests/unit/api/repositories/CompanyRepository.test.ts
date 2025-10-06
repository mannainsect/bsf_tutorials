import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CompanyRepository } from '~/composables/api/repositories/CompanyRepository'
import type { UpdateCompanyRequest } from '~/composables/api/repositories/CompanyRepository'
import type { Company } from '~/shared/types'

const createMockAuthStore = () => ({
  token: null as string | null,
  isAuthenticated: false
})

const mockAuthStore = createMockAuthStore()
global.useAuthStore = vi.fn(() => mockAuthStore)

global.useApiEndpoints = vi.fn(() => ({
  companies: '/api/v1/companies'
}))

describe('CompanyRepository', () => {
  let repository: CompanyRepository

  beforeEach(() => {
    mockAuthStore.token = 'test-token'
    mockAuthStore.isAuthenticated = true
    repository = new CompanyRepository()
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('updateCompany', () => {
    it('should update company successfully', async () => {
      const companyId = 'company-123'
      const updateData: UpdateCompanyRequest = {
        name: 'Updated Company Name',
        street: '456 New Street',
        city: 'New City'
      }

      const mockResponse: Company = {
        _id: companyId,
        id: companyId,
        name: 'Updated Company Name',
        street: '456 New Street',
        city: 'New City',
        country: 'FI',
        timezone: 'Europe/Helsinki',
        business_id: 'BIZ123'
      }

      vi.spyOn(repository as any, 'put').mockResolvedValue(mockResponse)

      const result = await repository.updateCompany(companyId, updateData)

      expect(result).toEqual(mockResponse)
      expect(repository.put).toHaveBeenCalledWith(
        `/api/v1/companies/${companyId}`,
        updateData
      )
    })

    it('should update only name field', async () => {
      const companyId = 'company-456'
      const updateData: UpdateCompanyRequest = {
        name: 'New Company Name'
      }

      const mockResponse: Company = {
        _id: companyId,
        id: companyId,
        name: 'New Company Name',
        street: 'Old Street',
        city: 'Old City'
      }

      vi.spyOn(repository as any, 'put').mockResolvedValue(mockResponse)

      const result = await repository.updateCompany(companyId, updateData)

      expect(result.name).toBe('New Company Name')
      expect(repository.put).toHaveBeenCalledWith(
        `/api/v1/companies/${companyId}`,
        updateData
      )
    })

    it('should update multiple fields', async () => {
      const companyId = 'company-789'
      const updateData: UpdateCompanyRequest = {
        name: 'Multi Update Company',
        street: '789 Multi Street',
        city: 'Multi City',
        country: 'SE',
        timezone: 'Europe/Stockholm',
        business_id: 'SE-123456'
      }

      const mockResponse: Company = {
        _id: companyId,
        id: companyId,
        ...updateData
      }

      vi.spyOn(repository as any, 'put').mockResolvedValue(mockResponse)

      const result = await repository.updateCompany(companyId, updateData)

      expect(result.name).toBe(updateData.name)
      expect(result.street).toBe(updateData.street)
      expect(result.city).toBe(updateData.city)
      expect(result.country).toBe(updateData.country)
      expect(result.timezone).toBe(updateData.timezone)
      expect(result.business_id).toBe(updateData.business_id)
    })

    it('should handle 401 authentication error', async () => {
      const error = {
        statusCode: 401,
        data: { message: 'Unauthorized' }
      }

      vi.spyOn(repository as any, 'put').mockRejectedValue(error)

      await expect(
        repository.updateCompany('company-123', { name: 'Test' })
      ).rejects.toMatchObject(error)
    })

    it('should handle 403 forbidden error', async () => {
      const error = {
        statusCode: 403,
        data: { message: 'Permission denied' }
      }

      vi.spyOn(repository as any, 'put').mockRejectedValue(error)

      await expect(
        repository.updateCompany('company-123', { name: 'Test' })
      ).rejects.toMatchObject(error)
    })

    it('should handle 404 not found error', async () => {
      const error = {
        statusCode: 404,
        data: { message: 'Company not found' }
      }

      vi.spyOn(repository as any, 'put').mockRejectedValue(error)

      await expect(
        repository.updateCompany('company-123', { name: 'Test' })
      ).rejects.toMatchObject(error)
    })

    it('should handle 500 server error', async () => {
      const error = {
        statusCode: 500,
        data: { message: 'Internal server error' }
      }

      vi.spyOn(repository as any, 'put').mockRejectedValue(error)

      await expect(
        repository.updateCompany('company-123', { name: 'Test' })
      ).rejects.toMatchObject(error)
    })

    it('should handle network errors', async () => {
      const error = new Error('Network connection failed')

      vi.spyOn(repository as any, 'put').mockRejectedValue(error)

      await expect(
        repository.updateCompany('company-123', { name: 'Test' })
      ).rejects.toThrow('Network connection failed')
    })

    it('should handle empty update data', async () => {
      const companyId = 'company-empty'
      const updateData: UpdateCompanyRequest = {}

      const mockResponse: Company = {
        _id: companyId,
        id: companyId,
        name: 'Unchanged Company'
      }

      vi.spyOn(repository as any, 'put').mockResolvedValue(mockResponse)

      const result = await repository.updateCompany(companyId, updateData)

      expect(result).toEqual(mockResponse)
      expect(repository.put).toHaveBeenCalledWith(
        `/api/v1/companies/${companyId}`,
        {}
      )
    })

    it('should map MongoDB _id to id in response', async () => {
      const companyId = 'mongodb-company-id'
      const updateData: UpdateCompanyRequest = {
        name: 'MongoDB Company'
      }

      const mockResponse = {
        _id: companyId,
        name: 'MongoDB Company'
      }

      vi.spyOn(repository as any, 'put').mockResolvedValue(mockResponse)

      const result = await repository.updateCompany(companyId, updateData)

      expect(result).toHaveProperty('_id', companyId)
      expect(result.name).toBe('MongoDB Company')
    })
  })
})
