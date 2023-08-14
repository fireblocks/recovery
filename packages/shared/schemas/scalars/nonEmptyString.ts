import { z } from 'zod';

export const nonEmptyString = (message?: string | { message?: string }) => z.string().trim().min(1, message);
