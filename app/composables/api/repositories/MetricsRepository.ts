import { BaseRepository } from './BaseRepository'
import type {
  MetricData,
  MetricsResponse
} from '../../../../shared/types/models/metrics'

export class MetricsRepository extends BaseRepository {
  /**
   * Send a metric to the backend
   */
  async sendMetric(data: MetricData): Promise<MetricsResponse> {
    const endpoints = useApiEndpoints()
    return this.post<MetricsResponse>(endpoints.metrics, data)
  }
}
