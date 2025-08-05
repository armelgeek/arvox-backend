import { IUseCase } from '../interfaces/use-case.interface'
import { ActivityType } from '../types'

/**
 * Base class for all use cases following the command pattern
 * Provides common functionality like logging, error handling, and validation
 */
export abstract class BaseUseCase<TParams, TResponse> implements IUseCase<TParams, TResponse> {
  /**
   * Execute the use case logic
   * @param params - Input parameters for the use case
   * @returns Promise containing the response
   */
  abstract execute(params: TParams): Promise<TResponse>

  /**
   * Define the activity type for logging purposes
   * @returns ActivityType enum value
   */
  abstract log(): ActivityType

  /**
   * Validate input parameters before execution
   * Override this method to add custom validation logic
   * @param params - Parameters to validate
   * @throws Error if validation fails
   */
  protected async validate(params: TParams): Promise<void> {
    // Default validation - override in child classes
    if (params === null || params === undefined) {
      throw new Error('Parameters cannot be null or undefined')
    }
  }

  /**
   * Handle errors in a consistent way across all use cases
   * @param error - The error that occurred
   * @param context - Additional context about the error
   * @returns Formatted error response
   */
  protected handleError(error: any, context?: string): { success: false; error: string } {
    const errorMessage = error?.message || 'An unexpected error occurred'
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage
    
    // Log the error for debugging
    console.error(`UseCase Error [${this.constructor.name}]:`, fullMessage, error)
    
    return {
      success: false,
      error: fullMessage
    }
  }

  /**
   * Create a successful response
   * @param data - The data to return
   * @returns Formatted success response
   */
  protected createSuccessResponse<T>(data: T): { success: true; data: T } {
    return {
      success: true,
      data
    }
  }

  /**
   * Execute the use case with automatic validation and error handling
   * @param params - Input parameters
   * @returns Promise containing the response
   */
  async run(params: TParams): Promise<TResponse> {
    try {
      await this.validate(params)
      return await this.execute(params)
    } catch (error) {
      return this.handleError(error) as TResponse
    }
  }
}
