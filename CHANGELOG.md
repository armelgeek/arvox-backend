# Changelog

# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2024-08-05

### ✨ Added
- **Route Simplification**: 3 nouvelles approches pour créer des routes avec 60-70% moins de code
- **BaseController Extensions**: Méthodes simplifiées `createPostRoute`, `createListRoute`, `createGetByIdRoute`, `createPutRoute`, `createDeleteRoute`
- **Route Utilities**: Classe `Route` avec méthodes statiques pour une syntaxe encore plus simple
- **CLI Tool**: `create-arvox-app` pour scaffolder de nouveaux projets
- **Project Templates**: Templates préconfigurés avec architecture hexagonale
- **Examples**: Exemples complets montrant les différentes approches
- **Package Rename**: Migration de `@arvox/backend-framework` vers `arvox-backend`

### 🚀 Improved
- **Developer Experience**: Réduction drastique de la verbosité du code
- **Documentation**: README complet avec comparaisons et guides
- **Architecture**: Structure de projet optimisée générée par le CLI

### 🔧 Fixed
- **ESLint Configuration**: Migration vers ESLint v9 avec `eslint.config.js`
- **Code Quality**: Correction de tous les problèmes de linting et formatage
- **TypeScript**: Correction des erreurs de syntaxe et types manquants
- **Dependencies**: Ajout des dépendances ESLint manquantes

### 📦 CLI Features
- Support multi-package managers (npm, bun, pnpm)
- Templates TypeScript prêts à l'emploi
- Contrôleur Health préconfiguré
- Configuration hot-reload avec tsx
- Documentation OpenAPI automatique

### 🔧 Technical
- ESM modules support dans le CLI
- TypeScript strict configuration
- Zod validation intégrée
- OpenAPI documentation automatique
- Configuration ESLint moderne v9## [1.0.0] - 2024-08-01

### ✨ Initial Release
- Framework backend basé sur Hono
- Architecture hexagonale
- Support OpenAPI avec Zod
- Base controllers, services, repositories
- Validation et gestion d'erreurs

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-05

### Added

#### Core Framework
- **ArvoxFramework** - Main framework class with module and service orchestration
- **BaseUseCase** - Abstract base class for implementing use cases with error handling
- **BaseController** - Base controller with OpenAPI integration and common HTTP utilities
- **BaseRepository** - Generic repository base class with CRUD operations
- **BaseService** - Base service class with common business logic patterns

#### Interfaces
- **IUseCase** - Interface for use case implementations
- **IController** - Interface for controller implementations  
- **IRepository** - Generic repository interface with CRUD methods
- **IService** - Interface for service implementations
- **IModule** - Interface for modular application components

#### Type System
- **FrameworkConfig** - Complete configuration type definitions
- **ResponseTypes** - Standardized API response type definitions
- **PaginationType** - Pagination-related type definitions
- **ActivityType** - Enumeration for logging and activity tracking

#### Utilities
- **ResponseUtil** - Utility for creating standardized API responses
- **PaginationUtil** - Complete pagination handling with metadata and links
- **ValidationUtil** - Common validation schemas and utilities using Zod

#### Features
- **OpenAPI Integration** - Automatic API documentation with Swagger UI
- **Module System** - Pluggable architecture with module registration
- **Service Management** - Service lifecycle management with health checks
- **Error Handling** - Comprehensive error handling with proper HTTP status codes
- **CORS Support** - Configurable Cross-Origin Resource Sharing
- **Request Logging** - Optional request/response logging middleware
- **Security Headers** - Built-in security headers for protection
- **Health Checks** - Framework and service health monitoring
- **Graceful Shutdown** - Proper cleanup on application termination

#### Documentation
- **Complete README** - Comprehensive usage guide with examples
- **API Examples** - Real-world implementation examples
- **TypeScript Support** - Full type definitions and IntelliSense
- **Architecture Guide** - Hexagonal architecture implementation details

### Technical Details

#### Dependencies
- **@hono/zod-openapi** - OpenAPI integration for Hono
- **@hono/node-server** - Node.js server adapter
- **@hono/swagger-ui** - Swagger UI integration
- **zod** - Runtime type validation and schema definition

#### Architecture
- **Hexagonal Architecture** - Clean separation of concerns
- **Dependency Injection** - Constructor-based dependency injection
- **Type Safety** - Full TypeScript support with strict typing
- **Modular Design** - Plugin-based architecture for extensibility

#### Performance
- **Hono Framework** - High-performance HTTP framework
- **Optimized Routing** - Efficient route matching and handling
- **Minimal Dependencies** - Lightweight framework with essential features only

This initial release provides a complete foundation for building modern, scalable backend applications with clean architecture principles.
