import { BaseRepository } from './BaseRepository'
import type { Company } from '../../../../shared/types'
import type { CompanyCreationResponse } from '../../../../shared/types/models/Company'

export interface UpdateCompanyRequest {
  name?: string
  street?: string
  city?: string
  country?: string
  timezone?: string
  business_id?: string
}

export class CompanyRepository extends BaseRepository {
  async updateCompany(companyId: string, data: UpdateCompanyRequest): Promise<Company> {
    const endpoints = useApiEndpoints()
    return this.put<Company>(`${endpoints.companies}/${companyId}`, data)
  }

  async createCompanyWithSpaces(data: {
    name: string
    city: string
    country: string
    timezone: string
  }): Promise<CompanyCreationResponse> {
    const endpoints = useApiEndpoints()
    return this.post<CompanyCreationResponse>(`${endpoints.companies}?create_all_spaces=true`, data)
  }
}
