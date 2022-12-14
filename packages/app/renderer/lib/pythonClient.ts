import { z } from "zod";
import { recoverKeysInput } from "./schemas";

export const pythonServerUrlParams = { server: "" };

if (typeof window !== "undefined") {
  const urlParams = new URLSearchParams(window.location.search);

  pythonServerUrlParams.server = urlParams.get("server") ?? "";
}

const request = async <T extends Record<any, any>>(
  path: string,
  init?: RequestInit
) => {
  const res = await fetch(`${pythonServerUrlParams.server}${path}`, init);

  const data = (await res.json()) as T;

  return data;
};

type ExtendedKeysResponse = {
  xprv: string;
  fprv: string;
  xpub: string;
  fpub: string;
};

export const getExtendedKeys = async () => {
  const keys = await request<ExtendedKeysResponse>(`/show-extended-keys`);

  return keys;
};

export const recoverKeys = async (input: z.infer<typeof recoverKeysInput>) => {
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
};
