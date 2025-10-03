import type { User, Company, ProfileMetrics, CompanyTask } from '../../../../shared/types'
import { BaseRepository } from './BaseRepository'

export interface ProfileResponse {
  user: User
  active_company: {
    company: Company
    metrics: ProfileMetrics
    tasks: CompanyTask[]
    devices: Array<{
      _id: string
      description: string
      account_type: string
    }>
    spaces: Array<{
      _id: string
      name: string
      process: string
    }>
    admins: User[]
    managers: User[]
    operators: User[]
  }
  other_companies: Company[]
}

export interface SwitchCompanyRequest {
  company_id: string
}

export class ProfileRepository extends BaseRepository {
  /**
   * Get current user profile with company data
   * GET /profiles/me - PRIMARY endpoint for all logged-in user data
   * Returns complete user info including companies, products, credits, etc.
   */
  async getCurrentProfile(): Promise<ProfileResponse> {
    const endpoints = useApiEndpoints()
    return this.get<ProfileResponse>(endpoints.profilesMe)
  }

  /**
   * Switch active company
   * POST /profiles/switch-company
   */
  async switchCompany(companyId: string): Promise<ProfileResponse> {
    const endpoints = useApiEndpoints()
    const data: SwitchCompanyRequest = { company_id: companyId }
    return this.post<ProfileResponse>(endpoints.profilesSwitchCompany, data)
  }
}