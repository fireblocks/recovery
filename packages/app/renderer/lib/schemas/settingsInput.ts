import { z } from "zod";

export const settingsInput = z.object({
  relayBaseUrl: z.string().trim().url().describe("Recovery Relay base URL"),
  relayPassphrase: z.string().trim().describe("Recovery Relay passphrase"),
});
