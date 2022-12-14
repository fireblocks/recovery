import { z } from "zod";

export const settingsInput = z.object({
  relayBaseUrl: z
    .string()
    .trim()
    .url()
    .min(1)
    .describe("Recovery Relay base URL"),
});
