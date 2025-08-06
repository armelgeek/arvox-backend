import type { Config } from 'drizzle-kit';

export default {
  schema: 'db/schema.ts',
  out: 'db/migrations',
  driver: 'postgresql',
  dbCredentials: {
    connectionString: 'postgresql://user:password@localhost:5432/myapp'
  },
  verbose: true,
  strict: true,
} satisfies Config;