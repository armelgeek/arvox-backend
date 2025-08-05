import { OpenAPIHono } from '@hono/zod-openapi';
import { serve } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui';
// @ts-ignore: apiReference peut être importé dynamiquement si besoin
// import { apiReference } from 'some-swagger-ui-lib';
import { IModule } from '../interfaces/module.interface';
import { IService } from '../interfaces/service.interface';
import { FrameworkConfig } from '../types/config.type';
import { defaultOpenAPIConfig, OpenAPIConfig } from './openapi-config';

/**
 * Main framework class that orchestrates the entire application
 * Handles module registration, service initialization, and server setup
 */
export class ArvoxFramework {
  private app: OpenAPIHono;
  private modules: Map<string, IModule> = new Map();
  private services: Map<string, IService> = new Map();
  private config: FrameworkConfig;
  private isInitialized: boolean = false;

  constructor(config: FrameworkConfig) {
    this.config = config;
    this.app = new OpenAPIHono();
  // this.setupOpenAPI();
  this.initializeSwaggerUI();
  }

  /**
   * Configure OpenAPI documentation
   */
  /**
   * Setup OpenAPI 3.1 doc and Swagger UI (ou apiReference) inspiré de l'exemple fourni
   */
  private initializeSwaggerUI(): void {
    // OpenAPI 3.1 doc route
    this.app.doc31('/swagger', () => {
      const protocol = 'https:';
      const hostname = process.env.NODE_ENV === 'production' ? 'dev-api.meko.ac' : 'localhost';
      const port = process.env.NODE_ENV === 'production' ? '' : '3000';
      return {
        openapi: '3.1.0',
        info: {
          version: this.config.version || '1.0.0',
          title: this.config.appName || 'Arvox Backend API',
          description: this.config.description || 'API built with Arvox Framework'
        },
        servers: [
          { url: `${protocol}//${hostname}${port ? `:${port}` : ''}`, description: 'Current environment' }
        ]
      };
    });

    // Swagger UI (classique) sur /docs
    this.app.get('/docs', swaggerUI({ url: '/swagger' }));

    // Si tu veux utiliser apiReference à la place, décommente et adapte :
    /*
    this.app.get(
      '/docs',
      apiReference({
        pageTitle: 'Arvox API Documentation',
        theme: 'deepSpace',
        isEditable: false,
        layout: 'modern',
        darkMode: true,
        metaData: {
          applicationName: 'Arvox API',
          author: 'Arvox',
          creator: 'Arvox',
          publisher: 'Arvox',
          robots: 'index, follow',
          description: 'Arvox API is ...'
        },
        url: process.env.NODE_ENV === 'production' ? 'https://dev-api.meko.ac/swagger' : 'http://localhost:3000/swagger'
      })
    );
    */
  }

  /**
   * Register a module with the framework
   * @param module - Module to register
   * @returns Framework instance for chaining
   */
  registerModule(module: IModule): ArvoxFramework {
    if (this.isInitialized) {
      throw new Error('Cannot register modules after framework initialization');
    }

    const moduleName = module.getName();
    
    if (this.modules.has(moduleName)) {
      throw new Error(`Module '${moduleName}' is already registered`);
    }

    this.modules.set(moduleName, module);
    console.log(`Module '${moduleName}' registered`);
    
    return this;
  }

  /**
   * Register a service with the framework
   * @param service - Service to register
   * @returns Framework instance for chaining
   */
  registerService(service: IService): ArvoxFramework {
    if (this.isInitialized) {
      throw new Error('Cannot register services after framework initialization');
    }

    const serviceName = service.getName();
    
    if (this.services.has(serviceName)) {
      throw new Error(`Service '${serviceName}' is already registered`);
    }

    this.services.set(serviceName, service);
    console.log(`Service '${serviceName}' registered`);
    
    return this;
  }

  /**
   * Get a registered service by name
   * @param name - Service name
   * @returns Service instance or undefined
   */
  getService<T extends IService>(name: string): T | undefined {
    return this.services.get(name) as T;
  }

  /**
   * Get a registered module by name
   * @param name - Module name
   * @returns Module instance or undefined
   */
  getModule<T extends IModule>(name: string): T | undefined {
    return this.modules.get(name) as T;
  }

