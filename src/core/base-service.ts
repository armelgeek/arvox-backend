import { IService } from '../interfaces/service.interface'

/**
 * Base service class providing common business logic patterns
 * Services orchestrate between repositories and external systems
 */
export abstract class BaseService implements IService {
  protected readonly name: string

  constructor(name: string) {
    this.name = name
  }

  /**
   * Get service name
   * @returns Service name
   */
  getName(): string {
    return this.name
  }

  /**
   * Initialize service (called during framework setup)
   * Override in child classes for custom initialization
   */
  async initialize(): Promise<void> {
    // Default implementation - override in child classes
    console.log(`Service ${this.name} initialized`)
  }

  /**
   * Cleanup service resources
   * Override in child classes for custom cleanup
   */
  async cleanup(): Promise<void> {
    // Default implementation - override in child classes
    console.log(`Service ${this.name} cleaned up`)
  }

  /**
   * Health check for the service
   * Override in child classes for specific health checks
   * @returns Promise with health status
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    return { healthy: true, message: `${this.name} service is healthy` }
  }

  /**
   * Validate input data using provided schema
   * @param data - Data to validate
   * @param schema - Validation schema (Zod schema)
   * @returns Validated data
   * @throws Error if validation fails
   */
  protected validate<T>(data: any, schema: any): T {
    try {
      return schema.parse(data)
    } catch (error: any) {
      throw new Error(`Validation failed: ${error.message}`)
    }
  }

  /**
   * Handle service errors consistently
   * @param error - Error that occurred
   * @param context - Additional context
   * @returns Formatted error
   */
  protected handleError(error: any, context?: string): Error {
    const errorMessage = error?.message || 'An unexpected error occurred'
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage
    
    console.error(`Service Error [${this.name}]:`, fullMessage, error)
    return new Error(fullMessage)
  }

  /**
   * Execute operation with retry logic
   * @param operation - Operation to execute
   * @param maxRetries - Maximum number of retries
   * @param delay - Delay between retries in milliseconds
   * @returns Promise with operation result
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.warn(`Service ${this.name} - Attempt ${attempt}/${maxRetries} failed:`, errorMessage)
        
        if (attempt < maxRetries) {
          await this.sleep(delay * attempt) // Exponential backoff
        }
      }
    }

    throw this.handleError(lastError, `Failed after ${maxRetries} attempts`)
  }

  /**
   * Execute operation with timeout
   * @param operation - Operation to execute
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise with operation result
   */
  protected async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    return Promise.race([operation(), timeoutPromise])
  }

  /**
   * Sleep for specified duration
   * @param ms - Duration in milliseconds
   * @returns Promise that resolves after delay
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Log service activity
   * @param level - Log level (info, warn, error)
   * @param message - Log message
   * @param data - Additional data to log
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${this.name}] ${message}`
    
    switch (level) {
      case 'info':
        console.log(logMessage, data || '')
        break
      case 'warn':
        console.warn(logMessage, data || '')
        break
      case 'error':
        console.error(logMessage, data || '')
        break
    }
  }

  /**
   * Create a service-specific error
   * @param message - Error message
   * @param code - Optional error code
   * @param cause - Original error cause
   * @returns Service error
   */
  protected createError(message: string, code?: string, cause?: any): Error {
    const error = new Error(`[${this.name}] ${message}`)
    if (code) {
      (error as any).code = code
    }
    if (cause) {
      (error as any).cause = cause
    }
    return error
  }
}
