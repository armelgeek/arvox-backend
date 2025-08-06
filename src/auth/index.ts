// Export all auth-related components
export { AuthService } from './auth-service';
export { AuthController, AuthModuleFactory } from './auth-controller';

// Re-export types
export type {
  AuthConfig,
  AuthContext,
  AuthMiddleware,
  DrizzleGeneratorConfig,
  AuthUtils,
} from '../types/auth.type';

export type {
  DrizzleDB,
  DatabaseConfig,
  User,
  Session,
  Account,
  VerificationToken,
} from '../types/database.type';