  /**
   * Initialize all registered services and modules
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Framework is already initialized');
    }

    console.log('Initializing Arvox Framework...');

    // Initialize services first
    console.log(`Initializing ${this.services.size} services...`);
    for (const [name, service] of this.services) {
      try {
        await service.initialize();
        console.log(`✓ Service '${name}' initialized`);
      } catch (error) {
        console.error(`✗ Failed to initialize service '${name}':`, error);
        throw error;
      }
    }

    // Initialize modules
    console.log(`Initializing ${this.modules.size} modules...`);
    for (const [name, module] of this.modules) {
      try {
        await module.initialize();
        console.log(`✓ Module '${name}' initialized`);
      } catch (error) {
        console.error(`✗ Failed to initialize module '${name}':`, error);
        throw error;
      }
    }

    // Register module routes
    console.log('Registering module routes...');
    for (const [name, module] of this.modules) {
      try {
        module.registerRoutes(this.app);
        console.log(`✓ Routes for module '${name}' registered`);
      } catch (error) {
        console.error(`✗ Failed to register routes for module '${name}':`, error);
        throw error;
      }
    }

    // Setup global middleware
    this.setupGlobalMiddleware();

    // Setup error handling
    this.setupErrorHandling();

    this.isInitialized = true;
    console.log('✓ Arvox Framework initialization complete');
  }

  /**
   * Setup global middleware
   */
  private setupGlobalMiddleware(): void {
    // CORS middleware
    if (this.config.cors) {
      this.app.use('*', async (c, next) => {
        const origin = Array.isArray(this.config.cors?.origin) 
          ? this.config.cors.origin.join(',') 
          : this.config.cors?.origin || '*';
        
        c.header('Access-Control-Allow-Origin', origin);
        c.header('Access-Control-Allow-Methods', this.config.cors?.methods?.join(',') || 'GET,POST,PUT,DELETE,OPTIONS');
        c.header('Access-Control-Allow-Headers', this.config.cors?.headers?.join(',') || 'Content-Type,Authorization');
        
        if (c.req.method === 'OPTIONS') {
          return c.text('', 200);
        }
        
        await next();
      });
    }

    // Request logging middleware
    if (this.config.logging?.requests) {
      this.app.use('*', async (c, next) => {
        const start = Date.now();
        await next();
        const duration = Date.now() - start;
        console.log(`${c.req.method} ${c.req.url} - ${c.res.status} (${duration}ms)`);
      });
    }

    // Security headers
    if (this.config.security?.headers) {
      this.app.use('*', async (c, next) => {
        c.header('X-Content-Type-Options', 'nosniff');
        c.header('X-Frame-Options', 'DENY');
        c.header('X-XSS-Protection', '1; mode=block');
        await next();
      });
    }
  }

  /**
   * Setup global error handling
   */
  private setupErrorHandling(): void {
    this.app.onError((error, c) => {
      console.error('Unhandled error:', error);
      
      // Log error details if logging is enabled
      if (this.config.logging?.errors) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          url: c.req.url,
          method: c.req.method,
          timestamp: new Date().toISOString()
        });
      }

      // Return appropriate error response
      const isDevelopment = this.config.environment === 'development';
      
