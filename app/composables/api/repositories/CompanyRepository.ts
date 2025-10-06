import { BaseRepository } from './BaseRepository'
import type { Company } from '../../../../shared/types'

export interface UpdateCompanyRequest {
  name?: string
  street?: string
  city?: string
  country?: string
  timezone?: string
  business_id?: string
}

export class CompanyRepository extends BaseRepository {
  /**
   * Update company information
   * PUT /companies/${companyId}
   * All fields are optional
   */
  async updateCompany(
    companyId: string,
    data: UpdateCompanyRequest
  ): Promise<Company> {
    const endpoints = useApiEndpoints()
    return this.put<Company>(`${endpoints.companies}/${companyId}`, data)
  }
}
