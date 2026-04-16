import { MetricsRepository } from '../repositories/MetricsRepository'
import type { MetricData, MetricsResponse } from '../../../../shared/types/models/metrics'

export class MetricsService {
  private metricsRepository: MetricsRepository

  constructor() {
    this.metricsRepository = new MetricsRepository()
  }

  /**
   * Send a metric to the backend with error handling
   */
  async sendMetric(data: MetricData): Promise<MetricsResponse> {
    try {
      // Validate required fields
      if (!data.category) {
        throw new Error('Metric category is required')
      }

      return await this.metricsRepository.sendMetric(data)
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
