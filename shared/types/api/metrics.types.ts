export interface MetricData {
  value: number
  unit?: string
  change?: number
  changePercent?: number
  label?: string
  description?: string
}

export interface CompanyMetrics {
  total_devices?: number
  active_processes?: number
  monthly_revenue?: number
  alert_count?: number
  // Allow additional metrics while maintaining type safety for known ones
  [key: string]: number | undefined
}

export interface CompanyTask {
  id: string
  name: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  assignedTo?: string
  assignedToName?: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  createdAt?: string
  updatedAt?: string
  completedAt?: string
}

export interface ProfileMetrics {
  today: Record<string, MetricData>
  week: Record<string, MetricData>
  month: Record<string, MetricData>
}