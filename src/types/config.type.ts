/**
 * Framework configuration interface
 */
export interface FrameworkConfig {
  appName?: string
  version?: string
  description?: string
  port?: number
  environment?: 'development' | 'production' | 'test'
  serverUrl?: string

  // CORS configuration
  cors?: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
    credentials?: boolean
  }

  // Logging configuration
  logging?: {
    requests?: boolean
    errors?: boolean
    level?: 'debug' | 'info' | 'warn' | 'error'
  }

  // Security configuration
  security?: {
    headers?: boolean
    rateLimiting?: boolean
    helmet?: boolean
  }

  // Database configuration
  database?: {
    url?: string
    host?: string
    port?: number
    name?: string
    user?: string
    password?: string
  }

  // Swagger/OpenAPI configuration
  swagger?: {
    enabled?: boolean
    path?: string
    title?: string
    description?: string
    version?: string
  }

  // Custom configuration
  [key: string]: any
}

/**
 * Module configuration interface
 */
export interface ModuleConfig {
  name: string
  enabled: boolean
  priority?: number
  dependencies?: string[]
  config?: Record<string, any>
}

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  name: string
  enabled: boolean
  config?: Record<string, any>
}
