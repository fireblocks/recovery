import { z } from 'zod';

export const settingsInput = {
  RELAY: z.object({
    RPCs: z.record(
      z.string(),
      z
        .object({
          name: z.string().min(1),
          url: z.string().nullish(),
          enabled: z.boolean().default(true),
          allowedEmptyValue: z.oboolean().default(false),
          apiKey: z.string().nullish(),
          requiresApiKey: z.boolean().default(false).optional(),
        })
        .refine(
          (values) =>
            !values.enabled ||
            (values.enabled && values.url !== undefined && values.url !== null && values.url !== '') ||
            (values.enabled && values.allowedEmptyValue),
          'Must provide a URL',
        ),
    ),
  }),
  UTILITY: z.object({
    idleMinutes: z.number().int().positive().describe('Number of idle minutes before resetting'),
    relayBaseUrl: z.string().trim().url().min(1, 'URL is required').describe('Recovery Relay base URL'),
  }),
};

export type UtilitySettingsInput = z.infer<(typeof settingsInput)['UTILITY']>;
export type RelaySettingsInput = z.infer<(typeof settingsInput)['RELAY']>;
