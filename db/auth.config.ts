import type { AuthConfig } from 'arvox-backend';

export const authConfig: AuthConfig = {
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key-here',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  trustedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
  
  database: {
    provider: 'postgresql', // ou 'mysql', 'sqlite'
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 1 jour
  },
};