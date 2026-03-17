/**
 * Structured logger using Pino.
 * - Development: pretty-printed with colors
 * - Production: JSON lines for log aggregation
 * - Automatically redacts sensitive fields (passwords, tokens)
 */
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    redact: {
        paths: [
            'req.headers.authorization',
            'password',
            'newPassword',
            'req.body.password',
            'req.body.newPassword',
        ],
        censor: '[REDACTED]',
    },
    ...(isProduction
        ? {}
        : {
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:HH:MM:ss',
                    ignore: 'pid,hostname',
                },
            },
        }),
});

/**
 * Express request logger middleware (Pino-HTTP).
 * Automatically logs request/response details.
 */
export function createRequestLogger() {
    // Dynamic import to avoid issues in non-server contexts
    return async () => {
        const pinoHttp = (await import('pino-http')).default;
        return pinoHttp({
            logger,
            autoLogging: {
                ignore: (req: any) => {
                    // Skip logging for health checks and favicon
                    return req.url === '/api/health' || req.url === '/favicon.ico';
                },
            },
            customLogLevel: (_req: any, res: any, err: any) => {
                if (res.statusCode >= 500 || err) return 'error';
                if (res.statusCode >= 400) return 'warn';
                return 'info';
            },
            serializers: {
                req: (req: any) => ({
                    method: req.method,
                    url: req.url,
                    ...(req.body && Object.keys(req.body).length > 0
                        ? { body: req.body }
                        : {}),
                }),
                res: (res: any) => ({
                    statusCode: res.statusCode,
                }),
            },
        });
    };
}
