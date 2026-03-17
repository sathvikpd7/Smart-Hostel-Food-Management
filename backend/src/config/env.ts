/**
 * Validated environment configuration using Zod.
 * Fails fast on startup if required env vars are missing.
 */
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const EnvSchema = z.object({
    // Database
    DATABASE_URL: z.string().optional(),
    POSTGRES_USER: z.string().optional(),
    POSTGRES_PASSWORD: z.string().optional(),
    POSTGRES_HOST: z.string().optional(),
    POSTGRES_PORT: z.coerce.number().default(5432),
    POSTGRES_DB: z.string().optional(),

    // Server
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CORS_ORIGIN: z.string().optional(),
    CORS_ORIGINS: z.string().optional(),

    // Auth
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    QR_SIGNING_SECRET: z.string().optional(),

    // Admin
    ADMIN_EMAIL: z.string().default('admin@hostel.com'),
    ADMIN_PASSWORD: z.string().default('admin123'),

    // AI
    GROQ_API_KEY: z.string().optional(),
    GROQ_MODEL: z.string().default('llama-3.1-8b-instant'),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default('gpt-4-mini'),

    // Debug
    DEBUG_DB: z.string().default('false'),
});

function loadEnv() {
    const isProduction = process.env.NODE_ENV === 'production';

    // In development, allow fallback for JWT_SECRET
    if (!process.env.JWT_SECRET && !isProduction) {
        process.env.JWT_SECRET = 'dev-secret';
        console.warn('⚠️  JWT_SECRET not set; using insecure dev secret');
    }

    const result = EnvSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Invalid environment configuration:');
        result.error.issues.forEach((issue) => {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
        });
        process.exit(1);
    }

    return result.data;
}

export const env = loadEnv();
export const isProduction = env.NODE_ENV === 'production';
