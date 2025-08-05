/**
 * Base interface for all services
 * Services provide business logic and integrate with external systems
 */
export interface IService {
  /**
   * Get service name
   * @returns Service name
   */
  getName(): string

  /**
   * Initialize the service
   * Called during framework startup
   */
  initialize(): Promise<void>

  /**
   * Cleanup service resources
   * Called during framework shutdown
   */
  cleanup(): Promise<void>

  /**
   * Health check for the service
   * @returns Health status
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>

  /**
   * Get service configuration
   * @returns Service configuration
   */
  getConfig?(): Record<string, any>
}
