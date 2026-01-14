import { z } from 'zod';

export const TimeRangeSchema = z.enum(['today', 'week', 'month', 'all']);
export const GranularitySchema = z.enum(['hour', 'day', 'week']);
