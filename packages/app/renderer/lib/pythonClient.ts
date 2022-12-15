import { z } from "zod";
import { recoverKeysInput } from "./schemas";

export const pythonServerUrlParams = { server: "" };

if (typeof window !== "undefined") {
  const urlParams = new URLSearchParams(window.location.search);

  pythonServerUrlParams.server = urlParams.get("server") ?? "";
}

const request = async <T extends any>(path: string, init?: RequestInit) => {
  const res = await fetch(`${pythonServerUrlParams.server}${path}`, init);

  try {
    const data = (await res.json()) as T;

    if (res.ok) {
      return data;
    }

    throw new Error((data as { reason: string })?.reason ?? "Request failed");
  } catch (error) {
    console.error(error);

    throw new Error("Request failed");
  }
};

type ExtendedKeysResponse = {
  xprv: string;
  fprv: string;
  xpub: string;
  fpub: string;
};

export const getExtendedKeys = async () => {
  try {
    const keys = await request<ExtendedKeysResponse>(`/show-extended-keys`);

    return keys;
  } catch {
    throw new Error("Failed to get extended keys");
  }
};

export const recoverKeys = async (input: z.infer<typeof recoverKeysInput>) => {
  try {
    const keys = await request<ExtendedKeysResponse>(
      `/recover-keys?recover-prv=true`,
      {
        method: "POST",
        body: JSON.stringify({
          zip: input.zip,
          passphrase: input.passphrase,
          "rsa-key": input.rsaKey,
          "rsa-key-passphrase": input.rsaKeyPassphrase,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return keys;
  } catch {
    throw new Error("Key recovery failed");
  }
};
