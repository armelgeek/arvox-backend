/**
 * Framework configuration interface
 */
import type { AuthConfig } from './auth.type';

export interface FrameworkConfig {
  appName?: string;
  version?: string;
  description?: string;
  port?: number;
  environment?: 'development' | 'staging' | 'production';
  serverUrl?: string;

  // CORS configuration
  cors?: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  };

  // Logging configuration
  logging?: {
    requests?: boolean;
    errors?: boolean;
    level?: 'error' | 'warn' | 'info' | 'debug';
  };

  // Security configuration
  security?: {
    headers?: boolean;
    rateLimit?: {
      enabled: boolean;
      windowMs: number;
      max: number;
    };
  };

  // Swagger/OpenAPI configuration
  swagger?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    version?: string;
    path?: string;
  };

  // API Reference configuration (pour @scalar/hono-api-reference)
  apiReference?: {
    pageTitle?: string;
    theme?: 'deepSpace' | 'default' | 'purple' | 'bluePlanet' | 'saturn' | 'kepler' | 'mars' | 'moon';
    isEditable?: boolean;
    layout?: 'modern' | 'classic';
    darkMode?: boolean;
    url?: string;
    metaData?: {
      applicationName?: string;
      author?: string;
      creator?: string;
      publisher?: string;
      robots?: string;
      description?: string;
    };
  };

  // Authentication configuration
  auth?: AuthConfig;
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
