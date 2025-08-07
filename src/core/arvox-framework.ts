import { OpenAPIHono } from '@hono/zod-openapi';
import { serve } from '@hono/node-server';
// import { swaggerUI } from '@hono/swagger-ui';
import { apiReference } from '@scalar/hono-api-reference';
import { IModule } from '../interfaces/module.interface';
import { IService } from '../interfaces/service.interface';
import { FrameworkConfig } from '../types/config.type';
// import { defaultOpenAPIConfig, OpenAPIConfig } from './openapi-config';

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
    this.initializeSwaggerUI();

    // Route landing page / (Home)
    this.app.get('/', (c) => {
      const title = this.config.appName || 'API Arvox';
      const description =
        this.config.description ||
        'L\'API offre un accès complet aux fonctionnalités de la plateforme, permettant une intégration simple et efficace de nos services.';
      return c.html(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${title}</title>
          <meta name="description" content="${description}" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:title" content="${title}" />
          <meta property="twitter:description" content="${description}" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            * { font-family: 'Lexend', sans-serif; }
            @keyframes borderAnimation {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            @keyframes meteorAnimation {
              0% { transform: rotate(215deg) translateX(0); opacity: 1; }
              70% { opacity: 1; }
              100% { transform: rotate(215deg) translateX(-500px); opacity: 0; }
            }
            .meteor::before {
              content: '';
              position: absolute;
              top: 50%;
              transform: translateY(-50%);
              width: 50px;
              height: 1px;
              background: linear-gradient(90deg, #64748b, transparent);
            }
            .animate-meteor-effect {
              animation-name: meteorAnimation;
            }
          </style>
        </head>
        <body class="bg-black mx-auto md:min-h-screen max-w-screen-lg flex flex-col">
          <main class="mx-auto my-auto flex flex-col space-y-8 px-4 pb-8 md:py-10 relative overflow-y-hidden overflow-x-hidden">
            <div id="meteors"></div>
            <div class="flex flex-row items-center space-x-4 ml-6">
              <svg class="sm:h-12 sm:w-12 h-8 w-8 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="#7EDAFD" d="M3.172 3.464C2 4.93 2 7.286 2 12c0 4.714 0 7.071 1.172 8.535C4.343 22 6.229 22 10 22h3.376A4.25 4.25 0 0 1 17 16.007V12.25a2.25 2.25 0 0 1 4.5 0a.75.75 0 0 0 .5.707V12c0-4.714 0-7.071-1.172-8.536C19.657 2 17.771 2 14 2h-4C6.229 2 4.343 2 3.172 3.464" opacity=".5" />
              </svg>
              <p class="text-2xl md:text-4xl text-transparent font-bold leading-none bg-clip-text bg-gradient-to-r from-[#7EDAFD] to-blue-600">
                ${title}
              </p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-0 relative grid-flow-row">
              <a target="_blank" class="p-4 sm:p-8 hover:bg-opacity-5 hover:bg-white rounded-lg duration-100 sm:col-span-4" href="/docs">
                <div class="flex flex-col">
                  <span class="text-xs uppercase bg-opacity-15 rounded text-center max-w-fit px-2 py-1 font-bold tracking-wide bg-blue-500 text-blue-500">
                    Documentation
                  </span>
                  <span class="text-neutral-200 font-bold text-lg sm:text-xl md:text-2xl mt-2">API ${title}</span>
                  <div class="text-neutral-500 mt-2">
                    Découvrez la documentation pour apprendre à intégrer et tirer parti des services proposés.
                  </div>
                </div>
              </a>
              <a target="_blank" class="p-4 sm:p-8 hover:bg-opacity-5 hover:bg-white rounded-lg duration-100 sm:col-span-4" href="/api/auth/reference">
                <div class="flex flex-col">
                  <span class="text-xs uppercase bg-opacity-15 rounded text-center max-w-fit px-2 py-1 font-bold tracking-wide bg-green-500 text-green-500">
                    Authentification
                  </span>
                  <span class="text-neutral-200 font-bold text-lg sm:text-xl md:text-2xl mt-2">Gestion des utilisateurs</span>
                  <div class="text-neutral-500 mt-2">
                    Découvrez notre système d'authentification avec des guides d'implémentation et une référence API complète.
                  </div>
                </div>
              </a>
            </div>
          </main>
          <script>
            // Génère les météores dynamiquement
            const meteors = document.getElementById('meteors');
            for (let i = 0; i < 15; i++) {
              const span = document.createElement('span');
              span.className = 'meteor animate-[meteorAnimation_3s_linear_infinite] absolute h-1 w-1 rounded-[9999px] shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]';
              span.style.top = '0';
              span.style.left = '" + (Math.floor(Math.random() * (400 - -400) + -400)) + "px';
              span.style.animationDelay = '" + (Math.random() * (0.8 - 0.2) + 0.2) + "s';
              span.style.animationDuration = '" + (Math.floor(Math.random() * (10 - 2) + 2)) + "s';
              meteors.appendChild(span);
            }
          </script>
        </body>
        </html>
      `);
    });
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

    // Configuration dynamique pour apiReference
    const apiRefConfig = {
      pageTitle: this.config.apiReference?.pageTitle || 'Arvox API Documentation',
      theme: this.config.apiReference?.theme || 'deepSpace',
      isEditable: this.config.apiReference?.isEditable ?? false,
      layout: this.config.apiReference?.layout || 'modern',
      darkMode: this.config.apiReference?.darkMode ?? true,
      metaData: {
        applicationName: this.config.apiReference?.metaData?.applicationName || 'Arvox API',
        author: this.config.apiReference?.metaData?.author || 'Arvox',
        creator: this.config.apiReference?.metaData?.creator || 'Arvox',
        publisher: this.config.apiReference?.metaData?.publisher || 'Arvox',
        robots: this.config.apiReference?.metaData?.robots || 'index, follow',
        description: this.config.apiReference?.metaData?.description || 'Arvox API is ...'
      },
      url: this.config.apiReference?.url || (process.env.NODE_ENV === 'production' ? 'https://api.arvox.dev/swagger' : 'http://localhost:3000/swagger')
    };
    this.app.get('/docs', apiReference(apiRefConfig));

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
    if (!this.config.router) {
      this.app.basePath('/api').route('/', this.config.router);
    }

    // Setup global middleware
    this.setupGlobalMiddleware();

    // Setup error handling

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