      return c.json({
        success: false,
        error: isDevelopment ? error.message : 'Internal server error',
        ...(isDevelopment && { stack: error.stack })
      }, 500);
    });

    this.app.notFound((c) => {
      return c.json({
        success: false,
        error: 'Route not found'
      }, 404);
    });
  }

  /**
   * Start the HTTP server
   * @returns Promise that resolves when server is ready
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const port = this.config.port || 3000;
    
    return new Promise((resolve) => {
      serve({
        fetch: this.app.fetch,
        port
      });
      
      console.log(`🚀 Arvox Framework server started on port ${port}`);
      console.log(`📚 API Documentation available at http://localhost:${port}/docs`);
      console.log(`📋 OpenAPI spec available at http://localhost:${port}/openapi.json`);
      
      resolve();
    });
  }

  /**
   * Gracefully shutdown the framework
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Arvox Framework...');

    // Cleanup modules
    for (const [name, module] of this.modules) {
      try {
        if (typeof module.cleanup === 'function') {
          await module.cleanup();
          console.log(`✓ Module '${name}' cleaned up`);
        }
      } catch (error) {
        console.error(`✗ Failed to cleanup module '${name}':`, error);
      }
    }

    // Cleanup services
    for (const [name, service] of this.services) {
      try {
        await service.cleanup();
        console.log(`✓ Service '${name}' cleaned up`);
      } catch (error) {
        console.error(`✗ Failed to cleanup service '${name}':`, error);
      }
    }

    console.log('✓ Arvox Framework shutdown complete');
  }

  /**
   * Get health status of all services and modules
   * @returns Health check results
   */
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy'
    services: { [name: string]: { healthy: boolean; message?: string } }
    modules: { [name: string]: { healthy: boolean; message?: string } }
  }> {
    const serviceHealth: { [name: string]: { healthy: boolean; message?: string } } = {};
    const moduleHealth: { [name: string]: { healthy: boolean; message?: string } } = {};

    // Check services
    for (const [name, service] of this.services) {
      try {
        serviceHealth[name] = await service.healthCheck();
      } catch (error) {
        serviceHealth[name] = { 
          healthy: false, 
          message: error instanceof Error ? error.message : 'Health check failed' 
        };
      }
    }

    // Check modules
    for (const [name, module] of this.modules) {
      try {
        if (typeof module.healthCheck === 'function') {
          moduleHealth[name] = await module.healthCheck();
        } else {
          moduleHealth[name] = { healthy: true, message: 'No health check implemented' };
        }
      } catch (error) {
        moduleHealth[name] = { 
          healthy: false, 
          message: error instanceof Error ? error.message : 'Health check failed' 
        };
      }
    }

    // Determine overall health
    const allHealthy = Object.values(serviceHealth).every(h => h.healthy) && 
                      Object.values(moduleHealth).every(h => h.healthy);
    const someUnhealthy = Object.values(serviceHealth).some(h => !h.healthy) || 
                         Object.values(moduleHealth).some(h => !h.healthy);

    const overall = allHealthy ? 'healthy' : someUnhealthy ? 'degraded' : 'unhealthy';

    return {
      overall,
      services: serviceHealth,
      modules: moduleHealth
    };
  }

  /**
   * Get the underlying Hono app instance
   * @returns Hono app instance
   */
  getApp(): OpenAPIHono {
    return this.app;
  }

  /**
   * Get framework configuration
   * @returns Framework configuration
   */
  getConfig(): FrameworkConfig {
    return this.config;
  }

  /**
   * Configure OpenAPI documentation with advanced settings
   * @param customConfig - Custom OpenAPI configuration
   */
  configureOpenAPI(customConfig?: Partial<OpenAPIConfig>): void {
    const config = { ...defaultOpenAPIConfig, ...customConfig };
    
    // Merge with framework config if provided
    if (this.config.swagger) {
      config.title = this.config.swagger.title || config.title;
      config.description = this.config.swagger.description || config.description;  
      config.version = this.config.swagger.version || config.version;
    }

    // Update OpenAPI documentation
    this.app.doc('/openapi.json', {
      openapi: '3.0.0',
      info: {
        title: config.title || this.config.appName || 'Arvox Backend API',
        version: config.version || this.config.version || '1.0.0',
        description: config.description || 'API built with Arvox Framework',
        contact: config.contact,
        license: config.license
      },
      servers: config.servers || [
        {
          url: this.config.serverUrl || `http://localhost:${this.config.port || 3000}`,
          description: this.config.environment || 'Development server'
        }
      ],
      tags: config.tags,
      security: config.security
    });

    // Add enhanced Swagger UI
    this.app.get('/docs', swaggerUI({ 
      url: '/openapi.json',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }));

    // Add additional documentation endpoints
    this.setupAdditionalDocs();
  }

  /**
   * Setup additional documentation endpoints
   */
  private setupAdditionalDocs(): void {
    // Health check endpoint avec documentation
    this.app.openapi({
      method: 'get',
      path: '/health',
      tags: ['Health'],
      summary: 'Health check',
      description: 'Vérifier l\'état de santé de l\'API et de ses services',
      responses: {
        200: {
          description: 'API en bonne santé',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  overall: {
                    type: 'string',
                    enum: ['healthy', 'degraded', 'unhealthy'],
                    example: 'healthy'
                  },
                  services: {
                    type: 'object',
                    additionalProperties: {
                      type: 'object',
                      properties: {
                        healthy: { type: 'boolean' },
                        message: { type: 'string' }
                      }
                    }
                  },
                  modules: {
                    type: 'object',
                    additionalProperties: {
                      type: 'object',
                      properties: {
                        healthy: { type: 'boolean' },
                        message: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }, async (c) => {
      const health = await this.getHealthStatus();
      return c.json(health);
    });

    // Endpoint pour les informations de l'API
    this.app.openapi({
      method: 'get',
      path: '/info',
      tags: ['Health'],
      summary: 'API Information',
      description: 'Informations sur l\'API et le framework',
      responses: {
        200: {
          description: 'Informations de l\'API',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  version: { type: 'string' },
                  framework: { type: 'string' },
                  frameworkVersion: { type: 'string' },
                  environment: { type: 'string' },
                  uptime: { type: 'number' },
                  timestamp: { type: 'string', format: 'date-time' },
                  modules: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  services: {
                    type: 'array', 
                    items: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }, async (c) => {
      return c.json({
        name: this.config.appName || 'Arvox API',
        version: this.config.version || '1.0.0',
  framework: 'arvox-backend',
        frameworkVersion: '1.0.0',
        environment: this.config.environment || 'development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        modules: Array.from(this.modules.keys()),
        services: Array.from(this.services.keys())
      });
    });

    // Documentation alternative en JSON pour les développeurs
    this.app.get('/docs/json', async (c) => {
      return c.json({
        documentation: {
          swagger: '/docs',
          openapi: '/openapi.json',
          health: '/health',
          info: '/info'
        },
        endpoints: {
          framework: [
            'GET /health - Health check',
            'GET /info - API information',
            'GET /docs - Swagger UI documentation',
            'GET /openapi.json - OpenAPI specification'
          ]
        },
        examples: {
          pagination: {
            query: '?page=1&limit=10&search=term&sort=-createdAt',
            response: {
              success: true,
              data: {
                items: ['...'],
                pagination: {
                  total: 100,
                  page: 1,
                  limit: 10,
                  totalPages: 10,
                  hasNext: true,
                  hasPrev: false
                }
              }
            }
          },
          authentication: {
            header: 'Authorization: Bearer <your-token>',
            apiKey: 'X-API-Key: <your-api-key>'
          }
        }
      });
    });
  }
}
