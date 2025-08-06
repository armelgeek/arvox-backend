import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create the connection
const connection = postgres('postgresql://user:password@localhost:5432/myapp');

// Create the database instance
export const db = drizzle(connection, { schema });

export type Database = typeof db;
export { schema };