import { BaseRepository } from './BaseRepository'
import type { ContentPublic } from '../../../../shared/types/api/content.types'

export class ContentRepository extends BaseRepository {
  async getPublic(): Promise<ContentPublic[]> {
    const endpoints = useApiEndpoints()
    return this.get<ContentPublic[]>(endpoints.productsContentPublic)
  }
}
