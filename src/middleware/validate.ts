/**
 * Zod validation middleware.
 * Wraps a Zod schema and validates req.body / req.query / req.params.
 * Returns structured 400 errors on failure.
 */
import { Request, Response, NextFunction } from 'express';
import { z, AnyZodObject, ZodError } from 'zod';

export function validate(schema: AnyZodObject) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    message: 'Validation failed',
                    errors: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            next(error);
        }
    };
}

// --- Common Validation Schemas ---

export const RegisterSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(100),
        email: z.string().email('Invalid email format').max(100),
        password: z.string().min(6, 'Password must be at least 6 characters').max(100),
        roomNumber: z.string().min(1, 'Room number is required').max(20),
    }),
});

export const LoginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const CreateBookingSchema = z.object({
    body: z.object({
        userId: z.string().uuid('Invalid user ID'),
        mealId: z.string().min(1, 'Meal ID is required'),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
        type: z.enum(['breakfast', 'lunch', 'dinner'], { message: 'Invalid meal type' }),
    }),
});

export const CreateFeedbackSchema = z.object({
    body: z.object({
        userId: z.string().uuid('Invalid user ID'),
        mealId: z.string().min(1, 'Meal ID is required'),
        rating: z.number().int().min(1).max(5, 'Rating must be 1-5'),
        comment: z.string().max(500).optional(),
    }),
});

export const UpdateUserSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        roomNumber: z.string().min(1).max(20),
        status: z.enum(['active', 'inactive']),
    }),
    params: z.object({
        id: z.string().uuid('Invalid user ID'),
    }),
});

export const ResetPasswordSchema = z.object({
    body: z.object({
        newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    }),
    params: z.object({
        id: z.string().uuid('Invalid user ID'),
    }),
});

export const UpdateBookingStatusSchema = z.object({
    body: z.object({
        status: z.enum(['booked', 'consumed', 'cancelled'], { message: 'Invalid status' }),
    }),
    params: z.object({
        id: z.string().uuid('Invalid booking ID'),
    }),
});

export const RateMealSchema = z.object({
    body: z.object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(500).optional(),
    }),
    params: z.object({
        id: z.string().uuid('Invalid booking ID'),
    }),
});

export const VerifyQRSchema = z.object({
    body: z.object({
        qrCode: z.string().min(1, 'QR code is required'),
    }),
});
