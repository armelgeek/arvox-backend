import type { OpenAPIHono } from '@hono/zod-openapi'

/**
 * Interface for framework modules
 * Modules encapsulate related functionality and can be plugged into the framework
 */
export interface IModule {
  /**
   * Get the module name
   * @returns Module name
   */
  getName(): string

  /**
   * Initialize the module
   * Called during framework startup
   */
  initialize(): Promise<void>

  /**
   * Register routes with the main application
   * @param app - Hono application instance
   */
  registerRoutes(app: OpenAPIHono): void

  /**
   * Cleanup module resources
   * Called during framework shutdown
   */
  cleanup?(): Promise<void>

  /**
   * Health check for the module
   * @returns Health status
   */
  healthCheck?(): Promise<{ healthy: boolean; message?: string }>

  /**
   * Get module dependencies
   * @returns Array of module names this module depends on
   */
  getDependencies?(): string[]

  /**
   * Get module configuration
   * @returns Module configuration
   */
  getConfig?(): Record<string, any>
}
